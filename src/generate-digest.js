/**
 * GitHub Radar - Generate Digest v3
 * HN AI News at top + weekly/monthly sections
 */

const fs = require("fs");
const path = require("path");
const { formatNum } = require("./fetch-trending");
const { getWeeklyTrending, getMonthlyConsistent, getDroppedOff } = require("./history-tracker");

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function generateMarkdown(data, hnStories) {
  const today = getToday();
  const totalRepos = Object.values(data).reduce((sum, cat) => sum + cat.repos.length, 0);
  const hotRepos = Object.values(data).reduce(
    (sum, cat) => sum + cat.repos.filter(r => r.stars_per_day >= 5).length, 0
  );

  const weeklyTrending = getWeeklyTrending();
  const monthlyConsistent = getMonthlyConsistent();
  const droppedOff = getDroppedOff();

  let md = "";

  md += `# 🔭 GitHub Radar — Daily Digest\n\n`;
  md += `**Date:** ${today}  \n`;
  md += `**Repos tracked:** ${totalRepos} | **Hot (5+ ⭐/day):** ${hotRepos}  \n`;
  md += `**HN AI stories:** ${hnStories ? hnStories.length : 0} | **Weekly persistent:** ${weeklyTrending.length} | **Monthly consistent:** ${monthlyConsistent.length}  \n`;
  md += `**Categories:** AI/LLM/Agents, Crypto/Web3, General Trending  \n\n`;
  md += `---\n\n`;

  md += `## Contents\n\n`;
  if (hnStories && hnStories.length > 0) {
    md += `- [📰 Hacker News AI](#hn-ai-news) — top AI stories today\n`;
  }
  md += `- [Weekly Persistent Repos](#weekly-persistent) — trending 3+ days this week\n`;
  md += `- [Monthly Consistent Repos](#monthly-consistent) — trending 10+ days this month\n`;
  if (droppedOff.length > 0) {
    md += `- [Dropped Off](#dropped-off) — popular last week, gone this week\n`;
  }
  for (const [id, cat] of Object.entries(data)) {
    if (cat.repos.length > 0) {
      md += `- [${cat.name}](#${id}) (${cat.repos.length} repos)\n`;
    }
  }
  md += `\n---\n\n`;

  if (hnStories && hnStories.length > 0) {
    md += `## 📰 Hacker News AI\n\n`;
    md += `> Top AI/ML/LLM stories from Hacker News in the last 24 hours, ranked by points.\n\n`;

    md += `| # | Story | ⬆️ Points | 💬 Comments | Author |\n`;
    md += `|---|-------|----------|-------------|--------|\n`;
    hnStories.forEach((s, i) => {
      const title = s.title.length > 70 ? s.title.slice(0, 70) + "..." : s.title;
      md += `| ${i + 1} | [${title}](${s.url}) ([discuss](${s.hn_url})) | ${s.points} | ${s.comments} | ${s.author} |\n`;
    });
    md += `\n---\n\n`;
  }

  md += `## 📅 Weekly Persistent Repos\n\n`;
  md += `> Repos that appeared in trending **3+ days in the last 7 days**. These aren't just one-day hype — they have staying power.\n\n`;

  if (weeklyTrending.length > 0) {
    md += `| # | Repo | ⭐ Stars | ⭐/day | Days (7d) | Language | Status |\n`;
    md += `|---|------|---------|--------|-----------|----------|--------|\n`;
    weeklyTrending.forEach((r, i) => {
      const status = r.appearances >= 6 ? "🔥 Dominant" : r.appearances >= 4 ? "📈 Strong" : "✅ Steady";
      md += `| ${i + 1} | [${r.full_name}](${r.html_url}) | ${formatNum(r.stars)} | +${r.stars_per_day} | ${r.appearances}/7 | ${r.language || "?"} | ${status} |\n`;
    });
    md += `\n`;
  } else {
    md += `*Not enough data yet — need at least 3 days of digests to show weekly trends.*\n\n`;
  }
  md += `---\n\n`;

  md += `## 📆 Monthly Consistent Repos\n\n`;
  md += `> Repos that appeared in trending **10+ days in the last 30 days**. Proven long-term growth, not just hype.\n\n`;

  if (monthlyConsistent.length > 0) {
    md += `| # | Repo | ⭐ Stars | Days (30d) | Language | Verdict |\n`;
    md += `|---|------|---------|------------|----------|--------|\n`;
    monthlyConsistent.forEach((r, i) => {
      const verdict = r.appearances >= 20 ? "🏆 Dominant" : r.appearances >= 15 ? "💎 Solid" : "📊 Consistent";
      md += `| ${i + 1} | [${r.full_name}](${r.html_url}) | ${formatNum(r.stars)} | ${r.appearances}/30 | ${r.language || "?"} | ${verdict} |\n`;
    });
    md += `\n`;
  } else {
    md += `*Not enough data yet — need at least 10 days of digests to show monthly trends.*\n\n`;
  }
  md += `---\n\n`;

  if (droppedOff.length > 0) {
    md += `## 📉 Dropped Off\n\n`;
    md += `> Were popular last week (3+ days) but haven't appeared this week. The hype may be over.\n\n`;
    droppedOff.slice(0, 10).forEach((r, i) => {
      md += `${i + 1}. ~~[${r.full_name}](${r.html_url})~~ — was ${r.appearances} days last week, now gone\n`;
    });
    md += `\n---\n\n`;
  }

  for (const [id, cat] of Object.entries(data)) {
    if (cat.repos.length === 0) continue;

    md += `## ${cat.name}\n\n`;

    const top3 = cat.repos.slice(0, 3);
    if (top3.length > 0) {
      md += `### 🏆 Top 3 Today\n\n`;
      top3.forEach((r, i) => {
        const medal = ["🥇", "🥈", "🥉"][i];
        const hotTag = r.stars_per_day >= 5 ? " 🔥" : "";
        md += `${medal} **[${r.full_name}](${r.html_url})**${hotTag}  \n`;
        md += `${r.description}  \n`;
        md += `⭐ ${formatNum(r.stars)} (+${r.stars_per_day}/day) | 🍴 ${formatNum(r.forks)} | ${r.language}  \n\n`;
      });
    }

    md += `### All repos\n\n`;
    md += `| # | Repo | Stars | ⭐/day | Language | Description |\n`;
    md += `|---|------|-------|--------|----------|-------------|\n`;

    cat.repos.forEach((r, i) => {
      const hot = r.stars_per_day >= 5 ? " 🔥" : "";
      const desc = r.description.length > 80 ? r.description.slice(0, 80) + "..." : r.description;
      md += `| ${i + 1} | [${r.full_name}](${r.html_url})${hot} | ${formatNum(r.stars)} | +${r.stars_per_day} | ${r.language} | ${desc} |\n`;
    });

    md += `\n---\n\n`;
  }

  md += `## 📊 Summary\n\n`;

  const allRepos = Object.values(data).flatMap(cat => cat.repos);
  const hottest = allRepos.filter(r => r.stars_per_day >= 5).sort((a, b) => b.stars_per_day - a.stars_per_day).slice(0, 5);

  if (hottest.length > 0) {
    md += `### 🔥 Hottest repos today (5+ ⭐/day)\n\n`;
    hottest.forEach(r => {
      md += `- **[${r.full_name}](${r.html_url})** — ${r.stars_per_day}⭐/day (${formatNum(r.stars)} total) — ${r.language}\n`;
    });
    md += `\n`;
  }

  md += `### 📈 Trend Overview\n\n`;
  md += `- **Today:** ${totalRepos} repos tracked, ${hotRepos} hot\n`;
  md += `- **HN AI:** ${hnStories ? hnStories.length : 0} stories\n`;
  md += `- **This week:** ${weeklyTrending.length} repos persistent (3+ days)\n`;
  md += `- **This month:** ${monthlyConsistent.length} repos consistent (10+ days)\n`;
  if (droppedOff.length > 0) {
    md += `- **Dropped off:** ${droppedOff.length} repos lost momentum\n`;
  }
  md += `\n`;

  const langCount = {};
  allRepos.forEach(r => {
    langCount[r.language] = (langCount[r.language] || 0) + 1;
  });
  const topLangs = Object.entries(langCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  md += `### Top languages today\n\n`;
  topLangs.forEach(([lang, count]) => {
    md += `- ${lang}: ${count} repos\n`;
  });

  md += `\n---\n\n`;
  md += `*Generated by [GitHub Radar](https://github.com/xnotok-ops/github-radar) — Built by [@xnotok](https://x.com/xnotok)*\n`;

  return md;
}

function saveDigest(markdown) {
  const today = getToday();
  const digestDir = path.join(__dirname, "..", "digests");

  if (!fs.existsSync(digestDir)) {
    fs.mkdirSync(digestDir, { recursive: true });
  }

  const filePath = path.join(digestDir, `${today}.md`);
  fs.writeFileSync(filePath, markdown, "utf-8");
  console.log(`Digest saved: ${filePath}`);
  return filePath;
}

function generateTelegramMessage(data, hnStories) {
  const today = getToday();
  const allRepos = Object.values(data).flatMap(cat => cat.repos);
  const hottest = allRepos.filter(r => r.stars_per_day >= 5).sort((a, b) => b.stars_per_day - a.stars_per_day).slice(0, 5);
  const weeklyTrending = getWeeklyTrending();

  let msg = `🔭 <b>GitHub Radar — ${today}</b>\n\n`;

  if (hnStories && hnStories.length > 0) {
    msg += `📰 <b>HN AI Top Stories:</b>\n`;
    hnStories.slice(0, 3).forEach((s, i) => {
      const title = s.title.length > 50 ? s.title.slice(0, 50) + "..." : s.title;
      msg += `${i + 1}. <a href="${s.hn_url}">${title}</a> (⬆️${s.points})\n`;
    });
    msg += `\n`;
  }

  if (hottest.length > 0) {
    msg += `🔥 <b>Hottest repos:</b>\n\n`;
    hottest.forEach((r, i) => {
      msg += `${i + 1}. <a href="${r.html_url}">${r.full_name}</a>\n`;
      msg += `   ⭐ ${formatNum(r.stars)} (+${r.stars_per_day}/day) | ${r.language}\n`;
      msg += `   ${r.description.slice(0, 80)}\n\n`;
    });
  }

  if (weeklyTrending.length > 0) {
    msg += `📅 <b>Still trending this week (${weeklyTrending.length}):</b>\n`;
    weeklyTrending.slice(0, 3).forEach(r => {
      msg += `• <a href="${r.html_url}">${r.full_name}</a> (${r.appearances}/7 days)\n`;
    });
    msg += `\n`;
  }

  for (const [id, cat] of Object.entries(data)) {
    if (cat.repos.length === 0) continue;
    const top = cat.repos[0];
    msg += `📌 <b>${cat.name}</b>: <a href="${top.html_url}">${top.full_name}</a> (${formatNum(top.stars)}⭐)\n`;
  }

  msg += `\n📄 Full digest: https://xnotok-ops.github.io/github-radar`;
  msg += `\n\n<i>by @xnotok</i>`;

  return msg;
}

module.exports = { generateMarkdown, saveDigest, generateTelegramMessage };
