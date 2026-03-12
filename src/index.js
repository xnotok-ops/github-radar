/**
 * GitHub Radar - Main Entry Point v3
 * Now with HN AI news + history tracking
 */

const { fetchAllTopics } = require("./fetch-trending");
const { fetchHNStories } = require("./fetch-hn");
const { generateMarkdown, saveDigest, generateTelegramMessage } = require("./generate-digest");
const { sendTelegram } = require("./telegram");
const { recordDaily } = require("./history-tracker");

async function main() {
  console.log("🔭 GitHub Radar — Starting daily scan...\n");
  const startTime = Date.now();

  const token = process.env.GITHUB_TOKEN || null;
  if (!token) {
    console.warn("⚠️ No GITHUB_TOKEN — using unauthenticated API (lower rate limit)");
  }

  // 1. Fetch HN AI news
  console.log("📰 Fetching Hacker News AI stories...");
  const hnStories = await fetchHNStories();

  // 2. Fetch trending repos
  const data = await fetchAllTopics(token);

  const totalRepos = Object.values(data).reduce((sum, cat) => sum + cat.repos.length, 0);
  console.log(`\n✅ Fetched ${totalRepos} repos across ${Object.keys(data).length} categories`);

  // 3. Record to history
  const history = recordDaily(data);
  const totalTracked = Object.keys(history.repos).length;
  console.log(`📊 History: ${totalTracked} unique repos tracked`);

  // 4. Generate markdown digest
  const markdown = generateMarkdown(data, hnStories);
  const filePath = saveDigest(markdown);

  // 5. Send Telegram notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    const telegramMsg = generateTelegramMessage(data, hnStories);
    await sendTelegram(telegramMsg, botToken, chatId);
  } else {
    console.log("ℹ️ Telegram not configured — set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to enable");
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n🏁 Done in ${elapsed}s — Digest: ${filePath}`);
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
