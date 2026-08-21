import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserIdentity, OrbColor, PresenceState, OrbTexture } from '../types';
import { ORB_PALETTES } from '../data/initialData';
import { LivingOrb } from './LivingOrb';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  Sparkles,
  Check,
  X,
  Crown,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  KeyRound
} from 'lucide-react';

interface AuthModalProps {
  currentUser?: UserIdentity;
  onLoginSuccess: (user: UserIdentity, token: string) => void;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  onLoginSuccess,
  onClose,
  initialMode = 'login',
}) => {
  const { isRtl } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form states
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(currentUser?.name && currentUser.name !== 'You' && currentUser.name !== 'شما' ? currentUser.name : '');
  const [selectedColor, setSelectedColor] = useState<OrbColor>(currentUser?.color || ORB_PALETTES.solar);
  const [selectedPresence, setSelectedPresence] = useState<PresenceState>(currentUser?.presence || 'present');
  const [selectedTexture, setSelectedTexture] = useState<OrbTexture>(currentUser?.texture || 'aurora');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isSuperAdminEmail = email.trim().toLowerCase() === 'soraun.com@gmail.com';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('لطفاً ایمیل خود را وارد نمایید');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ورود به حساب');
      }

      if (data.sessionToken) {
        localStorage.setItem('skala_session_token', data.sessionToken);
      }

      ambientAudio.playSignalResonance(0.9);
      setSuccessMsg('ورود با موفقیت انجام شد ✨');

      setTimeout(() => {
        onLoginSuccess(data.user, data.sessionToken);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMsg('نام و ایمیل الزامی هستند');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim() || undefined,
          color: selectedColor,
          texture: selectedTexture,
          presence: selectedPresence,
          breathRate: 4.5,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ثبت‌نام حساب');
      }

      if (data.sessionToken) {
        localStorage.setItem('skala_session_token', data.sessionToken);
      }

      ambientAudio.playSignalResonance(0.9);
      setSuccessMsg('ثبت‌نام و ایجاد حساب با موفقیت انجام شد ✨');

      setTimeout(() => {
        onLoginSuccess(data.user, data.sessionToken);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت‌نام');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSuperAdminFill = () => {
    setEmail('soraun.com@gmail.com');
    setName('مدیر ارشد (soraun)');
    setSelectedColor(ORB_PALETTES.solar);
    setSelectedTexture('aurora');
    setSelectedPresence('present');
    ambientAudio.playRippleTone(550);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl ${
        isRtl ? 'rtl' : 'ltr'
      }`}
    >
      <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[94dvh]">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
              {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-light text-zinc-100">
                {mode === 'login'
                  ? (isRtl ? 'ورود به حساب کاربری' : 'Sign In to Account')
                  : (isRtl ? 'ثبت‌نام حساب کاربری جدید' : 'Create New Account')}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {isRtl ? 'اتصال امن به پایگاه داده MySQL و سرور' : 'Secure persistence with MySQL backend'}
              </p>
            </div>
          </div>

          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1.5 mx-4 sm:mx-6 mt-4 bg-white/5 border border-white/5 rounded-2xl gap-1">
          <button
            id="tab-auth-login"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{isRtl ? 'ورود به حساب' : 'Sign In'}</span>
          </button>

          <button
            id="tab-auth-register"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{isRtl ? 'ثبت‌نام جدید' : 'Register'}</span>
          </button>
        </div>

        {/* Super Admin Quick Helper Pill */}
        <div className="px-4 sm:px-6 pt-3">
          <button
            id="btn-fill-superadmin"
            type="button"
            onClick={handleQuickSuperAdminFill}
            className="w-full p-2.5 rounded-2xl bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] flex items-center justify-between transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-300" />
              <span>{isRtl ? 'ورود مدیر ارشد (soraun.com@gmail.com)' : 'Fill Super Admin credentials'}</span>
            </div>
            <span className="text-[10px] bg-amber-400/20 px-2 py-0.5 rounded-md font-mono">👑 Super Admin</span>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isRtl ? 'آدرس ایمیل *' : 'Email Address *'}</span>
                </label>
                <input
                  id="input-auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 font-mono transition-all"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isRtl ? 'رمز عبور (اختیاری یا تعیین‌شده)' : 'Password (Optional)'}</span>
                </label>
                <input
                  id="input-auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 font-mono transition-all"
                />
              </div>

              <button
                id="btn-submit-auth-login"
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3.5 rounded-2xl text-xs uppercase tracking-widest font-semibold bg-amber-400 hover:bg-amber-300 text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40 mt-2"
              >
                {loading ? (
                  <span>{isRtl ? 'در حال برقراری اتصال...' : 'Authenticating...'}</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>{isRtl ? 'ورود به حساب کاربری' : 'Sign In'}</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isRtl ? 'نام و نام خانوادگی *' : 'Full Name *'}</span>
                </label>
                <input
                  id="input-reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: سهراب / مریم"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 transition-all"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isRtl ? 'آدرس ایمیل *' : 'Email Address *'}</span>
                </label>
                <input
                  id="input-reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 font-mono transition-all"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isRtl ? 'تعیین رمز عبور' : 'Set Password'}</span>
                </label>
                <input
                  id="input-reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="حداقل ۴ کاراکتر"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 font-mono transition-all"
                />
              </div>

              {/* Identity Color Palette */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest text-zinc-400">
                  {isRtl ? 'رنگ هویت نوری' : 'Orb Tone'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ORB_PALETTES).map(([k, col]) => (
                    <button
                      type="button"
                      key={k}
                      id={`btn-reg-color-${k}`}
                      onClick={() => setSelectedColor(col)}
                      className={`w-8 h-8 rounded-full border transition-all cursor-pointer ${
                        selectedColor.name === col.name ? 'scale-110 border-white ring-2 ring-amber-400/50' : 'border-transparent opacity-80'
                      }`}
                      style={{ background: col.primary }}
                    />
                  ))}
                </div>
              </div>

              <button
                id="btn-submit-auth-register"
                type="submit"
                disabled={loading || !name.trim() || !email.trim()}
                className="w-full py-3.5 rounded-2xl text-xs uppercase tracking-widest font-semibold bg-amber-400 hover:bg-amber-300 text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40 mt-2"
              >
                {loading ? (
                  <span>{isRtl ? 'در حال ثبت در دیتابیس...' : 'Registering...'}</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{isRtl ? 'ثبت‌نام حساب جدید' : 'Create Account'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};
