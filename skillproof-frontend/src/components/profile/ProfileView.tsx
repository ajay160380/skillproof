import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { FeedWidget } from '../network/NetworkWidgets';
import { BadgeIcon, type BadgeLevel } from '../BadgeIcon';
import toast from 'react-hot-toast';

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
}

interface ProfileViewProps {
  profile: ProfileData;
  isOwnProfile: boolean;
  onProfileUpdate?: (updatedProfile: ProfileData) => void;
  // Stats and existing data passed from the parent for Verified Skills tab
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
  categories = [],
  testsByCategory = {},
  attempts = []
}) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'skills' | 'about' | 'followers' | 'following'>('activity');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ProfileData>>({});
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // For public profiles or others' profiles, Followers/Following might need to be fetched 
  // if not passed from parent, but to keep it simple we'll just render placeholders or fetch them here.
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);

  useEffect(() => {
    if (isOwnProfile) {
      api.get('/network/my-followers/').then(res => setFollowers(res.data.results || res.data)).catch(console.error);
      api.get('/network/my-following/').then(res => setFollowing(res.data.results || res.data)).catch(console.error);
    } else {
      // Future: fetch public followers/following if backend supports it
    }
  }, [isOwnProfile, profile.id]);

  const handleEditSave = async () => {
    try {
      setIsSaving(true);
      const formData = new FormData();
      if (editData.full_name) formData.append('full_name', editData.full_name);
      if (editData.headline) formData.append('headline', editData.headline);
      if (editData.location) formData.append('location', editData.location);
      if (editData.company_name) formData.append('company_name', editData.company_name);
      if (editData.bio) formData.append('bio', editData.bio);
      
      if (coverFile) formData.append('cover_image', coverFile);
      if (avatarFile) formData.append('avatar_url', avatarFile);

      const res = await api.patch('/accounts/me/', formData);
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
      const res = await api.patch('/accounts/me/', formData);
      
      if (onProfileUpdate) {
        onProfileUpdate(res.data);
      }
      toast.success('Image updated successfully!', { id: toastId });
    } catch (err) {
      console.error('Failed to upload image:', err);
      toast.error('Failed to upload image', { id: toastId });
    }
  };

  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'skills', label: 'Verified Skills' },
    { id: 'about', label: 'About' },
    { id: 'followers', label: `Followers (${followers.length})` },
    { id: 'following', label: `Following (${following.length})` },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'activity':
        return (
          <div className="mt-6">
            <h3 className="font-serif text-xl font-bold text-ink mb-4">Recent Activity</h3>
            {/* FeedWidget scoped to this user */}
            <FeedWidget authorId={profile.id} />
          </div>
        );
      case 'skills':
        return (
          <div className="mt-6 space-y-6">
            {(() => {
              const displayBadges = isOwnProfile ? Object.values(badges) : (profile.public_badges || []);
              
              if (displayBadges.length > 0) {
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayBadges.map((badge: any, idx: number) => (
                      <div key={idx} className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-structure/30 shadow-sm flex items-center gap-4">
                        <BadgeIcon level={badge.badge_level as BadgeLevel} size={64} />
                        <div>
                          <div className="font-serif font-bold text-ink text-lg">{badge.skill_category?.name || 'Skill Badge'}</div>
                          <div className="font-mono text-[10px] text-verification font-bold uppercase tracking-widest mt-1">
                            Score: {badge.overall_score}/100 • Level: {badge.badge_level}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-12 bg-structure/5 rounded-2xl border border-dashed border-structure/20">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-data">No verified skills yet.</p>
                  </div>
                );
              }
            })()}
          </div>
        );
      case 'about':
        return (
          <div className="mt-6 bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm">
            <h3 className="font-serif text-xl font-bold text-ink mb-4">About</h3>
            <p className="font-serif text-ink whitespace-pre-wrap">{profile.bio || 'No bio provided.'}</p>
          </div>
        );
      case 'followers':
        return (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {followers.length === 0 && <p className="font-mono text-[10px] uppercase tracking-widest text-data p-4">No followers yet.</p>}
            {followers.map(f => (
              <div key={f.id} className="bg-white p-4 rounded-xl border border-structure/20 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-structure/20 flex items-center justify-center font-serif font-bold text-ink">
                  {(f.follower_detail?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-serif font-bold text-ink text-sm">{f.follower_detail?.full_name}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-data">{f.follower_detail?.company_name || 'Candidate'}</div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'following':
        return (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {following.length === 0 && <p className="font-mono text-[10px] uppercase tracking-widest text-data p-4">Not following anyone yet.</p>}
            {following.map(f => (
              <div key={f.id} className="bg-white p-4 rounded-xl border border-structure/20 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-structure/20 flex items-center justify-center font-serif font-bold text-ink">
                  {(f.following_detail?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-serif font-bold text-ink text-sm">{f.following_detail?.full_name}</div>
                  <div className="font-mono text-[9px] uppercase tracking-widest text-data">{f.following_detail?.company_name || 'Candidate'}</div>
                </div>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Cover Banner */}
      <div className="relative w-full h-48 md:h-64 rounded-b-3xl bg-gradient-to-r from-structure to-platinum overflow-hidden group">
        {(profile.cover_image || coverFile) && (
          <img 
            src={coverFile ? URL.createObjectURL(coverFile) : (profile.cover_image?.startsWith('http') ? profile.cover_image : `http://localhost:8000${profile.cover_image}`)} 
            alt="Cover" 
            className="w-full h-full object-cover" 
          />
        )}
        {isOwnProfile && (
          <>
            <button 
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
            >
              📸
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

      {/* Identity Block */}
      <div className="relative px-6 md:px-10 pb-6 bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl mx-4 -mt-16 shadow-lg mb-8">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
          {/* Avatar */}
          <div className="relative -mt-12 group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white bg-structure/10 flex items-center justify-center font-serif font-bold text-ink text-5xl overflow-hidden shrink-0 shadow-md">
              {(profile.avatar_url || avatarFile) ? (
                <img 
                  src={avatarFile ? URL.createObjectURL(avatarFile) : profile.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                (profile.full_name || profile.username || 'U')[0].toUpperCase()
              )}
            </div>
            {isOwnProfile && (
              <>
                <button 
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                >
                  📸
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

          <div className="flex-1 pt-4 md:pt-0">
            <h1 className="font-serif text-3xl font-bold text-ink">{profile.full_name || profile.username || 'Candidate'}</h1>
            <p className="font-serif text-lg text-ink/80 mt-1">{profile.headline || profile.company_name || 'Add a headline'}</p>
            <div className="flex items-center gap-4 mt-2 font-mono text-[10px] uppercase tracking-widest text-data">
              {profile.location && <span>📍 {profile.location}</span>}
              <button onClick={() => setActiveTab('followers')} className="hover:text-ink transition-colors font-bold">
                {followers.length} Followers
              </button>
              <button onClick={() => setActiveTab('following')} className="hover:text-ink transition-colors font-bold">
                {following.length} Following
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-end mt-4 md:mt-0">
            {isOwnProfile ? (
              <button 
                onClick={() => {
                  setEditData(profile);
                  setIsEditing(true);
                }}
                className="bg-structure/20 text-ink font-mono text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-structure/30 transition-colors border border-structure/50"
              >
                Edit Profile
              </button>
            ) : (
              <button className="bg-ink text-white font-mono text-[10px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-lg hover:bg-ink/90 transition-colors">
                Follow
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-4 mb-2 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`relative px-4 py-3 font-mono text-[10px] uppercase tracking-widest font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'text-ink' : 'text-data hover:text-ink/70'}`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabProfile"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-verification"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="border-t border-structure/20 px-4">
        {renderTabContent()}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
              onClick={() => setIsEditing(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-structure/20 flex justify-between items-center bg-vellum">
                <h3 className="font-serif text-xl font-bold text-ink">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)} className="text-data hover:text-ink text-xl">✕</button>
              </div>
              <div className="p-6 overflow-y-auto space-y-5">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2">Full Name</label>
                  <input type="text" value={editData.full_name || ''} onChange={e => setEditData({...editData, full_name: e.target.value})} className="w-full bg-white border border-structure/30 rounded-lg px-4 py-2 font-serif text-sm focus:outline-none focus:border-verification" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2">Headline</label>
                  <input type="text" value={editData.headline || ''} onChange={e => setEditData({...editData, headline: e.target.value})} placeholder="e.g. AI & Web Developer | BTech CSE" className="w-full bg-white border border-structure/30 rounded-lg px-4 py-2 font-serif text-sm focus:outline-none focus:border-verification" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2">Location</label>
                  <input type="text" value={editData.location || ''} onChange={e => setEditData({...editData, location: e.target.value})} placeholder="e.g. Mumbai, India" className="w-full bg-white border border-structure/30 rounded-lg px-4 py-2 font-serif text-sm focus:outline-none focus:border-verification" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2">Company / University</label>
                  <input type="text" value={editData.company_name || ''} onChange={e => setEditData({...editData, company_name: e.target.value})} className="w-full bg-white border border-structure/30 rounded-lg px-4 py-2 font-serif text-sm focus:outline-none focus:border-verification" />
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-widest text-data mb-2">About / Bio</label>
                  <textarea value={editData.bio || ''} onChange={e => setEditData({...editData, bio: e.target.value})} className="w-full bg-white border border-structure/30 rounded-lg px-4 py-2 font-serif text-sm focus:outline-none focus:border-verification min-h-[100px]" />
                </div>
              </div>
              <div className="p-6 border-t border-structure/20 bg-vellum flex justify-end gap-3">
                <button onClick={() => setIsEditing(false)} className="px-6 py-2 font-mono text-[10px] uppercase tracking-widest font-bold text-data hover:text-ink transition-colors">Cancel</button>
                <button onClick={handleEditSave} disabled={isSaving} className="bg-ink text-white font-mono text-[10px] uppercase tracking-widest font-bold px-6 py-2 rounded-lg hover:bg-ink/90 transition-colors disabled:opacity-50">
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
