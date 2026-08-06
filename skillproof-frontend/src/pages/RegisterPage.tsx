import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';

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
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-vellum border border-structure/30 rounded-md shadow-sm p-8">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl mb-2">Initialize Profile</h2>
          <p className="font-mono text-xs text-data uppercase tracking-widest">Create Identity Record</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`flex-1 py-3 border text-sm font-medium transition-colors ${
                role === 'candidate' 
                  ? 'border-verification text-verification bg-verification/5' 
                  : 'border-structure text-data hover:border-ink hover:text-ink'
              }`}
            >
              Candidate
            </button>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`flex-1 py-3 border border-l-0 text-sm font-medium transition-colors rounded-r-md ${
                role === 'recruiter' 
                  ? 'border-verification text-verification bg-verification/5' 
                  : 'border-structure text-data hover:border-ink hover:text-ink'
              }`}
            >
              Recruiter
            </button>
          </div>

          <div>
            <label className="block font-mono text-xs text-data uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Username</span>
              {usernameStatus.checking && <span className="text-[9px] text-amber-500 animate-pulse">Checking...</span>}
              {!usernameStatus.checking && username.length > 2 && usernameStatus.available && <span className="text-[9px] text-verification">Available</span>}
              {!usernameStatus.checking && username.length > 2 && usernameStatus.available === false && <span className="text-[9px] text-seal">Unavailable</span>}
            </label>
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => {
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
              className={`w-full bg-transparent border px-4 py-3 focus:outline-none transition-colors font-mono text-sm rounded-md ${errors.username ? 'border-seal focus:border-seal' : 'border-structure focus:border-ink'}`}
              placeholder="e.g. dev_ninja"
            />
            {errors.username && <p className="text-seal text-xs mt-2 font-mono">{errors.username}</p>}
          </div>

          <div>
            <label className="block font-mono text-xs text-data uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className={`w-full bg-transparent border px-4 py-3 focus:outline-none transition-colors font-mono text-sm rounded-md ${errors.email ? 'border-seal focus:border-seal' : 'border-structure focus:border-ink'}`}
              placeholder="user@example.com"
            />
            {errors.email && <p className="text-seal text-xs mt-2 font-mono">{errors.email}</p>}
          </div>
          <div>
            <label className="block font-mono text-xs text-data uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              className={`w-full bg-transparent border px-4 py-3 focus:outline-none transition-colors font-mono text-sm rounded-md ${errors.password ? 'border-seal focus:border-seal' : 'border-structure focus:border-ink'}`}
              placeholder="Minimum 8 characters"
            />
            {errors.password && <p className="text-seal text-xs mt-2 font-mono">{errors.password}</p>}
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-ink text-vellum py-4 font-medium hover:bg-verification transition-colors disabled:opacity-50 rounded-md shadow-md"
          >
            {loading ? 'Initializing...' : 'Register Profile'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-structure pt-6">
          <p className="text-sm text-data">
            Already verified? <Link to="/login" className="text-ink hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
