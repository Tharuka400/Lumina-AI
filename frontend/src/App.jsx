import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import LampLogin from './LampLogin';
import luminaLogo from './assets/lumina-logo.jpg'; // Make sure image_27.png is saved here
import './App.css';

const THEME_ACCENTS = [
  { name: 'Cyan', color: '#00e5ff', glow: 'rgba(0, 229, 255, 0.35)', bg: 'radial-gradient(circle at 15% 15%, #0c3542 0%, #07131a 45%, #05080d 100%)' },
  { name: 'Emerald', color: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', bg: 'radial-gradient(circle at 15% 15%, #0a382b 0%, #061712 45%, #050807 100%)' },
  { name: 'Pink', color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.35)', bg: 'radial-gradient(circle at 15% 15%, #3f0e1d 0%, #19070d 45%, #090507 100%)' },
  { name: 'Amber', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)', bg: 'radial-gradient(circle at 15% 15%, #3d2807 0%, #171005 45%, #090704 100%)' },
  { name: 'Purple', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.35)', bg: 'radial-gradient(circle at 15% 15%, #2b1045 0%, #12071f 45%, #07040c 100%)' },
];

const QUICK_PROMPTS = [
  'How does photosynthesis work and what are the light-dependent reactions?',
  'Explain database normalization (1NF, 2NF, 3NF) with real-world table examples',
  'ශ්‍රී ලංකා මහ බැංකුවේ මූල්‍ය ප්‍රතිපත්ති (Monetary Policy) ආර්ථිකයට බලපාන්නේ කෙසේද?',
  'What are Newton’s Laws of Motion and how is momentum calculated?',
];

export default function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('legal_ai_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [themeIndex, setThemeIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('chat');
  const [language, setLanguage] = useState('sinhala');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Chatbot states
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'model',
      text: 'Hello! I am Lumina AI, your Bilingual Academic Research Assistant. Ask me anything about Science, IT, Commerce, Law, Medical, Arts, or any other subject in Sinhala or English.',
    },
  ]);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Lecture tab states
  const [lectureFile, setLectureFile] = useState(null);
  const [lectureResult, setLectureResult] = useState(null);

  // PDF tab states
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfSummary, setPdfSummary] = useState('');

  // Translator tab states
  const [englishText, setEnglishText] = useState('');
  const [sinhalaTranslation, setSinhalaTranslation] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const currentTheme = THEME_ACCENTS[themeIndex];

  useEffect(() => {
    if (user) {
      localStorage.setItem('legal_ai_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('legal_ai_user');
    }
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  // Auto-resize Gemini-style prompt textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '28px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`;
    }
  }, [chatInput]);

  const handleLogout = () => {
    setUser(null);
    setLectureResult(null);
    setPdfSummary('');
    setSinhalaTranslation('');
  };

  const handleCopyText = (textToCopy) => {
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Voice Input Handler (Web Speech API)
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice typing is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'sinhala' ? 'si-LK' : 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  // Chatbot Submit Handler
  const handleChatSubmit = async (e) => {
    if (e) e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;

    const updatedMessages = [...chatMessages, { role: 'user', text: trimmed }];
    setChatMessages(updatedMessages);
    setChatInput('');
    setShowQuickMenu(false);
    setChatLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: trimmed,
        history: chatMessages,
        language: language,
      });

      setChatMessages((prev) => [
        ...prev,
        { role: 'model', text: response.data.reply },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: err.response?.data?.detail || 'Error: Could not connect to Lumina AI server.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        role: 'model',
        text: 'Chat cleared. How can I assist you with your academic research today?',
      },
    ]);
  };

  // 1. Process Lecture Handler
  const handleLectureSubmit = async (e) => {
    e.preventDefault();
    if (!lectureFile) {
      alert('Please select an audio or video lecture file first.');
      return;
    }

    setLoading(true);
    setLectureResult(null);

    const formData = new FormData();
    formData.append('file', lectureFile);
    formData.append('language', language);

    try {
      const response = await axios.post(`${API_URL}/api/process-lecture`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLectureResult(response.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error processing lecture file.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Summarize PDF Handler
  const handlePdfSubmit = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      alert('Please select a PDF document first.');
      return;
    }

    setLoading(true);
    setPdfSummary('');

    const formData = new FormData();
    formData.append('file', pdfFile);
    formData.append('language', language);

    try {
      const response = await axios.post(`${API_URL}/api/summarize-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPdfSummary(response.data.summary);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error summarizing PDF.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Translate English Note Handler
  const handleTranslateSubmit = async (e) => {
    e.preventDefault();
    if (!englishText.trim()) {
      alert('Please enter or paste your English study note.');
      return;
    }

    setLoading(true);
    setSinhalaTranslation('');

    try {
      const response = await axios.post(`${API_URL}/api/translate-english-note`, {
        text: englishText,
      });
      setSinhalaTranslation(response.data.sinhala_note);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error translating note.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <LampLogin onLoginSuccess={(userData) => setUser(userData)} />;
  }

  const themeVars = {
    '--accent-color': currentTheme.color,
    '--glow-color': currentTheme.glow,
    '--bg-radial': currentTheme.bg,
  };

  return (
    <div className="dashboard-wrapper" style={themeVars}>
      <div className="dashboard-ambient-glow"></div>

      <div className="dashboard-container">
        {/* TOP NAVIGATION BAR */}
        <header className="top-navbar">
          <div className="brand-area">
            {/* BRAND LOGO EMBEDDED */}
            <img
              src={luminaLogo}
              className="brand-logo-img"
              alt="Lumina AI Logo"
              style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'contain' }}
            />
            <div>
              <h1 className="brand-title">Lumina AI</h1>
              <span className="brand-status">
                <span className="status-dot"></span> Bilingual Academic Agent Active
              </span>
            </div>
          </div>

          <div className="nav-actions">
            <div className="theme-dots" title="Switch Ambient Glow Color">
              {THEME_ACCENTS.map((item, idx) => (
                <button
                  key={item.name}
                  type="button"
                  className={`theme-dot ${themeIndex === idx ? 'active' : ''}`}
                  style={{ backgroundColor: item.color }}
                  onClick={() => setThemeIndex(idx)}
                  aria-label={item.name}
                />
              ))}
            </div>

            <div className="user-pill">
              <span className="user-avatar">{user.username.charAt(0).toUpperCase()}</span>
              <span className="user-name">{user.username}</span>
            </div>

            <button type="button" className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* NAVIGATION TABS & LANGUAGE CONTROL */}
        <div className="controls-bar">
          <div className="feature-tabs">
            <button
              type="button"
              className={`feature-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <span className="tab-icon">💬</span> Study AI Chat
            </button>
            <button
              type="button"
              className={`feature-tab ${activeTab === 'lecture' ? 'active' : ''}`}
              onClick={() => setActiveTab('lecture')}
            >
              <span className="tab-icon">🎙️</span> Lecture to PPTX & Note
            </button>
            <button
              type="button"
              className={`feature-tab ${activeTab === 'pdf' ? 'active' : ''}`}
              onClick={() => setActiveTab('pdf')}
            >
              <span className="tab-icon">📄</span> PDF Summarizer
            </button>
            <button
              type="button"
              className={`feature-tab ${activeTab === 'translate' ? 'active' : ''}`}
              onClick={() => setActiveTab('translate')}
            >
              <span className="tab-icon">🌐</span> English to Sinhala
            </button>
          </div>

          {activeTab !== 'translate' && (
            <div className="language-selector">
              <span>Output:</span>
              <button
                type="button"
                className={`lang-btn ${language === 'sinhala' ? 'active' : ''}`}
                onClick={() => setLanguage('sinhala')}
              >
                සිංහල
              </button>
              <button
                type="button"
                className={`lang-btn ${language === 'english' ? 'active' : ''}`}
                onClick={() => setLanguage('english')}
              >
                English
              </button>
            </div>
          )}
        </div>

        {/* MAIN WORKSPACE CARD */}
        <main className="workspace-card">
          {/* TAB 0: ACADEMIC AI RESEARCH CHATBOT */}
          {activeTab === 'chat' && (
            <div className="tab-section">
              <div className="chat-top-bar">
                <div className="section-header" style={{ marginBottom: 0 }}>
                  <h2>Academic Research AI Chatbot</h2>
                  <p style={{ marginBottom: 0 }}>
                    Ask questions about theories, subjects, computational steps, or structural concepts in Sinhala or English.
                  </p>
                </div>
                <button type="button" className="secondary-btn" onClick={handleClearChat}>
                  Clear Chat
                </button>
              </div>

              <div className="chat-window">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`chat-bubble-row ${msg.role === 'user' ? 'user-row' : 'ai-row'}`}
                  >
                    <div className={`chat-bubble ${msg.role === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                      <div className="bubble-meta">
                        <span>{msg.role === 'user' ? user.username : '✨ Lumina AI'}</span>
                        {msg.role === 'model' && (
                          <button
                            type="button"
                            className="mini-copy-btn"
                            onClick={() => handleCopyText(msg.text)}
                          >
                            Copy
                          </button>
                        )}
                      </div>
                      <div className="bubble-text">{msg.text}</div>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="chat-bubble-row ai-row">
                    <div className="chat-bubble ai-bubble typing-indicator">
                      Researching academic sources...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* FULL-WIDTH PILL PROMPT BAR */}
              <div className="gemini-prompt-wrapper">
                {showQuickMenu && (
                  <div className="quick-prompts-popover">
                    <div className="popover-title">Suggested Study & Research Prompts</div>
                    {QUICK_PROMPTS.map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        className="quick-prompt-item"
                        onClick={() => {
                          setChatInput(item);
                          setShowQuickMenu(false);
                          textareaRef.current?.focus();
                        }}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleChatSubmit} className="gemini-prompt-bar">
                  <button
                    type="button"
                    className="prompt-icon-btn plus-btn"
                    title="Suggested Prompts"
                    onClick={() => setShowQuickMenu((prev) => !prev)}
                  >
                    +
                  </button>

                  <textarea
                    ref={textareaRef}
                    rows="1"
                    className="gemini-prompt-input"
                    placeholder="Ask Lumina AI anything (Shift + Enter for new line)..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={chatLoading}
                  />

                  <div className="prompt-right-controls">
                    <span className="model-tag">Gemini 2.0 ▾</span>

                    <button
                      type="button"
                      className={`prompt-icon-btn mic-btn ${isListening ? 'listening' : ''}`}
                      title={isListening ? 'Listening...' : 'Voice Input'}
                      onClick={handleVoiceInput}
                    >
                      🎤
                    </button>

                    <button
                      type="submit"
                      className="prompt-send-circle"
                      title="Send Message"
                      disabled={chatLoading || !chatInput.trim()}
                    >
                      ➤
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 1: LECTURE TO PPTX */}
          {activeTab === 'lecture' && (
            <div className="tab-section">
              <div className="section-header">
                <h2>Lecture Audio / Video to Study Note & Slides</h2>
                <p>Upload any lecture to extract full transcripts, structured academic summaries, and downloadable Powerpoint slides.</p>
              </div>

              <form onSubmit={handleLectureSubmit} className="workspace-form">
                <label className="file-dropzone">
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    onChange={(e) => setLectureFile(e.target.files[0])}
                  />
                  <div className="dropzone-content">
                    <span className="dropzone-icon">🎧</span>
                    {lectureFile ? (
                      <div className="file-selected">
                        <strong>{lectureFile.name}</strong>
                        <span>({(lectureFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <>
                        <strong>Click to upload Lecture Audio or Video</strong>
                        <span>Supports MP3, WAV, M4A, MP4, MKV</span>
                      </>
                    )}
                  </div>
                </label>

                <button type="submit" className="primary-action-btn" disabled={loading}>
                  {loading ? 'Analyzing Lecture with Gemini AI...' : 'Generate Note & Presentation →'}
                </button>
              </form>

              {lectureResult && (
                <div className="result-container">
                  <div className="result-header">
                    <h3>Generated Academic Study Note</h3>
                    <div className="result-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => handleCopyText(lectureResult.summary)}
                      >
                        {copied ? '✓ Copied' : 'Copy Note'}
                      </button>
                      <a
                        href={`${API_URL}${lectureResult.pptx_download_url}`}
                        className="download-pptx-btn"
                        download
                      >
                        📥 Download PPTX
                      </a>
                    </div>
                  </div>
                  <div className="output-box">{lectureResult.summary}</div>

                  {lectureResult.transcript && (
                    <details className="transcript-accordion">
                      <summary>View Full Lecture Transcript</summary>
                      <div className="output-box transcript-box">{lectureResult.transcript}</div>
                    </details>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PDF SUMMARIZER */}
          {activeTab === 'pdf' && (
            <div className="tab-section">
              <div className="section-header">
                <h2>Academic PDF Document Summarizer</h2>
                <p>Upload handouts, manuals, syllabus guidelines, or research articles in PDF format to generate structured summaries.</p>
              </div>

              <form onSubmit={handlePdfSubmit} className="workspace-form">
                <label className="file-dropzone">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files[0])}
                  />
                  <div className="dropzone-content">
                    <span className="dropzone-icon">📑</span>
                    {pdfFile ? (
                      <div className="file-selected">
                        <strong>{pdfFile.name}</strong>
                        <span>({(pdfFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                      </div>
                    ) : (
                      <>
                        <strong>Click to upload PDF Document</strong>
                        <span>Supports study materials, manuals, and textbooks</span>
                      </>
                    )}
                  </div>
                </label>

                <button type="submit" className="primary-action-btn" disabled={loading}>
                  {loading ? 'Summarizing Document...' : 'Summarize PDF →'}
                </button>
              </form>

              {pdfSummary && (
                <div className="result-container">
                  <div className="result-header">
                    <h3>Document Summary</h3>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => handleCopyText(pdfSummary)}
                    >
                      {copied ? '✓ Copied' : 'Copy Summary'}
                    </button>
                  </div>
                  <div className="output-box">{pdfSummary}</div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ENGLISH TO SINHALA TRANSLATOR */}
          {activeTab === 'translate' && (
            <div className="tab-section">
              <div className="section-header">
                <h2>English to Sinhala Academic Translator</h2>
                <p>Translate English materials and notes into accurate Sinhala, ensuring correct explanation of complex subject terms.</p>
              </div>

              <form onSubmit={handleTranslateSubmit} className="workspace-form">
                <textarea
                  className="legal-textarea"
                  rows="7"
                  placeholder="Paste your English academic text here (Science, IT, Commerce, Mathematics, Medicine extracts)..."
                  value={englishText}
                  onChange={(e) => setEnglishText(e.target.value)}
                />

                <button type="submit" className="primary-action-btn" disabled={loading}>
                  {loading ? 'Translating to Sinhala...' : 'Translate to Sinhala Note →'}
                </button>
              </form>

              {sinhalaTranslation && (
                <div className="result-container">
                  <div className="result-header">
                    <h3>Sinhala Academic Note</h3>
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => handleCopyText(sinhalaTranslation)}
                    >
                      {copied ? '✓ Copied' : 'Copy Sinhala Note'}
                    </button>
                  </div>
                  <div className="output-box">{sinhalaTranslation}</div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}