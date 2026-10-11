import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiError } from '../shared/ApiError.js';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml'
  ];

  if (allowedImageTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Invalid file type '${file.mimetype}'. Only photo/image files (PNG, JPG, WEBP, SVG) are accepted. PDF or document files are not allowed.`), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for ID images
  fileFilter
});

const documentAndMediaFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf', '.doc', '.docx', '.txt', '.ppt', '.pptx', '.xls', '.xlsx',
    '.png', '.jpg', '.jpeg', '.webp', '.svg', '.zip', '.csv', '.rtf'
  ];
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.includes('pdf') ||
    file.mimetype.includes('document') ||
    file.mimetype.includes('word') ||
    file.mimetype.includes('sheet') ||
    file.mimetype.includes('presentation') ||
    file.mimetype.includes('zip') ||
    file.mimetype.includes('text') ||
    allowedExtensions.includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Unsupported file format '${ext}'. Please upload a document (.pdf, .doc, .docx, .txt, .zip) or image (.png, .jpg).`), false);
  }
};

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for study materials, resumes & job descriptions
  fileFilter: documentAndMediaFilter
});

