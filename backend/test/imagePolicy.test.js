const test = require('node:test');
const assert = require('node:assert/strict');
const { checkDimensions, publicUrl, isPublicAddress, validateArticleImage, downloadImage } = require('../src/services/imagePolicy');
function png(width, height) {
  const b = Buffer.alloc(33);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(b);
  b.writeUInt32BE(13, 8); b.write('IHDR', 12); b.writeUInt32BE(width, 16); b.writeUInt32BE(height, 20);
  b[24] = 8; b[25] = 2;
  return b;
}
test('quality rules reject small, portrait, panoramic and excessive-resolution images', () => {
  for (const dimensions of [[800, 450], [1000, 1600], [3000, 700], [8000, 5000]]) assert.throws(() => checkDimensions(...dimensions));
  assert.doesNotThrow(() => checkDimensions(1200, 675));
  assert.doesNotThrow(() => checkDimensions(1600, 1200));
});
test('server inspects actual image bytes, without license requirements', async () => {
  const result = await validateArticleImage('https://example.com/photo.png', async () => png(1600, 900));
  assert.equal(result.imageMetadata.width, 1600);
  assert.equal(result.imageMetadata.height, 900);
  await assert.rejects(validateArticleImage('https://example.com/photo.png', async () => png(800, 450)), /1200/);
  await assert.rejects(validateArticleImage('https://example.com/photo.png', async () => Buffer.from('<html>not a photo</html>')), /could not be read/);
  const uploaded = await validateArticleImage('data:image/png;base64,' + png(1200, 675).toString('base64'));
  assert.equal(uploaded.imageMetadata.width, 1200);
  await assert.rejects(validateArticleImage('data:image/svg+xml;base64,PHN2Zz4='), /JPEG/);
  await assert.rejects(validateArticleImage('https://example.com/big.jpg', async () => Buffer.alloc(10 * 1024 * 1024 + 1)), /10 MB/);
});
test('remote image URLs reject unsafe protocols, credentials, ports, and private DNS answers', async () => {
  for (const url of ['http://example.com/a.jpg', 'https://user:secret@example.com/a.jpg', 'https://example.com:8080/a.jpg', 'https://localhost/a.jpg']) assert.throws(() => publicUrl(url));
  for (const address of ['127.0.0.1', '10.1.1.1', '169.254.169.254', '192.168.1.2', '::1', '::ffff:127.0.0.1', 'fc00::1']) assert.equal(isPublicAddress(address), false);
  assert.equal(isPublicAddress('8.8.8.8'), true);
  await assert.rejects(downloadImage('https://example.com/a.jpg', 0, async () => [{ address: '127.0.0.1', family: 4 }]), /public addresses/);
});
