import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomTapLoop, TapPoint, Person, UserIdentity, OrbColor } from '../types';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';
import { 
  Play, 
  Square, 
  CircleDot, 
  Sparkles, 
  RotateCcw, 
  Send, 
  Save, 
  Music, 
  Zap, 
  X,
  Radio,
  BookmarkCheck
} from 'lucide-react';

interface SensoryTapLoopRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserIdentity;
  selectedPerson?: Person | null;
  people: Person[];
  onTransmitTapLoop: (recipient: Person, tapLoop: CustomTapLoop) => void;
  onSaveTapLoop: (tapLoop: CustomTapLoop) => void;
  savedLoops?: CustomTapLoop[];
}

// Built-in inspiring tactile rhythm presets
const PRESET_TAP_LOOPS: Omit<CustomTapLoop, 'id' | 'createdAt' | 'authorName'>[] = [
  {
    name: 'طپش قلب عاشقانه • Calm Heartbeat',
    description: 'ضربان دوگانه آرام‌بخش با حس نزدیکی و امنیت',
    totalDuration: 2400,
    tempoSpeed: 1.0,
    taps: [
      { time: 100, x: 0.5, y: 0.52, intensity: 0.9, pitchFreq: 216 },
      { time: 380, x: 0.52, y: 0.48, intensity: 0.7, pitchFreq: 270 },
      { time: 1200, x: 0.5, y: 0.52, intensity: 0.95, pitchFreq: 216 },
      { time: 1480, x: 0.52, y: 0.48, intensity: 0.75, pitchFreq: 270 },
    ],
  },
  {
    name: 'سه‌ضربه ستاره‌ای • Cosmic Triplet',
    description: 'سه‌گانه ملودیک با طنین بلورین و پرواز در فضا',
    totalDuration: 2600,
    tempoSpeed: 1.0,
    taps: [
      { time: 150, x: 0.25, y: 0.35, intensity: 0.6, pitchFreq: 324 },
      { time: 450, x: 0.5, y: 0.25, intensity: 0.75, pitchFreq: 432 },
      { time: 780, x: 0.75, y: 0.35, intensity: 0.9, pitchFreq: 540 },
      { time: 1450, x: 0.5, y: 0.65, intensity: 0.8, pitchFreq: 648 },
    ],
  },
  {
    name: 'موج آبشاری آرامش • Cascade Shimmer',
    description: 'جاری شدن نت‌های پی‌درپی مانند قطرات باران شبانه',
    totalDuration: 3000,
    tempoSpeed: 1.0,
    taps: [
      { time: 100, x: 0.2, y: 0.7, intensity: 0.5, pitchFreq: 216 },
      { time: 350, x: 0.35, y: 0.55, intensity: 0.6, pitchFreq: 270 },
      { time: 600, x: 0.5, y: 0.4, intensity: 0.7, pitchFreq: 324 },
      { time: 850, x: 0.65, y: 0.3, intensity: 0.8, pitchFreq: 432 },
      { time: 1100, x: 0.8, y: 0.2, intensity: 0.9, pitchFreq: 540 },
      { time: 1800, x: 0.5, y: 0.5, intensity: 0.95, pitchFreq: 864 },
    ],
  },
  {
    name: 'کد لمسی حضور • I Am Here',
    description: 'سیگنال مورس‌گونه صمیمانه به نشانه بودن در کنار هم',
    totalDuration: 2200,
    tempoSpeed: 1.0,
    taps: [
      { time: 100, x: 0.5, y: 0.5, intensity: 0.8, pitchFreq: 432 },
      { time: 400, x: 0.5, y: 0.5, intensity: 0.8, pitchFreq: 432 },
      { time: 900, x: 0.5, y: 0.5, intensity: 0.95, pitchFreq: 540 },
    ],
  },
];

export const SensoryTapLoopRecorderModal: React.FC<SensoryTapLoopRecorderModalProps> = ({
  isOpen,
  onClose,
  user,
  selectedPerson,
  people,
  onTransmitTapLoop,
  onSaveTapLoop,
  savedLoops = [],
}) => {
  const { t, isRtl } = useLanguage();
  const [activeTab, setActiveTab] = useState<'studio' | 'library' | 'presets'>('studio');

  // Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [recordedTaps, setRecordedTaps] = useState<TapPoint[]>([]);
  const [recordStartTime, setRecordStartTime] = useState<number | null>(null);
  const [loopDuration, setLoopDuration] = useState<number>(0);
  const [loopName, setLoopName] = useState<string>('');
  const [playbackProgress, setPlaybackProgress] = useState<number>(0);
  const [tempoMultiplier, setTempoMultiplier] = useState<number>(1.0);

  // Selected recipient for transmission
  const [targetRecipientId, setTargetRecipientId] = useState<string>(
    selectedPerson?.id || (people[0]?.id || '')
  );

  // Visual tap ripples in the pad
  const [padRipples, setPadRipples] = useState<
    { id: string; x: number; y: number; color: string; pitch: number; intensity: number }[]
  >([]);

  // Refs for timers & animation
  const playbackTimeoutIds = useRef<NodeJS.Timeout[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const padRef = useRef<HTMLDivElement | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      clearAllPlaybackTimers();
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    };
  }, []);

  const clearAllPlaybackTimers = () => {
    playbackTimeoutIds.current.forEach((id) => clearTimeout(id));
    playbackTimeoutIds.current = [];
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  // Start recording new tap loop
  const handleStartRecording = () => {
    clearAllPlaybackTimers();
    setRecordedTaps([]);
    setIsRecording(true);
    const start = Date.now();
    setRecordStartTime(start);
    setLoopDuration(0);

    ambientAudio.playBreathPulse(0.7);

    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    recordIntervalRef.current = setInterval(() => {
      setLoopDuration(Date.now() - start);
    }, 50);

    // Auto-stop recording after max 12 seconds to prevent huge payloads
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = setTimeout(() => {
      handleStopRecording();
    }, 12000);
  };

  // Stop recording
  const handleStopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    if (recordIntervalRef.current) clearInterval(recordIntervalRef.current);
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);

    if (recordedTaps.length > 0) {
      const finalDuration = Math.max(1200, loopDuration);
      setLoopDuration(finalDuration);
      if (!loopName) {
        setLoopName(`ریتم حسی #${Math.floor(Math.random() * 900 + 100)}`);
      }
    }
  };

  // Trigger tactile tap on the pad (during record or live play)
  const handlePadTap = (clientX: number, clientY: number, forceIntensity?: number) => {
    if (!padRef.current) return;
    const rect = padRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    const intensity = forceIntensity || (0.55 + Math.random() * 0.35);

    // Musically synthesize acoustic tap tone
    ambientAudio.playTapPointSound(intensity, x, y);

    // Haptic feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(Math.round(intensity * 40));
    }

    // Add visual glowing ripple
    const rippleId = `pad-rip-${Date.now()}-${Math.random()}`;
    setPadRipples((prev) => [
      ...prev.slice(-12),
      {
        id: rippleId,
        x: x * 100,
        y: y * 100,
        color: user.color.accent,
        pitch: Math.round(216 + x * 600),
        intensity,
      },
    ]);

    setTimeout(() => {
      setPadRipples((prev) => prev.filter((r) => r.id !== rippleId));
    }, 1000);

    // If recording, log the timestamp and position
    if (isRecording && recordStartTime) {
      const timeOffset = Date.now() - recordStartTime;
      const newTap: TapPoint = {
        id: `tap-${Date.now()}`,
        time: timeOffset,
        x,
        y,
        intensity,
      };
      setRecordedTaps((prev) => [...prev, newTap]);
    }
  };

  // Playback recorded or preset tap loop
  const handlePlayLoop = (tapsToPlay: TapPoint[], totalDur: number, speed = tempoMultiplier) => {
    if (tapsToPlay.length === 0) return;
    clearAllPlaybackTimers();
    setIsPlaying(true);

    const effectiveDuration = (totalDur || 2500) / speed;
    const startTime = Date.now();

    // Progress tick
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / effectiveDuration);
      setPlaybackProgress(progress);
      if (progress >= 1) {
        clearInterval(progressInterval);
        setIsPlaying(false);
      }
    }, 30);
    playbackTimeoutIds.current.push(progressInterval as any);

    // Schedule each tap point
    tapsToPlay.forEach((tap) => {
      const scheduledDelay = tap.time / speed;
      const timeoutId = setTimeout(() => {
        ambientAudio.playTapPointSound(tap.intensity, tap.x, tap.y, tap.pitchFreq);

        // Visual flash in pad
        const ripId = `play-rip-${Date.now()}-${Math.random()}`;
        setPadRipples((prev) => [
          ...prev.slice(-12),
          {
            id: ripId,
            x: tap.x * 100,
            y: tap.y * 100,
            color: user.color.accent,
            pitch: tap.pitchFreq || 432,
            intensity: tap.intensity,
          },
        ]);
        setTimeout(() => {
          setPadRipples((prev) => prev.filter((r) => r.id !== ripId));
        }, 800);
      }, scheduledDelay);

      playbackTimeoutIds.current.push(timeoutId);
    });
  };

  // Save loop to state & cloud
  const handleSaveCurrentLoop = () => {
    if (recordedTaps.length === 0) return;
    const newLoop: CustomTapLoop = {
      id: `loop-${Date.now()}`,
      name: loopName.trim() || `ریتم حسی ${new Date().toLocaleTimeString('fa-IR')}`,
      taps: recordedTaps,
      totalDuration: loopDuration || 2500,
      tempoSpeed: tempoMultiplier,
      color: user.color,
      createdAt: Date.now(),
      authorName: user.name,
    };
    onSaveTapLoop(newLoop);
    ambientAudio.playWaveSignatureSound('starlit_flicker', 0.8, 1.2);
  };

  // Transmit loop immediately to companion
  const handleTransmitCurrentLoop = () => {
    const recipient = people.find((p) => p.id === targetRecipientId) || people[0];
    if (!recipient) return;

    const loopToSend: CustomTapLoop = {
      id: `loop-${Date.now()}`,
      name: loopName.trim() || 'ریتم لمسی زنده',
      taps: recordedTaps,
      totalDuration: loopDuration || 2500,
      tempoSpeed: tempoMultiplier,
      color: user.color,
      createdAt: Date.now(),
      authorName: user.name,
      targetPersonId: recipient.id,
    };

    onTransmitTapLoop(recipient, loopToSend);
    onClose();
  };

  // Load a preset
  const handleLoadPreset = (preset: typeof PRESET_TAP_LOOPS[0]) => {
    clearAllPlaybackTimers();
    setLoopName(preset.name);
    setRecordedTaps(preset.taps);
    setLoopDuration(preset.totalDuration);
    setTempoMultiplier(preset.tempoSpeed || 1.0);
    setActiveTab('studio');
    handlePlayLoop(preset.taps, preset.totalDuration, preset.tempoSpeed || 1.0);
  };

  if (!isOpen) return null;

  const currentRecipient = people.find((p) => p.id === targetRecipientId) || selectedPerson || people[0];

  return (
    <AnimatePresence>
      <motion.div
        id="sensory-tap-loop-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 overflow-y-auto min-h-[100dvh] flex items-center justify-center p-3 sm:p-6 select-none ${
          isRtl ? 'rtl' : 'ltr'
        }`}
        style={{
          background: 'radial-gradient(circle at 50% 40%, rgba(20, 24, 33, 0.95) 0%, rgba(6, 7, 10, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-zinc-950/90 border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 text-zinc-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-white/10 text-white">
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
                  {t.tapLoopsTitle}
                </h2>
                <p className="text-[10px] sm:text-xs text-zinc-400">
                  {t.tapLoopsSubtitle}
                </p>
              </div>
            </div>
            <button
              id="btn-close-tap-studio"
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 p-1 bg-white/5 rounded-2xl border border-white/5">
            <button
              id="tab-tap-studio"
              onClick={() => setActiveTab('studio')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'studio'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{t.tapStudioBtn}</span>
            </button>
            <button
              id="tab-tap-presets"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.loopPresets}</span>
            </button>
            <button
              id="tab-tap-library"
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'library'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>{t.savedTapLoops} ({savedLoops.length})</span>
            </button>
          </div>

          {/* 1. STUDIO TAB: Recording & Sensory Drum Pad */}
          {activeTab === 'studio' && (
            <div className="flex flex-col gap-3">
              {/* Sensory Tactile Drum Pad Area */}
              <div className="relative flex flex-col items-center">
                <div
                  ref={padRef}
                  id="sensory-touch-pad"
                  onPointerDown={(e) => {
                    handlePadTap(e.clientX, e.clientY);
                  }}
                  className={`relative w-full aspect-[4/3] max-h-56 rounded-2xl border transition-all overflow-hidden flex flex-col items-center justify-center cursor-crosshair touch-none ${
                    isRecording
                      ? 'border-red-500/50 bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                      : isPlaying
                      ? 'border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                      : 'border-white/15 bg-zinc-900/60 hover:border-white/30'
                  }`}
                  style={{
                    background: isRecording
                      ? 'radial-gradient(circle at 50% 50%, rgba(239,68,68,0.15) 0%, rgba(9,10,13,0.9) 80%)'
                      : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, rgba(9,10,13,0.95) 80%)',
                  }}
                >
                  {/* Visual Coordinate Guide Grid */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none grid grid-cols-4 grid-rows-3 divide-x divide-y divide-white/20">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-center">
                        <span className="text-[8px] font-mono text-zinc-500">✦</span>
                      </div>
                    ))}
                  </div>

                  {/* Ripple effects from taps */}
                  {padRipples.map((rip) => (
                    <motion.div
                      key={rip.id}
                      initial={{ scale: 0.1, opacity: 1 }}
                      animate={{ scale: 3.5, opacity: 0 }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="absolute rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 border"
                      style={{
                        left: `${rip.x}%`,
                        top: `${rip.y}%`,
                        width: '40px',
                        height: '40px',
                        borderColor: rip.color,
                        boxShadow: `0 0 16px ${rip.color}`,
                      }}
                    />
                  ))}

                  {/* Center status descriptor */}
                  <div className="relative z-10 flex flex-col items-center gap-1.5 pointer-events-none px-4 text-center">
                    {isRecording ? (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-xs"
                      >
                        <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                        <span>{t.recordingTapLoop} ({(loopDuration / 1000).toFixed(1)}s)</span>
                      </motion.div>
                    ) : isPlaying ? (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 text-xs">
                        <Play className="w-3 h-3 text-cyan-400" />
                        <span>{t.tapLoopPlaying}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-zinc-400">
                        <span className="text-xs font-medium text-zinc-300">
                          {recordedTaps.length > 0
                            ? `${recordedTaps.length} ${t.tapPointsCount} • ${(loopDuration / 1000).toFixed(1)}s`
                            : t.tapPadInstruction}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          (هر نقطه نوت و فرکانس صوتی اختصاصی دارد)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sequencer Timeline Progress Bar */}
                {recordedTaps.length > 0 && (
                  <div className="w-full mt-2 flex flex-col gap-1">
                    <div className="relative w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                      {/* Playback progress cursor */}
                      {isPlaying && (
                        <div
                          className="absolute top-0 bottom-0 left-0 bg-white/30 transition-all duration-75"
                          style={{ width: `${playbackProgress * 100}%` }}
                        />
                      )}
                      {/* Tap nodes marker */}
                      {recordedTaps.map((tap, idx) => {
                        const pct = (tap.time / Math.max(1, loopDuration)) * 100;
                        return (
                          <div
                            key={idx}
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-sm"
                            style={{
                              left: `${pct}%`,
                              backgroundColor: user.color.accent,
                            }}
                            title={`${(tap.time / 1000).toFixed(2)}s`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Controls Bar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {isRecording ? (
                  <button
                    id="btn-stop-recording-tap"
                    onClick={handleStopRecording}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>پایان ضبط ({recordedTaps.length} ضربه)</span>
                  </button>
                ) : (
                  <button
                    id="btn-start-recording-tap"
                    onClick={handleStartRecording}
                    className="flex-1 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all border border-white/20 cursor-pointer"
                  >
                    <CircleDot className="w-3.5 h-3.5 text-red-400" />
                    <span>{recordedTaps.length > 0 ? t.clearRecording : t.recordTapLoop}</span>
                  </button>
                )}

                {recordedTaps.length > 0 && !isRecording && (
                  <>
                    <button
                      id="btn-preview-loop"
                      onClick={() => handlePlayLoop(recordedTaps, loopDuration, tempoMultiplier)}
                      disabled={isPlaying}
                      className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{t.playTapLoopBtn}</span>
                    </button>

                    <button
                      id="btn-save-loop"
                      onClick={handleSaveCurrentLoop}
                      className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      title={t.saveTapLoopBtn}
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Loop Details & Transmission Config */}
              {recordedTaps.length > 0 && !isRecording && (
                <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                  {/* Name Input */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                      {t.tapLoopNameLabel}
                    </span>
                    <input
                      id="input-tap-loop-name"
                      type="text"
                      value={loopName}
                      onChange={(e) => setLoopName(e.target.value)}
                      placeholder={t.tapLoopNamePlaceholder}
                      className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-white/30"
                    />
                  </div>

                  {/* Recipient Selection */}
                  {people.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                        {t.composingTo}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {people.map((p) => (
                          <button
                            key={p.id}
                            id={`btn-target-recipient-${p.id}`}
                            onClick={() => setTargetRecipientId(p.id)}
                            className={`px-2.5 py-1 rounded-full text-xs transition-all border cursor-pointer ${
                              targetRecipientId === p.id
                                ? 'border-white/40 bg-white/20 text-white font-medium'
                                : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transmit Button */}
                  <button
                    id="btn-transmit-tap-loop"
                    onClick={handleTransmitCurrentLoop}
                    className="w-full py-2.5 mt-1 rounded-xl text-xs uppercase tracking-widest font-semibold text-black transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    style={{
                      backgroundColor: currentRecipient?.color.accent || user.color.accent,
                      boxShadow: `0 0 20px ${currentRecipient?.color.glow || user.color.glow}`,
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t.sendTapLoopBtn}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 2. PRESETS TAB: Celestial Handcrafted Tactile Rhythms */}
          {activeTab === 'presets' && (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              <span className="text-[11px] text-zinc-400 mb-1">
                الگوهای ریتمیک آماده برای ابراز احساسات و حضور بی‌کلام:
              </span>
              {PRESET_TAP_LOOPS.map((preset, idx) => (
                <div
                  key={idx}
                  id={`preset-loop-${idx}`}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-white">{preset.name}</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{preset.description}</p>
                    <span className="text-[9px] text-zinc-500 font-mono">
                      {preset.taps.length} ضربه • {(preset.totalDuration / 1000).toFixed(1)} ثانیه
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handlePlayLoop(preset.taps, preset.totalDuration)}
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                      title="پخش پیش‌نمایش"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      انتخاب
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. LIBRARY TAB: Saved User Loops */}
          {activeTab === 'library' && (
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {savedLoops.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                  <BookmarkCheck className="w-8 h-8 opacity-30" />
                  <p>{t.noTapLoopsYet}</p>
                </div>
              ) : (
                savedLoops.map((loop) => (
                  <div
                    key={loop.id}
                    id={`saved-loop-${loop.id}`}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-white">{loop.name}</h4>
                      <span className="text-[9px] text-zinc-400 font-mono">
                        {loop.taps.length} ضربه • {(loop.totalDuration / 1000).toFixed(1)}s • ساخته‌شده توسط {loop.authorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePlayLoop(loop.taps, loop.totalDuration, loop.tempoSpeed || 1)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                        title="پخش"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setRecordedTaps(loop.taps);
                          setLoopName(loop.name);
                          setLoopDuration(loop.totalDuration);
                          setActiveTab('studio');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        ویرایش / ارسال
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
