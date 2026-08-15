import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title = 'No Data', description = '', message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border border-dashed border-structure text-center">
      <div className="w-12 h-12 flex items-center justify-center border border-structure mb-4">
        <span className="font-mono text-data text-xs opacity-50">/</span>
      </div>
      <h3 className="font-serif text-xl mb-2">{title}</h3>
      <p className="text-data text-sm max-w-md mb-6">{message || description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
