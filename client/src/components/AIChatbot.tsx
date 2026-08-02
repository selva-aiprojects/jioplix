import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  MessageSquare, X, Send, GripVertical, Loader2, RotateCcw,
  Sparkles, Paperclip, Mic, MicOff, Volume2, VolumeX, FileText
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const API_BASE = API_BASE_URL;
const STORAGE_KEY = 'chatbot_position';

type WidgetPos = { mode: 'anchored' } | { mode: 'free'; left: number; top: number };

interface Attachment {
  name: string;
  mimeType: string;
  data: string; // base64
}

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Hello! I'm your Jioplix AI Co-Pilot. I can assist with real-time hospital metrics, patient MRN lookups (RAG), OPD appointment bookings, STAT lab orders, drug allergy warnings, and vision prescription scanning."
};

const AIChatbot: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Voice Dictation (STT) State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Audio Playback (TTS) State
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DRAG STATE ---
  const widgetRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, elLeft: 0, elTop: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Load saved position
  const loadPos = (): WidgetPos => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (
          typeof p.left === 'number' && typeof p.top === 'number' &&
          p.left >= 0 && p.left < window.innerWidth &&
          p.top >= 0 && p.top < window.innerHeight
        ) {
          return { mode: 'free', left: p.left, top: p.top };
        }
      }
    } catch {}
    return { mode: 'anchored' };
  };

  const [pos, setPos] = useState<WidgetPos>({ mode: 'anchored' });

  useEffect(() => {
    setPos(loadPos());
  }, []);

  const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = widgetRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      elLeft: rect.left,
      elTop: rect.top
    };
    isDraggingRef.current = true;
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      setPos({
        mode: 'free',
        left: clamp(dragStartRef.current.elLeft + dx, 0, window.innerWidth - 80),
        top: clamp(dragStartRef.current.elTop + dy, 0, window.innerHeight - 80)
      });
    };

    const onUp = (e: MouseEvent) => {
      isDraggingRef.current = false;
      const dx = e.clientX - dragStartRef.current.mouseX;
      const dy = e.clientY - dragStartRef.current.mouseY;
      const finalPos = {
        mode: 'free' as const,
        left: clamp(dragStartRef.current.elLeft + dx, 0, window.innerWidth - 80),
        top: clamp(dragStartRef.current.elTop + dy, 0, window.innerHeight - 80)
      };
      setPos(finalPos);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: finalPos.left, top: finalPos.top }));
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  // Voice Dictation setup (Web Speech API)
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Text-to-Speech (TTS)
  const toggleSpeech = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\*\_~`#\-]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  // File Upload Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachments(prev => [
          ...prev,
          { name: file.name, mimeType: file.type || 'application/octet-stream', data: base64 }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const sendQuery = async (queryText: string) => {
    if ((!queryText.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: any = { role: 'user', content: queryText };
    if (attachments.length > 0) {
      userMessage.attachments = attachments;
    }

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    try {
      const tenantId = localStorage.getItem('tenant') || '';
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_BASE}/api/hospital/ai/chat`, {
        messages: [...messages, userMessage]
      }, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I encountered a communication error. Operational statistics can also be reviewed directly in your clinical dashboard."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendQuery(input);

  const resetChat = () => {
    window.speechSynthesis?.cancel();
    setSpeakingIndex(null);
    setMessages([INITIAL_MESSAGE]);
  };

  // Smart routing rules: Hide on public & nexus routes
  const path = location.pathname;
  const isPublicPage = path === '/' || path === '/login' || path === '/mobile' || path.startsWith('/nexus');
  const isAutomation = localStorage.getItem('isAutomation') === 'true';

  if (isPublicPage || isAutomation) {
    return null;
  }

  const posStyle: React.CSSProperties = pos.mode === 'anchored'
    ? { position: 'fixed', bottom: '30px', right: '30px', zIndex: 999999 }
    : { position: 'fixed', left: `${pos.left}px`, top: `${pos.top}px`, zIndex: 999999 };

  return (
    <>
      <style>{`
        @keyframes chatbot-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .chatbot-floating { animation: chatbot-float 4s ease-in-out infinite; }
        .chatbot-floating:hover { animation-play-state: paused; }
        .chatbot-dragging { animation: none !important; }
        .chatbot-grip { cursor: grab; user-select: none; }
        .chatbot-grip:active { cursor: grabbing; }
        .listening-btn { animation: pulse-red 1.5s infinite; background-color: #ef4444 !important; }
        .pill-btn {
          background: #e0f2fe;
          color: #0056A8;
          border: 1px solid #7dd3fc;
          border-radius: 20px;
          padding: 5px 11px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .pill-btn:hover {
          background: #bae6fd;
          transform: translateY(-1px);
        }
      `}</style>

      <div ref={widgetRef} style={{ ...posStyle, fontFamily: 'sans-serif', userSelect: 'none' }}>
        {/* Chat Window */}
        {isOpen && (
          <div style={{
            backgroundColor: '#ffffff',
            width: '390px',
            height: '550px',
            borderRadius: '20px',
            boxShadow: '0 14px 48px rgba(0,86,168,0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
            marginBottom: '16px'
          }}>
            {/* Header */}
            <div
              onMouseDown={onMouseDown}
              className="chatbot-grip"
              style={{
                background: 'linear-gradient(135deg, #0056A8 0%, #0078FF 100%)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'none' }}>
                <GripVertical size={16} style={{ opacity: 0.8 }} />
                <MessageSquare size={18} />
                <div>
                  <div style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Jioplix AI <Sparkles size={13} style={{ color: '#fbbf24' }} />
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.9 }}>⠿ Drag to reposition window</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={resetChat}
                  title="Reset conversation"
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', opacity: 0.9 }}
                >
                  <RotateCcw size={16} />
                </button>
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => setIsOpen(false)}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} style={{
              flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#f8fafc',
              display: 'flex', flexDirection: 'column', gap: '14px'
            }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    background: m.role === 'user' ? 'linear-gradient(135deg, #0056A8 0%, #0078FF 100%)' : '#ffffff',
                    color: m.role === 'user' ? '#ffffff' : '#334155',
                    padding: '10px 14px', borderRadius: '14px', fontSize: '13px', maxWidth: '88%',
                    boxShadow: m.role === 'user' ? '0 4px 14px rgba(0,120,255,0.25)' : '0 1px 3px rgba(0,0,0,0.06)',
                    border: m.role === 'user' ? 'none' : '1px solid #e2e8f0', lineHeight: 1.5,
                    whiteSpace: 'pre-line'
                  }}>
                    {m.content}
                    {m.attachments && m.attachments.length > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '11px', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FileText size={12} /> {m.attachments.length} attachment(s) scanned
                      </div>
                    )}
                  </div>

                  {/* Audio TTS button for assistant responses */}
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => toggleSpeech(m.content, i)}
                      style={{
                        background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
                        fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px',
                        marginTop: '4px', padding: '2px 6px'
                      }}
                    >
                      {speakingIndex === i ? <VolumeX size={12} style={{ color: '#ef4444' }} /> : <Volume2 size={12} />}
                      <span>{speakingIndex === i ? 'Stop' : 'Listen'}</span>
                    </button>
                  )}
                </div>
              ))}

              {/* Quick Action Suggestion Chips */}
              {messages.length <= 2 && !isLoading && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  <button className="pill-btn" onClick={() => sendQuery("How many ICU beds are available right now?")}>
                    🏥 ICU Beds
                  </button>
                  <button className="pill-btn" onClick={() => sendQuery("Show pharmacy low-stock alerts")}>
                    💊 Low Stock
                  </button>
                  <button className="pill-btn" onClick={() => sendQuery("List doctor schedules for today")}>
                    🩺 Doctor Roster
                  </button>
                  <button className="pill-btn" onClick={() => sendQuery("Summarize medical history for MRN-1042")}>
                    🔍 MRN-1042 Lookup
                  </button>
                  <button className="pill-btn" onClick={() => sendQuery("Book OPD appointment for MRN-1042 with Dr. Sarah Johns")}>
                    ⚡ Book Appointment
                  </button>
                  <button className="pill-btn" onClick={() => sendQuery("Order STAT Complete Blood Count (CBC) for MRN-1042")}>
                    🔬 Order STAT CBC
                  </button>
                </div>
              )}

              {isLoading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0056A8', fontSize: '12px', fontStyle: 'italic', padding: '6px 0', fontWeight: 600 }}>
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing clinical context & Jioplix AI...
                </div>
              )}
            </div>

            {/* File Attachment Previews */}
            {attachments.length > 0 && (
              <div style={{ padding: '6px 14px', backgroundColor: '#f1f5f9', borderTop: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {attachments.map((att, idx) => (
                  <div key={idx} style={{
                    backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px',
                    padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    <FileText size={12} style={{ color: '#0056A8' }} />
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                    <X size={12} style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => removeAttachment(idx)} />
                  </div>
                ))}
              </div>
            )}

            {/* Input Footer */}
            <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload prescription image / lab PDF scan"
                  style={{
                    padding: '8px', backgroundColor: '#f1f5f9', color: '#475569',
                    border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer'
                  }}
                >
                  <Paperclip size={16} />
                </button>

                <button
                  onClick={toggleListening}
                  title={isListening ? "Listening... Click to stop" : "Hands-free voice dictation (STT)"}
                  className={isListening ? 'listening-btn' : ''}
                  style={{
                    padding: '8px', backgroundColor: isListening ? '#ef4444' : '#f1f5f9', color: isListening ? '#ffffff' : '#475569',
                    border: '1px solid #cbd5e1', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <input
                  type="text"
                  placeholder={isListening ? "Listening to your voice..." : "Ask about MRN-1042, ICU beds, or actions..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  style={{
                    flex: 1, padding: '9px 12px', borderRadius: '10px',
                    border: '1px solid #cbd5e1', outline: 'none', fontSize: '13px'
                  }}
                />

                <button
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && attachments.length === 0)}
                  style={{
                    padding: '9px 13px', background: 'linear-gradient(135deg, #0056A8 0%, #0078FF 100%)', color: 'white',
                    border: 'none', borderRadius: '10px', cursor: 'pointer',
                    opacity: (isLoading || (!input.trim() && attachments.length === 0)) ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,120,255,0.3)'
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toggle Button */}
        {!isOpen && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div
              onMouseDown={onMouseDown}
              className="chatbot-grip"
              title="Drag to reposition"
              style={{
                position: 'absolute',
                top: '-22px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 120, 255, 0.15)',
                borderRadius: '6px 6px 0 0',
                padding: '3px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                whiteSpace: 'nowrap',
                border: '1px solid rgba(0, 86, 168, 0.25)'
              }}
            >
              <GripVertical size={13} style={{ color: '#0056A8' }} />
              <span style={{ fontSize: '9px', color: '#0056A8', fontWeight: 700 }}>DRAG</span>
            </div>

            <button
              onClick={() => {
                if (!isDraggingRef.current) setIsOpen(true);
              }}
              className={isDragging ? 'chatbot-dragging' : 'chatbot-floating'}
              style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #0056A8 0%, #0078FF 100%)',
                borderRadius: '50%',
                border: 'none',
                boxShadow: '0 8px 28px rgba(0, 86, 168, 0.45)',
                color: 'white',
                cursor: isDragging ? 'grabbing' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MessageSquare size={28} />
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default AIChatbot;
