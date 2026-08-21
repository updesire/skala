import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Person, UserIdentity } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, Activity, HeartHandshake } from 'lucide-react';

interface CoTouchResonanceHUDProps {
  isActive: boolean;
  partnerName: string;
  partnerColor?: string;
  user: UserIdentity;
  harmonyScore?: number;
  durationSeconds?: number;
}

export const CoTouchResonanceHUD: React.FC<CoTouchResonanceHUDProps> = ({
  isActive,
  partnerName,
  partnerColor = '#df8a5a',
  user,
  harmonyScore = 95,
  durationSeconds = 0,
}) => {
  const { t, isRtl } = useLanguage();

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="co-touch-resonance-hud"
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        className={`fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-full border shadow-2xl flex items-center gap-3 select-none pointer-events-none ${
          isRtl ? 'rtl' : 'ltr'
        }`}
        style={{
          backgroundColor: 'rgba(9, 10, 14, 0.88)',
          borderColor: partnerColor,
          boxShadow: `0 0 35px ${partnerColor}40, inset 0 0 15px ${partnerColor}20`,
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Animated Double Heartbeat / Plasma Core */}
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: partnerColor }}
          />
          <motion.div
            animate={{ scale: [1, 2.2, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeOut' }}
            className="absolute w-4 h-4 rounded-full border"
            style={{ borderColor: partnerColor }}
          />
        </div>

        {/* Status Text & Partner Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
            <span>{user.name}</span>
            <span className="text-zinc-400">✦</span>
            <span style={{ color: partnerColor }}>{partnerName}</span>
          </div>
          <span className="text-[10px] text-zinc-400">
            {t.coTouchActive} • طنین پیوسته ۴۳۲Hz
          </span>
        </div>

        {/* Harmony Score Pill */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-zinc-200 font-mono">
          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>{harmonyScore}%</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
