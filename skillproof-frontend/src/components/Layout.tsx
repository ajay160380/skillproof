import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Logo } from './Logo';
import { BubbleMenu } from './BubbleMenu';
import { AIAssistantWidget } from './AIAssistantWidget';

export function Layout() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-vellum text-ink overflow-x-hidden">
      {/* Interactive Bubble Menu Header */}
      <BubbleMenu 
        className="mt-6 mx-6 top-6"
        position="sticky"
        menuBg="rgba(255, 255, 255, 0.5)"
        logo={
          <Link to={isAuthenticated ? (user?.role === 'recruiter' ? '/recruiter' : '/dashboard') : '/'} className="outline-none">
            <Logo />
          </Link>
        }
        items={
          isLoading ? [] :
          isAuthenticated ? [
            {
              label: 'Dashboard',
              href: user?.role === 'recruiter' ? '/recruiter' : '/dashboard',
              rotation: -5,
              hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' }
            },
            ...(user?.role === 'candidate' ? [{
              label: 'Jobs',
              href: '/jobs',
              rotation: 5,
              hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' }
            }] : []),
            ...(user?.role === 'recruiter' ? [{
              label: 'Job Listings',
              href: '/jobs/my-listings',
              rotation: 5,
              hoverStyles: { bgColor: '#f59e0b', textColor: '#ffffff' }
            }] : []),
            {
              label: 'Logout',
              href: '#',
              onClick: handleLogout,
              rotation: -5,
              hoverStyles: { bgColor: '#ef4444', textColor: '#ffffff' }
            }
          ] : [
            {
              label: 'Log In',
              href: '/login',
              rotation: -5,
              hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' }
            },
            {
              label: 'Get Verified',
              href: '/register',
              rotation: 5,
              hoverStyles: { bgColor: '#10b981', textColor: '#ffffff' }
            }
          ]
        }
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        <Outlet />
      </main>

      {isAuthenticated && <AIAssistantWidget />}

      {/* Expanded Structural Footer — only on public pages */}
      {!isAuthenticated && !isLoading && (
      <footer className="border-t border-structure bg-vellum">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 py-12 border-b border-structure">
          <div className="col-span-1 md:col-span-2">
            <Logo size="sm" className="mb-4" />
            <p className="font-mono text-xs text-data uppercase tracking-widest max-w-sm leading-relaxed">
              Cryptographically verified portfolios.<br/>
              The end of resume fiction.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 font-mono text-xs text-data uppercase tracking-widest">
            <h4 className="text-ink font-bold mb-2">Product</h4>
            <Link to="/#how-it-works" className="hover:text-verification hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink transition-all w-fit">How it Works</Link>
            <Link to="/#features" className="hover:text-verification hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink transition-all w-fit">Features</Link>
            <Link to="/#recruiters" className="hover:text-verification hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink transition-all w-fit">For Recruiters</Link>
            <Link to="/#faq" className="hover:text-verification hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink transition-all w-fit">FAQ</Link>
          </div>

          <div className="flex flex-col gap-3 font-mono text-xs text-data uppercase tracking-widest">
            <h4 className="text-ink font-bold mb-2">Connect</h4>
            <a href="mailto:hello@skillproof.app" className="hover:text-verification hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink transition-all w-fit">Contact Us</a>
            <a href="https://linkedin.com/company/skillproof" target="_blank" rel="noopener noreferrer" className="hover:text-verification hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink transition-all w-fit">LinkedIn</a>
            <a href="https://github.com/ajay160380" target="_blank" rel="noopener noreferrer" className="hover:text-verification hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink transition-all w-fit">GitHub</a>
          </div>
        </div>
        
        <div className="px-6 py-4 flex items-center justify-between font-mono text-[10px] text-data uppercase tracking-widest">
          <span>&copy; {new Date().getFullYear()} SkillProof</span>
          <span>Verified Portfolios</span>
        </div>
      </footer>
      )}
    </div>
  );
}
