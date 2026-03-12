/**
 * GitHub Radar - Hacker News AI Fetcher
 * Fetches top AI/LLM/ML stories from Hacker News (last 24h)
 */

const HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search";

const AI_QUERIES = [
  "AI",
  "LLM",
  "GPT",
  "Claude",
  "machine learning",
  "deep learning",
  "neural network",
  "transformer",
  "open source model",
  "AI agent",
];

function getTimestamp24hAgo() {
  return Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
}

async function fetchHNStories() {
  const since = getTimestamp24hAgo();
  const seen = new Set();
  const allStories = [];

  for (const query of AI_QUERIES) {
    const url = `${HN_SEARCH_URL}?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=10`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`  HN API error for "${query}": ${res.status}`);
        continue;
      }

      const data = await res.json();
      const hits = data.hits || [];

      for (const hit of hits) {
        if (seen.has(hit.objectID)) continue;
        seen.add(hit.objectID);

        allStories.push({
          id: hit.objectID,
          title: hit.title || "Untitled",
          url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
          hn_url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
          points: hit.points || 0,
          comments: hit.num_comments || 0,
          author: hit.author || "unknown",
          created_at: hit.created_at || "",
        });
      }

      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`  HN fetch error for "${query}": ${err.message}`);
    }
  }

  const sorted = allStories
    .sort((a, b) => b.points - a.points)
    .slice(0, 15);

  console.log(`  HN: ${allStories.length} unique stories found, top ${sorted.length} selected`);
  return sorted;
}

module.exports = { fetchHNStories };
