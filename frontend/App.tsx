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

// ✅ Componente interno que USA useAuth (dentro del Provider)
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

  const [extractError, setExtractError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [imageCreateError, setImageCreateError] = useState<string | null>(null);
  
  const [hasProcessed, setHasProcessed] = useState<boolean>(false);

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
        const post = await generatePost(html, url);
        setSocialPost(post);
        setIsGenerating(false);

        try {
          const summary = await generateShortSummary(post);
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
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : "Error al generar imagen.";
              setImageCreateError(`Error: ${errorMessage}`);
            }
          }
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "Error desconocido.";
          setSummaryError(`Error al generar resumen: ${errorMessage}`);
        } finally {
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

  // Loading
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

  // Login
  if (!isAuthenticated) {
    return <AuthForm />;
  }

  // Configuración de marca
  if (showBrandingSetup) {
    return (
      <div>
        <BrandingSetup onComplete={() => setShowBrandingSetup(false)} />
      </div>
    );
  }

  // App principal
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      {/* Barra superior */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-brand-dark text-white rounded-full flex items-center justify-center text-sm font-bold">
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
              className="px-4 py-2 text-sm font-medium text-brand-blue hover:bg-blue-50 rounded-lg"
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <Header />
        <div className="mt-8 max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          <HtmlInputForm onSubmit={handleUrlSubmit} isLoading={isLoading} />
        </div>

        {hasProcessed && (
          <div className="mt-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-12">
            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-bold text-center text-brand-dark mb-6">Imagen de Marketing</h2>
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
                  <FacebookPublisher
                    socialPost={socialPost}
                    socialImageUrl={socialImageUrl}
                    imageUrls={imageUrls}
                    brandImage={user?.brandImageUrl || null}
                  />
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

// ✅ Componente App que PROVEE el AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;