/**
 * GitHub Radar - Fetch Trending Repos
 */

const TOPICS = [
  {
    id: "ai-llm",
    name: "AI / LLM / Agents",
    queries: ["llm", "ai-agent", "large-language-model", "rag", "vector-database", "machine-learning", "mcp-server"],
  },
  {
    id: "crypto-web3",
    name: "Crypto / Web3",
    queries: ["solana", "defi", "ethereum", "web3", "bitcoin", "smart-contract", "nft", "blockchain"],
  },
  {
    id: "general",
    name: "General Trending",
    queries: [""],
  },
];

function getDateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

function formatNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k";
  return String(n);
}

async function fetchRepos(query, dateStr, token) {
  let q = `created:>${dateStr}`;
  if (query) q += ` topic:${query}`;

  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=15`;

  const headers = { Accept: "application/vnd.github.v3+json" };
  if (token) headers.Authorization = `token ${token}`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    console.error(`GitHub API error: ${res.status} for query: ${query}`);
    return [];
  }

  const data = await res.json();
  return data.items || [];
}

async function fetchAllTopics(token) {
  const dateStr = getDateStr(7);
  const now = new Date();
  const results = {};

  for (const topic of TOPICS) {
    console.log(`Fetching: ${topic.name}...`);
    const allRepos = [];
    const seenIds = new Set();

    for (const query of topic.queries) {
      await new Promise(r => setTimeout(r, 2000));

      const repos = await fetchRepos(query, dateStr, token);

      for (const repo of repos) {
        if (!seenIds.has(repo.id)) {
          seenIds.add(repo.id);
          const createdDays = Math.max(1, Math.floor((now - new Date(repo.created_at)) / 864e5));
          allRepos.push({
            full_name: repo.full_name,
            description: repo.description || "No description",
            html_url: repo.html_url,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language || "Unknown",
            topics: repo.topics || [],
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            stars_per_day: parseFloat((repo.stargazers_count / createdDays).toFixed(1)),
            open_issues: repo.open_issues_count,
            license: repo.license?.spdx_id || "None",
            owner_avatar: repo.owner?.avatar_url || "",
          });
        }
      }
    }

    allRepos.sort((a, b) => b.stars_per_day - a.stars_per_day);

    results[topic.id] = {
      name: topic.name,
      repos: allRepos.slice(0, 15),
    };
  }

  return results;
}

module.exports = { fetchAllTopics, TOPICS, formatNum };
