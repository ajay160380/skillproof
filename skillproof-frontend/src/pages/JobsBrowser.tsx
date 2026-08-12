import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex-1 bg-mesh min-h-screen"
    >
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-ink text-white mb-8 border-b-4 border-verification">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)`,
        }} />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-verification opacity-20 blur-3xl rounded-full" />
        
        <div className="relative max-w-6xl mx-auto px-8 py-16">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-mono text-[10px] text-verification uppercase tracking-[0.4em] mb-4 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-verification rounded-full animate-pulse" />
            OPPORTUNITY NETWORK
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-serif text-5xl md:text-6xl mb-4 font-light tracking-tight"
          >
            Targeted Roles
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 text-sm md:text-base font-light max-w-lg leading-relaxed"
          >
            Browse roles from top companies and complete their specific required assessments to prove your fit.
          </motion.p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12 relative"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
             <span className="text-xl">🔍</span>
          </div>
          <input
            type="text"
            placeholder="Search by role or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-96 pl-12 pr-4 py-4 glass-panel border-structure/30 rounded-xl font-mono text-sm focus:outline-none focus:border-verification focus:ring-2 focus:ring-verification/20 transition-all shadow-md"
          />
        </motion.div>

        {jobs.length === 0 ? (
          <EmptyState message="No active job listings found matching your search." />
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {jobs.map((job) => (
              <motion.div 
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ y: -5 }}
                key={job.id}
                className="glass-panel border-structure/30 p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative group flex flex-col h-full rounded-3xl"
              >
                <div className="mb-6 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-2xl text-ink leading-tight group-hover:text-verification transition-colors">
                      {job.role_title}
                    </h3>
                  </div>
                  <p className="font-mono text-xs uppercase tracking-widest text-ink/60 mb-6 bg-white/50 px-3 py-1 rounded-full w-fit">
                    {job.company_name}
                  </p>
                  
                  <div className="space-y-2 mt-4">
                    <div className="text-[10px] font-mono text-data uppercase tracking-widest mb-1">Required Tests</div>
                    <div className="flex flex-wrap gap-2">
                      {job.required_tests.map(test => (
                        <span key={test.id} className="px-2 py-1 bg-white/60 border border-structure/30 text-ink/70 font-mono text-[9px] uppercase tracking-widest rounded-md shadow-sm">
                          {test.category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Link
                  to={`/jobs/${job.id}`}
                  className="w-full text-center px-4 py-4 bg-ink text-vellum font-mono text-xs uppercase tracking-widest hover:bg-gray-800 transition-all rounded-xl shadow-md mt-4"
                >
                  View Details
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
