const axios = require('axios');

const FB_GRAPH_URL = 'https://graph.facebook.com/v23.0';
const BACKEND_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : 'https://wonderful-stillness-production-6167.up.railway.app';

class FacebookService {
  // Convertir URL externa a proxy (igual que Instagram)
  static proxyImageUrl(originalUrl) {
    // HCTI siempre funciona directo
    if (originalUrl.includes('hcti.io')) {
      console.log('[FB] ✅ HCTI URL, using direct');
      return originalUrl;
    }
    
    // ImgBB y otras URLs acortadas → SIEMPRE usar proxy
    if (originalUrl.includes('ibb.co') || originalUrl.includes('imgur.com')) {
      console.log('[FB] ⚠️ Shortened URL detected, using proxy');
      const hash = Buffer.from(originalUrl).toString('base64').substring(0, 10);
      return `${BACKEND_URL}/proxy/image/${hash}?url=${encodeURIComponent(originalUrl)}`;
    }
    
    // URLs externas → usar proxy
    const hash = Buffer.from(originalUrl).toString('base64').substring(0, 10);
    const proxiedUrl = `${BACKEND_URL}/proxy/image/${hash}?url=${encodeURIComponent(originalUrl)}`;
    console.log('[FB] 🔗 Proxying:', originalUrl.substring(0, 50) + '...');
    return proxiedUrl;
  }

  static async publishPhoto(pageId, imageUrl, message, accessToken) {
    try {
      console.log('[FB] 📷 Publishing single photo');
      
      // Usar proxy si es necesario
      const processedUrl = this.proxyImageUrl(imageUrl);
      
      const response = await axios.post(
        `${FB_GRAPH_URL}/${pageId}/photos`,
        {
          url: processedUrl,
          message: message,
          access_token: accessToken
        }
      );

      console.log('[FB] ✅ Photo published:', response.data.id);
      return response.data.id;
    } catch (error) {
      console.error('Facebook photo error:', error.response?.data);
      throw new Error(error.response?.data?.error?.message || 'Failed to post to Facebook');
    }
  }

  static async publishCarousel(pageId, imageUrls, message, accessToken) {
    try {
      console.log('[FB] 🎠 Creating carousel with', imageUrls.length, 'images');
      
      // Paso 1: Crear contenedores para cada imagen
      const attachedMediaIds = [];
      
      for (const [index, imageUrl] of imageUrls.entries()) {
        console.log(`[FB] 📷 Processing image ${index + 1}/${imageUrls.length}`);
        
        // Usar proxy si es necesario
        const processedUrl = this.proxyImageUrl(imageUrl);
        
        const response = await axios.post(
          `${FB_GRAPH_URL}/${pageId}/photos`,
          {
            url: processedUrl,
            published: false,
            access_token: accessToken
          }
        );
        
        console.log('[FB] ✅ Container created:', response.data.id);
        attachedMediaIds.push({ media_fbid: response.data.id });
        
        // Pequeña pausa entre requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Paso 2: Publicar el post con todas las imágenes
      console.log('[FB] 🚀 Publishing carousel post...');
      const postResponse = await axios.post(
        `${FB_GRAPH_URL}/${pageId}/feed`,
        {
          message: message,
          attached_media: JSON.stringify(attachedMediaIds),
          access_token: accessToken
        }
      );

      console.log('[FB] ✅ Carousel published:', postResponse.data.id);
      return postResponse.data.id;
    } catch (error) {
      console.error('Facebook carousel error:', error.response?.data);
      throw new Error(error.response?.data?.error?.message || 'Failed to post carousel to Facebook');
    }
  }
}

module.exports = FacebookService;