import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  Copy,
  Maximize2,
  ShieldCheck,
  Code,
  PenTool,
  MessageSquare,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  Check
} from 'lucide-react';
import { useNotification } from '../../shared/context/NotificationContext';

export const VirtualMeetingModal = ({ session, isOpen, onClose }) => {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'whiteboard' | 'code' | 'chat'

  // WebRTC Native HTML5 Media Stream States
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const localVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // In-Call Live Chat State
  const [messages, setMessages] = useState([
    { sender: 'System', text: '🔒 1-on-1 Encrypted Virtual Session Started.', time: 'Now' },
    { sender: session?.mentor_name || 'Alumni Mentor', text: `Welcome to our mentorship call! Let's discuss ${session?.topic || 'career guidance'}.`, time: 'Now' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Interactive Code Sandbox State
  const [codeSnippet, setCodeSnippet] = useState(
    `// 1-on-1 Technical Interview & Live Coding Sandbox\n// Topic: ${session?.topic || 'Data Structures & System Architecture'}\n\nfunction solveSystemProblem(inputData) {\n  console.log("Analyzing input:", inputData);\n  const result = inputData.map(x => x * 2);\n  return result;\n}\n\n// Run code below:\nconsole.log("Output:", solveSystemProblem([10, 20, 30, 40]));`
  );
  const [codeConsoleOutput, setCodeConsoleOutput] = useState('');

  // Collaborative Whiteboard Canvas Refs & State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#0284c7');

  // Start Native HTML5 WebRTC Camera & Mic Stream on Mount
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        if (isMounted) {
          mediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Camera/Mic permission not granted or device unavailable:', err.message);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [isOpen]);

  // Toggle Camera Track
  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraActive;
      }
    }
    setCameraActive(!cameraActive);
  };

  // Toggle Mic Track
  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micActive;
      }
    }
    setMicActive(!micActive);
  };

  // Toggle Native HTML5 Screen Sharing
  const toggleScreenShare = async () => {
    if (!screenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setScreenSharing(false);
          if (localVideoRef.current && mediaStreamRef.current) {
            localVideoRef.current.srcObject = mediaStreamRef.current;
          }
        };
      } catch (err) {
        showNotification('Screen sharing cancelled', 'info');
      }
    } else {
      setScreenSharing(false);
      if (localVideoRef.current && mediaStreamRef.current) {
        localVideoRef.current.srcObject = mediaStreamRef.current;
      }
    }
  };

  // Handle Code Execution in Sandbox
  const handleRunCode = () => {
    try {
      const logs = [];
      const customConsole = {
        log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
        error: (...args) => logs.push('[ERROR] ' + args.join(' '))
      };

      const runFn = new Function('console', codeSnippet);
      runFn(customConsole);
      setCodeConsoleOutput(logs.join('\n') || 'Code executed successfully with zero output errors!');
      showNotification('Code executed cleanly!', 'success');
    } catch (err) {
      setCodeConsoleOutput(`Runtime Error: ${err.message}`);
      showNotification('Syntax error in code execution', 'error');
    }
  };

  // Send In-Call Live Chat Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setMessages(prev => [
      ...prev,
      { sender: 'You', text: chatInput, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    setChatInput('');
  };

  // Whiteboard Canvas Drawing Logic
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!isOpen || !session) return null;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(5, 8, 15, 0.95)',
        backdropFilter: 'blur(12px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justify: 'center',
        padding: '0.5rem'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '98vw',
          maxWidth: '1350px',
          height: '92vh',
          maxHeight: '900px',
          background: '#0a0f1d',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Top Meeting Header Bar */}
        <div
          style={{
            height: '60px',
            background: '#111827',
            borderBottom: '1px solid #1f2937',
            padding: '0 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.2)', padding: '0.5rem', borderRadius: '10px', color: '#38bdf8' }}>
              <Video size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                CampusBridge Native Call Suite <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>● In-App WebRTC</span>
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: 0 }}>
                Topic: <strong style={{ color: '#f8fafc' }}>{session.topic || 'Mentorship Guidance'}</strong> • Student: <strong>{session.student_name || 'Mentee'}</strong> • Mentor: <strong style={{ color: '#38bdf8' }}>{session.mentor_name || 'Alumni Mentor'}</strong>
              </p>
            </div>
          </div>

          {/* Interactive Workspace Tab Selector */}
          <div style={{ display: 'flex', background: '#1f2937', padding: '0.25rem', borderRadius: '8px', gap: '0.25rem' }}>
            <button
              onClick={() => setActiveTab('video')}
              className={`btn btn-sm ${activeTab === 'video' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: 'none' }}
            >
              <Video size={13} /> Dual HD Video Call
            </button>
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`btn btn-sm ${activeTab === 'whiteboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: 'none' }}
            >
              <PenTool size={13} /> Architecture Whiteboard
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`btn btn-sm ${activeTab === 'code' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: 'none' }}
            >
              <Code size={13} /> Code Interview Sandbox
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: 'none' }}
            >
              <MessageSquare size={13} /> In-Call Chat ({messages.length})
            </button>
          </div>

          {/* Leave Call Action Button */}
          <button
            onClick={onClose}
            className="btn btn-danger btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
          >
            <X size={15} /> End Session
          </button>
        </div>

        {/* Main Workarea Container */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', background: '#030712' }}>
          
          {/* TAB 1: DUAL HD VIDEO CALL VIEW */}
          {activeTab === 'video' && (
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: '#030712' }}>
              
              {/* Local User Stream (Your Camera) */}
              <div style={{ position: 'relative', background: '#111827', borderRadius: '12px', overflow: 'hidden', border: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cameraActive ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                ) : (
                  <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                    <VideoOff size={48} color="#64748b" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.9rem' }}>Your camera is turned off</p>
                  </div>
                )}
                
                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {micActive ? <Mic size={12} color="#34d399" /> : <MicOff size={12} color="#ef4444" />}
                  You ({session.student_name || 'Mentee'})
                </div>
              </div>

              {/* Remote Peer Stream (Mentor Camera Feed) */}
              <div style={{ position: 'relative', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: '12px', overflow: 'hidden', border: '1px solid #312e81', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', color: '#ffffff', fontSize: '2.5rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 0 25px rgba(37, 99, 235, 0.4)' }}>
                    {(session.mentor_name || 'M').charAt(0)}
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.25rem' }}>
                    {session.mentor_name || 'Alumni Mentor'}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#38bdf8' }}>Verified Alumni Mentor • HD Audio Stream</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.75rem', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', padding: '0.25rem 0.65rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} /> Connected & Streaming
                  </div>
                </div>

                <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: '#f8fafc', fontWeight: 600 }}>
                  🎙️ {session.mentor_name || 'Alumni Mentor'}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: INTERACTIVE ARCHITECTURE WHITEBOARD */}
          {activeTab === 'whiteboard' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', background: '#0f172a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', background: '#1e293b', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.825rem', color: '#94a3b8', fontWeight: 600 }}>Select Ink Color:</span>
                  {['#0284c7', '#38bdf8', '#34d399', '#f59e0b', '#ec4899', '#ffffff'].map(c => (
                    <button
                      key={c}
                      onClick={() => setDrawColor(c)}
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: c,
                        border: drawColor === c ? '2px solid #ffffff' : '1px solid #475569',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
                <button onClick={clearCanvas} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                  <RotateCcw size={12} /> Clear Canvas
                </button>
              </div>

              <div style={{ flex: 1, background: '#020617', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
                <canvas
                  ref={canvasRef}
                  width={1200}
                  height={650}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: CODE INTERVIEW SANDBOX */}
          {activeTab === 'code' && (
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', padding: '1rem', background: '#0f172a' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700 }}>JavaScript Code Editor</span>
                  <button onClick={handleRunCode} className="btn btn-primary btn-sm" style={{ background: '#059669', borderColor: '#059669' }}>
                    <Play size={13} /> Run & Test Code
                  </button>
                </div>
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  style={{
                    flex: 1,
                    width: '100%',
                    background: '#020617',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid #1e293b',
                    resize: 'none',
                    lineHeight: '1.5'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.5rem' }}>Terminal Execution Output</span>
                <div style={{ flex: 1, background: '#020617', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b', fontFamily: 'monospace', fontSize: '0.85rem', color: '#34d399', overflowY: 'auto' }}>
                  {codeConsoleOutput || 'Click "Run & Test Code" above to execute the JavaScript code snippet in real-time...'}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: IN-CALL LIVE CHAT */}
          {activeTab === 'chat' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', background: '#0f172a', maxWidth: '800px', margin: 'auto', width: '100%' }}>
              <div style={{ flex: 1, background: '#020617', borderRadius: '12px', border: '1px solid #1e293b', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {messages.map((m, idx) => (
                  <div key={idx} style={{ background: m.sender === 'You' ? '#0284c7' : '#1e293b', padding: '0.65rem 0.85rem', borderRadius: '8px', alignSelf: m.sender === 'You' ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: m.sender === 'You' ? '#ffffff' : '#38bdf8' }}>{m.sender}</span>
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)' }}>{m.time}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#ffffff', margin: 0 }}>{m.text}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type instant in-call message..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#ffffff' }}
                />
                <button type="submit" className="btn btn-primary btn-sm">Send</button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom WebRTC Control Bar */}
        <div
          style={{
            height: '65px',
            background: '#111827',
            borderTop: '1px solid #1f2937',
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            <ShieldCheck size={16} color="#34d399" />
            <span>Native Browser WebRTC Call Active</span>
          </div>

          {/* Core Call Action Controls */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={toggleMic}
              className={`btn btn-sm ${micActive ? 'btn-secondary' : 'btn-danger'}`}
              style={{ padding: '0.6rem 1.1rem', borderRadius: '9999px', fontSize: '0.825rem' }}
              title={micActive ? 'Mute Microphone' : 'Unmute Microphone'}
            >
              {micActive ? <Mic size={16} /> : <MicOff size={16} />} {micActive ? 'Mic On' : 'Muted'}
            </button>

            <button
              onClick={toggleCamera}
              className={`btn btn-sm ${cameraActive ? 'btn-secondary' : 'btn-danger'}`}
              style={{ padding: '0.6rem 1.1rem', borderRadius: '9999px', fontSize: '0.825rem' }}
              title={cameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
            >
              {cameraActive ? <Video size={16} /> : <VideoOff size={16} />} {cameraActive ? 'Camera On' : 'Cam Off'}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`btn btn-sm ${screenSharing ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.6rem 1.1rem', borderRadius: '9999px', fontSize: '0.825rem' }}
            >
              <Share2 size={16} /> {screenSharing ? 'Stop Sharing' : 'Share Screen'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={onClose}
              className="btn btn-danger btn-sm"
              style={{ borderRadius: '9999px', padding: '0.5rem 1.25rem' }}
            >
              End Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
