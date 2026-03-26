/**
 * GitHub Radar - Security Score Calculator
 * Calculates security health score for each repo
 */

/**
 * Scoring Factors:
 * - Has LICENSE: +15 pts
 * - Recent activity (< 30 days): +20 pts
 * - Low issue ratio (issues/stars < 0.1): +15 pts
 * - Has description: +10 pts
 * - No known CVEs: +40 pts (checked separately)
 * Total possible: 100 pts
 */

function calculateBaseScore(repo) {
  let score = 0;
  const flags = [];

  // 1. Has LICENSE (+15)
  if (repo.license && repo.license !== "None") {
    score += 15;
  } else {
    flags.push("No license");
  }

  // 2. Recent activity - last update within 30 days (+20)
  const lastUpdate = new Date(repo.updated_at);
  const daysSinceUpdate = Math.floor((Date.now() - lastUpdate) / (1000 * 60 * 60 * 24));
  if (daysSinceUpdate <= 30) {
    score += 20;
  } else {
    flags.push(`Stale (${daysSinceUpdate}d)`);
  }

  // 3. Low issue ratio - open_issues / stars < 0.1 (+15)
  const issueRatio = repo.stars > 0 ? repo.open_issues / repo.stars : 1;
  if (issueRatio < 0.1) {
    score += 15;
  } else {
    flags.push("High issue ratio");
  }

  // 4. Has description (+10)
  if (repo.description && repo.description !== "No description") {
    score += 10;
  } else {
    flags.push("No description");
  }

  // 5. CVE check placeholder (+40) - will be added by CVE module
  // Default: assume no CVEs, add 40 points
  // This will be adjusted when CVE data is available
  score += 40;

  return { score, flags };
}

function getGrade(score) {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  if (score >= 20) return "D";
  return "F";
}

function getGradeEmoji(grade) {
  const emojis = {
    A: "🟢",
    B: "🟡",
    C: "🟠",
    D: "🔴",
    F: "⛔",
  };
  return emojis[grade] || "❓";
}

function scoreAllRepos(repoData) {
  console.log("📊 Calculating security scores...");

  const scoredRepos = [];

  for (const category of Object.values(repoData)) {
    for (const repo of category.repos) {
      const { score, flags } = calculateBaseScore(repo);
      const grade = getGrade(score);

      scoredRepos.push({
        full_name: repo.full_name,
        html_url: repo.html_url,
        score,
        grade,
        gradeEmoji: getGradeEmoji(grade),
        flags,
        stars: repo.stars,
      });
    }
  }

  // Sort by score descending
  scoredRepos.sort((a, b) => b.score - a.score);

  const avgScore = scoredRepos.length > 0
    ? Math.round(scoredRepos.reduce((sum, r) => sum + r.score, 0) / scoredRepos.length)
    : 0;

  console.log(`✅ Scored ${scoredRepos.length} repos (avg: ${avgScore})`);

  return {
    repos: scoredRepos,
    avgScore,
    gradeDistribution: {
      A: scoredRepos.filter((r) => r.grade === "A").length,
      B: scoredRepos.filter((r) => r.grade === "B").length,
      C: scoredRepos.filter((r) => r.grade === "C").length,
      D: scoredRepos.filter((r) => r.grade === "D").length,
      F: scoredRepos.filter((r) => r.grade === "F").length,
    },
  };
}

module.exports = { scoreAllRepos, calculateBaseScore, getGrade, getGradeEmoji };