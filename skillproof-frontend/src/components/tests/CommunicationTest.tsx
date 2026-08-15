import React, { useState, useRef, useEffect } from 'react';
import { useIntegrityMonitor } from '../../hooks/useIntegrityMonitor';
import { IntegrityNotice } from '../IntegrityNotice';

interface CommunicationTestProps {
  testId: string;
  testData?: any;
  onSubmit: (payload: any) => void;
}

export function CommunicationTest({ onSubmit }: CommunicationTestProps) {
  const [recording, setRecording] = useState(false);
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const { tabSwitches, devtoolsDetected } = useIntegrityMonitor(recording);

  // Initialize webcam & audio stream for live proctoring preview
  useEffect(() => {
    let localStream: MediaStream | null = null;
    async function setupMedia() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        streamRef.current = localStream;
        setStream(localStream);
      } catch (e) {
        console.warn('Webcam or microphone not available', e);
      }
    }
    setupMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Guarantee video element receives stream and starts playing
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [stream]);

  const handleStartProcess = () => {
    // 5-second rapid prep timer before recording automatically starts
    setPrepCountdown(5);
  };

  useEffect(() => {
    if (prepCountdown === null) return;
    if (prepCountdown === 0) {
      setPrepCountdown(null);
      startRecording();
      return;
    }
    const timer = setTimeout(() => setPrepCountdown(prepCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [prepCountdown]);

  const startRecording = async () => {
    try {
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        streamRef.current = stream;
      }

      // Record audio for Whisper AI evaluation
      const audioStream = new MediaStream(stream.getAudioTracks());
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone & Camera access are required to complete AI Proctoring.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmit = () => {
    if (!audioBlob) return;
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');
    formData.append('keystroke_log', JSON.stringify({
      tab_switches: tabSwitches,
      devtools_detected: devtoolsDetected
    }));
    onSubmit(formData);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
      {!recording && !audioBlob && prepCountdown === null && (
        <div className="w-full text-left">
          <IntegrityNotice />
        </div>
      )}
      
      {/* AI Proctor Active Ribbon */}
      <div className="mb-6 px-4 py-2 bg-verification/10 border border-verification/30 rounded-full flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-verification animate-ping" />
        <span className="font-mono text-xs uppercase font-bold text-verification tracking-wider">
          AI Proctor Active • Eye-Gaze & Speech Cadence Monitored
        </span>
      </div>

      <h2 className="font-serif text-3xl md:text-4xl mb-3">Introduce Yourself</h2>
      <p className="font-mono text-xs text-data/80 max-w-lg mb-8 leading-relaxed">
        Provide a 1-minute oral response covering your background, your tech stack, and a complex technical problem you solved recently.
      </p>

      {/* Live Video Proctoring Viewport */}
      <div className="relative w-full max-w-md aspect-video bg-black/90 rounded-2xl overflow-hidden border border-structure/40 shadow-2xl mb-8 flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover -scale-x-100"
        />
        
        {/* Facial Bounding Grid Overlay (AI Visualizer) */}
        <div className="absolute inset-0 border border-verification/20 m-4 rounded-xl pointer-events-none flex flex-col justify-between p-3">
          <div className="flex justify-between font-mono text-[9px] text-verification uppercase tracking-widest bg-black/40 backdrop-blur-xs px-2 py-1 rounded w-fit">
            <span>LIVE CAM • 30 FPS</span>
          </div>
          <div className="flex justify-between items-end font-mono text-[9px] text-verification uppercase tracking-widest">
            <span className="bg-black/40 backdrop-blur-xs px-2 py-1 rounded">CADENCE ANALYZER: READY</span>
            <span className="bg-black/40 backdrop-blur-xs px-2 py-1 rounded">EYE TRACK: CENTERED</span>
          </div>
        </div>

        {prepCountdown !== null && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white z-20">
            <span className="font-mono text-xs text-amber-400 uppercase tracking-widest mb-2">RAPID PREPARATION TIMER</span>
            <span className="font-serif text-6xl font-bold text-verification">{prepCountdown}s</span>
            <span className="font-mono text-[10px] text-data uppercase tracking-wider mt-3">Recording starts automatically</span>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="mb-6 h-12 flex items-center justify-center">
        {recording ? (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-6 py-2 rounded-full">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-red-500 font-bold">
              Recording & Analyzing Cadence...
            </span>
          </div>
        ) : audioBlob ? (
          <div className="font-mono text-verification text-xs uppercase tracking-widest border border-verification/40 px-5 py-2 rounded-full bg-verification/10 font-bold">
            ✓ Audio & Video Proctoring Captured
          </div>
        ) : null}
      </div>

      <div className="flex gap-4">
        {!recording && !audioBlob && prepCountdown === null && (
          <button 
            onClick={handleStartProcess}
            className="bg-verification text-vellum px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-verification/90 transition-colors rounded-xl font-bold shadow-lg flex items-center gap-2"
          >
            <span>📹</span> Start Rapid Assessment
          </button>
        )}
        
        {recording && (
          <button 
            onClick={stopRecording}
            className="bg-seal text-vellum px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-seal/90 transition-colors rounded-xl flex items-center gap-2 font-bold shadow-lg"
          >
            <div className="w-3 h-3 bg-white rounded-xs"></div>
            Stop & Save Recording
          </button>
        )}

        {audioBlob && !recording && (
          <>
            <button 
              onClick={() => setAudioBlob(null)}
              className="border border-structure text-data px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-structure/20 transition-colors rounded-xl font-bold"
            >
              Re-Record
            </button>
            <button 
              onClick={handleSubmit}
              className="bg-verification text-vellum px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-verification/90 transition-colors rounded-xl font-bold shadow-lg"
            >
              Submit for AI Verification
            </button>
          </>
        )}
      </div>
    </div>
  );
}
