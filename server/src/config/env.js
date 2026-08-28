import dotenv from 'dotenv';
dotenv.config();

const cleanEnv = (val, fallback) => {
  if (!val) return fallback;
  return val.replace(/['";,]/g, '').trim();
};

export const config = {
  port: Number(cleanEnv(process.env.PORT, '5001')) || 5001,
  jwtSecret: cleanEnv(process.env.JWT_SECRET, 'campusbridge_super_secret_jwt_key_2026'),
  jwtExpiresIn: cleanEnv(process.env.JWT_EXPIRES_IN, '7d'),
  mysql: {
    host: cleanEnv(process.env.DB_HOST, 'localhost'),
    user: cleanEnv(process.env.DB_USER, 'root'),
    password: cleanEnv(process.env.DB_PASSWORD, ''),
    database: cleanEnv(process.env.DB_NAME, 'campusbridge'),
    port: Number(cleanEnv(process.env.DB_PORT, '3306')) || 3306
  },
  cloudinary: {
    cloudName: cleanEnv(process.env.CLOUDINARY_CLOUD_NAME, ''),
    apiKey: cleanEnv(process.env.CLOUDINARY_API_KEY, ''),
    apiSecret: cleanEnv(process.env.CLOUDINARY_API_SECRET, '')
  },
  openaiApiKey: cleanEnv(process.env.OPENAI_API_KEY, ''),
  geminiApiKey: cleanEnv(process.env.GEMINI_API_KEY, '')
};
