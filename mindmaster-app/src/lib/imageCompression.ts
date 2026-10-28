/**
 * Client-Side Image Compression Utility
 * Resizes images to max 1200px width/height and compresses to WebP/JPEG (0.8 quality)
 * to save Supabase Storage quota and optimize student mobile load speeds.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImageClient(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    mimeType = "image/webp",
  } = options;

  // If not in browser or not an image, return original file
  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }

  // If file is already tiny (< 100KB), no need to compress
  if (file.size <= 100 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // Only use compressed if it actually reduced file size
            if (blob.size >= file.size) {
              resolve(file);
              return;
            }

            const cleanName = file.name.replace(/\.[^/.]+$/, "");
            const ext = mimeType === "image/webp" ? ".webp" : ".jpg";
            const compressedFile = new File([blob], `${cleanName}${ext}`, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = readerEvent.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
