import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Loader } from '../components/Loader';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { ProfileView, type ProfileData } from '../components/profile/ProfileView';
import { motion } from 'framer-motion';

export function PublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const isRecruiter = user?.role === 'recruiter';

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get(`/auth/profile/${id}/`);
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center min-h-[60vh]">
        <Loader text="Decrypting Dossier..." size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center">
        <div className="font-mono text-sm text-seal">Error 404: Dossier not found or not public.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 pt-6 w-full">
      {isRecruiter && (
        <div className="max-w-5xl mx-auto px-4 mb-4">
          <Link to="/recruiter" className="font-mono text-[10px] uppercase font-bold tracking-widest text-data hover:text-ink transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>
      )}
      
      <ProfileView 
        profile={profile} 
        isOwnProfile={false} 
      />
    </div>
  );
}
