/**
 * Compress an image file to max 400px width, JPEG quality 0.7
 * Returns a base64 data URL
 */
export async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxWidth = 400;
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };
    img.src = objectUrl;
  });
}

export function saveArticleImage(articleNo: string, dataUrl: string): void {
  localStorage.setItem(`articleImage_${articleNo}`, dataUrl);
}

export function getArticleImage(articleNo: string): string | null {
  return localStorage.getItem(`articleImage_${articleNo}`);
}

export function deleteArticleImage(articleNo: string): void {
  localStorage.removeItem(`articleImage_${articleNo}`);
}
