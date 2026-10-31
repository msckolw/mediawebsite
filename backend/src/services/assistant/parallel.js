const SEARCH_RATES = { turbo: 0.001, fast: 0.001, basic: 0.005, advanced: 0.005 };

function searchSettings() {
  const mode = process.env.ASSISTANT_PARALLEL_SEARCH_MODE || 'fast';
  if (!Object.hasOwn(SEARCH_RATES, mode)) throw new Error('Choose a supported Parallel search mode: turbo, fast, basic, or advanced.');
  const rateUsd = Number(process.env.ASSISTANT_PARALLEL_SEARCH_USD_PER_REQUEST ?? SEARCH_RATES[mode]);
  if (!Number.isFinite(rateUsd) || rateUsd <= 0) throw new Error('Configure a positive Parallel search price per request.');
  return { mode, rateUsd };
}

async function parallelSearch({ assignment, reserve, settle, fetchImpl = fetch }) {
  if (process.env.ASSISTANT_ENABLED !== 'true') throw new Error('News Assistant is disabled. Configure it before starting research.');
  if (!process.env.PARALLEL_API_KEY) throw new Error('Parallel API key is not configured.');
  const { mode, rateUsd } = searchSettings();
  const domains = [...new Set(assignment.outlets.flatMap(outlet => outlet.domains))];
  if (!domains.length) throw new Error('Select source domains before searching.');
  // Search is retrieval only. Excerpts and search dates never replace the
  // backend's independent page reads and publication-date checks.
  const payload = {
    mode,
    objective: `Find news articles about ${assignment.topic}. Editorial context: ${assignment.context || 'None'}. Publication dates must be between ${assignment.fromDate} and ${assignment.toDate}, inclusive. Search only the selected outlets.`,
    search_queries: [assignment.topic],
    max_chars_total: 1000,
    advanced_settings: {
      max_results: 10,
      source_policy: { include_domains: domains, after_date: assignment.fromDate }
    }
  };
  const ticket = await reserve('parallel', { searchRateUsd: rateUsd });
  let response;
  try {
    response = await fetchImpl('https://api.parallel.ai/v1/search', {
      method: 'POST',
      headers: { 'x-api-key': process.env.PARALLEL_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(120000)
    });
  } catch {
    throw new Error('Parallel search timed out or could not connect. Its budget reservation was retained; review usage before retrying.');
  }
  // Provider bodies can contain request fragments. Do not expose them in errors.
  if (!response.ok) throw new Error(`Parallel returned HTTP ${response.status}. Check billing and rate limits before retrying. Its budget reservation was retained.`);
  let result;
  try { result = await response.json(); }
  catch { throw new Error('Parallel returned unreadable search data. Its budget reservation was retained.'); }
  const record = {
    provider: 'parallel', model: `parallel-search/${mode}`, searchMode: mode,
    searchRateUsd: rateUsd, searchCalls: 1, inputTokens: 0, outputTokens: 0,
    requestId: typeof result?.search_id === 'string' ? result.search_id : '', at: new Date()
  };
  await settle(ticket, record);
  if (!Array.isArray(result?.results)) throw new Error('Parallel returned invalid search results. Usage was recorded.');
  // Only actual result URLs enter the candidate list. Never use model-authored
  // URLs, snippets, or search metadata as article evidence.
  const sources = result.results.slice(0, 10)
    .filter(source => source && typeof source.url === 'string')
    .map(source => ({ url: source.url, title: typeof source.title === 'string' ? source.title.slice(0, 300) : '' }));
  return { sources, usage: record };
}

module.exports = { searchSettings, parallelSearch };
