import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  'https://wonderful-stillness-production-6167.up.railway.app';

interface ScheduledPost {
  _id: string;
  url: string;
  position: number;
  status: 'pending' | 'published' | 'error';
  publishedAt: string | null;
  error: string | null;
  createdAt: string;
}

interface QueueStats {
  pending: number;
  published: number;
  error: number;
  total: number;
}

export const ScheduledQueue: React.FC = () => {
  const { user } = useAuth();
  const [urls, setUrls] = useState<string>('');
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQueue, setIsLoadingQueue] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setIsLoadingQueue(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BACKEND_URL}/api/scheduled-posts/queue`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al cargar la cola');

      const data = await response.json();
      setPosts(data.posts);
      setStats(data.stats);
    } catch (error: any) {
      console.error('Load queue error:', error);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  const handleAddUrls = async () => {
    if (!urls.trim()) {
      setMessage({ type: 'error', text: 'Pega al menos una URL' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const urlList = urls
        .split('\n')
        .map(u => u.trim())
        .filter(u => u.length > 0);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BACKEND_URL}/api/scheduled-posts/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ urls: urlList })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al añadir URLs');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: data.message });
      setUrls('');
      loadQueue();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('¿Eliminar este post de la cola?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BACKEND_URL}/api/scheduled-posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al eliminar');

      loadQueue();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('¿Eliminar todos los posts ya publicados?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${BACKEND_URL}/api/scheduled-posts/cleanup/published`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al limpiar');

      const data = await response.json();
      alert(data.message);
      loadQueue();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>;
      case 'published':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Publicado</span>;
      case 'error':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Error</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Cola de Publicaciones Programadas</h2>
        <p className="text-sm text-slate-600 mb-4">
          Añade URLs que se publicarán automáticamente cada día a las <strong>{user?.scheduledTime || '14:00'}</strong>
        </p>

        {stats && (
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs text-slate-500 uppercase">Total</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-xs text-yellow-700 uppercase">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-xs text-green-700 uppercase">Publicados</p>
              <p className="text-2xl font-bold text-green-800">{stats.published}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-xs text-red-700 uppercase">Errores</p>
              <p className="text-2xl font-bold text-red-800">{stats.error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Formulario para añadir URLs */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Añadir URLs a la Cola</h3>
        <p className="text-sm text-slate-600 mb-4">
          Pega una URL por línea. Se publicarán en orden, 1 por día.
        </p>

        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder="https://www.ejemplo.com/propiedad-1&#10;https://www.ejemplo.com/propiedad-2&#10;https://www.ejemplo.com/propiedad-3"
          className="w-full h-40 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue resize-none font-mono text-sm"
          disabled={isLoading}
        />

        {message && (
          <div className={`mt-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message.text}
          </div>
        )}

        <button
          onClick={handleAddUrls}
          disabled={isLoading || !urls.trim()}
          className="mt-4 w-full bg-brand-blue hover:bg-brand-dark disabled:bg-slate-400 text-white font-bold py-3 rounded-lg transition-colors"
        >
          {isLoading ? 'Añadiendo...' : 'Añadir a la Cola'}
        </button>
      </div>

      {/* Lista de posts */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Posts en Cola</h3>
          {stats && stats.published > 0 && (
            <button
              onClick={handleCleanup}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Limpiar publicados
            </button>
          )}
        </div>

        {isLoadingQueue ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto"></div>
            <p className="text-slate-500 mt-4">Cargando cola...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No hay posts en la cola. Añade algunas URLs arriba.
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-slate-600">#{post.position}</span>
                    {getStatusBadge(post.status)}
                    {post.publishedAt && (
                      <span className="text-xs text-slate-500">
                        Publicado: {new Date(post.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 truncate">{post.url}</p>
                  {post.error && (
                    <p className="text-xs text-red-600 mt-1">Error: {post.error}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(post._id)}
                  className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};