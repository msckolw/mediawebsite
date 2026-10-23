import { checkImageDimensions } from './imageQuality';

// Decode through a temporary blob URL; base64 is created only for the final,
// resized upload. Keep the original image-quality minimums.
export function prepareImageUpload(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
    return Promise.reject(new Error('Upload a JPEG, PNG, or WebP image no larger than 10 MB.'));
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not decode the image file.')); };
    image.onload = () => {
      URL.revokeObjectURL(url);
      try {
        checkImageDimensions(image.naturalWidth, image.naturalHeight);
        const scale = Math.min(1, 1600 / image.naturalWidth);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.naturalWidth * scale);
        canvas.height = Math.round(image.naturalHeight * scale);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Image processing is unavailable in this browser.');
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const readBlob = blob => {
          if (!blob) { reject(new Error('Could not prepare the image.')); return; }
          const reader = new FileReader();
          reader.onerror = () => reject(new Error('Could not read the prepared image.'));
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        };
        canvas.toBlob(blob => {
          // Older browsers may silently return PNG for an unsupported format.
          if (blob?.type === 'image/webp') readBlob(blob);
          else canvas.toBlob(readBlob, 'image/jpeg', 0.82);
        }, 'image/webp', 0.82);
      } catch (error) { reject(error); }
    };
    image.src = url;
  });
}
