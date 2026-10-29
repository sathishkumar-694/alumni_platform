import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Video,
  Maximize2,
  ShieldCheck,
  Code,
  PenTool,
  MessageSquare,
  Play,
  RotateCcw,
  Minus
} from 'lucide-react';
import { useAuth } from '../../shared/context/useAuth';
import { useNotification } from '../../shared/context/useNotification';
import { apiClient } from '../../shared/services/api';

export const VirtualMeetingModal = ({ session, isOpen, minimized = false, onMinimize, onClose }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'whiteboard' | 'code' | 'chat'
  const mentorshipId = session?.mentorship_id || session?.mentorshipId;
  const sessionId = String(session?.id || mentorshipId || 'live-room');

  // In-Call Live Chat State
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const fetchMessages = useCallback(async () => {
    if (!mentorshipId) return;
    try {
      const res = await apiClient(`/chat/conversations/${encodeURIComponent(mentorshipId)}/messages`);
      setMessages(res.data?.messages || []);
    } catch (err) {
      console.warn('Failed to load in-call chat:', err.message);
    }
  }, [mentorshipId]);

  // Interactive Code Sandbox State
  const [codeSnippet, setCodeSnippet] = useState(
    `// 1-on-1 Technical Interview & Live Coding Sandbox\n// Topic: ${session?.topic || 'Data Structures & System Architecture'}\n\nfunction solveSystemProblem(inputData) {\n  console.log("Analyzing input:", inputData);\n  const result = inputData.map(x => x * 2);\n  return result;\n}\n\n// Run code below:\nconsole.log("Output:", solveSystemProblem([10, 20, 30, 40]));`
  );
  const [codeConsoleOutput, setCodeConsoleOutput] = useState('');
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [strokes, setStrokes] = useState([]);

  // Collaborative Whiteboard Canvas Refs & State
  const canvasRef = useRef(null);
  const codeEditorRef = useRef(null);
  const currentStrokeRef = useRef(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#0284c7');

  const updateStrokes = (nextStrokes) => {
    strokesRef.current = nextStrokes;
    setStrokes(nextStrokes);
  };

  const saveWorkspace = useCallback(async (updates) => {
    if (!mentorshipId) return;
    await apiClient(`/sessions/collaboration/${encodeURIComponent(mentorshipId)}/${encodeURIComponent(sessionId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }, [mentorshipId, sessionId]);

  const fetchWorkspace = useCallback(async () => {
    if (!mentorshipId) return;
    try {
      const res = await apiClient(`/sessions/collaboration/${encodeURIComponent(mentorshipId)}/${encodeURIComponent(sessionId)}`);
      const workspace = res.data || {};
      if (Array.isArray(workspace.strokes) && !isDrawingRef.current) {
        strokesRef.current = workspace.strokes;
        setStrokes(workspace.strokes);
      }
      if (workspace.updatedAt && typeof workspace.code === 'string' && document.activeElement !== codeEditorRef.current) {
        setCodeSnippet(workspace.code);
      }
      setWorkspaceLoaded(true);
    } catch (err) {
      console.warn('Failed to sync meeting workspace:', err.message);
    }
  }, [mentorshipId, sessionId]);

  useEffect(() => {
    if (!isOpen || !mentorshipId) return undefined;
    const initialFetch = window.setTimeout(() => { void fetchMessages(); }, 0);
    const interval = window.setInterval(() => { void fetchMessages(); }, 2000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [fetchMessages, isOpen, mentorshipId]);

  useEffect(() => {
    if (!isOpen || !mentorshipId) return undefined;
    const initialFetch = window.setTimeout(() => { void fetchWorkspace(); }, 0);
    const interval = window.setInterval(() => { void fetchWorkspace(); }, 2000);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
    };
  }, [fetchWorkspace, isOpen, mentorshipId]);

  useEffect(() => {
    if (!isOpen || !workspaceLoaded || !mentorshipId) return undefined;
    const timer = window.setTimeout(() => {
      void saveWorkspace({ code: codeSnippet }).catch((err) => {
        console.error('Failed to save shared code:', err.message);
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [codeSnippet, isOpen, mentorshipId, saveWorkspace, workspaceLoaded]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach((stroke) => {
      const points = stroke.points || [];
      if (points.length === 0) return;
      context.beginPath();
      context.strokeStyle = stroke.color;
      context.lineWidth = 3;
      context.lineCap = 'round';
      context.moveTo(points[0].x * canvas.width, points[0].y * canvas.height);
      points.slice(1).forEach((point) => context.lineTo(point.x * canvas.width, point.y * canvas.height));
      context.stroke();
    });
  }, [strokes]);

  // Handle Code Execution in Sandbox
  const handleRunCode = async () => {
    let worker;
    let workerUrl;
    try {
      const source = `
        self.fetch = () => Promise.reject(new Error('Network access is disabled in this sandbox.'));
        self.XMLHttpRequest = undefined;
        self.WebSocket = undefined;
        self.EventSource = undefined;
        self.importScripts = undefined;
        self.Worker = undefined;
        self.BroadcastChannel = undefined;
        self.onmessage = ({ data }) => {
          const output = [];
          const format = (value) => {
            if (typeof value === 'string') return value;
            try { return JSON.stringify(value); } catch { return String(value); }
          };
          const sandboxConsole = {
            log: (...values) => output.push(values.map(format).join(' ')),
            error: (...values) => output.push('[ERROR] ' + values.map(format).join(' '))
          };
          try {
            new Function('console', data.code)(sandboxConsole);
            self.postMessage({ output: output.join(String.fromCharCode(10)) || 'Code executed successfully with zero output errors!' });
          } catch (error) {
            self.postMessage({ error: error.message });
          }
        };
      `;
      workerUrl = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
      worker = new Worker(workerUrl);
      setCodeConsoleOutput('Running code...');
      const result = await new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(new Error('Execution timed out after 3 seconds.')), 3000);
        worker.onmessage = (event) => {
          window.clearTimeout(timeout);
          resolve(event.data);
        };
        worker.onerror = (event) => {
          window.clearTimeout(timeout);
          reject(new Error(event.message || 'Code execution failed.'));
        };
        worker.postMessage({ code: codeSnippet });
      });
      if (result.error) {
        setCodeConsoleOutput(`Runtime Error: ${result.error}`);
        showNotification('Code execution failed.', 'error');
      } else {
        setCodeConsoleOutput(result.output);
        showNotification('Code executed cleanly!', 'success');
      }
    } catch (err) {
      setCodeConsoleOutput(`Runtime Error: ${err.message}`);
      showNotification('Code execution failed.', 'error');
    } finally {
      worker?.terminate();
      if (workerUrl) URL.revokeObjectURL(workerUrl);
    }
  };

  // Send In-Call Live Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    try {
      await apiClient(`/chat/conversations/${encodeURIComponent(mentorshipId)}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: chatInput.trim() })
      });
      setChatInput('');
      await fetchMessages();
    } catch (err) {
      showNotification(err.message || 'Could not send in-call message.', 'error');
    }
  };

  // Whiteboard Canvas Drawing Logic
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const point = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
    currentStrokeRef.current = { color: drawColor, points: [point] };
    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x * canvas.width, point.y * canvas.height);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const point = {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    };
    currentStrokeRef.current?.points.push(point);
    ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    setIsDrawing(false);
    const completedStroke = currentStrokeRef.current;
    currentStrokeRef.current = null;
    if (!completedStroke || completedStroke.points.length === 0) return;
    const nextStrokes = [...strokesRef.current, completedStroke].slice(-300);
    updateStrokes(nextStrokes);
    void saveWorkspace({ strokes: nextStrokes }).catch((err) => {
      console.error('Failed to save whiteboard changes:', err.message);
      showNotification('Could not save your whiteboard changes.', 'error');
    });
  };

  const clearCanvas = () => {
    updateStrokes([]);
    void saveWorkspace({ strokes: [] }).catch((err) => {
      console.error('Failed to clear shared whiteboard:', err.message);
      showNotification('Could not clear the shared whiteboard.', 'error');
    });
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
        display: minimized ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.5rem',
        overflowY: 'auto',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '98vw',
          maxWidth: '1350px',
          height: '92vh',
          maxHeight: 'calc(100dvh - 1rem)',
          background: '#0a0f1d',
          border: '1px solid #1e293b',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: 0,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
        }}
      >
        {/* Top Meeting Header Bar */}
        <div
          style={{
            minHeight: '60px',
            height: 'auto',
            background: '#111827',
            borderBottom: '1px solid #1f2937',
            padding: '0 1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 300px', minWidth: 0 }}>
            <div style={{ background: 'rgba(2, 132, 199, 0.2)', padding: '0.5rem', borderRadius: '10px', color: '#38bdf8' }}>
              <Video size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                CampusBridge WebRTC Live Room
                <span className="badge badge-rose" style={{ fontSize: '0.65rem', background: '#991b1b', color: '#fecdd3' }}>🔴 Mentor Currently in a Meeting</span>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Session ID: #{session.id || session.mentorship_id || 'LIVE-1'}</span>
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>User ID: #{user?.id || 'AUTH'}</span>
              </h3>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8', margin: '0.2rem 0 0 0' }}>
                Topic: <strong style={{ color: '#f8fafc' }}>{session.topic || 'Mentorship Guidance'}</strong> • Student: <strong>{session.student_name || 'Mentee'} {session.student_id ? `(ID #${session.student_id})` : ''}</strong> • Mentor: <strong style={{ color: '#38bdf8' }}>{session.mentor_name || 'Alumni Mentor'} {session.mentor_id ? `(ID #${session.mentor_id})` : ''}</strong>
              </p>
            </div>
          </div>

          {/* Interactive Workspace Tab Selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', flex: '1 1 480px', minWidth: 0, justifyContent: 'center', background: '#1f2937', padding: '0.25rem', borderRadius: '8px', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => setActiveTab('video')}
              className={`btn btn-sm ${activeTab === 'video' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: 'none' }}
            >
              <Video size={13} /> Dual HD Video Call
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('whiteboard')}
              className={`btn btn-sm ${activeTab === 'whiteboard' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: 'none' }}
            >
              <PenTool size={13} /> Architecture Whiteboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`btn btn-sm ${activeTab === 'code' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: 'none' }}
            >
              <Code size={13} /> Code Interview Sandbox
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', border: 'none' }}
            >
              <MessageSquare size={13} /> In-Call Chat ({messages.length})
            </button>
          </div>

          {/* Leave Call Action Button */}
          <button
            type="button"
            onClick={onMinimize}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
            title="Minimize meeting and continue using CampusBridge"
          >
            <Minus size={15} /> Minimize
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-danger btn-sm"
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
          >
            <X size={15} /> End Session
          </button>
        </div>

        {/* Main Workarea Container */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', background: '#030712' }}>
          
          {/* TAB 1: DUAL HD REAL-TIME 2-WAY WEBRTC VIDEO CALL VIEW */}
          {(() => {
            const cleanRoomName = `CampusBridge-Session-${session.id || session.mentorship_id || 'live-room'}`.replace(/[^a-zA-Z0-9-_]/g, '-');
            const participantName = user?.name || session.student_name || session.mentor_name || 'Participant';
            const roomUrl = `https://meet.jit.si/${cleanRoomName}#userInfo.displayName="${encodeURIComponent(participantName)}"`;

            return (
              <div style={{ flex: 1, display: activeTab === 'video' ? 'flex' : 'none', flexDirection: 'column', padding: '0.75rem', background: '#030712' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', background: '#111827', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                    Live 2-Way WebRTC Room Active • Room ID: <strong style={{ color: '#f8fafc' }}>{cleanRoomName}</strong>
                  </div>

                  <a
                    href={roomUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#1e293b', border: '1px solid #334155', color: '#f8fafc' }}
                  >
                    <Maximize2 size={13} /> Open Room in Separate Window
                  </a>
                </div>

                <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #1f2937', background: '#0a0f1d' }}>
                  <iframe
                    src={roomUrl}
                    title="CampusBridge Real-Time 2-Way WebRTC Video Call"
                    allow="camera; microphone; display-capture; autoplay; clipboard-write"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              </div>
            );
          })()}

          {/* TAB 2: INTERACTIVE ARCHITECTURE WHITEBOARD */}
          <div style={{ flex: 1, display: activeTab === 'whiteboard' ? 'flex' : 'none', flexDirection: 'column', padding: '1rem', background: '#0f172a' }}>
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
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerCancel={stopDrawing}
                  style={{ width: '100%', height: '100%', cursor: 'crosshair', display: 'block' }}
                />
              </div>
            </div>

          {/* TAB 3: CODE INTERVIEW SANDBOX */}
          <div style={{ flex: 1, display: activeTab === 'code' ? 'grid' : 'none', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', padding: '1rem', background: '#0f172a' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 700 }}>JavaScript Code Editor</span>
                  <button onClick={handleRunCode} className="btn btn-primary btn-sm" style={{ background: '#059669', borderColor: '#059669' }}>
                    <Play size={13} /> Run & Test Code
                  </button>
                </div>
                <textarea
                ref={codeEditorRef}
                maxLength={50000}
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

          {/* TAB 4: IN-CALL LIVE CHAT */}
          <div style={{ flex: 1, display: activeTab === 'chat' ? 'flex' : 'none', flexDirection: 'column', padding: '1rem', background: '#0f172a', maxWidth: '800px', margin: 'auto', width: '100%' }}>
              <div style={{ flex: 1, background: '#020617', borderRadius: '12px', border: '1px solid #1e293b', padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                {messages.length === 0 && (
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No messages yet. Send a message to start the in-call chat.</p>
                )}
                {messages.map((m) => {
                  const isOwnMessage = String(m.sender_id) === String(user?.id);
                  return (
                  <div key={m.id} style={{ background: isOwnMessage ? '#0284c7' : '#1e293b', padding: '0.65rem 0.85rem', borderRadius: '8px', alignSelf: isOwnMessage ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isOwnMessage ? '#ffffff' : '#38bdf8' }}>{m.sender_name || 'Participant'}</span>
                      <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)' }}>{m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#ffffff', margin: 0 }}>{m.content}</p>
                  </div>
                  );
                })}
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
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.8rem' }}>
            <ShieldCheck size={16} color="#34d399" />
            <span>Call controls are available in the Video tab</span>
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
