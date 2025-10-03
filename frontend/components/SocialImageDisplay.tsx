import React from 'react';

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

interface SocialImageDisplayProps {
  imageUrl: string;
}

export const SocialImageDisplay: React.FC<SocialImageDisplayProps> = ({ imageUrl }) => {
  return (
    <div className="group relative rounded-2xl shadow-xl overflow-hidden w-full max-w-lg mx-auto">
      <img 
        src={imageUrl} 
        alt="Generated social media marketing image" 
        className="w-full h-auto" 
      />
      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <a 
          href={imageUrl} 
          download="social-media-image.jpg"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-brand-dark font-semibold py-2 px-5 rounded-full shadow-lg transform hover:scale-105 transition-transform"
          aria-label="Download generated image"
        >
          <DownloadIcon className="w-5 h-5" />
          Descargar
        </a>
      </div>
    </div>
  );
};