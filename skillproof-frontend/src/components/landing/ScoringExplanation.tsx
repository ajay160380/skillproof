import React from 'react';
import { motion } from 'framer-motion';

export function ScoringExplanation() {
  const steps = [
    { title: "Record", desc: "Live environment. No tab-switching. No external help. We capture the raw data." },
    { title: "Analyze", desc: "We analyze what you say and how you say it using transparent LLM evaluation criteria." },
    { title: "Verify", desc: "Results are locked into a cryptographic stamp. Every score is backed by a transparent breakdown, not a black box." }
  ];

  return (
    <section id="how-it-works" className="border-b border-structure bg-vellum py-20 px-8 overflow-hidden scroll-mt-20">
      <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 max-w-2xl"
        >
          <div className="font-mono text-xs uppercase tracking-widest text-data mb-4">
            Auditable AI Scoring
          </div>
          <h2 className="font-serif text-4xl mb-6">How Scoring Actually Works</h2>
          <p className="text-data leading-relaxed">
            We don't use secret algorithms. Our AI evaluates candidates using the exact same rubrics a senior engineer or hiring manager would use, and we show you the receipts.
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row items-center w-full max-w-4xl relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[1px] bg-structure -z-10"></div>
          
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="flex-1 flex flex-col items-center relative z-10 bg-vellum px-6 py-8"
              >
                <div className="w-16 h-16 border-2 border-ink flex items-center justify-center font-serif text-2xl bg-vellum mb-6">
                  {idx + 1}
                </div>
                <h3 className="font-serif text-xl mb-3">{step.title}</h3>
                <p className="text-sm text-data">{step.desc}</p>
              </motion.div>
              
              {idx < steps.length - 1 && (
                <div className="md:hidden w-[1px] h-12 bg-structure my-4"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
