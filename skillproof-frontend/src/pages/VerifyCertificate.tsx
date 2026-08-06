import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Loader } from '../components/Loader';
import { BadgeIcon } from '../components/BadgeIcon';
import toast from 'react-hot-toast';

export function VerifyCertificate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [verificationId, setVerificationId] = useState(id || '');
  const [badge, setBadge] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      handleVerify(id);
    }
  }, [id]);

  const handleVerify = async (uuid: string) => {
    if (!uuid) return;
    setLoading(true);
    setError(null);
    setBadge(null);
    
    try {
      const res = await api.get(`/badges/verify/${uuid}/`);
      setBadge(res.data);
      if (uuid !== id) {
        navigate(`/verify/${uuid}`);
      }
    } catch (err: any) {
      console.error(err);
      setError('Certificate not found or invalid Verification ID.');
      toast.error('Invalid Certificate');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(verificationId);
  };

  return (
    <div className="flex-1 flex flex-col items-center p-8 bg-vellum text-ink">
      <div className="max-w-2xl w-full">
        <h1 className="font-serif text-4xl mb-2 text-center text-ink">Verify Credential</h1>
        <p className="font-mono text-sm text-data text-center mb-8">
          Enter a Verification ID to securely validate a SkillProof Certificate.
        </p>

        <form onSubmit={onSubmit} className="flex gap-4 mb-12">
          <input
            type="text"
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            value={verificationId}
            onChange={(e) => setVerificationId(e.target.value)}
            className="flex-1 px-4 py-3 bg-white border border-structure/30 rounded-md font-mono text-sm focus:outline-none focus:border-ink transition-colors text-ink"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-ink text-vellum font-mono text-xs uppercase tracking-widest rounded-md hover:bg-verification transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-md font-mono text-sm text-center">
            {error}
          </div>
        )}

        {badge && (
          <div className="border border-structure/20 bg-white rounded-lg p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-structure/10">
              <div className="flex items-center gap-3 text-verification font-mono text-sm uppercase tracking-widest font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Valid Certificate
              </div>
              <div className="font-mono text-xs text-data text-right">
                Issued: {new Date(badge.issued_at).toLocaleDateString()}<br/>
                ID: {badge.verification_id}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="w-40 h-40 shrink-0">
                <BadgeIcon level={badge.badge_level} size={120} />
              </div>
              
              <div className="flex-1">
                <h2 className="font-serif text-3xl mb-1">{badge.skill_category.name}</h2>
                <div className="font-mono text-sm text-data mb-6 uppercase tracking-wider">
                  {badge.badge_level} Level
                </div>
                
                <div className="bg-vellum p-4 rounded-md border border-structure/20 mb-6 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold">Overall Score</span>
                  <span className="font-serif text-2xl text-verification">{badge.overall_score}%</span>
                </div>

                {badge.sub_scores && Object.keys(badge.sub_scores).length > 0 && (
                  <div>
                    <h3 className="font-mono text-xs uppercase tracking-widest text-data mb-3">Sub Scores</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(badge.sub_scores).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="capitalize">{key.replace('_', ' ')}</span>
                          <span className="font-bold">{val as number}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
