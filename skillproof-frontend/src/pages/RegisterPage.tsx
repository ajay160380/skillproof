import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const FloatingLabelInput = ({ label, type, value, onChange, error, placeholder, rightElement }: any) => {
  const [focused, setFocused] = useState(false);
  const isFloating = focused || value.length > 0;

  return (
    <div className="relative mb-6">
      <div className="flex justify-between items-center absolute w-full top-0 left-0 px-4 -translate-y-1/2 pointer-events-none z-10">
        <motion.label
          initial={false}
          animate={{
            y: isFloating ? -12 : 30,
            scale: isFloating ? 0.8 : 1,
            color: error ? 'var(--color-seal)' : isFloating ? 'var(--color-ink)' : 'var(--color-data)'
          }}
          className="font-mono text-xs uppercase tracking-wider origin-left bg-white px-1"
        >
          {label}
        </motion.label>
        {rightElement && (
          <div className="bg-white px-1 mt-6">
            {rightElement}
          </div>
        )}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full bg-transparent border px-4 py-3 focus:outline-none transition-colors font-mono text-sm rounded-xl ${
          error ? 'border-seal focus:border-seal' : 'border-structure focus:border-ink'
        }`}
        placeholder={focused ? placeholder : ''}
      />
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-seal text-xs mt-2 font-mono absolute -bottom-5"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{checking: boolean; available?: boolean; error?: string}>({ checking: false });
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({});
  const navigate = useNavigate();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (usernameStatus.available === false && usernameStatus.error) {
      newErrors.username = usernameStatus.error;
    } else if (usernameStatus.available === false) {
      newErrors.username = 'Username is already taken';
    }
    
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      await api.post('/auth/register/', { username: username.trim(), email: email.trim(), password, role });
      toast.success('Registration successful. Please log in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex-1 flex min-h-screen bg-mesh flex-row-reverse"
    >
      {/* Right side: Form (on desktop it's right, mobile it's full) */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="w-full max-w-md glass-panel rounded-3xl p-10"
        >
          <div className="mb-10 text-center">
            <h2 className="font-serif text-4xl mb-2">Initialize Profile</h2>
            <p className="font-mono text-xs text-data uppercase tracking-widest">Create Identity Record</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex p-1 bg-structure/30 rounded-xl mb-8 relative">
              <motion.div 
                className="absolute inset-y-1 rounded-lg bg-white shadow-sm"
                initial={false}
                animate={{
                  left: role === 'candidate' ? '4px' : '50%',
                  width: 'calc(50% - 4px)'
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative z-10 ${
                  role === 'candidate' ? 'text-ink' : 'text-data hover:text-ink'
                }`}
              >
                Candidate
              </button>
              <button
                type="button"
                onClick={() => setRole('recruiter')}
                className={`flex-1 py-3 text-sm font-medium transition-colors relative z-10 ${
                  role === 'recruiter' ? 'text-ink' : 'text-data hover:text-ink'
                }`}
              >
                Recruiter
              </button>
            </div>

            <FloatingLabelInput
              label="Username"
              type="text"
              value={username}
              onChange={(e: any) => {
                const val = e.target.value.replace(/\s+/g, '');
                setUsername(val);
                if (errors.username) setErrors({ ...errors, username: undefined });
                
                if (val.length >= 3) {
                  setUsernameStatus({ checking: true });
                  const checkTimeout = setTimeout(() => {
                    api.get(`/auth/check-username/?username=${val}`)
                      .then(res => {
                         setUsernameStatus({ checking: false, available: res.data.available, error: res.data.error });
                      })
                      .catch(() => setUsernameStatus({ checking: false }));
                  }, 500);
                  return () => clearTimeout(checkTimeout);
                } else {
                  setUsernameStatus({ checking: false });
                }
              }}
              error={errors.username}
              placeholder="e.g. dev_ninja"
              rightElement={
                usernameStatus.checking ? <span className="text-[9px] text-amber-500 animate-pulse">Checking...</span> :
                !usernameStatus.checking && username.length > 2 && usernameStatus.available ? <span className="text-[9px] text-verification">Available</span> :
                !usernameStatus.checking && username.length > 2 && usernameStatus.available === false ? <span className="text-[9px] text-seal">Unavailable</span> : null
              }
            />

            <FloatingLabelInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e: any) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              placeholder="user@example.com"
            />
            
            <FloatingLabelInput
              label="Password"
              type="password"
              value={password}
              onChange={(e: any) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              placeholder="Minimum 8 characters"
            />
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className="w-full bg-ink text-vellum py-4 mt-8 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 rounded-xl shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Initializing...
                </span>
              ) : 'Register Profile'}
            </motion.button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-data">
              Already verified? <Link to="/login" className="text-ink font-medium hover:underline decoration-verification underline-offset-4">Log in</Link>
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Left side: Visuals (hidden on small screens) */}
      <div className="hidden lg:flex flex-1 relative bg-brand-primary items-center justify-center overflow-hidden rounded-r-[3rem] my-4 ml-4 shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.4)_0%,transparent_50%)]"></div>
          <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_80%,rgba(15,23,42,0.4)_0%,transparent_50%)]"></div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div className="z-10 text-center p-12 text-white">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="inline-flex gap-2">
              {[0,1,2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ height: [20, 60, 20] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  className="w-2 bg-white/50 rounded-full"
                />
              ))}
            </div>
          </motion.div>
          <h3 className="font-serif text-4xl mb-6 leading-tight">Leave resumes<br/>in the past.</h3>
          <p className="text-white/80 text-lg max-w-sm mx-auto font-light">Join the new standard of hiring. Prove your skills and get hired based on what you can actually do.</p>
        </div>
      </div>
    </motion.div>
  );
}
