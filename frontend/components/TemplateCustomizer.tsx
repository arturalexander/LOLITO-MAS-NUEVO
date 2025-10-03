import React, { useState, useCallback } from 'react';
import { Spinner } from './Spinner';

interface TemplateCustomizerProps {
  colors: { color1: string; color2: string; };
  onColorsChange: (colors: { color1: string; color2: string; }) => void;
  font: string;
  onFontChange: (font: string) => void;
  onLogoChange: (logo: string | null) => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}

const FONT_OPTIONS = ['Inter', 'Roboto', 'Lora', 'Poppins'];

export const TemplateCustomizer: React.FC<TemplateCustomizerProps> = ({
  colors,
  onColorsChange,
  font,
  onFontChange,
  onLogoChange,
  onRegenerate,
  isGenerating
}) => {
  const [logoFileName, setLogoFileName] = useState<string>('');

  const handleLogoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onLogoChange(reader.result as string);
        setLogoFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  }, [onLogoChange]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
      <h3 className="text-xl font-bold text-brand-dark mb-4">Personalizar Plantilla</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="md:col-span-2">
            <label htmlFor="logo-uploader" className="block text-sm font-medium text-slate-700 mb-1">
                Logo Personalizado
            </label>
            <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded-lg transition-colors">
                    <span>Seleccionar archivo</span>
                    <input id="logo-uploader" type="file" className="hidden" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoUpload} disabled={isGenerating}/>
                </label>
                <span className="text-sm text-slate-500 truncate">{logoFileName || "Ningún archivo seleccionado."}</span>
            </div>
        </div>
      </div>

      {/* Regenerate Button */}
      <div className="mt-6">
        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-brand-light-blue hover:bg-brand-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light-blue transition-colors duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Spinner />
              <span className="ml-2">Actualizando...</span>
            </>
          ) : (
            'Actualizar Imagen'
          )}
        </button>
      </div>
    </div>
  );
};