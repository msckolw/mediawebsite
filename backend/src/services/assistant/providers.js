const { RULES } = require('./policy');

function settings() {
  return {
    openaiModel: process.env.ASSISTANT_LUNA_MODEL || 'gpt-6-luna',
    grokModel: process.env.ASSISTANT_GROK_MODEL || 'grok-4.7',
    maxOutput: 5000,
    enabled: process.env.ASSISTANT_ENABLED === 'true'
  };
}
function parseJson(value) {
  if (typeof value !== 'string') throw new Error('The provider returned no text.');
  try { return JSON.parse(value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()); }
  catch { throw new Error('The provider returned invalid JSON. Retry the saved assignment.'); }
}
function responseText(body) {
  return (body.output || []).filter(item => item.type === 'message')
    .flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item => item.text).join('');
}
function configured() {
  return !!(process.env.PARALLEL_API_KEY && process.env.OPENAI_API_KEY && process.env.XAI_API_KEY);
}

async function providerCall({ provider, prompt, reserve, settle, fetchImpl = fetch }) {
  if (!['openai', 'xai'].includes(provider)) throw new Error('Unknown writing or review provider.');
  const config = settings();
  if (!config.enabled) throw new Error('News Assistant is disabled. Configure it before starting research.');
  const key = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.XAI_API_KEY;
  if (!key) throw new Error(`${provider === 'openai' ? 'OpenAI' : 'xAI'} API key is not configured.`);
  if (Buffer.byteLength(prompt,'utf8') > 100000) throw new Error('Research context exceeds the configured input limit.');
  const model = provider === 'openai' ? config.openaiModel : config.grokModel;
  const body = provider === 'openai' ? {
    model, store: false, instructions: RULES, input: prompt,
    max_output_tokens: config.maxOutput
  } : {
    model, messages: [{ role: 'system', content: RULES }, { role: 'user', content: prompt }],
    max_tokens: config.maxOutput, response_format: { type: 'json_object' }
  };
  // Reserve before transmitting. Ambiguous failures retain this reservation;
  // retries can incur another charge, so they must be an explicit admin action.
  const ticket = await reserve(provider);
  let response;
  try {
    response = await fetchImpl(provider === 'openai' ? 'https://api.openai.com/v1/responses' : 'https://api.x.ai/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(120000)
    });
  } catch { throw new Error(`${provider} request timed out or could not connect. Its budget reservation was retained; review usage before retrying.`); }
  // Never expose provider response bodies: they can contain request fragments.
  if (!response.ok) throw new Error(`${provider} returned HTTP ${response.status}. Check model access, billing, and rate limits before retrying.`);
  const result = await response.json();
  const usage = result.usage || {};
  const inputTokens = Number(usage.input_tokens ?? usage.prompt_tokens ?? 0);
  // Count xAI reasoning separately when surfaced; conservative if a provider
  // includes it in completion_tokens. OpenAI output_tokens already includes it.
  const outputTokens = Number(usage.output_tokens ?? usage.completion_tokens ?? 0) +
    (provider === 'xai' ? Number(usage.completion_tokens_details?.reasoning_tokens ?? usage.reasoning_tokens ?? 0) : 0);
  const record = { provider, model, inputTokens, outputTokens, searchCalls: 0, requestId: result.id || '', at: new Date() };
  await settle(ticket, record);
  if ((result.status && result.status !== 'completed') || result.choices?.[0]?.finish_reason === 'length') throw new Error(`${provider} did not finish within the output limit. Usage was recorded.`);
  return { text: provider === 'openai' ? responseText(result) : result.choices?.[0]?.message?.content,
    usage: record };
}
module.exports = { settings, parseJson, responseText, configured, providerCall };
