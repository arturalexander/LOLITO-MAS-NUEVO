import React, { useState, useCallback } from 'react';

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);


interface SocialPostDisplayProps {
  post: string;
}

export const SocialPostDisplay: React.FC<SocialPostDisplayProps> = ({ post }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(post).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    });
  }, [post]);

  return (
    <div className="bg-slate-100 p-4 sm:p-6 rounded-lg shadow-inner relative w-full">
      <button 
        onClick={handleCopy} 
        className="absolute top-4 right-4 bg-slate-200 hover:bg-slate-300 p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
        aria-label="Copiar texto de la publicación"
      >
        {copied ? <CheckIcon className="w-5 h-5 text-green-600" /> : <ClipboardIcon className="w-5 h-5 text-slate-600" />}
      </button>
      <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base text-slate-800 bg-white p-4 rounded-md border border-slate-200 overflow-x-auto">
        {post}
      </pre>
      {copied && <div role="status" className="absolute top-14 right-4 text-xs bg-brand-dark text-white py-1 px-3 rounded-md">¡Copiado!</div>}
    </div>
  );
};