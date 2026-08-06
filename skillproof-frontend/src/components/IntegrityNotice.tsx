import React from 'react';

export function IntegrityNotice() {
  return (
    <div className="mb-6 p-4 bg-vellum border border-structure/40 shadow-sm flex items-start gap-4">
      <div className="mt-1 flex items-center justify-center shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-verification animate-pulse"></span>
      </div>
      <div>
        <h3 className="font-mono text-xs uppercase tracking-widest text-ink font-bold mb-1">
          Authenticity Monitoring Active
        </h3>
        <p className="font-mono text-xs text-data/80 leading-relaxed">
          This assessment is monitored for authenticity. Actions such as tab switching, pasting full solutions, or excessive browser resizing may be logged. These signals are reviewed by our AI to ensure fair and trustworthy certification.
        </p>
      </div>
    </div>
  );
}
