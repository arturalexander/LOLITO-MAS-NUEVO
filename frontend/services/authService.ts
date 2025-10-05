const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  'https://wonderful-stillness-production.up.railway.app';

const FB_APP_ID = import.meta.env.VITE_FB_APP_ID || '1875210546681103';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: (() => void) | undefined;
  }
}

interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    pageName: string;
    instagramUsername?: string;
  };
  availablePages?: Array<{ id: string; name: string }>;
}

export class AuthService {
  private static sdkInitialized = false;
  private static sdkLoading = false;
  private static sdkLoadPromise: Promise<void> | null = null;

  static initFacebookSDK(): Promise<void> {
    if (this.sdkInitialized && window.FB) {
      return Promise.resolve();
    }

    if (this.sdkLoading && this.sdkLoadPromise) {
      return this.sdkLoadPromise;
    }

    this.sdkLoading = true;
    this.sdkLoadPromise = new Promise((resolve, reject) => {
      if (!document.getElementById('facebook-jssdk')) {
        const script = document.createElement('script');
        script.id = 'facebook-jssdk';
        script.src = 'https://connect.facebook.net/es_LA/sdk.js';
        script.async = true;
        script.defer = true;
        
        script.onerror = () => {
          this.sdkLoading = false;
          reject(new Error('Failed to load Facebook SDK'));
        };
        
        document.body.appendChild(script);
      }

      window.fbAsyncInit = () => {
        window.FB.init({
          appId: FB_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v23.0'
        });

        this.sdkInitialized = true;
        this.sdkLoading = false;
        console.log('Facebook SDK initialized');
        resolve();
      };

      setTimeout(() => {
        if (!this.sdkInitialized) {
          this.sdkLoading = false;
          reject(new Error('Facebook SDK initialization timeout'));
        }
      }, 10000);
    });

    return this.sdkLoadPromise;
  }

  static async loginWithFacebook(): Promise<AuthResponse> {
    try {
      await this.initFacebookSDK();

      return new Promise((resolve, reject) => {
        window.FB.login(
          (response: any) => {  // ✅ Sin async
            if (response.status === 'connected') {
              this.authenticateWithBackend(
                response.authResponse.accessToken
              ).then(authData => {
                localStorage.setItem('authToken', authData.token);
                localStorage.setItem('userData', JSON.stringify(authData.user));
                resolve(authData);
              }).catch(error => {
                reject(new Error(error.message || 'Authentication failed'));
              });
            } else {
              reject(new Error('Facebook login cancelled or failed'));
            }
          },
          {
            scope: 'pages_show_list,pages_read_engagement,pages_manage_posts',
            return_scopes: true
          }
        );
      });
    } catch (error: any) {
      throw error;
    }
  }

  static async authenticateWithBackend(facebookToken: string, selectedPageId?: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: facebookToken,
          selectedPageId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Authentication failed');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to authenticate with backend');
    }
  }

  static async checkAuthStatus(): Promise<boolean> {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      const data = await response.json();
      if (data.user) {
        localStorage.setItem('userData', JSON.stringify(data.user));
      }
      return data.authenticated;
    } catch (error) {
      return false;
    }
  }

  static logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    if (window.FB) {
      window.FB.logout();
    }
  }

  static getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  static getUserData(): any | null {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
}