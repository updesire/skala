import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Person, UserIdentity, WaveShape, SharedLanguageItem, SignalData, CustomTapLoop } from '../types';
import { LivingOrb } from './LivingOrb';
import { WaveSignatureVisualizer } from './WaveSignatureVisualizer';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';
import { Music, Sparkles } from 'lucide-react';

interface SignalComposerProps {
  recipient: Person;
  user: UserIdentity;
  sharedLanguages: SharedLanguageItem[];
  savedTapLoops?: CustomTapLoop[];
  onOpenTapStudio?: () => void;
  onSendSignal: (signal: SignalData) => void;
  onCancel: () => void;
}

const WAVE_ICON_SHAPES: Record<WaveShape, string> = {
  soft_wave: 'M 0 10 Q 15 0 30 10 T 60 10',
  double_pulse: 'M 0 10 Q 10 -2 20 10 Q 30 -2 40 10 L 60 10',
  radiant_burst: 'M 30 10 m -10 0 a 10 10 0 1 0 20 0 a 10 10 0 1 0 -20 0',
  starlit_flicker: 'M 5 10 L 15 5 L 25 12 L 35 4 L 45 14 L 55 8',
  deep_echo: 'M 0 10 Q 30 -6 60 10',
  steady_hum: 'M 0 10 L 60 10',
};

export const SignalComposer: React.FC<SignalComposerProps> = ({
  recipient,
  user,
  sharedLanguages,
  savedTapLoops = [],
  onOpenTapStudio,
  onSendSignal,
  onCancel,
}) => {
  const { t, isRtl } = useLanguage();
  const [waveShape, setWaveShape] = useState<WaveShape>('soft_wave');
  const [intensity, setIntensity] = useState<number>(0.55);
  const [rhythmSpeed, setRhythmSpeed] = useState<number>(1.0);
  const [selectedMeaning, setSelectedMeaning] = useState<string>('');
  const [customMeaning, setCustomMeaning] = useState<string>('');
  const [selectedTapLoop, setSelectedTapLoop] = useState<CustomTapLoop | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  const waveTypes: WaveShape[] = [
    'soft_wave',
    'double_pulse',
    'radiant_burst',
    'starlit_flicker',
    'deep_echo',
    'steady_hum',
  ];

  // Filter shared language for this recipient
  const relevantLanguages = sharedLanguages.filter((sl) => sl.personId === recipient.id);

  // Play gentle sound feedback when adjusting signal
  const handleIntensityChange = (newVal: number) => {
    setIntensity(newVal);
    ambientAudio.playWaveSignatureSound(waveShape, newVal, rhythmSpeed);
  };

  const handleRhythmSpeedChange = (newSpeed: number) => {
    setRhythmSpeed(newSpeed);
    ambientAudio.playWaveSignatureSound(waveShape, intensity, newSpeed);
  };

  const handleWaveSelect = (shape: WaveShape) => {
    setWaveShape(shape);
    ambientAudio.playWaveSignatureSound(shape, intensity, rhythmSpeed);
  };

  const handleSelectLanguage = (sl: SharedLanguageItem) => {
    setWaveShape(sl.waveShape);
    setIntensity(sl.intensity);
    setSelectedMeaning(sl.label);
    ambientAudio.playWaveSignatureSound(sl.waveShape, sl.intensity, rhythmSpeed);
  };

  const handleTransmit = () => {
    if (isSending) return;
    setIsSending(true);

    const meaning = customMeaning.trim() || selectedMeaning || (selectedTapLoop ? selectedTapLoop.name : undefined);

    const newSignal: SignalData = {
      id: `sig-${Date.now()}`,
      senderId: 'user',
      recipientId: recipient.id,
      waveShape,
      intensity,
      rhythmSpeed,
      duration: selectedTapLoop ? (selectedTapLoop.totalDuration / 1000) : 3.5,
      color: recipient.color,
      sharedMeaning: meaning,
      customTapLoop: selectedTapLoop || undefined,
      createdAt: Date.now(),
    };

    ambientAudio.playWaveSignatureSound(waveShape, intensity, rhythmSpeed);
    onSendSignal(newSignal);
  };

  return (
    <motion.div
      id="signal-composer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-0 z-40 overflow-y-auto min-h-[100dvh] flex flex-col items-center justify-between p-3 sm:p-6 md:p-8 pointer-events-auto select-none gap-3 sm:gap-4 ${
        isRtl ? 'rtl' : 'ltr'
      }`}
      style={{
        background: `radial-gradient(circle at 50% 30%, ${recipient.color.ambient} 0%, rgba(9, 10, 13, 0.95) 75%)`,
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Top Header info (Intimate & minimal) */}
      <div className="w-full max-w-xl flex justify-between items-center text-zinc-400 pt-1">
        <button
          id="btn-cancel-signal"
          onClick={onCancel}
          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs tracking-wider uppercase text-zinc-300 hover:text-white transition-colors bg-white/10 hover:bg-white/15 cursor-pointer"
        >
          {t.dissolve}
        </button>

        <div className="text-center">
          <span className="text-[10px] sm:text-xs uppercase tracking-widest text-zinc-500 block">{t.composingTo}</span>
          <span className="text-xs sm:text-sm font-medium text-zinc-200" style={{ color: recipient.color.accent }}>
            {recipient.name}
          </span>
        </div>

        <div className="w-12 sm:w-16" />
      </div>

      {/* Spatial Resonance Bridge Area (Visual preview between You and Recipient) */}
      <div className="relative w-full max-w-lg flex items-center justify-between my-2 sm:my-3 px-2 sm:px-6">
        {/* User Orb */}
        <div className="flex flex-col items-center gap-1">
          <LivingOrb
            color={user.color}
            texture={user.texture}
            motionPersonality={user.motionPersonality}
            breathRate={user.breathRate}
            size={52}
            isUser={true}
          />
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.you}</span>
        </div>

        {/* Dynamic Living Wave Bridge connecting them */}
        <div className="flex-1 mx-2 sm:mx-4 relative h-16 sm:h-20 flex flex-col items-center justify-center">
          <WaveSignatureVisualizer
            waveShape={waveShape}
            color={recipient.color}
            intensity={intensity}
            rhythmSpeed={rhythmSpeed}
            height={68}
            className="w-full"
          />

          {/* Central pulse descriptor */}
          <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-400 whitespace-nowrap mt-1 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-medium">
              {t.waves[waveShape]?.label || waveShape}
            </span>
            <span>•</span>
            <span>{Math.round(intensity * 100)}% {t.intensity}</span>
            <span>•</span>
            <span>{rhythmSpeed.toFixed(1)}x {t.rhythm}</span>
          </div>
        </div>

        {/* Recipient Orb */}
        <div className="flex flex-col items-center gap-1">
          <LivingOrb
            person={recipient}
            color={recipient.color}
            texture={recipient.texture}
            motionPersonality={recipient.motionPersonality}
            breathRate={recipient.breathRate}
            size={58}
            isSelected={true}
          />
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 truncate max-w-[80px]" style={{ color: recipient.color.accent }}>
            {recipient.name}
          </span>
        </div>
      </div>

      {/* Tactile Controls Console */}
      <div className="w-full max-w-md flex flex-col gap-3 sm:gap-4 bg-zinc-950/80 border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-2xl pb-4">
        {/* Wave Forms Selection */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.waveSignature}</span>
            <span className="text-[10px] text-zinc-300 font-medium" style={{ color: recipient.color.accent }}>
              {t.waves[waveShape]?.desc || ''}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {waveTypes.map((shapeId) => {
              const active = waveShape === shapeId;
              const info = t.waves[shapeId];
              return (
                <button
                  key={shapeId}
                  id={`btn-wave-${shapeId}`}
                  onClick={() => handleWaveSelect(shapeId)}
                  className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    active
                      ? 'border-white/40 bg-white/20 text-white shadow-sm ring-1 ring-white/20'
                      : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                  }`}
                  title={info.desc}
                >
                  <svg className="w-5 h-3.5 sm:w-6 sm:h-4 mb-0.5 overflow-visible" viewBox="0 0 60 20">
                    <path
                      d={WAVE_ICON_SHAPES[shapeId]}
                      fill="none"
                      stroke={active ? recipient.color.accent : 'currentColor'}
                      strokeWidth={active ? '2.5' : '1.8'}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-[9px] truncate max-w-full font-medium">{info.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tactile Intensity Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.resonanceIntensity}</span>
            <span className="text-zinc-300 font-mono text-[11px]">{Math.round(intensity * 100)}%</span>
          </div>
          <div className="relative flex items-center py-1">
            <input
              id="slider-signal-intensity"
              type="range"
              min="0.15"
              max="1.0"
              step="0.05"
              value={intensity}
              onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
          <div className="flex justify-between text-[9px] sm:text-[10px] text-zinc-500">
            <span>{t.gentleWhisper}</span>
            <span>{t.balanced}</span>
            <span>{t.radiantSurge}</span>
          </div>
        </div>

        {/* Rhythm Speed */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.tempoPace}</span>
            <span className="text-zinc-300 font-mono text-[11px]">{rhythmSpeed.toFixed(1)}x</span>
          </div>
          <div className="relative flex items-center py-1">
            <input
              id="slider-signal-rhythm"
              type="range"
              min="0.5"
              max="1.8"
              step="0.1"
              value={rhythmSpeed}
              onChange={(e) => handleRhythmSpeedChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
        </div>

        {/* Intimate Shared Meanings (if any exist for this friend) */}
        {relevantLanguages.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.sharedLanguageSymbol}</span>
            <div className="flex flex-wrap gap-1.5">
              {relevantLanguages.map((sl) => {
                const active = selectedMeaning === sl.label;
                return (
                  <button
                    key={sl.id}
                    id={`btn-shared-meaning-${sl.id}`}
                    onClick={() => handleSelectLanguage(sl)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all border cursor-pointer ${
                      active
                        ? 'border-white/40 bg-white/20 text-white font-medium'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    "{sl.label}"
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Sensory Tap Loop Attachment (Idea 5) */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 flex items-center gap-1">
              <Music className="w-3 h-3 text-cyan-400" />
              <span>{t.tapLoopsTitle}</span>
            </span>
            {onOpenTapStudio && (
              <button
                type="button"
                id="btn-open-tap-studio-from-composer"
                onClick={onOpenTapStudio}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>+ {t.tapStudioBtn}</span>
              </button>
            )}
          </div>
          {savedTapLoops && savedTapLoops.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {savedTapLoops.map((loop) => {
                const isChosen = selectedTapLoop?.id === loop.id;
                return (
                  <button
                    key={loop.id}
                    type="button"
                    id={`btn-choose-loop-${loop.id}`}
                    onClick={() => {
                      if (isChosen) {
                        setSelectedTapLoop(null);
                      } else {
                        setSelectedTapLoop(loop);
                        // Play a brief sample
                        ambientAudio.playTapPointSound(0.8, 0.5, 0.5, loop.taps[0]?.pitchFreq || 432);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] transition-all border flex items-center gap-1.5 cursor-pointer ${
                      isChosen
                        ? 'border-cyan-400/60 bg-cyan-950/40 text-cyan-200 font-medium ring-1 ring-cyan-400/30'
                        : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Music className="w-2.5 h-2.5" />
                    <span>{loop.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Freeform intimate intention (optional) */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.privateIntention}</span>
          <input
            id="input-signal-intention"
            type="text"
            placeholder={t.privateIntentionPlaceholder}
            value={customMeaning}
            onChange={(e) => {
              setCustomMeaning(e.target.value);
              setSelectedMeaning('');
            }}
            maxLength={48}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Send Action Button (Sends Signal across space) */}
        <button
          id="btn-release-signal"
          onClick={handleTransmit}
          disabled={isSending}
          className="w-full py-3 sm:py-3.5 mt-1 rounded-xl text-xs uppercase tracking-widest font-semibold text-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          style={{
            backgroundColor: recipient.color.accent,
            boxShadow: `0 0 24px ${recipient.color.glow}`,
          }}
        >
          <span>{isSending ? t.releasingSignal : t.releaseSignal}</span>
        </button>
      </div>
    </motion.div>
  );
};


