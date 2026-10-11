import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

const dummy = 'data:text/plain;base64,' + Buffer.from('test').toString('base64');
const candidates = [
  'c-1308b01ed2dbc75c3cf9a356f80a2f',
  '1308b01ed2dbc75c3cf9a356f80a2f',
  'alumni_portal',
  'alumni-portal',
  'alumniportal'
];

async function testUpload() {
  for (const name of candidates) {
    try {
      cloudinary.config({
        cloud_name: name,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
      console.log(`Testing upload with cloud_name: "${name}"...`);
      const res = await cloudinary.uploader.upload(dummy, { folder: 'test' });
      console.log(`SUCCESS! URL:`, res.secure_url);
      break;
    } catch (e) {
      console.log(`Failed for "${name}":`, e.message || e);
    }
  }
  process.exit(0);
}

testUpload();
