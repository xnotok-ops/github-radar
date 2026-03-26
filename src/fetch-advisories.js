/**
 * GitHub Radar - Fetch Security Advisories
 * Fetches recent security advisories from GitHub Advisory Database
 */

const ECOSYSTEMS = ["npm", "pip", "go", "maven", "rubygems"];

function getDateDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

async function fetchAdvisoriesForEcosystem(ecosystem, token) {
  const since = getDateDaysAgo(7);
  const url = `https://api.github.com/advisories?type=reviewed&ecosystem=${ecosystem}&per_page=20&sort=published&direction=desc`;

  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `token ${token}`;

  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.error(`Advisory API error: ${res.status} for ${ecosystem}`);
      return [];
    }

    const data = await res.json();

    return data
      .filter((adv) => adv.published_at >= since)
      .map((adv) => ({
        id: adv.ghsa_id,
        severity: adv.severity,
        summary: adv.summary,
        package: adv.vulnerabilities?.[0]?.package?.name || "unknown",
        vulnerable_versions: adv.vulnerabilities?.[0]?.vulnerable_version_range || "unknown",
        patched_versions: adv.vulnerabilities?.[0]?.patched_versions || "unknown",
        published_at: adv.published_at?.split("T")[0],
        url: adv.html_url,
      }));
  } catch (err) {
    console.error(`Error fetching ${ecosystem} advisories:`, err.message);
    return [];
  }
}

async function fetchAllAdvisories(token) {
  console.log("🛡️ Fetching security advisories...");

  const results = {};
  let total = 0;

  for (const ecosystem of ECOSYSTEMS) {
    await new Promise((r) => setTimeout(r, 1000));

    const advisories = await fetchAdvisoriesForEcosystem(ecosystem, token);
    results[ecosystem] = advisories;
    total += advisories.length;

    if (advisories.length > 0) {
      console.log(`  ${ecosystem}: ${advisories.length} advisories`);
    }
  }

  console.log(`✅ Total advisories: ${total}`);
  return results;
}

module.exports = { fetchAllAdvisories, ECOSYSTEMS };