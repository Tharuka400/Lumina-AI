import React, { useState, useRef } from 'react';
import axios from 'axios';
import luminaLogo from './assets/lumina-logo.jpg';
import './LampLogin.css';

const LAMP_THEMES = [
  {
    name: 'Off',
    accent: '#94a3b8',
    bulbColor: '#2a2e39',
    glow: 'transparent',
    beamStart: 'transparent',
    bgRadial: 'radial-gradient(circle at 30% 45%, #11141c 0%, #090b10 100%)',
  },
  {
    name: 'Cyan Blue',
    accent: '#00e5ff',
    bulbColor: '#ffffff',
    glow: 'rgba(0, 229, 255, 0.55)',
    beamStart: 'rgba(0, 229, 255, 0.45)',
    bgRadial: 'radial-gradient(circle at 28% 42%, #0c3542 0%, #071921 55%, #050a0f 100%)',
  },
  {
    name: 'Emerald Green',
    accent: '#10b981',
    bulbColor: '#ffffff',
    glow: 'rgba(16, 185, 129, 0.55)',
    beamStart: 'rgba(16, 185, 129, 0.45)',
    bgRadial: 'radial-gradient(circle at 28% 42%, #0a382b 0%, #061c16 55%, #050a09 100%)',
  },
  {
    name: 'Neon Pink',
    accent: '#f43f5e',
    bulbColor: '#ffffff',
    glow: 'rgba(244, 63, 94, 0.55)',
    beamStart: 'rgba(244, 63, 94, 0.45)',
    bgRadial: 'radial-gradient(circle at 28% 42%, #3f0e1d 0%, #1f0810 55%, #0b0508 100%)',
  },
  {
    name: 'Amber Gold',
    accent: '#f59e0b',
    bulbColor: '#ffffff',
    glow: 'rgba(245, 158, 11, 0.55)',
    beamStart: 'rgba(245, 158, 11, 0.45)',
    bgRadial: 'radial-gradient(circle at 28% 42%, #3d2807 0%, #1e1405 55%, #0b0804 100%)',
  },
  {
    name: 'Royal Purple',
    accent: '#a855f7',
    bulbColor: '#ffffff',
    glow: 'rgba(168, 85, 247, 0.55)',
    beamStart: 'rgba(168, 85, 247, 0.45)',
    bgRadial: 'radial-gradient(circle at 28% 42%, #2b1045 0%, #150824 55%, #08040e 100%)',
  },
];

export default function LampLogin({ onLoginSuccess }) {
  const [themeIndex, setThemeIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('signin');
  const [bladeSweep, setBladeSweep] = useState(false);

  // Separate form states for smooth dual-panel transition
  const [signInUser, setSignInUser] = useState('');
  const [signInPass, setSignInPass] = useState('');
  const [signUpUser, setSignUpUser] = useState('');
  const [signUpPass, setSignUpPass] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pull and drag state for lamp cord
  const [pullOffset, setPullOffset] = useState(0);
  const isDragging = useRef(false);
  const startY = useRef(0);

  const isLampOn = themeIndex !== 0;
  const currentTheme = LAMP_THEMES[themeIndex];

  const switchTheme = () => {
    setThemeIndex((prev) => (prev + 1) % LAMP_THEMES.length);
  };

  // Trigger diagonal blade sweep when switching between Sign In and Sign Up
  const handleSwitchMode = (targetMode) => {
    if (targetMode === activeTab) return;
    setBladeSweep(true);
    setActiveTab(targetMode);
    setTimeout(() => {
      setBladeSweep(false);
    }, 650);
  };

  const handlePointerDown = (e) => {
    isDragging.current = true;
    startY.current = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    const currentY = e.clientY || 0;
    const diff = currentY - startY.current;
    if (diff > 0 && diff <= 55) {
      setPullOffset(diff);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setPullOffset(0);
    switchTheme();
  };

  const handleSubmit = async (e, mode) => {
    e.preventDefault();
    const username = mode === 'signin' ? signInUser.trim() : signUpUser.trim();
    const password = mode === 'signin' ? signInPass.trim() : signUpPass.trim();

    if (!username || !password) return;

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${apiUrl}/api/auth`, {
        username,
        password,
        mode,
      });

      if (response.data.success && onLoginSuccess) {
        onLoginSuccess({ username: response.data.username, mode });
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Authentication failed! Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const cssVariables = {
    '--accent-color': currentTheme.accent,
    '--glow-color': currentTheme.glow,
    '--beam-start': currentTheme.beamStart,
    '--bg-radial': currentTheme.bgRadial,
  };

  return (
    <div className="lamp-login-wrapper" style={cssVariables}>
      {/* Full-screen Ambient Light Overlay */}
      <div className={`ambient-room-glow ${isLampOn ? 'active' : ''}`}></div>

      <div className="lamp-login-content">
        {/* LEFT: 3D ARTICULATED DESK LAMP */}
        <div className={`lamp-container ${isLampOn ? 'lamp-on' : ''}`}>
          <svg className="lamp-svg" viewBox="0 0 360 440">
            <defs>
              <linearGradient id="darkMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#383e4e" />
                <stop offset="50%" stopColor="#1e222b" />
                <stop offset="100%" stopColor="#111318" />
              </linearGradient>

              <radialGradient id="goldJoint" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="45%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </radialGradient>

              <radialGradient id="shadeOuter" cx="35%" cy="25%" r="75%">
                <stop offset="0%" stopColor="#474e61" />
                <stop offset="55%" stopColor="#232733" />
                <stop offset="100%" stopColor="#12141b" />
              </radialGradient>

              <radialGradient id="shadeInnerGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor={currentTheme.accent} />
                <stop offset="100%" stopColor="#1a1d26" />
              </radialGradient>

              <linearGradient id="lightConeGrad" x1="0%" y1="0%" x2="85%" y2="100%">
                <stop offset="0%" stopColor={currentTheme.accent} stopOpacity="0.65" />
                <stop offset="45%" stopColor={currentTheme.accent} stopOpacity="0.22" />
                <stop offset="100%" stopColor={currentTheme.accent} stopOpacity="0" />
              </linearGradient>

              <filter id="neonBlur" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {isLampOn && (
              <polygon
                points="126,178 214,132 390,340 165,435"
                fill="url(#lightConeGrad)"
                className="svg-light-cone"
              />
            )}

            <ellipse
              cx="115"
              cy="392"
              rx="68"
              ry="14"
              fill={isLampOn ? currentTheme.accent : '#000000'}
              opacity={isLampOn ? '0.18' : '0.45'}
              style={{ transition: 'all 0.5s ease' }}
            />

            <ellipse cx="115" cy="382" rx="56" ry="15" fill="#14171f" />
            <path d="M59 382 C59 362, 171 362, 171 382 Z" fill="url(#darkMetal)" />
            <ellipse cx="115" cy="368" rx="34" ry="8" fill="#2c313f" />
            <rect x="107" y="352" width="16" height="16" rx="4" fill="url(#goldJoint)" />

            <line
              x1="115"
              y1="355"
              x2="78"
              y2="245"
              stroke="url(#darkMetal)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <line
              x1="113"
              y1="355"
              x2="76"
              y2="245"
              stroke="#4b5563"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />

            <circle cx="78" cy="245" r="11" fill="url(#goldJoint)" />
            <circle cx="78" cy="245" r="4" fill="#451a03" />

            <line
              x1="78"
              y1="245"
              x2="132"
              y2="122"
              stroke="url(#darkMetal)"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <line
              x1="76"
              y1="245"
              x2="130"
              y2="122"
              stroke="#4b5563"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />

            <circle cx="132" cy="122" r="9.5" fill="url(#goldJoint)" />
            <line x1="132" y1="122" x2="152" y2="134" stroke="url(#goldJoint)" strokeWidth="7" strokeLinecap="round" />

            <ellipse
              cx="170"
              cy="155"
              rx="48"
              ry="17"
              transform="rotate(-27 170 155)"
              fill={isLampOn ? 'url(#shadeInnerGlow)' : '#151821'}
              stroke={isLampOn ? currentTheme.accent : '#2e3342'}
              strokeWidth="2"
              style={{ transition: 'all 0.4s ease' }}
            />

            <circle
              cx="168"
              cy="152"
              r="14"
              fill={isLampOn ? currentTheme.bulbColor : '#262a36'}
              filter={isLampOn ? 'url(#neonBlur)' : 'none'}
              style={{ transition: 'all 0.3s ease' }}
            />

            <path
              d="M 127 177 C 102 108, 175 72, 213 133 Q 170 155 127 177 Z"
              fill="url(#shadeOuter)"
              stroke="#3b4254"
              strokeWidth="1.5"
            />
            <path
              d="M 134 142 C 134 114, 162 98, 185 108"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.18"
            />

            <g
              className="pull-cord-group"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{ cursor: 'grab', touchAction: 'none' }}
            >
              <rect x="148" y="150" width="44" height="145" fill="transparent" />
              <line
                x1="170"
                y1="158"
                x2="170"
                y2={228 + pullOffset}
                stroke={isLampOn ? currentTheme.accent : '#9ca3af'}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle
                cx="170"
                cy={235 + pullOffset}
                r="8.5"
                fill={isLampOn ? currentTheme.accent : '#cbd5e1'}
                filter={isLampOn ? 'url(#neonBlur)' : 'none'}
              />
              <circle
                cx="167"
                cy={232 + pullOffset}
                r="2.5"
                fill="#ffffff"
                opacity="0.8"
              />
            </g>
          </svg>

          <span className="pull-hint">
            {isLampOn
              ? `✨ ${currentTheme.name} Mode — Pull cord to change color`
              : 'Pull down or click the glowing bead to turn on'}
          </span>
        </div>

        {/* RIGHT: ANIMATED GLASSMORPHISM LOGIN CARD */}
        <div className={`login-box ${isLampOn ? 'lit' : 'dimmed'} ${activeTab === 'signup' ? 'mode-signup' : 'mode-signin'}`}>
          {/* Diagonal Blade Curtain Transition Overlay */}
          <div className={`diagonal-blade ${activeTab === 'signup' ? 'slide-right' : 'slide-left'} ${bladeSweep ? 'sweeping' : ''}`}>
            <div className="blade-edge-glow"></div>
          </div>

          {/* LUMINA AI BRAND HEADER */}
          <div className="login-brand-header">
            <div className="login-logo-ring">
              <img src={luminaLogo} alt="Lumina AI Logo" className="login-logo-img" />
            </div>
            <div className="login-brand-text">
              <span className="login-brand-name">Lumina AI</span>
              <span className="login-brand-tag">Bilingual Academic Agent</span>
            </div>
          </div>

          {/* Sliding Tab Header with Animated Pill Indicator */}
          <div className="auth-tabs">
            <div className={`tab-slider-pill ${activeTab === 'signup' ? 'right' : 'left'}`}></div>
            <button
              type="button"
              className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
              onClick={() => handleSwitchMode('signin')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
              onClick={() => handleSwitchMode('signup')}
            >
              Sign Up
            </button>
          </div>

          {/* Dual Sliding Form Panels */}
          <div className="auth-panels-viewport">
            <div className={`auth-panels-track ${activeTab === 'signup' ? 'show-signup' : 'show-signin'}`}>
              {/* PANEL 1: SIGN IN */}
              <div className="auth-panel signin-panel">
                <h2>Welcome back</h2>
                <p className="login-subtitle">Sign in to continue to your Lumina AI workspace</p>

                <form onSubmit={(e) => handleSubmit(e, 'signin')}>
                  <div className="form-group">
                    <label>Username</label>
                    <div className="input-wrapper">
                      <span className="input-icon">👤</span>
                      <input
                        type="text"
                        placeholder="Enter your username"
                        value={signInUser}
                        onChange={(e) => setSignInUser(e.target.value)}
                        required={activeTab === 'signin'}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔒</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={signInPass}
                        onChange={(e) => setSignInPass(e.target.value)}
                        required={activeTab === 'signin'}
                      />
                      <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="form-options">
                    <label className="remember-me">
                      <input type="checkbox" /> Keep me signed in
                    </label>
                    <a href="#forgot" className="forgot-link">
                      Forgot?
                    </a>
                  </div>

                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In →'}
                  </button>
                </form>

                <div className="switch-prompt">
                  New here?{' '}
                  <button type="button" className="switch-link-btn" onClick={() => handleSwitchMode('signup')}>
                    Create an account
                  </button>
                </div>
              </div>

              {/* PANEL 2: CREATE ACCOUNT */}
              <div className="auth-panel signup-panel">
                <h2>Create account</h2>
                <p className="login-subtitle">Start your bilingual study & research workspace</p>

                <form onSubmit={(e) => handleSubmit(e, 'signup')}>
                  <div className="form-group">
                    <label>Choose Username</label>
                    <div className="input-wrapper">
                      <span className="input-icon">✨</span>
                      <input
                        type="text"
                        placeholder="Create a username"
                        value={signUpUser}
                        onChange={(e) => setSignUpUser(e.target.value)}
                        required={activeTab === 'signup'}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Create Password</label>
                    <div className="input-wrapper">
                      <span className="input-icon">🔑</span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 4 characters"
                        value={signUpPass}
                        onChange={(e) => setSignUpPass(e.target.value)}
                        required={activeTab === 'signup'}
                      />
                      <button
                        type="button"
                        className="eye-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex="-1"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="form-options">
                    <span className="password-hint">Use 4+ characters for your account</span>
                  </div>

                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Account →'}
                  </button>
                </form>

                <div className="switch-prompt">
                  Already have an account?{' '}
                  <button type="button" className="switch-link-btn" onClick={() => handleSwitchMode('signin')}>
                    Sign in
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}