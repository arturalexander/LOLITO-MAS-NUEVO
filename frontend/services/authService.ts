const BACKEND_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:5000'
  : 'https://wonderful-stillness-production.up.railway.app';

const FB_APP_ID = '12268279413618871';

interface AuthResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    email: string;
    pageName: string;
    instagramUsername: string;
  };
  availablePages?: Array<{ id: string; name: string }>;
}

export class AuthService {
  static initFacebookSDK(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).FB) {
        resolve();
        return;
      }

      (window as any).fbAsyncInit = function () {
        (window as any).FB.init({
          appId: FB_APP_ID,
          cookie: true,
          xfbml: true,
          version: 'v20.0'
        });
        resolve();
      };
    });
  }

  static async loginWithFacebook(): Promise<AuthResponse> {
    await this.initFacebookSDK();

    return new Promise((resolve, reject) => {
      (window as any).FB.login(
        (response: any) => {  // ✅ función normal
          if (response.status === 'connected') {
            (async () => {  // IIFE async dentro del callback
              try {
                const authData = await this.authenticateWithBackend(response.authResponse.accessToken);
                localStorage.setItem('authToken', authData.token);
                localStorage.setItem('userData', JSON.stringify(authData.user));
                resolve(authData);
              } catch (error: any) {
                reject(new Error(error.message || 'Authentication failed'));
              }
            })();
          } else {
            reject(new Error('Facebook login cancelled or failed'));
          }
        },
        {
          scope: 'pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish',
          return_scopes: true
        }
      );
    });
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
    if ((window as any).FB) {
      (window as any).FB.logout();
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
