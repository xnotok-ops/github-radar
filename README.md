# 🔭 GitHub Radar

Daily trending GitHub repos digest — tracking AI/LLM, Crypto/Web3, and general trending repositories. Auto-generated via GitHub Actions with Telegram notifications and a web UI.

## Features

- **Auto Daily Digest** — GitHub Actions runs every day at 07:30 WIB, scans trending repos, generates a markdown report
- **Web UI** — Browse all historical digests via GitHub Pages (dark theme, mobile-friendly)
- **Telegram Notification** — Get a summary of hottest repos sent to your Telegram every morning
- **Multi-topic Tracking** — AI/LLM/Agents, Crypto/Web3, and general trending in one report
- **Hot Detection** — Repos gaining 5+ stars/day are flagged as 🔥
- **Global Sources** — Tracks repos from all languages/countries, descriptions shown as-is

## How It Works

    1. GitHub Actions triggers daily (cron)
    2. Fetches trending repos via GitHub Search API
    3. Generates markdown digest with rankings & stats
    4. Saves to /digests folder
    5. Rebuilds web UI (docs/index.html)
    6. Commits & pushes automatically
    7. Sends Telegram notification

## Quick Start

### Option A: Fork & Run (recommended)

1. Fork this repo
2. Go to Settings → Actions → General → enable "Allow all actions"
3. Go to Settings → Pages → Source: main, folder: /docs → Save
4. Go to Actions → Daily GitHub Radar → Run workflow (manual test)
5. Your web UI will be live at https://YOUR-USERNAME.github.io/github-radar

### Option B: Run locally

    git clone https://github.com/xnotok-ops/github-radar.git
    cd github-radar
    export GITHUB_TOKEN=ghp_xxxxx
    npm start
    npm run build

## Telegram Setup (optional)

1. Message @BotFather on Telegram → /newbot → follow steps
2. Copy the bot token you receive
3. Send any message to your new bot, then visit: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
4. Find chat.id in the response — that's your chat ID
5. Add to GitHub repo secrets: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID

## Topics Tracked

| Category | Topics |
|----------|--------|
| AI / LLM / Agents | llm, ai-agent, large-language-model, rag, vector-database, machine-learning, mcp-server |
| Crypto / Web3 | solana, defi, ethereum, web3, bitcoin, smart-contract, nft, blockchain |
| General Trending | All repos sorted by stars (no topic filter) |

## Project Structure

    github-radar/
    ├── .github/workflows/
    │   └── daily-radar.yml
    ├── src/
    │   ├── index.js
    │   ├── fetch-trending.js
    │   ├── generate-digest.js
    │   ├── telegram.js
    │   └── build-index.js
    ├── digests/
    ├── docs/
    │   └── index.html
    ├── package.json
    ├── .gitignore
    └── README.md

## Inspired By

agents-radar by duanyytop — Daily AI ecosystem digests via GitHub Actions.

---

**Built by [@xnotok](https://x.com/xnotok)** | [github.com/xnotok-ops](https://github.com/xnotok-ops)
