// Scope initial server data to its exact route; never reuse it for another feed.
export function initialFeed(category) {
  try {
    const value = JSON.parse(document.getElementById('nbm-feed-data')?.textContent || 'null');
    return value && value.category === (category || null) && Array.isArray(value.articles) ? value : null;
  } catch { return null; }
}
export function initialSource(id) {
  try {
    const value = JSON.parse(document.getElementById('nbm-source-data')?.textContent || 'null');
    return value?._id === id ? value : null;
  } catch { return null; }
}
