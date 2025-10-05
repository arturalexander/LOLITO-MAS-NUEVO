// frontend/components/BrandingSetup.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const FONT_OPTIONS = ['Inter', 'Roboto', 'Lora', 'Poppins', 'Montserrat', 'Playfair Display'];

export const BrandingSetup: React.FC = () => {
  const { user, updateBranding, logout } = useAuth();
  
  const [color1, setColor1] = useState(user?.brandColors.color1 || '#0077b6');
  const [color2, setColor2] = useState(user?.brandColors.color2 || '#00b4d8');
  const [font, setFont] = useState(user?.brandFont || 'Inter');
  const [logoFile, setLogoFile] = useState<string | null>(user?.brandLogoUrl || null);
  const [brandImageFile, setBrandImageFile] = useState<string | null>(user?.brandImageUrl || null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setColor1(user.brandColors.color1);
      setColor2(user.brandColors.color2);
      setFont(user.brandFont);
      setLogoFile(user.brandLogoUrl);
      setBrandImageFile(user.brandImageUrl);
    }
  }, [user]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrandImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandImageFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      await updateBranding({
        brandColors: { color1, color2 },
        brandFont: font,
        brandLogoUrl: logoFile,
        brandImageUrl: brandImageFile,
      });

      setMessage({ type: 'success', text: '✅ Configuración guardada exitosamente' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-brand-dark">Configuración de Marca</h1>
              <p className="text-slate-600 mt-1">
                Configura tu identidad visual una sola vez
              </p>
            </div>
            <button
              onClick={logout}
              className="text-slate-600 hover:text-red-600 font-medium transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-6">
          <p className="text-sm text-blue-800">
            👋 Hola <strong>{user?.name}</strong> ({user?.email})
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulario */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Personalización</h2>

            {/* Colores */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color Principal
                </label>
                <input
                  type="color"
                  value={color1}
                  onChange={(e) => setColor1(e.target.value)}
                  className="w-full h-12 rounded-lg cursor-pointer border-2 border-slate-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color Secundario
                </label>
                <input
                  type="color"
                  value={color2}
                  onChange={(e) => setColor2(e.target.value)}
                  className="w-full h-12 rounded-lg cursor-pointer border-2 border-slate-300"
                />
              </div>
            </div>

            {/* Tipografía */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipografía
              </label>
              <select
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-blue"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Logo de la Empresa
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-dark transition"
              />
              {logoFile && (
                <img src={logoFile} alt="Logo preview" className="mt-3 max-h-16 rounded" />
              )}
            </div>

            {/* Imagen de Marca */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Imagen Final del Carrusel
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Esta imagen se añadirá automáticamente al final de cada publicación (contacto, logo grande, etc.)
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleBrandImageUpload}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-600 file:text-white hover:file:bg-green-700 transition"
              />
              {brandImageFile && (
                <img src={brandImageFile} alt="Brand preview" className="mt-3 max-h-32 rounded shadow" />
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={isLoading}
              className="w-full bg-brand-blue hover:bg-brand-dark disabled:bg-slate-400 text-white font-bold py-4 rounded-lg transition-colors shadow-lg"
            >
              {isLoading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Vista Previa</h2>
            
            <div 
              className="relative w-full rounded-xl overflow-hidden shadow-2xl"
              style={{ aspectRatio: '1080/1350' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-400"></div>
              <div className="absolute inset-0 bg-black bg-opacity-25"></div>
              
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 text-center text-white p-6 rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(45deg, ${color1}, ${color2})`,
                  fontFamily: font,
                }}
              >
                {logoFile && (
                  <img 
                    src={logoFile} 
                    alt="Logo" 
                    className="max-w-[120px] max-h-[40px] w-auto h-auto mx-auto mb-3 object-contain"
                  />
                )}
                <div className="text-2xl font-black leading-tight" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
                  🏠 Villa en Venta<br />
                  📍 Torrevieja, España<br />
                  💶 299.000 €<br />
                  ✨ 3 dormitorios · Piscina
                </div>
              </div>
            </div>

            {brandImageFile && (
              <div className="mt-6">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Imagen final del carrusel:
                </p>
                <img 
                  src={brandImageFile} 
                  alt="Brand final" 
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};