import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (email.length === 0) {
      newErrors.email = 'Please enter your username or email address';
    }
    if (password.length === 0) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const response = await api.post('/auth/login/', { email: email.trim(), password });
      
      // Fetch user profile
      localStorage.setItem('access_token', response.data.access);
      const userRes = await api.get('/auth/me/', {
        headers: { Authorization: `Bearer ${response.data.access}` }
      });
      
      login(userRes.data, response.data.access, response.data.refresh);
      toast.success('Access Granted');
      
      if (userRes.data.role === 'recruiter') {
        navigate('/recruiter');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-vellum border border-structure/30 rounded-md shadow-sm p-8">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl mb-2">Access Portal</h2>
          <p className="font-mono text-xs text-data uppercase tracking-widest">Identify Yourself</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-mono text-xs text-data uppercase tracking-wider mb-2">Username or Email</label>
            <input 
              type="text" 
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              className={`w-full bg-transparent border px-4 py-3 focus:outline-none transition-colors font-mono text-sm rounded-md ${errors.email ? 'border-seal focus:border-seal' : 'border-structure focus:border-ink'}`}
              placeholder="username or candidate@example.com"
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
              placeholder="••••••••"
            />
            {errors.password && <p className="text-seal text-xs mt-2 font-mono">{errors.password}</p>}
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-ink text-vellum py-4 font-medium hover:bg-verification transition-colors disabled:opacity-50 rounded-md shadow-md"
          >
            {loading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-structure pt-6">
          <p className="text-sm text-data">
            Unverified? <Link to="/register" className="text-ink hover:underline">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
