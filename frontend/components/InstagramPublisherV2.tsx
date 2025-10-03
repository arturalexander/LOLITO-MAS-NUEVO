import React, { useState } from 'react';
import { PostService } from '../services/postService';
import { AuthService } from '../services/authService';
import { FacebookAuthButton } from './FacebookAuthButton';

interface InstagramPublisherV2Props {
  socialPost: string;
  socialImageUrl: string | null;
  imageUrls: string[];
}

type PublishTarget = 'instagram' | 'facebook' | 'both';

export const InstagramPublisherV2: React.FC<InstagramPublisherV2Props> = ({
  socialPost,
  socialImageUrl,
  imageUrls,
}) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishTarget, setPublishTarget] = useState<PublishTarget>('both');
  const [publishResult, setPublishResult] = useState<any>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthSuccess = (userData: any) => {
    setIsAuthenticated(true);
    setPublishError(null);
  };

  const handleAuthError = (error: string) => {
    setPublishError(`Error de autenticación: ${error}`);
  };

  const handlePublish = async () => {
    if (!isAuthenticated) {
      setPublishError('Debes conectar tu cuenta de Facebook/Instagram primero');
      return;
    }

    const imagesToPublish = socialImageUrl 
      ? [socialImageUrl, ...imageUrls.slice(0, 4)]
      : imageUrls.slice(0, 5);

    if (imagesToPublish.length === 0) {
      setPublishError('No hay imágenes para publicar');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishResult(null);

    try {
      let result: any;

      switch (publishTarget) {
        case 'instagram':
          result = await PostService.publishToInstagram(
            imagesToPublish,
            socialPost,
            imagesToPublish.length > 1 ? 'carousel' : 'single'
          );
          break;

        case 'facebook':
          result = await PostService.publishToFacebook(
            imagesToPublish,
            socialPost,
            'photo'
          );
          break;

        case 'both':
          result = await PostService.publishToBoth(
            imagesToPublish,
            socialPost,
            imagesToPublish.length > 1 ? 'carousel' : 'single'
          );
          break;
      }

      setPublishResult(result);
    } catch (error: any) {
      console.error('Publish error:', error);
      setPublishError(error.message || 'Error al publicar');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b pb-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Publicación Automática</h3>
          <p className="text-sm text-slate-500">Instagram & Facebook</p>
        </div>
      </div>

      <div>
        <FacebookAuthButton 
          onAuthSuccess={handleAuthSuccess}
          onAuthError={handleAuthError}
        />
      </div>

      {isAuthenticated && (
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            ¿Dónde quieres publicar?
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setPublishTarget('instagram')}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                publishTarget === 'instagram'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Instagram
            </button>
            <button
              onClick={() => setPublishTarget('facebook')}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                publishTarget === 'facebook'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Facebook
            </button>
            <button
              onClick={() => setPublishTarget('both')}
              className={`py-3 px-4 rounded-lg font-medium transition-all ${
                publishTarget === 'both'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Ambas
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <button
          onClick={handlePublish}
          disabled={isPublishing || !socialPost}
          className="w-full bg-gradient-to-r from-brand-blue to-brand-light-blue hover:from-brand-dark hover:to-brand-blue disabled:from-slate-300 disabled:to-slate-400 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          {isPublishing ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Publicando...</span>
            </div>
          ) : (
            `Publicar en ${publishTarget === 'both' ? 'Ambas Plataformas' : publishTarget === 'instagram' ? 'Instagram' : 'Facebook'}`
          )}
        </button>
      )}

      {publishResult && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-sm font-semibold text-green-800">
            ¡Publicado exitosamente!
          </p>
          {publishResult.instagramUrl && (
            <a 
              href={publishResult.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-700 hover:text-green-900 underline block mt-2"
            >
              Ver en Instagram →
            </a>
          )}
        </div>
      )}

      {publishError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm text-red-700">{publishError}</p>
        </div>
      )}
    </div>
  );
};