
import React from 'react';

interface ImageGridProps {
  urls: string[];
  isLoading: boolean;
}

const ImageCard: React.FC<{ url: string }> = ({ url }) => (
  <div className="group relative overflow-hidden rounded-xl shadow-lg transition-transform duration-300 ease-in-out hover:scale-105 hover:shadow-2xl">
    <img
      src={url}
      alt="Inmueble extraído"
      className="w-full h-64 object-cover"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.onerror = null; // prevent infinite loop
        target.src = 'https://picsum.photos/400/300?grayscale'; // fallback image
        target.alt = 'Error al cargar imagen';
      }}
    />
    <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
       <a href={url} target="_blank" rel="noopener noreferrer" className="text-white text-sm opacity-80 truncate hover:opacity-100">{url}</a>
    </div>
  </div>
);

const SkeletonCard: React.FC = () => (
    <div className="bg-slate-200 rounded-xl shadow-lg h-64 animate-pulse"></div>
);


export const ImageGrid: React.FC<ImageGridProps> = ({ urls, isLoading }) => {
  if (isLoading) {
      return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonCard key={index} />
              ))}
          </div>
      );
  }

  if (urls.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-white rounded-lg shadow-md">
        <p className="text-slate-500">
          No se encontraron imágenes .jpg o .jpeg, o aún no has realizado una extracción.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {urls.map((url, index) => (
        <ImageCard key={`${url}-${index}`} url={url} />
      ))}
    </div>
  );
};
