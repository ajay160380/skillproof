import React from 'react';
import { motion } from 'framer-motion';

export const itemVariants: any = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export const ActivityStreakWidget = ({ attempts = [] }: { attempts?: any[] }) => {
  const currentStreak = attempts.length > 0 ? 3 : 0; // Simplified for now
  const passed = attempts.filter((a: any) => a.score && a.score.overall_score >= 70).length;
  
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h4 className="font-serif text-sm font-bold text-ink">Activity Streak</h4>
          <p className="font-mono text-[9px] text-data uppercase tracking-widest mt-1">Consistency Tracker</p>
        </div>
        <span className="text-2xl opacity-50">🔥</span>
      </div>
      
      <div className="flex items-end gap-4 mb-6">
        <div className="text-5xl font-serif font-bold text-ink leading-none">{currentStreak}</div>
        <div className="pb-1 font-mono text-[10px] text-data uppercase tracking-widest">Day Streak</div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest text-data mb-2">
            <span>Tests Passed</span>
            <span>{passed} Total</span>
          </div>
          <div className="w-full bg-structure/20 h-1.5 rounded-full overflow-hidden flex">
             <div className="bg-verification h-1.5 rounded-full transition-all" style={{ width: `${Math.min(passed * 10, 100)}%` }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const RecentJobMatchesWidget = ({ jobs = [] }: { jobs?: any[] }) => (
  <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h4 className="font-serif text-sm font-bold text-ink">Recent Matches</h4>
        <p className="font-mono text-[9px] text-data uppercase tracking-widest mt-1">High fit jobs</p>
      </div>
      <span className="text-2xl opacity-50">💼</span>
    </div>
    <div className="space-y-3 mt-6">
      {jobs.length > 0 ? jobs.slice(0, 3).map((job, i) => (
        <a href={`/jobs/${job.id}`} key={i} className="flex justify-between items-center group cursor-pointer border-b border-structure/10 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
          <div>
            <span className="font-serif text-sm font-bold text-ink group-hover:text-verification transition-colors block">{job.title}</span>
            <span className="font-mono text-[10px] text-data mt-1 block">{job.company_name}</span>
          </div>
          <span className="text-xs group-hover:translate-x-1 transition-transform">→</span>
        </a>
      )) : (
        <div className="text-center py-6 bg-structure/5 rounded-xl border border-dashed border-structure/20">
          <p className="font-mono text-[10px] text-data uppercase tracking-widest">No matching jobs yet.</p>
        </div>
      )}
    </div>
  </motion.div>
);

export const UpcomingInterviewsWidget = ({ invites = [] }: { invites?: any[] }) => (
  <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
    <div className="flex justify-between items-start mb-6">
      <div>
        <h4 className="font-serif text-sm font-bold text-ink">Upcoming Interviews</h4>
        <p className="font-mono text-[9px] text-data uppercase tracking-widest mt-1">Invites from recruiters</p>
      </div>
      <span className="text-2xl opacity-50">🗓️</span>
    </div>
    <div className="flex-1 flex flex-col justify-center gap-3">
      {invites.length > 0 ? (
        invites.slice(0, 2).map((invite, i) => (
          <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-xl border border-structure/20 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-ink text-white flex flex-col items-center justify-center leading-none">
              <span className="font-mono text-[8px] uppercase tracking-widest opacity-70">
                {invite.proposed_time ? new Date(invite.proposed_time).toLocaleDateString(undefined, { month: 'short' }) : 'Day'}
              </span>
              <span className="font-serif font-bold text-sm">
                {invite.proposed_time ? new Date(invite.proposed_time).getDate() : '--'}
              </span>
            </div>
            <div>
              <div className="font-serif font-bold text-sm text-ink">{invite.recruiter_company || 'Tech Company'}</div>
              <div className="font-mono text-[9px] text-data uppercase tracking-widest mt-0.5">Status: {invite.status || 'Pending'}</div>
            </div>
          </div>
        ))
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-structure/5 rounded-xl border border-dashed border-structure/20 text-center">
          <p className="text-xs font-serif text-data mb-2">No interviews scheduled yet.</p>
        </div>
      )}
    </div>
  </motion.div>
);

export const PortfolioWidget = ({ projects = [] }: { projects?: any[] }) => (
  <motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all h-full flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h4 className="font-serif text-sm font-bold text-ink">Portfolio</h4>
        <p className="font-mono text-[9px] text-data uppercase tracking-widest mt-1">Showcase your work</p>
      </div>
      <span className="text-2xl opacity-50">🌐</span>
    </div>
    <div className="mb-6 flex-1 overflow-y-auto">
      {projects.length > 0 ? (
        <ul className="space-y-3">
          {projects.slice(0, 3).map((p, i) => (
             <li key={i} className="text-sm font-serif font-bold text-ink border-b border-structure/10 pb-2 last:border-0">{p.title}</li>
          ))}
        </ul>
      ) : (
        <div className="h-full flex items-center justify-center text-center p-4">
          <p className="text-xs font-serif text-data">No projects added yet.</p>
        </div>
      )}
    </div>
    <button className="w-full py-3 bg-ink text-vellum rounded-xl font-mono text-[10px] uppercase font-bold hover:bg-ink/90 transition-colors mt-auto shadow-sm">
      + Add Project
    </button>
  </motion.div>
);
