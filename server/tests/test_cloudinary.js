import { uploadToCloudinary } from '../src/config/cloudinary.js';
import dotenv from 'dotenv';
dotenv.config();

async function testCloudinary() {
  console.log('Testing Cloudinary upload...');
  const dummyBase64 = 'data:text/plain;base64,' + Buffer.from('Test resume backup content').toString('base64');
  try {
    const url = await uploadToCloudinary(dummyBase64, 'resumes');
    console.log('Uploaded Cloudinary URL:', url);
  } catch (err) {
    console.error('Cloudinary error:', err);
  }
  process.exit(0);
}
testCloudinary();
