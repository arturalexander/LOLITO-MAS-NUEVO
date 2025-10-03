import React, { useState } from 'react';
import { Spinner } from './Spinner';

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const HtmlInputForm: React.FC<UrlInputFormProps> = ({ onSubmit, isLoading }) => {
  const [url, setUrl] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="url-input" className="block text-sm font-medium text-slate-700 mb-2">
          URL de la Propiedad
        </label>
        <input
          id="url-input"
          name="url-input"
          type="url"
          className="block w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition duration-150 ease-in-out text-sm"
          placeholder="https://www.ejemplo.com/propiedad-en-venta"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          required
        />
        <p className="mt-2 text-xs text-slate-500">
          La aplicación buscará imágenes y creará una publicación para redes sociales.
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-brand-blue hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Spinner />
              <span className="ml-2">Procesando...</span>
            </>
          ) : (
            'Generar Contenido'
          )}
        </button>
      </div>
    </form>
  );
};