import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
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
      animate={{ y: [0, -10, 0] }} 
      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      className="bg-white/80 backdrop-blur-xl border border-white shadow-xl rounded-2xl p-8 w-full max-w-md relative z-10"
    >
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="font-mono text-xs text-data mb-1">CERTIFICATE OF SKILL</div>
          <div className="font-serif text-2xl">Python Engineering</div>
        </div>
        <motion.div
          animate={demoStatus === 'CRYPTOGRAPHICALLY VERIFIED' ? { scale: [1.2, 1], rotate: [-10, 0] } : { scale: 1, rotate: 0 }}
          transition={{ duration: 0.3 }}
        >
          <BadgeIcon level="platinum" size={48} />
        </motion.div>
      </div>
      
      <div className="space-y-4 font-mono text-sm border-t border-structure pt-6">
        <div className="flex justify-between">
          <span className="text-data">CANDIDATE ID:</span>
          <span>SP-998234-A</span>
        </div>
        <div className="flex justify-between">
          <span className="text-data">VERIFIED SCORE:</span>
          <span className="text-xl font-serif text-verification tabular-nums">{demoScore} <span className="text-sm text-data">/ 100</span></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-data">STATUS:</span>
          <span className={`flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest ${demoStatus === 'EVALUATING...' ? 'text-amber-500' : 'text-verification'}`}>
            {demoStatus === 'EVALUATING...' ? (
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            ) : (
              <div className="w-2 h-2 rounded-full bg-verification"></div>
            )}
            {demoStatus}
          </span>
        </div>
      </div>
      
      <div className="mt-8 pt-4 border-t border-dashed border-structure text-xs text-data italic">
        AI feedback: "Candidate demonstrated exceptional problem-solving and clean code structure."
      </div>
    </motion.div>
  );
}

export function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });
  
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
    <div className="flex-1 flex flex-col relative">
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-verification origin-left z-[100]" 
        style={{ scaleX }} 
      />
      {/* Hero Section */}
      <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 border-b border-structure">
        {/* Copy Side */}
        <div className="p-8 md:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-structure">
          <div className="font-mono text-xs uppercase tracking-widest text-data mb-6">
            // The End of Resume Fiction
          </div>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.1] mb-8">
            Prove what you can do. <br/>
            Get the verified credentials.
          </h1>
          <p className="text-lg text-data mb-10 max-w-md">
            Resumes claim skills. SkillProof verifies them. Take live AI-observed assessments and earn undeniable, cryptographic proof of your abilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              to="/register" 
              className="bg-verification text-white px-8 py-4 text-center font-bold hover:scale-105 transition-all rounded-xl shadow-lg hover:shadow-xl"
            >
              Start Verification
            </Link>
            <Link 
              to="/login" 
              className="bg-transparent text-ink px-8 py-4 text-center font-medium border border-structure hover:bg-structure/30 transition-all rounded-xl hover:scale-105"
            >
              Recruiter Access
            </Link>
          </div>
        </div>

        {/* Visual Side */}
        <div className="bg-structure/30 p-8 md:p-16 flex items-center justify-center relative overflow-hidden">
          {/* Decorative Grid Lines */}
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(var(--color-structure) 1px, transparent 1px), linear-gradient(90deg, var(--color-structure) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.5 }}></div>
          
          <MiniDemoCertificate />
        </div>
      </section>

      {/* How it Works */}
      <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-structure">
        <div className="p-12">
          <div className="font-serif text-4xl mb-4 text-structure">01</div>
          <h3 className="font-serif text-2xl mb-4">Record</h3>
          <p className="text-data">
            Take live audio and coding assessments. We record your actual performance, not multiple-choice guesses.
          </p>
        </div>
        <div className="p-12">
          <div className="font-serif text-4xl mb-4 text-structure">02</div>
          <h3 className="font-serif text-2xl mb-4">AI Verifies</h3>
          <p className="text-data">
            Our AI engine evaluates your correctness, code quality, and communication clarity instantly.
          </p>
        </div>
        <div className="p-12">
          <div className="font-serif text-4xl mb-4 text-structure">03</div>
          <h3 className="font-serif text-2xl mb-4">Get Certified</h3>
          <p className="text-data">
            Earn a shareable, verifiable badge that proves your skills to any employer. No resume required.
          </p>
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
    </div>
  );
}
