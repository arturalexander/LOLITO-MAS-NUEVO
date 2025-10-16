const axios = require('axios');

const FB_GRAPH_URL = 'https://graph.facebook.com/v23.0';
const BACKEND_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : 'https://wonderful-stillness-production-6167.up.railway.app';

class InstagramService {
  // Convertir URL externa a proxy
// Convertir URL externa a proxy
  static proxyImageUrl(originalUrl) {
    // HCTI siempre funciona directo
    if (originalUrl.includes('hcti.io')) {
      console.log('[IG] ✅ HCTI URL, using direct');
      return originalUrl;
    }
    
    // ImgBB y otras URLs acortadas → SIEMPRE usar proxy
    if (originalUrl.includes('ibb.co') || originalUrl.includes('imgur.com')) {
      console.log('[IG] ⚠️ Shortened URL detected, using proxy');
      const hash = Buffer.from(originalUrl).toString('base64').substring(0, 10);
      return `${BACKEND_URL}/proxy/image/${hash}?url=${encodeURIComponent(originalUrl)}`;
    }
    
    // URLs externas → usar proxy
    const hash = Buffer.from(originalUrl).toString('base64').substring(0, 10);
    const proxiedUrl = `${BACKEND_URL}/proxy/image/${hash}?url=${encodeURIComponent(originalUrl)}`;
    console.log('[IG] 🔗 Proxying:', originalUrl.substring(0, 50) + '...');
    return proxiedUrl;
  }

  static async createMediaContainer(igUserId, imageUrl, caption, pageAccessToken, isCarouselItem = false) {
    const params = {
      image_url: imageUrl,
      access_token: pageAccessToken,
    };

    if (isCarouselItem) {
      params.is_carousel_item = true;
    } else if (caption) {
      params.caption = caption;
    }
    
    const response = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media`, null, { params });
    console.log('[IG] ✅ Container created:', response.data.id);
    return response.data.id;
  }

  static async createCarouselContainer(igUserId, imageUrls, caption, pageAccessToken) {
    console.log('[IG] 🎠 Creating carousel with', imageUrls.length, 'images');
    
    const childrenIds = [];
    for (const [index, imageUrl] of imageUrls.entries()) {
      console.log(`[IG] 📷 Processing image ${index + 1}/${imageUrls.length}`);
      
      // Usar proxy para URLs externas
      const processedUrl = this.proxyImageUrl(imageUrl);
      
      const containerId = await this.createMediaContainer(
        igUserId, 
        processedUrl, 
        null, 
        pageAccessToken, 
        true
      );
      
      childrenIds.push(containerId);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('[IG] 🎠 Creating carousel container...');
    const response = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media`, null, {
      params: {
        media_type: 'CAROUSEL',
        children: childrenIds.join(','),
        caption: caption,
        access_token: pageAccessToken,
      },
    });
    
    console.log('[IG] ✅ Carousel created:', response.data.id);
    return response.data.id;
  }

  static async publishMedia(igUserId, creationId, pageAccessToken) {
    console.log('[IG] ⏳ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      console.log('[IG] 🚀 Publishing...');
      const response = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media_publish`, null, {
        params: {
          creation_id: creationId,
          access_token: pageAccessToken,
        },
      });
      
      console.log('[IG] ✅ Published:', response.data.id);
      return response.data.id;
    } catch (error) {
      if (error.response?.data?.error?.code === 9007) {
        console.log('[IG] ⏳ Still processing, retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const retryResponse = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media_publish`, null, {
          params: {
            creation_id: creationId,
            access_token: pageAccessToken,
          },
        });
        return retryResponse.data.id;
      }
      
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  static async publishSinglePost(igUserId, imageUrl, caption, pageAccessToken) {
    const processedUrl = this.proxyImageUrl(imageUrl);
    const creationId = await this.createMediaContainer(
      igUserId, 
      processedUrl, 
      caption, 
      pageAccessToken,
      false
    );
    return await this.publishMedia(igUserId, creationId, pageAccessToken);
  }

  static async publishCarousel(igUserId, imageUrls, caption, pageAccessToken) {
    if (imageUrls.length < 2 || imageUrls.length > 10) {
      throw new Error('Carousel must have 2-10 images');
    }
    const creationId = await this.createCarouselContainer(igUserId, imageUrls, caption, pageAccessToken);
    return await this.publishMedia(igUserId, creationId, pageAccessToken);
  }
}

module.exports = InstagramService;