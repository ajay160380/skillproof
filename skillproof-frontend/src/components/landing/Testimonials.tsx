import React from 'react';
import { motion } from 'framer-motion';
import { BadgeIcon } from '../BadgeIcon';

export function Testimonials() {
  const testimonials = [
    {
      quote: "I didn't have a CS degree, just self-taught Python. SkillProof gave me the platinum badge I needed to bypass the resume screen.",
      name: "ALEX CHEN",
      role: "Candidate",
      badge: "platinum"
    },
    {
      quote: "We stopped doing take-home assignments entirely. If a candidate has a SkillProof Gold credential, they go straight to the final interview.",
      name: "SARAH JENKINS",
      role: "Hiring Manager",
      badge: "gold"
    },
    {
      quote: "It's the only platform where the scoring is transparent enough that I actually trust it. I can see exactly why someone scored a 92.",
      name: "MARCUS TROY",
      role: "Technical Recruiter",
      badge: "silver"
    }
  ];

  return (
    <section className="border-b border-structure bg-structure/5 py-20 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="bg-vellum border border-structure/30 rounded-md p-8 relative flex flex-col h-full shadow-sm"
            >
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <BadgeIcon level={t.badge as any} size={32} />
              </div>
              <p className="font-serif text-lg leading-relaxed mb-8 pr-8 text-ink/90 flex-1">
                "{t.quote}"
              </p>
              <div className="border-t border-structure pt-4 mt-auto">
                <div className="font-mono text-xs font-bold uppercase tracking-widest">{t.name}</div>
                <div className="font-mono text-[10px] text-data uppercase tracking-widest">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
