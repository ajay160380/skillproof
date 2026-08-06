import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { useIntegrityMonitor } from '../../hooks/useIntegrityMonitor';
import { IntegrityNotice } from '../IntegrityNotice';

interface CodingTestProps {
  testId: string;
  testData?: any;
  onSubmit: (payload: any) => void;
}

export function CodingTest({ testData, onSubmit }: CodingTestProps) {
  const [code, setCode] = useState('# Write your solution here\n\n');
  const [submitting, setSubmitting] = useState(false);
  const [pasteCount, setPasteCount] = useState(0);
  const { tabSwitches, devtoolsDetected } = useIntegrityMonitor(true);

  const title = testData?.title || 'Coding Challenge';
  const statement = testData?.problem_statement || testData?.instructions || 'Solve the problem below.';
  const testCases = testData?.test_cases || [];

  // Removed hardcoded auto-submit logic. Relying entirely on Groq backend scoring.

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit({
      code_submission: code,
      keystroke_log: {
        paste_count: pasteCount,
        tab_switches: tabSwitches,
        devtools_detected: devtoolsDetected,
      }
    });
    setSubmitting(false);
  };

  const handleEditorDidMount = (editor: any) => {
    editor.onDidPaste(() => {
      setPasteCount(prev => prev + 1);
      toast('⚠️ Code Paste Detected! Copy-pasting is logged for AI proctoring audit.', {
        icon: '📋',
        style: { background: '#FFFBEB', color: '#D97706', border: '1px solid #F59E0B' }
      });
    });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row">
      <div className="w-full md:w-1/3 border-r border-structure/20 p-6 flex flex-col">
        <IntegrityNotice />
        {/* Proctoring Active Banner */}
        <div className="mb-4 p-3 bg-verification/10 border border-verification/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-verification animate-ping" />
            <span className="font-mono text-[10px] uppercase font-bold text-verification tracking-wider">
              AI Proctor Active
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-data">
            <span>Switches: <strong className={tabSwitches > 0 ? 'text-red-500' : ''}>{tabSwitches}</strong></span>
            <span>Pastes: <strong className={pasteCount > 0 ? 'text-amber-600' : ''}>{pasteCount}</strong></span>
          </div>
        </div>

        <h2 className="font-serif text-2xl mb-2">{title}</h2>
        {testData?.difficulty && (
          <span className={`inline-block w-fit font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full mb-4 ${
            testData.difficulty === 'easy' ? 'bg-verification/20 text-verification' :
            testData.difficulty === 'hard' ? 'bg-seal/20 text-seal' : 'bg-amber-100 text-amber-700'
          }`}>
            {testData.difficulty} • {testData.duration_minutes}min
          </span>
        )}
        <div className="font-mono text-sm text-data/80 leading-relaxed mb-6">
          <p>{statement}</p>
        </div>

        {testCases.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="font-mono text-[10px] text-data uppercase tracking-widest">Test Cases</div>
            {testCases.map((tc: any, i: number) => (
              <div key={i} className="bg-ink/5 border border-structure/20 rounded-md p-3 font-mono text-xs">
                <div><span className="text-data">Input:</span> {tc.input}</div>
                <div><span className="text-data">Expected:</span> {tc.expected_output}</div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-auto">
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-verification text-vellum py-4 font-mono text-xs uppercase tracking-widest hover:bg-verification/90 transition-colors rounded-md disabled:opacity-50 font-bold shadow-md"
          >
            {submitting ? 'Verifying Sandbox Execution...' : 'Submit for AI Verification'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-[#1E1E1E]">
        <Editor
          height="100%"
          defaultLanguage="python"
          theme="vs-dark"
          value={code}
          onChange={(val) => setCode(val || '')}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: 'IBM Plex Mono',
            padding: { top: 24 },
          }}
        />
      </div>
    </div>
  );
}
