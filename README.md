# 💀 DEAD BOT

即時查詢台灣天氣、地震、颱風、新聞的 Discord Bot。

Created by [illusd.com](https://illusd.com) ・ [illwe.illusd.com/deadbot](https://illwe.illusd.com/deadbot)

## 📋 指令列表

| 指令 | 功能 |
|------|------|
| `/ce` | 查詢台灣各縣市目前溫度與體感溫度（資料來源：中央氣象署） |
| `/eq` | 查詢台灣最近 10 筆地震資料（規模、深度、位置） |
| `/ty` | 查詢目前對台灣有威脅的颱風，含完整颱風資料與影響範圍 |
| `/news` | 查詢 UDN 聯合新聞網最新 5 篇新聞（附連結按鈕） |
| `/aboutbot` | 關於 DEAD BOT 的介紹與相關連結 |
| `/feedback` | 提供意見回饋的連結 |
| `/aboutillusd` | 關於作者 illusd 的介紹 |

## 🚀 安裝與設定

### 1. 前置需求

- [Node.js](https://nodejs.org/) v18 以上
- [Discord Developer Portal](https://discord.com/developers/applications) 帳號

### 2. Clone 專案

```bash
git clone https://github.com/lan2015se-collab/illwe-dc.git
cd illwe-dc
```

### 3. 安裝套件

```bash
npm install
```

### 4. 設定環境變數

複製 `.env.example` 為 `.env` 並填入資料：

```bash
cp .env.example .env
```

編輯 `.env`：

```
DISCORD_TOKEN=你的_Discord_Bot_Token
CLIENT_ID=你的_Discord_Application_Client_ID
CWA_API_KEY=CWA-8F229941-658B-40ED-9A7D-1D0C1EBB865A
```

### 5. 建立 Discord Bot

1. 前往 [Discord Developer Portal](https://discord.com/developers/applications)
2. 建立新 Application → 左側 **Bot** → 複製 Token 填入 `DISCORD_TOKEN`
3. 左側 **OAuth2 → General** → 複製 Application ID 填入 `CLIENT_ID`
4. 左側 **Bot** → 開啟 `applications.commands` 權限

### 6. 邀請 Bot 到伺服器

在 Discord Developer Portal → **OAuth2 → URL Generator**：
- Scopes：`bot`, `applications.commands`
- Bot Permissions：`Send Messages`, `Embed Links`

複製產生的連結，在瀏覽器打開並邀請 Bot 到你的伺服器。

### 7. 註冊斜線指令

```bash
npm run deploy
```

### 8. 啟動 Bot

```bash
npm start
```

## 🌐 使用 PM2 常駐執行（選用）

```bash
npm install -g pm2
pm2 start bot.js --name dead-bot
pm2 save
pm2 startup
```

## 📡 資料來源

- **天氣 / 地震 / 颱風**：[中央氣象署開放資料平臺](https://opendata.cwa.gov.tw/)
- **新聞**：[Google News RSS](https://news.google.com/) × [UDN 聯合新聞網](https://udn.com/)

## 📁 專案結構

```
illwe-dc/
├── bot.js               # Bot 主程式
├── deploy-commands.js   # 斜線指令註冊腳本
├── commands/
│   ├── ce.js            # /ce 溫度指令
│   ├── eq.js            # /eq 地震指令
│   ├── ty.js            # /ty 颱風指令
│   ├── news.js          # /news 新聞指令
│   ├── aboutbot.js      # /aboutbot Bot介紹
│   ├── feedback.js      # /feedback 意見回饋
│   └── aboutillusd.js   # /aboutillusd 作者介紹
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 📝 License

MIT
