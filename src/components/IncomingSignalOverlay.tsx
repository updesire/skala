import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SignalData, Person, WaveShape } from '../types';
import { LivingOrb } from './LivingOrb';
import { WaveSignatureVisualizer } from './WaveSignatureVisualizer';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';

interface IncomingSignalOverlayProps {
  currentArrival: {
    signal: SignalData;
    sender: Person;
  } | null;
  onEchoBack: (sender: Person) => void;
  onDismiss: () => void;
}

const WAVE_BADGE_CONFIG: Record<WaveShape, { icon: string; border: string; bg: string; text: string }> = {
  soft_wave: { icon: '〰️', border: 'border-cyan-400/50', bg: 'bg-cyan-500/15', text: 'text-cyan-200' },
  double_pulse: { icon: '💓', border: 'border-pink-400/50', bg: 'bg-pink-500/15', text: 'text-pink-200' },
  radiant_burst: { icon: '💥', border: 'border-amber-400/50', bg: 'bg-amber-500/15', text: 'text-amber-200' },
  starlit_flicker: { icon: '✨', border: 'border-violet-400/50', bg: 'bg-violet-500/15', text: 'text-violet-200' },
  deep_echo: { icon: '🌊', border: 'border-blue-400/50', bg: 'bg-blue-500/15', text: 'text-blue-200' },
  steady_hum: { icon: '🔆', border: 'border-emerald-400/50', bg: 'bg-emerald-500/15', text: 'text-emerald-200' },
};

export const IncomingSignalOverlay: React.FC<IncomingSignalOverlayProps> = ({
  currentArrival,
  onEchoBack,
  onDismiss,
}) => {
  const { t, isRtl } = useLanguage();

  useEffect(() => {
    if (currentArrival?.signal) {
      ambientAudio.playWaveSignatureSound(
        currentArrival.signal.waveShape,
        currentArrival.signal.intensity,
        currentArrival.signal.rhythmSpeed || 1.0
      );
    }
  }, [currentArrival?.signal?.id]);

  if (!currentArrival) return null;
  const { signal, sender } = currentArrival;
  const waveKey = (signal.waveShape || 'soft_wave') as WaveShape;
  const badge = WAVE_BADGE_CONFIG[waveKey] || WAVE_BADGE_CONFIG.soft_wave;
  const waveLabel = t.waves[waveKey]?.label || waveKey;
  const waveDesc = t.waves[waveKey]?.desc || '';
  const intensityPct = Math.round((signal.intensity || 0.6) * 100);

  return (
    <AnimatePresence>
      {/* Centered Modal Backdrop and Presentation Box */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
        {/* Soft Ambient Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onDismiss}
          className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
        />

        {/* Large Centered In-App Notification Card */}
        <motion.div
          id="incoming-signal-presence-notification"
          initial={{ opacity: 0, scale: 0.88, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-md sm:max-w-lg overflow-hidden rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl backdrop-blur-3xl z-10 flex flex-col gap-6 ${
            isRtl ? 'rtl text-right' : 'ltr text-left'
          }`}
          style={{
            background: `radial-gradient(circle at 50% 0%, ${sender.color.ambient} 0%, rgba(10, 12, 17, 0.96) 80%)`,
            boxShadow: `0 0 60px ${sender.color.glow}, 0 25px 60px rgba(0, 0, 0, 0.9)`,
          }}
        >
          {/* Top Row: Sender Info & Close Button */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <LivingOrb
                  person={sender}
                  color={sender.color}
                  texture={sender.texture}
                  size={58}
                  isSelected={true}
                />
                {/* Ping ring */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1.8], opacity: [0.8, 0.4, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ border: `2px solid ${sender.color.accent}` }}
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-lg font-semibold text-zinc-100" style={{ color: sender.color.accent }}>
                    {sender.name}
                  </span>
                  <span className="text-xs text-zinc-400 font-light">{t.reachedYou}</span>
                </div>
                <span className="text-xs text-zinc-400 font-light mt-0.5">
                  ارتباط فرکانسی و رزونانس حضور زنده
                </span>
              </div>
            </div>

            <button
              id="btn-dismiss-incoming"
              onClick={onDismiss}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white flex items-center justify-center text-sm transition-all cursor-pointer shrink-0 active:scale-95"
              title={t.dissolve}
            >
              ✕
            </button>
          </div>

          {/* Center Visualizer & Wave Signature Card */}
          <div className="flex flex-col gap-3.5 bg-black/40 rounded-2xl p-4 sm:p-5 border border-white/10">
            <div className="flex items-center justify-between gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.border} ${badge.bg} ${badge.text}`}>
                <span>{badge.icon}</span>
                <span>{waveLabel}</span>
                <span className="opacity-75 font-mono text-[11px]">({intensityPct}٪)</span>
              </div>
              <span className="text-[11px] text-zinc-400 font-light">
                {waveDesc}
              </span>
            </div>

            {/* Live animated waveform visualizer */}
            <div className="w-full h-14 sm:h-16 bg-black/50 rounded-xl px-3 flex items-center justify-center border border-white/5 overflow-hidden">
              <WaveSignatureVisualizer
                waveShape={waveKey}
                color={sender.color}
                intensity={signal.intensity || 0.6}
                rhythmSpeed={signal.rhythmSpeed || 1.0}
                height={52}
                className="w-full"
              />
            </div>

            {/* Shared Meaning / Quote */}
            {signal.sharedMeaning && (
              <div
                className="rounded-xl p-3 text-center border border-white/5"
                style={{ backgroundColor: sender.color.ambient }}
              >
                <p className="text-sm sm:text-base text-zinc-100 font-medium italic">
                  «{signal.sharedMeaning}»
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              id="btn-echo-back-signal"
              onClick={() => onEchoBack(sender)}
              className="w-full sm:flex-1 py-3.5 px-5 rounded-2xl text-sm font-semibold tracking-wide uppercase text-black transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-lg flex items-center justify-center gap-2"
              style={{
                backgroundColor: sender.color.accent,
                boxShadow: `0 0 25px ${sender.color.glow}`,
              }}
            >
              <span>✨</span>
              <span>{t.echoResonance}</span>
            </button>

            <button
              id="btn-dismiss-incoming-bottom"
              onClick={onDismiss}
              className="w-full sm:w-auto py-3.5 px-5 rounded-2xl text-xs text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-98 text-center"
            >
              {t.dissolve}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
