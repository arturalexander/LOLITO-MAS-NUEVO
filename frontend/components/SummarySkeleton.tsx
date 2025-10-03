import React from 'react';

export const SummarySkeleton: React.FC = () => (
  <div className="bg-slate-100 p-6 rounded-lg shadow-inner animate-pulse w-full">
    <div className="space-y-3">
      <div className="h-4 bg-slate-300 rounded w-1/2"></div>
      <div className="h-4 bg-slate-300 rounded w-3/4"></div>
      <div className="h-4 bg-slate-300 rounded w-2/3"></div>
      <div className="h-4 bg-slate-300 rounded w-5/6"></div>
    </div>
  </div>
);
