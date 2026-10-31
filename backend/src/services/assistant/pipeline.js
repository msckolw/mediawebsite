const { RULES, validateDraft, validateReview, sourceUrl } = require('./policy');
const { parseJson } = require('./providers');
const { readSources } = require('./research');

const draftFormat = `Return {"title":"...","summary":"...","content":"paragraphs separated by newlines", "sourceIds":["S1","S2"], "claims":[{"claim":"specific factual statement","sourceIds":["S1"]}]}. Include the important factual claims in the evidence map. Use at least two distinct outlet domains. Select only sources relevant to the assigned topic. Do not include research notes or review instructions in publishable text.`;
function evidence(job) {
  return JSON.stringify({ topic:job.topic, context:job.context, dateRange:[job.fromDate,job.toDate],
    sources:job.research.sources.filter(s => s.status === 'read') });
}
async function nextStep(job, call, read = readSources) {
  if (job.stage === 'research') {
    const response = await call('parallel', job);
    const candidates = [...job.seedUrls.map(url => ({url})), ...response.sources].filter(candidate => {
      try { sourceUrl(candidate.url,job.outlets); return true; } catch { return false; }
    });
    // Save discovery before page reads so a resumed read does not repeat paid search.
    return { research:{candidates}, stage:'read_sources' };
  }
  if (job.stage === 'read_sources') {
    const candidates = job.research.candidates;
    const sources = await read(candidates,job);
    const readable = sources.filter(s => s.status === 'read');
    const warnings = job.outlets.filter(o => !readable.some(s => s.outlet === o.name)).map(o => `No readable, date-verified coverage retrieved from ${o.name}.`);
    if (readable.length < 2) return { research:{sources}, warnings, stage:'research_insufficient', status:'failed', error:'Fewer than two sources were readable and date-verified. Create an assignment with additional links or outlets.' };
    return { research:{sources}, warnings, stage:'draft' };
  }
  const sources = job.research.sources;
  if (job.stage === 'draft' || /^revise[12]$/.test(job.stage)) {
    const revision = job.stage !== 'draft';
    const response = await call('openai', `${RULES}\n${revision ? 'Revise the supplied draft using supported review findings. Explain unresolved issues in the separate revisionNotes field. Never invent evidence to satisfy a reviewer.' : 'Write the assigned news article using only relevant supplied evidence.'}\n${draftFormat}\nEVIDENCE: ${evidence(job)}\n${revision ? JSON.stringify({draft:job.draft, review:job.reviews.at(-1)}) : ''}`);
    const result = parseJson(response.text);
    const draft = validateDraft(result,sources);
    const notes = typeof result.revisionNotes === 'string' ? result.revisionNotes.slice(0,3000) : '';
    const stage = job.stage === 'draft' ? 'review1' : job.stage === 'revise1' ? 'review2' : 'complete';
    return { draft, versions:[...job.versions,{ ...draft, stage:job.stage, notes, at:new Date() }], stage,
      ...(stage === 'complete' ? {status:'ready', warnings:[...job.warnings,'The final Luna revision has not received a third Grok review. Check remaining findings before publishing.']} : {}) };
  }
  if (/^review[12]$/.test(job.stage)) {
    const response = await call('xai', `Review this draft for unsupported claims, misleading framing, loaded language, missing context, attribution, contradictions, and false balance. Do not certify it as unbiased. An outlet label is not evidence for or against a claim. Findings must cite supplied source IDs where evidence applies. Return {"summary":"...","findings":[{"severity":"minor|major|critical","passage":"exact draft passage","issue":"...","correction":"...","sourceIds":["S1"]}]}. Use an empty findings array only if no actionable issues were found.\nEVIDENCE: ${evidence(job)}\nDRAFT: ${JSON.stringify(job.draft)}`);
    const review = { ...validateReview(parseJson(response.text),sources), round:job.stage === 'review1' ? 1 : 2, at:new Date() };
    return { reviews:[...job.reviews,review], stage:review.findings.length ? (review.round === 1 ? 'revise1' : 'revise2') : 'complete',
      ...(!review.findings.length ? {status:'ready'} : {}) };
  }
  throw new Error('Unknown assistant workflow stage.');
}
module.exports = { nextStep };
