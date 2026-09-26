const Donation = require('../models/Donation');
const Payment = require('../models/Payment');

async function applyVerifiedStatus(payment, status, details = {}) {
  if (!['pending', 'success', 'failed'].includes(status)) return payment;
  // A late failure must never overwrite a confirmed success.
  const query = status === 'success' ? { _id: payment._id } :
    status === 'failed' ? { _id: payment._id, status: { $ne: 'success' } } :
      { _id: payment._id, status: 'pending' };
  const updated = await Payment.findOneAndUpdate(query, {
    $set: { status, updatedAt: new Date(), ...details }
  }, { new: true });
  const result = updated || await Payment.findById(payment._id);
  if (result?.donation && result.status === 'success') {
    await Donation.findByIdAndUpdate(result.donation, { $set: { status: 'success' } });
  }
  return result;
}

module.exports = { applyVerifiedStatus };
