import React, { useState } from 'react';
import { PostService } from '../services/postService';
import { uploadBase64Image } from '../services/imageUploadService';
import { useAuth } from '../contexts/AuthContext';

interface SocialMediaPublisherProps {
  socialPost: string;
  socialImageUrl: string | null;
  imageUrls: string[];
  brandImage: string | null;
}

export const SocialMediaPublisher: React.FC<SocialMediaPublisherProps> = ({
  socialPost,
  socialImageUrl,
  imageUrls,
  brandImage
}) => {
  const { user } = useAuth();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const isConnected = !!(user?.pageName);
  const hasInstagram = !!(user?.instagramUsername);

  const handlePublish = async () => {
    if (!isConnected) {
      setPublishError('Debes conectar tu cuenta de Facebook en Configuración primero');
      return;
    }

    if (!socialImageUrl || !socialPost) {
      setPublishError('Falta la imagen de marketing o el texto');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishResult(null);
    setUploadStatus('');

    try {
      const carouselImages = [socialImageUrl, ...imageUrls.slice(0, 3)];

      // Añadir imagen de marca si existe
      if (brandImage) {
        setUploadStatus('Subiendo imagen de marca...');
        try {
          if (brandImage.startsWith('data:')) {
            const brandImageUrl = await uploadBase64Image(brandImage);
            carouselImages.push(brandImageUrl);
          } else {
            carouselImages.push(brandImage);
          }
        } catch (uploadError) {
          console.warn('Error uploading brand image:', uploadError);
        }
      }

      const results: any = { facebook: null, instagram: null };

      // Publicar en Facebook
      setUploadStatus('Publicando en Facebook...');
      try {
        const fbResult = await PostService.publishToFacebook(carouselImages, socialPost);
        results.facebook = fbResult;
        console.log('✅ Facebook published:', fbResult);
      } catch (error: any) {
        console.error('Facebook error:', error);
        results.facebook = { error: error.message };
      }

      // Publicar en Instagram (si está conectado)
      if (hasInstagram) {
        setUploadStatus('Publicando en Instagram...');
        try {
          const igResult = await PostService.publishToInstagram(carouselImages, socialPost);
          results.instagram = igResult;
          console.log('✅ Instagram published:', igResult);
        } catch (error: any) {
          console.error('Instagram error:', error);
          results.instagram = { error: error.message };
        }
      }

      setPublishResult(results);
      setUploadStatus('');
    } catch (error: any) {
      setPublishError(error.message || 'Error al publicar');
      setUploadStatus('');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
      <div className="flex items-center space-x-3 border-b pb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Publicar en Redes Sociales</h3>
          {isConnected ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">✅ {user.pageName}</span>
              {hasInstagram && (
                <span className="text-purple-600">• @{user.instagramUsername}</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-orange-600">⚠️ No conectado - Ve a Configuración</p>
          )}
        </div>
      </div>

      <button
        onClick={handlePublish}
        disabled={isPublishing || !socialPost || !socialImageUrl || !isConnected}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:bg-slate-400 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isPublishing ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{uploadStatus || 'Publicando...'}</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
            </svg>
            <span>Publicar en {hasInstagram ? 'Facebook + Instagram' : 'Facebook'}</span>
          </>
        )}
      </button>

      {publishResult && (
        <div className="space-y-3">
          {publishResult.facebook && !publishResult.facebook.error && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-sm font-semibold text-blue-800">✅ Publicado en Facebook</p>
            </div>
          )}
          {publishResult.facebook?.error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm font-semibold text-red-800">❌ Error en Facebook</p>
              <p className="text-xs text-red-700 mt-1">{publishResult.facebook.error}</p>
            </div>
          )}
          
          {publishResult.instagram && !publishResult.instagram.error && (
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
              <p className="text-sm font-semibold text-purple-800">✅ Publicado en Instagram</p>
              {publishResult.instagram.instagramUrl && (
                <a 
                  href={publishResult.instagram.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-700 hover:text-purple-900 underline block mt-1"
                >
                  Ver en Instagram →
                </a>
              )}
            </div>
          )}
          {publishResult.instagram?.error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
              <p className="text-sm font-semibold text-red-800">❌ Error en Instagram</p>
              <p className="text-xs text-red-700 mt-1">{publishResult.instagram.error}</p>
            </div>
          )}
        </div>
      )}

      {publishError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-sm font-semibold text-red-800">Error</p>
          <p className="text-sm text-red-700 mt-1">{publishError}</p>
        </div>
      )}
    </div>
  );
};