import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center py-10">
      {/* Logo principal */}
      <div className="flex justify-center">
        <div className="p-5 rounded-full bg-gradient-to-br from-blue-700 via-teal-500 to-cyan-400 shadow-xl shadow-cyan-200/40 ring-4 ring-white/40">
          <img
            src="/logo-autoposter.png"
            alt="Logo"
            className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(0,0,0,0.4)]"
          />
        </div>
      </div>

      {/* Título */}
      <h1 className="text-4xl sm:text-5xl font-extrabold mt-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-teal-500 to-cyan-400 drop-shadow-[0_0_10px_rgba(0,0,0,0.2)]">
        Generador de Contenido Inmobiliario
      </h1>

      {/* Descripción */}
      <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-700 leading-relaxed">
        Pega la URL de un listado para extraer imágenes y generar una publicación
        <span className="text-teal-600 font-semibold"> viral </span>
        para redes sociales.
      </p>
    </header>
  );
};
