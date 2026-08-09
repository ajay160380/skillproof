import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { BadgeIcon, type BadgeLevel } from '../components/BadgeIcon';
import { Loader } from '../components/Loader';
import { useAuthStore } from '../store/authStore';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { ScoreRing } from '../components/ScoreRing';
import { StatusPill } from '../components/StatusPill';
import { ResumeUploader } from '../components/ResumeUploader';
import { getMyResume, getSuggestedTests, deleteResume, type Resume, type SuggestedTest } from '../services/resumeService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import toast from 'react-hot-toast';

import { ActivityStreakWidget, RecentJobMatchesWidget, UpcomingInterviewsWidget, PortfolioWidget } from '../components/dashboard/DashboardWidgets';
import { FeedWidget, NetworkDiscoveryWidget, FollowersWidget } from '../components/network/NetworkWidgets';
import { ProfileView } from '../components/profile/ProfileView';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { PremiumToggle } from '../components/PremiumToggle';
import { MessagesView } from './MessagesView';

interface SkillTest {
  id: number;
  title: string;
  test_type: 'communication' | 'coding' | 'screen_task' | 'practical';
  difficulty: string;
  duration_minutes: number;
  category: { id: number; name: string };
}

interface SkillCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

interface Badge {
  id: number;
  skill_category: { id: number; name: string };
  badge_level: string;
  issued_at: string;
  overall_score?: number;
}

interface Attempt {
  id: number;
  status: string;
  score: { overall_score: number; ai_feedback_text: string } | null;
  test: { title: string; test_type: string };
  started_at: string;
  completed_at: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  'file-json': '{ }',
  'message-circle': '💬',
  'database': '🗄️',
  'layout-template': '🎨',
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  easy: { label: 'EASY', color: 'text-verification', bg: 'bg-verification/10' },
  medium: { label: 'MEDIUM', color: 'text-amber-600', bg: 'bg-amber-50' },
  hard: { label: 'HARD', color: 'text-seal', bg: 'bg-seal/10' },
};

export function CandidateDashboard() {

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'Dashboard';
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const currentParams = Object.fromEntries(searchParams.entries());
    if (activeTab !== 'Dashboard') {
      if (currentParams.tab !== activeTab) {
        setSearchParams({ ...currentParams, tab: activeTab }, { replace: true });
      }
    } else {
      if (currentParams.tab) {
        const { tab, ...rest } = currentParams;
        setSearchParams(rest, { replace: true });
      }
    }
  }, [activeTab]);

  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'Dashboard';
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [testsByCategory, setTestsByCategory] = useState<Record<number, SkillTest[]>>({});
  const [badges, setBadges] = useState<Record<number, Badge>>({});
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [latestFollowerCompany, setLatestFollowerCompany] = useState('');
  const [invites, setInvites] = useState<any[]>([]);
  const [showInvites, setShowInvites] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [articles, setArticles] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  
  // Resume specific state
  const [resume, setResume] = useState<Resume | null>(null);
  const [suggestedTests, setSuggestedTests] = useState<SuggestedTest[]>([]);

  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ full_name: '', company_name: '', bio: '', avatar_url: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, testsRes, badgesRes, attemptsRes, followersRes, invitesRes, analyticsRes, jobsRes, profileRes, projectsRes] = await Promise.all([
          api.get('/skills/categories/').catch(() => ({ data: [] })),
          api.get('/skills/tests/').catch(() => ({ data: [] })),
          api.get('/badges/my-badges/').catch(() => ({ data: [] })),
          api.get('/assessments/my-attempts/').catch(() => ({ data: { results: [] } })),
          api.get('/network/my-followers/').catch(() => ({ data: { count: 0, results: [] } })),
          api.get('/jobs/interviews/my-interviews/').catch(() => ({ data: { results: [] } })),
          api.get('/assessments/analytics/').catch(() => ({ data: null })),
          api.get('/jobs/').catch(() => ({ data: { results: [] } })),
          api.get('/accounts/me/').catch(() => ({ data: null })),
          api.get('/portfolio/projects/').catch(() => ({ data: { results: [] } }))
        ]);

        const cats: SkillCategory[] = Array.isArray(catsRes.data) ? catsRes.data : catsRes.data?.results || [];
        setCategories(cats);

        const tests: SkillTest[] = Array.isArray(testsRes.data) ? testsRes.data : testsRes.data?.results || [];
        const grouped: Record<number, SkillTest[]> = {};
        tests.forEach((t: SkillTest) => {
          const catId = t.category?.id;
          if (catId) {
            if (!grouped[catId]) grouped[catId] = [];
            grouped[catId].push(t);
          }
        });
        setTestsByCategory(grouped);

        const badgeList = Array.isArray(badgesRes.data) ? badgesRes.data : badgesRes.data?.results || [];
        setAllBadges(badgeList);
        const badgeMap: Record<number, Badge> = {};
        badgeList.forEach((b: Badge) => {
          if (b.skill_category?.id) {
            badgeMap[b.skill_category.id] = b;
          }
        });
        setBadges(badgeMap);

        const attemptsData: Attempt[] = Array.isArray(attemptsRes.data) ? attemptsRes.data : attemptsRes.data?.results || [];
        setAttempts(attemptsData);

        const followersData = followersRes.data;
        setFollowersCount(followersData?.count || 0);
        if (followersData?.results && followersData.results.length > 0) {
          setLatestFollowerCompany(followersData.results[0].recruiter_detail?.company_name || '');
        }

        const invitesData = Array.isArray(invitesRes.data) ? invitesRes.data : invitesRes.data?.results || [];
        setInvites(invitesData);

        const analyticsData = analyticsRes.data;
        setAnalytics(analyticsData);

        const jobsList = Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data?.results || [];
        setJobs(jobsList);
        
        if (profileRes.data) setProfile(profileRes.data);
        const projectsList = Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data?.results || [];
        setProjects(projectsList);

      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        // Fetch resume silently in the background
        try {
          const myRes = await getMyResume();
          setResume(myRes);
          
          // Stop loading immediately after fetching resume so UI renders fast
          setLoading(false);
          
          if (myRes && myRes.parsing_status === 'completed') {
            // Fetch suggested tests in the background (can take time if Groq AI generates tests)
            getSuggestedTests().then(setSuggestedTests).catch(console.error);
          }
        } catch (e) {
          // ignore 404
          setLoading(false);
        }
      }
    }
    fetchData();
  }, []);

  // Poll for unread messages
  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/messages/conversations/');
        const conversations = res.data || [];
        const unread = conversations.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0);
        setTotalUnreadMessages(unread);
      } catch (err) {
        console.error('Failed to fetch unread messages:', err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // Check every 15 seconds
    
    return () => clearInterval(interval);
  }, [user]);

  // Polling for processing resume
  useEffect(() => {
    let interval: number | undefined;
    if (resume && (resume.parsing_status === 'pending' || resume.parsing_status === 'processing')) {
      interval = window.setInterval(async () => {
        try {
          const updated = await getMyResume();
          setResume(updated);
          if (updated && updated.parsing_status === 'completed') {
            const suggested = await getSuggestedTests();
            setSuggestedTests(suggested);
            clearInterval(interval);
          } else if (updated && updated.parsing_status === 'failed') {
            clearInterval(interval);
          }
        } catch (e) {
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [resume?.parsing_status]);

  const handleEditProfileClick = () => {
    setEditProfileData({
      full_name: profile?.full_name || (user?.email ? user.email.split('@')[0] : ''),
      company_name: profile?.company_name || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      const res = await api.patch('/accounts/me/', editProfileData);
      setProfile(res.data);
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleResumeUploadSuccess = async () => {
    try {
      const res = await getMyResume();
      setResume(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartTest = async (testId: number) => {
    try {
      const response = await api.post(`/assessments/start/`, { test_id: testId });
      navigate(`/test/${response.data.attempt_id}`);
    } catch (err) {
      console.error('Failed to start test:', err);
    }
  };

  const handleDeleteResume = async () => {
    try {
      if (window.confirm("Are you sure you want to delete your resume and matched tests?")) {
        await deleteResume();
        setResume(null);
        setSuggestedTests([]);
      }
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center pt-32">
        <Loader text="LOADING DASHBOARD..." size="lg" />
      </div>
    );
  }

  const completedTests = attempts.filter(a => a.status === 'completed').length;
  const avgScore = attempts.filter(a => a.score).reduce((sum, a) => sum + (a.score?.overall_score || 0), 0) / (attempts.filter(a => a.score).length || 1);
  const totalCategories = categories.length || 4;
  
  let narrative = allBadges.length === totalCategories 
    ? "All core skills verified — your profile is complete."
    : `You've verified ${allBadges.length} of ${totalCategories} core skills — continue your assessments to complete your profile.`;
    
  if (followersCount > 0) {
    if (latestFollowerCompany) {
      narrative = `${latestFollowerCompany} is following your profile — ${allBadges.length === totalCategories ? 'keep your skills sharp to stay on top.' : 'complete more assessments to stand out further.'}`;
    } else {
      narrative = `${followersCount} recruiter${followersCount === 1 ? '' : 's'} ${followersCount === 1 ? 'is' : 'are'} following your profile — ${allBadges.length === totalCategories ? 'keep your skills sharp to stay on top.' : 'complete more assessments to stand out further.'}`;
    }
  }

  const sidebarItems = [
    {
      category: 'OVERVIEW',
      items: [
        { id: 'Dashboard', icon: '📊', label: 'Dashboard' },
        { id: 'Activity', icon: '🔥', label: 'Activity' },
      ]
    },
    {
      category: 'NETWORK',
      items: [
        { id: 'Feed', icon: '📰', label: 'Feed' },
        { id: 'Explore Network', icon: '🔍', label: 'Explore Network' },
        { id: 'Messages', icon: '💬', label: 'Messages' },
      ]
    },
    {
      category: 'CAREER',
      items: [
        { id: 'Jobs', icon: '💼', label: 'Jobs' },
        { id: 'Interviews', icon: '🗓️', label: 'Interviews' },
      ]
    },
    {
      category: 'CREDENTIALS',
      items: [
        { id: 'Certificates', icon: '🏅', label: 'Certificates' },
        { id: 'Resume', icon: '📄', label: 'Resume' },
      ]
    },
    {
      category: 'PROFILE',
      items: [
        { id: 'Profile', icon: '👤', label: 'My Profile' },
      ]
    },
    {
      category: 'SYSTEM',
      items: [
        { id: 'Settings', icon: '⚙️', label: 'Settings' },
      ]
    }
  ];

  return (
    <div className="flex h-[calc(100vh-73px)] overflow-hidden bg-transparent">
      {/* Sidebar */}
      <div className="w-72 bg-white/40 backdrop-blur-3xl border-r border-white/60 shadow-[4px_0_32px_-12px_rgba(0,0,0,0.06)] flex flex-col h-full shrink-0 relative z-10">
        <div className="p-8 pb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-ink to-ink/80 rounded-xl flex items-center justify-center shadow-lg shadow-ink/20 ring-1 ring-white/50">
               <span className="font-serif font-bold text-white text-xl">S</span>
             </div>
             <h3 className="font-serif text-2xl font-bold text-ink tracking-tight">SkillProof</h3>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-8 scrollbar-hide">
          {sidebarItems.map(group => (
            <div key={group.category}>
              <h4 className="font-mono text-[10px] text-data/70 font-bold uppercase tracking-[0.25em] mb-3 px-4">{group.category}</h4>
              <ul className="space-y-1">
                {group.items.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <li key={item.id} className="relative px-2">
                      {/* Active Indicator Glow */}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabIndicatorCandidate" 
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-3/4 bg-ink rounded-r-full shadow-[0_0_12px_rgba(15,23,42,0.6)]" 
                        />
                      )}
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 group ${
                          isActive
                            ? 'bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] text-ink' 
                            : 'text-ink/60 hover:bg-white/50 hover:text-ink hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)]'
                        }`}
                      >
                        <span className={`text-xl transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-sm' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                          {item.icon}
                        </span>
                        <span className={`tracking-wide ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        
        {/* User Profile Snippet */}
        <div className="p-4 mx-4 mb-6 rounded-2xl bg-white/70 border border-white/80 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] backdrop-blur-md flex items-center justify-between group hover:bg-white hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] transition-all cursor-pointer relative overflow-hidden">
          {/* Subtle hover gradient mask */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-verification to-emerald-400 p-0.5 shadow-sm">
               <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-verification font-serif font-bold text-lg">
                 {user?.email?.charAt(0).toUpperCase() || 'U'}
               </div>
            </div>
            <div>
              <div className="text-sm font-bold text-ink truncate w-24 tracking-tight">{user?.email ? user.email.split('@')[0] : 'User'}</div>
              <div className="text-[9.5px] font-mono font-bold text-data uppercase tracking-widest mt-0.5">Candidate</div>
            </div>
          </div>
          <button className="text-data opacity-0 group-hover:opacity-100 transition-all duration-300 hover:text-ink hover:bg-structure/10 p-1.5 rounded-lg relative z-10">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-y-auto relative bg-transparent">
        
        {/* Messages Toggle (Fixed Floating Action Button) */}
        <div className="fixed top-6 right-32 z-[100]">
          <button 
            onClick={() => setActiveTab('Messages')}
            className="relative w-12 h-12 md:w-14 md:h-14 bg-ink text-white hover:bg-ink/90 rounded-full transition-transform hover:scale-105 shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-white/10 flex items-center justify-center"
          >
            <span className="text-xl">✉️</span>
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[11px] font-bold rounded-full border-2 border-ink flex items-center justify-center shadow-sm">
                {totalUnreadMessages}
              </span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
        {/* Dashboard Tab */}
        {activeTab === 'Dashboard' && (
          <motion.div key="dashboard" variants={tabVariants} initial="hidden" animate="show" exit="exit">
            {!resume ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] px-8 relative">
                {/* Background Blobs for depth */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-verification/10 to-emerald-400/10 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="bg-white/70 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] rounded-3xl p-12 max-w-xl w-full text-center relative overflow-hidden z-10 group transition-all duration-500 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.15)] hover:border-white/80">
                   {/* Shimmer effect */}
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                   
                   <div className="relative w-28 h-28 mx-auto mb-8">
                     <div className="absolute inset-0 bg-gradient-to-br from-verification/20 to-verification/5 rounded-[2rem] rotate-3 group-hover:rotate-6 transition-transform duration-500" />
                     <div className="absolute inset-0 bg-white shadow-lg rounded-[2rem] -rotate-3 group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center">
                       <svg className="w-12 h-12 text-verification" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                       </svg>
                     </div>
                     {/* Floating particle */}
                     <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse" />
                   </div>
                   
                   <h1 className="font-serif text-3xl font-bold text-ink mb-4 tracking-tight">Welcome to Your Portal</h1>
                   
                   <p className="font-serif text-base text-ink/70 mb-10 max-w-sm mx-auto leading-relaxed">
                     <span className="font-mono text-[10px] text-verification font-bold uppercase tracking-widest block mb-2">Step 1</span>
                     To get started, upload your resume. Our AI will analyze your experience and map out your perfect verification path.
                   </p>
                   
                   <button 
                     onClick={() => setActiveTab('Resume')}
                     className="bg-ink text-white font-mono text-xs font-bold uppercase tracking-[0.15em] px-10 py-4 rounded-xl shadow-[0_4px_14px_0_rgb(0,0,0,0.39)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:-translate-y-[1px] transition-all duration-200 flex items-center justify-center gap-3 mx-auto w-full max-w-[280px]"
                   >
                     <span>Upload Resume</span>
                     <span className="text-lg leading-none mt-[-2px]">→</span>
                   </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden bg-ink text-white mb-8 border-b-4 border-verification">
                  {/* Abstract Background pattern */}
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)`,
                  }} />
                  <div className="absolute -top-40 -right-40 w-96 h-96 bg-verification opacity-20 blur-3xl rounded-full" />
                  
                  <div className="relative max-w-5xl mx-auto px-8 py-12">
                    <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                      <div>
                        <h1 className="text-sm font-mono tracking-[0.3em] text-white/50 mb-2 uppercase">Candidate Dossier &mdash; {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}</h1>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Welcome back</h2>
                        <p className="max-w-xl text-white/70 font-serif leading-relaxed text-sm">
                          Complete AI-proctored assessments to build a cryptographically verified profile. 
                          Your credentials will serve as immutable proof of your skills to recruiters worldwide.
                        </p>
                      </div>
                      
                      {/* High Level Stats */}
                      <div className="flex gap-8 shrink-0 bg-white/5 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                        <div className="text-center">
                          <div className="font-serif text-3xl text-verification"><AnimatedCounter target={followersCount} /></div>
                          <div className="font-mono text-[9px] text-white/50 uppercase tracking-[0.2em] mt-2">Followers</div>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="text-center">
                          <div className="font-serif text-3xl text-white"><AnimatedCounter target={Math.round(avgScore)} /></div>
                          <div className="font-mono text-[9px] text-white/50 uppercase tracking-[0.2em] mt-2">Verification Score</div>
                        </div>
                        <div className="w-px bg-white/10" />
                        <div className="text-center">
                          <div className="font-serif text-3xl text-white"><AnimatedCounter target={allBadges.length} /></div>
                          <div className="font-mono text-[9px] text-white/50 uppercase tracking-[0.2em] mt-2">Badges Earned</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Narrative */}
                    <div className="mt-8 border-t border-white/10 pt-4">
                      <p className="font-mono text-[11px] text-verification uppercase tracking-widest flex items-center gap-2">
                        <span className="text-sm">{followersCount > 0 ? '👀' : '✦'}</span> {narrative}
                      </p>
                    </div>
                  </div>
                </div>
                
                {allBadges.length === 0 && (
                  <div className="max-w-5xl mx-auto px-8 mb-8">
                    <div className="bg-verification/10 border border-verification/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-ink mb-1">Resume Analyzed! 🎯</h3>
                        <p className="font-mono text-[10px] text-data uppercase tracking-widest">Take AI-proctored assessments to earn verified badges and start ranking.</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('Certificates')}
                        className="shrink-0 bg-ink text-white font-mono text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-ink/90 transition-transform hover:scale-105 shadow-md"
                      >
                        Take First Assessment
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="max-w-5xl mx-auto px-8 pb-16 space-y-8">
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    <div className="col-span-1 md:col-span-2 lg:col-span-1"><ActivityStreakWidget attempts={attempts} /></div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-1"><RecentJobMatchesWidget jobs={jobs} /></div>
                    <div className="col-span-1 md:col-span-2 lg:col-span-1"><UpcomingInterviewsWidget invites={invites} /></div>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                    {/* Radar Chart Component */}
                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-structure/30 shadow-sm hover:shadow-lg transition-all">
                      <h3 className="font-serif font-bold text-ink mb-1">Core Competencies</h3>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-data mb-6">Radar Analysis</p>
                      <div className="h-[300px]">
                        {analytics?.radar && analytics.radar.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={analytics.radar} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                              <PolarGrid stroke="#e2e8f0" />
                              <PolarAngleAxis dataKey="category" tick={{ fill: '#334155', fontSize: 10, fontFamily: 'monospace' }} />
                              <Radar name="Score" dataKey="score" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="font-mono text-xs text-data uppercase tracking-widest">Complete tests to unlock radar</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-structure/30 shadow-sm hover:shadow-lg transition-all flex flex-col">
                      <h3 className="font-serif font-bold text-ink mb-1">Performance Trend</h3>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-data mb-6">Last 5 Assessments</p>
                      <div className="flex-1 min-h-[300px]">
                        {analytics?.trends && analytics.trends.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.trends}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={10} fontFamily="monospace" tickLine={false} axisLine={false} domain={[0, 100]} />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                              />
                              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#0f172a', stroke: '#10b981', strokeWidth: 2 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <p className="font-mono text-xs text-data uppercase tracking-widest">Not enough data points</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Activity Tab */}
        {activeTab === 'Activity' && (
          <motion.div key="activity" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-serif text-2xl font-bold text-ink">Activity</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="col-span-1">
                <ActivityStreakWidget attempts={attempts} />
              </div>
              <div className="col-span-1 lg:col-span-2">
                <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all h-full">
                  <h3 className="font-serif text-lg font-bold text-ink mb-1">Recent Assessments</h3>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-data mb-6">Your test history</p>
                  
                  <div className="space-y-4">
                    {attempts.length > 0 ? attempts.map((attempt, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white rounded-xl border border-structure/20">
                        <div>
                          <h4 className="font-serif font-bold text-ink text-sm">{attempt.test?.title || 'Assessment'}</h4>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-data mt-1">
                            {new Date(attempt.started_at).toLocaleDateString()} • {attempt.status}
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          {attempt.score ? (
                            <div className="font-serif text-xl font-bold text-verification">{attempt.score.overall_score}%</div>
                          ) : (
                            <div className="font-mono text-[10px] uppercase tracking-widest text-amber-600 font-bold bg-amber-50 px-3 py-1 rounded-full">Pending</div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 bg-structure/5 rounded-xl border border-dashed border-structure/20">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-data">No assessments taken yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Feed Tab */}
        {activeTab === 'Feed' && (
          <motion.div key="feed" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-serif text-2xl font-bold text-ink">Network Feed</h2>
            <FeedWidget />
          </motion.div>
        )}

        {/* Explore Network Tab */}
        {activeTab === 'Explore Network' && (
          <motion.div key="explore" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10">
            <h2 className="font-serif text-2xl font-bold text-ink">Explore Network</h2>
            <NetworkDiscoveryWidget />
          </motion.div>
        )}

        {/* Messages Tab */}
        {activeTab === 'Messages' && (
          <motion.div key="messages" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-6xl mx-auto px-4 sm:px-8 py-6 h-full">
            <MessagesView />
          </motion.div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'Jobs' && (
          <motion.div key="jobs" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-serif text-2xl font-bold text-ink">Job Matches</h2>
            <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm min-h-[400px]">
              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job, i) => (
                    <div key={i} className="flex justify-between items-start border border-structure/20 rounded-xl p-6 bg-white hover:border-verification transition-all">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-ink">{job.title}</h3>
                        <p className="font-mono text-[10px] text-data uppercase tracking-widest mt-1 mb-4">{job.company_name}</p>
                        <div className="flex gap-2">
                          <span className="bg-verification/10 text-verification px-3 py-1 rounded font-mono text-[9px] uppercase font-bold tracking-widest border border-verification/20">High Match</span>
                          <span className="bg-structure/10 text-ink px-3 py-1 rounded font-mono text-[9px] uppercase tracking-widest">Active</span>
                        </div>
                      </div>
                      <button className="bg-ink text-white px-6 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest hover:bg-ink/80 transition-colors">Apply</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                  <span className="text-4xl opacity-50 block mb-4">💼</span>
                  <h3 className="font-serif text-lg font-bold text-ink mb-2">No Job Matches Yet</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-data">Complete more assessments to unlock job matches.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Interviews Tab */}
        {activeTab === 'Interviews' && (
          <motion.div key="interviews" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-serif text-2xl font-bold text-ink">Upcoming Interviews</h2>
            <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm min-h-[400px]">
              {invites.length > 0 ? (
                <div className="space-y-4">
                  {invites.map((invite, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:justify-between md:items-center border border-structure/20 rounded-xl p-6 bg-white hover:border-verification transition-all gap-4">
                      <div className="flex gap-6 items-center">
                        <div className="w-16 h-16 rounded-xl bg-ink text-white flex flex-col items-center justify-center leading-none">
                          <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">
                            {new Date(invite.proposed_time).toLocaleDateString(undefined, { month: 'short' })}
                          </span>
                          <span className="font-serif font-bold text-xl">
                            {new Date(invite.proposed_time).getDate()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-serif text-xl font-bold text-ink">{invite.recruiter_company || 'Tech Company'}</h3>
                          <p className="font-mono text-[10px] text-ink uppercase tracking-widest mt-1 mb-1">{invite.job_role || 'Open Role'}</p>
                          <p className="font-mono text-[9px] text-data uppercase tracking-widest">
                            Time: {new Date(invite.proposed_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                          <div className="mt-2 inline-block px-2 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest font-bold border border-structure/20 bg-structure/5">
                            Status: <span className={invite.status === 'accepted' ? 'text-verification' : invite.status === 'declined' ? 'text-red-500' : 'text-data'}>{invite.status}</span>
                          </div>
                        </div>
                      </div>
                      
                      {invite.status === 'proposed' && (
                        <div className="flex gap-3 md:flex-col md:w-32">
                          <button 
                            onClick={async () => {
                              try {
                                await api.post(`/jobs/interviews/${invite.id}/respond/`, { status: 'accepted' });
                                toast.success('Interview accepted!');
                                // Refresh
                                const res = await api.get('/jobs/interviews/my-interviews/');
                                setInvites(res.data.results || res.data);
                              } catch(e) { toast.error('Failed to accept'); }
                            }}
                            className="flex-1 bg-ink text-white px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest hover:bg-ink/90 transition-colors"
                          >
                            Accept
                          </button>
                          <button 
                             onClick={async () => {
                              try {
                                await api.post(`/jobs/interviews/${invite.id}/respond/`, { status: 'declined' });
                                toast.success('Interview declined.');
                                // Refresh
                                const res = await api.get('/jobs/interviews/my-interviews/');
                                setInvites(res.data.results || res.data);
                              } catch(e) { toast.error('Failed to decline'); }
                            }}
                            className="flex-1 border border-structure text-data px-4 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest hover:text-ink hover:border-ink transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                  <span className="text-4xl opacity-50 block mb-4">🗓️</span>
                  <h3 className="font-serif text-lg font-bold text-ink mb-2">No Upcoming Interviews</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-data">When a recruiter invites you, it will appear here.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'Certificates' && (
          <motion.div key="certificates" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-serif text-2xl font-bold text-ink">Certificates</h2>
            <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm">
              <h2 className="font-mono text-[10px] text-data uppercase tracking-[0.3em] mb-6">Badge Showcase</h2>
              
              {allBadges.length === 0 ? (
                <div className="text-center py-12 bg-structure/5 rounded-2xl border border-dashed border-structure/20">
                  <span className="text-4xl mb-4 block opacity-50">🏅</span>
                  <h3 className="font-serif text-lg font-bold text-ink mb-2">No badges earned yet</h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-data">Complete a core skill assessment below to earn your first verified credential.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {allBadges.map((badge) => (
                    <div key={badge.id} className="group relative bg-white rounded-2xl p-6 border border-structure/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-br from-verification/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex flex-col items-center text-center">
                        <div className="mb-4 transform group-hover:scale-110 transition-transform duration-500">
                          <BadgeIcon level={(badge.badge_level?.toLowerCase() || 'bronze') as BadgeLevel} size={120} />
                        </div>
                        <h4 className="font-serif font-bold text-ink text-sm mb-1">{badge.skill_category?.name || 'General Skill'}</h4>
                        <div className="font-mono text-[9px] uppercase tracking-widest text-verification mb-4 font-bold bg-verification/10 px-3 py-1 rounded-full">
                          Verified
                        </div>
                        <div className="text-xs text-data font-mono uppercase tracking-widest mb-1">Score</div>
                        <div className="font-serif text-2xl font-bold text-ink mb-3">{badge.overall_score || 0}/100</div>
                        <p className="text-[10px] font-mono text-data uppercase tracking-wider">
                          Earned {new Date(badge.issued_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm">
              <h2 className="font-mono text-[10px] text-data uppercase tracking-[0.3em] mb-4">Core Competency Ledger</h2>
              {categories.map((category) => (
                <div key={category.id} className="mb-10 last:mb-0">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-2xl bg-structure/10 p-2 rounded-xl border border-structure/20 shadow-inner">
                      {CATEGORY_ICONS[category.name] || '⌨'}
                    </span>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-ink leading-none">{category.name}</h3>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-data mt-1">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    {testsByCategory[category.id]?.map((test) => {
                      const passed = attempts.some(a => a.test?.title === test.title && a.status === 'completed' && a.score && a.score.overall_score >= 70);
                      return (
                        <button 
                          key={test.id} 
                          onClick={(e) => {
                            e.preventDefault();
                            if (!passed) handleStartTest(test.id);
                          }}
                          className={`flex w-full text-left flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300 group hover:-translate-y-0.5 ${
                          passed ? 'bg-verification/5 border-verification/30 hover:border-verification hover:shadow-md hover:shadow-verification/10 cursor-default' : 'bg-white border-structure/20 hover:border-ink/20 hover:shadow-md cursor-pointer'
                        }`}>
                          <div className="flex items-center gap-5">
                            <span className={`w-12 h-12 flex items-center justify-center rounded-xl text-xl shrink-0 ${passed ? 'bg-verification/20 text-verification' : 'bg-structure/10 text-ink/50'}`}>
                              {passed ? '🏆' : '📝'}
                            </span>
                            <div>
                              <h4 className={`font-serif text-base font-bold mb-1 ${passed ? 'text-ink' : 'text-ink group-hover:text-verification transition-colors'}`}>
                                {test.title}
                              </h4>
                              <div className="flex items-center gap-3">
                                <span className={`font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                  passed ? 'bg-verification text-ink' : 'bg-structure/10 text-ink/70'
                                }`}>
                                  {passed ? 'Passed' : test.difficulty}
                                </span>
                                <span className="font-mono text-[10px] text-data flex items-center gap-1"><span className="text-sm opacity-50">⏱</span> {test.duration_minutes} MINS</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 sm:mt-0 flex items-center justify-end shrink-0">
                            <span className={`font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-2 px-5 py-2.5 rounded-xl border ${
                              passed ? 'border-verification/30 text-verification bg-verification/10' : 'border-structure/20 text-ink hover:bg-ink hover:text-white hover:border-ink transition-all shadow-sm'
                            }`}>
                              {passed ? 'Verified' : 'Take Test'} {!passed && <span className="transition-transform group-hover:translate-x-1">→</span>}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Resume Tab */}
        {activeTab === 'Resume' && (
          <motion.div key="resume" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-serif text-2xl font-bold text-ink">Resume</h2>
            
            <div id="tests-section" className="mb-10">
              {!resume ? (
                <div className="bg-white/40 backdrop-blur-md p-6 rounded-xl border border-white/40 shadow-sm hover:shadow-lg transition-all">
                  <ResumeUploader onUploadSuccess={handleResumeUploadSuccess} />
                </div>
              ) : (
                <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 bg-structure/10 rounded-xl flex items-center justify-center text-2xl border border-structure/20">
                        📄
                      </div>
                      <div>
                        <h3 className="font-serif text-lg text-ink font-bold leading-tight">Your Resume</h3>
                        <p className="font-mono text-[10px] text-data uppercase tracking-widest mt-0.5">
                          Uploaded on {new Date(resume.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-full ${
                        resume.parsing_status === 'completed' ? 'bg-verification/10 text-verification' :
                        resume.parsing_status === 'failed' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {resume.parsing_status === 'processing' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                        {resume.parsing_status}
                      </span>
                    </div>
                  </div>
                  
                  {resume.parsing_status === 'completed' && resume.extracted_skills && (
                    <div className="mt-4 pt-4 border-t border-structure/20">
                      <p className="font-mono text-[10px] text-data uppercase tracking-widest mb-3">Extracted Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {resume.extracted_skills.map((skill: string, i: number) => (
                          <span key={i} className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 bg-white border border-structure/20 text-ink rounded-lg shadow-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                      
                      <div className="mt-6 flex items-center gap-6 pt-4 border-t border-structure/20">
                        {resume.file && (
                          <a
                            href={resume.file.startsWith('http') ? resume.file : `http://127.0.0.1:8000${resume.file}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[10px] uppercase tracking-widest text-ink hover:underline flex items-center gap-2 font-bold"
                          >
                            <span className="text-sm">👁️</span> View Resume
                          </a>
                        )}
                        <button
                          onClick={handleDeleteResume}
                          className="font-mono text-[10px] uppercase tracking-widest text-red-500 hover:underline flex items-center gap-2 font-bold"
                        >
                          <span className="text-sm">🗑️</span> Delete Resume Record
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {resume?.parsing_status === 'completed' && suggestedTests.length > 0 && (
              <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-ink mb-1">AI Matched From Resume</h3>
                <p className="font-mono text-[10px] text-data uppercase tracking-widest mb-6">Assessments recommended based on your uploaded skills</p>
                <div className="space-y-3">
                  {suggestedTests.map((st) => (
                    <button 
                      key={st.id} 
                      onClick={(e) => {
                        e.preventDefault();
                        handleStartTest(st.id);
                      }}
                      className="w-full text-left flex items-center justify-between p-4 bg-white rounded-xl border border-structure/20 hover:border-verification hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl bg-structure/5 p-2 rounded-lg border border-structure/10">{CATEGORY_ICONS[st.test_type] || '🧠'}</span>
                        <div>
                          <div className="font-mono text-[9px] uppercase tracking-widest text-data mb-1">{st.category}</div>
                          <h4 className="font-serif font-bold text-ink text-sm group-hover:text-verification transition-colors">{st.title}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[10px] text-data"><span className="text-sm">⏱</span> {st.duration_minutes} MINS</span>
                        <span className="text-verification group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}


        
                {/* Profile Tab */}
        {activeTab === 'Profile' && (profile || user) && (
          <motion.div key="profile" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto pt-6">
            <ErrorBoundary>
              <ProfileView 
                profile={profile || user} 
                isOwnProfile={true} 
                onProfileUpdate={(updated) => setProfile(updated as any)}
                badges={badges}
                categories={categories}
                testsByCategory={testsByCategory}
                attempts={attempts}
              />
            </ErrorBoundary>
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'Settings' && (
          <motion.div key="settings" variants={tabVariants} initial="hidden" animate="show" exit="exit" className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-serif text-3xl font-bold text-ink tracking-tight mb-2">Settings</h2>
            
            <div className="p-8 bg-white/70 backdrop-blur-3xl border border-white/60 rounded-3xl shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-white/20 pointer-events-none" />
              
              <h3 className="font-serif text-xl font-bold text-ink mb-6 relative z-10 flex items-center gap-3">
                <span className="p-2 bg-ink text-white rounded-xl shadow-md">⚙️</span>
                Account Preferences
              </h3>
              
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between p-5 border border-white/50 bg-white/50 hover:bg-white/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group/row">
                  <div>
                    <h4 className="font-bold text-ink text-sm group-hover/row:text-verification transition-colors">Email Notifications</h4>
                    <p className="font-mono text-[10px] text-data/80 uppercase tracking-widest mt-1">Receive updates about jobs and connections.</p>
                  </div>
                  <PremiumToggle checked={true} onChange={() => {}} />
                </div>
                
                <div className="flex items-center justify-between p-5 border border-white/50 bg-white/50 hover:bg-white/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group/row">
                  <div>
                    <h4 className="font-bold text-ink text-sm group-hover/row:text-verification transition-colors">Profile Visibility</h4>
                    <p className="font-mono text-[10px] text-data/80 uppercase tracking-widest mt-1">Make your profile discoverable by recruiters.</p>
                  </div>
                  <PremiumToggle checked={true} onChange={() => {}} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        </AnimatePresence>
      </div>
    </div>
  );
}
