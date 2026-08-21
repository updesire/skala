import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserIdentity, PresenceState, OrbTexture, OrbColor } from '../types';
import { ORB_PALETTES } from '../data/initialData';
import { useLanguage } from '../context/LanguageContext';
import { LivingOrb } from './LivingOrb';
import { Sparkles, Heart, Compass, Check, Mail, Crown } from 'lucide-react';

interface InvitedGuestJoinModalProps {
  hostName: string;
  spaceId: string;
  onJoin: (guestIdentity: UserIdentity) => void;
}

export const InvitedGuestJoinModal: React.FC<InvitedGuestJoinModalProps> = ({
  hostName,
  spaceId,
  onJoin,
}) => {
  const { t, isRtl } = useLanguage();

  const [name, setName] = useState(() => {
    try {
      const saved = localStorage.getItem('skala_user_identity') || localStorage.getItem('aetheria_user_identity');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.name && parsed.name !== 'You' && parsed.name !== 'شما') {
          return parsed.name;
        }
      }
      return '';
    } catch {
      return '';
    }
  });

  const [email, setEmail] = useState(() => {
    try {
      const saved = localStorage.getItem('skala_user_identity') || localStorage.getItem('aetheria_user_identity');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) return parsed.email;
      }
      return '';
    } catch {
      return '';
    }
  });

  const [selectedColor, setSelectedColor] = useState<OrbColor>(() => {
    try {
      const saved = localStorage.getItem('skala_user_identity') || localStorage.getItem('aetheria_user_identity');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.color) return parsed.color;
      }
      return ORB_PALETTES.cyan;
    } catch {
      return ORB_PALETTES.cyan;
    }
  });
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
    id: email ? `user-${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}` : undefined,
    name: name.trim() || 'همراه مهمان',
    email: email.trim().toLowerCase() || undefined,
    isAdmin: true,
    isSuperAdmin: isSuperAdminEmail,
    color: selectedColor,
    presence: selectedPresence,
    texture: selectedTexture,
    motionPersonality: 'meditative',
    breathRate,
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onJoin(previewIdentity);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-fade-in select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative w-full max-w-md rounded-3xl bg-zinc-950/95 border border-cyan-400/30 p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col gap-4 sm:gap-5 text-white max-h-[92dvh] overflow-y-auto"
      >
        {/* Glow ambient */}
        <div
          className="absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: selectedColor.primary }}
        />

        {/* Header with host welcome */}
        <div className="flex flex-col items-center text-center gap-2 border-b border-white/10 pb-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold tracking-wide text-zinc-100">
            {t.guestWelcomeTitle}
          </h2>
          <p className="text-xs text-cyan-200 font-light leading-relaxed max-w-xs">
            {t.guestWelcomeSubtitle.replace('{host}', hostName || 'مدیر فضا')}
          </p>
        </div>

        {/* Super admin detected */}
        {isSuperAdminEmail && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-start">
              <span className="text-xs font-bold text-amber-300">
                مدیر ارشد سامانه (Super Admin)
              </span>
              <span className="text-[10px] text-zinc-300">
                دسترسی کامل مدیریتی به این حلقه و ایجاد حلقه‌های دلخواه
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
              isCenter={false}
              size={76}
            />
          </div>
          <span className="text-xs text-zinc-300 font-medium mt-2">
            {name.trim() ? name : 'گوی نوری شما در فضا'}
          </span>
          <span className="text-[10px] text-zinc-500 font-light">
            {t.presenceStates[selectedPresence]?.label}
          </span>
        </div>

        <form onSubmit={handleJoin} className="flex flex-col gap-3.5">
          {/* Guest Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              {t.yourNameLabel} <span className="text-rose-400">*</span>
            </label>
            <input
              id="input-guest-name"
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: سارا، مهدی، آرمین..."
              className="bg-zinc-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Guest Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-amber-300" />
              ایمیل شما <span className="text-rose-400">*</span>
            </label>
            <input
              id="input-guest-email"
              type="email"
              required
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="you@example.com"
              className="bg-zinc-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>

          {/* Color Aura Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-zinc-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-300" />
              {t.baseIdentityTone}
            </label>
            <div className="flex items-center gap-2 justify-center py-1">
              {Object.entries(ORB_PALETTES).map(([key, palette]) => {
                const isPicked = selectedColor.primary === palette.primary;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedColor(palette)}
                    className={`w-8 h-8 rounded-full transition-transform cursor-pointer relative flex items-center justify-center ${
                      isPicked ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-105 opacity-80'
                    }`}
                    style={{ background: palette.primary }}
                  >
                    {isPicked && <Check className="w-3.5 h-3.5 text-black" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit / Join Button */}
          <button
            id="btn-join-live-space"
            type="submit"
            disabled={!name.trim() || !email.trim()}
            className="w-full py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-400/25 flex items-center justify-center gap-2 mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.joinLiveSpaceBtn}</span>
          </button>
        </form>
      </motion.div>
    </div>
  );
};
