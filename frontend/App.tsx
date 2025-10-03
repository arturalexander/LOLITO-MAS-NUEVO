import React, { useState, useCallback } from 'react';
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
import { TemplateCustomizer } from './components/TemplateCustomizer';
import { InstagramPublisherV2 } from './components/InstagramPublisherV2';
const App: React.FC = () => {
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

  // State for template customization
  const [templateColors, setTemplateColors] = useState<{color1: string, color2: string}>({ color1: '#0077b6', color2: '#00b4d8' });
  const [templateFont, setTemplateFont] = useState<string>('Inter');
  const [templateLogo, setTemplateLogo] = useState<string | null>(null);


  const handleUrlSubmit = useCallback(async (url: string) => {
    if (!url) {
      setExtractError("La URL no puede estar vacía.");
      return;
    }

    // Reset all states
    setHasProcessed(true);
    setIsExtracting(true);
    setIsGenerating(true);
    setIsSummarizing(true);
    setIsCreatingImage(false); // Do not start image creation automatically
    setExtractError(null);
    setPostError(null);
    setSummaryError(null);
    setImageCreateError(null);
    setImageUrls([]);
    setSocialPost(null);
    setShortSummary(null);
    setSocialImageUrl(null);

    const PROXY_URL = 'https://api.allorigins.win/raw?url=';

    try {
      const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`No se pudo acceder a la URL. Estado: ${response.status} ${response.statusText}`);
      }
      const html = await response.text();
      let extractedUrls: string[] = [];
      
      // --- Image Extraction ---
      try {
        extractedUrls = extractImageUrls(html, url);
        setImageUrls(extractedUrls);
        if (extractedUrls.length === 0) {
          setExtractError("No se encontraron imágenes .jpg o .jpeg en la URL proporcionada.");
        }
      } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "Error desconocido al extraer imágenes.";
          setExtractError(errorMessage);
      } finally {
        setIsExtracting(false);
      }
        
      // --- Post & Summary Generation ---
      try {
        const post = await generatePost(html, url);
        setSocialPost(post);
        setIsGenerating(false);

        try {
          const summary = await generateShortSummary(post);
          setShortSummary(summary);
          // NOTE: Image generation is now triggered by user action
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : "Error desconocido.";
          setSummaryError(`Error al generar el resumen: ${errorMessage}`);
        } finally {
          setIsSummarizing(false);
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Error desconocido.";
        setPostError(`Error al generar la publicación: ${errorMessage}`);
        setSummaryError('La generación del resumen no pudo iniciarse.');
        setIsGenerating(false);
        setIsSummarizing(false);
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Ocurrió un error inesperado.";
      setExtractError(`Error al obtener la URL: ${errorMessage}. Asegúrate de que es correcta y accesible.`);
      setPostError('La generación de la publicación no pudo iniciarse debido a un error de red.');
      setSummaryError('La generación del resumen no pudo iniciarse debido a un error de red.');
      setIsExtracting(false);
      setIsGenerating(false);
      setIsSummarizing(false);
    } 
  }, []);

  const handleRegenerateImage = useCallback(async () => {
      if (!shortSummary || imageUrls.length === 0) {
          setImageCreateError("Se necesita un resumen y una imagen base para regenerar.");
          return;
      }
      setIsCreatingImage(true);
      setImageCreateError(null);
      setSocialImageUrl(null);
      try {
        const generatedImageUrl = await createSocialImage(imageUrls[0], shortSummary, {
            colors: templateColors,
            font: templateFont,
            logo: templateLogo,
        });
        setSocialImageUrl(generatedImageUrl);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido al regenerar la imagen.";
        setImageCreateError(`Error al regenerar la imagen: ${errorMessage}`);
      } finally {
        setIsCreatingImage(false);
      }
  }, [shortSummary, imageUrls, templateColors, templateFont, templateLogo]);


  const isLoading = isExtracting || isGenerating || isSummarizing;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <main className="container mx-auto px-4 py-8">
        <Header />
        <div className="mt-8 max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
          <HtmlInputForm onSubmit={handleUrlSubmit} isLoading={isLoading} />
        </div>

        {hasProcessed && (
          <div className="mt-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-12">
            
            <div className="space-y-12">
              <section aria-labelledby="generated-image-title">
                <h2 id="generated-image-title" className="text-2xl font-bold text-center text-brand-dark mb-6">Imagen de Marketing</h2>
                
                {shortSummary && imageUrls.length > 0 && (
                    <TemplateCustomizer 
                        colors={templateColors}
                        onColorsChange={setTemplateColors}
                        font={templateFont}
                        onFontChange={setTemplateFont}
                        onLogoChange={setTemplateLogo}
                        onRegenerate={handleRegenerateImage}
                        isGenerating={isCreatingImage}
                    />
                )}
                
                {isCreatingImage && <SocialImageSkeleton />}

                {!isCreatingImage && socialImageUrl && <SocialImageDisplay imageUrl={socialImageUrl} />}
                
                {!isCreatingImage && !socialImageUrl && imageCreateError && (
                    <p className="text-center text-red-600 bg-red-100 p-4 rounded-lg mt-6">{imageCreateError}</p>
                )}

                {!isCreatingImage && !socialImageUrl && !imageCreateError && hasProcessed && shortSummary && imageUrls.length > 0 && (
                  <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md mt-6">
                    <p className="text-slate-600 font-semibold">¡Contenido listo!</p>
                    <p className="text-slate-500 mt-2">
                      Personaliza tu plantilla y haz clic en "Actualizar Imagen" para crear tu visual.
                    </p>
                  </div>
                )}
              </section>
              <section aria-labelledby="image-results-title">
                <h2 id="image-results-title" className="text-2xl font-bold text-center text-brand-dark mb-6">Imágenes Originales</h2>
                {extractError && !isExtracting && <p className="text-center text-red-600 bg-red-100 p-4 rounded-lg mb-6">{extractError}</p>}
                <ImageGrid urls={imageUrls} isLoading={isExtracting} />
              </section>
            </div>

            <section aria-labelledby="post-results-title">
              <h2 id="post-results-title" className="text-2xl font-bold text-center text-brand-dark mb-6">Contenido Generado</h2>
              <div className="space-y-10">
                
                {hasProcessed && socialPost && (
                  
                

                  <InstagramPublisherV2 
                      socialPost={socialPost}
                      socialImageUrl={socialImageUrl}
                      imageUrls={imageUrls}
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

export default App;