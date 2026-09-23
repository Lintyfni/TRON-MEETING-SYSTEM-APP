import React, { useState, useEffect } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  RefreshCw,
  X as CloseIcon,
  Sparkles,
  Calendar,
  Globe,
  HelpCircle,
  Check,
} from 'lucide-react';
import { AuthUser, SocialProvider } from '../types';
import { api } from '../services/api';

interface CooMAuthScreenProps {
  onAuthSuccess: (user: AuthUser, token: string) => void;
  defaultEmail?: string;
}

export const CooMAuthScreen: React.FC<CooMAuthScreenProps> = ({
  onAuthSuccess,
  defaultEmail = 'linty.fni@gmail.com',
}) => {
  // Login form state (matching screenshot)
  const [identifier, setIdentifier] = useState(defaultEmail);
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Active social connect authorization modal state
  const [activeSocialAuth, setActiveSocialAuth] = useState<{
    provider: SocialProvider;
    name: string;
    icon: string;
    brandColor: string;
    description: string;
  } | null>(null);

  // Onboarding profile completion modal state (as requested by user)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [onboardingToken, setOnboardingToken] = useState<string>('');
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);

  // Profile setup fields
  const [usernameInput, setUsernameInput] = useState('');
  const [birthYear, setBirthYear] = useState('2000');
  const [birthMonth, setBirthMonth] = useState('01');
  const [birthDay, setBirthDay] = useState('15');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('male');
  const [country, setCountry] = useState('Myanmar (Burma)');

  // Forgot password dialog
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Sign up mode toggle
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Auto-fill username when pendingUser changes
  useEffect(() => {
    if (pendingUser) {
      const suggested = pendingUser.handle?.replace(/^@/, '') || pendingUser.email?.split('@')[0] || 'coom_user';
      setUsernameInput(suggested);
    }
  }, [pendingUser]);

  // Handle standard Credential Login
  const handleCredentialLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const res = await api.loginCredentials({
        identifier: identifier.trim(),
        password,
      });

      if (res.success && res.user && res.token) {
        if (res.needsOnboarding) {
          setOnboardingToken(res.token);
          setPendingUser(res.user);
          setIsOnboardingOpen(true);
        } else {
          showToast(`Welcome back, ${res.user.name}!`);
          setTimeout(() => {
            onAuthSuccess(res.user, res.token!);
          }, 400);
        }
      } else {
        setErrorMessage(res.error || 'Failed to sign in');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error during sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger social provider authorization popup / modal
  const handleOpenSocialAuth = (prov: SocialProvider) => {
    const details: Record<SocialProvider, { name: string; icon: string; brandColor: string; description: string }> = {
      google: {
        name: 'Google Mail & Workspace',
        icon: 'G',
        brandColor: '#4285F4',
        description: 'Authorize CooM to verify your Google identity and email.',
      },
      apple: {
        name: 'Apple ID',
        icon: '',
        brandColor: '#FFFFFF',
        description: 'Sign in with Apple securely using FaceID/TouchID or Apple ID.',
      },
      facebook: {
        name: 'Facebook Social API',
        icon: 'f',
        brandColor: '#1877F2',
        description: 'Connect your Facebook profile to synchronize friends & meetings.',
      },
      x: {
        name: 'X (Twitter) Developer API',
        icon: '𝕏',
        brandColor: '#FFFFFF',
        description: 'Authorize CooM on X to access your handle and timeline profile.',
      },
      tiktok: {
        name: 'TikTok Creator API',
        icon: '♪',
        brandColor: '#00F2FE',
        description: 'Link your TikTok account to broadcast vertical shorts and streams.',
      },
      email: {
        name: 'Email Account',
        icon: '@',
        brandColor: '#A855F7',
        description: 'Authorize using standard email credentials.',
      },
    };

    setActiveSocialAuth({
      provider: prov,
      ...details[prov],
    });
  };

  // Confirm Social Authorization and fetch user token
  const handleConfirmSocialAuth = async () => {
    if (!activeSocialAuth) return;
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const prov = activeSocialAuth.provider;
      const cleanEmail = identifier.includes('@') ? identifier.trim() : `${prov}_user@coom.app`;
      const res = await api.connectSocial({
        provider: prov as any,
        email: cleanEmail,
        name: `${prov.toUpperCase()} User`,
        socialId: `soc_${Date.now()}`,
      });

      if (res.success && res.user && res.token) {
        setActiveSocialAuth(null);
        // Requirement: "authorised connect ရတာနဲ့ @username / birthday / male&female / country and စတဲ့ ဟာတွေ drop / down နဲ့ ရွေးခိုင်းပီး စသုံးနိုင်အောင်လုပ်ပါ"
        setOnboardingToken(res.token);
        setPendingUser(res.user);
        setIsOnboardingOpen(true);
      } else {
        setErrorMessage(res.error || `Failed to authorize with ${activeSocialAuth.name}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authorization failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Completed Profile Setup
  const handleCompleteProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) {
      setErrorMessage('Please choose a username');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const formattedHandle = usernameInput.trim().startsWith('@')
        ? usernameInput.trim()
        : `@${usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')}`;

      const birthdayFormatted = `${birthYear}-${birthMonth}-${birthDay}`;

      const res = await api.completeProfile({
        token: onboardingToken,
        handle: formattedHandle,
        birthday: birthdayFormatted,
        gender,
        country,
        name: pendingUser?.name || formattedHandle.replace('@', ''),
      });

      if (res.success && res.user) {
        showToast('🎉 Profile successfully created! Welcome to CooM.');
        setIsOnboardingOpen(false);
        setTimeout(() => {
          onAuthSuccess(res.user, onboardingToken);
        }, 500);
      } else {
        setErrorMessage(res.error || 'Failed to complete profile');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate age from dropdowns
  const currentYear = new Date().getFullYear();
  const calculatedAge = currentYear - parseInt(birthYear || '2000', 10);

  // Countries List with flag emojis
  const countriesList = [
    { code: 'MM', name: 'Myanmar (Burma)', flag: '🇲🇲' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  ];

  return (
    <div
      id="coom-auth-screen"
      className="relative w-full h-[100dvh] min-h-[100dvh] bg-[#05020a] text-white flex items-center justify-center overflow-x-hidden overflow-y-auto selection:bg-purple-600 selection:text-white p-3 sm:p-6"
    >
      {/* ============================================================ */}
      {/* 1. LUXURIOUS ELECTRIC PURPLE & MAGENTA NEBULA BACKGROUND      */}
      {/*    (Exact match to the flowing violet ribbon wave screenshot)  */}
      {/* ============================================================ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Deep space base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06020c] via-[#090317] to-[#040108]" />

        {/* Diagonal Glowing Violet Ribbon Wave 1 (Bottom Left to Top Right) */}
        <div
          className="absolute -left-[30%] bottom-0 w-[140%] h-[90%] opacity-85 blur-[45px] pointer-events-none transform -rotate-12"
          style={{
            background:
              'radial-gradient(ellipse at 30% 60%, rgba(192, 38, 211, 0.45), rgba(147, 51, 234, 0.35) 45%, rgba(88, 28, 135, 0.15) 75%, transparent 90%)',
          }}
        />

        {/* Sharp Luminous Light Streak Bands (Neon Magenta / Electric Violet) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 1000 1000"
        >
          <defs>
            <linearGradient id="neonGlow1" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d946ef" stopOpacity="0" />
              <stop offset="35%" stopColor="#c026d3" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="65%" stopColor="#9333ea" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="neonGlow2" x1="0%" y1="90%" x2="100%" y2="20%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
              <stop offset="40%" stopColor="#e879f9" stopOpacity="0.5" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="70%" stopColor="#7e22ce" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b0764" stopOpacity="0" />
            </linearGradient>
            <filter id="glowBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="14" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Sweeping ribbon curves matching the attached screenshot */}
          <path
            d="M -150 950 C 250 820, 500 500, 1150 180"
            fill="none"
            stroke="url(#neonGlow1)"
            strokeWidth="38"
            filter="url(#glowBlur)"
          />
          <path
            d="M -100 880 C 300 780, 550 460, 1100 120"
            fill="none"
            stroke="url(#neonGlow2)"
            strokeWidth="18"
            filter="url(#glowBlur)"
          />
          <path
            d="M -200 1020 C 200 900, 450 560, 1200 240"
            fill="none"
            stroke="rgba(240, 171, 252, 0.4)"
            strokeWidth="6"
            filter="url(#glowBlur)"
          />
        </svg>

        {/* Fine Stardust Particle Field (Dot Grid) */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(232, 121, 249, 0.6) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Ambient Top Vignette */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-white/95 text-neutral-900 text-xs sm:text-sm font-semibold shadow-[0_10px_30px_rgba(168,85,247,0.4)] flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-3 border border-purple-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. AUTHENTIC PHONE-FRAME / LOGIN CARD CONTAINER              */}
      {/*    (Exact layout and styling of the attached image)          */}
      {/* ============================================================ */}
      <div
        id="coom-login-card"
        className="relative z-10 w-full max-w-[390px] sm:max-w-[420px] mx-auto flex flex-col items-center justify-between py-6 sm:py-8 px-5 sm:px-7 rounded-[44px] sm:rounded-[48px] bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_80px_rgba(147,51,234,0.25)] min-h-[640px]"
      >
        {/* TOP CENTER EMBLEM: Black squircle with radiant purple backlight & CooM */}
        <div className="flex flex-col items-center justify-center pt-2 sm:pt-4 mb-6">
          <div className="relative group cursor-pointer">
            {/* Ambient Electric Violet Back-Glow */}
            <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-fuchsia-600 via-purple-600 to-indigo-600 blur-2xl opacity-75 group-hover:opacity-100 transition duration-700 animate-pulse" />

            {/* Black Squircle Badge */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] sm:rounded-[32px] bg-[#0c0817]/90 border border-white/15 shadow-2xl flex items-center justify-center backdrop-blur-xl">
              {/* Bold Metallic Silver-White CooM Brand Wordmark */}
              <span className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(255,255,255,0.4)]">
                CooM
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. CREDENTIALS FORM (Email/Username, Password, Log In)       */}
        {/* ============================================================ */}
        <form onSubmit={handleCredentialLogin} className="w-full space-y-3.5 my-auto">
          {/* Input 1: Email or Username */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-300 transition">
              <User className="w-5 h-5 stroke-[1.75]" />
            </div>
            <input
              type="text"
              id="input-login-identifier"
              placeholder="Email or Username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full h-13 pl-12 pr-4 rounded-2xl bg-[#1c152d]/65 hover:bg-[#231b38]/75 focus:bg-[#261d3d]/90 border border-white/10 focus:border-purple-400 text-white placeholder-slate-400 text-sm outline-none transition backdrop-blur-md shadow-inner"
            />
          </div>

          {/* Input 2: Password with Eye Toggle */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-purple-300 transition">
              <Lock className="w-5 h-5 stroke-[1.75]" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="input-login-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-13 pl-12 pr-12 rounded-2xl bg-[#1c152d]/65 hover:bg-[#231b38]/75 focus:bg-[#261d3d]/90 border border-white/10 focus:border-purple-400 text-white placeholder-slate-400 text-sm outline-none transition backdrop-blur-md shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Forgot Password? Link */}
          <div className="flex justify-end pt-0.5">
            <button
              type="button"
              id="btn-forgot-password"
              onClick={() => {
                setForgotEmail(identifier.includes('@') ? identifier : '');
                setIsForgotModalOpen(true);
              }}
              className="text-xs text-purple-200/80 hover:text-white transition font-medium cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 text-center animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {/* Primary Action Button: Brushed Metallic Silver "Log In" Pill */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-login-submit"
              disabled={isSubmitting}
              className="relative w-full h-12 sm:h-13 rounded-full bg-gradient-to-r from-slate-300 via-white to-slate-200 hover:from-white hover:to-slate-100 text-neutral-950 font-black text-base sm:text-[17px] tracking-wide flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] shadow-[0_0_30px_rgba(168,85,247,0.45)] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin text-neutral-900" />
              ) : (
                <span>Log In</span>
              )}
            </button>
          </div>

          {/* Don't have an account? Sign Up Link */}
          <div className="text-center pt-2">
            <button
              type="button"
              id="btn-toggle-signup"
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                handleOpenSocialAuth('email');
              }}
              className="text-xs text-purple-200/80 hover:text-white transition font-medium"
            >
              Don&apos;t have an account? <strong className="text-white underline font-bold">Sign Up</strong>
            </button>
          </div>
        </form>

        {/* ============================================================ */}
        {/* 4. SOCIAL APPS AUTHORIZED CONNECT ROW (Google, Apple, FB, X, TikTok) */}
        {/* ============================================================ */}
        <div className="w-full pt-6 border-t border-white/10 mt-auto">
          <p className="text-[11px] text-center text-purple-200/60 uppercase tracking-widest font-semibold mb-3">
            Or connect with social apps
          </p>

          <div className="flex items-center justify-center gap-3 sm:gap-3.5">
            {/* 1. Google (G) */}
            <button
              type="button"
              id="btn-social-google"
              onClick={() => handleOpenSocialAuth('google')}
              title="Connect with Google"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1b142d]/80 hover:bg-[#2b1f4a] border border-white/20 hover:border-purple-400/80 text-white font-black text-lg flex items-center justify-center transition-all transform active:scale-95 shadow-md cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition font-serif font-bold">G</span>
            </button>

            {/* 2. Apple () */}
            <button
              type="button"
              id="btn-social-apple"
              onClick={() => handleOpenSocialAuth('apple')}
              title="Connect with Apple"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1b142d]/80 hover:bg-[#2b1f4a] border border-white/20 hover:border-purple-400/80 text-white text-lg flex items-center justify-center transition-all transform active:scale-95 shadow-md cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition text-xl"></span>
            </button>

            {/* 3. Facebook (f) */}
            <button
              type="button"
              id="btn-social-facebook"
              onClick={() => handleOpenSocialAuth('facebook')}
              title="Connect with Facebook"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1b142d]/80 hover:bg-[#2b1f4a] border border-white/20 hover:border-purple-400/80 text-white font-bold text-lg flex items-center justify-center transition-all transform active:scale-95 shadow-md cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition font-serif">f</span>
            </button>

            {/* 4. X (𝕏) */}
            <button
              type="button"
              id="btn-social-x"
              onClick={() => handleOpenSocialAuth('x')}
              title="Connect with X"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1b142d]/80 hover:bg-[#2b1f4a] border border-white/20 hover:border-purple-400/80 text-white font-bold text-lg flex items-center justify-center transition-all transform active:scale-95 shadow-md cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition text-base">𝕏</span>
            </button>

            {/* 5. TikTok (Music note) */}
            <button
              type="button"
              id="btn-social-tiktok"
              onClick={() => handleOpenSocialAuth('tiktok')}
              title="Connect with TikTok"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1b142d]/80 hover:bg-[#2b1f4a] border border-white/20 hover:border-purple-400/80 text-white font-bold text-lg flex items-center justify-center transition-all transform active:scale-95 shadow-md cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition text-lg">♪</span>
            </button>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="text-[10px] text-purple-300/40 text-center pt-4">
          © 2026 CooM Inc. All rights reserved.
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. SOCIAL APP AUTHORIZED CONNECT MODAL DIALOG                */}
      {/* ============================================================ */}
      {activeSocialAuth && (
        <div
          id="social-auth-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setActiveSocialAuth(null)}
        >
          <div
            className="w-full max-w-sm rounded-[32px] bg-[#120a24] border border-purple-500/40 p-6 text-white shadow-[0_20px_70px_rgba(168,85,247,0.35)] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg">
                  {activeSocialAuth.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">{activeSocialAuth.name}</h3>
                  <p className="text-[10px] text-purple-300">Authorized OAuth Connection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSocialAuth(null)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content & Permissions */}
            <div className="space-y-3 text-xs text-purple-100/90 leading-relaxed">
              <p>{activeSocialAuth.description}</p>
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/20 space-y-2">
                <div className="text-[11px] font-bold text-purple-200">Permissions requested by CooM:</div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Public profile information &amp; Avatar</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Email address verification</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Live audio/video meeting presence</span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                id="btn-confirm-social-auth"
                disabled={isSubmitting}
                onClick={handleConfirmSocialAuth}
                className="w-full h-11 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 hover:brightness-110 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-lg shadow-purple-900/40"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize &amp; Continue</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveSocialAuth(null)}
                className="w-full h-9 rounded-full hover:bg-white/5 text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MANDATORY ONBOARDING DROPDOWNS MODAL                      */}
      {/*    (@username, Birthday, Gender, Country dropdowns)           */}
      {/*    "authorised connect ရတာနဲ့ @username / birthday /         */}
      {/*     male&female / country and စတဲ့ ဟာတွေ drop / down နဲ့      */}
      {/*     ရွေးခိုင်းပီး စသုံးနိုင်အောင်လုပ်ပါ"                            */}
      {/* ============================================================ */}
      {isOnboardingOpen && (
        <div
          id="onboarding-profile-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 animate-in fade-in"
        >
          <div
            className="w-full max-w-md rounded-[36px] bg-[#0f0720] border border-purple-500/50 p-6 sm:p-7 text-white shadow-[0_20px_90px_rgba(168,85,247,0.45)] space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-purple-500/20">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-white">Setup Your CooM Profile</h3>
                <p className="text-xs text-purple-300">အကောင့်သတ်မှတ်ချက်များ ဖြည့်စွက်ပါ</p>
              </div>
            </div>

            <form onSubmit={handleCompleteProfileSubmit} className="space-y-4">
              {/* 1. @username Handle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
                  <span>Username / Handle</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Available ✓</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 font-bold font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    id="input-onboarding-username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="your_handle"
                    className="w-full h-11 pl-9 pr-4 rounded-xl bg-[#1b1233] border border-purple-500/40 focus:border-purple-400 text-white text-sm outline-none transition font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  This will be your unique CooM mention identity (e.g. @{usernameInput || 'username'}).
                </p>
              </div>

              {/* 2. Birthday Dropdowns (Day / Month / Year) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Birthday (မွေးသက္ကရာဇ်)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200">
                    Age: {calculatedAge}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Day Dropdown */}
                  <div className="relative">
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="w-full h-11 px-3 appearance-none rounded-xl bg-[#1b1233] border border-purple-500/40 focus:border-purple-400 text-white text-xs sm:text-sm outline-none transition cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => {
                        const val = (i + 1).toString().padStart(2, '0');
                        return (
                          <option key={val} value={val} className="bg-[#120a24] text-white">
                            Day {val}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                  </div>

                  {/* Month Dropdown */}
                  <div className="relative">
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="w-full h-11 px-3 appearance-none rounded-xl bg-[#1b1233] border border-purple-500/40 focus:border-purple-400 text-white text-xs sm:text-sm outline-none transition cursor-pointer"
                    >
                      {[
                        { val: '01', name: 'Jan' },
                        { val: '02', name: 'Feb' },
                        { val: '03', name: 'Mar' },
                        { val: '04', name: 'Apr' },
                        { val: '05', name: 'May' },
                        { val: '06', name: 'Jun' },
                        { val: '07', name: 'Jul' },
                        { val: '08', name: 'Aug' },
                        { val: '09', name: 'Sep' },
                        { val: '10', name: 'Oct' },
                        { val: '11', name: 'Nov' },
                        { val: '12', name: 'Dec' },
                      ].map((m) => (
                        <option key={m.val} value={m.val} className="bg-[#120a24] text-white">
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                  </div>

                  {/* Year Dropdown */}
                  <div className="relative">
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full h-11 px-3 appearance-none rounded-xl bg-[#1b1233] border border-purple-500/40 focus:border-purple-400 text-white text-xs sm:text-sm outline-none transition cursor-pointer"
                    >
                      {Array.from({ length: 70 }, (_, i) => {
                        const y = (2015 - i).toString();
                        return (
                          <option key={y} value={y} className="bg-[#120a24] text-white">
                            {y}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 3. Gender Dropdown (male & female) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-200">Gender (ကျား/မ)</label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full h-11 px-4 appearance-none rounded-xl bg-[#1b1233] border border-purple-500/40 focus:border-purple-400 text-white text-sm outline-none transition cursor-pointer"
                  >
                    <option value="male" className="bg-[#120a24] text-white">
                      Male (ကျား)
                    </option>
                    <option value="female" className="bg-[#120a24] text-white">
                      Female (မ)
                    </option>
                    <option value="other" className="bg-[#120a24] text-white">
                      Non-Binary (အခြား)
                    </option>
                    <option value="prefer_not_to_say" className="bg-[#120a24] text-white">
                      Prefer not to say (ဖော်ပြလိုခြင်းမရှိပါ)
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                </div>
              </div>

              {/* 4. Country Dropdown with Flags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                  <span>Country / Region (နိုင်ငံ)</span>
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 px-4 appearance-none rounded-xl bg-[#1b1233] border border-purple-500/40 focus:border-purple-400 text-white text-sm outline-none transition cursor-pointer"
                  >
                    {countriesList.map((c) => (
                      <option key={c.code} value={c.name} className="bg-[#120a24] text-white">
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 pointer-events-none" />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200">
                  {errorMessage}
                </div>
              )}

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-complete-onboarding-submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-full bg-gradient-to-r from-slate-200 via-white to-slate-200 hover:from-white hover:to-slate-100 text-neutral-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-[0_0_25px_rgba(168,85,247,0.4)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-neutral-900" />
                  ) : (
                    <>
                      <span>Complete &amp; Launch CooM</span>
                      <ArrowRight className="w-4 h-4 text-neutral-900" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. FORGOT PASSWORD MODAL                                     */}
      {/* ============================================================ */}
      {isForgotModalOpen && (
        <div
          id="forgot-password-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setIsForgotModalOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-[32px] bg-[#120a24] border border-purple-500/40 p-6 text-white shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
              <h3 className="font-bold text-base text-white">Reset Password</h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {forgotSent ? (
              <div className="space-y-3 text-center py-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-xs text-slate-300">
                  Password reset instructions and verification code have been sent to{' '}
                  <strong className="text-white">{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full h-10 rounded-full bg-white text-neutral-950 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-300">
                  Enter your email address and we will send you a password recovery code.
                </p>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-[#1c152d] border border-purple-500/30 text-white text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail.includes('@')) {
                      setForgotSent(true);
                    }
                  }}
                  className="w-full h-11 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-sm"
                >
                  Send Reset Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
