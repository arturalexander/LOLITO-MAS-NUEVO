import React, { useState } from 'react';
import { PostService } from '../services/postService';
import { uploadBase64Image } from '../services/imageUploadService';
import { useAuth } from '../contexts/AuthContext';

interface FacebookPublisherProps {
  socialPost: string;
  socialImageUrl: string | null;
  imageUrls: string[];
  brandImage: string | null;
}

export const FacebookPublisher: React.FC<FacebookPublisherProps> = ({
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
  const isAutoMode = user?.autoPublish;

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

      if (brandImage) {
        setUploadStatus('Subiendo imagen de marca...');
        try {
          if (brandImage.startsWith('data:')) {
            const brandImageUrl = await uploadBase64Image(brandImage);
            carouselImages.push(brandImageUrl);
          } else {
            carouselImages.push(brandImage);
          }
          setUploadStatus('Imagen de marca añadida. Publicando...');
        } catch (uploadError) {
          throw new Error('Error al subir la imagen de marca.');
        }
      }

      const result = await PostService.publishToFacebook(carouselImages, socialPost);
      setPublishResult(result);
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
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Publicar en Facebook</h3>
          {isConnected ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-green-600">
                ✅ {user.pageName}
              </p>
              {isAutoMode && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                  ⚡ Automático
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-orange-600">
              ⚠️ No conectado - Ve a Configuración
            </p>
          )}
        </div>
      </div>

      {isAutoMode && isConnected && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-800">
            ⚡ <strong>Modo automático activado:</strong> La publicación se subirá automáticamente al generar el contenido. No necesitas hacer clic en "Publicar".
          </p>
        </div>
      )}

      {!isAutoMode && (
        <button
          onClick={handlePublish}
          disabled={isPublishing || !socialPost || !socialImageUrl || !isConnected}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
              </svg>
              <span>Publicar Carrusel en Facebook</span>
            </>
          )}
        </button>
      )}

      {publishResult && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-sm font-semibold text-green-800">🎉 ¡Publicado exitosamente!</p>
          <p className="text-xs text-green-700 mt-1">
            Tu carrusel está ahora en Facebook
          </p>
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