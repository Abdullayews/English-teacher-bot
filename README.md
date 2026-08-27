<div align="center">

# 🎓 English Teacher Bot

**A Telegram bot that teaches English to Azerbaijani speakers — quizzes, grammar rules, spaced repetition, leaderboards and a Gemini-powered explainer.**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Telegram](https://img.shields.io/badge/Telegram-Bot_API-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://core.telegram.org/bots/api)
[![Gemini](https://img.shields.io/badge/Google-Gemini_AI-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![MySQL](https://img.shields.io/badge/DB-TiDB_Cloud-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://tidbcloud.com)
[![Express](https://img.shields.io/badge/Webhook-Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)

</div>

---

## 💡 What is this?

**English Teacher Bot** is a full learning platform inside a Telegram chat,
built for Azerbaijani-speaking students. It ships with a **curated database
of 500 real words** (A1→C1, each with an Azerbaijani translation and
category), grammar rules with examples, and generated multiple-choice
quizzes. Everything is level-aware: pick your CEFR level and every quiz,
word and rule adapts to it.

On top of the content there's a gamified progress system — scores, streaks,
achievements, daily stats, personal reports, a leaderboard — plus an
**AI explainer** that answers any language question through Google Gemini,
and an **admin mode** for adding new words, rules and questions straight
from chat.

## ✨ Features

**Learning**

| | |
|---|---|
| 📚 **Söz Öyrən** — learn words | 500 curated words, translations, categories, CEFR levels A1–C1 |
| 📖 **Qayda Öyrən** — learn rules | Grammar rules with content + examples, sequenced per level |
| 📝 **Sözlər Quiz** | Multiple-choice word quizzes with explanations |
| ❓ **Qayda Quiz** | Grammar rule quizzes |
| 🎓 **Ümumi İmtahan** | Mixed general exam — words + rules + custom questions |
| ⚙️ **Səviyyə Seç** | Set your CEFR level — all content adapts |

**Progress & motivation**

| | |
|---|---|
| ⭐ **Favorilər** | Bookmark any word or rule |
| ❌ **Səhv Cavablar** | Every wrong answer is stored — review and clear them |
| 📊 **Hesabat** | Personal report: score, streak, daily stats, achievements |
| 🏆 **Liderlər** | Global leaderboard |
| 🔔 **Günün Sözü** | Word of the day, scheduled with `node-cron` |
| 🤖 **AI İzah** | Ask anything about English — answered by **Gemini** |

**Admin mode** (`/admin`)

| | |
|---|---|
| ➕ **Söz / Qayda / Sual Əlavə Et** | Add words, rules and quiz questions step-by-step from chat |
| 📈 **Bot Statistikası** | Live bot usage statistics |

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Runtime | **Node.js** (ESM) |
| Bot | **node-telegram-bot-api** — webhook mode |
| Web server | **Express** — receives Telegram webhooks |
| AI | **@google/generative-ai** (Gemini) |
| Database | **TiDB Cloud** (MySQL) via `mysql2` pool, SSL |
| Scheduler | **node-cron** |
| Config | `dotenv` |

## 📁 Repository structure

```
English-teacher-bot/
├── server.js   # Bot logic: menus, quizzes, exams, AI, admin, achievements
├── db.js       # mysql2 connection pool (TiDB, SSL)
├── seed.js     # 500 real words + rules + questions seeder
└── package.json
```

## 🗄️ Database tables

`users` (level, score, streak) · `words` · `rules` · `questions` ·
`favorites` · `wrong_answers` (reviewable) · `achievements` ·
`daily_stats` · `user_rule_progress`

The schema is created automatically on startup (`CREATE TABLE IF NOT EXISTS`),
and `seed.js` fills it with the 500-word curriculum.

## 🚀 Installation

```bash
git clone https://github.com/Abdullayews/English-teacher-bot.git
cd English-teacher-bot

npm install

# .env — or export the variables
BOT_TOKEN=...             # from @BotFather
ADMIN_TELEGRAM_ID=...     # your numeric Telegram ID
GEMINI_API_KEY=...        # from Google AI Studio
TIDB_HOST=... TIDB_PORT=4000 TIDB_USER=... TIDB_PASSWORD=... TIDB_DATABASE=...
TIDB_ENABLE_SSL=true

node seed.js              # seed the 500-word curriculum
node server.js            # start the bot (webhook mode)
```

> ☁️ Designed for **Render**: set `RENDER_EXTERNAL_URL` and the bot
> registers its webhook automatically.

## 📄 License

Personal / educational project — English for Azerbaijani speakers, one chat at a time.
