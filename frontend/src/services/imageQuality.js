export function checkImageDimensions(width, height) {
  if (width < 1200 || height < 675) throw new Error('Use an image at least 1200 × 675 pixels.');
  if (width * height > 24000000) throw new Error('Use an image no larger than 24 megapixels.');
  if (width / height < 1.2 || width / height > 2.2) throw new Error('Use a landscape image with a width-to-height ratio between 1.2 and 2.2.');
}

function loadImage(value) {
  if (!value) return Promise.reject(new Error('Add an image URL or upload an image.'));
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(value)) {
    try { const url = new URL(value); if (url.protocol !== 'https:' || url.username || url.password) throw new Error(); }
    catch { return Promise.reject(new Error('Use a direct HTTPS image URL.')); }
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    const cleanup = () => { clearTimeout(timer); image.onload = null; image.onerror = null; };
    const timer = setTimeout(() => { cleanup(); image.src = ''; reject(new Error('Image took too long to load. Try another image URL.')); }, 12000);
    image.onload = () => {
      cleanup();
      try { checkImageDimensions(image.naturalWidth, image.naturalHeight); resolve({ width: image.naturalWidth, height: image.naturalHeight }); }
      catch (error) { reject(error); }
    };
    image.onerror = () => { cleanup(); reject(new Error('Image could not be loaded. Use a direct JPEG, PNG, or WebP URL.')); };
    image.src = value;
  });
}

const recentChecks = new Map();
export function inspectImage(value) {
  const previous = recentChecks.get(value);
  if (previous && previous.expires > Date.now()) return previous.promise;
  const promise = loadImage(value);
  const entry = { promise, expires: Date.now() + 60000 };
  recentChecks.set(value, entry);
  while (recentChecks.size > 4) recentChecks.delete(recentChecks.keys().next().value);
  promise.catch(() => { if (recentChecks.get(value) === entry) recentChecks.delete(value); });
  return promise;
}
