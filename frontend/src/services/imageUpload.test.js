import { prepareImageUpload } from './imageUpload';

let OriginalImage;
let context;
let canvasSize;
beforeEach(() => {
  OriginalImage = window.Image;
  URL.createObjectURL = jest.fn(() => 'blob:test-upload');
  URL.revokeObjectURL = jest.fn();
  context = { fillRect: jest.fn(), drawImage: jest.fn() };
  jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  jest.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (callback, type) {
    canvasSize = [this.width, this.height];
    callback(new Blob(['prepared-image'], { type }));
  });
  window.Image = class {
    naturalWidth = 3200;
    naturalHeight = 1800;
    set src(value) { Promise.resolve().then(() => this.onload()); }
  };
});
afterEach(() => { window.Image = OriginalImage; jest.restoreAllMocks(); });

test('resizes large images and produces a compact WebP upload through a blob URL', async () => {
  const result = await prepareImageUpload(new File(['original'], 'photo.jpg', { type: 'image/jpeg' }));
  expect(result).toMatch(/^data:image\/webp;base64,/);
  expect(canvasSize).toEqual([1600, 900]);
  expect(context.drawImage).toHaveBeenCalledTimes(1);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-upload');
});

test('falls back to JPEG when WebP encoding is unavailable', async () => {
  HTMLCanvasElement.prototype.toBlob.mockImplementation(function (callback, type) {
    callback(new Blob(['prepared-image'], { type: type === 'image/webp' ? 'image/png' : type }));
  });
  await expect(prepareImageUpload(new File(['original'], 'photo.jpg', { type: 'image/jpeg' })))
    .resolves.toMatch(/^data:image\/jpeg;base64,/);
});

test('retains image quality checks and rejects unsupported uploads before decoding', async () => {
  await expect(prepareImageUpload(new File(['x'], 'image.svg', { type: 'image/svg+xml' }))).rejects.toThrow(/JPEG/);
  expect(URL.createObjectURL).not.toHaveBeenCalled();
  window.Image = class {
    naturalWidth = 800;
    naturalHeight = 450;
    set src(value) { Promise.resolve().then(() => this.onload()); }
  };
  await expect(prepareImageUpload(new File(['x'], 'photo.jpg', { type: 'image/jpeg' }))).rejects.toThrow(/1200/);
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test-upload');
});
