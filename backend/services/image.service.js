import dns from "node:dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';
import AppError from '../utils/app-error.js';

const ensureConfigured = () => {
  if (!env.CLOUDINARY_CLOUD_NAME) throw new AppError('Image storage is not configured.', 503);
};

export const uploadImage = (file, folder) => {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(new AppError(`Image upload failed: ${error.message}`, 502));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(file.buffer);
  });
};

export const deleteImages = async (publicIds) => {
  if (!publicIds.length || !env.CLOUDINARY_CLOUD_NAME) return;
  await Promise.allSettled(publicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));
};
