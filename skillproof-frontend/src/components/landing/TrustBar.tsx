import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '../AnimatedCounter';

export function TrustBar() {
  const stats = [
    { value: 12450, label: "Skills Verified", suffix: "+" },
    { value: 94, label: "Recruiter Trust Rate", suffix: "%" },
    { value: 3, label: "Faster Hiring Decisions", suffix: "x" },
  ];

  return (
    <section className="border-b border-structure bg-vellum">
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-structure">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.6 }}
            className="p-8 flex flex-col items-center justify-center text-center"
          >
            <div className="font-serif text-4xl mb-2 flex items-baseline">
              <AnimatedCounter target={stat.value} duration={2} />
              <span className="font-serif ml-1">{stat.suffix}</span>
            </div>
            <div className="font-mono text-xs text-data uppercase tracking-widest">
              {stat.label}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
