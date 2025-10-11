import React, { useState } from 'react';
import { Spinner } from './Spinner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  'https://wonderful-stillness-production-6167.up.railway.app';

interface LinkExtractorProps {
  onSuccess?: () => void;
}

export const LinkExtractor: React.FC<LinkExtractorProps> = ({ onSuccess }) => {
  const [mainUrl, setMainUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedLinks, setExtractedLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExtractLinks = async () => {
    if (!mainUrl.trim()) {
      setError('Por favor ingresa una URL');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setSuccess(null);
    setExtractedLinks([]);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BACKEND_URL}/api/scheduled-posts/extract-links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url: mainUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al extraer links');
      }

      const data = await response.json();
      setExtractedLinks(data.links);
      setSuccess(`✅ ${data.totalLinks} propiedades encontradas`);
    } catch (err: any) {
      setError(err.message || 'Error al extraer links');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemoveLink = (linkToRemove: string) => {
    setExtractedLinks(prev => prev.filter(link => link !== linkToRemove));
    setSuccess(`🗑️ Link eliminado (${extractedLinks.length - 1} restantes)`);
  };

  const handleAddToQueue = async () => {
    if (extractedLinks.length === 0) {
      setError('No hay links para añadir');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BACKEND_URL}/api/scheduled-posts/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ urls: extractedLinks }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al añadir a la cola');
      }

      const data = await response.json();
      setSuccess(`🎉 ${extractedLinks.length} propiedades añadidas a la cola`);
      setExtractedLinks([]);
      setMainUrl('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al añadir a la cola');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractAndAdd = async () => {
    if (!mainUrl.trim()) {
      setError('Por favor ingresa una URL');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setSuccess(null);
    setExtractedLinks([]);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BACKEND_URL}/api/scheduled-posts/extract-and-add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url: mainUrl, limit: 100 }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Error al procesar');
      }

      const data = await response.json();
      setSuccess(`🎉 ${data.message}`);
      setMainUrl('');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error al extraer y añadir');
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-xl border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)] transition-all duration-500 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-800">⚡ Extracción Automática</h3>
          <p className="text-sm text-slate-600">Extrae todas las propiedades de una página</p>
        </div>
      </div>

      {/* Input URL */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          URL de tu página principal de propiedades
        </label>
        <input
          type="url"
          value={mainUrl}
          onChange={(e) => setMainUrl(e.target.value)}
          placeholder="https://www.tupagina.com/propiedades"
          className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-purple-500 transition bg-white/70"
          disabled={isExtracting}
        />
        <p className="text-xs text-slate-500 mt-2">
          📌 Pega la URL donde están listadas todas tus propiedades
        </p>
      </div>

      {/* Botones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleExtractLinks}
          disabled={isExtracting || !mainUrl.trim()}
          className="py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          {isExtracting ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner />
              <span>Extrayendo...</span>
            </div>
          ) : (
            '🔍 Ver Links'
          )}
        </button>

        <button
          onClick={handleExtractAndAdd}
          disabled={isExtracting || !mainUrl.trim()}
          className="py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
        >
          {isExtracting ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner />
              <span>Procesando...</span>
            </div>
          ) : (
            '⚡ Extraer y Añadir Directo'
          )}
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* 🟢 LISTA DE LINKS INTERACTIVA */}
      {extractedLinks.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold text-slate-700">
              📋 {extractedLinks.length} links encontrados
            </p>
            <button
              onClick={handleAddToQueue}
              disabled={isExtracting}
              className="text-sm bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Añadir a la Cola ({extractedLinks.length})
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto bg-white rounded-lg border border-slate-200 p-2">
            {extractedLinks.map((link, index) => (
              <div
                key={index}
                className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0"
              >
                {/* 🟢 LINK CLICKEABLE */}
<a
  href={link}
  target="_blank"
  rel="noopener noreferrer"
  className="flex-1 text-xs text-slate-700 hover:text-purple-600 truncate transition-colors underline decoration-dotted"
  title={link}
>
  {index + 1}. {link.replace(/^https?:\/\//, '')}
</a>


                {/* 🟢 BOTÓN X PARA ELIMINAR */}
                <button
                  onClick={() => handleRemoveLink(link)}
                  className="ml-3 flex-shrink-0 w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  title="Eliminar este link"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* 🟢 BOTONES DE ACCIÓN MASIVA */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setExtractedLinks([])}
              className="flex-1 text-sm py-2 px-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium transition"
            >
              🗑️ Limpiar Todos
            </button>
            <button
              onClick={handleAddToQueue}
              disabled={isExtracting}
              className="flex-1 text-sm py-2 px-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white rounded-lg font-semibold transition"
            >
              ✅ Añadir Seleccionados ({extractedLinks.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
};