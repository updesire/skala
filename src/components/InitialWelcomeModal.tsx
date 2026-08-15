import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserIdentity, PresenceState, OrbTexture, OrbColor } from '../types';
import { ORB_PALETTES } from '../data/initialData';
import { useLanguage } from '../context/LanguageContext';
import { LivingOrb } from './LivingOrb';
import { ambientAudio } from '../services/audio';
import { Sparkles, Check, UserCheck, Shield, Mail, Crown } from 'lucide-react';

interface InitialWelcomeModalProps {
  initialUser: UserIdentity;
  onRegister: (identity: UserIdentity) => void;
}

export const InitialWelcomeModal: React.FC<InitialWelcomeModalProps> = ({
  initialUser,
  onRegister,
}) => {
  const { t, isRtl, language } = useLanguage();

  const [name, setName] = useState(initialUser.name && initialUser.name !== 'You' && initialUser.name !== 'شما' ? initialUser.name : '');
  const [email, setEmail] = useState(initialUser.email || '');
  const [selectedColor, setSelectedColor] = useState<OrbColor>(initialUser.color || ORB_PALETTES.cyan);
  const [selectedPresence, setSelectedPresence] = useState<PresenceState>('present');
  const [selectedTexture, setSelectedTexture] = useState<OrbTexture>('fluid');
  const [breathRate] = useState<number>(4.5);

  const isSuperAdminEmail = email.trim().toLowerCase() === 'soraun.com@gmail.com';

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (val.trim().toLowerCase() === 'soraun.com@gmail.com') {
      setSelectedColor(ORB_PALETTES.amber);
      setSelectedTexture('aurora');
    }
  };

  const previewIdentity: UserIdentity = {
    ...initialUser,
    id: email ? `user-${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}` : initialUser.id,
    name: name.trim() || (language === 'fa' ? 'شما' : 'You'),
    email: email.trim().toLowerCase() || undefined,
    isAdmin: true,
    isSuperAdmin: isSuperAdminEmail,
    color: selectedColor,
    presence: selectedPresence,
    texture: selectedTexture,
    motionPersonality: 'meditative',
    breathRate,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    ambientAudio.playSignalResonance(0.8);
    onRegister(previewIdentity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-fade-in select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative w-full max-w-md rounded-3xl bg-zinc-950/95 border border-white/15 p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col gap-4 sm:gap-5 text-white max-h-[92dvh] overflow-y-auto"
      >
        {/* Glow ambient background */}
        <div
          className="absolute -top-28 -left-28 w-64 h-64 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-700"
          style={{ background: selectedColor.primary }}
        />

        {/* Header with Title */}
        <div className="flex flex-col items-center text-center gap-1.5 border-b border-white/10 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white mb-1 shadow-inner">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <h2 className="text-lg font-semibold tracking-wide text-zinc-100">
            {language === 'fa' ? 'ثبت نام و ایجاد هویت نوری' : 'Register Spatial Identity'}
          </h2>
          <p className="text-xs text-zinc-400 font-light leading-relaxed max-w-xs">
            {language === 'fa'
              ? 'با ثبت ایمیل، می‌توانید حلقه‌های اختصاصی خود را بسازید، افراد را دعوت کنید و هویتتان ذخیره بماند.'
              : 'Register your email to create custom circles, invite people, and preserve your identity.'}
          </p>
        </div>

        {/* Super admin detected badge */}
        {isSuperAdminEmail && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-start">
              <span className="text-xs font-bold text-amber-300">
                {language === 'fa' ? 'شناسایی به عنوان مدیر ارشد سیستم' : 'Super Admin Recognized'}
              </span>
              <span className="text-[10px] text-zinc-300">
                {language === 'fa' ? 'دسترسی کامل مدیریتی به تمامی حلقه‌ها فعال شد' : 'Master access enabled'}
              </span>
            </div>
          </div>
        )}

        {/* Living Orb Preview */}
        <div className="flex flex-col items-center justify-center py-1">
          <div className="w-20 h-20 relative flex items-center justify-center">
            <LivingOrb
              color={selectedColor}
              presence={selectedPresence}
              texture={selectedTexture}
              breathRate={breathRate}
              isCenter={true}
              size={78}
            />
          </div>
          <span className="text-xs text-zinc-200 font-medium mt-2">
            {name.trim() ? name : (language === 'fa' ? 'گوی نوری شما' : 'Your Living Orb')}
          </span>
          <span className="text-[10px] text-zinc-500 font-light">
            {t.presenceStates[selectedPresence]?.label}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-300 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-300" />
                {t.yourNameLabel} <span className="text-rose-400">*</span>
              </span>
            </label>
            <input
              id="input-onboarding-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'fa' ? 'مثلاً: علی، سارا، امید...' : 'e.g. Alex, Sarah, David...'}
              className="bg-zinc-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>

          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-300 font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-300" />
                {language === 'fa' ? 'ایمیل شما (برای ساخت و مدیریت حلقه)' : 'Email Address'} <span className="text-rose-400">*</span>
              </span>
            </label>
            <input
              id="input-onboarding-email"
              type="email"
              required
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="you@example.com"
              className="bg-zinc-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
            />
          </div>

          {/* Color Aura Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400">
              {t.baseIdentityTone}
            </label>
            <div className="flex items-center gap-2 justify-center py-1 flex-wrap">
              {Object.entries(ORB_PALETTES).map(([key, palette]) => {
                const isPicked = selectedColor.primary === palette.primary;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedColor(palette);
                      ambientAudio.playRippleTone(440);
                    }}
                    className={`w-8 h-8 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                      isPicked ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-105 opacity-80'
                    }`}
                    style={{ background: palette.primary }}
                    title={palette.name}
                  >
                    {isPicked && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-zinc-400">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {language === 'fa'
                ? 'اطلاعات شما ذخیره شده و می‌توانید گروه‌ها و حلقه‌های اختصاصی خود را بسازید.'
                : 'Your registration is preserved and allows you to create your own circles.'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            id="btn-complete-initial-registration"
            type="submit"
            disabled={!name.trim() || !email.trim()}
            className="w-full py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 text-black text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-400/25 flex items-center justify-center gap-2 mt-1"
          >
            <Sparkles className="w-4 h-4" />
            <span>{language === 'fa' ? 'ثبت نام و ورود به فضا' : 'Register & Enter Space'}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
