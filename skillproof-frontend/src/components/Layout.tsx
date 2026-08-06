import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Logo } from './Logo';

export function Layout() {
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-vellum text-ink overflow-x-hidden">
      {/* Structural Header */}
      <header className="border border-structure/30 px-6 py-4 mx-4 mt-4 rounded-2xl flex items-center justify-between bg-white/70 backdrop-blur-2xl shadow-sm z-50 sticky top-4 transition-all duration-300">
        <Link to={isAuthenticated ? (user?.role === 'recruiter' ? '/recruiter' : '/dashboard') : '/'} className="outline-none">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          {isLoading ? (
            <div className="w-20 h-6 animate-pulse bg-structure/20 rounded" />
          ) : isAuthenticated ? (
            <>
              <Link 
                to={user?.role === 'recruiter' ? '/recruiter' : '/dashboard'} 
                className="hover:text-verification transition-colors"
              >
                Dashboard
              </Link>
              {user?.role === 'candidate' && (
                <Link 
                  to="/jobs" 
                  className="hover:text-verification transition-colors"
                >
                  Jobs
                </Link>
              )}
              {user?.role === 'recruiter' && (
                <Link 
                  to="/jobs/my-listings" 
                  className="hover:text-verification transition-colors"
                >
                  Job Listings
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="font-mono text-xs uppercase tracking-widest text-data hover:text-ink transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-verification transition-colors">Log In</Link>
              <Link 
                to="/register" 
                className="bg-verification text-white px-5 py-2 rounded-lg font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all"
              >
                Get Verified
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

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
