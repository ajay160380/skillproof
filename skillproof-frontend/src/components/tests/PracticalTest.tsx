import React, { useState } from 'react';
import { motion } from 'framer-motion';

export function PracticalTest({ testId, testData, onSubmit }: any) {
  const [projectUrl, setProjectUrl] = useState('');
  
  const submitTest = () => {
    if (!projectUrl) return;
    onSubmit({ project_url: projectUrl });
  };

  return (
    <div className="flex-1 overflow-auto bg-vellum text-ink flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white border border-structure p-8 rounded-xl shadow-lg"
      >
        <h2 className="font-serif text-3xl mb-4 text-ink">{testData.title}</h2>
        
        <div className="bg-structure/10 p-6 rounded-lg font-mono text-sm mb-8 whitespace-pre-wrap text-data/90 border border-structure/20">
          <h3 className="uppercase tracking-widest text-ink font-bold mb-2">Instructions</h3>
          {testData.instructions || "Please complete the project and submit the repository or portfolio URL below."}
        </div>

        {testData.problem_statement && (
           <div className="bg-structure/5 p-6 rounded-lg font-mono text-sm mb-8 whitespace-pre-wrap text-ink border border-structure/20">
             <h3 className="uppercase tracking-widest text-ink font-bold mb-2">Problem Statement</h3>
             {testData.problem_statement}
           </div>
        )}

        <div className="mb-8">
          <label className="block font-mono text-xs uppercase tracking-widest text-data mb-2 font-bold">
            Project URL (GitHub, GitLab, Portfolio, etc.)
          </label>
          <input
            type="url"
            value={projectUrl}
            onChange={e => setProjectUrl(e.target.value)}
            className="w-full bg-white border border-structure rounded-lg p-4 font-mono text-sm text-ink focus:outline-none focus:border-ink transition-colors"
            placeholder="https://github.com/username/project"
            required
          />
        </div>
        
        <div className="flex justify-end pt-6 border-t border-structure/20">
          <button
            onClick={submitTest}
            disabled={!projectUrl}
            className="px-8 py-3 bg-ink text-vellum font-mono text-xs uppercase tracking-widest hover:bg-verification transition-colors rounded-lg font-bold shadow-sm disabled:opacity-50"
          >
            Submit Project
          </button>
        </div>
      </motion.div>
    </div>
  );
}
