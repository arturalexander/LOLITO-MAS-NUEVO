const fetch = require('node-fetch');
const FormData = require('form-data');

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '71fac318587a5369bd3f418840f06a20';

async function uploadBase64Image(base64Image) {
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  const formData = new FormData();
  formData.append('image', base64Data);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload image to ImgBB');
  }
  
  const data = await response.json();
  return data.data.url;
}

module.exports = { uploadBase64Image };
