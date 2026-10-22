import { checkImageDimensions, inspectImage } from './imageQuality';
test('enforces image quality thresholds', () => {
  expect(() => checkImageDimensions(1200, 675)).not.toThrow();
  expect(() => checkImageDimensions(800, 450)).toThrow(/1200/);
  expect(() => checkImageDimensions(1600, 2000)).toThrow(/landscape/);
  expect(() => checkImageDimensions(8000, 5000)).toThrow(/megapixels/);
});
test('rejects unsupported URL schemes before loading', async () => {
  await expect(inspectImage('http://example.com/image.jpg')).rejects.toThrow(/HTTPS/);
  await expect(inspectImage('javascript:alert(1)')).rejects.toThrow(/HTTPS/);
});
test('uses decoded natural dimensions and reports loading errors', async () => {
  const OriginalImage = window.Image;
  let current;
  window.Image = class { constructor() { current = this; } };
  try {
    const good = inspectImage('https://example.com/good.jpg');
    current.naturalWidth = 1600; current.naturalHeight = 900; current.onload();
    await expect(good).resolves.toEqual({ width: 1600, height: 900 });
    const small = inspectImage('https://example.com/small.jpg');
    current.naturalWidth = 400; current.naturalHeight = 300; current.onload();
    await expect(small).rejects.toThrow(/1200/);
    const broken = inspectImage('https://example.com/missing.jpg'); current.onerror();
    await expect(broken).rejects.toThrow(/could not be loaded/);
  } finally { window.Image = OriginalImage; }
});
