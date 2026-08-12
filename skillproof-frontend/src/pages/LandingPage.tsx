import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BadgeIcon } from '../components/BadgeIcon';
import { TrustBar } from '../components/landing/TrustBar';
import { FeaturesGrid } from '../components/landing/FeaturesGrid';
import { RecruiterSection } from '../components/landing/RecruiterSection';
import { ScoringExplanation } from '../components/landing/ScoringExplanation';
import { Testimonials } from '../components/landing/Testimonials';
import { FAQ } from '../components/landing/FAQ';
import { AboutSection } from '../components/landing/AboutSection';
import { FinalCTA } from '../components/landing/FinalCTA';

function MiniDemoCertificate() {
  const [demoScore, setDemoScore] = useState(0);
  const [demoStatus, setDemoStatus] = useState('EVALUATING...');
  
  useEffect(() => {
    let active = true;
    const loop = async () => {
      while (active) {
        setDemoStatus('EVALUATING...');
        setDemoScore(0);
        await new Promise(r => setTimeout(r, 1000));
        
        // Count up
        for (let i = 0; i <= 92; i += 4) {
          if (!active) return;
          setDemoScore(i);
          await new Promise(r => setTimeout(r, 30));
        }
        setDemoScore(92);
        setDemoStatus('CRYPTOGRAPHICALLY VERIFIED');
        
        await new Promise(r => setTimeout(r, 4000)); // Hold
      }
    };
    loop();
    return () => { active = false; };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, translateY: [-5, 5, -5] }} 
      transition={{ 
        translateY: { repeat: Infinity, duration: 6, ease: "easeInOut" },
        opacity: { duration: 0.8 },
        y: { duration: 0.8 }
      }}
      className="glass-panel rounded-3xl p-8 w-full max-w-md relative z-10"
    >
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-[10px] text-data mb-2 tracking-widest">CERTIFICATE OF SKILL</div>
          <div className="font-serif text-3xl font-medium text-ink">Python Engineering</div>
        </div>
        <motion.div
          animate={demoStatus === 'CRYPTOGRAPHICALLY VERIFIED' ? { scale: [1.3, 1], rotate: [-15, 0] } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <BadgeIcon level="platinum" size={56} />
        </motion.div>
      </div>
      
      <div className="space-y-4 font-mono text-sm border-t border-structure pt-6">
        <div className="flex justify-between items-center">
          <span className="text-data text-xs">CANDIDATE ID</span>
          <span className="bg-structure/50 px-2 py-1 rounded text-xs">SP-998234-A</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-data text-xs">VERIFIED SCORE</span>
          <span className="text-2xl font-serif text-verification tabular-nums flex items-baseline gap-1">
            {demoScore} <span className="text-xs text-data font-sans">/ 100</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-data text-xs">STATUS</span>
          <span className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest ${demoStatus === 'EVALUATING...' ? 'text-amber-500' : 'text-verification'}`}>
            {demoStatus === 'EVALUATING...' ? (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse block"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-verification block"></span>
            )}
            {demoStatus}
          </span>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-dashed border-structure text-xs text-data italic bg-white/40 p-4 rounded-xl">
        <span className="font-semibold not-italic block mb-1">AI Feedback:</span>
        "Candidate demonstrated exceptional problem-solving and clean code structure."
      </div>
    </motion.div>
  );
}

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'recruiter') {
        navigate('/recruiter', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex-1 flex flex-col relative bg-mesh"
    >
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--color-structure) 1px, transparent 1px), linear-gradient(90deg, var(--color-structure) 1px, transparent 1px)', backgroundSize: '60px 60px', opacity: 0.3 }}></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10 pt-20 lg:pt-0">
          
          {/* Copy Side */}
          <motion.div 
            style={{ y, opacity }}
            className="flex flex-col justify-center"
          >
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 border border-structure w-fit mb-6 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-verification animate-pulse"></span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-data">
                The End of Resume Fiction
              </span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="font-serif text-6xl md:text-8xl leading-[1.05] mb-8 text-ink"
            >
              Prove what <br/>
              you can do.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-data mb-10 max-w-xl leading-relaxed"
            >
              Resumes claim skills. SkillProof verifies them. Take live AI-observed assessments and earn undeniable, cryptographic proof of your abilities.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link 
                to="/register" 
                className="bg-ink text-white px-8 py-4 rounded-xl text-center font-medium hover:bg-gray-800 transition-all shadow-[0_0_40px_rgba(15,23,42,0.2)] hover:shadow-[0_0_60px_rgba(15,23,42,0.4)] hover:-translate-y-1"
              >
                Start Verification
              </Link>
              <Link 
                to="/login" 
                className="glass-button text-ink px-8 py-4 rounded-xl text-center font-medium"
              >
                Recruiter Access
              </Link>
            </motion.div>
          </motion.div>

          {/* Visual Side */}
          <div className="flex items-center justify-center relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-brand-primary/20 via-brand-secondary/20 to-brand-tertiary/20 blur-[100px] -z-10 rounded-full"></div>
            <MiniDemoCertificate />
          </div>

        </div>
      </section>

      {/* How it Works - Staggered Cards */}
      <section className="py-24 bg-white/50 backdrop-blur-sm border-y border-structure relative z-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl mb-4">How it works</h2>
            <p className="text-data text-lg max-w-2xl mx-auto">Three simple steps to replace your resume with verified proof.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Record', desc: 'Take live audio and coding assessments. We record your actual performance.' },
              { num: '02', title: 'AI Verifies', desc: 'Our engine evaluates your correctness, code quality, and communication instantly.' },
              { num: '03', title: 'Get Certified', desc: 'Earn a shareable badge that proves your skills to any employer.' }
            ].map((step, idx) => (
              <motion.div 
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: idx * 0.2, duration: 0.6 }}
                className="glass-panel p-10 rounded-3xl hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="font-serif text-5xl mb-6 text-brand-primary/40">{step.num}</div>
                <h3 className="font-serif text-2xl mb-4">{step.title}</h3>
                <p className="text-data leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <TrustBar />
      <FeaturesGrid />
      <RecruiterSection />
      <ScoringExplanation />
      <Testimonials />
      <FAQ />
      <AboutSection />
      <FinalCTA />
    </motion.div>
  );
}
