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
      className="relative w-full h-[100dvh] min-h-[100dvh] bg-[#0B0F19] text-slate-100 flex items-center justify-center overflow-x-hidden overflow-y-auto selection:bg-indigo-500/30 selection:text-indigo-200 p-3 sm:p-6"
    >
      {/* ============================================================ */}
      {/* 1. SOOTHING MIDNIGHT SLATE & SOFT INDIGO AMBIENT GLOW       */}
      {/* ============================================================ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Deep calm base */}
        <div className="absolute inset-0 bg-[#0B0F19]" />

        {/* Soft, calm ambient indigo aura */}
        <div
          className="absolute -top-[20%] -left-[10%] w-[70%] h-[60%] opacity-40 blur-[100px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(15, 23, 42, 0) 70%)',
          }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[60%] opacity-35 blur-[100px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(15, 23, 42, 0) 70%)',
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(241, 245, 249, 0.8) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Floating Status Toast */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#131B2E] text-slate-100 text-xs sm:text-sm font-semibold shadow-xl flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-3 border border-indigo-500/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. AUTHENTIC PHONE-FRAME / LOGIN CARD CONTAINER              */}
      {/* ============================================================ */}
      <div
        id="coom-login-card"
        className="relative z-10 w-full max-w-[390px] sm:max-w-[420px] mx-auto flex flex-col items-center justify-between py-6 sm:py-8 px-5 sm:px-7 rounded-[36px] sm:rounded-[40px] bg-[#131B2E]/90 backdrop-blur-xl border border-slate-700/70 shadow-[0_20px_60px_rgba(0,0,0,0.6)] min-h-[640px]"
      >
        {/* TOP CENTER EMBLEM: Soft glowing emblem with CooM */}
        <div className="flex flex-col items-center justify-center pt-2 sm:pt-4 mb-6">
          <div className="relative group cursor-pointer">
            {/* Ambient Soft Glow */}
            <div className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-xl opacity-75 group-hover:opacity-100 transition duration-500" />

            {/* Squircle Badge */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-[#1A253D] to-[#131B2E] border border-slate-700 shadow-xl flex items-center justify-center backdrop-blur-xl">
              <span className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-b from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-sm">
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
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition">
              <User className="w-5 h-5 stroke-[1.75]" />
            </div>
            <input
              type="text"
              id="input-login-identifier"
              placeholder="Email or Username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full h-13 pl-12 pr-4 rounded-2xl bg-[#1A253D] hover:bg-[#1E2B47] focus:bg-[#1E2B47] border border-slate-700/80 focus:border-indigo-400 text-slate-100 placeholder-slate-400 text-sm outline-none transition shadow-xs"
            />
          </div>

          {/* Input 2: Password with Eye Toggle */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition">
              <Lock className="w-5 h-5 stroke-[1.75]" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="input-login-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-13 pl-12 pr-12 rounded-2xl bg-[#1A253D] hover:bg-[#1E2B47] focus:bg-[#1E2B47] border border-slate-700/80 focus:border-indigo-400 text-slate-100 placeholder-slate-400 text-sm outline-none transition shadow-xs"
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
              className="text-xs text-indigo-400 hover:text-indigo-300 transition font-medium cursor-pointer"
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

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="btn-login-submit"
              disabled={isSubmitting}
              className="relative w-full h-12 sm:h-13 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
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
              className="text-xs text-slate-400 hover:text-slate-200 transition font-medium"
            >
              Don&apos;t have an account? <strong className="text-indigo-400 hover:text-indigo-300 underline font-bold ml-1">Sign Up</strong>
            </button>
          </div>
        </form>

        {/* ============================================================ */}
        {/* 4. SOCIAL APPS AUTHORIZED CONNECT ROW (Google, Apple, FB, X, TikTok) */}
        {/* ============================================================ */}
        <div className="w-full pt-6 border-t border-slate-700/80 mt-auto">
          <p className="text-[11px] text-center text-slate-400 uppercase tracking-widest font-semibold mb-3">
            Or connect with social apps
          </p>

          <div className="flex items-center justify-center gap-3 sm:gap-3.5">
            {/* 1. Google (G) */}
            <button
              type="button"
              id="btn-social-google"
              onClick={() => handleOpenSocialAuth('google')}
              title="Connect with Google"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1A253D] hover:bg-[#233152] border border-slate-700 hover:border-indigo-400/60 text-slate-200 font-black text-lg flex items-center justify-center transition active:scale-95 shadow-xs cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition font-serif font-bold">G</span>
            </button>

            {/* 2. Apple () */}
            <button
              type="button"
              id="btn-social-apple"
              onClick={() => handleOpenSocialAuth('apple')}
              title="Connect with Apple"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1A253D] hover:bg-[#233152] border border-slate-700 hover:border-indigo-400/60 text-slate-200 text-lg flex items-center justify-center transition active:scale-95 shadow-xs cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition text-xl"></span>
            </button>

            {/* 3. Facebook (f) */}
            <button
              type="button"
              id="btn-social-facebook"
              onClick={() => handleOpenSocialAuth('facebook')}
              title="Connect with Facebook"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1A253D] hover:bg-[#233152] border border-slate-700 hover:border-indigo-400/60 text-slate-200 font-bold text-lg flex items-center justify-center transition active:scale-95 shadow-xs cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition font-serif">f</span>
            </button>

            {/* 4. X (𝕏) */}
            <button
              type="button"
              id="btn-social-x"
              onClick={() => handleOpenSocialAuth('x')}
              title="Connect with X"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1A253D] hover:bg-[#233152] border border-slate-700 hover:border-indigo-400/60 text-slate-200 font-bold text-lg flex items-center justify-center transition active:scale-95 shadow-xs cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition text-base">𝕏</span>
            </button>

            {/* 5. TikTok (Music note) */}
            <button
              type="button"
              id="btn-social-tiktok"
              onClick={() => handleOpenSocialAuth('tiktok')}
              title="Connect with TikTok"
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#1A253D] hover:bg-[#233152] border border-slate-700 hover:border-indigo-400/60 text-slate-200 font-bold text-lg flex items-center justify-center transition active:scale-95 shadow-xs cursor-pointer group"
            >
              <span className="group-hover:scale-110 transition text-lg">♪</span>
            </button>
          </div>
        </div>

        {/* Footer Copyright */}
        <div className="text-[10px] text-slate-500 text-center pt-4 select-none">
          © 2026 CooM Inc. All rights reserved.
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. SOCIAL APP AUTHORIZED CONNECT MODAL DIALOG                */}
      {/* ============================================================ */}
      {activeSocialAuth && (
        <div
          id="social-auth-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setActiveSocialAuth(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-[#131B2E] border border-slate-700/80 p-6 text-slate-100 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-950/70 border border-indigo-500/30 flex items-center justify-center font-bold text-lg text-indigo-300">
                  {activeSocialAuth.icon}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">{activeSocialAuth.name}</h3>
                  <p className="text-[10px] text-indigo-400">Authorized Connection</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveSocialAuth(null)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content & Permissions */}
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p>{activeSocialAuth.description}</p>
              <div className="p-3 rounded-2xl bg-[#1A253D] border border-slate-700/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-200">Permissions requested by CooM:</div>
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
                className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-md shadow-indigo-600/30"
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
                className="w-full h-9 rounded-xl hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MANDATORY ONBOARDING DROPDOWNS MODAL                      */}
      {/* ============================================================ */}
      {isOnboardingOpen && (
        <div
          id="onboarding-profile-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in"
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#131B2E] border border-slate-700/80 p-6 sm:p-7 text-slate-100 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-700/80">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-100">Setup Your CooM Profile</h3>
                <p className="text-xs text-indigo-400">အကောင့်သတ်မှတ်ချက်များ ဖြည့်စွက်ပါ</p>
              </div>
            </div>

            <form onSubmit={handleCompleteProfileSubmit} className="space-y-4">
              {/* 1. @username Handle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span>Username / Handle</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Available ✓</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 font-bold font-mono">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    id="input-onboarding-username"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    placeholder="your_handle"
                    className="w-full h-11 pl-9 pr-4 rounded-xl bg-[#1A253D] border border-slate-700 focus:border-indigo-400 text-slate-100 text-sm outline-none transition font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  This will be your unique CooM mention identity (e.g. @{usernameInput || 'username'}).
                </p>
              </div>

              {/* 2. Birthday Dropdowns (Day / Month / Year) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Birthday (မွေးသက္ကရာဇ်)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300">
                    Age: {calculatedAge}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Day Dropdown */}
                  <div className="relative">
                    <select
                      value={birthDay}
                      onChange={(e) => setBirthDay(e.target.value)}
                      className="w-full h-11 px-3 appearance-none rounded-xl bg-[#1A253D] border border-slate-700 focus:border-indigo-400 text-slate-100 text-xs sm:text-sm outline-none transition cursor-pointer"
                    >
                      {Array.from({ length: 31 }, (_, i) => {
                        const val = (i + 1).toString().padStart(2, '0');
                        return (
                          <option key={val} value={val} className="bg-[#131B2E] text-slate-100">
                            Day {val}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Month Dropdown */}
                  <div className="relative">
                    <select
                      value={birthMonth}
                      onChange={(e) => setBirthMonth(e.target.value)}
                      className="w-full h-11 px-3 appearance-none rounded-xl bg-[#1A253D] border border-slate-700 focus:border-indigo-400 text-slate-100 text-xs sm:text-sm outline-none transition cursor-pointer"
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
                        <option key={m.val} value={m.val} className="bg-[#131B2E] text-slate-100">
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>

                  {/* Year Dropdown */}
                  <div className="relative">
                    <select
                      value={birthYear}
                      onChange={(e) => setBirthYear(e.target.value)}
                      className="w-full h-11 px-3 appearance-none rounded-xl bg-[#1A253D] border border-slate-700 focus:border-indigo-400 text-slate-100 text-xs sm:text-sm outline-none transition cursor-pointer"
                    >
                      {Array.from({ length: 70 }, (_, i) => {
                        const y = (2015 - i).toString();
                        return (
                          <option key={y} value={y} className="bg-[#131B2E] text-slate-100">
                            {y}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* 3. Gender Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">Gender (ကျား/မ)</label>
                <div className="relative">
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full h-11 px-4 appearance-none rounded-xl bg-[#1A253D] border border-slate-700 focus:border-indigo-400 text-slate-100 text-sm outline-none transition cursor-pointer"
                  >
                    <option value="male" className="bg-[#131B2E] text-slate-100">
                      Male (ကျား)
                    </option>
                    <option value="female" className="bg-[#131B2E] text-slate-100">
                      Female (မ)
                    </option>
                    <option value="other" className="bg-[#131B2E] text-slate-100">
                      Non-Binary (အခြား)
                    </option>
                    <option value="prefer_not_to_say" className="bg-[#131B2E] text-slate-100">
                      Prefer not to say (ဖော်ပြလိုခြင်းမရှိပါ)
                    </option>
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 4. Country Dropdown with Flags */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Country / Region (နိုင်ငံ)</span>
                </label>
                <div className="relative">
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 px-4 appearance-none rounded-xl bg-[#1A253D] border border-slate-700 focus:border-indigo-400 text-slate-100 text-sm outline-none transition cursor-pointer"
                  >
                    {countriesList.map((c) => (
                      <option key={c.code} value={c.name} className="bg-[#131B2E] text-slate-100">
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
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
                  className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Complete &amp; Launch CooM</span>
                      <ArrowRight className="w-4 h-4 text-white" />
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
            className="w-full max-w-sm rounded-3xl bg-[#131B2E] border border-slate-700/80 p-6 text-slate-100 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
              <h3 className="font-bold text-base text-slate-100">Reset Password</h3>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
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
                  className="w-full h-10 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition"
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
                  className="w-full h-11 px-4 rounded-xl bg-[#1A253D] border border-slate-700 text-slate-100 text-sm outline-none focus:border-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (forgotEmail.includes('@')) {
                      setForgotSent(true);
                    }
                  }}
                  className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition shadow-md shadow-indigo-600/30"
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
