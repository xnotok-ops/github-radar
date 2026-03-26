/**
 * GitHub Radar - CVE Fetcher
 * Fetches CVEs from NVD (National Vulnerability Database)
 */

const CVE_API_BASE = "https://services.nvd.nist.gov/rest/json/cves/2.0";

function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function getSeverityEmoji(severity) {
  const emojis = {
    CRITICAL: "🔴",
    HIGH: "🟠",
    MEDIUM: "🟡",
    LOW: "🟢",
  };
  return emojis[severity?.toUpperCase()] || "⚪";
}

async function fetchRecentCVEs(keyword = null, maxResults = 50) {
  const pubStartDate = getDateDaysAgo(7);
  const pubEndDate = new Date().toISOString();

  let url = `${CVE_API_BASE}?pubStartDate=${pubStartDate}&pubEndDate=${pubEndDate}&resultsPerPage=${maxResults}`;

  if (keyword) {
    url += `&keywordSearch=${encodeURIComponent(keyword)}`;
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.error(`NVD API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const cves = data.vulnerabilities || [];

    return cves.map((item) => {
      const cve = item.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0] || {};

      return {
        id: cve.id,
        description: cve.descriptions?.find((d) => d.lang === "en")?.value || "No description",
        severity: metrics.cvssData?.baseSeverity || "UNKNOWN",
        score: metrics.cvssData?.baseScore || 0,
        published: cve.published?.split("T")[0],
        url: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
      };
    });
  } catch (err) {
    console.error("Error fetching CVEs:", err.message);
    return [];
  }
}

async function fetchCVEsForRepos(repoData) {
  console.log("⚠️ Fetching CVE alerts...");

  // Extract unique keywords from repos (languages, topics)
  const keywords = new Set();

  for (const category of Object.values(repoData)) {
    for (const repo of category.repos) {
      // Add language
      if (repo.language && repo.language !== "Unknown") {
        keywords.add(repo.language.toLowerCase());
      }
      // Add first 2 topics
      if (repo.topics) {
        repo.topics.slice(0, 2).forEach((t) => keywords.add(t.toLowerCase()));
      }
    }
  }

  // Fetch CVEs for top keywords (limit to avoid rate limit)
  const topKeywords = ["javascript", "python", "react", "node", "django", "solana", "ethereum"];
  const relevantKeywords = [...keywords].filter((k) => topKeywords.includes(k)).slice(0, 5);

  const allCVEs = [];
  const seenIds = new Set();

  // First: fetch general recent CVEs
  console.log("  Fetching recent CVEs...");
  const recentCVEs = await fetchRecentCVEs(null, 30);
  for (const cve of recentCVEs) {
    if (!seenIds.has(cve.id)) {
      seenIds.add(cve.id);
      allCVEs.push(cve);
    }
  }

  // Then: fetch keyword-specific CVEs (with rate limiting)
  for (const keyword of relevantKeywords) {
    await new Promise((r) => setTimeout(r, 6000)); // NVD rate limit: 5 req/30sec
    console.log(`  Searching CVEs for: ${keyword}...`);

    const keywordCVEs = await fetchRecentCVEs(keyword, 10);
    for (const cve of keywordCVEs) {
      if (!seenIds.has(cve.id)) {
        seenIds.add(cve.id);
        cve.keyword = keyword;
        allCVEs.push(cve);
      }
    }
  }

  // Sort by severity
  const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, UNKNOWN: 4 };
  allCVEs.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Group by severity
  const grouped = {
    critical: allCVEs.filter((c) => c.severity === "CRITICAL"),
    high: allCVEs.filter((c) => c.severity === "HIGH"),
    medium: allCVEs.filter((c) => c.severity === "MEDIUM"),
    low: allCVEs.filter((c) => c.severity === "LOW"),
  };

  console.log(`✅ Found ${allCVEs.length} CVEs (${grouped.critical.length} critical, ${grouped.high.length} high)`);

  return {
    all: allCVEs,
    grouped,
    total: allCVEs.length,
    criticalCount: grouped.critical.length,
    highCount: grouped.high.length,
  };
}

module.exports = { fetchCVEsForRepos, fetchRecentCVEs, getSeverityEmoji };