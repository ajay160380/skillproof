import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
import { useAuthStore } from '../store/authStore';

interface JobListing {
  id: number;
  company_name: string;
  role_title: string;
  description: string;
  is_active: boolean;
  required_tests: {
    id: number;
    title: string;
    category: {
      name: string;
    };
  }[];
}

export function JobsBrowser() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'candidate') {
      navigate('/');
      return;
    }
    
    api.get(`/jobs/?search=${search}`)
      .then(res => setJobs(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [search, user, navigate]);

  if (loading) return <Loader />;

  return (
    <div className="flex-1 bg-vellum bg-mesh">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-ink text-white mb-8 border-b-4 border-verification">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)`,
        }} />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-verification opacity-20 blur-3xl rounded-full" />
        
        <div className="relative max-w-6xl mx-auto px-8 py-16">
          <p className="font-mono text-[10px] text-verification uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-verification rounded-full" />
            COMPANY ROLES
          </p>
          <h1 className="font-serif text-5xl md:text-6xl mb-4 font-light tracking-tight">
            Targeted Roles
          </h1>
          <p className="text-white/60 text-sm md:text-base font-light max-w-lg leading-relaxed">
            Browse roles from top companies and complete their specific required assessments to prove your fit.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-20">
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search by role or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 px-4 py-3 bg-white border border-structure/20 rounded-md font-mono text-xs focus:outline-none focus:border-verification focus:ring-1 focus:ring-verification transition-all shadow-sm"
          />
        </div>

        {jobs.length === 0 ? (
          <EmptyState message="No active job listings found matching your search." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job, idx) => (
              <div 
                key={job.id}
                className="bg-white border border-structure/20 p-6 shadow-sm hover:shadow-md transition-all duration-300 relative group animate-fade-in flex flex-col h-full"
                style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'both' }}
              >
                <div className="mb-6 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-2xl text-ink leading-tight group-hover:text-verification transition-colors">
                      {job.role_title}
                    </h3>
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60 mb-4">
                    {job.company_name}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {job.required_tests.map(test => (
                      <span key={test.id} className="px-2 py-1 bg-structure/5 border border-structure/10 text-ink/70 font-mono text-[9px] uppercase tracking-widest rounded">
                        {test.category.name}
                      </span>
                    ))}
                  </div>
                </div>
                
                <Link
                  to={`/jobs/${job.id}`}
                  className="w-full text-center px-4 py-3 bg-ink text-vellum font-mono text-xs uppercase tracking-widest hover:bg-verification hover:text-white transition-all shadow-sm"
                >
                  View Requirements
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
