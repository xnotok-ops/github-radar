/**
 * GitHub Radar - History Tracker
 * Tracks repo popularity across days to detect weekly/monthly trends
 */

const fs = require("fs");
const path = require("path");

const historyPath = path.join(__dirname, "..", "digests", "history.json");

function loadHistory() {
  try {
    if (fs.existsSync(historyPath)) {
      return JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    }
  } catch (e) {
    console.error("Error loading history:", e.message);
  }
  return { daily: {}, repos: {} };
}

function saveHistory(history) {
  const dir = path.dirname(historyPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), "utf-8");
  console.log("History saved: " + historyPath);
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function recordDaily(data) {
  const history = loadHistory();
  const today = getToday();

  const todayEntry = {};
  for (const [catId, cat] of Object.entries(data)) {
    todayEntry[catId] = cat.repos.map(r => ({
      full_name: r.full_name,
      stars: r.stars,
      stars_per_day: r.stars_per_day,
      language: r.language,
      html_url: r.html_url,
      description: (r.description || "").slice(0, 120),
    }));
  }
  history.daily[today] = todayEntry;

  const allRepos = Object.values(data).flatMap(cat => cat.repos);
  for (const repo of allRepos) {
    const key = repo.full_name;
    if (!history.repos[key]) {
      history.repos[key] = {
        first_seen: today,
        last_seen: today,
        days_seen: 1,
        peak_stars: repo.stars,
        peak_spd: repo.stars_per_day,
        language: repo.language,
        html_url: repo.html_url,
        description: (repo.description || "").slice(0, 120),
      };
    } else {
      history.repos[key].last_seen = today;
      history.repos[key].days_seen += 1;
      if (repo.stars > history.repos[key].peak_stars) {
        history.repos[key].peak_stars = repo.stars;
      }
      if (repo.stars_per_day > history.repos[key].peak_spd) {
        history.repos[key].peak_spd = repo.stars_per_day;
      }
    }
  }

  const cutoff = daysAgo(today, 35);
  for (const date of Object.keys(history.daily)) {
    if (date < cutoff) delete history.daily[date];
  }
  for (const [key, info] of Object.entries(history.repos)) {
    if (info.last_seen < cutoff) delete history.repos[key];
  }

  saveHistory(history);
  return history;
}

function getWeeklyTrending() {
  const history = loadHistory();
  const today = getToday();
  const weekAgo = daysAgo(today, 7);

  const weeklyCount = {};
  for (const [date, categories] of Object.entries(history.daily)) {
    if (date >= weekAgo && date <= today) {
      const allRepos = Object.values(categories).flat();
      for (const repo of allRepos) {
        if (!weeklyCount[repo.full_name]) {
          weeklyCount[repo.full_name] = { ...repo, appearances: 0 };
        }
        weeklyCount[repo.full_name].appearances += 1;
        weeklyCount[repo.full_name].stars = repo.stars;
        weeklyCount[repo.full_name].stars_per_day = repo.stars_per_day;
      }
    }
  }

  return Object.values(weeklyCount)
    .filter(r => r.appearances >= 3)
    .sort((a, b) => b.appearances - a.appearances || b.stars_per_day - a.stars_per_day);
}

function getMonthlyConsistent() {
  const history = loadHistory();
  const today = getToday();
  const monthAgo = daysAgo(today, 30);

  const monthlyCount = {};
  for (const [date, categories] of Object.entries(history.daily)) {
    if (date >= monthAgo && date <= today) {
      const allRepos = Object.values(categories).flat();
      for (const repo of allRepos) {
        if (!monthlyCount[repo.full_name]) {
          monthlyCount[repo.full_name] = { ...repo, appearances: 0 };
        }
        monthlyCount[repo.full_name].appearances += 1;
        monthlyCount[repo.full_name].stars = repo.stars;
        monthlyCount[repo.full_name].stars_per_day = repo.stars_per_day;
      }
    }
  }

  return Object.values(monthlyCount)
    .filter(r => r.appearances >= 10)
    .sort((a, b) => b.appearances - a.appearances || b.stars - a.stars);
}

function getDroppedOff() {
  const history = loadHistory();
  const today = getToday();
  const weekAgo = daysAgo(today, 7);
  const twoWeeksAgo = daysAgo(today, 14);

  const thisWeek = new Set();
  for (const [date, categories] of Object.entries(history.daily)) {
    if (date >= weekAgo && date <= today) {
      Object.values(categories).flat().forEach(r => thisWeek.add(r.full_name));
    }
  }

  const lastWeekCount = {};
  for (const [date, categories] of Object.entries(history.daily)) {
    if (date >= twoWeeksAgo && date < weekAgo) {
      Object.values(categories).flat().forEach(r => {
        if (!lastWeekCount[r.full_name]) lastWeekCount[r.full_name] = { ...r, appearances: 0 };
        lastWeekCount[r.full_name].appearances += 1;
      });
    }
  }

  return Object.values(lastWeekCount)
    .filter(r => r.appearances >= 3 && !thisWeek.has(r.full_name))
    .sort((a, b) => b.appearances - a.appearances);
}

module.exports = { recordDaily, getWeeklyTrending, getMonthlyConsistent, getDroppedOff, loadHistory };
