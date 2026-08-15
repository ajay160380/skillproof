import { motion } from 'framer-motion';

interface ScoreRingProps {
  percentage: number;
  label?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ScoreRing({ 
  percentage, 
  label, 
  size = 120, 
  strokeWidth = 4,
  color = 'var(--color-verification)'
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--color-structure)"
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress Ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="font-serif text-3xl tabular-nums leading-none" style={{ color: 'var(--color-ink)' }}>
          {percentage}
        </span>
        {label && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-data mt-1">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
