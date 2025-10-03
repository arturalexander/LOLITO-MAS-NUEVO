import React from 'react';

export const SocialImageSkeleton: React.FC = () => (
    <div className="relative w-full max-w-lg mx-auto bg-slate-200 rounded-2xl shadow-lg animate-pulse overflow-hidden">
        {/* Aspect ratio 1080:1350 is 1:1.25, so padding-top is 125% */}
        <div style={{ paddingTop: '125%' }} />
    </div>
);