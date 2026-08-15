import React from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';

export const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 400, damping: 30 } }
};

const glassCardClasses = "relative bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)] rounded-3xl p-6 hover:shadow-[0_16px_48px_-12px_rgba(0,0,0,0.15)] transition-all duration-500 overflow-hidden group";

export const ActivityStreakWidget = ({ attempts = [] }: { attempts?: any[] }) => {
  const currentStreak = attempts.length > 0 ? 3 : 0; // Simplified for now
  const passed = attempts.filter((a: any) => a.score && a.score.overall_score >= 70).length;
  
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -6, scale: 1.02 }} className={`${glassCardClasses} flex flex-col justify-between h-full`}>
      {/* Decorative gradient blob */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-400/20 rounded-full blur-3xl group-hover:bg-orange-400/30 transition-colors duration-500" />
      
      <div className="relative z-10 flex justify-between items-start mb-6">
        <div>
          <h4 className="font-serif text-lg font-bold text-ink tracking-tight">Activity Streak</h4>
          <p className="font-mono text-[9px] text-data font-bold uppercase tracking-[0.2em] mt-1">Consistency Tracker</p>
        </div>
        <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow-sm">
          <span className="text-xl">🔥</span>
        </div>
      </div>
      
      <div className="relative z-10 flex items-end gap-3 mb-8">
        <div className="text-6xl font-serif font-bold bg-clip-text text-transparent bg-gradient-to-br from-ink to-ink/70 leading-none tracking-tighter drop-shadow-sm">{currentStreak}</div>
        <div className="pb-2 font-mono text-[10px] text-data font-bold uppercase tracking-widest">Day<br/>Streak</div>
      </div>

      <div className="relative z-10 space-y-4">
        <div>
          <div className="flex justify-between text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-ink/70 mb-3">
            <span>Tests Passed</span>
            <span className="text-verification">{passed} Total</span>
          </div>
          <div className="w-full bg-structure/30 h-2 rounded-full overflow-hidden flex shadow-inner">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min(passed * 10, 100)}%` }}
               transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
               className="bg-gradient-to-r from-verification to-emerald-400 h-2 rounded-full relative overflow-hidden"
             >
               <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite] -translate-x-full" />
             </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const RecentJobMatchesWidget = ({ jobs = [] }: { jobs?: any[] }) => (
  <motion.div variants={itemVariants} whileHover={{ y: -6, scale: 1.02 }} className={`${glassCardClasses} flex flex-col h-full`}>
    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl group-hover:bg-blue-400/30 transition-colors duration-500" />
    
    <div className="relative z-10 flex justify-between items-start mb-6">
      <div>
        <h4 className="font-serif text-lg font-bold text-ink tracking-tight">Recent Matches</h4>
        <p className="font-mono text-[9px] text-data font-bold uppercase tracking-[0.2em] mt-1">High fit jobs</p>
      </div>
      <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow-sm">
        <span className="text-xl">💼</span>
      </div>
    </div>
    
    <div className="relative z-10 flex-1 flex flex-col justify-center space-y-3">
      {jobs.length > 0 ? jobs.slice(0, 3).map((job, i) => (
        <a href={`/jobs/${job.id}`} key={i} className="flex justify-between items-center bg-white/50 hover:bg-white/90 p-4 rounded-2xl cursor-pointer border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 group/item">
          <div>
            <span className="font-serif text-sm font-bold text-ink group-hover/item:text-blue-600 transition-colors block tracking-tight">{job.title}</span>
            <span className="font-mono text-[9px] font-bold text-data uppercase tracking-widest mt-1 block">{job.company_name}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover/item:bg-blue-600 group-hover/item:text-white transition-colors">
            <span className="text-xs group-hover/item:translate-x-0.5 transition-transform">→</span>
          </div>
        </a>
      )) : (
        <div className="text-center py-8 bg-white/30 rounded-2xl border border-dashed border-white/60">
          <p className="font-mono text-[9px] font-bold text-data uppercase tracking-[0.2em]">No matches yet.</p>
        </div>
      )}
    </div>
  </motion.div>
);

export const UpcomingInterviewsWidget = ({ invites = [] }: { invites?: any[] }) => (
  <motion.div variants={itemVariants} whileHover={{ y: -6, scale: 1.02 }} className={`${glassCardClasses} flex flex-col h-full`}>
    <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl group-hover:bg-purple-400/30 transition-colors duration-500" />
    
    <div className="relative z-10 flex justify-between items-start mb-6">
      <div>
        <h4 className="font-serif text-lg font-bold text-ink tracking-tight">Interviews</h4>
        <p className="font-mono text-[9px] text-data font-bold uppercase tracking-[0.2em] mt-1">Recruiter Invites</p>
      </div>
      <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow-sm">
        <span className="text-xl">🗓️</span>
      </div>
    </div>
    
    <div className="relative z-10 flex-1 flex flex-col justify-center gap-4">
      {invites.length > 0 ? (
        invites.slice(0, 2).map((invite, i) => (
          <div key={i} className="flex items-center gap-4 bg-white/60 p-3 rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ink to-ink/80 text-white flex flex-col items-center justify-center leading-none shadow-lg shadow-ink/20">
              <span className="font-mono text-[8px] uppercase tracking-widest font-bold opacity-80">
                {invite.proposed_time ? new Date(invite.proposed_time).toLocaleDateString(undefined, { month: 'short' }) : 'Day'}
              </span>
              <span className="font-serif text-lg font-bold mt-0.5">
                {invite.proposed_time ? new Date(invite.proposed_time).getDate() : '--'}
              </span>
            </div>
            <div className="flex-1">
              <div className="font-serif font-bold text-sm text-ink tracking-tight">{invite.recruiter_company || 'Tech Company'}</div>
              <div className="font-mono text-[9px] text-data font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${invite.status === 'Accepted' ? 'bg-verification' : 'bg-gold'}`} />
                {invite.status || 'Pending'}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-8 bg-white/30 rounded-2xl border border-dashed border-white/60 text-center">
          <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-data">No schedules yet</p>
        </div>
      )}
    </div>
  </motion.div>
);

export const PortfolioWidget = ({ projects = [] }: { projects?: any[] }) => (
  <motion.div variants={itemVariants} whileHover={{ y: -6, scale: 1.02 }} className={`${glassCardClasses} flex flex-col justify-between h-full`}>
    <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl group-hover:bg-emerald-400/30 transition-colors duration-500" />
    
    <div className="relative z-10 flex justify-between items-start mb-6">
      <div>
        <h4 className="font-serif text-lg font-bold text-ink tracking-tight">Portfolio</h4>
        <p className="font-mono text-[9px] text-data font-bold uppercase tracking-[0.2em] mt-1">Showcase work</p>
      </div>
      <div className="w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow-sm">
        <span className="text-xl">🌐</span>
      </div>
    </div>
    
    <div className="relative z-10 mb-6 flex-1 overflow-y-auto">
      {projects.length > 0 ? (
        <ul className="space-y-3">
          {projects.slice(0, 3).map((p, i) => (
             <li key={i} className="flex items-center gap-3 bg-white/40 p-3 rounded-xl border border-white/50">
               <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-sm">✨</div>
               <span className="text-sm font-serif font-bold text-ink tracking-tight truncate flex-1">{p.title}</span>
             </li>
          ))}
        </ul>
      ) : (
        <div className="h-full flex items-center justify-center text-center py-6 bg-white/30 rounded-2xl border border-dashed border-white/60">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-data">Empty Portfolio</p>
        </div>
      )}
    </div>
    
    <button className="relative z-10 w-full py-4 bg-ink text-white rounded-2xl font-mono text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-ink/90 transition-all shadow-[0_8px_16px_-8px_rgba(15,23,42,0.4)] hover:shadow-[0_12px_20px_-8px_rgba(15,23,42,0.6)] hover:-translate-y-0.5">
      + Add Project
    </button>
  </motion.div>
);
