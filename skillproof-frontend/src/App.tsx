import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { RecruiterDashboard } from './pages/RecruiterDashboard';
import { PublicProfile } from './pages/PublicProfile';
import { TestScreen } from './pages/TestScreen';
import { ScoreReveal } from './pages/ScoreReveal';
import { NotFound } from './pages/NotFound';
import { JobsBrowser } from './pages/JobsBrowser';
import { JobDetail } from './pages/JobDetail';
import { PostJob } from './pages/PostJob';
import { RecruiterJobs } from './pages/RecruiterJobs';
import { FollowersList } from './pages/FollowersList';
import { VerifyCertificate } from './pages/VerifyCertificate';
import { ProtectedRoute } from './components/ProtectedRoute';

import { useAuthStore } from './store/authStore';
import { api } from './services/api';

function ScrollToHash() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) {
      setTimeout(() => {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50); // slight delay to ensure rendering is done if navigating from another page
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash, pathname]);

  return null;
}

function App() {
  const { setUser, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      api.get('/auth/me/')
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          // Only log out if explicitly unauthenticated (401)
          if (err.response?.status === 401) {
            logout();
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [setUser, setLoading, logout]);

  return (
    <>
      <ScrollToHash />
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            background: 'var(--color-ink)',
            color: 'var(--color-vellum)',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            borderRadius: '6px', // match rounded-md
            border: '1px solid var(--color-structure)',
          },
        }} 
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="verify/:id?" element={<VerifyCertificate />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<CandidateDashboard />} />
            <Route path="recruiter" element={<RecruiterDashboard />} />
            <Route path="test/:id" element={<TestScreen />} />
            <Route path="jobs/post" element={<PostJob />} />
            <Route path="jobs/my-listings" element={<RecruiterJobs />} />
            <Route path="followers" element={<FollowersList />} />
          </Route>

          <Route path="profile/:id" element={<PublicProfile />} />
          <Route path="score/:id" element={<ScoreReveal />} />
          <Route path="jobs" element={<JobsBrowser />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
