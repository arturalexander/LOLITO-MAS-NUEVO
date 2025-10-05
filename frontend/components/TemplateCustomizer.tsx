import React, { useState, useCallback } from 'react';
import { Spinner } from './Spinner';

interface TemplateCustomizerProps {
  colors: { color1: string; color2: string; };
  onColorsChange: (colors: { color1: string; color2: string; }) => void;
  font: string;
  onFontChange: (font: string) => void;
  onLogoChange: (logo: string | null) => void;
  onBrandImageChange: (image: string | null) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  shortSummary: string | null;
  firstImageUrl: string | null;
}

const FONT_OPTIONS = ['Inter', 'Roboto', 'Lora', 'Poppins'];

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  colors,
  onColorsChange,
  font,
  onFontChange,
  onLogoChange,
  onBrandImageChange,
  onRegenerate,
  isGenerating,
  shortSummary,
  firstImageUrl
}) => {
  const [logoFileName, setLogoFileName] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [brandImageFileName, setBrandImageFileName] = useState<string>('');
  const [brandImagePreview, setBrandImagePreview] = useState<string | null>(null);

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onLogoChange(result);
        setLogoFileName(file.name);
        setLogoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  }, [onLogoChange]);

  const handleBrandImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onBrandImageChange(result);
        setBrandImageFileName(file.name);
        setBrandImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  }, [onBrandImageChange]);

  const renderSummaryWithLineBreaks = (summaryText: string) => {
    return summaryText.split(/<br\s*\/?>/i).map((line, index, arr) => (
      <React.Fragment key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const defaultLogoUrl = 'https://www.azulvilla.pl/crm/pages/agencies/azulvilla/assets/logo.svg';

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
      <h3 className="text-xl font-bold text-brand-dark mb-4">Personalizar Plantilla</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Color Pickers */}
        <div>
          <label htmlFor="color-picker-1" className="block text-sm font-medium text-slate-700 mb-1">
            Color 1
          </label>
          <input
            id="color-picker-1"
            type="color"
            value={colors.color1}
            onChange={(e) => onColorsChange({ ...colors, color1: e.target.value })}
            className="w-full h-10 p-1 border border-slate-300 rounded-lg cursor-pointer"
            disabled={isGenerating}
          />
        </div>
        <div>
          <label htmlFor="color-picker-2" className="block text-sm font-medium text-slate-700 mb-1">
            Color 2
          </label>
          <input
            id="color-picker-2"
            type="color"
            value={colors.color2}
            onChange={(e) => onColorsChange({ ...colors, color2: e.target.value })}
            className="w-full h-10 p-1 border border-slate-300 rounded-lg cursor-pointer"
            disabled={isGenerating}
          />
        </div>

        {/* Font Selector */}
        <div>
          <label htmlFor="font-selector" className="block text-sm font-medium text-slate-700 mb-1">
            Tipografía
          </label>
          <select
            id="font-selector"
            value={font}
            onChange={(e) => onFontChange(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            disabled={isGenerating}
          >
            {FONT_OPTIONS.map((fontOption) => (
              <option key={fontOption} value={fontOption}>
                {fontOption}
              </option>
            ))}
          </select>
        </div>

        {/* Logo Uploader */}
        <div>
          <label htmlFor="logo-uploader" className="block text-sm font-medium text-slate-700 mb-1">
            Logo Personalizado
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors">
              <span>Seleccionar archivo</span>
              <input id="logo-uploader" type="file" className="hidden" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} disabled={isGenerating}/>
            </label>
            <span className="text-sm text-slate-500 truncate">{logoFileName || "Logo por defecto"}</span>
          </div>
        </div>

        {/* Imagen de Marca/Contacto */}
        <div className="md:col-span-2">
          <label htmlFor="brand-image-uploader" className="block text-sm font-medium text-slate-700 mb-1">
            Imagen Final (Marca/Contacto)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            Esta imagen se publicará como última foto del carrusel (tu marca, contacto, etc.)
          </p>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors">
              <span>Seleccionar archivo</span>
              <input 
                id="brand-image-uploader" 
                type="file" 
                className="hidden" 
                accept="image/png, image/jpeg, image/jpg" 
                onChange={handleBrandImageUpload} 
                disabled={isGenerating}
              />
            </label>
            <span className="text-sm text-slate-500 truncate">
              {brandImageFileName || "Ningún archivo seleccionado"}
            </span>
          </div>
          {brandImagePreview && (
            <div className="mt-3">
              <img 
                src={brandImagePreview} 
                alt="Preview imagen de marca" 
                className="max-w-xs rounded-lg shadow-md"
              />
            </div>
          )}
        </div>
      </div>

      {/* Vista previa en tiempo real */}
      {shortSummary && firstImageUrl && (
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">Vista Previa en Tiempo Real:</p>
          <div className="relative w-full max-w-sm mx-auto rounded-xl overflow-hidden shadow-2xl" style={{ aspectRatio: '1080/1350' }}>
            <img src={firstImageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Background" />
            <div className="absolute inset-0 bg-black bg-opacity-25"></div>
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 text-center text-white p-4 rounded-xl shadow-lg"
              style={{
                background: `linear-gradient(45deg, ${colors.color1}, ${colors.color2})`,
                fontFamily: font,
                transition: 'all 0.3s ease'
              }}
            >
              <img 
                src={logoPreview || defaultLogoUrl} 
                alt="Logo" 
                className="max-w-[120px] max-h-[40px] w-auto h-auto mx-auto mb-3 object-contain"
              />
              <div className="text-2xl font-black leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                {renderSummaryWithLineBreaks(shortSummary)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón para generar imagen final */}
      <div className="mt-6">
        <button
          onClick={onRegenerate}
          disabled={isGenerating || !shortSummary || !firstImageUrl}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-brand-light-blue hover:bg-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light-blue transition-colors duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Spinner />
              <span className="ml-2">Generando...</span>
            </>
          ) : (
            'Generar Imagen de Marketing'
          )}
        </button>
      </div>
    </div>
  );
};