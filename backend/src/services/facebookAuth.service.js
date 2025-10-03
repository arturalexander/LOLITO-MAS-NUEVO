const axios = require('axios');

const FB_GRAPH_URL = 'https://graph.facebook.com/v21.0';
const FB_APP_ID = process.env.FB_APP_ID;
const FB_APP_SECRET = process.env.FB_APP_SECRET;

class FacebookAuthService {
  static async exchangeForLongLivedToken(shortLivedToken) {
    try {
      const response = await axios.get(`${FB_GRAPH_URL}/oauth/access_token`, {
        params: {
          grant_type: 'fb_exchange_token',
          client_id: FB_APP_ID,
          client_secret: FB_APP_SECRET,
          fb_exchange_token: shortLivedToken,
        },
      });
      return response.data.access_token;
    } catch (error) {
      console.error('Error exchanging token:', error.response?.data || error.message);
      throw new Error('Failed to exchange token');
    }
  }

  static async getUserData(accessToken) {
    try {
      const response = await axios.get(`${FB_GRAPH_URL}/me`, {
        params: {
          fields: 'id,name,email',
          access_token: accessToken,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user data:', error.response?.data || error.message);
      throw new Error('Failed to fetch user data');
    }
  }

  static async getUserPages(accessToken) {
    try {
      const response = await axios.get(`${FB_GRAPH_URL}/me/accounts`, {
        params: { access_token: accessToken },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching pages:', error.response?.data || error.message);
      throw new Error('Failed to fetch Facebook pages');
    }
  }

  static async getInstagramAccount(pageId, pageAccessToken) {
    try {
      const response = await axios.get(`${FB_GRAPH_URL}/${pageId}`, {
        params: {
          fields: 'instagram_business_account',
          access_token: pageAccessToken,
        },
      });

      if (!response.data.instagram_business_account) {
        return null;
      }

      const igAccountId = response.data.instagram_business_account.id;
      const igResponse = await axios.get(`${FB_GRAPH_URL}/${igAccountId}`, {
        params: {
          fields: 'username',
          access_token: pageAccessToken,
        },
      });

      return {
        id: igAccountId,
        username: igResponse.data.username,
      };
    } catch (error) {
      console.error('Error fetching Instagram account:', error.response?.data || error.message);
      return null;
    }
  }

  static async completeAuthFlow(shortLivedToken, selectedPageId) {
    try {
      const longLivedToken = await this.exchangeForLongLivedToken(shortLivedToken);
      const userData = await this.getUserData(longLivedToken);
      const pages = await this.getUserPages(longLivedToken);

      if (pages.length === 0) {
        throw new Error('No Facebook pages found');
      }

      const selectedPage = selectedPageId 
        ? pages.find(p => p.id === selectedPageId) || pages[0]
        : pages[0];

      const instagramAccount = await this.getInstagramAccount(selectedPage.id, selectedPage.access_token);

      if (!instagramAccount) {
        throw new Error('No Instagram Business Account linked');
      }

      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 60);

      return {
        facebookUserId: userData.id,
        email: userData.email,
        pageId: selectedPage.id,
        pageName: selectedPage.name,
        pageAccessToken: selectedPage.access_token,
        instagramAccountId: instagramAccount.id,
        instagramUsername: instagramAccount.username,
        userAccessToken: longLivedToken,
        tokenExpiry,
        availablePages: pages.map(p => ({ id: p.id, name: p.name })),
      };
    } catch (error) {
      console.error('Auth flow error:', error.message);
      throw error;
    }
  }
}

module.exports = FacebookAuthService;