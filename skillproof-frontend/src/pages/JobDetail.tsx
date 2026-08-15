import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import { Loader } from '../components/Loader';
import { useAuthStore } from '../store/authStore';
import { ScoreRing } from '../components/ScoreRing';
import toast from 'react-hot-toast';

interface JobDetail {
  id: number;
  company_name: string;
  role_title: string;
  description: string;
  required_tests: {
    id: number;
    title: string;
    category: {
      name: string;
    };
  }[];
}

interface CompanyRequirement {
  company_description: string;
  preferred_min_score: number | null;
  required_skills: { id: number; name: string }[];
}

interface JobProgress {
  status: string;
  overall_fit_score: number | null;
  completed_test_ids: number[];
}

export function JobDetail() {
  const { id } = useParams();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [companyReqs, setCompanyReqs] = useState<CompanyRequirement | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'candidate') {
      navigate('/');
      return;
    }

    Promise.all([
      api.get(`/jobs/${id}/`),
      api.get(`/jobs/${id}/my-progress/`).catch(() => ({ data: null }))
    ])
    .then(([jobRes, progRes]) => {
      setJob(jobRes.data);
      setProgress(progRes.data);
      
      // Fetch company requirements if available
      if (jobRes.data.recruiter_id) {
        api.get(`/jobs/company-requirements/${jobRes.data.recruiter_id}/`)
          .then(reqRes => setCompanyReqs(reqRes.data))
          .catch(() => {});
      }
    })
    .catch(err => {
      toast.error('Failed to load job details');
      navigate('/jobs');
    })
    .finally(() => setLoading(false));
  }, [id, user, navigate]);

  const handleApply = async () => {
    try {
      const res = await api.post(`/jobs/${id}/apply/`);
      setProgress(res.data);
      toast.success('Successfully started application!');
    } catch (err) {
      toast.error('Failed to start application');
    }
  };

  const startTest = (testId: number) => {
    navigate(`/test/${testId}`);
  };

  if (loading) return <Loader />;
  if (!job) return <div>Job not found</div>;

  const isApplied = !!progress;
  const isCompleted = progress?.status === 'completed';
  const completedTestIds = progress?.completed_test_ids || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 bg-mesh min-h-screen"
    >
      <div className="relative overflow-hidden glass-panel rounded-[2.5rem] mx-4 md:mx-8 mt-6 mb-8 border-structure/30">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, var(--color-structure) 40px, var(--color-structure) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, var(--color-structure) 40px, var(--color-structure) 41px)`,
        }} />
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-verification opacity-10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-8 py-16">
          <button onClick={() => navigate('/jobs')} className="font-mono text-xs uppercase tracking-widest text-data mb-8 hover:text-ink transition-colors flex items-center gap-2">
            <span className="text-lg leading-none">&larr;</span> Back to Jobs
          </button>
          
          <motion.div initial={{ y: 20 }} animate={{ y: 0 }} transition={{ delay: 0.1 }}>
            <h1 className="font-serif text-5xl md:text-7xl mb-4 font-light tracking-tight text-ink">
              {job.role_title}
            </h1>
            <div className="inline-block px-4 py-1.5 bg-white rounded-full font-mono text-[12px] uppercase tracking-widest text-ink/80 mb-8 border border-structure/30 shadow-sm">
              {job.company_name}
            </div>
          </motion.div>

          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            {!isApplied ? (
              <button
                onClick={handleApply}
                className="bg-ink text-white px-8 py-4 rounded-xl font-mono text-sm uppercase tracking-widest font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                Start Verification Process
              </button>
            ) : (
              <div className="inline-block px-6 py-3 border border-verification text-verification rounded-xl font-mono text-xs uppercase tracking-widest shadow-sm bg-verification/5">
                Status: <span className="font-bold">{progress.status.replace('_', ' ')}</span>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
            className="md:col-span-2 glass-panel rounded-[2rem] p-10 border-structure/30"
          >
            <h3 className="font-serif text-3xl text-ink mb-6 flex items-center gap-3">
              <span className="text-2xl">📋</span> About the Role
            </h3>
            <div className="text-data leading-relaxed whitespace-pre-wrap text-lg">
              {job.description}
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="md:col-span-1 glass-panel rounded-[2rem] p-8 border-structure/30"
          >
            <h3 className="font-serif text-2xl text-ink mb-6 flex items-center gap-2">
              <span className="text-xl">🏢</span> Company
            </h3>
            {companyReqs ? (
              <>
                {companyReqs.company_description && (
                  <p className="text-sm text-ink/70 mb-8 leading-relaxed">{companyReqs.company_description}</p>
                )}
                
                {companyReqs.preferred_min_score && (
                  <div className="mb-8 p-4 bg-white/50 rounded-xl border border-structure/20">
                    <span className="block font-mono text-[10px] text-data uppercase tracking-widest mb-1">Target Score</span>
                    <span className="font-serif text-4xl text-verification font-bold">{companyReqs.preferred_min_score}+</span>
                  </div>
                )}
                
                {companyReqs.required_skills && companyReqs.required_skills.length > 0 && (
                  <div>
                    <span className="block font-mono text-[10px] text-data uppercase tracking-widest mb-3">Core Stack</span>
                    <div className="flex flex-wrap gap-2">
                      {companyReqs.required_skills.map(s => (
                        <span key={s.id} className="font-mono text-[10px] px-3 py-1.5 bg-white border border-structure/30 text-ink uppercase tracking-widest rounded-lg shadow-sm">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-data italic">Company profile not provided.</p>
            )}
          </motion.div>
        </div>

        {isCompleted && progress.overall_fit_score !== null && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="mb-12 p-10 bg-gradient-to-r from-verification/10 to-emerald-400/10 border-2 border-verification/50 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 justify-between shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/40 backdrop-blur-sm -z-10" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-verification/20 text-verification rounded-full font-mono text-[10px] uppercase tracking-[0.2em] mb-4 font-bold">
                <span className="w-2 h-2 bg-verification rounded-full" /> Job Fit Summary
              </div>
              <h2 className="font-serif text-4xl md:text-5xl text-ink mb-4 font-bold">Requirements Met</h2>
              <p className="text-base text-ink/70 max-w-md leading-relaxed">You have successfully verified all the required skills for this role. Your profile has been prioritized for the recruiter.</p>
            </div>
            <div className="shrink-0 relative z-10">
              <ScoreRing percentage={progress.overall_fit_score} size={160} label="FIT SCORE" strokeWidth={4} />
            </div>
          </motion.div>
        )}

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center justify-between mb-8 border-b border-structure/30 pb-4">
            <h3 className="font-serif text-3xl text-ink">
              Action Plan
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-data bg-white/50 px-3 py-1 rounded-full border border-structure/30">
              {completedTestIds.length} / {job.required_tests.length} Completed
            </span>
          </div>

          <div className="grid gap-6">
            {job.required_tests.map((test, index) => {
              const isTestDone = completedTestIds.includes(test.id);
              return (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 + (index * 0.1) }}
                  key={test.id} 
                  className={`glass-panel border-structure/30 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 transition-all duration-300 relative overflow-hidden group hover:shadow-lg ${isTestDone ? 'border-verification/30 bg-verification/5' : ''}`}
                >
                  {isTestDone && <div className="absolute left-0 top-0 bottom-0 w-1 bg-verification shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
                  
                  <div>
                    <h4 className="font-serif text-2xl text-ink mb-1 group-hover:text-verification transition-colors">{test.title}</h4>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-data">
                      {test.category.name}
                    </p>
                  </div>
                  
                  {isTestDone ? (
                    <div className="flex items-center gap-2 text-verification font-mono text-sm uppercase tracking-widest font-bold bg-white/80 px-4 py-2 rounded-xl shadow-sm border border-verification/20">
                      <span>✓ Verified</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => startTest(test.id)}
                      disabled={!isApplied}
                      className={`px-8 py-3 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all shadow-md ${
                        isApplied 
                        ? 'bg-ink text-white hover:bg-gray-800 hover:-translate-y-1' 
                        : 'bg-structure/50 text-data cursor-not-allowed border border-structure/30'
                      }`}
                    >
                      {isApplied ? 'Take Assessment' : 'Apply to Start'}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
