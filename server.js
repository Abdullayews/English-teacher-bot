import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import cron from 'node-cron';
import https from 'https';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { execSync } from 'child_process';
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
      ['❌ Ləğv Et', '🏠 Ana Menyu']
    ], resize_keyboard: true
  }
};

function safeParse(data) {
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return []; } 
  }
  return data || [];
}

// DB TABLE CREATER
async function initDatabase() {
  try {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, telegram_id BIGINT NOT NULL UNIQUE, username VARCHAR(255), full_name VARCHAR(255) NOT NULL, level ENUM('A1','A2','B1','B2','C1') DEFAULT 'A1', score INT DEFAULT 0, streak INT DEFAULT 0, last_active_date DATE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS words (id INT AUTO_INCREMENT PRIMARY KEY, word VARCHAR(255) NOT NULL, level ENUM('A1','A2','B1','B2','C1') NOT NULL, category VARCHAR(100) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS rules (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(500) NOT NULL, content TEXT NOT NULL, example TEXT, level ENUM('A1','A2','B1','B2','C1') NOT NULL, category VARCHAR(100) DEFAULT 'grammar', sequence_number INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS questions (id INT AUTO_INCREMENT PRIMARY KEY, type ENUM('word_quiz','rule_quiz','general') NOT NULL, question_text TEXT NOT NULL, options JSON NOT NULL, correct_answer VARCHAR(10) NOT NULL, explanation TEXT, level ENUM('A1','A2','B1','B2','C1') NOT NULL, category VARCHAR(100), related_id INT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS favorites (id INT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, element_type ENUM('word','rule') NOT NULL, element_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uniq_fav (user_id, element_type, element_id))`,
      `CREATE TABLE IF NOT EXISTS wrong_answers (id INT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, question_id INT NOT NULL, question_type ENUM('word_quiz','rule_quiz','general') NOT NULL, question_text TEXT, user_answer VARCHAR(255), correct_answer VARCHAR(255), explanation TEXT, reviewed BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS achievements (id INT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, achievement_name VARCHAR(255) NOT NULL, achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uniq_ach (user_id, achievement_name))`,
      `CREATE TABLE IF NOT EXISTS daily_stats (id INT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, stat_date DATE NOT NULL, questions_answered INT DEFAULT 0, correct_count INT DEFAULT 0, UNIQUE KEY uniq_daily (user_id, stat_date))`,
      `CREATE TABLE IF NOT EXISTS user_rule_progress (id INT AUTO_INCREMENT PRIMARY KEY, user_id BIGINT NOT NULL, rule_id INT NOT NULL, read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uniq_progress (user_id, rule_id))`,
      `CREATE TABLE IF NOT EXISTS user_states (user_id BIGINT PRIMARY KEY, state VARCHAR(50) DEFAULT 'idle', state_data JSON, last_bot_message_id INT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`,
      `CREATE TABLE IF NOT EXISTS user_last_messages (user_id BIGINT PRIMARY KEY, message_text TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`
    ];
    for (const sql of tables) await pool.query(sql);
  } catch (err) {
    console.error('Cədvəl xətası:', err.message);
  }
}

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
    [userId, state, data ? JSON.stringify(data) : null, state, data ? JSON.stringify(data) : null]
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

async function checkAndGrantAchievement(userId, achievementName, chatId) {
  try {
    await pool.query('INSERT IGNORE INTO achievements (user_id, achievement_name) VALUES (?, ?)', [userId, achievementName]);
    const [rows] = await pool.query('SELECT ROW_COUNT() as inserted');
    if (rows[0].inserted > 0) bot.sendMessage(chatId, `🎉 Təbriklər! Yeni nailiyyət: ${achievementName}`);
  } catch (e) { console.error(e); }
}

async function runInitialSeed() {
  try {
    console.log('Seed yoxlanılır...');
    execSync('node seed.js', { stdio: 'inherit' });
    console.log('Seed tamamlandı!');
  } catch (err) {
    console.error('Seed xətası:', err.message);
  }
}

// SELF-PING (10 dəqiqədən bir atılır ki, Render heç vaxt yatmasın)
if (RENDER_URL) {
  cron.schedule('*/10 * * * *', () => {
    https.get(RENDER_URL + '/health', (res) => {
      console.log(`[Self-Ping] Status: ${res.statusCode}`);
    }).on('error', (err) => console.error('[Self-Ping Error]', err.message));
  });
}

app.post('/webhook', (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function sendRandomWord(chatId, userId, user) {
  const [rows] = await pool.query('SELECT * FROM words WHERE level = ? ORDER BY RAND() LIMIT 1', [user.level]);
  if (rows.length === 0) return bot.sendMessage(chatId, 'Bu səviyyədə söz tapılmadı.', mainMenu);
  const w = rows[0];
  await saveLastMessage(userId, `Word: ${w.word}\nLevel: ${w.level}\nCategory: ${w.category}`);
  await setUserState(userId, 'learning_word', { word_id: w.id });
  return bot.sendMessage(chatId, `📚 Söz: <b>${w.word}</b>\n📊 Səviyyə: ${w.level}\n🏷️ Kateqoriya: ${w.category}`, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [{ text: '⭐ Favorit', callback_data: `fav_word_${w.id}` }, { text: '➡️ Növbəti', callback_data: 'next_word' }],
      [{ text: '🏠 Menyu', callback_data: 'menu' }]
    ]}
  });
}

async function sendNextRule(chatId, userId, user) {
  const [rules] = await pool.query(`
    SELECT r.* FROM rules r
    LEFT JOIN user_rule_progress urp ON r.id = urp.rule_id AND urp.user_id = ?
    WHERE r.level = ? AND urp.id IS NULL
    ORDER BY r.sequence_number LIMIT 1`, [userId, user.level]);

  if (rules.length === 0) return bot.sendMessage(chatId, 'Bu səviyyədə yeni qayda qalmayıb. 🎉', mainMenu);
  const r = rules[0];
  await saveLastMessage(userId, `Rule: ${r.title}\nContent: ${r.content}\nExample: ${r.example}`);
  await setUserState(userId, 'learning_rule', { rule_id: r.id });
  return bot.sendMessage(chatId, `📖 <b>${r.title}</b>\n\n${r.content}\n\n📝 Nümunə:\n<i>${r.example}</i>`, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: [
      [{ text: '✅ Başa düşdüm', callback_data: `understood_rule_${r.id}` }, { text: '⭐ Favorit', callback_data: `fav_rule_${r.id}` }],
      [{ text: '➡️ Növbəti', callback_data: 'next_rule' }, { text: '🏠 Menyu', callback_data: 'menu' }]
    ]}
  });
}

// MESSAGE HANDLER
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;
  
  try {
    const firstName = msg.from.first_name || '';
    const lastName = msg.from.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || 'İstifadəçi';
    const username = msg.from.username || null;

    let [users] = await pool.query('SELECT * FROM users WHERE telegram_id = ?', [userId]);
    let user;
    if (users.length === 0) {
      await pool.query('INSERT INTO users (telegram_id, full_name, username) VALUES (?, ?, ?)', [userId, fullName, username]);
      user = { telegram_id: userId, full_name: fullName, level: 'A1', score: 0, streak: 0 };
    } else {
      user = users[0];
      await updateStreak(user);
    }
    
    let userState = await getUserState(userId);
    const stateData = safeParse(userState.state_data);
    
    // 1. QLOBAL KOMUTLAR (Hər zaman icra olunur, state-i sıfırlayır)
    if (text === '❌ Ləğv Et' || text === '/start' || text === '🏠 Ana Menyu') {
      await setUserState(userId, 'idle');
      if (text === '❌ Ləğv Et') return bot.sendMessage(chatId, 'Proses ləğv edildi.', userId === ADMIN_ID ? adminMenu : mainMenu);
      return bot.sendMessage(chatId, `👋 Salam, ${user.full_name}!\n\n📊 Səviyyən: ${user.level}\n🏆 Xalın: ${user.score}\n🔥 Streak: ${user.streak} gün`, mainMenu);
    }

    if (text === '📚 Söz Öyrən') return sendRandomWord(chatId, userId, user);
    if (text === '📖 Qayda Öyrən') return sendNextRule(chatId, userId, user);

    if (text === '📝 Sözlər Quiz' || text === '❓ Qayda Quiz') {
      const type = text.includes('Sözlər') ? 'word_quiz' : 'rule_quiz';
      const [qs] = await pool.query('SELECT * FROM questions WHERE type = ? AND level = ? ORDER BY RAND() LIMIT 1', [type, user.level]);
      if (qs.length === 0) return bot.sendMessage(chatId, 'Bu səviyyə üçün sual tapılmadı.', mainMenu);
      const q = qs[0];
      const options = safeParse(q.options);
      await setUserState(userId, `quiz_${type}`, { q_id: q.id });
      
      const inlineKeyboard = options.map((opt, idx) => [{ text: opt, callback_data: `quiz_${q.id}_${String.fromCharCode(65 + idx)}` }]);
      return bot.sendMessage(chatId, `❓ ${q.question_text}`, {
        reply_markup: { inline_keyboard: [...inlineKeyboard, [{ text: '🏠 Menyu', callback_data: 'menu' }]] }
      });
    }

    if (text === '🎓 Ümumi İmtahan') {
      const [qs] = await pool.query('SELECT * FROM questions WHERE level = ? ORDER BY RAND() LIMIT 10', [user.level]);
      if (qs.length < 10) return bot.sendMessage(chatId, 'İmtahan üçün 10 sual yoxdur.', mainMenu);
      const examQuestions = qs.map(q => q.id);
      await setUserState(userId, 'exam', { questions: examQuestions, current_index: 0, score: 0 });
      const q = qs[0];
      const options = safeParse(q.options);
      const inlineKeyboard = options.map((opt, idx) => [{ text: opt, callback_data: `exam_${q.id}_${String.fromCharCode(65 + idx)}` }]);
      return bot.sendMessage(chatId, `🎓 İmtahan başladı! (1/10)\n\n❓ ${q.question_text}`, { reply_markup: { inline_keyboard: inlineKeyboard } });
    }

    if (text === '⚙️ Səviyyə Seç') {
      return bot.sendMessage(chatId, 'Yeni səviyyənizi seçin:', {
        reply_markup: { inline_keyboard: [
          [{ text: 'A1', callback_data: 'level_A1' }, { text: 'A2', callback_data: 'level_A2' }, { text: 'B1', callback_data: 'level_B1' }],
          [{ text: 'B2', callback_data: 'level_B2' }, { text: 'C1', callback_data: 'level_C1' }],
          [{ text: '🏠 Menyu', callback_data: 'menu' }]
        ]}
      });
    }

    if (text === '⭐ Favorilər') {
      const [favs] = await pool.query(`SELECT f.*, w.word, r.title FROM favorites f LEFT JOIN words w ON f.element_type='word' AND f.element_id=w.id LEFT JOIN rules r ON f.element_type='rule' AND f.element_id=r.id WHERE f.user_id = ?`, [userId]);
      if (favs.length === 0) return bot.sendMessage(chatId, 'Favoritiniz yoxdur.', mainMenu);
      let str = '⭐ Sizin favoritləriniz:\n\n';
      const inlineKeyboard = [];
      favs.forEach(f => {
        const txt = f.element_type === 'word' ? f.word : f.title;
        str += `[${f.element_type}] ${txt}\n`;
        inlineKeyboard.push([{ text: `❌ Sil: ${txt.substring(0, 15)}`, callback_data: `del_fav_${f.id}` }]);
      });
      inlineKeyboard.push([{ text: '🏠 Menyu', callback_data: 'menu' }]);
      return bot.sendMessage(chatId, str, { reply_markup: { inline_keyboard: inlineKeyboard } });
    }

    if (text === '❌ Səhv Cavablar') {
      const [wrongs] = await pool.query('SELECT * FROM wrong_answers WHERE user_id = ? AND reviewed = FALSE ORDER BY created_at LIMIT 10', [userId]);
      if (wrongs.length === 0) return bot.sendMessage(chatId, 'Baxılmamış səhv yoxdur. 🎉', mainMenu);
      let str = '❌ Səhv cavablarınız:\n\n';
      const inlineKeyboard = [];
      wrongs.forEach(w => {
        str += `Sual: ${w.question_text}\nSizin cavab: ${w.user_answer}\nDüzgün: ${w.correct_answer}\n\n`;
        inlineKeyboard.push([{ text: `Təkrar et`, callback_data: `retry_wrong_${w.id}` }]);
      });
      inlineKeyboard.push([{ text: '🧹 Hamısını sil', callback_data: 'clear_wrong' }, { text: '🏠 Menyu', callback_data: 'menu' }]);
      return bot.sendMessage(chatId, str, { reply_markup: { inline_keyboard: inlineKeyboard } });
    }

    if (text === '📊 Hesabat') {
      const [stats] = await pool.query('SELECT SUM(questions_answered) as total_q, SUM(correct_count) as total_c FROM daily_stats WHERE user_id = ?', [userId]);
      const [wrongCount] = await pool.query('SELECT COUNT(*) as c FROM wrong_answers WHERE user_id = ?', [userId]);
      const [favCount] = await pool.query('SELECT COUNT(*) as c FROM favorites WHERE user_id = ?', [userId]);
      const [activeDays] = await pool.query('SELECT COUNT(DISTINCT stat_date) as d FROM daily_stats WHERE user_id = ?', [userId]);
      const [readRules] = await pool.query('SELECT COUNT(*) as c FROM user_rule_progress WHERE user_id = ?', [userId]);
      const [achs] = await pool.query('SELECT achievement_name FROM achievements WHERE user_id = ?', [userId]);
      const tq = stats[0].total_q || 0;
      const tc = stats[0].total_c || 0;
      const acc = tq > 0 ? ((tc / tq) * 100).toFixed(1) : 0;
      let str = `📊 Sizin Hesabatınız:\n\n🏆 Xal: ${user.score}\n🔥 Streak: ${user.streak} gün\n📅 Aktiv gün: ${activeDays[0].d}\n\n❓ Ümumi sual: ${tq}\n✅ Düzgün cavab: ${tc}\n📈 Dəqiqlik: ${acc}%\n\n📖 Oxunan qayda: ${readRules[0].c}\n⭐ Favoritlər: ${favCount[0].c}\n❌ Baxılmamış səhv: ${wrongCount[0].c}\n\n🏅 Nailiyyətlər:\n`;
      if (achs.length === 0) str += "Heç bir nailiyyət yoxdur.";
      else achs.forEach(a => str += `- ${a.achievement_name}\n`);
      return bot.sendMessage(chatId, str, mainMenu);
    }

    if (text === '🏆 Liderlər') {
      const [leaders] = await pool.query('SELECT full_name, score, streak, level FROM users ORDER BY score DESC LIMIT 10');
      let str = '🏆 Liderlər Siyahısı:\n\n';
      const medals = ['🥇', '🥈', '🥉'];
      leaders.forEach((l, i) => str += `${medals[i] || (i+1)+'.'} ${l.full_name} - ${l.score} xal (🔥${l.streak} | ${l.level})\n`);
      return bot.sendMessage(chatId, str, mainMenu);
    }

    if (text === '🔔 Günün Sözü') {
      const [rows] = await pool.query('SELECT * FROM words ORDER BY RAND() LIMIT 1');
      if (rows.length === 0) return bot.sendMessage(chatId, 'Söz tapılmadı.', mainMenu);
      const w = rows[0];
      await saveLastMessage(userId, `Word: ${w.word}\nLevel: ${w.level}\nCategory: ${w.category}`);
      return bot.sendMessage(chatId, `🔔 Günün Sözü:\n\n📚 <b>${w.word}</b>\n📊 Səviyyə: ${w.level}\n🏷️ Kateqoriya: ${w.category}`, { parse_mode: 'HTML', reply_markup: { inline_keyboard: [[{ text: '🏠 Menyu', callback_data: 'menu' }]] }});
    }

    if (text === '🤖 AI İzah') {
      try {
        const [lastMsgRow] = await pool.query('SELECT message_text FROM user_last_messages WHERE user_id = ?', [userId]);
        if (!lastMsgRow || lastMsgRow.length === 0) return bot.sendMessage(chatId, 'Heç bir mesaj yoxdur ki, izah edim.', mainMenu);
        const prompt = `Sən ingilis dili müəllimisisən. Aşağıdakı mesajı Azərbaycan dilində (latın əlifbası ilə) izah et. 
        Qaydalar:
        1. Çox uzatma, maksimum 4-5 qısa abzas yaz.
        2. Markdown simvollarından (*, #) istifadə etmə.
        3. Əvəzinə sadə HTML tagları istifadə et: <b>mətn</b> (qalın), <i>mətn</i> (italik).
        4. Hər bölməni emoji ilə başlat (məsələn: 📖, 💡, ✍️, 📝).
        5. Yazı stili modern, aydın və teleqram üçün uyğun olsun.
        Mesaj: ${lastMsgRow[0].message_text}`;
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
        await bot.sendMessage(chatId, '🤖 AI düşünür...');
        const result = await model.generateContent(prompt);
        return bot.sendMessage(chatId, result.response.text(), { parse_mode: 'HTML', reply_markup: mainMenu.reply_markup });
      } catch (aiError) {
        return bot.sendMessage(chatId, '🤖 AI izah edərkən xəta baş verdi.', mainMenu);
      }
    }

    if (text === '🔍 Axtarış') {
      await setUserState(userId, 'search');
      return bot.sendMessage(chatId, 'Axtarmaq istədiyiniz sözü və ya qaydanı yazın:');
    }

    // ADMIN MENUS
    if (userId === ADMIN_ID && text === '/admin') {
      await setUserState(userId, 'idle');
      return bot.sendMessage(chatId, 'Admin Paneli:', adminMenu);
    }
    if (userId === ADMIN_ID && text === '➕ Söz Əlavə Et') {
      await setUserState(userId, 'admin_add_word');
      return bot.sendMessage(chatId, 'Format: söz | səviyyə | kateqoriya\nMəsələn: apple | A1 | food', adminMenu);
    }
    if (userId === ADMIN_ID && text === '➕ Qayda Əlavə Et') {
      await setUserState(userId, 'admin_add_rule_step1', {});
      return bot.sendMessage(chatId, 'Qaydanın başlığını daxil edin:', adminMenu);
    }
    if (userId === ADMIN_ID && text === '➕ Sual Əlavə Et') {
      await setUserState(userId, 'admin_add_question_step1', {});
      return bot.sendMessage(chatId, 'Sual tipini seçin:', {
        reply_markup: { inline_keyboard: [
          [{text: '📝 Söz Quiz', callback_data: 'aq_type_word_quiz'}, {text: '📖 Qayda Quiz', callback_data: 'aq_type_rule_quiz'}],
          [{text: '🎓 Ümumi', callback_data: 'aq_type_general'}]
        ]}
      });
    }
    if (userId === ADMIN_ID && text === '📈 Bot Statistikası') {
      const [uCount] = await pool.query('SELECT COUNT(*) as c FROM users');
      const [wCount] = await pool.query('SELECT COUNT(*) as c FROM words');
      const [rCount] = await pool.query('SELECT COUNT(*) as c FROM rules');
      const [qCount] = await pool.query('SELECT COUNT(*) as c FROM questions');
      return bot.sendMessage(chatId, `📈 Bot Statistikası:\n\n👤 İstifadəçi: ${uCount[0].c}\n📚 Sözlər: ${wCount[0].c}\n📖 Qaydalar: ${rCount[0].c}\n❓ Suallar: ${qCount[0].c}`, adminMenu);
    }

    // 2. STATE-Ə GÖRƏ MƏNTİQ (Yalnız komut olmayan mətnlər üçün)
    if (userState.state === 'search') {
      const searchTerm = `%${text.toLowerCase()}%`;
      const [res] = await pool.query(`(SELECT id, word as text, 'word' as type FROM words WHERE LOWER(word) LIKE ? LIMIT 10) UNION ALL (SELECT id, title as text, 'rule' as type FROM rules WHERE LOWER(title) LIKE ? LIMIT 10)`, [searchTerm, searchTerm]);
      await setUserState(userId, 'idle');
      if (res.length === 0) return bot.sendMessage(chatId, 'Heç nə tapılmadı.', mainMenu);
      let str = '🔍 Axtarış Nəticələri:\n\n';
      res.forEach(r => str += `[${r.type}] ${r.text}\n`);
      return bot.sendMessage(chatId, str, mainMenu);
    }

    if (userState.state === 'admin_add_word' && userId === ADMIN_ID) {
      const parts = text.split('|').map(p => p.trim());
      if (parts.length === 3) {
        await pool.query('INSERT INTO words (word, level, category) VALUES (?, ?, ?)', [parts[0], parts[1], parts[2]]);
        return bot.sendMessage(chatId, `✅ Söz əlavə edildi: ${parts[0]}`, adminMenu);
      }
      return bot.sendMessage(chatId, 'Format yanlışdır. Format: söz | səviyyə | kateqoriya', adminMenu);
    }

    if (userId === ADMIN_ID && userState.state.startsWith('admin_add_question')) {
      if (userState.state === 'admin_add_question_step2') {
        stateData.question_text = text;
        await setUserState(userId, 'admin_add_question_step3', stateData);
        return bot.sendMessage(chatId, 'İndi 4 variantı daxil edin (hər biri yeni sətirdə):', adminMenu);
      }
      if (userState.state === 'admin_add_question_step3') {
        const opts = text.split('\n').map(s => s.trim()).filter(Boolean);
        if (opts.length === 4) {
          stateData.options = opts;
          await setUserState(userId, 'admin_add_question_step4', stateData);
          return bot.sendMessage(chatId, 'Düzgün cavabın hərifini daxil edin (A, B, C və ya D):', adminMenu);
        }
        return bot.sendMessage(chatId, '4 variant olmalıdır.', adminMenu);
      }
      if (userState.state === 'admin_add_question_step4') {
        const ans = text.toUpperCase().trim();
        if (['A','B','C','D'].includes(ans)) {
          stateData.correct_answer = ans;
          await setUserState(userId, 'admin_add_question_step5', stateData);
          return bot.sendMessage(chatId, 'İzahı daxil edin:', adminMenu);
        }
        return bot.sendMessage(chatId, 'Yalnız A, B, C və ya D ola bilər.', adminMenu);
      }
      if (userState.state === 'admin_add_question_step5') {
        stateData.explanation = text;
        await pool.query('INSERT INTO questions (type, question_text, options, correct_answer, explanation, level, category) VALUES (?, ?, ?, ?, ?, ?, ?)', [stateData.type, stateData.question_text, JSON.stringify(stateData.options), stateData.correct_answer, stateData.explanation, stateData.level || 'A1', 'general']);
        await setUserState(userId, 'idle');
        return bot.sendMessage(chatId, '✅ Sual əlavə edildi!', adminMenu);
      }
    }

    if (userId === ADMIN_ID && userState.state.startsWith('admin_add_rule')) {
      if (userState.state === 'admin_add_rule_step1') {
        stateData.title = text;
        await setUserState(userId, 'admin_add_rule_step2', stateData);
        return bot.sendMessage(chatId, 'Qaydanın məzmununu daxil edin:', adminMenu);
      }
      if (userState.state === 'admin_add_rule_step2') {
        stateData.content = text;
        await setUserState(userId, 'admin_add_rule_step3', stateData);
        return bot.sendMessage(chatId, 'Nümunə daxil edin:', adminMenu);
      }
      if (userState.state === 'admin_add_rule_step3') {
        stateData.example = text;
        await setUserState(userId, 'admin_add_rule_step4', stateData);
        return bot.sendMessage(chatId, 'Səviyyə seçin (A1, A2, B1, B2, C1):', adminMenu);
      }
      if (userState.state === 'admin_add_rule_step4') {
        const lvl = text.toUpperCase().trim();
        if (!['A1','A2','B1','B2','C1'].includes(lvl)) return bot.sendMessage(chatId, 'Yalnız A1, A2, B1, B2, C1 ola bilər.', adminMenu);
        const [seqRes] = await pool.query('SELECT COALESCE(MAX(sequence_number), 0) + 1 as next_seq FROM rules WHERE level = ?', [lvl]);
        await pool.query('INSERT INTO rules (title, content, example, level, sequence_number) VALUES (?, ?, ?, ?, ?)', [stateData.title, stateData.content, stateData.example, lvl, seqRes[0].next_seq]);
        await setUserState(userId, 'idle');
        return bot.sendMessage(chatId, '✅ Qayda əlavə edildi!', adminMenu);
      }
    }

    // Default fallback
    bot.sendMessage(chatId, 'Zəhmət olmasa menyudan seçim edin.', mainMenu);

  } catch (err) {
    console.error("GLOBAL XƏTA:", err);
    bot.sendMessage(chatId, 'Xəta baş verdi.', mainMenu);
  }
});

// CALLBACK QUERY HANDLER
bot.on('callback_query', async (query) => {
  const userId = query.from.id;
  const chatId = query.message.chat.id;
  const data = query.data;
  
  await bot.answerCallbackQuery({ callback_query_id: query.id }).catch(e => console.log("Callback err:", e.message));
  
  try {
    let [uRows] = await pool.query('SELECT * FROM users WHERE telegram_id = ?', [userId]);
    let user;
    if (uRows.length === 0) {
      const firstName = query.from.first_name || '';
      const lastName = query.from.last_name || '';
      const fullName = `${firstName} ${lastName}`.trim() || 'İstifadəçi';
      await pool.query('INSERT INTO users (telegram_id, full_name, username) VALUES (?, ?, ?)', [userId, fullName, query.from.username]);
      user = { telegram_id: userId, full_name: fullName, level: 'A1', score: 0, streak: 0 };
    } else {
      user = uRows[0];
    }

    let userState = await getUserState(userId);
    const stateData = safeParse(userState.state_data);
    
    if (data === 'menu') {
      await setUserState(userId, 'idle');
      return bot.sendMessage(chatId, 'Əsas menyu:', mainMenu);
    }
    if (data === 'next_word') return sendRandomWord(chatId, userId, user);
    if (data === 'next_rule') return sendNextRule(chatId, userId, user);

    if (data.startsWith('level_')) {
      const lvl = data.split('_')[1];
      await pool.query('UPDATE users SET level = ? WHERE telegram_id = ?', [lvl, userId]);
      await checkAndGrantAchievement(userId, 'Kəşfiyyatçı', chatId);
      return bot.sendMessage(chatId, `✅ Səviyyəniz ${lvl} olaraq dəyişdirildi.`, mainMenu);
    }

    if (data.startsWith('fav_word_') || data.startsWith('fav_rule_')) {
      const parts = data.split('_');
      await pool.query('INSERT IGNORE INTO favorites (user_id, element_type, element_id) VALUES (?, ?, ?)', [userId, parts[1], parts[2]]);
      return bot.sendMessage(chatId, '⭐ Favoritlərə əlavə edildi!');
    }

    if (data.startsWith('del_fav_')) {
      await pool.query('DELETE FROM favorites WHERE id = ? AND user_id = ?', [data.split('_')[2], userId]);
      return bot.sendMessage(chatId, '❌ Silindi!');
    }

    if (data.startsWith('understood_rule_')) {
      await pool.query('INSERT IGNORE INTO user_rule_progress (user_id, rule_id) VALUES (?, ?)', [userId, data.split('_')[2]]);
      return bot.sendMessage(chatId, '✅ Başa düşüldü kimi qeyd edildi.', {
        reply_markup: { inline_keyboard: [[{ text: '➡️ Növbəti Qayda', callback_data: 'next_rule' }], [{ text: '🏠 Menyu', callback_data: 'menu' }]] }
      });
    }

    if (data === 'clear_wrong') {
      await pool.query('UPDATE wrong_answers SET reviewed = TRUE WHERE user_id = ?', [userId]);
      return bot.sendMessage(chatId, '🧹 Səhv cavablar təmizləndi.', mainMenu);
    }

    if (data.startsWith('retry_wrong_')) {
      await pool.query('UPDATE wrong_answers SET reviewed = TRUE WHERE id = ? AND user_id = ?', [data.split('_')[2], userId]);
      return bot.sendMessage(chatId, '✅ Sual baxılmış kimi qeyd edildi.', mainMenu);
    }

    if (data.startsWith('quiz_')) {
      const parts = data.split('_');
      const qId = parts[1];
      const ans = parts[2];
      const [qs] = await pool.query('SELECT * FROM questions WHERE id = ?', [qId]);
      if (qs.length === 0) return bot.sendMessage(chatId, 'Sual tapılmadı.');
      const q = qs[0];
      const isCorrect = q.correct_answer === ans;
      if (isCorrect) {
        await pool.query('UPDATE users SET score = score + 10 WHERE telegram_id = ?', [userId]);
      } else {
        await pool.query('INSERT INTO wrong_answers (user_id, question_id, question_type, question_text, user_answer, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, q.id, q.type, q.question_text, ans, q.correct_answer, q.explanation]);
      }
      const today = new Date().toISOString().split('T')[0];
      await pool.query('INSERT INTO daily_stats (user_id, stat_date, questions_answered, correct_count) VALUES (?, ?, 1, ?) ON DUPLICATE KEY UPDATE questions_answered = questions_answered + 1, correct_count = correct_count + ?', [userId, today, isCorrect ? 1 : 0, isCorrect ? 1 : 0]);
      return bot.sendMessage(chatId, `${isCorrect ? '✅ Düzgündür! +10 xal' : '❌ Səhv cavab!'}\n\nİzah: ${q.explanation}\n\nDavam edək?`, {
        reply_markup: { inline_keyboard: [[{ text: '➡️ Növbəti sual', callback_data: 'next_quiz' }], [{ text: '🏠 Menyu', callback_data: 'menu' }]] }
      });
    }

    if (data === 'next_quiz') {
      let type = 'word_quiz';
      if (userState.state && userState.state.includes('rule')) type = 'rule_quiz';
      const [qs] = await pool.query('SELECT * FROM questions WHERE type = ? AND level = ? ORDER BY RAND() LIMIT 1', [type, user.level]);
      if (qs.length === 0) return bot.sendMessage(chatId, 'Bu səviyyə üçün sual tapılmadı.', mainMenu);
      const q = qs[0];
      const options = safeParse(q.options);
      await setUserState(userId, `quiz_${type}`, { q_id: q.id });
      const inlineKeyboard = options.map((opt, idx) => [{ text: opt, callback_data: `quiz_${q.id}_${String.fromCharCode(65 + idx)}` }]);
      return bot.sendMessage(chatId, `❓ ${q.question_text}`, {
        reply_markup: { inline_keyboard: [...inlineKeyboard, [{ text: '🏠 Menyu', callback_data: 'menu' }]] }
      });
    }

    if (data.startsWith('exam_')) {
      const parts = data.split('_');
      const qId = parts[1];
      const ans = parts[2];
      const [qs] = await pool.query('SELECT * FROM questions WHERE id = ?', [qId]);
      if (qs.length === 0) return bot.sendMessage(chatId, 'Sual tapılmadı.');
      const q = qs[0];
      const isCorrect = q.correct_answer === ans;
      if (isCorrect) {
        stateData.score = (stateData.score || 0) + 5;
      } else {
        await pool.query('INSERT INTO wrong_answers (user_id, question_id, question_type, question_text, user_answer, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)', [userId, q.id, 'general', q.question_text, ans, q.correct_answer, q.explanation]);
      }
      stateData.current_index = (stateData.current_index || 0) + 1;
      const isFinished = stateData.current_index >= 10;
      if (isFinished) {
        const finalScore = stateData.score || 0;
        await pool.query('UPDATE users SET score = score + ? WHERE telegram_id = ?', [finalScore, userId]);
        const percentage = (finalScore / 50) * 100;
        if (percentage === 100) await checkAndGrantAchievement(userId, 'Mükəmməl İmtahan', chatId);
        else if (percentage >= 80) await checkAndGrantAchievement(userId, 'Yüksək Nəticə', chatId);
        await setUserState(userId, 'idle');
        return bot.sendMessage(chatId, `🎓 İmtahan bitdi!\n\nNəticəniz: ${finalScore} xal (${percentage}%)\n\n${percentage >= 80 ? '🎉 Əla nəticə!' : 'Daha çox çalışın!'}`, mainMenu);
      } else {
        await setUserState(userId, 'exam', stateData);
        const [nextQs] = await pool.query('SELECT * FROM questions WHERE id = ?', [stateData.questions[stateData.current_index]]);
        const nq = nextQs[0];
        const options = safeParse(nq.options);
        const inlineKeyboard = options.map((opt, idx) => [{ text: opt, callback_data: `exam_${nq.id}_${String.fromCharCode(65 + idx)}` }]);
        return bot.sendMessage(chatId, `🎓 İmtahan (${stateData.current_index + 1}/10)\n\n❓ ${nq.question_text}`, {
          reply_markup: { inline_keyboard: inlineKeyboard }
        });
      }
    }

    if (data.startsWith('aq_type_')) {
      stateData.type = data.replace('aq_type_', '');
      await setUserState(userId, 'admin_add_question_step2', stateData);
      return bot.sendMessage(chatId, 'Sual mətnini daxil edin:', adminMenu);
    }

  } catch (err) {
    console.error("CALLBACK XƏTA:", err);
    bot.sendMessage(chatId, 'Xəta baş verdi.', mainMenu);
  }
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDatabase();
  await runInitialSeed();
  if (RENDER_URL) {
    const webhookUrl = RENDER_URL + '/webhook';
    await bot.setWebHook(webhookUrl);
    console.log(`Webhook set to ${webhookUrl}`);
  }
});
