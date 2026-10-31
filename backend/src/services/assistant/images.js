const crypto = require('node:crypto');
const { publicUrl } = require('../imagePolicy');

async function storeImage(imageUrl, fetchImpl = fetch) {
  const bucket = process.env.ASSISTANT_IMAGE_BUCKET;
  if (!bucket) return imageUrl; // Preserve the existing inline-upload behavior locally.
  if (!/^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/.test(bucket)) throw new Error('Invalid assistant image bucket.');
  const base = publicUrl(process.env.ASSISTANT_IMAGE_PUBLIC_BASE_URL || `https://storage.googleapis.com/${bucket}`).href.replace(/\/$/,'');
  const match = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(imageUrl);
  if (!match) throw new Error('Upload an image file for cloud storage.');
  const bytes = Buffer.from(match[2],'base64');
  const name = `assistant/${crypto.createHash('sha256').update(bytes).digest('hex')}.${match[1] === 'jpeg' ? 'jpg' : match[1]}`;
  const tokenResult = await fetchImpl('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',{
    headers:{'Metadata-Flavor':'Google'},signal:AbortSignal.timeout(5000)
  });
  if (!tokenResult.ok) throw new Error('Could not obtain image-storage credentials.');
  const token = await tokenResult.json();
  const result = await fetchImpl(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&ifGenerationMatch=0&name=${encodeURIComponent(name)}`,{
    method:'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':`image/${match[1]}`},body:bytes,signal:AbortSignal.timeout(30000)
  });
  if (!result.ok && result.status !== 412) throw new Error('Image storage upload failed.');
  return `${base}/${name}`;
}
module.exports = { storeImage };
