import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { config } from './env.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true
});

export const uploadToCloudinary = async (filePath, folder = 'campusbridge_uploads') => {
  try {
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      console.warn('[Cloudinary Warning] Credentials missing in .env. Falling back to local upload directory.');
      return `/uploads/${path.basename(filePath)}`;
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: `campusbridge/${folder}`,
      resource_type: 'auto'
    });

    console.log(`[Cloudinary Success] File uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.warn(`[Cloudinary Fallback] Could not upload to Cloudinary (${error.message}). Returning local storage path.`);
    return `/uploads/${path.basename(filePath)}`;
  }
};

export const uploadToCloud = uploadToCloudinary;
export { cloudinary };
