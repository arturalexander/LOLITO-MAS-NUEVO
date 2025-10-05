const axios = require('axios');

const FB_GRAPH_URL = 'https://graph.facebook.com/v21.0';

class InstagramService {
  static async createMediaContainer(igUserId, imageUrl, caption, pageAccessToken) {
    try {
      const response = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media`, null, {
        params: {
          image_url: imageUrl,
          caption: caption,
          access_token: pageAccessToken,
        },
      });
      return response.data.id;
    } catch (error) {
      throw new Error(`Failed to create media container: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  static async createCarouselContainer(igUserId, imageUrls, caption, pageAccessToken) {
    try {
      const childrenIds = [];
      for (const imageUrl of imageUrls) {
        const response = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media`, null, {
          params: {
            image_url: imageUrl,
            is_carousel_item: true,
            access_token: pageAccessToken,
          },
        });
        childrenIds.push(response.data.id);
      }

      const response = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media`, null, {
        params: {
          media_type: 'CAROUSEL',
          children: childrenIds.join(','),
          caption: caption,
          access_token: pageAccessToken,
        },
      });
      return response.data.id;
    } catch (error) {
      throw new Error(`Failed to create carousel: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  static async publishMedia(igUserId, creationId, pageAccessToken) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const response = await axios.post(`${FB_GRAPH_URL}/${igUserId}/media_publish`, null, {
        params: {
          creation_id: creationId,
          access_token: pageAccessToken,
        },
      });
      return response.data.id;
    } catch (error) {
      throw new Error(`Failed to publish media: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  static async publishSinglePost(igUserId, imageUrl, caption, pageAccessToken) {
    const creationId = await this.createMediaContainer(igUserId, imageUrl, caption, pageAccessToken);
    return await this.publishMedia(igUserId, creationId, pageAccessToken);
  }

  static async publishCarousel(igUserId, imageUrls, caption, pageAccessToken) {
    if (imageUrls.length < 2 || imageUrls.length > 10) {
      throw new Error('Carousel must have between 2 and 10 images');
    }
    const creationId = await this.createCarouselContainer(igUserId, imageUrls, caption, pageAccessToken);
    return await this.publishMedia(igUserId, creationId, pageAccessToken);
  }
}

module.exports = InstagramService;