const https = require('node:https');
const dns = require('node:dns').promises;
const ipaddr = require('ipaddr.js');
const { imageSize } = require('image-size');

const MAX_BYTES = 10 * 1024 * 1024;

function publicUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Enter a valid HTTPS image or source URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) {
    throw new Error('Use a public HTTPS URL without credentials or a custom port.');
  }
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || url.hostname.endsWith('.local')) {
    throw new Error('Local image URLs are not supported.');
  }
  return url;
}

function isPublicAddress(address) {
  try { return ipaddr.process(address).range() === 'unicast'; } catch { return false; }
}

async function downloadImage(value, redirects = 0, lookup = dns.lookup) {
  const url = publicUrl(value);
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) throw new Error('Image URL must resolve only to public addresses.');
  // Pin the checked address to prevent DNS rebinding between validation and connection.
  const address = addresses[0];
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      lookup: (_host, options, callback) => options?.all ? callback(null, [address]) : callback(null, address.address, address.family),
      headers: { Accept: 'image/jpeg,image/png,image/webp', 'User-Agent': 'NoBiasMedia-ImageCheck/1.0' }
    }, response => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume();
        if (redirects >= 3 || !response.headers.location) return reject(new Error('Too many image redirects. Use a direct image URL.'));
        let next;
        try { next = new URL(response.headers.location, url).href; } catch { return reject(new Error('Invalid image redirect.')); }
        resolve(downloadImage(next, redirects + 1, lookup));
        return;
      }
      if (response.statusCode !== 200) { response.resume(); reject(new Error('The image host did not return an accessible image.')); return; }
      if (!/^image\/(jpeg|png|webp)(;|$)/i.test(response.headers['content-type'] || '')) {
        response.resume(); reject(new Error('Use a direct JPEG, PNG, or WebP image URL.')); return;
      }
      let length = 0;
      const chunks = [];
      response.on('data', chunk => {
        length += chunk.length;
        if (length > MAX_BYTES) { request.destroy(new Error('Image must be 10 MB or smaller.')); return; }
        chunks.push(chunk);
      });
      response.on('error', reject);
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });
    const deadline = setTimeout(() => request.destroy(new Error('Image check timed out. Try a different image host.')), 12000);
    request.on('close', () => clearTimeout(deadline));
    request.on('error', reject);
  });
}

function checkDimensions(width, height) {
  if (width < 1200 || height < 675) throw new Error('Image must be at least 1200 × 675 pixels. Use the original-size image.');
  if (width * height > 24000000) throw new Error('Image must be 24 megapixels or smaller.');
  if (width / height < 1.2 || width / height > 2.2) throw new Error('Choose a landscape image with a width-to-height ratio between 1.2 and 2.2.');
}

async function validateArticleImage(imageUrl, download = downloadImage) {
  if (typeof imageUrl !== 'string' || !imageUrl) throw new Error('Add an image before publishing.');
  let bytes;
  if (imageUrl.startsWith('data:')) {
    if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(imageUrl) || imageUrl.length > Math.ceil(MAX_BYTES * 4 / 3) + 50) throw new Error('Upload a JPEG, PNG, or WebP image under 10 MB.');
    bytes = Buffer.from(imageUrl.split(',')[1], 'base64');
  } else { bytes = await download(publicUrl(imageUrl).href); }
  if (!bytes.length || bytes.length > MAX_BYTES) throw new Error('Image must be 10 MB or smaller.');
  let dimensions;
  try { dimensions = imageSize(bytes); } catch { throw new Error('The image file could not be read. Use a JPEG, PNG, or WebP image.'); }
  if (!['jpg', 'png', 'webp'].includes(dimensions.type)) throw new Error('Only JPEG, PNG, and WebP images are supported.');
  checkDimensions(dimensions.width, dimensions.height);
  return { imageMetadata: { width: dimensions.width, height: dimensions.height, checkedAt: new Date() } };
}
module.exports = { publicUrl, isPublicAddress, checkDimensions, validateArticleImage, downloadImage };
