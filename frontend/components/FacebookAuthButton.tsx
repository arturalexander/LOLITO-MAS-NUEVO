import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

interface FacebookAuthButtonProps {
  onAuthSuccess?: (userData: any) => void;
  onAuthError?: (error: string) => void;
}

export const FacebookAuthButton: React.FC<FacebookAuthButtonProps> = ({ 
  onAuthSuccess, 
  onAuthError 
}) => {
  const { user, refreshUser } = useAuth(); // ✅ Usaremos refreshUser
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [fbData, setFbData] = useState<any>(null);

  useEffect(() => {
    checkConnection();
  }, [user]);

  const checkConnection = async () => {
    if (!user) return;
    
    const connected = await AuthService.checkAuthStatus();
    setIsConnected(connected);
    
    if (connected && user) {
      setFbData({
        pageName: user.pageName,
        instagramUsername: user.instagramUsername
      });
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      const authData = await AuthService.loginWithFacebook();
      setIsConnected(true);
      setFbData(authData.user);
      
      // ✅ Refrescar el contexto sin recargar
      if (refreshUser) {
        await refreshUser();
      }
      
      if (onAuthSuccess) {
        onAuthSuccess(authData.user);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (onAuthError) {
        onAuthError(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    AuthService.logout();
    setIsConnected(false);
    setFbData(null);
    
    // ✅ Refrescar el contexto sin recargar
    if (refreshUser) {
      await refreshUser();
    }
  };

  if (isConnected && fbData) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11.75c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zm6 0c-.69 0-1.25.56-1.25 1.25s.56 1.25 1.25 1.25 1.25-.56 1.25-1.25-.56-1.25-1.25-1.25zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-.29.02-.58.05-.86 2.36-1.05 4.23-2.98 5.21-5.37C11.07 8.33 14.05 10 17.42 10c.78 0 1.53-.09 2.25-.26.21.71.33 1.47.33 2.26 0 4.41-3.59 8-8 8z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">✅ Conectado</p>
              <p className="text-xs text-green-700">
                {fbData.pageName}
                {fbData.instagramUsername && ` • @${fbData.instagramUsername}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-green-700 hover:text-green-900 font-medium"
          >
            Desconectar
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Conectando...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Conectar Facebook/Instagram</span>
        </>
      )}
    </button>
  );
};