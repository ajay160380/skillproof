import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
  
  // Resume specific state
  const [resume, setResume] = useState<Resume | null>(null);
  const [suggestedTests, setSuggestedTests] = useState<SuggestedTest[]>([]);

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    async function fetchData() {
      try {
        const [catsRes, testsRes, badgesRes, attemptsRes, followersRes, invitesRes, analyticsRes] = await Promise.all([
          api.get('/skills/categories/'),
          api.get('/skills/tests/'),
          api.get('/badges/my-badges/'),
          api.get('/assessments/my-attempts/').catch(() => ({ data: { results: [] } })),
          api.get('/network/followers/').catch(() => ({ data: { count: 0, results: [] } })),
          api.get('/jobs/invites/').catch(() => ({ data: { results: [] } })),
          api.get('/assessments/analytics/').catch(() => ({ data: null }))
        ]);

        const cats: SkillCategory[] = Array.isArray(catsRes.data) ? catsRes.data : catsRes.data.results || [];
        setCategories(cats);

        const tests: SkillTest[] = Array.isArray(testsRes.data) ? testsRes.data : testsRes.data.results || [];
        const grouped: Record<number, SkillTest[]> = {};
        tests.forEach((t: SkillTest) => {
          const catId = t.category?.id;
          if (catId) {
            if (!grouped[catId]) grouped[catId] = [];
            grouped[catId].push(t);
          }
        });
        setTestsByCategory(grouped);

        const badgeList = Array.isArray(badgesRes.data) ? badgesRes.data : badgesRes.data.results || [];
        setAllBadges(badgeList);
        const badgeMap: Record<number, Badge> = {};
        badgeList.forEach((b: Badge) => {
          if (b.skill_category?.id) {
            badgeMap[b.skill_category.id] = b;
          }
        });
        setBadges(badgeMap);

        const attemptsData: Attempt[] = Array.isArray(attemptsRes.data) ? attemptsRes.data : attemptsRes.data.results || [];
        setAttempts(attemptsData);

        const followersData = followersRes.data;
        setFollowersCount(followersData.count || 0);
        if (followersData.results && followersData.results.length > 0) {
          setLatestFollowerCompany(followersData.results[0].recruiter_detail.company_name);
        }

        const invitesData = Array.isArray(invitesRes.data) ? invitesRes.data : invitesRes.data.results || [];
        setInvites(invitesData);

        if (analyticsRes.data) {
          setAnalytics(analyticsRes.data);
        }

        // Immediately stop loading to show the dashboard fast
        setLoading(false);

        // Fetch resume and tests silently in the background
        try {
          const myRes = await getMyResume();
          setResume(myRes);
          if (myRes && myRes.parsing_status === 'completed') {
            const suggested = await getSuggestedTests();
            setSuggestedTests(suggested);
          }
        } catch (e) {
          // ignore 404
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setLoading(false);
      }
    }
    fetchData();
  }, []);

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

  return (
    <div className="flex-1 bg-vellum bg-mesh">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-ink text-white mb-8 border-b-4 border-verification">
        {/* Abstract Background pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)`,
        }} />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-verification opacity-20 blur-3xl rounded-full" />
        
        {/* Invites Icon Toggle (Fixed Floating Action Button) */}
        <div className="fixed bottom-8 right-8 z-[100]">
          <button 
            onClick={() => setShowInvites(!showInvites)}
            className="relative p-4 bg-ink text-white hover:bg-ink/90 rounded-full transition-transform hover:scale-105 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] border border-white/10 flex items-center justify-center"
          >
            <span className="text-2xl">✉️</span>
            {invites.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-verification rounded-full border-2 border-ink shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
            )}
          </button>

          {/* Invites Dropdown */}
          {showInvites && (
            <div className="absolute bottom-full right-0 mb-4 w-80 md:w-96 bg-white text-ink rounded-xl shadow-2xl border border-structure/30 overflow-hidden z-[100] animate-in slide-in-from-bottom-2 fade-in duration-200">
              <div className="px-4 py-3 border-b border-structure/30 bg-structure/5 flex justify-between items-center">
                <h3 className="font-mono text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-verification rounded-full" />
                  Direct Interview Invites
                </h3>
                <span className="text-xs bg-ink text-vellum px-2 py-0.5 rounded-full font-mono">{invites.length}</span>
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {invites.length > 0 ? (
                  invites.map((invite) => (
                    <div key={invite.id} className="p-4 hover:bg-structure/5 rounded-lg transition-colors border-b border-structure/10 last:border-0 relative">
                      <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-verification/50 rounded-r" />
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-serif text-base font-bold">{invite.recruiter_name}</h4>
                          <div className="font-mono text-[9px] text-data uppercase tracking-widest">{invite.job_role || 'General Interview'}</div>
                        </div>
                        <div className="font-mono text-[9px] text-data uppercase tracking-widest">
                          {new Date(invite.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-xs font-serif italic text-ink/70 mb-3 bg-structure/5 p-2 rounded">
                        "{invite.message}"
                      </p>
                      <div className="flex gap-2">
                        <button className="flex-1 py-1.5 bg-ink text-vellum rounded font-mono text-[9px] uppercase tracking-widest hover:bg-ink/90 transition-colors">
                          Accept
                        </button>
                        <button className="flex-1 py-1.5 bg-white border border-structure text-ink rounded font-mono text-[9px] uppercase tracking-widest hover:border-ink transition-colors">
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-data">
                    <span className="text-3xl block mb-2 opacity-50">📭</span>
                    <p className="font-mono text-[10px] uppercase tracking-widest">No invites yet</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        
        <div className="relative max-w-6xl mx-auto px-8 py-16">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="max-w-2xl">
              <p className="font-mono text-[10px] text-verification uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-verification rounded-full" />
                CANDIDATE DOSSIER — {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="font-serif text-5xl md:text-6xl mb-4 font-light tracking-tight">
                {user?.email ? `Welcome back` : 'Candidate Dashboard'}
              </h1>
              <p className="text-white/60 text-sm md:text-base font-light max-w-lg leading-relaxed">
                Complete AI-proctored assessments to build a cryptographically verified profile. Your credentials will serve as immutable proof of your skills to recruiters worldwide.
              </p>
            </div>

            {/* Stats Cluster - Dossier Hero */}
            <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-8 shrink-0 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl mt-4 md:mt-0">
              {followersCount > 0 && (
                <>
                  <button onClick={() => navigate('/followers')} className="text-center group block hover:scale-105 transition-transform cursor-pointer">
                    <div className="font-serif text-4xl md:text-5xl text-verification group-hover:text-white transition-colors"><AnimatedCounter target={followersCount} /></div>
                    <div className="font-mono text-[9px] text-white/50 group-hover:text-verification uppercase tracking-[0.2em] mt-2 transition-colors">Followers</div>
                  </button>
                  <div className="hidden md:block w-px h-16 bg-white/10" />
                </>
              )}
              <div className="text-center">
                <div className="font-serif text-4xl md:text-5xl text-white"><AnimatedCounter target={Math.round(avgScore)} /></div>
                <div className="font-mono text-[9px] text-white/50 uppercase tracking-[0.2em] mt-2">Verification Score</div>
              </div>
              <div className="hidden md:block w-px h-16 bg-white/10" />
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

      <div className="max-w-6xl mx-auto px-8 py-10">
        
        {/* Resume Uploader Section */}
        <div className="mb-10">
          <h2 className="font-mono text-[10px] text-data uppercase tracking-[0.3em] mb-4">Resume Parsing</h2>
          {!resume ? (
            <div className="bg-white/40 backdrop-blur-md p-6 rounded-xl border border-white/40 shadow-sm hover:shadow-lg transition-all">
              <ResumeUploader onUploadSuccess={handleResumeUploadSuccess} />
            </div>
          ) : (
            <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-verification/10 flex items-center justify-center">
                    <span className="text-xl">📄</span>
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
                    {resume.extracted_skills.map((skill, idx) => (
                      <span key={idx} className="font-mono text-xs px-2.5 py-1 bg-ink/5 border border-structure/40 rounded-md text-ink">
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

        {/* Suggested Tests (if any) */}
        {suggestedTests.length > 0 && (
          <div className="mb-12 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-verification/10 to-transparent blur-xl -z-10 rounded-3xl pointer-events-none opacity-50" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-mono text-[11px] text-verification uppercase tracking-[0.3em] flex items-center gap-2 font-bold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-verification opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-verification"></span>
                  </span>
                  AI MATCHED FROM RESUME
                </h2>
                <p className="font-serif text-sm text-data mt-1 opacity-80 italic">Assessments recommended based on your uploaded skills</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suggestedTests.map(test => {
                const diff = DIFFICULTY_CONFIG[test.difficulty] || DIFFICULTY_CONFIG.easy;
                return (
                  <button
                    key={test.id}
                    onClick={() => handleStartTest(test.id)}
                    className="w-full text-left p-5 rounded-2xl border border-verification/20 bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md hover:-translate-y-1 hover:border-verification hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-verification/20 transition-all duration-300 flex flex-col group/btn animate-fade-in-up delay-100 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-verification/5 rounded-bl-full -z-10 transition-transform group-hover/btn:scale-110" />
                    
                    <div className="flex items-start justify-between w-full mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-verification/10 text-verification flex items-center justify-center shrink-0 shadow-inner">
                          <span className="text-lg">{test.test_type === 'coding' ? '⌨' : test.test_type === 'communication' ? '🎤' : '🖥'}</span>
                        </div>
                        <div className="font-mono text-[10px] px-2 py-1 bg-verification/10 text-verification uppercase tracking-widest rounded-md font-bold">
                          {test.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[9px] px-2.5 py-1 rounded-full ${diff.bg} ${diff.color} font-bold uppercase tracking-wider`}>
                          {diff.label}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-end justify-between w-full">
                      <div className="min-w-0 pr-4">
                        <h3 className="font-serif text-xl text-ink truncate mb-1 group-hover/btn:text-verification transition-colors">
                          {test.title}
                        </h3>
                        <div className="font-mono text-[10px] text-data flex items-center gap-2">
                          <span className="flex items-center gap-1"><span className="text-verification">⏱</span> {test.duration_minutes} MINS</span>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-verification text-white flex items-center justify-center shrink-0 opacity-0 -translate-x-4 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all duration-300 shadow-md">
                        <span className="font-mono">→</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Badge Ribbon - Showcase Strip */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-mono text-[11px] text-ink uppercase tracking-[0.3em] flex items-center gap-2 font-bold">
              <span className="w-1.5 h-1.5 bg-ink rounded-full" />
              Badge Showcase
            </h2>
          </div>
          {allBadges.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
              {allBadges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-structure/40 bg-white/60 backdrop-blur-md shadow-sm hover:-translate-y-2 hover:shadow-xl hover:border-verification/30 transition-all duration-300 min-w-[140px] snap-start"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-verification/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none" />
                  <div className="relative z-10 shrink-0 drop-shadow-sm group-hover:drop-shadow-lg transition-all duration-300 group-hover:scale-110">
                    <BadgeIcon level={badge.badge_level.toLowerCase() as BadgeLevel} size={54} />
                  </div>
                  <div className="text-center relative z-10 w-full mb-2">
                    <div className="font-serif text-sm font-semibold text-ink truncate w-full mb-1">{badge.skill_category.name}</div>
                    <span className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                      badge.badge_level.toLowerCase() === 'platinum' ? 'bg-slate-200 text-slate-800' :
                      badge.badge_level.toLowerCase() === 'gold' ? 'bg-amber-100 text-amber-800' :
                      badge.badge_level.toLowerCase() === 'silver' ? 'bg-gray-200 text-gray-700' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {badge.badge_level}
                    </span>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-auto">
                    <a 
                      href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(`${badge.skill_category.name} (${badge.badge_level} Level)`)}&organizationName=SkillProof&issueYear=${new Date(badge.issued_at).getFullYear()}&issueMonth=${new Date(badge.issued_at).getMonth() + 1}&certId=${badge.verification_id}&certUrl=${encodeURIComponent(`${window.location.origin}/verify/${badge.verification_id}`)}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0077b5] hover:bg-[#006396] text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      Add to Profile
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 border border-dashed border-structure rounded-2xl bg-white/40">
              <div className="w-16 h-16 rounded-full bg-structure/30 flex items-center justify-center text-3xl opacity-50">
                🏅
              </div>
              <div className="text-center">
                <div className="font-serif text-lg text-ink font-bold mb-1">No badges earned yet</div>
                <div className="font-mono text-[10px] text-data uppercase tracking-wider">Complete a core skill assessment below to earn your first verified credential</div>
              </div>
            </div>
          )}
        </div>

        {/* Core Skills Section */}
        <div className="mb-14 relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-mono text-[11px] text-ink uppercase tracking-[0.3em] flex items-center gap-2 font-bold">
              <span className="w-1.5 h-1.5 bg-ink rounded-full" />
              Core Competencies
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat, i) => {
              const tests = testsByCategory[cat.id] || [];
              if (tests.length === 0) return null;
              
              // Assume first test for category
              const test = tests[0];
              const diff = DIFFICULTY_CONFIG[test.difficulty] || DIFFICULTY_CONFIG.easy;
              
              // Find latest attempt for this test
              const attempt = attempts.find(a => a.test.title === test.title);
              let status = attempt ? attempt.status : 'not-started';
              if (status === 'completed' && attempt?.score && attempt.score.overall_score < 60) {
                status = 'failed';
              }
              const badge = badges[cat.id];
              
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="group relative bg-white/80 border border-structure/40 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-structure/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-structure/20 rounded-xl flex items-center justify-center text-2xl shadow-inner">
                        {CATEGORY_ICONS[cat.slug] || '📁'}
                      </div>
                      <div>
                        <h3 className="font-serif text-xl text-ink font-semibold">{cat.name}</h3>
                        <div className="font-mono text-[10px] text-data uppercase tracking-widest mt-1">
                          {test.duration_minutes} MINS • {test.test_type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                    <div>
                      <StatusPill status={status as any} />
                    </div>
                  </div>

                  <div className="flex-1 relative z-10 mb-6">
                    {/* Default State: Description */}
                    <div className="text-sm text-ink/70 leading-relaxed group-hover:opacity-0 transition-opacity duration-300 absolute inset-0">
                      {cat.description || "A foundational assessment of core skills."}
                    </div>
                    {/* Hover State: Preview Info */}
                    <div className="text-sm text-ink leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-full flex items-center">
                      <div className="font-mono text-xs p-3 bg-structure/10 border border-structure/30 rounded-lg w-full">
                        <span className="text-data uppercase tracking-widest mb-1 block text-[9px]">Test Format</span>
                        {test.test_type === 'coding' ? 'Proctored IDE • Algorithm & Debugging' : 
                         test.test_type === 'communication' ? 'Proctored Video • Oral Presentation' : 'General Assessment'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto relative z-10 pt-4 border-t border-structure/20 flex justify-between items-end h-16">
                    {status === 'completed' && badge ? (
                       <div className="flex items-center justify-between w-full">
                         <div className="flex items-center gap-3">
                           <BadgeIcon level={badge.badge_level.toLowerCase() as BadgeLevel} size={32} />
                           <div>
                             <div className="font-mono text-[10px] text-data uppercase tracking-widest">Verified Score</div>
                             <div className="font-serif text-xl text-ink leading-none mt-1">{badge.overall_score || attempt?.score?.overall_score || 0}/100</div>
                           </div>
                         </div>
                         <button onClick={() => navigate(`/test/${attempt?.id}`)} className="font-mono text-[10px] text-verification uppercase tracking-widest hover:underline">
                           View Dossier &rarr;
                         </button>
                       </div>
                    ) : status === 'processing' ? (
                       <div className="flex items-center justify-between w-full">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin"></div>
                           <div className="font-mono text-xs text-amber-600 font-bold uppercase tracking-widest">AI Scoring...</div>
                         </div>
                         <button onClick={() => navigate(`/test/${attempt?.id}`)} className="font-mono text-[10px] text-amber-600 uppercase tracking-widest hover:underline">
                           Check Status &rarr;
                         </button>
                       </div>
                    ) : (
                       <button
                         onClick={() => handleStartTest(test.id)}
                         className="w-full bg-ink text-vellum py-3 rounded-xl font-mono text-xs uppercase tracking-widest hover:bg-ink/90 transition-all font-bold shadow-sm"
                       >
                         {status === 'pending' || status === 'failed' ? 'Restart Assessment' : 'Start Assessment'}
                       </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity Ledger */}
        <div className="mb-10">
          <h2 className="font-mono text-[11px] text-ink uppercase tracking-[0.3em] mb-4 flex items-center gap-2 font-bold">
            <span className="w-1.5 h-1.5 bg-ink rounded-full" />
            Activity Ledger
          </h2>
          {attempts.length > 0 ? (
            <div className="border-t-2 border-b-2 border-ink/10 bg-white/40 backdrop-blur-md">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className="font-mono text-[9px] text-data uppercase tracking-widest px-6 py-4 w-32">Date</th>
                    <th className="font-mono text-[9px] text-data uppercase tracking-widest px-6 py-4">Assessment Entry</th>
                    <th className="font-mono text-[9px] text-data uppercase tracking-widest px-6 py-4">Status</th>
                    <th className="font-mono text-[9px] text-data uppercase tracking-widest px-6 py-4 text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {attempts.map(attempt => (
                    <tr key={attempt.id} className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] transition-colors">
                      <td className="px-6 py-5 text-ink/60">
                        {new Date(attempt.started_at).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-5 font-serif text-base text-ink font-semibold">
                        {attempt.test.title}
                        <span className="block font-mono text-[9px] text-data uppercase tracking-widest mt-1 font-normal">
                          Format: {attempt.test.test_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <StatusPill status={(attempt.status === 'completed' && attempt.score && attempt.score.overall_score < 60) ? 'failed' : attempt.status as any} />
                      </td>
                      <td className="px-6 py-5 text-right">
                        {attempt.score ? (
                          <span className="font-serif text-2xl text-verification leading-none">{attempt.score.overall_score}<span className="text-sm text-data">/100</span></span>
                        ) : attempt.status === 'processing' ? (
                          <span className="text-[10px] text-amber-500 uppercase tracking-widest">Awaiting AI</span>
                        ) : (
                          <span className="text-data">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center gap-4 px-6 py-8 border border-dashed border-structure rounded-xl bg-white/40">
              <div className="w-10 h-10 rounded-full bg-structure/30 flex items-center justify-center">
                <span className="text-lg">📋</span>
              </div>
              <div>
                <div className="font-mono text-xs text-ink font-bold uppercase tracking-wider">No test attempts yet</div>
                <div className="font-mono text-[10px] text-data uppercase tracking-wider mt-0.5">Start an assessment above to track your progress here</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Analytics Section */}
        <div className="mb-10">
          <h2 className="font-mono text-[11px] text-ink uppercase tracking-[0.3em] mb-4 flex items-center gap-2 font-bold">
            <span className="w-1.5 h-1.5 bg-verification rounded-full" />
            Performance Analytics
          </h2>
          {analytics && analytics.total_tests > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Trend Chart */}
              <div className="bg-ink text-vellum rounded-2xl shadow-xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-verification opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity" />
                <h3 className="font-serif text-2xl mb-6 relative z-10">Score Trend</h3>
                <div className="h-64 w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" />
                      <XAxis dataKey="date" stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff60', fontSize: 10, fontFamily: 'monospace' }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #10b98140', color: '#fff' }}
                        labelStyle={{ fontFamily: 'monospace', fontSize: '10px', color: '#10b981' }}
                      />
                      <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6, fill: '#10b981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="bg-ink text-vellum rounded-2xl shadow-xl p-8 relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-verification opacity-[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:opacity-10 transition-opacity" />
                <h3 className="font-serif text-2xl mb-6 relative z-10">Skill Breakdown</h3>
                <div className="h-64 w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={analytics.radar}>
                      <PolarGrid stroke="#ffffff20" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff80', fontSize: 10, fontFamily: 'monospace' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#ffffff40', fontSize: 10 }} />
                      <Radar name="Score" dataKey="score" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.2} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: '1px solid #10b98140', color: '#fff' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden bg-ink text-vellum rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-xl border border-white/5 min-h-[300px]">
              <div className="absolute inset-0 opacity-[0.02]" style={{
                backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, #ffffff 40px, #ffffff 41px)`,
              }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-verification opacity-10 blur-[100px] rounded-full" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-verification/10 border border-verification/20 flex items-center justify-center mb-6">
                  <span className="text-3xl">📈</span>
                </div>
                <h3 className="font-serif text-3xl font-light mb-2 tracking-tight">Analytics Processing</h3>
                <p className="font-mono text-[10px] text-white/50 uppercase tracking-[0.2em] max-w-sm">
                  Complete your first assessment to unlock cryptographically verified performance metrics and skill radar.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
