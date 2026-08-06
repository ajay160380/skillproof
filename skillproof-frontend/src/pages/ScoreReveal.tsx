import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { ProcessingState } from '../components/ProcessingState';
import { AnimatedCounter } from '../components/AnimatedCounter';

export function ScoreReveal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('pending');
  const [attempt, setAttempt] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealPhase, setRevealPhase] = useState<'processing' | 'decoding' | 'stamped'>('processing');

  useEffect(() => {
    let pollInterval: any;

    const pollStatus = async () => {
      try {
        // First check status (lightweight)
        const statusRes = await api.get(`/assessments/${id}/status/`);
        setStatus(statusRes.data.status);
        
        if (statusRes.data.status === 'completed') {
          clearInterval(pollInterval);
          
          // NOW fetch full attempt detail with score
          const detailRes = await api.get(`/assessments/${id}/`);
          setAttempt(detailRes.data);
          
          // Begin reveal sequence
          setRevealPhase('decoding');
          setTimeout(() => {
            setRevealPhase('stamped');
          }, 800);
        } else if (statusRes.data.status === 'failed') {
          clearInterval(pollInterval);
          setError('The AI engine was unable to process your submission.');
        }
      } catch (err: any) {
        console.error('Score polling error:', err);
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          clearInterval(pollInterval);
        } else if (err.response?.status === 404) {
          setError('This test attempt was not found.');
          clearInterval(pollInterval);
        }
      }
    };

    pollStatus();
    pollInterval = setInterval(pollStatus, 3000);

    return () => clearInterval(pollInterval);
  }, [id]);

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="border border-seal/30 rounded-lg p-12 max-w-lg text-center">
          <div className="font-serif text-3xl mb-4 text-seal">Verification Failed</div>
          <p className="font-mono text-xs text-data mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-ink text-vellum font-mono text-xs uppercase tracking-widest hover:bg-verification transition-colors rounded-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="border border-seal/30 rounded-lg p-12 max-w-lg text-center">
          <div className="font-serif text-3xl mb-4 text-seal">Verification Failed</div>
          <p className="font-mono text-xs text-data mb-6">The AI engine was unable to process your submission. Please try again.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-ink text-vellum font-mono text-xs uppercase tracking-widest hover:bg-verification transition-colors rounded-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (revealPhase === 'processing') {
    return (
      <div className="flex-1 p-8 max-w-4xl mx-auto flex flex-col pt-32">
        <ProcessingState label="ANALYZING TEST RESULTS..." />
      </div>
    );
  }

  const score = attempt?.score;
  const overallScore = score?.overall_score || 0;
  const cheatingFlags = score?.cheating_flags;
  const isHighSuspicion = cheatingFlags?.ai_suspicion_level === 'high';
  const isLowSuspicion = cheatingFlags?.ai_suspicion_level === 'low';
  
  let stampColor = "text-verification";
  let stampText = "Cryptographically Verified";
  if (overallScore < 30) {
    stampColor = "text-red-600";
    stampText = "Verification Failed";
  } else if (overallScore < 60) {
    stampColor = "text-blue-600";
    stampText = "Partial Verification";
  }

  return (
    <div className="flex-1 p-8 flex items-center justify-center bg-vellum">
      <div className="max-w-2xl w-full border border-structure shadow-2xl shadow-ink/10 relative overflow-hidden bg-vellum rounded-lg">
        
        {/* Header */}
        <div className="p-8 border-b border-structure bg-structure/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="font-mono text-[10px] text-data uppercase tracking-widest mb-1 flex items-center gap-2">
              Assessment Complete
              {cheatingFlags && (
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${isHighSuspicion ? 'bg-red-500/10 text-red-500 border border-red-500/20' : isLowSuspicion ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-verification/10 text-verification border border-verification/20'}`}>
                  {isHighSuspicion ? 'Integrity Flagged' : isLowSuspicion ? 'Integrity Reviewed' : 'Integrity Clean'}
                </span>
              )}
            </div>
            <h1 className="font-serif text-2xl">{attempt?.test?.title || 'Official AI Evaluation'}</h1>
          </div>
          <div className="font-mono text-[10px] text-data text-left md:text-right">
            <div>ID: {id}</div>
            <div>TIMESTAMP: {attempt?.completed_at ? new Date(attempt.completed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}</div>
          </div>
        </div>

        {/* The Document Body */}
        <div className="p-8 relative min-h-[400px]">
          
          <AnimatePresence>
            {revealPhase === 'stamped' && score && (
              <motion.div 
                initial={{ scale: 3, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: -5 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none mix-blend-multiply ${stampColor}`}
              >
                {/* SVG Cryptographic Stamp */}
                <svg width="300" height="300" viewBox="0 0 300 300" className="opacity-90">
                  <circle cx="150" cy="150" r="140" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="10 10" />
                  <circle cx="150" cy="150" r="120" fill="none" stroke="currentColor" strokeWidth="4" />
                  <path id="curve" d="M 50,150 A 100,100 0 1,1 250,150 A 100,100 0 1,1 50,150" fill="transparent" />
                  <text className="font-mono text-2xl font-bold uppercase tracking-[0.5em]" fill="currentColor">
                    <textPath href="#curve" startOffset="50%" textAnchor="middle">
                      {stampText}
                    </textPath>
                  </text>
                  <text x="150" y="160" textAnchor="middle" className="font-serif text-[80px]" fill="currentColor">
                    {score?.overall_score}
                  </text>
                  <text x="150" y="195" textAnchor="middle" className="font-mono text-sm uppercase font-bold tracking-widest" fill="currentColor">
                    Score
                  </text>
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Decoding Effect & Final Data */}
          <div className="space-y-6 relative z-0">
            {score ? (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(score?.sub_scores || {}).map(([key, val]) => (
                    <div key={key} className="border border-structure p-4 rounded-md bg-white/40">
                      <div className="font-mono text-[10px] text-data uppercase tracking-widest mb-1">{key.replace(/_/g, ' ')}</div>
                      <div className="font-serif text-2xl font-bold">
                        {revealPhase === 'stamped' ? val as number : <AnimatedCounter target={val as number} duration={3} />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Auditor Feedback & Proctor Audit Warning */}
                <div className="border border-structure p-6 rounded-md bg-white/60 backdrop-blur-md">
                  <div className="font-mono text-[10px] text-data uppercase tracking-widest mb-3 border-b border-structure pb-2 font-bold flex items-center justify-between">
                    <span>AI Auditor Feedback & Audit Trail</span>
                    {score?.ai_feedback_text?.includes('PROCTOR') && (
                      <span className="text-red-600 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[9px]">
                        VIOLATIONS DETECTED
                      </span>
                    )}
                  </div>
                  
                  <div className="font-mono text-xs text-ink leading-relaxed space-y-3">
                    <p>{score?.ai_feedback_text}</p>
                  </div>
                </div>

                {isHighSuspicion && (
                  <div className="border border-red-500/30 p-4 rounded-md bg-red-500/5">
                    <div className="font-mono text-xs text-red-600 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                      <span>⚠️</span> Integrity Consideration Factor
                    </div>
                    <div className="font-mono text-xs text-red-800/80 leading-relaxed">
                      Your submission showed signs of compromised integrity (e.g., pasting a full solution, reading from a script, or extensive tab switching). This has been factored into your verified score.
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="font-mono text-xs text-data uppercase tracking-widest">Loading score data...</div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <AnimatePresence>
          {revealPhase === 'stamped' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="p-8 border-t border-structure bg-structure/10 flex justify-end gap-4"
            >
              <Link 
                to="/dashboard"
                className="px-6 py-3 border border-structure text-ink font-mono text-xs uppercase tracking-widest hover:bg-structure/30 transition-colors rounded-md"
              >
                Return to Dossier
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
