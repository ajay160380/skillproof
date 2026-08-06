import React from 'react';
import { motion } from 'framer-motion';
import { ScoreRing } from '../ScoreRing';

export function FeaturesGrid() {
  const features = [
    {
      title: "Python Engineering",
      desc: "Measured: correctness, code quality, and debugging approach via live algorithmic challenges.",
      score: 92,
      label: "CODE"
    },
    {
      title: "Communication",
      desc: "Measured: clarity, confidence, and structure via raw audio transcription and linguistic analysis.",
      score: 85,
      label: "AUDIO"
    },
    {
      title: "SQL Data Analysis",
      desc: "Measured: query accuracy, optimization, and edge-case handling on live databases.",
      score: 88,
      label: "DATA"
    },
    {
      title: "UI/UX Architecture",
      desc: "Measured: component structure, accessibility, and modern design patterns.",
      score: 95,
      label: "SYSTEM"
    }
  ];

  return (
    <section id="features" className="border-b border-structure bg-vellum py-20 px-8 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className="font-serif text-4xl mb-4">What Gets Verified</h2>
          <p className="font-mono text-xs text-data uppercase tracking-widest max-w-lg">
            We don't measure multiple-choice guessing. We measure real execution.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
              className="border border-structure/30 rounded-md p-8 flex flex-col sm:flex-row gap-8 items-start sm:items-center bg-vellum shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex-1">
                <div className="font-mono text-[10px] text-verification uppercase tracking-widest mb-2 border border-verification/30 px-2 py-1 inline-block bg-verification/5 rounded-md">
                  TRACK: {f.label}
                </div>
                <h3 className="font-serif text-2xl mb-2">{f.title}</h3>
                <p className="text-sm text-data leading-relaxed">{f.desc}</p>
              </div>
              <div className="flex-shrink-0">
                <ScoreRing percentage={f.score} label="PREVIEW" size={100} strokeWidth={3} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
