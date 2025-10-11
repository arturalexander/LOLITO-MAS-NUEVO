import { AuthService } from './authService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ||
  'https://wonderful-stillness-production-6167.up.railway.app';

interface PostResponse {
  success: boolean;
  photoId?: string;
  postId?: string;
  mediaId?: string;
  platform: string;
  message: string;
  error?: string;
}

export class PostService {
  // 🔵 Facebook (siempre disponible)
  static async publishToFacebook(
    imageUrls: string[],
    message: string
  ): Promise<PostResponse> {
    const token = AuthService.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/post/facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrls,
          message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to publish to Facebook');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to publish to Facebook');
    }
  }

  // 🟣 Instagram (solo si está conectado)
  static async publishToInstagram(
    imageUrls: string[],
    caption: string
  ): Promise<PostResponse> {
    const token = AuthService.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/post/instagram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrls,
          caption,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || 'Failed to publish to Instagram');
      }

      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to publish to Instagram');
    }
  }
}