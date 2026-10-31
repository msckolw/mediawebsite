const crypto = require('node:crypto');

function signature(id) {
  const secret = process.env.ASSISTANT_WORKER_SECRET || '';
  if (secret.length < 32) throw new Error('Configure an assistant worker secret of at least 32 characters.');
  return crypto.createHmac('sha256',secret).update(String(id)).digest('hex');
}
function validSignature(id, supplied) {
  try {
    const expected = Buffer.from(signature(id));
    const actual = Buffer.from(typeof supplied === 'string' ? supplied : '');
    return expected.length === actual.length && crypto.timingSafeEqual(expected,actual);
  } catch { return false; }
}
async function enqueue(id, fetchImpl = fetch) {
  if (process.env.ASSISTANT_QUEUE_MODE !== 'cloud-tasks') return;
  const parent = process.env.ASSISTANT_TASK_QUEUE;
  const workerUrl = process.env.ASSISTANT_WORKER_URL;
  if (!/^projects\/[\w-]+\/locations\/[\w-]+\/queues\/[\w-]+$/.test(parent || '') || !workerUrl?.startsWith('https://')) throw new Error('Configure the Cloud Tasks queue and HTTPS worker URL.');
  // Cloud Run's attached service account supplies credentials; no GCP private key.
  const tokenResponse = await fetchImpl('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
    headers:{'Metadata-Flavor':'Google'}, signal:AbortSignal.timeout(5000)
  });
  if (!tokenResponse.ok) throw new Error('Could not obtain Cloud Tasks credentials.');
  const token = await tokenResponse.json();
  const result = await fetchImpl(`https://cloudtasks.googleapis.com/v2/${parent}/tasks`, {
    method:'POST', headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'},
    body:JSON.stringify({task:{dispatchDeadline:'1800s', httpRequest:{httpMethod:'POST',url:workerUrl,
      headers:{'Content-Type':'application/json','X-Assistant-Signature':signature(id)},
      body:Buffer.from(JSON.stringify({assignmentId:String(id)})).toString('base64')}}}), signal:AbortSignal.timeout(15000)
  });
  if (!result.ok) throw new Error('Cloud Tasks dispatch failed. The assignment is saved; retry dispatch from its review screen.');
}
module.exports = { enqueue, signature, validSignature };
