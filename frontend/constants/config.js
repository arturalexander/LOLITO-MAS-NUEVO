const isDevelopment = import.meta.env.MODE === 'development';

export const config = {
  BACKEND_URL: isDevelopment 
    ? 'http://localhost:5000' 
    : 'https://wonderful-stillness-production.up.railway.app',
  FB_APP_ID: '12268279413618871',
};