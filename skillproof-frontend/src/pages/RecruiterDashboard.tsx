import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../services/api';
import { BadgeIcon, type BadgeLevel } from '../components/BadgeIcon';
import { EmptyState } from '../components/EmptyState';
import { Loader } from '../components/Loader';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ScoreRing } from '../components/ScoreRing';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { FeedWidget } from '../components/network/NetworkWidgets';
import { useAuthStore } from '../store/authStore';

// Interfaces
interface PublicBadge {
  id: string;
  skill_category: { name: string; slug: string };
  badge_level: string;
  overall_score?: number;
  sub_scores?: Record<string, number>;
  ai_feedback_text?: string;
  cheating_flags?: any;
  issued_at: string;
}

interface MarketplaceCandidate {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  public_badges: PublicBadge[];
}

interface SavedCandidate {
  id: number;
  candidate_detail: MarketplaceCandidate;
  saved_at: string;
  notes: string;
}

interface DashboardStats {
  total_verified_candidates: number;
  candidates_saved: number;
  average_verified_score: number;
  trending_skills: Array<{ name: string; slug: string; count: number }>;
}

export function RecruiterDashboard() {
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } }, exit: { opacity: 0, transition: { duration: 0.2 } } };
  const tabVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } }, exit: { opacity: 0, y: -10, transition: { duration: 0.2 } } };

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dashboard & Candidates State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [candidates, setCandidates] = useState<MarketplaceCandidate[]>([]);
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [talentMatches, setTalentMatches] = useState<any[]>([]);
  
  // Jobs & Interviews State
  const [jobs, setJobs] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [selectedJobIdForApplicants, setSelectedJobIdForApplicants] = useState<number | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState('highest_score');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingInvite, setSendingInvite] = useState<number | null>(null);

  // Requirements / Company Profile State
  const [reqCompany, setReqCompany] = useState('');
  const [reqDesc, setReqDesc] = useState('');
  const [reqMinScore, setReqMinScore] = useState<number | ''>('');
  const [reqSkills, setReqSkills] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<{id: number, slug: string, name: string}[]>([]);
  const [savingReqs, setSavingReqs] = useState(false);

  // Settings State
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ full_name: '', company_name: '', bio: '', avatar_url: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const navigate = useNavigate();

  const availableSkills = stats?.trending_skills.map(s => ({ value: s.slug, label: s.name })) || [
    { value: 'python', label: 'Python' }, { value: 'react', label: 'React' }, { value: 'sql', label: 'SQL' }, { value: 'communication', label: 'Communication' }
  ];
  const badgeLevels = ['platinum', 'gold', 'silver', 'bronze'];

  useEffect(() => {
    async function fetchAllData() {
      try {
        const [statsRes, reqsRes, catsRes, savedRes, jobsRes, profileRes] = await Promise.all([
          api.get('/marketplace/dashboard-stats/').catch(() => ({ data: null })),
          api.get('/jobs/company-requirements/').catch(() => ({ data: null })),
          api.get('/skills/categories/').catch(() => ({ data: { results: [] } })),
          api.get('/network/my-follows/').catch(() => ({ data: { results: [] } })),
          api.get('/jobs/my-listings/').catch(() => ({ data: { results: [] } })),
          api.get('/accounts/me/').catch(() => ({ data: null }))
        ]);
        
        if(statsRes.data) setStats(statsRes.data);
        
        const cats = Array.isArray(catsRes.data) ? catsRes.data : catsRes.data.results || [];
        setAllCategories(cats);
        
        if (reqsRes.data) {
          setReqCompany(reqsRes.data.company_name || '');
          setReqDesc(reqsRes.data.company_description || '');
          setReqMinScore(reqsRes.data.preferred_min_score || '');
          setReqSkills(reqsRes.data.required_skills?.map((s: any) => s.id.toString()) || []);
        }

        setSavedCandidates(Array.isArray(savedRes.data) ? savedRes.data : savedRes.data.results || []);
        setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data.results || []);
        if(profileRes.data) setProfile(profileRes.data);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAllData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(searchQuery); }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCandidates = useCallback(async () => {
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.append('search', debouncedQuery);
      if (selectedSkills.length > 0) params.append('skill', selectedSkills.join(','));
      if (selectedLevels.length > 0) params.append('badge_level', selectedLevels.join(','));
      if (minScore > 0) params.append('min_score', minScore.toString());
      if (sortBy) params.append('sort_by', sortBy);

      const res = await api.get(`/marketplace/candidates/?${params.toString()}`);
      setCandidates(res.data.results || res.data || []);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setIsSearching(false);
    }
  }, [debouncedQuery, selectedSkills, selectedLevels, minScore, sortBy]);

  const fetchTalentMatches = useCallback(async () => {
    setIsSearching(true);
    try {
      const res = await api.get('/jobs/talent-match/');
      setTalentMatches(res.data);
    } catch (err) {
      console.error('Failed to fetch talent matches:', err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const fetchInterviews = useCallback(async () => {
    try {
      const res = await api.get('/jobs/interviews/my-interviews/');
      setInterviews(res.data.results || res.data || []);
    } catch(e) {}
  }, []);

  useEffect(() => {
    if (activeTab === 'Find Candidates') {
      fetchCandidates();
    } else if (activeTab === 'Dashboard') {
      fetchTalentMatches();
    } else if (activeTab === 'Interviews') {
      fetchInterviews();
    }
  }, [activeTab, fetchCandidates, fetchTalentMatches, fetchInterviews]);

  const fetchApplicantsForJob = async (jobId: number) => {
    try {
      const res = await api.get(`/jobs/my-listings/${jobId}/applicants/`);
      setApplicants(res.data.results || res.data || []);
      setSelectedJobIdForApplicants(jobId);
      setActiveTab('Applicants');
    } catch(e) { toast.error('Failed to fetch applicants'); }
  };

  const handleProposeInterview = async (candidateId: string, jobId?: number) => {
    setSendingInvite(Number(candidateId));
    try {
      // Create a proposed time of tomorrow at 10 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const data: any = { candidate_id: candidateId, proposed_time: tomorrow.toISOString(), message: 'We would love to interview you for an open role!' };
      if(jobId) data.job_listing_id = jobId;

      await api.post('/jobs/interviews/propose/', data);
      toast.success('Interview proposed successfully!');
    } catch (err) {
      toast.error('Failed to propose interview.');
    } finally {
      setSendingInvite(null);
    }
  };

  const toggleFollow = async (candidateId: string) => {
    const isFollowing = savedCandidates.some(s => s.candidate_detail.id === candidateId);
    try {
      if (isFollowing) {
        await api.delete(`/network/unfollow/${candidateId}/`);
        setSavedCandidates(prev => prev.filter(s => s.candidate_detail.id !== candidateId));
        setStats(prev => prev ? { ...prev, candidates_saved: prev.candidates_saved - 1 } : null);
        toast.success('Unfollowed candidate');
      } else {
        const res = await api.post('/network/follow/', { candidate_id: candidateId });
        setSavedCandidates(prev => [res.data, ...prev]);
        setStats(prev => prev ? { ...prev, candidates_saved: prev.candidates_saved + 1 } : null);
        toast.success('Following candidate');
      }
    } catch (err) {
      toast.error('Failed to update follow status');
    }
  };

  const handleSaveRequirements = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReqs(true);
    try {
      await api.put('/jobs/company-requirements/', {
        company_name: reqCompany,
        company_description: reqDesc,
        preferred_min_score: reqMinScore === '' ? null : Number(reqMinScore),
        required_skill_ids: reqSkills
      });
      toast.success('Company profile updated');
    } catch (err) {
      toast.error('Failed to save company profile');
    } finally {
      setSavingReqs(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const res = await api.patch('/accounts/me/', editProfileData);
      setProfile(res.data);
      setIsEditingProfile(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const sidebarItems = [
    {
      category: 'OVERVIEW',
      items: [
        { id: 'Dashboard', icon: '📊', label: 'Dashboard' },
      ]
    },
    {
      category: 'TALENT',
      items: [
        { id: 'Find Candidates', icon: '🔍', label: 'Find Candidates' },
        { id: 'Following', icon: '👥', label: 'Following' },
        { id: 'Leaderboard', icon: '🏆', label: 'Leaderboard', isLink: true, url: '/leaderboard' },
      ]
    },
    {
      category: 'HIRING',
      items: [
        { id: 'Job Listings', icon: '💼', label: 'Job Listings' },
        { id: 'Applicants', icon: '📄', label: 'Applicants' },
        { id: 'Interviews', icon: '🗓️', label: 'Interviews' },
      ]
    },
    {
      category: 'NETWORK',
      items: [
        { id: 'Feed', icon: '📰', label: 'Feed' },
      ]
    },
    {
      category: 'COMPANY',
      items: [
        { id: 'Company Profile', icon: '🏢', label: 'Company Profile' },
      ]
    },
    {
      category: 'SYSTEM',
      items: [
        { id: 'Settings', icon: '⚙️', label: 'Settings' },
      ]
    }
  ];

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><Loader text="LOADING TERMINAL..." size="lg" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-73px)] overflow-hidden bg-transparent">
      {/* Sidebar */}
      <div className="w-64 bg-white/80 backdrop-blur-xl border-r border-structure/20 flex flex-col h-full shrink-0">
        <div className="p-6 pb-2">
          <h3 className="font-serif text-lg font-bold text-ink">Recruiter Portal</h3>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {sidebarItems.map(group => (
            <div key={group.category}>
              <h4 className="font-mono text-[10px] text-data uppercase tracking-widest mb-2 px-2">{group.category}</h4>
              <ul className="space-y-1">
                {group.items.map(item => (
                  <li key={item.id}>
                    {item.isLink ? (
                      <a
                        href={item.url}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-ink/70 hover:bg-structure/10 hover:text-ink"
                      >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                      </a>
                    ) : (
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          activeTab === item.id 
                            ? 'bg-verification/10 text-verification shadow-sm' 
                            : 'text-ink/70 hover:bg-structure/30 hover:text-ink'
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* User Profile Snippet */}
        <div className="p-4 border-t border-structure/20 m-4 rounded-xl bg-structure/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-verification/20 flex items-center justify-center text-verification font-serif font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'R'}
            </div>
            <div>
              <div className="text-xs font-bold text-ink truncate w-24">{user?.email ? user.email.split('@')[0] : 'Recruiter'}</div>
              <div className="text-[9px] font-mono text-data uppercase">Recruiter</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto relative bg-transparent">
        <AnimatePresence mode="wait">
          
          {/* Dashboard Tab */}
          {activeTab === 'Dashboard' && (
            <motion.div key="dashboard" variants={tabVariants} initial="hidden" animate="show" exit="exit">
              <div className="relative overflow-hidden bg-ink text-white mb-8 border-b-4 border-verification">
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)`,
                }} />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-verification opacity-20 blur-3xl rounded-full" />
                
                <div className="relative max-w-5xl mx-auto px-8 py-12">
                  <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-verification mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-verification animate-pulse" />
                        Hiring Overview
                      </div>
                      <h1 className="font-serif text-5xl font-bold mb-4 tracking-tight">
                        Welcome, {profile?.full_name || (user?.email ? user.email.split('@')[0] : 'Recruiter')}
                      </h1>
                      <p className="text-lg text-white/70 max-w-xl leading-relaxed">
                        Track your talent pipeline, connect with verified candidates, and manage your open roles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-5xl mx-auto px-8 pb-12 space-y-8">
                {/* Stats Grid */}
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-data mb-2">Total Verified</div>
                      <div className="text-4xl text-ink font-serif font-bold"><AnimatedCounter target={stats.total_verified_candidates} /></div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-data mb-2">Following</div>
                      <div className="text-4xl text-ink font-serif font-bold"><AnimatedCounter target={stats.candidates_saved} /></div>
                    </div>
                    <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all">
                      <div className="font-mono text-[10px] uppercase tracking-widest text-data mb-2">Platform Avg Score</div>
                      <div className="text-4xl text-ink font-serif font-bold flex items-baseline gap-1">
                        <AnimatedCounter target={stats.average_verified_score} />
                        <span className="text-lg text-data font-mono">/100</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Talent Match AI Spotlight */}
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ink mb-6">Top Matches</h3>
                  {isSearching ? (
                    <div className="py-20 flex justify-center"><Loader /></div>
                  ) : talentMatches.length === 0 ? (
                    <EmptyState 
                      title="No perfect matches yet" 
                      description="We couldn't find candidates matching your exact requirements. Try adjusting your preferred minimum scores in the Company Profile."
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {talentMatches.slice(0, 4).map((match, i) => (
                        <div key={match.user_id} className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-serif text-xl text-ink font-bold">{match.name || match.email.split('@')[0]}</h3>
                              <div className="font-mono text-[10px] text-data uppercase tracking-widest">{match.email}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono text-xs uppercase text-verification font-bold tracking-widest">Global Rank</div>
                              <div className="font-serif text-2xl text-ink">#{match.global_rank}</div>
                            </div>
                          </div>

                          <div className="mb-6">
                            <div className="font-mono text-[10px] text-data uppercase tracking-widest mb-2">Top Verified Skills</div>
                            <div className="flex flex-wrap gap-2">
                              {match.top_skills.map((skill: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5 border border-structure px-2 py-1 bg-structure/5 rounded text-[10px] uppercase font-bold text-ink">
                                  <BadgeIcon level={skill.badge_level.toLowerCase() as BadgeLevel} size={14} />
                                  {skill.skill_name} ({skill.score}%)
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex gap-3">
                            <Link 
                              to={`/profile/${match.user_id}`} 
                              className="flex-1 py-2 border border-structure bg-white/50 text-ink text-center rounded-lg font-mono text-xs uppercase tracking-widest hover:border-ink transition-colors"
                            >
                              Dossier
                            </Link>
                            <button
                              onClick={() => handleProposeInterview(match.user_id.toString())}
                              disabled={sendingInvite === match.user_id}
                              className="flex-1 py-2 bg-ink text-vellum text-center rounded-lg font-mono text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors disabled:opacity-50"
                            >
                              {sendingInvite === match.user_id ? 'Proposing...' : 'Propose Interview'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Find Candidates Tab */}
          {activeTab === 'Find Candidates' && (
            <motion.div key="find-candidates" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
               <div className="flex justify-between items-center">
                  <h2 className="font-serif text-2xl font-bold text-ink">Candidate Marketplace</h2>
               </div>
               
               {/* Search & Filters */}
               <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm">
                 <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-data">🔍</span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search candidates by email or name..."
                      className="w-full pl-11 pr-4 py-4 bg-white/50 border border-structure rounded-xl font-mono text-sm text-ink focus:outline-none focus:border-verification transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-6 py-4 border rounded-xl font-mono text-sm uppercase tracking-widest transition-all ${showFilters ? 'bg-ink text-vellum border-ink' : 'bg-vellum text-ink border-structure hover:border-ink'}`}
                  >
                    Filters {(selectedSkills.length > 0 || selectedLevels.length > 0 || minScore > 0) && '•'}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showFilters && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                       <div className="mt-4 pt-4 border-t border-structure/20 grid grid-cols-1 md:grid-cols-3 gap-8">
                         {/* Skills Filter */}
                        <div>
                          <h3 className="font-mono text-xs uppercase tracking-widest text-data mb-3">Skill Category</h3>
                          <div className="flex flex-wrap gap-2">
                            {availableSkills.map(s => (
                              <button
                                key={s.value}
                                onClick={() => setSelectedSkills(prev => prev.includes(s.value) ? prev.filter(x => x !== s.value) : [...prev, s.value])}
                                className={`px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${selectedSkills.includes(s.value) ? 'bg-verification text-white border-verification' : 'bg-white/50 text-ink border-structure hover:border-verification'}`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Badge Level Filter */}
                        <div>
                          <h3 className="font-mono text-xs uppercase tracking-widest text-data mb-3">Badge Level</h3>
                          <div className="flex flex-wrap gap-2">
                            {badgeLevels.map(l => (
                              <button
                                key={l}
                                onClick={() => setSelectedLevels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])}
                                className={`px-3 py-1.5 rounded-md text-xs font-mono uppercase border transition-all flex items-center gap-1 ${selectedLevels.includes(l) ? 'bg-ink text-vellum border-ink' : 'bg-white/50 text-ink border-structure hover:border-ink'}`}
                              >
                                <BadgeIcon level={l as BadgeLevel} size={14} />
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Score & Sort */}
                        <div>
                          <div className="mb-6">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-mono text-xs uppercase tracking-widest text-data">Min Score</h3>
                              <span className="font-mono text-sm text-ink font-bold">{minScore}</span>
                            </div>
                            <input
                              type="range"
                              min="0" max="100" step="5"
                              value={minScore}
                              onChange={(e) => setMinScore(Number(e.target.value))}
                              className="w-full accent-verification cursor-pointer"
                            />
                          </div>

                          <div>
                            <h3 className="font-mono text-xs uppercase tracking-widest text-data mb-3">Sort By</h3>
                            <select 
                              value={sortBy} 
                              onChange={(e) => setSortBy(e.target.value)}
                              className="w-full p-2.5 bg-white border border-structure rounded-md font-mono text-sm text-ink focus:outline-none focus:border-verification"
                            >
                              <option value="highest_score">Highest Score</option>
                              <option value="recently_verified">Recently Verified</option>
                              <option value="alphabetical">Alphabetical</option>
                            </select>
                          </div>
                        </div>
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
               </div>

               {/* Candidates List */}
               <div className="space-y-4">
                 {isSearching ? (
                   <div className="py-20 flex justify-center"><Loader /></div>
                 ) : candidates.length === 0 ? (
                   <EmptyState title="No candidates found" description="Try adjusting your filters or search query." />
                 ) : (
                   candidates.map((candidate, i) => {
                    const bestBadge = candidate.public_badges[0];
                    const isFollowing = savedCandidates.some(s => s.candidate_detail.id === candidate.id);
                    return (
                      <div key={candidate.id} className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="flex items-center gap-6 md:w-1/3">
                          {bestBadge ? (
                            <ScoreRing percentage={bestBadge.overall_score || 0} size={80} strokeWidth={4} />
                          ) : (
                            <div className="w-[80px] h-[80px] rounded-full bg-structure/20 flex items-center justify-center font-mono text-xs text-data">N/A</div>
                          )}
                          <div>
                            <h3 className="font-serif text-xl font-bold text-ink mb-1">{candidate.full_name || candidate.email.split('@')[0]}</h3>
                            <div className="font-mono text-[10px] text-data tracking-widest">{candidate.email}</div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-2">
                            {candidate.public_badges.slice(0, 3).map(badge => (
                               <div key={badge.id} className="flex items-center gap-1.5 border border-structure bg-white/60 px-2.5 py-1 rounded-md">
                                 <BadgeIcon level={badge.badge_level.toLowerCase() as BadgeLevel} size={14} />
                                 <span className="font-mono text-[10px] uppercase font-bold text-ink truncate max-w-[120px]">
                                   {badge.skill_category.name}
                                 </span>
                               </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 md:w-48 w-full">
                          <Link to={`/profile/${candidate.id}`} className="w-full py-2.5 bg-ink text-vellum text-center rounded-lg font-mono text-xs uppercase tracking-widest hover:bg-ink/90 transition-colors">
                            View Dossier &rarr;
                          </Link>
                          <button 
                            onClick={() => toggleFollow(candidate.id)}
                            className={`w-full py-2.5 border rounded-lg font-mono text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${isFollowing ? 'bg-ink text-vellum border-ink' : 'bg-white/50 text-ink border-structure hover:border-ink'}`}
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </button>
                        </div>
                      </div>
                    );
                   })
                 )}
               </div>
            </motion.div>
          )}

          {/* Following Tab */}
          {activeTab === 'Following' && (
            <motion.div key="following" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-ink">Following</h2>
              {savedCandidates.length === 0 ? (
                <EmptyState title="Not following anyone" description="Browse the marketplace and follow candidates to track them." />
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {savedCandidates.map((saved, i) => (
                    <div key={saved.id} className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                       <div className="flex items-center gap-6 md:w-1/3">
                          {saved.candidate_detail.public_badges[0] ? (
                            <ScoreRing percentage={saved.candidate_detail.public_badges[0].overall_score || 0} size={60} strokeWidth={3} />
                          ) : (
                            <div className="w-[60px] h-[60px] rounded-full bg-structure/20 flex items-center justify-center font-mono text-xs text-data">N/A</div>
                          )}
                          <div>
                            <h3 className="font-serif text-xl font-bold text-ink mb-1">{saved.candidate_detail.full_name || saved.candidate_detail.email.split('@')[0]}</h3>
                            <div className="font-mono text-[10px] uppercase text-data tracking-widest">
                              Following since {new Date(saved.saved_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 flex gap-2">
                           {saved.candidate_detail.public_badges.slice(0, 3).map(badge => (
                             <div key={badge.id} className="flex items-center gap-1.5 border border-structure bg-white/60 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-ink">
                               <BadgeIcon level={badge.badge_level.toLowerCase() as BadgeLevel} size={12} />
                               {badge.skill_category.name}
                             </div>
                           ))}
                        </div>
                        <div className="flex flex-col gap-2 md:w-48 w-full">
                           <Link to={`/profile/${saved.candidate_detail.id}`} className="w-full py-2 bg-ink text-vellum text-center rounded-lg font-mono text-[10px] uppercase tracking-widest hover:bg-ink/90 transition-colors">
                            View Dossier
                          </Link>
                           <button onClick={() => toggleFollow(saved.candidate_detail.id)} className="w-full py-2 border border-structure bg-white/50 text-ink text-center rounded-lg font-mono text-[10px] uppercase tracking-widest hover:border-ink transition-colors">
                            Unfollow
                          </button>
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Job Listings Tab */}
          {activeTab === 'Job Listings' && (
            <motion.div key="jobs" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
               <div className="flex justify-between items-center">
                  <h2 className="font-serif text-2xl font-bold text-ink">Your Job Listings</h2>
                  <button className="bg-ink text-white px-6 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-ink/90 transition-colors">
                    + Post New Job
                  </button>
               </div>
               
               <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm min-h-[400px]">
                 {jobs.length > 0 ? (
                   <div className="space-y-4">
                     {jobs.map(job => (
                       <div key={job.id} className="flex flex-col md:flex-row justify-between items-start md:items-center border border-structure/20 rounded-xl p-6 bg-white gap-4 hover:border-verification transition-all">
                         <div>
                           <h3 className="font-serif text-xl font-bold text-ink">{job.role_title}</h3>
                           <p className="font-mono text-[10px] text-data uppercase tracking-widest mt-1">Posted: {new Date(job.created_at).toLocaleDateString()}</p>
                         </div>
                         <div className="flex gap-3 w-full md:w-auto">
                           <button 
                             onClick={() => fetchApplicantsForJob(job.id)}
                             className="flex-1 md:flex-none px-6 py-2 bg-ink text-white rounded-lg font-mono text-[10px] uppercase tracking-widest hover:bg-ink/90 transition-colors"
                           >
                             View Applicants
                           </button>
                           <button className="flex-1 md:flex-none px-4 py-2 border border-structure text-ink rounded-lg font-mono text-[10px] uppercase tracking-widest hover:border-ink transition-colors">
                             Edit
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <EmptyState title="No active job listings" description="Post a job to start attracting talent." />
                 )}
               </div>
            </motion.div>
          )}

          {/* Applicants Tab */}
          {activeTab === 'Applicants' && (
            <motion.div key="applicants" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
               <div className="flex gap-4 items-center mb-6">
                 <button onClick={() => setActiveTab('Job Listings')} className="w-10 h-10 rounded-full border border-structure/20 flex items-center justify-center text-ink hover:bg-structure/10 transition-colors">
                   ←
                 </button>
                 <h2 className="font-serif text-2xl font-bold text-ink">Applicants</h2>
               </div>
               
               <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm min-h-[400px]">
                 {applicants.length > 0 ? (
                   <div className="space-y-4">
                     {applicants.map(app => (
                       <div key={app.id} className="flex justify-between items-center border border-structure/20 rounded-xl p-6 bg-white">
                         <div className="flex items-center gap-4">
                           {app.overall_fit_score ? (
                             <ScoreRing percentage={app.overall_fit_score} size={60} strokeWidth={3} />
                           ) : (
                             <div className="w-[60px] h-[60px] rounded-full bg-structure/20 flex items-center justify-center font-mono text-[10px] text-data">TBD</div>
                           )}
                           <div>
                             <h3 className="font-serif text-lg font-bold text-ink">{app.candidate_name || app.candidate_email}</h3>
                             <p className="font-mono text-[9px] uppercase tracking-widest text-data">Status: {app.status}</p>
                           </div>
                         </div>
                         <div className="flex gap-2">
                           <Link to={`/profile/${app.candidate_id}`} className="px-4 py-2 border border-structure text-ink rounded-lg font-mono text-[10px] uppercase tracking-widest hover:border-ink transition-colors">
                             Profile
                           </Link>
                           <button onClick={() => handleProposeInterview(app.candidate_id.toString(), selectedJobIdForApplicants || undefined)} className="px-4 py-2 bg-ink text-white rounded-lg font-mono text-[10px] uppercase tracking-widest hover:bg-ink/90 transition-colors">
                             Propose Interview
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <EmptyState title="No applicants yet" description="Wait for candidates to apply or actively reach out to talent." />
                 )}
               </div>
            </motion.div>
          )}

          {/* Interviews Tab */}
          {activeTab === 'Interviews' && (
            <motion.div key="interviews" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-ink">Proposed & Upcoming Interviews</h2>
              <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm min-h-[400px]">
                {interviews.length > 0 ? (
                  <div className="space-y-4">
                    {interviews.map((interview, i) => (
                      <div key={i} className="flex flex-col md:flex-row justify-between md:items-center border border-structure/20 rounded-xl p-6 bg-white gap-4">
                        <div className="flex gap-6 items-center">
                          <div className="w-16 h-16 rounded-xl bg-ink text-white flex flex-col items-center justify-center leading-none">
                            <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
                              {new Date(interview.proposed_time).toLocaleDateString(undefined, { month: 'short' })}
                            </span>
                            <span className="font-serif font-bold text-xl">
                              {new Date(interview.proposed_time).getDate()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-serif text-xl font-bold text-ink">{interview.candidate_name || 'Candidate'}</h3>
                            <p className="font-mono text-[10px] text-ink uppercase tracking-widest mt-1 mb-1">{interview.job_role || 'General Interview'}</p>
                            <p className="font-mono text-[9px] text-data uppercase tracking-widest">
                              Time: {new Date(interview.proposed_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                            <div className="mt-2 inline-block px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest font-bold border border-structure/20 bg-structure/5">
                              Status: <span className={interview.status === 'accepted' ? 'text-verification' : interview.status === 'declined' ? 'text-red-500' : 'text-data'}>{interview.status}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                           <Link to={`/profile/${interview.candidate}`} className="px-6 py-2 border border-structure rounded-lg font-mono text-[10px] uppercase tracking-widest hover:border-ink transition-colors">
                             View Candidate
                           </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No interviews scheduled" description="Propose interviews from the Talent Match or Applicants page." />
                )}
              </div>
            </motion.div>
          )}

          {/* Feed Tab */}
          {activeTab === 'Feed' && (
            <motion.div key="feed" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-3xl mx-auto px-8 py-10 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-ink">Professional Network</h2>
              <FeedWidget />
            </motion.div>
          )}

          {/* Company Profile Tab */}
          {activeTab === 'Company Profile' && (
            <motion.div key="company" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-3xl mx-auto px-8 py-10 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-ink">Company Requirements Profile</h2>
              <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm">
                <form onSubmit={handleSaveRequirements} className="space-y-6">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-ink mb-2">Company Name</label>
                    <input
                      type="text" value={reqCompany} onChange={e => setReqCompany(e.target.value)}
                      className="w-full border border-structure/30 rounded-xl p-4 focus:outline-none focus:border-verification font-mono text-sm bg-white/50"
                      placeholder="e.g. TechCorp" required
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-ink mb-2">Company Description</label>
                    <textarea
                      value={reqDesc} onChange={e => setReqDesc(e.target.value)}
                      className="w-full border border-structure/30 rounded-xl p-4 focus:outline-none focus:border-verification text-sm min-h-[120px] bg-white/50"
                      placeholder="Tell candidates what you do..."
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-ink mb-2">Minimum Preferred Score</label>
                    <input
                      type="number" min="0" max="100" value={reqMinScore} onChange={e => setReqMinScore(e.target.value ? Number(e.target.value) : '')}
                      className="w-full md:w-1/3 border border-structure/30 rounded-xl p-4 focus:outline-none focus:border-verification font-mono text-sm bg-white/50"
                      placeholder="e.g. 75"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-ink mb-2">Required Core Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {allCategories.map(cat => (
                        <button
                          key={cat.id} type="button"
                          onClick={() => setReqSkills(prev => prev.includes(cat.id.toString()) ? prev.filter(id => id !== cat.id.toString()) : [...prev, cat.id.toString()])}
                          className={`px-4 py-2 border rounded-lg font-mono text-[10px] uppercase tracking-widest transition-colors ${
                            reqSkills.includes(cat.id.toString()) 
                            ? 'bg-verification/10 border-verification text-verification font-bold' 
                            : 'bg-white/50 border-structure/30 text-data hover:border-ink'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-6 border-t border-structure/20">
                    <button type="submit" disabled={savingReqs} className="bg-ink text-white px-8 py-4 rounded-xl font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-ink/90 disabled:opacity-50">
                      {savingReqs ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === 'Settings' && (
            <motion.div key="settings" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-3xl mx-auto px-8 py-10 space-y-8">
              <h2 className="font-serif text-2xl font-bold text-ink">Settings</h2>
              
              <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif text-lg font-bold text-ink">Personal Profile</h3>
                  {!isEditingProfile && (
                    <button onClick={() => setIsEditingProfile(true)} className="text-xs font-mono uppercase tracking-widest text-data hover:text-ink underline">
                      Edit Profile
                    </button>
                  )}
                </div>
                
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-1">Full Name</label>
                      <input type="text" value={editProfileData.full_name} onChange={e => setEditProfileData({...editProfileData, full_name: e.target.value})} className="w-full p-3 rounded-lg border border-structure/30 bg-white/50 font-mono text-sm" />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-1">Bio</label>
                      <textarea value={editProfileData.bio} onChange={e => setEditProfileData({...editProfileData, bio: e.target.value})} className="w-full p-3 rounded-lg border border-structure/30 bg-white/50 font-mono text-sm" rows={3} />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button onClick={handleSaveProfile} disabled={isSavingProfile} className="px-6 py-2 bg-ink text-white rounded-lg font-mono text-[10px] uppercase font-bold tracking-widest">
                        {isSavingProfile ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setIsEditingProfile(false)} className="px-6 py-2 border border-structure/30 text-ink rounded-lg font-mono text-[10px] uppercase font-bold tracking-widest">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-full bg-ink text-white flex items-center justify-center font-serif text-2xl">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="font-serif font-bold text-xl text-ink">{profile?.full_name || (user?.email ? user.email.split('@')[0] : 'User')}</div>
                        <div className="font-mono text-xs text-data">{user?.email}</div>
                      </div>
                    </div>
                    {profile?.bio && (
                      <div className="mt-4 p-4 bg-structure/5 rounded-xl border border-structure/20 text-sm text-ink/80 italic">
                        "{profile.bio}"
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm">
                 <h3 className="font-serif text-lg font-bold text-ink mb-6">Account Actions</h3>
                 <button 
                  onClick={() => {
                    useAuthStore.getState().logout();
                    navigate('/login');
                  }} 
                  className="px-6 py-3 border border-red-500/30 text-red-600 rounded-lg font-mono text-[10px] uppercase font-bold tracking-widest hover:bg-red-50 transition-colors"
                >
                   Log Out
                 </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
