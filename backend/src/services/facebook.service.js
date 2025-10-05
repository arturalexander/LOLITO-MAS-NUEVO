const axios = require('axios');

const FB_GRAPH_URL = 'https://graph.facebook.com/v23.0';

class FacebookService {
  static async publishPhoto(pageId, imageUrl, message, accessToken) {
    try {
      const response = await axios.post(
        `${FB_GRAPH_URL}/${pageId}/photos`,
        {
          url: imageUrl,
          message: message,
          access_token: accessToken
        }
      );

      return response.data.id;
    } catch (error) {
      console.error('Facebook photo error:', error.response?.data);
      throw new Error(error.response?.data?.error?.message || 'Failed to post to Facebook');
    }
  }

  static async publishCarousel(pageId, imageUrls, message, accessToken) {
    try {
      // Paso 1: Crear contenedores para cada imagen
      const attachedMediaIds = [];
      
      for (const imageUrl of imageUrls) {
        const response = await axios.post(
          `${FB_GRAPH_URL}/${pageId}/photos`,
          {
            url: imageUrl,
            published: false, // No publicar aún
            access_token: accessToken
          }
        );
        attachedMediaIds.push({ media_fbid: response.data.id });
      }

      // Paso 2: Publicar el post con todas las imágenes
      const postResponse = await axios.post(
        `${FB_GRAPH_URL}/${pageId}/feed`,
        {
          message: message,
          attached_media: JSON.stringify(attachedMediaIds),
          access_token: accessToken
        }
      );

      return postResponse.data.id;
    } catch (error) {
      console.error('Facebook carousel error:', error.response?.data);
      throw new Error(error.response?.data?.error?.message || 'Failed to post carousel to Facebook');
    }
  }
}

module.exports = FacebookService;