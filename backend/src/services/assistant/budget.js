const Budget = require('../../models/AssistantBudget');

const monthId = () => new Date().toISOString().slice(0, 7);
function monthlyLimit() {
  const value = Number(process.env.ASSISTANT_MONTHLY_BUDGET_USD || 20);
  if (!Number.isFinite(value) || value <= 0) throw new Error('Configure a positive assistant monthly budget.');
  return Math.floor(value * 1000000);
}
async function reserve(provider, options = {}) {
  const id = monthId();
  const ceiling = monthlyLimit();
  // Search has a fixed per-request rate; writing/review retain a conservative
  // allowance. Neither estimate replaces provider-side spend limits.
  const amount = provider === 'parallel' ? Math.ceil(options.searchRateUsd * 1000000) : 750000;
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Invalid assistant budget reservation.');
  try { await Budget.updateOne({ _id: id }, { $setOnInsert: { reservedMicros: 0, calls: 0 } }, { upsert: true }); }
  catch (error) { if (error.code !== 11000) throw error; }
  const result = await Budget.findOneAndUpdate({ _id: id, reservedMicros: { $lte: ceiling - amount }, calls: { $lt: 3000 } },
    { $inc: { reservedMicros: amount, calls: 1 } }, { new: true });
  if (!result) throw new Error('Assistant monthly allowance reached or insufficient remaining allowance for another call.');
  return { id, amount };
}
function estimateMicros(record) {
  if (record.provider === 'parallel') {
    if (!Number.isInteger(record.searchCalls) || record.searchCalls <= 0 || !Number.isFinite(record.searchRateUsd) || record.searchRateUsd <= 0) throw new Error('Invalid Parallel search usage.');
    return Math.ceil(record.searchCalls * record.searchRateUsd * 1000000);
  }
  if (!['openai','xai'].includes(record.provider)) throw new Error('Unknown assistant usage provider.');
  const luna = record.provider === 'openai';
  const inputRate = Number(process.env[luna ? 'ASSISTANT_LUNA_INPUT_USD_PER_M' : 'ASSISTANT_GROK_INPUT_USD_PER_M'] || (luna ? 0.10 : 2));
  const outputRate = Number(process.env[luna ? 'ASSISTANT_LUNA_OUTPUT_USD_PER_M' : 'ASSISTANT_GROK_OUTPUT_USD_PER_M'] || (luna ? 0.50 : 6));
  if (![inputRate, outputRate].every(n => Number.isFinite(n) && n >= 0)) throw new Error('Invalid assistant pricing configuration.');
  return Math.ceil(record.inputTokens * inputRate + record.outputTokens * outputRate + record.searchCalls * 10000);
}
async function settle(ticket, record) {
  // Missing usage is an ambiguous charge: retain the full reservation.
  const actual = record.provider === 'parallel' || record.inputTokens > 0 ? estimateMicros(record) : ticket.amount;
  record.estimatedUsd = actual / 1000000;
  await Budget.updateOne({ _id: ticket.id }, { $inc: { reservedMicros: actual - ticket.amount } });
}
async function summary() {
  const record = await Budget.findById(monthId()).lean();
  return { month: monthId(), allowanceUsd: monthlyLimit() / 1000000,
    estimatedAndReservedUsd: (record?.reservedMicros || 0) / 1000000, calls: record?.calls || 0 };
}
module.exports = { reserve, settle, summary, estimateMicros };
