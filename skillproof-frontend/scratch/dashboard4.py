import re

filepath = 'src/pages/CandidateDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

profile_tab = """        {/* Profile Tab */}
        {activeTab === 'Profile' && (
          <div className="max-w-5xl mx-auto px-8 py-10 space-y-8">
            <h2 className="font-serif text-2xl font-bold text-ink">Your Profile</h2>
            <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-32 bg-ink relative">
                 <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)`
                 }} />
              </div>
              <div className="px-8 pb-8 relative">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-structure/10 flex items-center justify-center text-4xl shadow-md -mt-12 mb-4 overflow-hidden relative z-10 bg-white">
                   {profile?.avatar_url ? (
                     <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-ink font-serif font-bold text-2xl">{user?.username?.[0]?.toUpperCase() || 'U'}</span>
                   )}
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-ink">{profile?.full_name || user?.username || 'Candidate'}</h3>
                    <p className="font-mono text-[10px] text-data uppercase tracking-widest mt-1">{profile?.company_name || 'Verified Professional'}</p>
                  </div>
                  <button className="bg-white border border-structure/20 px-4 py-2 rounded-lg font-mono text-[10px] uppercase font-bold text-ink hover:bg-structure/5 transition-colors shadow-sm">
                    Edit Profile
                  </button>
                </div>
                <div className="mt-6 pt-6 border-t border-structure/10">
                  <h4 className="font-serif text-sm font-bold text-ink mb-2">About</h4>
                  <p className="text-sm text-ink/70 leading-relaxed font-serif">
                    {profile?.bio || 'No bio added yet. Tell recruiters about yourself, your goals, and what you are building.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl border border-structure/30 rounded-2xl p-8 shadow-sm">
              <h3 className="font-serif text-lg font-bold text-ink mb-4">Verified Skills</h3>
              <div className="flex flex-wrap gap-2">
                {allBadges.length > 0 ? allBadges.map((badge, i) => (
                  <div key={i} className="flex items-center gap-2 bg-verification/10 border border-verification/20 px-3 py-1.5 rounded-full">
                    <span className="text-verification text-sm">✓</span>
                    <span className="font-mono text-[10px] text-ink uppercase tracking-widest font-bold">{badge.skill_category?.name || 'Skill'}</span>
                  </div>
                )) : (
                  <p className="font-mono text-[10px] text-data uppercase tracking-widest">No verified skills yet. Take assessments to earn badges.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}"""

content = content.replace("{/* Settings Tab */}", profile_tab)

with open(filepath, 'w') as f:
    f.write(content)

print("Profile tab added.")
