import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    <div className="flex-1 bg-transparent">
      <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white shadow-lg rounded-2xl mx-4 md:mx-8 mt-4 mb-8">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, var(--color-structure) 40px, var(--color-structure) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, var(--color-structure) 40px, var(--color-structure) 41px)`,
        }} />
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-verification opacity-20 blur-[100px] rounded-full" />
        
        <div className="relative max-w-4xl mx-auto px-8 py-16">
          <button onClick={() => navigate('/jobs')} className="font-mono text-xs uppercase tracking-widest text-verification mb-8 hover:underline">
            &larr; Back to Jobs
          </button>
          
          <h1 className="font-serif text-5xl md:text-6xl mb-4 font-light tracking-tight">
            {job.role_title}
          </h1>
          <p className="font-mono text-[14px] uppercase tracking-widest text-white/80 mb-8">
            {job.company_name}
          </p>

          {!isApplied ? (
            <button
              onClick={handleApply}
              className="bg-verification text-white px-8 py-3 rounded-lg font-mono text-sm uppercase tracking-widest font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
            >
              Start Application
            </button>
          ) : (
            <div className="inline-block px-4 py-2 border border-verification text-verification rounded-lg font-mono text-xs uppercase tracking-widest shadow-sm bg-verification/10">
              Application Status: {progress.status.replace('_', ' ')}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div className="md:col-span-2 bg-white/70 backdrop-blur-xl border border-white rounded-2xl p-8 shadow-md">
            <h3 className="font-serif text-2xl text-ink mb-4">About the Role</h3>
            <p className="text-data leading-relaxed">
              {job.description}
            </p>
          </div>
          
          <div className="md:col-span-1 bg-white/40 backdrop-blur-xl border border-white rounded-2xl p-6 shadow-md">
            <h3 className="font-serif text-xl text-ink mb-4">Company Profile</h3>
            {companyReqs ? (
              <>
                {companyReqs.company_description && (
                  <p className="text-sm text-ink/70 mb-6">{companyReqs.company_description}</p>
                )}
                
                {companyReqs.preferred_min_score && (
                  <div className="mb-4">
                    <span className="block font-mono text-[10px] text-data uppercase tracking-widest mb-1">Preferred Score</span>
                    <span className="font-serif text-2xl text-verification">{companyReqs.preferred_min_score}+</span>
                  </div>
                )}
                
                {companyReqs.required_skills && companyReqs.required_skills.length > 0 && (
                  <div>
                    <span className="block font-mono text-[10px] text-data uppercase tracking-widest mb-2">Core Skills</span>
                    <div className="flex flex-wrap gap-2">
                      {companyReqs.required_skills.map(s => (
                        <span key={s.id} className="font-mono text-[9px] px-2 py-1 bg-white border border-structure/30 text-ink uppercase tracking-widest rounded-md">
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-data italic">No company profile provided.</p>
            )}
          </div>
        </div>

        {isCompleted && progress.overall_fit_score !== null && (
          <div className="mb-12 p-8 bg-verification/10 border-2 border-verification rounded-xl flex flex-col md:flex-row items-center gap-8 justify-between animate-fade-in shadow-xl">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-verification mb-2">Job Fit Summary</p>
              <h2 className="font-serif text-4xl text-ink mb-2">Requirements Met</h2>
              <p className="text-sm text-ink/70 max-w-md">You have successfully verified all the required skills for this role. Your profile has been shared with the recruiter.</p>
            </div>
            <div className="shrink-0">
              <ScoreRing percentage={progress.overall_fit_score} size={140} label="FIT SCORE" />
            </div>
          </div>
        )}

        <h3 className="font-mono text-sm uppercase tracking-widest text-ink/60 mb-6 border-b border-structure/20 pb-2">
          Required Skill Assessments
        </h3>

        <div className="grid gap-4">
          {job.required_tests.map((test) => {
            const isTestDone = completedTestIds.includes(test.id);
            return (
              <div key={test.id} className={`bg-white/70 backdrop-blur-xl border ${isTestDone ? 'border-verification shadow-md' : 'border-white'} rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-md`}>
                <div>
                  <h4 className="font-serif text-xl text-ink">{test.title}</h4>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink/60 mt-1">
                    Category: {test.category.name}
                  </p>
                </div>
                
                {isTestDone ? (
                  <div className="flex items-center gap-2 text-verification font-mono text-xs uppercase tracking-widest font-bold">
                    <span>✓ Verified</span>
                  </div>
                ) : (
                  <button
                    onClick={() => startTest(test.id)}
                    disabled={!isApplied}
                    className={`px-6 py-2 rounded-lg font-mono text-xs uppercase tracking-widest font-bold transition-all ${
                      isApplied 
                      ? 'bg-ink text-white hover:bg-verification hover:text-white hover:shadow-md' 
                      : 'bg-structure text-data cursor-not-allowed opacity-50'
                    }`}
                  >
                    {isApplied ? 'Take Assessment' : 'Apply to Start'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
