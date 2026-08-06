import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CodingTest } from '../components/tests/CodingTest';
import { CommunicationTest } from '../components/tests/CommunicationTest';
import { PracticalTest } from '../components/tests/PracticalTest';
import { Loader } from '../components/Loader';
import toast from 'react-hot-toast';

export function TestScreen() {
  const { id } = useParams<{ id: string }>();
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // Anti-Cheat state
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const tabSwitchesRef = useRef(0);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          tabSwitchesRef.current = newCount;
          toast.error(`Warning: Tab switching is not allowed. Violation ${newCount}/3`);
          if (newCount >= 3) {
            toast.error('Test will be auto-submitted due to multiple tab switches.');
            // In a real scenario, we might force submit here. For now, just flag it heavily.
          }
          return newCount;
        });
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    async function fetchAttempt() {
      try {
        const res = await api.get(`/assessments/${id}/`);
        if (res.data.status === 'completed' || res.data.status === 'processing' || res.data.status === 'failed') {
          navigate(`/score/${id}`);
          return;
        }
        setAttempt(res.data);
      } catch (err: any) {
        console.error('Failed to load test:', err);
        toast.error('Failed to load test session');
      } finally {
        setLoading(false);
      }
    }
    fetchAttempt();
  }, [id, navigate]);

  const handleSubmit = async (payload: any) => {
    setSubmitting(true);
    let retries = 3;
    let success = false;
    
    // Inject cheating flags
    let finalPayload = payload;
    if (payload instanceof FormData) {
      payload.append('cheating_flags', JSON.stringify({
        tab_switches: tabSwitchesRef.current,
        copy_paste_attempts: copyPasteAttempts
      }));
    } else {
      finalPayload = {
        ...payload,
        cheating_flags: {
          tab_switches: tabSwitchesRef.current,
          copy_paste_attempts: copyPasteAttempts
        }
      };
    }
    
    while (retries > 0 && !success) {
      try {
        const testType = attempt?.test?.test_type;
        const config = { timeout: 90000 };
        
        if (testType === 'communication') {
          await api.post(`/assessments/${id}/submit/`, finalPayload, {
            ...config,
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await api.post(`/assessments/${id}/submit/`, finalPayload, config);
        }
        
        success = true;
        navigate(`/score/${id}`);
      } catch (err: any) {
        retries -= 1;
        console.error(`Submit failed. Retries left: ${retries}`, err);
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
           toast.error('Failed to submit test');
           break;
        }
        if (retries === 0) {
          toast.error('Failed to submit test. Network error or server unreachable.');
        } else {
          await new Promise(res => setTimeout(res, 3000));
        }
      }
    }
    setSubmitting(false);
  };

  const handleAntiCheatAction = (e: React.ClipboardEvent | React.MouseEvent, action: string) => {
    e.preventDefault();
    setCopyPasteAttempts(prev => prev + 1);
    toast.error(`${action} is disabled during assessment.`);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center">
        <Loader text="Initializing Secure Environment..." size="lg" />
      </div>
    );
  }

  if (!attempt || !attempt.test) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="border border-seal/30 rounded-lg p-8 max-w-md text-center">
          <div className="font-serif text-2xl mb-3">Session Not Found</div>
          <p className="font-mono text-xs text-data mb-6">This test session does not exist or you do not have access to it.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-3 bg-ink text-vellum font-mono text-xs uppercase tracking-widest hover:bg-verification transition-colors rounded-md">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const testType = attempt.test.test_type;

  return (
    <div className="flex-1 flex flex-col bg-ink text-vellum">
      <header className="px-6 py-4 border-b border-structure/20 flex justify-between items-center">
        <div className="font-mono text-xs uppercase tracking-widest text-data">
          Active Session: <span className="text-vellum">{attempt.test.title}</span>
        </div>
        <div className="font-mono text-[10px] uppercase text-verification flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-verification animate-pulse"></div>
          Recording & Proctoring Active
        </div>
      </header>

      <div 
        className="flex-1 flex flex-col relative"
        onCopy={(e) => handleAntiCheatAction(e, 'Copying')}
        onPaste={(e) => handleAntiCheatAction(e, 'Pasting')}
        onCut={(e) => handleAntiCheatAction(e, 'Cutting')}
        onContextMenu={(e) => handleAntiCheatAction(e, 'Right-click')}
      >
        {submitting && (
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
            <Loader text="Submitting securely, this may take a moment..." size="lg" />
          </div>
        )}
        {testType === 'coding' ? (
          <CodingTest testId={id!} testData={attempt.test} onSubmit={handleSubmit} />
        ) : testType === 'practical' ? (
          <PracticalTest testId={id!} testData={attempt.test} onSubmit={handleSubmit} />
        ) : (
          <CommunicationTest testId={id!} testData={attempt.test} onSubmit={handleSubmit} />
        )}
      </div>
    </div>
  );
}
