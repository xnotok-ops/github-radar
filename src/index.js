/**
 * GitHub Radar - Main Entry Point v4
 * Now with Security Advisories, Security Score, and CVE Alerts
 */

const { fetchAllTopics } = require("./fetch-trending");
const { fetchHNStories } = require("./fetch-hn");
const { fetchAllAdvisories } = require("./fetch-advisories");
const { scoreAllRepos } = require("./security-score");
const { fetchCVEsForRepos } = require("./fetch-cve");
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

  // 4. NEW: Fetch security advisories
  const advisories = await fetchAllAdvisories(token);

  // 5. NEW: Calculate security scores
  const securityScores = scoreAllRepos(data);

  // 6. NEW: Fetch CVE alerts
  const cveData = await fetchCVEsForRepos(data);

  // 7. Generate markdown digest (pass new data)
  const markdown = generateMarkdown(data, hnStories, advisories, securityScores, cveData);
  const filePath = saveDigest(markdown);

  // 8. Send Telegram notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (botToken && chatId) {
    const telegramMsg = generateTelegramMessage(data, hnStories, advisories, securityScores, cveData);
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