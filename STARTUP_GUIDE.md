# 🚀 Startup Guide - نظام البوت المتقدم

## Quick Start | البدء السريع

### Prerequisites | المتطلبات الأساسية

1. **Node.js** (v18.0.0 أو أحدث)
2. **Discord Bot Token** (من Discord Developer Portal)
3. **Discord Application** (Client ID & Secret للـ OAuth)

### Installation | التثبيت

```bash
# 1. Clone the repository | استنساخ المشروع
git clone https://github.com/AKTROLEK/New-bot-top.git
cd New-bot-top

# 2. Install dependencies | تثبيت المكتبات
npm install

# 3. Configure environment | إعداد البيئة
cp .env.example .env
# Edit .env with your Discord credentials
```

### Configuration | الإعدادات

Edit `.env` file with your credentials:

```env
# Discord Bot Token (Required)
DISCORD_TOKEN=your_bot_token_here

# Discord OAuth (Required for dashboard login)
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_GUILD_ID=your_guild_id_here

# Web Dashboard
WEB_PORT=3000
WEB_URL=http://localhost:3000
SESSION_SECRET=your_secure_session_secret_here
```

### Running the Bot | تشغيل البوت

#### Option 1: Bot + Dashboard (Recommended | موصى به)
```bash
npm start
```
This will:
- ✅ Start the Discord bot
- ✅ Connect to database
- ✅ Start web dashboard automatically
- ✅ Dashboard will show real-time bot status

#### Option 2: Dashboard Only (Standalone | منفصل)
```bash
npm run web
```
This will:
- ⚠️ Start web dashboard without bot connection
- ✅ Connect to database
- ⚠️ Bot status will show as "غير متصل" (disconnected)

## Accessing the Dashboard | الوصول للوحة التحكم

1. Open browser: `http://localhost:3000`
2. Click "دخول لوحة التحكم" (Login to Dashboard)
3. Authorize with Discord
4. View real-time bot statistics

## Features in Dashboard | المميزات في لوحة التحكم

### 🤖 Bot Status Card
- Connection status (متصل/غير متصل)
- Uptime (وقت التشغيل)
- Number of guilds (السيرفرات)
- Number of users (المستخدمين)
- WebSocket ping (البينق)

### 📊 Statistics
- Support system cases
- Verification queue
- Streamer management
- Wallet balances
- Analytics

## Troubleshooting | حل المشاكل

### Bot won't start | البوت لا يبدأ
- Check that `DISCORD_TOKEN` is valid
- Ensure bot has proper intents enabled in Discord Developer Portal

### Dashboard shows "غير متصل" | Dashboard shows disconnected
- Make sure you're running `npm start` (not `npm run web`)
- Check that bot successfully logged in (look for "✅ Bot logged in successfully" in logs)

### Can't login to dashboard | لا يمكن تسجيل الدخول
- Verify `DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are correct
- Add OAuth2 redirect URL in Discord Developer Portal: `http://localhost:3000/auth/callback`

## Logs | السجلات

Check logs in `./logs/bot.log` for detailed information about bot and dashboard startup.

## Support | الدعم

For issues, please open an issue on GitHub.

---

Made with ❤️ for Arabic Discord Communities
