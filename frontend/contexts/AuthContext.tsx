import React, { createContext, useContext, useState, useEffect } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  'https://wonderful-stillness-production-6167.up.railway.app';

interface User {
  id: string;
  email: string;
  name: string;
  brandColors: { color1: string; color2: string };
  brandFont: string;
  brandLogoUrl: string | null;
  brandImageUrl: string | null;
  autoPublish: boolean; // ✅ Nuevo
  scheduledTime: string; // Añade esta línea
  instagramUsername?: string;
  pageName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateBranding: (branding: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>; // ✅ Nuevo
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Función reutilizable para obtener el usuario
  const fetchUser = async (token: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        return userData;
      } else {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setUser(null);
        return null;
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setUser(null);
      return null;
    }
  };

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsLoading(false);
        return;
      }

      await fetchUser(token);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // ✅ Nueva función para refrescar el usuario sin recargar la página
  const refreshUser = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    
    await fetchUser(token);
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al iniciar sesión');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userData', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al registrarse');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userData', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const updateBranding = async (branding: Partial<User>) => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No estás autenticado. Por favor inicia sesión de nuevo.');
    }

    const response = await fetch(`${BACKEND_URL}/api/auth/profile/branding`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(branding),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar configuración');
    }

    const data = await response.json();
    const updatedUser = { ...user!, ...data.user };
    setUser(updatedUser);
    localStorage.setItem('userData', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateBranding,
        refreshUser, // ✅ Exportar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};