import React from 'react';
import { motion } from 'motion/react';
import { UserIdentity, OrbColor, OrbTexture, MotionPersonality, PresenceState } from '../types';
import { ORB_PALETTES } from '../data/initialData';
import { LivingOrb } from './LivingOrb';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';

interface IdentityCustomizerProps {
  user: UserIdentity;
  onUpdateUser: (updated: Partial<UserIdentity>) => void;
  onClose: () => void;
}

export const IdentityCustomizer: React.FC<IdentityCustomizerProps> = ({
  user,
  onUpdateUser,
  onClose,
}) => {
  const { t, isRtl } = useLanguage();

  const textureKeys: OrbTexture[] = ['fluid', 'aurora', 'stardust', 'crystalline', 'deep_core'];
  const personalityKeys: MotionPersonality[] = ['meditative', 'lively', 'subtle', 'pulsing', 'resonant'];
  const presenceKeys: PresenceState[] = ['present', 'deep_focus', 'reaching', 'resting', 'quiet'];

  const handleColorChange = (c: OrbColor) => {
    onUpdateUser({ color: c });
    ambientAudio.playRippleTone(440);
  };

  const handleTextureChange = (tx: OrbTexture) => {
    onUpdateUser({ texture: tx });
    ambientAudio.playRippleTone(380);
  };

  const handlePersonalityChange = (m: MotionPersonality) => {
    onUpdateUser({ motionPersonality: m });
    ambientAudio.playRippleTone(320);
  };

  const handlePresenceChange = (p: PresenceState) => {
    onUpdateUser({ presence: p });
    ambientAudio.playBreathPulse(0.7);
  };

  return (
    <motion.div
      id="identity-customizer-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl ${
        isRtl ? 'rtl' : 'ltr'
      }`}
    >
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 shadow-2xl overflow-y-auto max-h-[94dvh]">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 block">{t.personalSignature}</span>
            <h2 className="text-lg font-light text-zinc-100 mt-0.5">{t.livingOrbIdentity}</h2>
            <p className="text-xs text-zinc-400">
              {t.identityDesc}
            </p>
          </div>
          <button
            id="btn-close-identity"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Live User Orb Preview */}
        <div className="flex flex-col items-center justify-center py-5 bg-white/5 rounded-2xl border border-white/5">
          <LivingOrb
            color={user.color}
            presence={user.presence}
            texture={user.texture}
            motionPersonality={user.motionPersonality}
            breathRate={user.breathRate}
            size={88}
            isUser={true}
          />
          <span className="text-xs text-zinc-300 mt-2.5 font-medium">{user.name || t.you}</span>
        </div>

        {/* User Name Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-300 font-medium flex items-center justify-between">
            <span>{t.yourNameLabel}</span>
            <span className="text-[10px] text-zinc-500 font-light">نام شما در تمامی حلقه‌ها و اعلان‌ها</span>
          </label>
          <input
            id="input-identity-name"
            type="text"
            value={user.name === 'You' || user.name === 'شما' ? '' : user.name}
            onChange={(e) => onUpdateUser({ name: e.target.value })}
            placeholder="مثلاً: علی، سارا، رضا..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Presence State Selection */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.currentPresenceState}</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presenceKeys.map((pmKey) => {
              const active = user.presence === pmKey;
              const info = t.presenceStates[pmKey];
              return (
                <button
                  key={pmKey}
                  id={`btn-presence-state-${pmKey}`}
                  onClick={() => handlePresenceChange(pmKey)}
                  className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                    active
                      ? 'border-white/40 bg-white/15 text-white'
                      : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-medium text-zinc-200">{info.label}</span>
                  <span className="text-[10px] text-zinc-500 line-clamp-1">{info.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Base Tone Palette */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.baseIdentityTone}</span>
          <div className="flex flex-wrap gap-3">
            {Object.entries(ORB_PALETTES).map(([key, col]) => {
              const active = user.color.name === col.name;
              return (
                <button
                  key={key}
                  id={`btn-color-palette-${key}`}
                  onClick={() => handleColorChange(col)}
                  className={`w-9 h-9 rounded-full transition-all border flex items-center justify-center cursor-pointer ${
                    active ? 'scale-110 border-white ring-2 ring-white/30' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: col.primary,
                    boxShadow: active ? `0 0 14px ${col.glow}` : 'none',
                  }}
                  title={col.name}
                />
              );
            })}
          </div>
        </div>

        {/* Internal Texture */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.internalTexture}</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {textureKeys.map((txKey) => {
              const active = user.texture === txKey;
              const info = t.textures[txKey];
              return (
                <button
                  key={txKey}
                  id={`btn-texture-${txKey}`}
                  onClick={() => handleTextureChange(txKey)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-white/40 bg-white/15 text-white'
                      : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-medium text-zinc-200 block">{info.label}</span>
                  <span className="text-[10px] text-zinc-500">{info.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Breath Cycle Pace */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.diaphragmaticBreathRate}</span>
            <span className="text-zinc-300 font-mono text-[11px]">{user.breathRate} {t.secondsPerCycle}</span>
          </div>
          <input
            id="slider-breath-rate"
            type="range"
            min="3.0"
            max="7.0"
            step="0.2"
            value={user.breathRate}
            onChange={(e) => onUpdateUser({ breathRate: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* Motion Personality */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.motionPersonality}</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {personalityKeys.map((mpKey) => {
              const active = user.motionPersonality === mpKey;
              const info = t.personalities[mpKey];
              return (
                <button
                  key={mpKey}
                  id={`btn-motion-personality-${mpKey}`}
                  onClick={() => handlePersonalityChange(mpKey)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? 'border-white/40 bg-white/15 text-white'
                      : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                  }`}
                >
                  <span className="text-xs font-medium text-zinc-200 block">{info.label}</span>
                  <span className="text-[10px] text-zinc-500">{info.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          id="btn-confirm-identity"
          onClick={onClose}
          className="w-full py-3 rounded-xl text-xs uppercase tracking-widest font-semibold bg-white text-black hover:bg-zinc-200 transition-all mt-2 cursor-pointer"
        >
          {t.preserveInPresence}
        </button>
      </div>
    </motion.div>
  );
};

