import React from 'react';

const BuildingIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 21V9.97071C4 9.45838 4.18128 8.96649 4.51001 8.6019L8.6019 4.01001C8.96649 3.18128 9.45838 3 9.97071 3H14.0293C14.5416 3 15.0335 3.18128 15.3981 4.01001L19.4899 8.6019C19.8187 8.96649 20 9.45838 20 9.97071V21H4ZM6 19H8V16H6V19ZM6 14H8V11H6V14ZM10 19H12V16H10V19ZM10 14H12V11H10V14ZM14 19H16V16H14V19ZM14 14H16V11H14V14Z" />
  </svg>
);


export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <div className="inline-block bg-brand-dark text-white p-4 rounded-full mb-4">
        <BuildingIcon className="w-10 h-10" />
      </div>
      <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-dark tracking-tight">
        Generador de Contenido Inmobiliario
      </h1>
      <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-600">
        Pega la URL de un listado para extraer imágenes y generar una publicación viral para redes sociales.
      </p>
    </header>
  );
};