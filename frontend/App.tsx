import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { BrandingSetup } from './components/BrandingSetup';
import { Header } from './components/Header';
import { HtmlInputForm } from './components/HtmlInputForm';
import { ImageGrid } from './components/ImageGrid';
import { extractImageUrls } from './services/assetExtractor';
import { generatePost, generateShortSummary } from './services/aiService';
import { createSocialImage } from './services/imageGeneratorService';
import { SocialPostDisplay } from './components/SocialPostDisplay';
import { PostSkeleton } from './components/PostSkeleton';
import { ShortSummaryDisplay } from './components/ShortSummaryDisplay';
import { SummarySkeleton } from './components/SummarySkeleton';
import { SocialImageDisplay } from './components/SocialImageDisplay';
import { SocialImageSkeleton } from './components/SocialImageSkeleton';
import { FacebookPublisher } from './components/FacebookPublisher';
import { PostService } from './services/postService';
import { uploadBase64Image } from './services/imageUploadService';

const MainApp: React.FC = () => {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [showBrandingSetup, setShowBrandingSetup] = useState(false);
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [socialPost, setSocialPost] = useState<string | null>(null);
  const [shortSummary, setShortSummary] = useState<string | null>(null);
  const [socialImageUrl, setSocialImageUrl] = useState<string | null>(null);
  
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [isCreatingImage, setIsCreatingImage] = useState<boolean>(false);
  const [isAutoPublishing, setIsAutoPublishing] = useState<boolean>(false);

  const [extractError, setExtractError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [imageCreateError, setImageCreateError] = useState<string | null>(null);
  const [autoPublishError, setAutoPublishError] = useState<string | null>(null);
  
  const [hasProcessed, setHasProcessed] = useState<boolean>(false);

  const autoPublishToFacebook = async (
    socialImageUrl: string, 
    socialPost: string, 
    imageUrls: string[]
  ) => {
    if (!user?.autoPublish || !user?.pageName) {
      return;
    }

    setIsAutoPublishing(true);
    setAutoPublishError(null);

    try {
      console.log('🚀 Publicación automática iniciada...');
      
      const carouselImages = [socialImageUrl, ...imageUrls.slice(0, 3)];

      if (user?.brandImageUrl) {
        try {
          if (user.brandImageUrl.startsWith('data:')) {
            const brandImageUrl = await uploadBase64Image(user.brandImageUrl);
            carouselImages.push(brandImageUrl);
          } else {
            carouselImages.push(user.brandImageUrl);
          }
        } catch (uploadError) {
          console.warn('Error al subir imagen de marca, continuando sin ella:', uploadError);
        }
      }

      await PostService.publishToFacebook(carouselImages, socialPost);
      
      console.log('✅ Publicado automáticamente en Facebook');
      
      // Mostrar notificación de éxito
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-bounce';
      notification.innerHTML = '✅ ¡Publicado automáticamente en Facebook!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 5000);
      
    } catch (error: any) {
      console.error('Error en publicación automática:', error);
      setAutoPublishError(error.message || 'Error al publicar automáticamente');
      
      // Mostrar notificación de error
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
      notification.innerHTML = `❌ Error en publicación automática: ${error.message}`;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 5000);
    } finally {
      setIsAutoPublishing(false);
    }
  };

  const handleUrlSubmit = useCallback(async (url: string) => {
    if (!url) {
      setExtractError("La URL no puede estar vacía.");
      return;
    }

    setHasProcessed(true);
    setIsExtracting(true);
    setIsGenerating(true);
    setIsSummarizing(true);
    setIsCreatingImage(true);
    setExtractError(null);
    setPostError(null);
    setSummaryError(null);
    setImageCreateError(null);
    setAutoPublishError(null);
    setImageUrls([]);
    setSocialPost(null);
    setShortSummary(null);
    setSocialImageUrl(null);

    const PROXY_URL = 'https://corsproxy.io/?';

    try {
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`No se pudo acceder a la URL. Estado: ${response.status}`);
      }
      const html = await response.text();
      let extractedUrls: string[] = [];
      
      try {
        extractedUrls = extractImageUrls(html, url);
        setImageUrls(extractedUrls);
        if (extractedUrls.length === 0) {
          setExtractError("No se encontraron imágenes .jpg o .jpeg.");
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Error al extraer imágenes.";
        setExtractError(errorMessage);
      } finally {
        setIsExtracting(false);
      }
        
      try {
  const post = await generatePost(html, url, user?.language || 'en'); // 🟢 PASAR IDIOMA
  setSocialPost(post);
  setIsGenerating(false);

  try {
    const summary = await generateShortSummary(post, user?.language || 'en'); // 🟢 PASAR IDIOMA
    setShortSummary(summary);
    setIsSummarizing(false);

          if (extractedUrls.length > 0 && user) {
            try {
              const generatedImageUrl = await createSocialImage(
                extractedUrls[0], 
                summary, 
                {
                  colors: user.brandColors,
                  font: user.brandFont,
                  logo: user.brandLogoUrl,
                }
              );
              setSocialImageUrl(generatedImageUrl);
              setIsCreatingImage(false);

              // PUBLICACIÓN AUTOMÁTICA
              if (user.autoPublish && user.pageName) {
                await autoPublishToFacebook(generatedImageUrl, post, extractedUrls);
              }
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : "Error al generar imagen.";
              setImageCreateError(`Error: ${errorMessage}`);
              setIsCreatingImage(false);
            }
          } else {
            setIsCreatingImage(false);
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "Error desconocido.";
          setSummaryError(`Error al generar resumen: ${errorMessage}`);
          setIsSummarizing(false);
          setIsCreatingImage(false);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Error desconocido.";
        setPostError(`Error: ${errorMessage}`);
        setSummaryError('No se pudo generar el resumen.');
        setIsGenerating(false);
        setIsSummarizing(false);
        setIsCreatingImage(false);
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Error inesperado.";
      setExtractError(`Error: ${errorMessage}`);
      setPostError('Error de red.');
      setSummaryError('Error de red.');
      setIsExtracting(false);
      setIsGenerating(false);
      setIsSummarizing(false);
      setIsCreatingImage(false);
    } 
  }, [user]);

  const isLoading = isExtracting || isGenerating || isSummarizing;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthForm />;
  }

  if (showBrandingSetup) {
    return (
      <div>
        <BrandingSetup onComplete={() => setShowBrandingSetup(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-white font-sans text-slate-800">

      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-lg">

        <div className="container mx-auto px-6 py-4 flex justify-between items-center backdrop-blur-md bg-white/80 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-full flex items-center justify-center text-base font-bold shadow-md">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowBrandingSetup(true)}
            className="px-4 py-2 text-sm font-semibold text-cyan-700 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={logout}
                className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"

            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <Header />
        <div className="mt-8 max-w-4xl mx-auto bg-white/80 backdrop-blur-lg border border-slate-200 p-8 rounded-2xl shadow-xl">

          <HtmlInputForm onSubmit={handleUrlSubmit} isLoading={isLoading} />
        </div>

        {hasProcessed && (
          <div className="mt-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-12">
            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-extrabold text-center bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent drop-shadow-sm mb-6"></h2>
                {isCreatingImage && <SocialImageSkeleton />}
                {!isCreatingImage && socialImageUrl && <SocialImageDisplay imageUrl={socialImageUrl} />}
                {!isCreatingImage && !socialImageUrl && imageCreateError && (
                  <p className="text-center text-red-600 bg-red-100 p-4 rounded-lg">{imageCreateError}</p>
                )}
              </section>

              <section>
                <h2 className="text-2xl font-bold text-center text-brand-dark mb-6">Imágenes Originales</h2>
                {extractError && !isExtracting && <p className="text-center text-red-600 bg-red-100 p-4 rounded-lg mb-6">{extractError}</p>}
                <ImageGrid urls={imageUrls} isLoading={isExtracting} />
              </section>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-center text-brand-dark mb-6">Contenido Generado</h2>
              <div className="space-y-10">
                {socialPost && (
                  <>
                    <FacebookPublisher
                      socialPost={socialPost}
                      socialImageUrl={socialImageUrl}
                      imageUrls={imageUrls}
                      brandImage={user?.brandImageUrl || null}
                    />
                    
                    {isAutoPublishing && (
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                          <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-sm font-semibold text-blue-800">Publicando automáticamente en Facebook...</p>
                        </div>
                      </div>
                    )}
                    
                    {autoPublishError && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <p className="text-sm font-semibold text-red-800">Error en publicación automática</p>
                        <p className="text-sm text-red-700 mt-1">{autoPublishError}</p>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-4">Publicación para Redes</h3>
                  {postError && !isGenerating && <p className="text-center text-red-600 bg-red-100 p-4 rounded-lg">{postError}</p>}
                  {isGenerating && <PostSkeleton />}
                  {socialPost && !isGenerating && <SocialPostDisplay post={socialPost} />}
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-slate-700 mb-4">Resumen Rápido</h3>
                  {summaryError && !isSummarizing && <p className="text-center text-red-600 bg-red-100 p-4 rounded-lg">{summaryError}</p>}
                  {isSummarizing && <SummarySkeleton />}
                  {shortSummary && !isSummarizing && <ShortSummaryDisplay summary={shortSummary} />}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="text-center py-6 text-slate-500 text-sm">
        <p>Desarrollado con IA para potenciar tu marketing inmobiliario.</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;