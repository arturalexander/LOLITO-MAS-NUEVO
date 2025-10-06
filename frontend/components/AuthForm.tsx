import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PipelineBackground } from './PipelineBackground';

export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name) {
          setError('Por favor ingresa tu nombre');
          setIsLoading(false);
          return;
        }
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo animado */}
      <PipelineBackground />
      
      {/* Formulario */}
<div className="bg-gradient-to-b from-slate-900/90 to-black/90 backdrop-blur-2xl rounded-3xl shadow-[0_0_40px_rgba(0,255,255,0.1)] p-10 w-full max-w-md relative z-10 border border-cyan-500/10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
  <img
    src="/logo-autoposter.png"  // 👈 pon aquí la ruta real del logo (ver paso 2)
    alt="Logo AutoPoster"
    className="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]"
  />
</div>

            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="text-slate-400 mt-2">

            {mode === 'login' 
              ? 'Accede a tu generador de contenido' 
              : 'Configura tu marca una vez, automatiza para siempre'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 bg-slate-900/80 text-white placeholder-slate-400 transition"
                placeholder="Tu nombre"
                required={mode === 'register'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">

              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/70 border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-slate-400 transition backdrop-blur-sm"

              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">

              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/70 border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-white placeholder-slate-400 transition backdrop-blur-sm"

              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border-l-4 border-red-500/80 p-3 rounded">
  <p className="text-sm text-red-300">{error}</p>
</div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-cyan-500/30 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"

          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </div>
            ) : (
              mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="font-medium bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent hover:opacity-80 transition"

          >
            {mode === 'login' 
              ? '¿No tienes cuenta? Regístrate' 
              : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
};