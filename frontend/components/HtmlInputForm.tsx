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
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-white/70 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-slate-200/50 transition-all duration-300"
    >
      <div>
        <label
          htmlFor="url-input"
          className="block text-sm font-semibold text-slate-700 mb-2 tracking-wide"
        >
          URL de la Propiedad (Modo Manual)
        </label>

        <input
          id="url-input"
          name="url-input"
          type="url"
          className="block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 ease-in-out text-slate-800 placeholder-slate-400"
          placeholder="https://www.ejemplo.com/propiedad-en-venta"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          required
        />

        <p className="mt-2 text-sm text-slate-500">
          La aplicación buscará imágenes y creará una publicación optimizada para redes sociales.
        </p>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-6 rounded-xl font-semibold text-white 
                     bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 
                     shadow-md hover:shadow-lg transform hover:-translate-y-0.5
                     focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2
                     transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
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