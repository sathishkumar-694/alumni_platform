import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { apiClient } from '../../shared/services/api';
import {
  MessageCircle,
  Send,
  Search,
  Lock,
  RefreshCw,
  ArrowLeft,
  CheckCheck,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Helper: format relative timestamp
───────────────────────────────────────────────────────────── */
function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ─────────────────────────────────────────────────────────────
   ConversationList — left panel
───────────────────────────────────────────────────────────── */
function ConversationList({ conversations, selectedId, onSelect, loading, currentUserId }) {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) =>
    c.other_user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.domain?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      width: '320px',
      minWidth: '280px',
      borderRight: '1px solid var(--border-card)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-card)',
      height: '100%'
    }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1rem 1rem',
        borderBottom: '1px solid var(--border-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageCircle size={16} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Private Messages
            </h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Lock size={10} /> End-to-session encrypted
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem 0.5rem 2rem',
              borderRadius: '8px',
              border: '1px solid var(--border-card)',
              background: 'var(--bg-subtle)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
            <p>Loading conversations…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <MessageCircle size={36} color="var(--text-subtle)" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>
              {conversations.length === 0 ? 'No active mentorships yet' : 'No results'}
            </p>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-subtle)', margin: '0.35rem 0 0' }}>
              {conversations.length === 0
                ? 'Chat opens once a mentorship is accepted'
                : 'Try a different search term'}
            </p>
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = c.mentorship_id === selectedId;
            const hasUnread = c.unread_count > 0;

            return (
              <button
                key={c.mentorship_id}
                onClick={() => onSelect(c)}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  background: isActive ? 'var(--primary)10' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  border: 'none',
                  borderRadius: 0,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                  boxSizing: 'border-box'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: isActive
                    ? 'linear-gradient(135deg, var(--primary), var(--accent-purple))'
                    : 'linear-gradient(135deg, var(--bg-subtle), var(--border-card))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, fontSize: '1rem', fontWeight: 700,
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  position: 'relative'
                }}>
                  {c.other_user?.name?.[0]?.toUpperCase() || '?'}
                  {hasUnread && (
                    <span style={{
                      position: 'absolute', top: -2, right: -2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'var(--accent-rose)', color: '#fff',
                      fontSize: '0.6rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid var(--bg-card)'
                    }}>
                      {c.unread_count > 9 ? '9+' : c.unread_count}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                      fontSize: '0.85rem', fontWeight: hasUnread ? 700 : 600,
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {c.other_user?.name}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', flexShrink: 0 }}>
                      {c.last_message ? formatTime(c.last_message.created_at) : formatTime(c.started_at)}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    color: 'var(--primary)',
                    fontWeight: 500,
                    marginBottom: '0.2rem',
                    display: 'flex', alignItems: 'center', gap: '0.25rem'
                  }}>
                    <Lock size={9} /> {c.domain?.name}
                  </div>
                  <p style={{
                    fontSize: '0.775rem', color: hasUnread ? 'var(--text-main)' : 'var(--text-muted)',
                    margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontWeight: hasUnread ? 600 : 400
                  }}>
                    {c.last_message
                      ? (c.last_message.sender_id === currentUserId ? 'You: ' : '') + c.last_message.content
                      : 'No messages yet. Say hello! 👋'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Privacy Footer */}
      <div style={{
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--border-card)',
        display: 'flex', alignItems: 'center', gap: '0.5rem'
      }}>
        <Lock size={12} color="var(--text-subtle)" />
        <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
          Chats are private — visible only to you and your mentor/mentee
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MessageBubble
───────────────────────────────────────────────────────────── */
function MessageBubble({ msg, isOwn }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
      marginBottom: '0.5rem',
      gap: '0.5rem',
      alignItems: 'flex-end'
    }}>
      {!isOwn && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-purple), var(--primary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: '#fff', fontSize: '0.7rem', fontWeight: 700
        }}>
          {msg.sender_name?.[0]?.toUpperCase() || '?'}
        </div>
      )}

      <div style={{ maxWidth: '68%' }}>
        {!isOwn && (
          <p style={{ fontSize: '0.68rem', color: 'var(--text-subtle)', margin: '0 0 0.2rem 0.25rem', fontWeight: 500 }}>
            {msg.sender_name}
          </p>
        )}
        <div style={{
          padding: '0.6rem 0.9rem',
          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isOwn
            ? 'linear-gradient(135deg, var(--primary), var(--accent-purple))'
            : 'var(--bg-subtle)',
          border: isOwn ? 'none' : '1px solid var(--border-card)',
          color: isOwn ? 'var(--chat-own-message-text)' : 'var(--text-main)',
          fontSize: '0.85rem',
          lineHeight: 1.5,
          wordBreak: 'break-word',
          boxShadow: isOwn ? '0 2px 8px rgba(99,102,241,0.25)' : '0 1px 4px rgba(0,0,0,0.06)'
        }}>
          {msg.content}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem',
          justifyContent: isOwn ? 'flex-end' : 'flex-start',
          marginTop: '0.2rem', padding: '0 0.25rem'
        }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-subtle)' }}>
            {formatMessageTime(msg.created_at)}
          </span>
          {isOwn && (
            <CheckCheck size={11} color={msg.is_read ? 'var(--primary)' : 'var(--text-subtle)'} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ChatWindow — right panel
───────────────────────────────────────────────────────────── */
function ChatWindow({ conversation, currentUser, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);

  const mentorshipId = conversation.mentorship_id;

  const fetchMessages = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiClient(`/chat/conversations/${mentorshipId}/messages`);
      setMessages(res.data?.messages || []);
      // Mark as read silently
      apiClient(`/chat/conversations/${mentorshipId}/read`, { method: 'PATCH' }).catch(() => {});
    } catch (e) {
      console.error('[Chat] Failed to fetch messages:', e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [mentorshipId]);

  // Initial load + poll every 5s
  useEffect(() => {
    const initialFetch = window.setTimeout(() => { void fetchMessages(false); }, 0);
    pollRef.current = setInterval(() => { void fetchMessages(true); }, 5000);
    
    return () => {
      window.clearTimeout(initialFetch);
      clearInterval(pollRef.current);
    };
  }, [fetchMessages]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || sending) return;

    // Optimistic UI
    const tempMsg = {
      id: `temp-${Date.now()}`,
      mentorship_id: mentorshipId,
      sender_id: currentUser.id,
      sender_name: currentUser.name,
      content,
      is_read: 0,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await apiClient(`/chat/conversations/${mentorshipId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      // Replace optimistic with real
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? res.data : m)));
    } catch (e) {
      // Remove optimistic on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setInput(content); // Restore
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherUser = conversation.other_user;

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const date = new Date(msg.created_at).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(msg);
    return groups;
  }, {});

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-subtle)',
      minWidth: 0
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '0.85rem 1.25rem',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-card)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexShrink: 0
      }}>
        {/* Back button (mobile) */}
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: '0.2rem',
            display: 'flex', alignItems: 'center'
          }}
        >
          <ArrowLeft size={18} />
        </button>

        {/* Avatar */}
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '1rem', flexShrink: 0
        }}>
          {otherUser?.name?.[0]?.toUpperCase() || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {otherUser?.name}
          </h3>
          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
              {otherUser?.role === 'ALUMNI' ? 'Alumni Mentor' : 'Student Mentee'}
            </span>
            <span style={{ color: 'var(--text-subtle)' }}>•</span>
            <Lock size={10} color="var(--text-subtle)" />
            <span style={{ color: 'var(--text-subtle)' }}>{conversation.domain?.name}</span>
          </p>
        </div>

        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: online ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
          {online ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span style={{ display: 'none' }}>{online ? 'Online' : 'Offline'}</span>
        </div>

        {/* Privacy badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0.25rem 0.6rem', borderRadius: '999px',
          background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)',
          fontSize: '0.7rem', fontWeight: 600, flexShrink: 0
        }}>
          <Lock size={11} /> Private
        </div>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '3rem' }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.85rem' }}>Loading messages…</p>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: '4rem', padding: '0 2rem' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary)20, var(--accent-purple)20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <MessageCircle size={28} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.35rem' }}>
              Start the conversation!
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>
              This is the beginning of your private mentorship chat with <strong>{otherUser?.name}</strong>.
            </p>
            <p style={{
              fontSize: '0.72rem', color: 'var(--text-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
            }}>
              <Lock size={11} /> Only you and {otherUser?.name} can see these messages
            </p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                margin: '1rem 0 0.75rem', color: 'var(--text-subtle)'
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
                <span style={{
                  fontSize: '0.68rem', fontWeight: 600, padding: '0.2rem 0.6rem',
                  background: 'var(--bg-card)', borderRadius: '999px',
                  border: '1px solid var(--border-card)'
                }}>
                  {date === new Date().toDateString() ? 'Today' : date}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-card)' }} />
              </div>

              {msgs.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isOwn={msg.sender_id === currentUser.id}
                />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div style={{
        padding: '1rem 1.25rem',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border-card)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.65rem' }}>
          <div style={{
            flex: 1, borderRadius: '12px',
            border: '1.5px solid var(--border-card)',
            background: 'var(--bg-subtle)',
            overflow: 'hidden',
            transition: 'border-color 0.2s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
          }}>
            <textarea
              ref={inputRef}
              id="chat-message-input"
              placeholder={`Message ${otherUser?.name}…`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{
                width: '100%',
                padding: '0.7rem 0.9rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: '120px',
                overflowY: 'auto',
                boxSizing: 'border-box',
                display: 'block'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
              }}
            />
          </div>

          <button
            id="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || sending || !online}
            style={{
              width: 44, height: 44,
              borderRadius: '50%',
              background: input.trim() && !sending && online
                ? 'linear-gradient(135deg, var(--primary), var(--accent-purple))'
                : 'var(--border-card)',
              border: 'none',
              cursor: input.trim() && !sending && online ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              boxShadow: input.trim() && !sending && online ? '0 2px 8px rgba(99,102,241,0.35)' : 'none'
            }}
          >
            {sending
              ? <Clock size={18} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              : <Send size={18} color={input.trim() && !sending && online ? '#fff' : 'var(--text-subtle)'} />
            }
          </button>
        </div>
        <p style={{
          fontSize: '0.67rem', color: 'var(--text-subtle)',
          margin: '0.4rem 0 0', textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
        }}>
          <Lock size={9} /> Messages are private and only visible to this mentorship pair • Press Enter to send
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main ChatView
───────────────────────────────────────────────────────────── */
export function ChatView() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      setLoadingConv(true);
      try {
        const res = await apiClient('/chat/conversations');
        const convs = res.data || [];
        setConversations(convs);
        // Auto-select first if any
        if (convs.length > 0 && !selected) {
          setSelected(convs[0]);
        }
      } catch (e) {
        console.error('[Chat] Failed to fetch conversations:', e.message);
      } finally {
        setLoadingConv(false);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 15000); // Refresh conversation list every 15s
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  return (
    <div style={{
      padding: '1.5rem',
      maxWidth: '1100px',
      margin: '0 auto'
    }}>
      {/* Page title */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MessageCircle size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
              Mentorship Chat
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={11} /> Private conversations — visible only to matched mentor-student pairs
            </p>
          </div>
        </div>
      </div>

      {/* Chat container */}
      <div style={{
        display: 'flex',
        height: 'calc(100vh - 240px)',
        minHeight: '480px',
        borderRadius: '14px',
        overflow: 'hidden',
        border: '1px solid var(--border-card)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
      }}>
        {/* Left panel */}
        <ConversationList
          conversations={conversations}
          selectedId={selected?.mentorship_id}
          onSelect={setSelected}
          loading={loadingConv}
          currentUserId={user.id}
        />

        {/* Right panel */}
        {selected ? (
          <ChatWindow
            key={selected.mentorship_id}
            conversation={selected}
            currentUser={user}
            onBack={() => setSelected(null)}
          />
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-subtle)',
            color: 'var(--text-muted)',
            padding: '2rem'
          }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary)15, var(--accent-purple)15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <MessageCircle size={36} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 0.5rem' }}>
              Select a conversation
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '280px', margin: 0 }}>
              Choose a mentorship chat from the left panel to start messaging
            </p>
            <div style={{
              marginTop: '1.5rem', padding: '0.6rem 1rem', borderRadius: '8px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.75rem', color: 'var(--accent-green)'
            }}>
              <Lock size={13} /> All messages are end-to-session private
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default ChatView;
