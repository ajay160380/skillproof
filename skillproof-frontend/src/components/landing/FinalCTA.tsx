import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BadgeIcon } from '../BadgeIcon';

export function FinalCTA() {
  return (
    <section className="bg-ink text-vellum border-b border-structure py-24 px-8 overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-structure) 1px, transparent 1px), linear-gradient(90deg, var(--color-structure) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <BadgeIcon level="platinum" size={80} className="text-vellum drop-shadow-2xl" />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="font-serif text-5xl md:text-6xl mb-6 leading-tight"
        >
          The end of resume fiction.
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-data text-lg max-w-2xl mx-auto mb-12"
        >
          Join thousands of candidates who bypass the resume screen with cryptographically verified credentials.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link 
            to="/register" 
            className="bg-vellum text-ink px-8 py-4 text-center font-medium hover:bg-verification hover:text-vellum transition-colors min-w-[200px] rounded-md shadow-lg shadow-black/20"
          >
            Start Verification
          </Link>
          <Link 
            to="/login" 
            className="bg-transparent text-vellum px-8 py-4 text-center font-medium border border-vellum hover:bg-structure/30 transition-colors min-w-[200px] rounded-md"
          >
            Recruiter Access
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
