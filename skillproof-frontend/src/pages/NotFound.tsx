import React from 'react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex-1 p-8 flex items-center justify-center bg-vellum">
      <div className="max-w-xl w-full border border-structure shadow-xl shadow-ink/10 relative overflow-hidden bg-vellum text-center p-12">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-ink"></div>
        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-ink"></div>
        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-ink"></div>
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-ink"></div>
        
        <div className="flex justify-center mb-6 text-seal opacity-80">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        
        <h1 className="font-serif text-4xl mb-4">Document Not Found</h1>
        <p className="font-mono text-sm text-data mb-8 uppercase tracking-widest border-y border-structure py-4">
          Error 404: The requested dossier could not be located in our verified records.
        </p>
        
        <Link 
          to="/" 
          className="inline-block bg-ink text-vellum px-8 py-3 font-medium hover:bg-verification transition-colors rounded-md shadow-md"
        >
          Return to Registry
        </Link>
      </div>
    </div>
  );
}
