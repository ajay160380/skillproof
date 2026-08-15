import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { FeedWidget } from '../network/NetworkWidgets';
import { BadgeIcon, type BadgeLevel } from '../BadgeIcon';
import toast from 'react-hot-toast';
import { 
  Globe, 
  MapPin, 
  Briefcase, 
  Plus, 
  Link as LinkIcon, 
  Trash2, 
  Code,
  Users,
  UserPlus
} from 'lucide-react';
import { ShareMenu } from './ShareMenu';

const GithubIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

const LinkedinIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

export interface ProfileData {
  id: string | number;
  email: string;
  username?: string;
  full_name?: string;
  headline?: string;
  location?: string;
  company_name?: string;
  avatar_url?: string;
  cover_image?: string;
  bio?: string;
  role?: string;
  is_verified?: boolean;
  public_badges?: any[];
  github_url?: string;
  linkedin_url?: string;
  website_url?: string;
}

interface PortfolioProject {
  id: number;
  title: string;
  description: string;
  project_url?: string;
  repository_url?: string;
  technologies_used: string[];
}

interface ProfileViewProps {
  profile: ProfileData;
  isOwnProfile: boolean;
  onProfileUpdate?: (updatedProfile: ProfileData) => void;
  badges?: any;
  categories?: any[];
  testsByCategory?: any;
  attempts?: any[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  profile, 
  isOwnProfile, 
  onProfileUpdate,
  badges = {},
}) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'skills' | 'portfolio' | 'about' | 'followers' | 'following'>('activity');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ProfileData>>({});
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();

  // Portfolio state
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState<Partial<PortfolioProject>>({ technologies_used: [] });
  const [techInput, setTechInput] = useState('');

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOwnProfile) {
      api.get('/network/my-followers/').then(res => setFollowers(res.data.results || res.data)).catch(console.error);
      api.get('/network/my-following/').then(res => setFollowing(res.data.results || res.data)).catch(console.error);
    } else {
      // Fetch follower/following count for other profiles (mock for now)
      setFollowers([]);
      setFollowing([]);
      
      // Check if we are following this profile
      api.get(`/network/search/?q=${profile.username || ''}`).then(res => {
        const users = res.data.results || res.data;
        const match = users.find((u: any) => u.id === profile.id);
        if (match) {
           api.get('/network/my-following/').then(fRes => {
             const fList = fRes.data.results || fRes.data;
             setIsFollowing(fList.some((f: any) => f.following_detail?.id === profile.id));
           });
        }
      });
    }
  }, [isOwnProfile, profile.id, profile.username]);

  const toggleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/network/unfollow-user/${profile.id}/`);
        setIsFollowing(false);
      } else {
        await api.post('/network/follow-user/', { user_id: profile.id });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleMessage = async () => {
    try {
      const res = await api.post('/messages/start-conversation/', { recipient_id: profile.id });
      const userStr = localStorage.getItem('user_info');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'recruiter') {
          navigate(`/recruiter?tab=Messages&conversation=${res.data.id}`);
        } else {
          navigate(`/dashboard?tab=Messages&conversation=${res.data.id}`);
        }
      } else {
        navigate(`/dashboard?tab=Messages&conversation=${res.data.id}`);
      }
    } catch (err) {
      console.error('Failed to start conversation:', err);
      alert('Unable to start conversation. Make sure you are following each other.');
    }
  };

  useEffect(() => {
    if (activeTab === 'portfolio') {
      fetchProjects();
    }
  }, [activeTab, profile.id]);

  const fetchProjects = async () => {
    try {
      const res = await api.get(`/portfolio/projects/?user_id=${profile.id}`);
      setProjects(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  const handleEditSave = async () => {
    try {
      setIsSaving(true);
      const formData = new FormData();
      if (editData.full_name) formData.append('full_name', editData.full_name);
      if (editData.headline) formData.append('headline', editData.headline);
      if (editData.location) formData.append('location', editData.location);
      if (editData.company_name) formData.append('company_name', editData.company_name);
      if (editData.bio) formData.append('bio', editData.bio);
      if (editData.github_url) formData.append('github_url', editData.github_url);
      if (editData.linkedin_url) formData.append('linkedin_url', editData.linkedin_url);
      if (editData.website_url) formData.append('website_url', editData.website_url);
      
      if (coverFile) formData.append('cover_image', coverFile);
      if (avatarFile) formData.append('avatar_url', avatarFile);

      const res = await api.patch('/auth/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onProfileUpdate) {
        onProfileUpdate(res.data);
      }
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectImageUpload = async (file: File, type: 'avatar_url' | 'cover_image') => {
    let toastId: string | undefined;
    try {
      const formData = new FormData();
      formData.append(type, file);
      
      toastId = toast.loading(`Uploading ${type === 'avatar_url' ? 'profile picture' : 'cover image'}...`);
      const res = await api.patch('/auth/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (onProfileUpdate) {
        onProfileUpdate(res.data);
      }
      toast.success('Image updated successfully!', { id: toastId });
    } catch (err) {
      console.error('Failed to upload image:', err);
      toast.error('Failed to upload image', { id: toastId });
    }
  };

  const handleSaveProject = async () => {
    try {
      await api.post('/portfolio/projects/', newProject);
      toast.success("Project added to portfolio!");
      setIsAddingProject(false);
      setNewProject({ technologies_used: [] });
      setTechInput('');
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add project");
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await api.delete(`/portfolio/projects/${id}/`);
      toast.success("Project deleted");
      fetchProjects();
    } catch (err) {
      toast.error("Failed to delete project");
    }
  };

  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'skills', label: 'Skills' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'about', label: 'About' },
    { id: 'followers', label: `Followers (${followers.length})` },
    { id: 'following', label: `Following (${following.length})` },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'activity':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="max-w-2xl mx-auto mt-8">
              <h2 className="font-serif text-2xl font-bold text-ink mb-6">Recent Activity</h2>
              <FeedWidget authorId={profile.id} hidePostInput={!isOwnProfile} />
            </div>
          </motion.div>
        );
      case 'skills':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-6">
            {(() => {
              const displayBadges = isOwnProfile ? Object.values(badges) : (profile.public_badges || []);
              if (displayBadges.length > 0) {
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {displayBadges.map((badge: any, idx: number) => (
                      <div key={idx} className="group relative bg-white/40 backdrop-blur-3xl rounded-3xl p-6 border border-white/60 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-500 flex flex-col items-center gap-4 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-verification/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                          <BadgeIcon level={badge.badge_level as BadgeLevel} size={80} />
                        </div>
                        <div className="text-center relative z-10">
                          <div className="font-serif font-bold text-ink text-lg">{badge.skill_category?.name || 'Skill Badge'}</div>
                          <div className="font-mono text-[10px] text-verification font-bold uppercase tracking-widest mt-2 bg-verification/10 py-1 px-3 rounded-full inline-block">
                            Score: {badge.overall_score}/100 • {badge.badge_level}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-16 bg-white/30 backdrop-blur-md rounded-2xl border border-dashed border-structure/30">
                    <p className="font-mono text-xs uppercase tracking-widest text-data">No verified skills yet.</p>
                  </div>
                );
              }
            })()}
          </motion.div>
        );
      case 'portfolio':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif text-xl font-bold text-ink">Portfolio Projects</h3>
              {isOwnProfile && !isAddingProject && (
                <button 
                  onClick={() => setIsAddingProject(true)}
                  className="flex items-center gap-2 bg-ink text-white font-mono text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg hover:bg-ink/90 transition-all shadow-md"
                >
                  <Plus size={14} /> Add Project
                </button>
              )}
            </div>

            <AnimatePresence>
              {isAddingProject && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-lg overflow-hidden"
                >
                  <h4 className="font-serif font-bold text-lg text-ink mb-4">New Project</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="md:col-span-2">
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-1">Title</label>
                      <input type="text" value={newProject.title || ''} onChange={e => setNewProject({...newProject, title: e.target.value})} className="w-full bg-white/50 border border-structure/30 rounded-lg px-4 py-2 font-serif text-sm focus:outline-none focus:border-verification" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-1">Description</label>
                      <textarea value={newProject.description || ''} onChange={e => setNewProject({...newProject, description: e.target.value})} className="w-full bg-white/50 border border-structure/30 rounded-lg px-4 py-2 font-serif text-sm focus:outline-none focus:border-verification min-h-[80px]" />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-1">Live URL (Optional)</label>
                      <input type="text" value={newProject.project_url || ''} onChange={e => setNewProject({...newProject, project_url: e.target.value})} className="w-full bg-white/50 border border-structure/30 rounded-lg px-4 py-2 font-serif text-sm focus:outline-none focus:border-verification" />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-1">Repository URL (Optional)</label>
                      <input type="text" value={newProject.repository_url || ''} onChange={e => setNewProject({...newProject, repository_url: e.target.value})} className="w-full bg-white/50 border border-structure/30 rounded-lg px-4 py-2 font-serif text-sm focus:outline-none focus:border-verification" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-1">Technologies Used</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={techInput} 
                          onChange={e => setTechInput(e.target.value)} 
                          onKeyDown={e => {
                            if (e.key === 'Enter' && techInput.trim()) {
                              e.preventDefault();
                              setNewProject({...newProject, technologies_used: [...(newProject.technologies_used || []), techInput.trim()]});
                              setTechInput('');
                            }
                          }}
                          placeholder="e.g. React (Press Enter)" 
                          className="w-full bg-white/50 border border-structure/30 rounded-lg px-4 py-2 font-serif text-sm focus:outline-none focus:border-verification" 
                        />
                        <button 
                          onClick={() => {
                            if (techInput.trim()) {
                              setNewProject({...newProject, technologies_used: [...(newProject.technologies_used || []), techInput.trim()]});
                              setTechInput('');
                            }
                          }}
                          className="bg-structure/20 px-4 rounded-lg font-mono text-[10px] font-bold uppercase hover:bg-structure/30"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newProject.technologies_used?.map((tech, idx) => (
                          <span key={idx} className="bg-ink text-white font-mono text-[9px] px-2 py-1 rounded flex items-center gap-1">
                            {tech}
                            <button onClick={() => {
                              const newTech = [...(newProject.technologies_used || [])];
                              newTech.splice(idx, 1);
                              setNewProject({...newProject, technologies_used: newTech});
                            }}><Trash2 size={10} /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button onClick={() => setIsAddingProject(false)} className="px-6 py-2 font-mono text-[10px] uppercase tracking-widest font-bold text-data hover:text-ink transition-colors">Cancel</button>
                    <button onClick={handleSaveProject} disabled={!newProject.title || !newProject.description} className="bg-ink text-white font-mono text-[10px] uppercase tracking-widest font-bold px-6 py-2 rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-50 shadow-md">
                      Save Project
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.length === 0 && !isAddingProject && (
                <div className="md:col-span-2 text-center py-16 bg-white/30 backdrop-blur-md rounded-2xl border border-dashed border-structure/30">
                  <p className="font-mono text-xs uppercase tracking-widest text-data">No projects added yet.</p>
                </div>
              )}
              {projects.map((proj) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={proj.id} 
                  className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-structure/20 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                >
                  {isOwnProfile && (
                    <button 
                      onClick={() => handleDeleteProject(proj.id)}
                      className="absolute top-4 right-4 text-data hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  <h4 className="font-serif font-bold text-xl text-ink pr-6">{proj.title}</h4>
                  <p className="font-serif text-sm text-ink/70 mt-2 flex-1 whitespace-pre-wrap">{proj.description}</p>
                  
                  {proj.technologies_used?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {proj.technologies_used.map((tech, idx) => (
                        <span key={idx} className="bg-structure/20 text-ink font-mono text-[9px] px-2 py-1 rounded-md uppercase tracking-wide font-bold">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-6 pt-4 border-t border-structure/20">
                    {proj.project_url && (
                      <a href={proj.project_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest font-bold text-verification hover:text-verification/80 transition-colors">
                        <LinkIcon size={12} /> Live Demo
                      </a>
                    )}
                    {proj.repository_url && (
                      <a href={proj.repository_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest font-bold text-ink hover:text-ink/80 transition-colors">
                        <GithubIcon size={12} /> Repository
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      case 'about':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-lg">
            <h3 className="font-serif text-xl font-bold text-ink mb-6 flex items-center gap-2">
              <Users size={20} className="text-data" /> About Me
            </h3>
            <p className="font-serif text-ink/90 whitespace-pre-wrap leading-relaxed text-lg">
              {profile.bio || 'No bio provided.'}
            </p>
          </motion.div>
        );
      case 'followers':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followers.length === 0 && <p className="font-mono text-xs uppercase tracking-widest text-data p-4 col-span-full text-center">No followers yet.</p>}
            {followers.map(f => (
              <div key={f.id} className="bg-white/60 backdrop-blur-md p-4 rounded-xl border border-structure/20 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-structure/40 to-structure/10 border border-white flex items-center justify-center font-serif font-bold text-ink text-lg shadow-inner">
                  {(f.follower_detail?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-serif font-bold text-ink">{f.follower_detail?.full_name}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-data">{f.follower_detail?.company_name || 'Candidate'}</div>
                </div>
              </div>
            ))}
          </motion.div>
        );
      case 'following':
        return (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {following.length === 0 && <p className="font-mono text-xs uppercase tracking-widest text-data p-4 col-span-full text-center">Not following anyone yet.</p>}
            {following.map(f => (
              <div key={f.id} className="bg-white/60 backdrop-blur-md p-4 rounded-xl border border-structure/20 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-structure/40 to-structure/10 border border-white flex items-center justify-center font-serif font-bold text-ink text-lg shadow-inner">
                  {(f.following_detail?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-serif font-bold text-ink">{f.following_detail?.full_name}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-data">{f.following_detail?.company_name || 'Candidate'}</div>
                </div>
              </div>
            ))}
          </motion.div>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 sm:px-6 lg:px-8">
      {/* Cover Banner with premium styling */}
      <div className="relative w-full h-56 md:h-80 rounded-b-[3rem] bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/20 overflow-hidden group shadow-[0_8px_32px_-12px_rgba(0,0,0,0.15)]">
        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
        {/* Animated glowing orbs in banner when no cover */}
        {!coverFile && !profile.cover_image && (
          <>
            <div className="absolute top-10 left-20 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-20 w-60 h-60 bg-emerald-500/30 rounded-full blur-3xl animate-pulse delay-700" />
          </>
        )}
        {(profile.cover_image || coverFile) && (
          <motion.img 
            initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 1 }}
            src={coverFile ? URL.createObjectURL(coverFile) : (profile.cover_image?.startsWith('http') ? profile.cover_image : `http://localhost:8000${profile.cover_image}`)} 
            alt="Cover" 
            className="w-full h-full object-cover" 
          />
        )}
        {isOwnProfile && (
          <>
            <button 
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 text-ink backdrop-blur-md p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-xl border border-white/30"
              title="Change Cover"
            >
              <Code size={20} />
            </button>
            <input type="file" ref={coverInputRef} accept="image/*" className="hidden" onChange={e => {
              if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                setCoverFile(file);
                handleDirectImageUpload(file, 'cover_image');
              }
            }} />
          </>
        )}
      </div>

      {/* Identity Block - Glassmorphism */}
      <div className="relative px-6 md:px-12 pb-8 pt-8 bg-white/60 backdrop-blur-3xl border border-white/60 rounded-[2.5rem] mx-4 md:mx-10 -mt-24 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.15)] mb-12">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Avatar */}
          <div className="relative -mt-24 group z-10">
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-8 border-white/90 backdrop-blur-2xl bg-gradient-to-br from-indigo-50 to-emerald-50 flex items-center justify-center font-serif font-bold text-ink text-6xl overflow-hidden shrink-0 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.3)] ring-4 ring-white/50">
              {(profile.avatar_url || avatarFile) ? (
                <img 
                  src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="bg-clip-text text-transparent bg-gradient-to-br from-ink to-ink/60">{(profile.full_name || profile.username || 'U')[0].toUpperCase()}</span>
              )}
            </div>
            {isOwnProfile && (
              <>
                <button 
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-ink text-white p-2.5 rounded-full shadow-xl transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                >
                  <Code size={18} />
                </button>
                <input type="file" ref={avatarInputRef} accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setAvatarFile(file);
                    handleDirectImageUpload(file, 'avatar_url');
                  }
                }} />
              </>
            )}
          </div>

          <div className="flex-1">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink tracking-tight">{profile.full_name || profile.username || 'Candidate'}</h1>
            <p className="font-serif text-xl md:text-2xl text-ink/70 mt-2 font-medium">{profile.headline || profile.company_name || 'Add a headline'}</p>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4">
              {profile.location && (
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink/80 font-bold">
                  <MapPin size={14} /> {profile.location}
                </span>
              )}
              {profile.company_name && (
                <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink/80 font-bold">
                  <Briefcase size={14} /> {profile.company_name}
                </span>
              )}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4 mt-5 pt-5 border-t border-structure/20">
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noreferrer" className="text-data hover:text-ink transition-colors p-2 bg-white/50 rounded-full hover:bg-white shadow-sm">
                  <GithubIcon size={18} />
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="text-data hover:text-[#0077b5] transition-colors p-2 bg-white/50 rounded-full hover:bg-white shadow-sm">
                  <LinkedinIcon size={18} />
                </a>
              )}
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noreferrer" className="text-data hover:text-verification transition-colors p-2 bg-white/50 rounded-full hover:bg-white shadow-sm">
                  <Globe size={18} />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 self-stretch md:self-center w-full md:w-auto">
            {isOwnProfile ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditData(profile);
                    setIsEditing(true);
                  }}
                  className="flex-1 bg-white/80 text-ink font-mono text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl hover:bg-white transition-all shadow-md hover:shadow-lg border border-structure/30 flex items-center justify-center gap-2"
                >
                  Edit Profile
                </button>
                <ShareMenu profileUrl={`${window.location.origin}/profile/${profile.username || profile.id}`} profileName={profile.full_name || profile.username || 'Candidate'} />
              </div>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={toggleFollow}
                  className={`flex-1 font-mono text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                    isFollowing ? 'bg-white/80 text-ink hover:bg-white border border-structure/30' : 'bg-ink text-white hover:bg-ink/90'
                  }`}
                >
                  <UserPlus size={16} /> {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleMessage}
                  className="w-[52px] h-[52px] flex-shrink-0 bg-white/80 text-ink hover:bg-white border border-structure/30 font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
                  title="Message"
                >
                  💬
                </button>
                <ShareMenu profileUrl={`${window.location.origin}/profile/${profile.username || profile.id}`} profileName={profile.full_name || profile.username || 'Candidate'} />
              </div>
            )}
            <div className="flex justify-between md:justify-center gap-6 px-4 py-2 bg-structure/5 rounded-xl border border-structure/10">
              <button onClick={() => setActiveTab('followers')} className="text-center group">
                <div className="font-serif text-2xl font-bold text-ink group-hover:text-verification transition-colors">{followers.length}</div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-data">Followers</div>
              </button>
              <div className="w-px bg-structure/20"></div>
              <button onClick={() => setActiveTab('following')} className="text-center group">
                <div className="font-serif text-2xl font-bold text-ink group-hover:text-verification transition-colors">{following.length}</div>
                <div className="font-mono text-[9px] uppercase tracking-widest text-data">Following</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Tabs */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar p-1 bg-structure/10 rounded-2xl backdrop-blur-sm border border-structure/20 w-max max-w-full">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative px-6 py-3 font-mono text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-all rounded-xl z-10 ${activeTab === tab.id ? 'text-ink' : 'text-data hover:text-ink'}`}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabProfileBg"
                className="absolute inset-0 bg-white rounded-xl shadow-sm border border-white/50 -z-10"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Enhanced Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/40 backdrop-blur-md"
              onClick={() => setIsEditing(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-structure/20"
            >
              <div className="p-6 border-b border-structure/20 flex justify-between items-center bg-vellum/50">
                <h3 className="font-serif text-2xl font-bold text-ink">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)} className="text-data hover:text-ink text-xl p-2 rounded-full hover:bg-structure/20 transition-colors">✕</button>
              </div>
              <div className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2 font-bold">Full Name</label>
                    <input type="text" value={editData.full_name || ''} onChange={e => setEditData({...editData, full_name: e.target.value})} className="w-full bg-structure/5 border border-structure/20 rounded-xl px-4 py-3 font-serif text-base focus:outline-none focus:border-verification focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2 font-bold">Headline</label>
                    <input type="text" value={editData.headline || ''} onChange={e => setEditData({...editData, headline: e.target.value})} placeholder="e.g. AI & Web Developer" className="w-full bg-structure/5 border border-structure/20 rounded-xl px-4 py-3 font-serif text-base focus:outline-none focus:border-verification focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2 font-bold">Location</label>
                    <input type="text" value={editData.location || ''} onChange={e => setEditData({...editData, location: e.target.value})} placeholder="e.g. Mumbai, India" className="w-full bg-structure/5 border border-structure/20 rounded-xl px-4 py-3 font-serif text-base focus:outline-none focus:border-verification focus:bg-white transition-colors" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2 font-bold">Company / University</label>
                    <input type="text" value={editData.company_name || ''} onChange={e => setEditData({...editData, company_name: e.target.value})} className="w-full bg-structure/5 border border-structure/20 rounded-xl px-4 py-3 font-serif text-base focus:outline-none focus:border-verification focus:bg-white transition-colors" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2 font-bold">About / Bio</label>
                    <textarea value={editData.bio || ''} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full bg-structure/5 border border-structure/20 rounded-xl px-4 py-3 font-serif text-base focus:outline-none focus:border-verification focus:bg-white transition-colors min-h-[120px]" />
                  </div>
                  
                  <div className="md:col-span-2 pt-4 border-t border-structure/20">
                    <h4 className="font-serif font-bold text-lg text-ink mb-4">Social Links</h4>
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2 font-bold flex items-center gap-1.5"><GithubIcon size={12}/> GitHub URL</label>
                    <input type="url" value={editData.github_url || ''} onChange={e => setEditData({...editData, github_url: e.target.value})} placeholder="https://github.com/..." className="w-full bg-structure/5 border border-structure/20 rounded-xl px-4 py-3 font-serif text-base focus:outline-none focus:border-verification focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2 font-bold flex items-center gap-1.5"><LinkedinIcon size={12}/> LinkedIn URL</label>
                    <input type="url" value={editData.linkedin_url || ''} onChange={e => setEditData({...editData, linkedin_url: e.target.value})} placeholder="https://linkedin.com/in/..." className="w-full bg-structure/5 border border-structure/20 rounded-xl px-4 py-3 font-serif text-base focus:outline-none focus:border-verification focus:bg-white transition-colors" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2 font-bold flex items-center gap-1.5"><Globe size={12}/> Personal Website</label>
                    <input type="url" value={editData.website_url || ''} onChange={e => setEditData({...editData, website_url: e.target.value})} placeholder="https://..." className="w-full bg-structure/5 border border-structure/20 rounded-xl px-4 py-3 font-serif text-base focus:outline-none focus:border-verification focus:bg-white transition-colors" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-structure/20 bg-vellum/50 flex justify-end gap-4">
                <button onClick={() => setIsEditing(false)} className="px-6 py-3 font-mono text-[11px] uppercase tracking-widest font-bold text-data hover:text-ink transition-colors rounded-xl hover:bg-structure/10">Cancel</button>
                <button onClick={handleEditSave} disabled={isSaving} className="bg-ink text-white font-mono text-[11px] uppercase tracking-widest font-bold px-8 py-3 rounded-xl hover:bg-ink/90 transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
