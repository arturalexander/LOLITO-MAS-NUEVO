import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-blue to-brand-light-blue p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-brand-dark text-white p-4 rounded-full mb-4">
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 21V9.97071C4 9.45838 4.18128 8.96649 4.51001 8.6019L8.6019 4.01001C8.96649 3.18128 9.45838 3 9.97071 3H14.0293C14.5416 3 15.0335 3.18128 15.3981 4.01001L19.4899 8.6019C19.8187 8.96649 20 9.45838 20 9.97071V21H4ZM6 19H8V16H6V19ZM6 14H8V11H6V14ZM10 19H12V16H10V19ZM10 14H12V11H10V14ZM14 19H16V16H14V19ZM14 14H16V11H14V14Z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-brand-dark">
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <p className="text-slate-600 mt-2">
            {mode === 'login' 
              ? 'Accede a tu generador de contenido' 
              : 'Configura tu marca una vez, automatiza para siempre'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
                placeholder="Tu nombre"
                required={mode === 'register'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-blue hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isLoading 
              ? 'Procesando...' 
              : mode === 'login' 
                ? 'Iniciar Sesión' 
                : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
            className="text-brand-blue hover:text-brand-dark font-medium"
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