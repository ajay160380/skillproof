import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const faqs = [
    {
      q: "How is this different from a coding test platform?",
      a: "Traditional platforms rely on hidden test cases and output matching. SkillProof records your actual session and uses AI to evaluate your approach, code quality, and problem-solving process—just like a human interviewer would."
    },
    {
      q: "What if I disagree with my score?",
      a: "Every score is backed by a transparent breakdown. If you believe the AI missed context, you can request a manual review by one of our senior engineering partners."
    },
    {
      q: "Is my recording stored or shared?",
      a: "Your raw recordings are securely stored and only accessible to our AI evaluation engine. Recruiters only see your verified score and the cryptographic badge, never your raw audio or video, unless you explicitly choose to share it."
    },
    {
      q: "Can I retake a test?",
      a: "Yes. You can retake any assessment after a 14-day cooldown period. This ensures candidates have time to actually improve their skills between attempts."
    },
    {
      q: "How do recruiters verify a badge is real?",
      a: "Every badge has a unique cryptographic signature. Recruiters can click any badge on your profile to see the real-time audit log confirming it was issued by our verification engine."
    }
  ];

  return (
    <section id="faq" className="border-b border-structure bg-vellum py-20 px-8 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="font-serif text-4xl mb-4">Frequently Asked Questions</h2>
          <p className="font-mono text-xs text-data uppercase tracking-widest">
            Radical transparency is our core principle.
          </p>
        </motion.div>

        <div className="border-t border-structure">
          {faqs.map((faq, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="border-b border-structure"
            >
              <button 
                onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                className="w-full text-left py-6 flex justify-between items-center group focus:outline-none"
              >
                <span className="font-serif text-xl group-hover:text-verification transition-colors">
                  {faq.q}
                </span>
                <span className="font-mono text-xl text-data ml-4">
                  {openIdx === idx ? '−' : '+'}
                </span>
              </button>
              <AnimatePresence>
                {openIdx === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 text-data leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
