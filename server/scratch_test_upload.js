import path from 'path';
import fs from 'fs';
import { uploadToCloud } from './src/config/cloudinary.js';

async function testFileUpload() {
  console.log('Testing file upload handler...');

  // Create a dummy test file in uploads/
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const dummyFilePath = path.join(uploadsDir, 'test-id-card.png');
  fs.writeFileSync(dummyFilePath, 'dummy image content');

  const resultUrl = await uploadToCloud(dummyFilePath, 'student_ids');
  console.log('RESULT FILE URL:', resultUrl);

  if (resultUrl && (resultUrl.startsWith('/uploads/') || resultUrl.startsWith('http'))) {
    console.log('SUCCESS: Upload URL generated correctly! User uploaded image will be rendered cleanly.');
  } else {
    console.error('FAIL: Invalid URL returned:', resultUrl);
  }
}

testFileUpload();
