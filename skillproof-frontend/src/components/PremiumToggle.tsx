import React from 'react';
import { motion } from 'framer-motion';

interface PremiumToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const PremiumToggle: React.FC<PremiumToggleProps> = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-verification flex items-center shadow-inner ${
        checked ? 'bg-verification' : 'bg-structure/20 hover:bg-structure/30'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Background active glow */}
      {checked && (
        <div className="absolute inset-0 bg-verification blur-md opacity-30 rounded-full pointer-events-none" />
      )}
      
      {/* Thumb */}
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 left-[2px] w-5 h-5 bg-white rounded-full shadow-[0_2px_5px_rgba(0,0,0,0.15)] flex items-center justify-center border border-gray-100"
        initial={false}
        animate={{
          x: checked ? 20 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.8
        }}
      >
        {/* Inner subtle detailing on the thumb */}
        <div className="w-1.5 h-1.5 rounded-full bg-structure/10 shadow-inner" />
      </motion.div>
    </button>
  );
};
