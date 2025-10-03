import React from 'react';

export const PostSkeleton: React.FC = () => (
  <div className="bg-slate-100 p-6 rounded-lg shadow-inner animate-pulse w-full">
    <div className="h-6 w-1/3 bg-slate-300 rounded mb-6"></div>
    <div className="space-y-4">
      <div className="h-4 bg-slate-300 rounded"></div>
      <div className="h-4 bg-slate-300 rounded w-5/6"></div>
      <div className="h-4 bg-slate-300 rounded w-full"></div>
      <div className="h-4 bg-slate-300 rounded w-3/4"></div>
      <div className="h-4 bg-slate-300 rounded w-4/6"></div>
      <div className="h-4 bg-slate-300 rounded w-5/6"></div>
    </div>
  </div>
);