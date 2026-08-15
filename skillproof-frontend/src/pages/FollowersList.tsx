import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Loader } from '../components/Loader';
import { EmptyState } from '../components/EmptyState';

interface Follower {
  id: number;
  recruiter_name: string;
  company_name: string;
  avatar_url: string | null;
  saved_at: string;
}

export function FollowersList() {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role !== 'candidate') {
      navigate('/');
      return;
    }

    api.get('/network/followers/')
      .then(res => setFollowers(res.data.results || res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (loading) return <Loader />;

  return (
    <div className="flex-1 bg-vellum bg-mesh">
      <div className="relative overflow-hidden bg-ink text-white mb-8 border-b-4 border-verification">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)`,
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-verification opacity-20 blur-3xl rounded-full" />
        
        <div className="relative max-w-4xl mx-auto px-8 py-16">
          <p className="font-mono text-[10px] text-verification uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-verification rounded-full" />
            NETWORK ACTIVITY
          </p>
          <h1 className="font-serif text-5xl md:text-6xl mb-4 font-light tracking-tight">
            Network Followers
          </h1>
          <p className="text-white/60 text-sm md:text-base font-light max-w-lg leading-relaxed">
            Recruiters actively tracking your verified skill profile.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 pb-20">
        {followers.length === 0 ? (
          <EmptyState message="No recruiters following yet — complete more verified skills to get noticed." />
        ) : (
          <div className="bg-white border border-structure/20 shadow-sm rounded-lg overflow-hidden animate-fade-in-up">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-ink text-white font-mono text-[10px] uppercase tracking-widest border-b border-structure/10">
                  <th className="px-6 py-4">Recruiter</th>
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4 text-right">Following Since</th>
                </tr>
              </thead>
              <tbody>
                {followers.map((follower) => (
                  <tr key={follower.id} className="border-b border-structure/10 hover:bg-structure/5 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-structure/30 overflow-hidden flex items-center justify-center shrink-0">
                          {follower.avatar_url ? (
                            <img src={follower.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-serif text-ink">{follower.recruiter_name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="font-serif text-lg text-ink font-semibold">
                          {follower.recruiter_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono text-xs uppercase tracking-widest text-ink/70">
                        {follower.company_name}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-data">
                        {new Date(follower.saved_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
