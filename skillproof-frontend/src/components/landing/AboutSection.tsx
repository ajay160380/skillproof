import React from 'react';
import { motion } from 'framer-motion';

export function AboutSection() {
  return (
    <section className="border-b border-structure bg-vellum py-24 px-8">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-12 h-12 mx-auto border border-ink flex items-center justify-center mb-8 bg-ink text-vellum">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="currentColor" />
            </svg>
          </div>
          <h2 className="font-serif text-3xl mb-6">Why we built SkillProof</h2>
          <div className="font-serif text-xl leading-relaxed text-ink/80 space-y-6">
            <p>
              We built SkillProof because the modern hiring process is broken. Resumes are filled with unverifiable claims, and take-home assignments are easily gamed or outsourced.
            </p>
            <p>
              We believe that if you have the skills, you should be able to prove them instantly. No more resume keyword optimization. No more hoping a recruiter notices your GitHub. Just undeniable, cryptographically verified proof of what you can actually do.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
