import { AuthService } from './authService';

const BACKEND_URL = import.meta.env.MODE === 'development'
  ? 'http://localhost:5000'
  : 'https://wonderful-stillness-production.up.railway.app';


interface PostResponse {
  success: boolean;
  postId?: string;
  photoId?: string;
  photoIds?: string[];
  platform: string;
  message: string;
  instagramUrl?: string;
}

interface DualPostResponse {
  success: boolean;
  message: string;
  results: {
    instagram: {
      success: boolean;
      postId: string;
      url: string;
    } | null;
    facebook: {
      success: boolean;
      photoId?: string;
      photoIds?: string[];
    } | null;
    errors: Array<{ platform: string; error: string }>;
  };
}

export class PostService {
  static async publishToInstagram(
    imageUrls: string[],
    caption: string,
    type: 'single' | 'carousel' = 'single'
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
          type,
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

  static async publishToFacebook(
    imageUrls: string[],
    message: string,
    type: 'photo' | 'text' = 'photo'
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
          type,
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

  static async publishToBoth(
    imageUrls: string[],
    caption: string,
    type: 'single' | 'carousel' = 'single'
  ): Promise<DualPostResponse> {
    const token = AuthService.getToken();
    
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/post/both`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUrls,
          caption,
          type,
        }),
      });

      const data = await response.json();

      if (!data.success && response.status !== 200) {
        throw new Error(data.message || 'Failed to publish to both platforms');
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to publish');
    }
  }
}