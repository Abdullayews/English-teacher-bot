import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import https from 'https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from './db.js';

// CONFIG
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = parseInt(process.env.ADMIN_TELEGRAM_ID);
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
const PORT = process.env.PORT || 3000;

// INIT
const app = express();
app.use(express.json());
const bot = new TelegramBot(BOT_TOKEN, { webHook: true });
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

// KEYBOARDS
const mainMenu = {
  reply_markup: {
    keyboard: [
      ['📚 Söz Öyrən', '📝 Sözlər Quiz'],
      ['📖 Qayda Öyrən', '❓ Qayda Quiz'],
      ['🎓 Ümumi İmtahan', '⚙️ Səviyyə Seç'],
      ['⭐ Favorilər', '❌ Səhv Cavablar'],
      ['📊 Hesabat', '🏆 Liderlər'],
      ['🔔 Günün Sözü', '🤖 AI İzah'],
      ['🔍 Axtarış']
    ], resize_keyboard: true
  }
};

const adminMenu = {
  reply_markup: {
    keyboard: [
      ['➕ Söz Əlavə Et', '➕ Qayda Əlavə Et'],
      ['➕ Sual Əlavə Et', '📈 Bot Statistikası'],
      ['🏠 Ana Menyu']
    ], resize_keyboard: true
  }
};

// DB HELPERS
async function getUserState(userId) {
  const [rows] = await pool.query('SELECT * FROM user_states WHERE user_id = ?', [userId]);
  if (rows.length === 0) {
    await pool.query('INSERT INTO user_states (user_id, state) VALUES (?, ?)', [userId, 'idle']);
    return { state: 'idle', state_data: null };
  }
  return rows[0];
}

async function setUserState(userId, state, data = null) {
  await pool.query(
    'INSERT INTO user_states (user_id, state, state_data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE state = ?, state_data = ?',
    [userId, state, JSON.stringify(data), state, JSON.stringify(data)]
  );
}

async function saveLastMessage(userId, text) {
  await pool.query(
    'INSERT INTO user_last_messages (user_id, message_text) VALUES (?, ?) ON DUPLICATE KEY UPDATE message_text = ?',
    [userId, text, text]
  );
}

async function updateStreak(user) {
  const today = new Date().toISOString().split('T')[0];
  const last = user.last_active_date ? new Date(user.last_active_date).toISOString().split('T')[0] : null;
  if (last === today) return user.streak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yStr = yesterday.toISOString().split('T')[0];
  let newStreak = 1;
  if (last === yStr) newStreak = user.streak + 1;
  await pool.query('UPDATE users SET streak = ?, last_active_date = ? WHERE telegram_id = ?', [newStreak, today, user.telegram_id]);
  return newStreak;
}

// SELF-PING
if (RENDER_URL) {
  cron.schedule('*/14 * * * *', () => {
    https.get(RENDER_URL + '/health', (res) => {
      console.log(`[Self-Ping] ${new Date().toISOString()} - Status: ${res.statusCode}`);
    }).on('error', (err) => console.error('[Self-Ping Error]', err.message));
  });
}

// WEBHOOK ENDPOINTS
app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// MESSAGE HANDLER
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  
  try {
    // User Check / Register
    let [users] = await pool.query('SELECT * FROM users WHERE telegram_id = ?', [userId]);
    let user;
    if (users.length === 0) {
      await pool.query('INSERT INTO users (telegram_id, full_name, username) VALUES (?, ?, ?)', 
        [userId, msg.from.first_name + ' ' + msg.from.last_name, msg.from.username]);
      user = { telegram_id: userId, full_name: msg.from.first_name, level: 'A1', score: 0, streak: 0 };
    } else {
      user = users[0];
      await updateStreak(user);
    }
    
    let userState = await getUserState(userId);
    
    // ADMIN COMMANDS
    if (userId === ADMIN_ID && text === '/admin') {
      await setUserState(userId, 'idle');
      return bot.sendMessage(chatId, 'Admin Paneli:', adminMenu);
    }

    // ADMIN ADD WORD
    if (userState.state === 'admin_add_word' && userId === ADMIN_ID) {
      const parts = text.split('|').map(p => p.trim());
      if (parts.length === 3) {
        await pool.query('INSERT INTO words (word, level, category) VALUES (?, ?, ?)', [parts[0], parts[1], parts[2]]);
        await setUserState(userId, 'idle');
        return bot.sendMessage(chatId, `Söz əlavə edildi: ${parts[0]}`, adminMenu);
      }
      return bot.sendMessage(chatId, 'Format yanlışdır. Format: söz | səviyyə | kateqoriya');
    }

    // BASIC ROUTING
    if (text === '/start' || text === '🏠 Ana Menyu') {
      await setUserState(userId, 'idle');
      return bot.sendMessage(chatId, `👋 Salam, ${user.full_name}!\n\n📊 Səviyyən: ${user.level}\n🏆 Xalın: ${user.score}\n🔥 Streak: ${user.streak} gün`, mainMenu);
    }

    if (text === '📚 Söz Öyrən') {
      const [rows] = await pool.query('SELECT * FROM words WHERE level = ? ORDER BY RAND() LIMIT 1', [user.level]);
      if (rows.length === 0) return bot.sendMessage(chatId, 'Bu səviyyədə söz tapılmadı.', mainMenu);
      const w = rows[0];
      await saveLastMessage(userId, `Word: ${w.word}\nLevel: ${w.level}\nCategory: ${w.category}`);
      await setUserState(userId, 'learning_word', { word_id: w.id });
      return bot.sendMessage(chatId, `📚 Söz: ${w.word}\n📊 Səviyyə: ${w.level}\n🏷️ Kateqoriya: ${w.category}`, {
        reply_markup: { inline_keyboard: [
          [{ text: '⭐ Favorit', callback_data: `fav_word_${w.id}` }, { text: '➡️ Növbəti', callback_data: 'next_word' }],
          [{ text: '🏠 Menyu', callback_data: 'menu' }]
        ]}
      });
    }

    if (text === '🤖 AI İzah') {
      const lastMsg = await pool.query('SELECT message_text FROM user_last_messages WHERE user_id = ?', [userId]);
      if (lastMsg[0].length === 0) return bot.sendMessage(chatId, 'Heç bir mesaj yoxdur ki, izah edim.');
      
      const prompt = `Sən ingilis dili müəllimisisən. Aşağıdakı mesajı Azərbaycan dilində (latın əlifbası ilə) sadə və aydın şəkildə izah et. Qrammatika, söz ehtiyatı və çətin nöqtələri açıqla.\n\nMesaj: ${lastMsg[0][0].message_text}`;
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      return bot.sendMessage(chatId, result.response.text(), mainMenu);
    }

    if (text === '🔍 Axtarış') {
      await setUserState(userId, 'search');
      return bot.sendMessage(chatId, 'Axtarmaq istədiyiniz sözü və ya qaydanı yazın:');
    }

    if (userState.state === 'search') {
      const [res] = await pool.query(`(SELECT id, word as text, 'word' as type FROM words WHERE word LIKE ? LIMIT 10) UNION ALL (SELECT id, title as text, 'rule' as type FROM rules WHERE title LIKE ? LIMIT 10)`, [`%${text}%`, `%${text}%`]);
      await setUserState(userId, 'idle');
      if (res.length === 0) return bot.sendMessage(chatId, 'Heç nə tapılmadı.', mainMenu);
      let str = '🔍 Axtarış Nəticələri:\n\n';
      res.forEach(r => str += `[${r.type}] ${r.text}\n`);
      return bot.sendMessage(chatId, str, mainMenu);
    }

    // Admin simple handlers (can be expanded)
    if (userId === ADMIN_ID && text === '➕ Söz Əlavə Et') {
      await setUserState(userId, 'admin_add_word');
      return bot.sendMessage(chatId, 'Format: söz | səviyyə | kateqoriya\nMəsələn: apple | A1 | food');
    }

    // Default fallback
    bot.sendMessage(chatId, 'Zəhmət olmasa menyudan seçim edin.', mainMenu);

  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, 'Xəta baş verdi, yenidən cəhd edin.', mainMenu);
  }
});

// CALLBACK QUERY HANDLER
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;
  
  try {
    if (data === 'menu') {
      await setUserState(userId, 'idle');
      return bot.sendMessage(chatId, 'Əsas menyu:', mainMenu);
    }
    
    if (data.startsWith('fav_word_')) {
      const wordId = data.split('_')[2];
      await pool.query('INSERT IGNORE INTO favorites (user_id, element_type, element_id) VALUES (?, ?, ?)', [userId, 'word', wordId]);
      return bot.answerCallbackQuery({ callback_query_id: query.id, text: 'Favoritlərə əlavə edildi!' });
    }

    // Handle Quizzes, exams, etc...
    
  } catch (err) {
    console.error(err);
  }
});

// Bot birinci dəfə başlayanda avtomatik seed etmək üçün
import { execSync } from 'child_process';

async function runInitialSeed() {
  try {
    // Databazada söz varsa, seed etməyə ehtiyac yoxdur
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM words');
    if (rows[0].count === 0) {
      console.log('Database boşdur, Seed prosesi başlayır...');
      execSync('node seed.js', { stdio: 'inherit' });
      console.log('Seed prosesi uğurla tamamlandı!');
    } else {
      console.log(`Database-də artıq ${rows[0].count} söz var. Seedə ehtiyac yoxdur.`);
    }
  } catch (err) {
    console.error('Seed zamanı xəta (cədvəl yoxdursa normaldır):', err.message);
    // Əgər cədvəllər hələ yaradılmayıbsa, seed.js işləməzdən əvvəl sql cədvəllərini yaratmaq lazımdır.
  }
}

// START SERVER
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Avtomatik seed yoxlanışı
  await runInitialSeed();

  if (process.env.RENDER_EXTERNAL_URL) {
    const webhookUrl = process.env.RENDER_EXTERNAL_URL + '/webhook';
    await bot.setWebHook(webhookUrl);
    console.log(`Webhook set to ${webhookUrl}`);
  }
});
