/**
 * GitHub Radar - Generate Digest v4
 * HN AI News + Security Advisories + Security Scores + CVE Alerts
 */

const fs = require("fs");
const path = require("path");
const { formatNum } = require("./fetch-trending");
const { getWeeklyTrending, getMonthlyConsistent, getDroppedOff } = require("./history-tracker");

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function generateMarkdown(data, hnStories, advisories = {}, securityScores = null, cveData = null) {
  const today = getToday();
  const totalRepos = Object.values(data).reduce((sum, cat) => sum + cat.repos.length, 0);
  const hotRepos = Object.values(data).reduce(
    (sum, cat) => sum + cat.repos.filter(r => r.stars_per_day >= 5).length, 0
  );

  const weeklyTrending = getWeeklyTrending();
  const monthlyConsistent = getMonthlyConsistent();
  const droppedOff = getDroppedOff();

  // Count advisories
  const totalAdvisories = Object.values(advisories).reduce((sum, arr) => sum + arr.length, 0);

  let md = "";

  md += `# 🔭 GitHub Radar — Daily Digest\n\n`;
  md += `**Date:** ${today}  \n`;
  md += `**Repos tracked:** ${totalRepos} | **Hot (5+ ⭐/day):** ${hotRepos}  \n`;
  md += `**HN AI stories:** ${hnStories ? hnStories.length : 0} | **Weekly persistent:** ${weeklyTrending.length} | **Monthly consistent:** ${monthlyConsistent.length}  \n`;
  if (totalAdvisories > 0 || (cveData && cveData.total > 0)) {
    md += `**Security:** ${totalAdvisories} advisories | ${cveData ? cveData.total : 0} CVEs (${cveData ? cveData.criticalCount : 0} critical)  \n`;
  }
  md += `**Categories:** AI/LLM/Agents, Crypto/Web3, General Trending  \n\n`;
  md += `---\n\n`;

  // Contents
  md += `## Contents\n\n`;
  if (hnStories && hnStories.length > 0) {
    md += `- [📰 Hacker News AI](#hn-ai-news) — top AI stories today\n`;
  }
  if (totalAdvisories > 0) {
    md += `- [🛡️ Security Advisories](#security-advisories) — vulnerabilities this week\n`;
  }
  if (cveData && cveData.total > 0) {
    md += `- [⚠️ CVE Alerts](#cve-alerts) — new CVEs this week\n`;
  }
  if (securityScores && securityScores.repos.length > 0) {
    md += `- [📊 Security Scores](#security-scores) — repo health grades\n`;
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

  // ========== HN AI NEWS ==========
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

  // ========== NEW: SECURITY ADVISORIES ==========
  if (totalAdvisories > 0) {
    md += `## 🛡️ Security Advisories\n\n`;
    md += `> Recent security vulnerabilities from GitHub Advisory Database (last 7 days).\n\n`;

    for (const [ecosystem, advs] of Object.entries(advisories)) {
      if (advs.length === 0) continue;

      const ecosystemName = ecosystem.toUpperCase();
      md += `### ${ecosystemName}\n\n`;
      md += `| Severity | Package | Summary | Published |\n`;
      md += `|----------|---------|---------|----------|\n`;

      advs.slice(0, 10).forEach(adv => {
        const severityEmoji = {
          critical: "🔴 CRITICAL",
          high: "🟠 HIGH",
          medium: "🟡 MEDIUM",
          low: "🟢 LOW"
        }[adv.severity] || adv.severity;
        const summary = adv.summary.length > 60 ? adv.summary.slice(0, 60) + "..." : adv.summary;
        md += `| ${severityEmoji} | [${adv.package}](${adv.url}) | ${summary} | ${adv.published_at} |\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  }

  // ========== NEW: CVE ALERTS ==========
  if (cveData && cveData.total > 0) {
    md += `## ⚠️ CVE Alerts\n\n`;
    md += `> New CVEs published this week from NVD (National Vulnerability Database).\n\n`;

    // Critical CVEs
    if (cveData.grouped.critical.length > 0) {
      md += `### 🔴 Critical (${cveData.grouped.critical.length})\n\n`;
      md += `| CVE ID | Score | Description | Published |\n`;
      md += `|--------|-------|-------------|----------|\n`;
      cveData.grouped.critical.slice(0, 10).forEach(cve => {
        const desc = cve.description.length > 80 ? cve.description.slice(0, 80) + "..." : cve.description;
        md += `| [${cve.id}](${cve.url}) | ${cve.score} | ${desc} | ${cve.published} |\n`;
      });
      md += `\n`;
    }

    // High CVEs
    if (cveData.grouped.high.length > 0) {
      md += `### 🟠 High (${cveData.grouped.high.length})\n\n`;
      md += `| CVE ID | Score | Description | Published |\n`;
      md += `|--------|-------|-------------|----------|\n`;
      cveData.grouped.high.slice(0, 10).forEach(cve => {
        const desc = cve.description.length > 80 ? cve.description.slice(0, 80) + "..." : cve.description;
        md += `| [${cve.id}](${cve.url}) | ${cve.score} | ${desc} | ${cve.published} |\n`;
      });
      md += `\n`;
    }

    // Medium + Low summary
    const medLowCount = cveData.grouped.medium.length + cveData.grouped.low.length;
    if (medLowCount > 0) {
      md += `> Plus ${cveData.grouped.medium.length} medium and ${cveData.grouped.low.length} low severity CVEs.\n\n`;
    }
    md += `---\n\n`;
  }

  // ========== NEW: SECURITY SCORES ==========
  if (securityScores && securityScores.repos.length > 0) {
    md += `## 📊 Security Scores\n\n`;
    md += `> Health grades for trending repos based on license, activity, issues, and CVE status.\n\n`;

    md += `**Average Score:** ${securityScores.avgScore}/100 | `;
    md += `**Grade Distribution:** `;
    md += `🟢A:${securityScores.gradeDistribution.A} `;
    md += `🟡B:${securityScores.gradeDistribution.B} `;
    md += `🟠C:${securityScores.gradeDistribution.C} `;
    md += `🔴D:${securityScores.gradeDistribution.D} `;
    md += `⛔F:${securityScores.gradeDistribution.F}\n\n`;

    // Top 10 by score
    md += `### Top Scored Repos\n\n`;
    md += `| # | Repo | Score | Grade | Stars | Flags |\n`;
    md += `|---|------|-------|-------|-------|-------|\n`;
    securityScores.repos.slice(0, 10).forEach((r, i) => {
      const flags = r.flags.length > 0 ? r.flags.join(", ") : "None";
      md += `| ${i + 1} | [${r.full_name}](${r.html_url}) | ${r.score}/100 | ${r.gradeEmoji} ${r.grade} | ${formatNum(r.stars)} | ${flags} |\n`;
    });
    md += `\n`;

    // Bottom 5 (lowest scores)
    const bottom5 = [...securityScores.repos].reverse().slice(0, 5);
    if (bottom5.some(r => r.score < 60)) {
      md += `### ⚠️ Repos Needing Attention\n\n`;
      md += `| Repo | Score | Grade | Issues |\n`;
      md += `|------|-------|-------|--------|\n`;
      bottom5.filter(r => r.score < 60).forEach(r => {
        const flags = r.flags.length > 0 ? r.flags.join(", ") : "None";
        md += `| [${r.full_name}](${r.html_url}) | ${r.score}/100 | ${r.gradeEmoji} ${r.grade} | ${flags} |\n`;
      });
      md += `\n`;
    }
    md += `---\n\n`;
  }

  // ========== WEEKLY PERSISTENT (existing) ==========
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

  // ========== MONTHLY CONSISTENT (existing) ==========
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

  // ========== DROPPED OFF (existing) ==========
  if (droppedOff.length > 0) {
    md += `## 📉 Dropped Off\n\n`;
    md += `> Were popular last week (3+ days) but haven't appeared this week. The hype may be over.\n\n`;
    droppedOff.slice(0, 10).forEach((r, i) => {
      md += `${i + 1}. ~~[${r.full_name}](${r.html_url})~~ — was ${r.appearances} days last week, now gone\n`;
    });
    md += `\n---\n\n`;
  }

  // ========== CATEGORY REPOS (existing) ==========
  for (const [id, cat] of Object.entries(data)) {
    if (cat.repos.length === 0) continue;

    md += `## ${cat.name}\n\n`;

    const top3 = cat.repos.slice(0, 3);
    if (top3.length > 0) {
      md += `### 🏅 Top 3 Today\n\n`;
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

  // ========== SUMMARY (existing + new) ==========
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
  if (totalAdvisories > 0) {
    md += `- **Security advisories:** ${totalAdvisories} new this week\n`;
  }
  if (cveData && cveData.total > 0) {
    md += `- **CVEs:** ${cveData.total} total (${cveData.criticalCount} critical, ${cveData.highCount} high)\n`;
  }
  if (securityScores) {
    md += `- **Avg security score:** ${securityScores.avgScore}/100\n`;
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

function generateTelegramMessage(data, hnStories, advisories = {}, securityScores = null, cveData = null) {
  const today = getToday();
  const allRepos = Object.values(data).flatMap(cat => cat.repos);
  const hottest = allRepos.filter(r => r.stars_per_day >= 5).sort((a, b) => b.stars_per_day - a.stars_per_day).slice(0, 5);
  const weeklyTrending = getWeeklyTrending();
  const totalAdvisories = Object.values(advisories).reduce((sum, arr) => sum + arr.length, 0);

  let msg = `🔭 <b>GitHub Radar — ${today}</b>\n\n`;

  // Security summary (NEW)
  if (totalAdvisories > 0 || (cveData && cveData.criticalCount > 0)) {
    msg += `🛡️ <b>Security Alert:</b>\n`;
    if (cveData && cveData.criticalCount > 0) {
      msg += `⚠️ ${cveData.criticalCount} CRITICAL CVEs this week\n`;
    }
    if (totalAdvisories > 0) {
      msg += `📋 ${totalAdvisories} security advisories\n`;
    }
    msg += `\n`;
  }

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