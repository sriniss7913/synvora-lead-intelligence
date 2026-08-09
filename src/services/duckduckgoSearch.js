/**
 * DuckDuckGo Free Instant Web Search Integration
 * Allows keyless search query discovery for any city and industry.
 */

export async function searchDuckDuckGo(searchQuery) {
  try {
    const encoded = encodeURIComponent(searchQuery);
    const url = `https://api.duckduckgo.com/?q=${encoded}&format=json&no_redirect=1&no_html=1`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    const results = [];
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.forEach(item => {
        if (item.Text && item.FirstURL) {
          const parts = item.Text.split(" - ");
          results.push({
            title: parts[0] || item.Text,
            snippet: parts[1] || item.Text,
            url: item.FirstURL
          });
        }
      });
    }
    return results;
  } catch (err) {
    console.warn("DuckDuckGo search fallback:", err);
    return [];
  }
}
