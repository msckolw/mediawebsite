const crypto = require('crypto');

const GATEWAYS = ['payu', 'phonepe'];

function configuredGateways(method, platform) {
  const enabled = String(process.env.PAYMENT_ENABLED_GATEWAYS || 'phonepe')
    .split(',').map(value => value.trim().toLowerCase());
  return GATEWAYS.filter(gateway => {
    if (!enabled.includes(gateway)) return false;
    if (gateway === 'payu') {
      if (!process.env.PAYU_MERCHANT_KEY || !process.env.PAYU_MERCHANT_SALT) return false;
      // Merchant-hosted cards require PCI certification. DBQR is UPI only.
      if (platform === 'web' && (method !== 'upi' || process.env.PAYU_DBQR_ENABLED !== 'true')) return false;
      if (platform === 'app') return false;
      return true;
    }
    return Boolean(process.env.PHONEPE_CLIENT_ID && process.env.PHONEPE_CLIENT_SECRET && process.env.PHONEPE_CLIENT_VERSION);
  });
}

function selectGateway(method, platform) {
  const candidates = configuredGateways(method, platform);
  if (!candidates.length) throw new Error('No payment gateway is available for this method.');
  const weighted = candidates.map(gateway => ({
    gateway,
    weight: Math.max(0, Number(process.env[`PAYMENT_${gateway.toUpperCase()}_WEIGHT`] || 1))
  }));
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (!total) throw new Error('No payment gateway is enabled for traffic.');
  let choice = crypto.randomInt(0, 1000000) / 1000000 * total;
  for (const entry of weighted) {
    choice -= entry.weight;
    if (choice < 0) return entry.gateway;
  }
  return weighted[weighted.length - 1].gateway;
}

module.exports = { selectGateway, configuredGateways };
