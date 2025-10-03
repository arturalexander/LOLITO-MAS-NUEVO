import React from 'react';

interface ShortSummaryDisplayProps {
  summary: string;
}

// Helper para crear un elemento de React a partir de la cadena con <br>
const renderSummaryWithLineBreaks = (summaryText: string) => {
    return summaryText.split(/<br\s*\/?>/i).map((line, index, arr) => (
        <React.Fragment key={index}>
            {line}
            {index < arr.length - 1 && <br />}
        </React.Fragment>
    ));
};

export const ShortSummaryDisplay: React.FC<ShortSummaryDisplayProps> = ({ summary }) => {
  if (!summary) return null;
  
  return (
    <div className="bg-slate-50 p-4 sm:p-5 rounded-lg shadow-inner w-full">
      <p className="font-sans text-base text-slate-800 bg-white p-4 rounded-md border border-slate-200">
        {renderSummaryWithLineBreaks(summary)}
      </p>
    </div>
  );
};
