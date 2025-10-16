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
    console.log('[FB-AUTH] 📄 Getting pages...');
    
    let allPages = [];

    // MÉTODO 1: Páginas personales (/me/accounts)
    try {
      const accountsResponse = await axios.get(`${FB_GRAPH_URL}/me/accounts`, {
        params: { 
          access_token: accessToken,
          fields: 'id,name,access_token,instagram_business_account{id,username}',
          limit: 100
        },
      });
      
      const personalPages = accountsResponse.data.data || [];
      console.log('[FB-AUTH] ✅ Found', personalPages.length, 'personal pages');
      allPages = allPages.concat(personalPages);
    } catch (error) {
      console.warn('[FB-AUTH] ⚠️ Could not get personal pages:', error.response?.data?.error?.message);
    }

    // MÉTODO 2: Páginas en Business Manager
    try {
      const businessesResponse = await axios.get(`${FB_GRAPH_URL}/me/businesses`, {
        params: {
          access_token: accessToken,
          fields: 'id,name',
          limit: 100
        }
      });

      const businesses = businessesResponse.data.data || [];
      console.log('[FB-AUTH] 📊 Found', businesses.length, 'businesses');

      // Para cada Business Manager, obtener sus páginas
      for (const business of businesses) {
        console.log('[FB-AUTH] 🔍 Getting pages for business:', business.name);
        
        // Intentar obtener owned_pages
        try {
          const ownedPagesResponse = await axios.get(`${FB_GRAPH_URL}/${business.id}/owned_pages`, {
            params: {
              access_token: accessToken,
              fields: 'id,name,access_token,instagram_business_account{id,username}',
              limit: 100
            }
          });
          
          const ownedPages = ownedPagesResponse.data.data || [];
          console.log('[FB-AUTH] ✅ Found', ownedPages.length, 'owned pages in', business.name);
          allPages = allPages.concat(ownedPages);
        } catch (error) {
          console.warn('[FB-AUTH] ⚠️ Could not get owned pages for', business.name);
        }

        // Intentar obtener client_pages
        try {
          const clientPagesResponse = await axios.get(`${FB_GRAPH_URL}/${business.id}/client_pages`, {
            params: {
              access_token: accessToken,
              fields: 'id,name,access_token,instagram_business_account{id,username}',
              limit: 100
            }
          });
          
          const clientPages = clientPagesResponse.data.data || [];
          console.log('[FB-AUTH] ✅ Found', clientPages.length, 'client pages in', business.name);
          allPages = allPages.concat(clientPages);
        } catch (error) {
          console.warn('[FB-AUTH] ⚠️ Could not get client pages for', business.name);
        }
      }
    } catch (error) {
      console.warn('[FB-AUTH] ⚠️ Could not get businesses:', error.response?.data?.error?.message);
    }

    // Eliminar duplicados
    const uniquePages = allPages.filter((page, index, self) =>
      index === self.findIndex((p) => p.id === page.id)
    );

    console.log('[FB-AUTH] 🎯 Total unique pages:', uniquePages.length);

    if (uniquePages.length === 0) {
      console.error('[FB-AUTH] ❌ No pages found with any method');
    }

    return uniquePages;
  } catch (error) {
    console.error('[FB-AUTH] ❌ Error fetching pages:', error.response?.data || error.message);
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

    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 60);

    // 🟢 INTENTA conectar Instagram, pero NO falla si no existe
    const instagramAccount = await this.getInstagramAccount(
      selectedPage.id, 
      selectedPage.access_token
    );

    // 🟢 Prepara datos base (solo Facebook)
    const baseData = {
      facebookUserId: userData.id,
      email: userData.email,
      pageId: selectedPage.id,
      pageName: selectedPage.name,
      pageAccessToken: selectedPage.access_token,
      userAccessToken: longLivedToken,
      tokenExpiry,
      availablePages: pages.map(p => ({ id: p.id, name: p.name })),
    };

    // 🟢 Si existe Instagram, añade los datos
    if (instagramAccount) {
      console.log(`✅ Instagram conectado: @${instagramAccount.username}`);
      return {
        ...baseData,
        instagramAccountId: instagramAccount.id,
        instagramUsername: instagramAccount.username,
      };
    }

    // 🟢 Si NO existe Instagram, continúa sin él
    console.warn('⚠️ Instagram no encontrado, continuando solo con Facebook');
    return {
      ...baseData,
      instagramAccountId: null,
      instagramUsername: null,
    };

  } catch (error) {
    console.error('Auth flow error:', error.message);
    throw error;
  }
}
}

module.exports = FacebookAuthService;