import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';
import { config } from './env.js';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true
});

export const uploadToCloudinary = async (filePath, folder = 'campusbridge_uploads') => {
  // Accept either a folder name (e.g. "resumes") or a full existing
  // Cloudinary path (e.g. "campusbridge/resumes") without duplicating root.
  const normalizedFolder = String(folder || 'campusbridge_uploads')
    .replace(/^\/+|\/+$/g, '')
    .replace(/^campusbridge\/+/, '');
  try {
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
      console.warn('[Cloudinary Warning] CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing. Upload stored locally instead.');
      return `/uploads/${path.basename(filePath)}`;
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: `campusbridge/${normalizedFolder}`,
      resource_type: 'auto'
    });

    return result.secure_url;
  } catch (error) {
    console.error('[Cloudinary Upload Failed]', {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
      folder: normalizedFolder
    });
    return `/uploads/${path.basename(filePath)}`;
  }
};

/**
 * Automatically backs up uploaded resumes to Cloudinary with local storage fallback
 */
export const uploadResumeBackup = async ({
  documentBase64 = '',
  documentMimeType = 'application/pdf',
  fileName = 'resume.pdf',
  resumeText = '',
  userId = 'student'
}) => {
  const timestamp = Date.now();
  const sanitizedName = (fileName || 'resume.pdf').replace(/[^a-zA-Z0-9.-]/g, '_');
  const publicId = `resume_${userId}_${timestamp}`;
  let cloudinaryUrl = null;

  // 1. Attempt Cloudinary Cloud Upload
  if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
    try {
      let uploadPayload = documentBase64;
      if (!uploadPayload && resumeText) {
        uploadPayload = `data:text/plain;base64,${Buffer.from(resumeText).toString('base64')}`;
      }

      if (uploadPayload) {
        const result = await cloudinary.uploader.upload(uploadPayload, {
          folder: 'campusbridge/resumes',
          public_id: publicId,
          resource_type: 'auto'
        });

        cloudinaryUrl = result.secure_url;
      }
    } catch (cloudErr) {
      console.warn(`[Cloudinary Notice] Cloudinary upload (${cloudErr.message}). Backing up to local storage directory...`);
    }
  }

  // 2. Safe Local Storage Backup (server/uploads/resumes/)
  try {
    const uploadDir = path.join(process.cwd(), 'uploads', 'resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const localFileName = `${publicId}_${sanitizedName}`;
    const localFilePath = path.join(uploadDir, localFileName);

    if (documentBase64) {
      const cleanBase64 = documentBase64.replace(/^data:[^;]+;base64,/, '');
      fs.writeFileSync(localFilePath, Buffer.from(cleanBase64, 'base64'));
    } else if (resumeText) {
      fs.writeFileSync(localFilePath, resumeText, 'utf8');
    }

    const localUrl = `/uploads/resumes/${localFileName}`;
    return {
      url: cloudinaryUrl || localUrl,
      provider: cloudinaryUrl ? 'Cloudinary Cloud Storage' : 'Local Disk Backup (/uploads/resumes)',
      cloudinary_url: cloudinaryUrl,
      local_path: localFilePath,
      backed_up_at: new Date().toISOString()
    };
  } catch (diskErr) {
    console.error('[Backup Error] Failed to write backup to disk:', diskErr.message);
    return null;
  }
};

export const uploadToCloud = uploadToCloudinary;
export { cloudinary };
