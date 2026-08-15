import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BadgeIcon } from '../BadgeIcon';

export function RecruiterSection() {
  return (
    <section id="recruiters" className="bg-ink text-vellum relative overflow-hidden scroll-mt-20">
      {/* Smooth transition from vellum (previous section) to ink */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-vellum to-transparent pointer-events-none z-20"></div>
      
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-structure) 1px, transparent 1px), linear-gradient(90deg, var(--color-structure) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row">
        {/* Copy Side */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="flex-1 p-12 lg:p-20 lg:border-r border-structure/30 flex flex-col justify-center relative z-10"
        >
          <div className="font-mono text-xs uppercase tracking-widest text-data mb-6">
            For Hiring Teams
          </div>
          <h2 className="font-serif text-4xl lg:text-5xl mb-6">
            Stop guessing.<br/>Start verifying.
          </h2>
          <p className="text-data/80 leading-relaxed mb-8 max-w-md">
            Unverifiable resumes waste your time. Expensive assessment platforms waste your budget. Search our marketplace of candidates who have already proven their skills through live, AI-audited performance.
          </p>
          <div>
            <Link 
              to="/login"
              className="inline-block bg-vellum text-ink px-8 py-4 font-medium hover:bg-structure transition-colors rounded-md shadow-lg shadow-black/20"
            >
              Explore as a Recruiter
            </Link>
          </div>
        </motion.div>

        {/* Mockup Side */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex-1 p-12 lg:p-20 flex items-center justify-center relative z-10"
        >
          <div className="w-full max-w-md bg-vellum/5 border border-structure/30 backdrop-blur-sm p-6 shadow-2xl rounded-md">
            <div className="flex justify-between items-center mb-6 border-b border-structure/30 pb-4">
              <div className="font-mono text-xs text-vellum/70">MARKETPLACE QUERY</div>
              <div className="text-xs px-2 py-1 bg-verification/20 text-verification font-mono uppercase rounded-md">Results: 142</div>
            </div>
            
            <div className="space-y-4">
              {[
                { id: 'usr_892', badges: ['platinum', 'gold'] },
                { id: 'usr_104', badges: ['silver'] },
                { id: 'usr_773', badges: ['gold', 'gold', 'silver'] }
              ].map((row, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-structure/30 bg-ink/50 hover:border-verification/50 transition-colors cursor-pointer group rounded-md">
                  <div className="font-mono text-sm text-vellum/90 group-hover:text-verification transition-colors">
                    {row.id}
                  </div>
                  <div className="flex gap-2">
                    {row.badges.map((level, i) => (
                      <BadgeIcon key={i} level={level as any} size={20} className="opacity-80" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
