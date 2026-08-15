import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Link as LinkIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const TwitterIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const LinkedinIcon = ({ size = 24, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

interface ShareMenuProps {
  profileUrl: string;
  profileName: string;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ profileUrl, profileName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Check out ${profileName}'s verified skills portfolio on SkillProof!`);
    const url = encodeURIComponent(profileUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedin = () => {
    const url = encodeURIComponent(profileUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white/80 text-ink font-mono text-xs font-bold uppercase tracking-widest px-4 py-3.5 rounded-xl hover:bg-white transition-all shadow-md hover:shadow-lg border border-structure/30 flex items-center justify-center gap-2"
        title="Share Profile"
      >
        <Share2 size={16} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-structure/20 overflow-hidden z-50"
            >
              <div className="p-2 flex flex-col gap-1">
                <button
                  onClick={() => {
                    handleCopyLink();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm font-serif text-ink hover:bg-structure/10 rounded-lg transition-colors"
                >
                  {copied ? <Check size={16} className="text-verification" /> : <LinkIcon size={16} className="text-data" />}
                  {copied ? 'Copied!' : 'Copy Public Link'}
                </button>
                <button
                  onClick={() => {
                    handleShareLinkedin();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm font-serif text-ink hover:bg-[#0077b5]/10 hover:text-[#0077b5] rounded-lg transition-colors"
                >
                  <LinkedinIcon size={16} />
                  Share to LinkedIn
                </button>
                <button
                  onClick={() => {
                    handleShareTwitter();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm font-serif text-ink hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] rounded-lg transition-colors"
                >
                  <TwitterIcon size={16} />
                  Share to Twitter
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
