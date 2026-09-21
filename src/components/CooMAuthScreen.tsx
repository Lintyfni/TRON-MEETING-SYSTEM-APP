import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Lock,
  User,
  AtSign,
  ChevronLeft,
  RefreshCw,
  Info,
  Check,
  Camera,
} from 'lucide-react';
import { AuthUser } from '../types';
import { api } from '../services/api';

interface CooMAuthScreenProps {
  onAuthSuccess: (user: AuthUser, token: string) => void;
  defaultEmail?: string;
}

type AuthViewMode = 'landing' | 'signup_details' | 'email_login' | 'verify_code' | 'google_picker';

export const CooMAuthScreen: React.FC<CooMAuthScreenProps> = ({
  onAuthSuccess,
  defaultEmail = 'linty.fni@gmail.com',
}) => {
  const [viewMode, setViewMode] = useState<AuthViewMode>('landing');
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState('Aung Myint');
  const [handle, setHandle] = useState('@aungmyint');
  const [avatar, setAvatar] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face');
  const [authPurpose, setAuthPurpose] = useState<'signup' | 'login'>('signup');

  // 6-digit code state
  const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [demoCode, setDemoCode] = useState<string>('');
  const [resendTimer, setResendTimer] = useState<number>(45);
  const [canResend, setCanResend] = useState<boolean>(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Input refs for 6-digit code boxes
  const digitInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend Countdown Timer
  useEffect(() => {
    let interval: any;
    if (viewMode === 'verify_code' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [viewMode, resendTimer]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  // Google Sign-In Flow
  const handleGoogleSignIn = async (googleEmail?: string, googleName?: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const targetEmail = googleEmail || email || defaultEmail;
      const targetName = googleName || name || 'Google User';
      const targetAvatar = avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face';

      const res = await api.loginWithGoogle({
        email: targetEmail,
        name: targetName,
        avatar: targetAvatar,
        googleId: `goog_${Date.now()}`,
      });

      if (res.success && res.user && res.token) {
        showToast('🎉 Connected with Google successfully!');
        setTimeout(() => {
          onAuthSuccess(res.user, res.token!);
        }, 500);
      } else {
        setErrorMessage(res.error || 'Failed to connect with Google');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error during Google sign-in');
    } finally {
      setIsLoading(false);
    }
  };

  // Send 6-digit verification code to email
  const handleSendVerificationCode = async (targetEmail: string, purpose: 'signup' | 'login') => {
    if (!targetEmail.trim() || !targetEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.sendVerificationCode(targetEmail.trim());
      if (res.success) {
        setAuthPurpose(purpose);
        setEmail(targetEmail.trim());
        if (res.demoCode) {
          setDemoCode(res.demoCode);
        }
        setCodeDigits(['', '', '', '', '', '']);
        setResendTimer(45);
        setCanResend(false);
        setViewMode('verify_code');
        showToast(`📬 Verification code sent to ${targetEmail.trim()}`);
      } else {
        setErrorMessage(res.error || 'Could not send verification code');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error sending code');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify 6-digit Code & Complete Auth
  const handleVerifyCodeSubmit = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || codeDigits.join('');
    if (fullCode.length !== 6) {
      setErrorMessage('Please enter all 6 digits of the code');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.verifyCode({
        email: email.trim(),
        code: fullCode,
        name: authPurpose === 'signup' ? name : undefined,
        handle: authPurpose === 'signup' ? handle : undefined,
        avatar: authPurpose === 'signup' ? avatar : undefined,
      });

      if (res.success && res.user && res.token) {
        showToast('✨ Verification successful! Welcome to CooM.');
        setTimeout(() => {
          onAuthSuccess(res.user, res.token!);
        }, 500);
      } else {
        setErrorMessage(res.error || 'Invalid verification code. Try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error verifying code');
    } finally {
      setIsLoading(false);
    }
  };

  // Code input handler (auto-focus next box)
  const handleDigitChange = (index: number, val: string) => {
    // Handle paste
    if (val.length > 1) {
      const cleaned = val.replace(/\D/g, '').slice(0, 6);
      if (cleaned.length > 0) {
        const newDigits = [...codeDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = cleaned[i] || '';
        }
        setCodeDigits(newDigits);
        if (cleaned.length === 6) {
          handleVerifyCodeSubmit(cleaned);
        } else {
          digitInputRefs.current[Math.min(cleaned.length, 5)]?.focus();
        }
      }
      return;
    }

    const singleDigit = val.replace(/\D/g, '');
    const newDigits = [...codeDigits];
    newDigits[index] = singleDigit;
    setCodeDigits(newDigits);

    // Auto-advance to next input if filled
    if (singleDigit && index < 5) {
      digitInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 filled
    if (singleDigit && index === 5) {
      const completeCode = newDigits.join('');
      if (completeCode.length === 6) {
        handleVerifyCodeSubmit(completeCode);
      }
    }
  };

  // Handle backspace
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      digitInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div
      id="coom-auth-screen"
      className="relative w-full h-[100dvh] min-h-[100dvh] bg-[#000000] text-slate-100 flex flex-col justify-between overflow-y-auto selection:bg-purple-600 selection:text-white"
    >
      {/* 1. Celestial Starlight & Start Color Ambient Canvas */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Deep Midnight Nebula Aura */}
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-purple-900/25 via-indigo-950/20 to-transparent blur-3xl opacity-70" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-slate-800/20 via-purple-950/15 to-transparent blur-3xl opacity-70" />
        {/* Subtle Star Points */}
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:32px_32px] opacity-25" />
      </div>

      {/* Floating Toast Notification */}
      {successToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-white/95 text-neutral-900 text-xs sm:text-sm font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-3 border border-purple-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Container: X-Style Layout */}
      <main className="relative z-10 w-full max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center px-6 sm:px-10 py-8 sm:py-12 gap-10 lg:gap-16">
        
        {/* LEFT COLUMN: Iconic Grand CooM Brand (Silver-White on Space Canvas) */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start justify-center text-center lg:text-left">
          {/* Glowing CooM Silver Brand Symbol */}
          <div className="relative group cursor-pointer mb-6 lg:mb-10">
            {/* Ambient Silver Backlight Glow */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-slate-200/20 via-white/10 to-purple-400/20 blur-xl opacity-70 group-hover:opacity-100 transition duration-500" />
            
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-44 lg:h-44 rounded-3xl sm:rounded-[36px] bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-white/20 flex items-center justify-center shadow-2xl shadow-purple-950/40">
              {/* CooM Silver-White Metallic Geometry */}
              <div className="flex items-center justify-center">
                <span className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(255,255,255,0.35)]">
                  CooM
                </span>
              </div>
            </div>
          </div>

          {/* Prominent CooM Wordmark in Silver-White */}
          <div className="space-y-2">
            <div className="flex items-center justify-center lg:justify-start gap-2.5">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]">
                CooM
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-white/10 border border-white/20 text-slate-200 tracking-wide uppercase">
                Official
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              Real-time multi-peer meetings, vertical shorts, creator communities, and social feeds.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: X-Inspired Action Card & Flow */}
        <div className="w-full lg:w-1/2 max-w-md flex flex-col justify-center">
          
          {/* ========================================================= */}
          {/* 1. LANDING MODE (X-STYLE ONBOARDING) */}
          {/* ========================================================= */}
          {viewMode === 'landing' && (
            <div className="flex flex-col space-y-7 animate-in fade-in duration-200">
              {/* Headline in X Typography */}
              <div className="space-y-3">
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                  Happening now
                </h2>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-200">
                  Join CooM today.
                </h3>
              </div>

              {/* Action Buttons Stack */}
              <div className="space-y-3 pt-2">
                {/* Google Mail Connect Button */}
                <button
                  type="button"
                  id="btn-auth-google"
                  onClick={() => setViewMode('google_picker')}
                  className="w-full h-11 sm:h-12 px-5 rounded-full bg-white hover:bg-slate-100 text-neutral-900 font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] shadow-lg cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google Mail</span>
                </button>

                {/* Or Divider */}
                <div className="flex items-center my-3 gap-3">
                  <div className="flex-1 h-px bg-neutral-800" />
                  <span className="text-xs text-slate-500 font-medium lowercase">or</span>
                  <div className="flex-1 h-px bg-neutral-800" />
                </div>

                {/* Create Account Button (Silver White Outline / Purple Gradient) */}
                <button
                  type="button"
                  id="btn-auth-create-account"
                  onClick={() => {
                    setAuthPurpose('signup');
                    setViewMode('signup_details');
                  }}
                  className="w-full h-11 sm:h-12 px-5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-lg shadow-purple-900/30 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-purple-200" />
                  <span>Create account</span>
                </button>

                {/* Terms of Service Disclaimer */}
                <p className="text-[11px] text-slate-500 leading-tight pt-1">
                  By signing up, you agree to the Terms of Service and Privacy Policy, including Cookie Use.
                </p>
              </div>

              {/* Already Have an Account? Sign In Section */}
              <div className="space-y-3 pt-6 border-t border-neutral-900">
                <h4 className="font-bold text-sm sm:text-base text-slate-200">
                  Already have an account?
                </h4>
                <button
                  type="button"
                  id="btn-auth-signin"
                  onClick={() => {
                    setAuthPurpose('login');
                    setViewMode('email_login');
                  }}
                  className="w-full h-10 sm:h-11 px-5 rounded-full border border-slate-700 hover:border-slate-500 bg-neutral-950 hover:bg-neutral-900 text-purple-400 hover:text-purple-300 font-bold text-sm flex items-center justify-center transition cursor-pointer"
                >
                  <span>Sign in</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. GOOGLE ACCOUNT SELECTOR MODAL */}
          {/* ========================================================= */}
          {viewMode === 'google_picker' && (
            <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('landing')}
                    className="p-1 rounded-lg hover:bg-neutral-900 text-slate-400 hover:text-white transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-base text-white">Google Mail Connect</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">OAuth 2.0</span>
              </div>

              <p className="text-xs text-slate-400">
                Choose an existing Google Mail account or enter your Google address to connect to CooM instantly.
              </p>

              {/* Default Active User Account Option */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(defaultEmail, 'Aung Myint')}
                  className="w-full p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-purple-500/50 flex items-center justify-between transition cursor-pointer text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                      {defaultEmail.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white group-hover:text-purple-300 transition">
                        Aung Myint
                      </div>
                      <div className="text-xs text-slate-400">{defaultEmail}</div>
                    </div>
                  </div>
                  <Check className="w-4 h-4 text-purple-400" />
                </button>
              </div>

              {/* Custom Google Email Input */}
              <div className="space-y-2 pt-2 border-t border-neutral-900">
                <label className="text-xs font-semibold text-slate-300">Or use another Google Mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="username@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-purple-500 text-white text-sm outline-none transition"
                  />
                </div>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleGoogleSignIn(email)}
                  className="w-full h-11 mt-2 rounded-xl bg-white hover:bg-slate-100 text-neutral-900 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-neutral-900" />
                  ) : (
                    <>
                      <span>Continue with this account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. SIGN UP DETAILS FORM (X-STYLE FORM) */}
          {/* ========================================================= */}
          {viewMode === 'signup_details' && (
            <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('landing')}
                    className="p-1 rounded-lg hover:bg-neutral-900 text-slate-400 hover:text-white transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-base text-white">Create your account</h3>
                </div>
                <span className="text-xs text-purple-400 font-semibold">Step 1 of 2</span>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name (e.g. Aung Myint)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-purple-500 text-white text-sm outline-none transition"
                  />
                </div>

                {/* Handle */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-purple-400" />
                    <span>Username / Handle</span>
                  </label>
                  <input
                    type="text"
                    placeholder="@handle"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.startsWith('@') ? e.target.value : `@${e.target.value}`)}
                    className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-purple-500 text-white text-sm outline-none transition font-mono"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-purple-500 text-white text-sm outline-none transition"
                  />
                  <p className="text-[10px] text-slate-500">
                    We will send a 6-digit verification code to verify this email.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              {/* Continue Button -> Sends Verification Code */}
              <button
                type="button"
                id="btn-signup-next-code"
                disabled={isLoading || !email.trim() || !name.trim()}
                onClick={() => handleSendVerificationCode(email, 'signup')}
                className="w-full h-11 rounded-full bg-white hover:bg-slate-100 text-neutral-900 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-neutral-900" />
                ) : (
                  <>
                    <span>Next: Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. EMAIL SIGN IN (QUICK LOGIN) */}
          {/* ========================================================= */}
          {viewMode === 'email_login' && (
            <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode('landing')}
                    className="p-1 rounded-lg hover:bg-neutral-900 text-slate-400 hover:text-white transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-base text-white">Sign in to CooM</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-400" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-purple-500 text-white text-sm outline-none transition"
                  />
                  <p className="text-[10px] text-slate-500">
                    We will send a passwordless 6-digit login code to your inbox.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              <button
                type="button"
                id="btn-login-send-code"
                disabled={isLoading || !email.trim()}
                onClick={() => handleSendVerificationCode(email, 'login')}
                className="w-full h-11 rounded-full bg-white hover:bg-slate-100 text-neutral-900 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-neutral-900" />
                ) : (
                  <>
                    <span>Send Login Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthPurpose('signup');
                    setViewMode('signup_details');
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                >
                  Don&apos;t have an account? Sign up
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. 6-DIGIT EMAIL VERIFICATION CODE VIEW */}
          {/* ========================================================= */}
          {viewMode === 'verify_code' && (
            <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewMode(authPurpose === 'signup' ? 'signup_details' : 'email_login')}
                    className="p-1 rounded-lg hover:bg-neutral-900 text-slate-400 hover:text-white transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-base text-white">We sent you a code</h3>
                </div>
                <span className="text-xs text-purple-400 font-semibold">Verify</span>
              </div>

              {/* Explanation & Email */}
              <div className="space-y-1">
                <p className="text-xs text-slate-300">
                  Enter the 6-digit code sent to <strong className="text-white">{email}</strong> to complete authorization.
                </p>
                <button
                  type="button"
                  onClick={() => setViewMode(authPurpose === 'signup' ? 'signup_details' : 'email_login')}
                  className="text-[11px] text-purple-400 hover:underline"
                >
                  Change email address
                </button>
              </div>

              {/* Developer / Demo Quick-Fill Code Banner */}
              {demoCode && (
                <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-purple-200">
                    <Info className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>
                      Demo Code: <strong className="font-mono text-white tracking-widest text-sm">{demoCode}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const split = demoCode.split('');
                      setCodeDigits(split);
                      handleVerifyCodeSubmit(demoCode);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] transition cursor-pointer"
                  >
                    Quick Fill
                  </button>
                </div>
              )}

              {/* 6-Digit Code Inputs */}
              <div className="flex items-center justify-between gap-2 sm:gap-3 py-2">
                {codeDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (digitInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 rounded-xl bg-neutral-900 border border-neutral-800 focus:border-purple-500 text-center text-xl sm:text-2xl font-bold font-mono text-white outline-none transition shadow-inner"
                  />
                ))}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-xs text-red-300">
                  {errorMessage}
                </div>
              )}

              {/* Verify & Launch CooM Button */}
              <button
                type="button"
                id="btn-confirm-verify-code"
                disabled={isLoading || codeDigits.join('').length !== 6}
                onClick={() => handleVerifyCodeSubmit()}
                className="w-full h-11 sm:h-12 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-900/40"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify &amp; Launch CooM</span>
                  </>
                )}
              </button>

              {/* Resend Code Timer */}
              <div className="text-center pt-2">
                {canResend ? (
                  <button
                    type="button"
                    onClick={() => handleSendVerificationCode(email, authPurpose)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold"
                  >
                    Didn&apos;t receive code? Resend email
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">
                    Resend code in <strong className="text-slate-300">{resendTimer}s</strong>
                  </span>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* FOOTER: CooM Official Copyright Notice in Silver-White */}
      <footer className="relative z-10 w-full py-4 px-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 max-w-7xl mx-auto gap-2">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <span className="hover:text-slate-300 cursor-pointer">About</span>
          <span className="hover:text-slate-300 cursor-pointer">Help Center</span>
          <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
          <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-300 cursor-pointer">Cookie Policy</span>
          <span className="hover:text-slate-300 cursor-pointer">CooM Developers</span>
        </div>
        <div className="font-medium text-slate-400">
          © 2026 CooM Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
};
