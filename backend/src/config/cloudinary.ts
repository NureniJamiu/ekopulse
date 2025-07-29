import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

console.log('[Cloudinary] Configuring with:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
  api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface UploadOptions {
  resource_type?: string;
  folder?: string;
  transformation?: any[];
  quality?: string;
}

const uploadToCloudinary = async (
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    console.log('[Cloudinary] Starting upload with buffer size:', buffer.length);

    cloudinary.uploader.upload_stream(
      {
        resource_type: 'image' as const,
        folder: 'ekopulse/issues',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto:good' }
        ],
        ...options
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error);
          reject(error);
        } else if (result) {
          console.log('[Cloudinary] Upload successful:', result.secure_url);
          resolve(result);
        } else {
          console.error('[Cloudinary] Upload failed - no result returned');
          reject(new Error('Upload failed - no result returned'));
        }
      }
    ).end(buffer);
  });
};

export { cloudinary, uploadToCloudinary };
