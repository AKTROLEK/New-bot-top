# 🚂 Railway Deployment Guide

## Quick Deploy to Railway

### 1. Prerequisites
- Railway account (https://railway.app)
- Discord Bot Token
- Discord Application with OAuth2 configured

### 2. Deploy from GitHub

1. **Connect Repository:**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `AKTROLEK/New-bot-top`

2. **Configure Environment Variables:**

Click on your service → Variables → Add the following:

```env
# Required
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_GUILD_ID=your_main_guild_id

# Railway sets these automatically
# PORT=3000 (auto-set by Railway)
# HOST=0.0.0.0 (auto-set)

# Web Configuration
WEB_URL=https://your-app.up.railway.app
SESSION_SECRET=generate_a_secure_random_string_here

# Database (auto-created in Railway)
DATABASE_PATH=./data/bot.db

# Optional
BOT_LANGUAGE=ar
BOT_TIMEZONE=Asia/Riyadh
LOG_LEVEL=info
```

3. **Configure Discord OAuth:**

In Discord Developer Portal → OAuth2 → Redirects:
```
https://your-app.up.railway.app/auth/callback
```

4. **Deploy:**
   - Railway will automatically deploy
   - Check logs for "🌐 Web dashboard running on 0.0.0.0:3000"
   - Access your dashboard at the Railway-provided URL

### 3. Verify Deployment

**Check Logs:**
```
✅ Database connected successfully
✅ Language files loaded
✅ Web dashboard started successfully
✅ Bot logged in successfully (if token is valid)
```

**Test Dashboard:**
1. Visit: `https://your-app.up.railway.app`
2. Should see Arabic homepage
3. Click "دخول لوحة التحكم" to test OAuth

### 4. Common Issues

#### 502 Bad Gateway
**Symptoms:** Connection refused errors
**Solution:** ✅ **Fixed in this update!**
- Server now listens on 0.0.0.0
- Uses PORT environment variable correctly

#### OAuth Not Working
**Cause:** Redirect URL mismatch
**Solution:** 
- Check Discord Developer Portal OAuth2 settings
- Ensure redirect URL matches Railway domain
- Update `WEB_URL` environment variable

#### Bot Not Connecting
**Cause:** Invalid Discord token
**Solution:**
- Dashboard will still work! (new feature)
- Check token is correct in Railway variables
- Bot will show as "غير متصل" (disconnected) on dashboard

#### Database Issues
**Solution:**
- Railway provides persistent storage
- Check DATABASE_PATH is set correctly
- Database auto-creates on first run

### 5. Environment Variables Guide

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DISCORD_TOKEN` | ✅ Yes | Bot token from Discord | `MTA5...` |
| `DISCORD_CLIENT_ID` | ✅ Yes | OAuth2 Client ID | `109876543210...` |
| `DISCORD_CLIENT_SECRET` | ✅ Yes | OAuth2 Client Secret | `abc123...` |
| `DISCORD_GUILD_ID` | ✅ Yes | Your main server ID | `123456789...` |
| `WEB_URL` | ✅ Yes | Your Railway domain | `https://...railway.app` |
| `SESSION_SECRET` | ✅ Yes | Random secure string | Generate with: `openssl rand -base64 32` |
| `PORT` | ⚪ Auto | Server port | Auto-set by Railway |
| `HOST` | ⚪ Auto | Bind address | `0.0.0.0` (auto) |
| `DATABASE_PATH` | ⚪ Optional | Database location | `./data/bot.db` |
| `BOT_LANGUAGE` | ⚪ Optional | Bot language | `ar` (default) |
| `LOG_LEVEL` | ⚪ Optional | Logging level | `info` (default) |

### 6. Monitoring

**Check Application Health:**
- Railway provides automatic health checks
- Monitor logs in real-time from Railway dashboard
- Dashboard shows bot status at `/dashboard`

**Bot Status Indicators:**
- 🟢 **متصل** (Online) - Bot connected successfully
- 🔴 **غير متصل** (Offline) - Bot not connected (dashboard still works!)

### 7. Scaling

Railway automatically handles:
- ✅ Restart on failure (configured in railway.json)
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ✅ Environment management

### 8. Updates

To update your deployment:
1. Push changes to GitHub
2. Railway auto-deploys from main branch
3. Check deployment logs for success

### 9. Security Notes

**Important:**
- Never commit `.env` file
- Rotate `SESSION_SECRET` regularly
- Use strong, unique secrets
- Enable 2FA on Discord Developer Portal
- Monitor access logs

### 10. Support

**Dashboard Access:**
```
https://your-app.up.railway.app
```

**API Health Check:**
```
https://your-app.up.railway.app/api/stats
```

**Logs:**
- View in Railway dashboard
- Or check `./logs/bot.log` in container

---

## Troubleshooting Commands

**Test locally before deploying:**
```bash
# Install dependencies
npm install

# Copy and configure .env
cp .env.example .env
# Edit .env with your values

# Test server
npm start
```

**Check if port is correct:**
```bash
# Railway sets PORT automatically
echo $PORT
```

**Generate secure session secret:**
```bash
openssl rand -base64 32
```

---

## Architecture

```
Railway Container
├── Node.js App (npm start)
├── Discord Bot (optional - fails gracefully)
├── Web Dashboard (always available)
│   ├── Express Server (0.0.0.0:PORT)
│   ├── Passport OAuth
│   └── EJS Templates
└── SQLite Database (persistent volume)
```

**Key Features:**
- Dashboard works even if bot fails
- Listens on 0.0.0.0 for Railway
- Uses PORT environment variable
- Graceful error handling
- Automatic restarts

---

Made with ❤️ for Arabic Discord Communities

Deploy with confidence! 🚀
