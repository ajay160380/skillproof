import React from 'react';
import { motion } from 'framer-motion';

interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loader({ text = "PROCESSING...", size = 'md', className = '' }: LoaderProps) {
  const containerSize = size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-16 h-16' : 'w-24 h-24';
  const dotSize = size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3';
  const textClass = size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm';

  return (
    <div className={`flex flex-col items-center justify-center gap-6 ${className}`}>
      <div className={`relative ${containerSize} flex items-center justify-center`}>
        <motion.div 
          className="absolute inset-0 border-t-2 border-l-2 border-verification opacity-30"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute inset-2 border-b-2 border-r-2 border-verification"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        <div className={`${dotSize} bg-seal`} />
      </div>
      
      {text && (
        <p className={`font-mono uppercase tracking-widest text-data animate-pulse ${textClass}`}>
          {text}
        </p>
      )}
    </div>
  );
}
