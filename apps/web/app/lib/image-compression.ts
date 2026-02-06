/**
 * Compress an image file to ensure it's under 5MB
 * Automatically resizes and reduces quality as needed
 */
export async function compressImage(file: File): Promise<File> {
  const maxSizeMB = 5;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // If already under size, return original
  if (file.size <= maxSizeBytes) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => reject(new Error('Fout bij lezen van bestand'));
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => reject(new Error('Fout bij laden van afbeelding'));
      
      img.onload = () => {
        try {
          // Calculate new dimensions (max 1920px)
          let { width, height } = img;
          const maxDimension = 1920;
          
          if (width > height && width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas niet beschikbaar'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Try different quality levels until under size limit
          let quality = 0.8;
          const tryCompress = () => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Fout bij comprimeren'));
                  return;
                }

                if (blob.size > maxSizeBytes && quality > 0.1) {
                  quality -= 0.1;
                  tryCompress();
                  return;
                }

                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });

                resolve(compressedFile);
              },
              'image/jpeg',
              quality
            );
          };

          tryCompress();
        } catch (error) {
          reject(error);
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
