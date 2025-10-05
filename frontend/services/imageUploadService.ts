const IMGBB_API_KEY = '71fac318587a5369bd3f418840f06a20'; // Obtén una gratis en https://api.imgbb.com/

export async function uploadBase64Image(base64Image: string): Promise<string> {
  // Remover el prefijo "data:image/...;base64,"
  const base64Data = base64Image.split(',')[1];
  
  const formData = new FormData();
  formData.append('image', base64Data);
  
  const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload image');
  }
  
  const data = await response.json();
  return data.data.url;
}