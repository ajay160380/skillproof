import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light';
}

export function Logo({ className = '', size = 'md', theme = 'dark' }: LogoProps) {
  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32
  };
  
  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const currentSize = iconSizes[size];
  const textColor = theme === 'dark' ? 'text-ink' : 'text-vellum';

  return (
    <div className={`flex items-center gap-2 group ${className}`}>
      <motion.svg 
        width={currentSize} 
        height={currentSize} 
        viewBox="0 0 24 24" 
        fill="none"
        whileHover={{ rotateY: 180, scale: 1.05 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="text-seal flex-shrink-0 cursor-pointer"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Geometric Diamond/Rhombus - the brand's verification symbol */}
        <path 
          d="M12 2L22 12L12 22L2 12L12 2Z" 
          fill="currentColor" 
          className="opacity-90"
        />
        <path 
          d="M12 6L18 12L12 18L6 12L12 6Z" 
          stroke="var(--color-vellum)" 
          strokeWidth="1.5"
          className="opacity-50"
        />
        {/* Central dot indicating precision/data */}
        <circle cx="12" cy="12" r="2" fill="var(--color-vellum)" />
      </motion.svg>
      <span className={`font-serif tracking-tight ${textSizes[size]} ${textColor} select-none`}>
        SkillProof
      </span>
    </div>
  );
}
