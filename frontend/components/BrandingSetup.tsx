import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FacebookAuthButton } from './FacebookAuthButton';
import { ScheduledQueue } from './ScheduledQueue';

const FONT_OPTIONS = [
  'Inter, sans-serif',             // Moderna, neutra, fina o mediana
  'Poppins, sans-serif',           // Redondeada, elegante
  'Roboto Condensed, sans-serif',  // Fina, compacta, profesional
  'Playfair Display, serif',       // Elegante, tipo revista o lujo
  'Oswald, sans-serif',            // Robusta, legible y seria
  'Anton, sans-serif'              // Impactante, ideal para titulares
];


interface BrandingSetupProps {
  onComplete?: () => void;
}

export const BrandingSetup: React.FC<BrandingSetupProps> = ({ onComplete }) => {
  const { user, updateBranding, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'branding' | 'queue'>('branding');
  
  const [color1, setColor1] = useState(user?.brandColors.color1 || '#0077b6');
  const [color2, setColor2] = useState(user?.brandColors.color2 || '#00b4d8');
  const [font, setFont] = useState(user?.brandFont || 'Inter');
  const [logoFile, setLogoFile] = useState<string | null>(user?.brandLogoUrl || null);
  const [brandImageFile, setBrandImageFile] = useState<string | null>(user?.brandImageUrl || null);
  const [autoPublish, setAutoPublish] = useState(user?.autoPublish || false);
  const [scheduledTime, setScheduledTime] = useState(user?.scheduledTime || '14:00');
  const [textColor, setTextColor] = useState(user?.textColor || '#ffffff');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setColor1(user.brandColors.color1);
      setColor2(user.brandColors.color2);
      setFont(user.brandFont);
      setLogoFile(user.brandLogoUrl);
      setBrandImageFile(user.brandImageUrl);
      setAutoPublish(user.autoPublish || false);
      setScheduledTime(user.scheduledTime || '14:00');
      setTextColor(user.textColor || '#ffffff');

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
        autoPublish,
        scheduledTime,
        textColor, // 🟢 añadir esta línea

      });

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderSummaryWithLineBreaks = (summaryText: string) => {
    return summaryText.split(/<br\s*\/?>/i).map((line, index, arr) => (
      <React.Fragment key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-100 p-8">
  <div className="max-w-6xl mx-auto">
    {/* HEADER */}
    <div className="bg-white/80 backdrop-blur-xl border border-white/30 shadow-xl rounded-3xl p-6 mb-10 transition-all hover:shadow-2xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-700 drop-shadow">
            Configuración
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Personaliza tu identidad visual y conexiones automáticas.
          </p>
        </div>
        <div className="flex gap-3">
          {onComplete && (
            <button
              onClick={onComplete}
              className="px-5 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all shadow-sm"
            >
              ← Volver
            </button>
          )}
          <button
            onClick={logout}
            className="px-5 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-100 shadow-sm transition-all"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setActiveTab('branding')}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
            activeTab === 'branding'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          Marca & Conexiones
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
            activeTab === 'queue'
              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          Cola de Publicaciones
        </button>
      </div>
    </div>

    {/* INFO USER */}
    <div className="relative overflow-hidden bg-gradient-to-r from-cyan-100 to-blue-50 border border-cyan-200 rounded-2xl p-5 mb-8 shadow-lg">
      <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-white/50"></div>
      <p className="relative text-slate-800 font-medium text-sm">
        👋 Hola <span className="font-bold text-cyan-800">{user?.name}</span> (
        <span className="text-slate-600">{user?.email}</span>)
      </p>
    </div>

    {/* CONTENIDO */}
    {activeTab === 'branding' ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* IZQUIERDA */}
        <div className="space-y-8">
          {/* Tarjeta: Identidad Visual */}
          <div className="bg-white/30 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6 hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)] transition-all duration-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-5">
              Identidad Visual
            </h2>

            {/* Colores */}
            {/* Estilo de Degradado */}
<div className="mb-6">
  <label className="text-sm font-medium text-slate-600 mb-3 block">
    Estilo de Degradado
  </label>

  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
    {[
  { name: 'Corporativo Azul', from: '#0078d7', to: '#3acfd5' },
  { name: 'Atardecer Cálido', from: '#ff9966', to: '#ff5e62' },
  { name: 'Verde Esmeralda', from: '#00b09b', to: '#96c93d' },
  { name: 'Violeta Glam', from: '#7f00ff', to: '#e100ff' },
  { name: 'Oro y Arena', from: '#f6d365', to: '#fda085' },
  { name: 'Negro Luxury', from: '#434343', to: '#000000' },
]
.map((preset) => (
      <button
        key={preset.name}
        onClick={() => {
          setColor1(preset.from);
          setColor2(preset.to);
        }}
        className={`relative w-full h-16 rounded-xl shadow-md border-2 transition-transform hover:scale-[1.05] ${
          color1 === preset.from && color2 === preset.to
            ? 'border-cyan-500 ring-2 ring-cyan-400'
            : 'border-transparent'
        }`}
        style={{
          background: `linear-gradient(90deg, ${preset.from}, ${preset.to})`,
        }}
      >
        <span className="absolute bottom-1 left-1 right-1 text-xs text-white/90 bg-black/30 rounded-md px-1 py-[2px] text-center truncate backdrop-blur-sm">
          {preset.name}
        </span>
      </button>
    ))}
  </div>
</div>


            {/* Tipografía */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                Tipografía
              </label>
              <select
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 transition-all"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Color del texto */}
<div className="mb-6">
  <label className="text-sm font-medium text-slate-600 mb-2 block">
    Color del texto
  </label>
  <input
    type="color"
    value={textColor}
    onChange={(e) => setTextColor(e.target.value)}
    className="w-20 h-10 border border-slate-300 rounded-lg cursor-pointer shadow-sm"
  />
</div>


            {/* Logo */}
            <div className="mb-6">
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                Logo de la Empresa
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 transition"
                />
              </div>
              {logoFile && (
                <img
                  src={logoFile}
                  alt="Logo preview"
                  className="mt-3 max-h-20 rounded-lg shadow-md border border-slate-200"
                />
              )}
            </div>

            {/* Imagen Final */}
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">
                Imagen Final del Carrusel
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Esta imagen se añadirá al final de cada publicación.
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleBrandImageUpload}
                className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700 transition"
              />
              {brandImageFile && (
                <img
                  src={brandImageFile}
                  alt="Brand preview"
                  className="mt-3 max-h-32 rounded-lg shadow-lg border border-slate-200"
                />
              )}
            </div>
          </div>

          {/* Tarjeta Redes */}
          <div className="bg-white/30 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6 hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)] transition-all duration-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Redes Sociales
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Conecta tu página de Facebook para publicar automáticamente.
            </p>
            <FacebookAuthButton />
          </div>

          {/* Tarjeta Automático */}
          <div className="bg-white/30 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] p-6 hover:shadow-[0_8px_40px_rgba(0,0,0,0.15)] transition-all duration-500">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Publicación Automática
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Configura la hora en la que publicar automáticamente.
            </p>

            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Hora de publicación
              </label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 transition"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl">
              <div>
                <p className="font-semibold text-slate-800">Modo Automático</p>
                <p className="text-xs text-slate-500 mt-1">
                  {autoPublish
                    ? `Se publicará automáticamente a las ${scheduledTime}`
                    : 'Publicación manual habilitada'}
                </p>
              </div>

              <button
                onClick={() => setAutoPublish(!autoPublish)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  autoPublish ? 'bg-green-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition ${
                    autoPublish ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg hover:opacity-90 transition-all"
          >
            {isLoading ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>

        {/* DERECHA (Vista previa) */}
        <div className="bg-white/90 border border-slate-200 rounded-3xl shadow-xl p-6 backdrop-blur-lg hover:shadow-2xl transition-all">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Vista Previa</h2>
          
          <div
            className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-slate-200"
            style={{ aspectRatio: '1080/1350' }}
            
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-300 to-slate-500" />
            <div className="absolute inset-0 bg-black/20" />
            <div
  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11/12 text-center text-white p-8 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.25)] backdrop-blur-md border border-white/20"
  style={{
  background: `linear-gradient(145deg, ${color1}, ${color2})`,
    fontFamily: font,
    color: textColor, // 🟢 añadido

  }}
>
  {logoFile && (
    <img
      src={logoFile}
      alt="Logo"
      className="max-w-[100px] mx-auto mb-4 drop-shadow-[0_2px_8px_rgba(255,255,255,0.6)]"
    />
  )}

  <div className="text-3xl font-extrabold leading-snug tracking-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)]">
    😂 Villa en Venta <br />
    Torrevieja, España <br />
    299.000 € <br />
    Piscina incluida
  </div>


</div>

          </div>

          {brandImageFile && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700 mb-2">
                Imagen final del carrusel:
              </p>
              <img
                src={brandImageFile}
                alt="Imagen final"
                className="rounded-xl shadow-xl border border-slate-200"
              />
            </div>
          )}
        </div>
      </div>
    ) : (
      <ScheduledQueue />
    )}
  </div>
</div>

  );
};