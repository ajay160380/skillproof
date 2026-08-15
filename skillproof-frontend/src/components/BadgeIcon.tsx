import React from 'react';

export type BadgeLevel = 'none' | 'bronze' | 'silver' | 'gold' | 'platinum';

interface BadgeIconProps {
  level: BadgeLevel;
  className?: string;
  size?: number;
}

export function BadgeIcon({ level, className = '', size = 32 }: BadgeIconProps) {
  if (level === 'none') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" className={`opacity-30 ${className}`} fill="none">
        <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
      </svg>
    );
  }

  const getColors = () => {
    switch (level) {
      case 'platinum': return { fill: 'var(--color-ink)', stroke: 'var(--color-seal)' };
      case 'gold': return { fill: '#FFD700', stroke: '#B8860B' };
      case 'silver': return { fill: 'var(--color-structure)', stroke: 'var(--color-data)' };
      case 'bronze': return { fill: '#CD7F32', stroke: '#8B4513' };
    }
  };

  const { fill, stroke } = getColors();

  // Distinct shapes per level to avoid simple color swaps
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} fill="none">
      {level === 'bronze' && (
        <path d="M16 2L2 9V23L16 30L30 23V9L16 2Z" fill={fill} stroke={stroke} strokeWidth="1" />
      )}
      
      {level === 'silver' && (
        <>
          <path d="M16 2L2 9V23L16 30L30 23V9L16 2Z" fill={fill} stroke={stroke} strokeWidth="1" />
          <circle cx="16" cy="16" r="8" stroke={stroke} strokeWidth="1" />
        </>
      )}

      {level === 'gold' && (
        <>
          <path d="M16 2L2 9V23L16 30L30 23V9L16 2Z" fill={fill} stroke={stroke} strokeWidth="1" />
          <path d="M16 6L6 11V21L16 26L26 21V11L16 6Z" stroke={stroke} strokeWidth="1" />
          <circle cx="16" cy="16" r="4" fill={stroke} />
        </>
      )}

      {level === 'platinum' && (
        <>
          <path d="M16 0L32 16L16 32L0 16L16 0Z" fill={fill} />
          <path d="M16 4L28 16L16 28L4 16L16 4Z" stroke={stroke} strokeWidth="1.5" />
          <rect x="12" y="12" width="8" height="8" transform="rotate(45 16 16)" fill={stroke} />
        </>
      )}
    </svg>
  );
}
