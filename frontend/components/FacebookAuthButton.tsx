import React, { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';

interface FacebookAuthButtonProps {
  onAuthSuccess?: (userData: any) => void;
  onAuthError?: (error: string) => void;
}

export const FacebookAuthButton: React.FC<FacebookAuthButtonProps> = ({ 
  onAuthSuccess, 
  onAuthError 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const authenticated = await AuthService.checkAuthStatus();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      const user = AuthService.getUserData();
      setUserData(user);
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      const authData = await AuthService.loginWithFacebook();
      setIsAuthenticated(true);
      setUserData(authData.user);
      
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

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUserData(null);
  };

  if (isAuthenticated && userData) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 8l-5 5 5 5M16 8l5 5-5 5"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-900">Conectado</p>
              <p className="text-xs text-green-700">
                {userData.pageName} • @{userData.instagramUsername}
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
          <span>Conectar con Facebook/Instagram</span>
        </>
      )}
    </button>
  );
};