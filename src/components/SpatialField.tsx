import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Person, UserIdentity, TouchRipple, TravelingSignal } from '../types';
import { LivingOrb } from './LivingOrb';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';
import { UserPlus, Share2, Sparkles, RefreshCw } from 'lucide-react';

interface SpatialFieldProps {
  people: Person[];
  user: UserIdentity;
  selectedPersonId: string | null;
  activeSignals?: TravelingSignal[];
  onSelectPerson: (personId: string | null) => void;
  onOpenComposer: (person: Person) => void;
  onOpenSharedLanguage: (person: Person) => void;
  onOpenMemories: () => void;
  onOpenIdentity: () => void;
  onOpenRegistration?: () => void;
  onOpenInvite?: () => void;
  onRestoreBots?: () => void;
  isRealPeopleOnly?: boolean;
  onTriggerInstantPulse: (person: Person) => void;
  onAddRipple: (ripple: TouchRipple) => void;
  showAccessibilityLabels?: boolean;
}

interface BackgroundMote {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speedY: number;
  speedX: number;
  phase: number;
}

export const SpatialField: React.FC<SpatialFieldProps> = ({
  people,
  user,
  selectedPersonId,
  activeSignals = [],
  onSelectPerson,
  onOpenComposer,
  onOpenSharedLanguage,
  onOpenIdentity,
  onOpenRegistration,
  onOpenInvite,
  onRestoreBots,
  isRealPeopleOnly = false,
  onTriggerInstantPulse,
  onAddRipple,
  showAccessibilityLabels = false,
}) => {
  const { t, isRtl } = useLanguage();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 600,
  });

  // Long press timer & hold progress
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [holdingPersonId, setHoldingPersonId] = useState<string | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);

  // Active ripples on stage
  const activeRipplesRef = useRef<TouchRipple[]>([]);

  // Organic drift offset state for each person
  const [driftOffsets, setDriftOffsets] = useState<Record<string, { x: number; y: number }>>({});

  // Background dust motes
  const motesRef = useRef<BackgroundMote[]>([]);

  // Track container dimensions with ResizeObserver
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize background ambient stardust motes
  useEffect(() => {
    const motes: BackgroundMote[] = [];
    for (let i = 0; i < 45; i++) {
      motes.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: Math.random() * 1.5 + 0.4,
        alpha: Math.random() * 0.4 + 0.1,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: -Math.random() * 0.25 - 0.05,
        phase: Math.random() * Math.PI * 2,
      });
    }
    motesRef.current = motes;
  }, [dimensions.width, dimensions.height]);

  // Continuous gentle organic drift calculation (slow organic floating physics)
  useEffect(() => {
    let animId: number;
    let time = 0;

    const updateDrift = () => {
      time += 0.012;
      const newOffsets: Record<string, { x: number; y: number }> = {};

      people.forEach((p, idx) => {
        const seed = idx * 1.7;
        const driftX = Math.sin(time * 0.4 + seed) * 16 + Math.cos(time * 0.2 + seed * 2) * 8;
        const driftY = Math.cos(time * 0.35 + seed) * 14 + Math.sin(time * 0.18 + seed * 1.5) * 6;
        newOffsets[p.id] = { x: driftX, y: driftY };
      });

      setDriftOffsets(newOffsets);
      animId = requestAnimationFrame(updateDrift);
    };

    updateDrift();
    return () => cancelAnimationFrame(animId);
  }, [people]);

  // Check if mobile viewport
  const isMobile = dimensions.width < 640;
  const personOrbSize = isMobile ? 54 : 64;
  const selectedOrbSize = isMobile ? 66 : 80;
  const userOrbSize = isMobile ? 60 : 74;

  // Calculate coordinates for people safely within responsive viewport margins
  const getPersonPosition = useCallback((p: Person) => {
    const isSelected = selectedPersonId === p.id;
    const isAnySelected = selectedPersonId !== null;
    const drift = driftOffsets[p.id] || { x: 0, y: 0 };

    const minX = isMobile ? 42 : 70;
    const maxX = dimensions.width - (isMobile ? 42 : 70);
    const minY = isMobile ? 120 : 115;
    const maxY = dimensions.height - (isMobile ? 160 : 170);

    const safeWidth = Math.max(10, maxX - minX);
    const safeHeight = Math.max(10, maxY - minY);

    const centerX = dimensions.width / 2;
    const centerY = (minY + maxY) / 2;

    // Base position within safe margins
    const baseTargetX = minX + p.x * safeWidth;
    const baseTargetY = minY + p.y * safeHeight;

    if (isSelected) {
      // Selected Orb moves closer to center/user
      const approachX = centerX + (baseTargetX - centerX) * 0.55;
      const approachY = centerY + (baseTargetY - centerY) * 0.55;
      return {
        x: Math.max(minX, Math.min(maxX, approachX)),
        y: Math.max(minY, Math.min(maxY, approachY)),
      };
    }

    if (isAnySelected) {
      // Other Orbs subtly drift outward
      const outwardX = centerX + (baseTargetX - centerX) * 1.12 + drift.x * 0.4;
      const outwardY = centerY + (baseTargetY - centerY) * 1.12 + drift.y * 0.4;
      return {
        x: Math.max(minX, Math.min(maxX, outwardX)),
        y: Math.max(minY, Math.min(maxY, outwardY)),
      };
    }

    // Standard gentle drift clamped
    return {
      x: Math.max(minX, Math.min(maxX, baseTargetX + (isMobile ? drift.x * 0.6 : drift.x))),
      y: Math.max(minY, Math.min(maxY, baseTargetY + (isMobile ? drift.y * 0.6 : drift.y))),
    };
  }, [dimensions, selectedPersonId, driftOffsets, isMobile]);

  // Spatial Resonance Canvas Background (Connecting harmonic filaments & ripples)
  useEffect(() => {
    const canvas = backgroundCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;

    const render = () => {
      time += 0.015;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const userX = dimensions.width / 2;
      const userY = dimensions.height - (isMobile ? 100 : 115);

      // 1. Draw subtle ambient stardust motes
      motesRef.current.forEach((mote) => {
        mote.x += mote.speedX;
        mote.y += mote.speedY;
        if (mote.y < 0) mote.y = dimensions.height;
        if (mote.x < 0) mote.x = dimensions.width;
        if (mote.x > dimensions.width) mote.x = 0;

        const twinkle = Math.sin(time * 2 + mote.phase) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 255, 255, ${mote.alpha * twinkle * 0.4})`;
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Harmonic Resonance Filaments between User and Selected / Active People
      people.forEach((p) => {
        const isSelected = selectedPersonId === p.id;
        const pos = getPersonPosition(p);
        const distance = Math.hypot(pos.x - userX, pos.y - userY);

        if (isSelected || p.presence === 'reaching') {
          // Draw fluid wavy harmonic energy beam
          const segments = 24;
          ctx.beginPath();
          ctx.moveTo(userX, userY);

          for (let s = 1; s <= segments; s++) {
            const frac = s / segments;
            const baseX = userX + (pos.x - userX) * frac;
            const baseY = userY + (pos.y - userY) * frac;

            // Transverse sinusoidal wave displacement
            const waveOffset = Math.sin(frac * Math.PI * 4 - time * 3) * (8 * Math.sin(frac * Math.PI));
            const normalX = -(pos.y - userY) / distance;
            const normalY = (pos.x - userX) / distance;

            ctx.lineTo(baseX + normalX * waveOffset, baseY + normalY * waveOffset);
          }

          const beamAlpha = isSelected ? 0.35 : 0.2;
          ctx.strokeStyle = p.color.accent.replace(/[\d.]+\)$/g, `${beamAlpha})`);
          ctx.lineWidth = isSelected ? 2.0 : 1.2;
          ctx.stroke();

          // Harmonic energy pulse packets traveling along the beam
          const pulseFrac = (time * 0.8) % 1.0;
          const px = userX + (pos.x - userX) * pulseFrac;
          const py = userY + (pos.y - userY) * pulseFrac;
          const pulseGrad = ctx.createRadialGradient(px, py, 0, px, py, 14);
          pulseGrad.addColorStop(0, '#ffffff');
          pulseGrad.addColorStop(0.4, p.color.accent);
          pulseGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = pulseGrad;
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Render and age Touch Ripples
      const now = Date.now();
      const survivingRipples: TouchRipple[] = [];

      activeRipplesRef.current.forEach((rip) => {
        const age = now - rip.birth;
        const progress = Math.min(1, age / 1200);
        if (progress < 1) {
          const currentR = rip.radius + (rip.maxRadius - rip.radius) * progress;
          const alpha = rip.opacity * (1 - progress);

          ctx.save();
          ctx.strokeStyle = rip.color.replace(/[\d.]+\)$/g, `${alpha})`);
          ctx.lineWidth = 2.5 * (1 - progress);
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, currentR, 0, Math.PI * 2);
          ctx.stroke();

          // Secondary inner harmonic ring
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, currentR * 0.7, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          survivingRipples.push(rip);
        }
      });
      activeRipplesRef.current = survivingRipples;

      // 4. Render Active Traveling Signals across Space with Wave Signatures
      activeSignals.forEach((sig) => {
        const p = Math.max(0, Math.min(1, sig.progress));
        const headX = sig.startX + (sig.targetX - sig.startX) * p;
        const headY = sig.startY + (sig.targetY - sig.startY) * p;
        const totalDist = Math.hypot(sig.targetX - sig.startX, sig.targetY - sig.startY) || 1;
        const normalX = -(sig.targetY - sig.startY) / totalDist;
        const normalY = (sig.targetX - sig.startX) / totalDist;
        const baseAmp = (14 * (sig.intensity || 0.6));

        // Draw traveling undulating waveform tail
        const tailSegments = 32;
        const tailSpan = 0.35; // Portion of path showing the active wave packet
        const startFrac = Math.max(0, p - tailSpan);

        ctx.save();
        ctx.beginPath();

        for (let i = 0; i <= tailSegments; i++) {
          const frac = startFrac + (i / tailSegments) * (p - startFrac);
          const baseX = sig.startX + (sig.targetX - sig.startX) * frac;
          const baseY = sig.startY + (sig.targetY - sig.startY) * frac;

          // Envelope window for the wave packet
          const packetRel = (frac - startFrac) / Math.max(0.01, p - startFrac);
          const envelope = Math.sin(packetRel * Math.PI);

          let waveOffset = 0;
          switch (sig.waveShape) {
            case 'double_pulse': {
              const p1 = (time * 4) % 1.0;
              const d1 = packetRel - p1;
              const pulse = Math.exp(-(d1 * d1) / 0.04) * Math.sin(d1 * 24);
              waveOffset = pulse * baseAmp * envelope * 1.5;
              break;
            }
            case 'radiant_burst': {
              const burst = Math.sin(packetRel * Math.PI * 6 - time * 8) * baseAmp * 1.6;
              waveOffset = burst * envelope;
              break;
            }
            case 'starlit_flicker': {
              const sign = i % 2 === 0 ? 1 : -1;
              const flicker = (Math.sin(time * 15 + i * 2.5) * 0.4 + 0.6);
              waveOffset = sign * baseAmp * envelope * flicker * 1.2;
              break;
            }
            case 'deep_echo': {
              waveOffset = Math.sin(packetRel * Math.PI * 3 - time * 4) * baseAmp * 1.4 * envelope;
              break;
            }
            case 'steady_hum': {
              waveOffset = Math.sin(packetRel * 40 - time * 20) * (baseAmp * 0.25) * envelope;
              break;
            }
            case 'soft_wave':
            default: {
              waveOffset = Math.sin(packetRel * Math.PI * 4 - time * 5) * baseAmp * envelope;
              break;
            }
          }

          const wx = baseX + normalX * waveOffset;
          const wy = baseY + normalY * waveOffset;

          if (i === 0) ctx.moveTo(wx, wy);
          else ctx.lineTo(wx, wy);
        }

        ctx.strokeStyle = sig.color.accent;
        ctx.lineWidth = 3 + (sig.intensity || 0.6) * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Traveling glowing energy head packet
        const headRadius = (10 + (sig.intensity || 0.6) * 6) * Math.sin(p * Math.PI);
        const headGrad = ctx.createRadialGradient(headX, headY, 0, headX, headY, headRadius * 2);
        headGrad.addColorStop(0, '#ffffff');
        headGrad.addColorStop(0.4, sig.color.accent);
        headGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(headX, headY, headRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [dimensions, people, selectedPersonId, getPersonPosition, isMobile, user.color, activeSignals]);

  // Handle empty space touch/click ripple
  const handleStageClick = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.id === 'spatial-stage-background' || target.id === 'spatial-bg-canvas') {
      const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as React.MouseEvent).clientY;

      if (clientX !== undefined && clientY !== undefined) {
        const newRip: TouchRipple = {
          id: `rip-${Date.now()}`,
          x: clientX,
          y: clientY,
          color: user.color.glow,
          radius: 12,
          maxRadius: 210,
          opacity: 0.5,
          birth: Date.now(),
        };
        activeRipplesRef.current.push(newRip);
        onAddRipple(newRip);
        ambientAudio.playRippleTone(220 + Math.random() * 80);
      }

      if (selectedPersonId) {
        onSelectPerson(null);
      }
    }
  };

  // Long press handler on an Orb
  const handlePointerDownOrb = (person: Person, e: React.PointerEvent) => {
    e.stopPropagation();
    setHoldingPersonId(person.id);
    setHoldProgress(0.05);

    ambientAudio.playBreathPulse(0.3);

    const startTime = Date.now();
    const duration = 650; // ms to trigger long press

    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setHoldProgress(progress);
      if (progress >= 1) {
        clearInterval(holdIntervalRef.current!);
      }
    }, 25);

    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      // Trigger Signal Composer directly from Orb!
      setHoldingPersonId(null);
      setHoldProgress(0);
      onOpenComposer(person);
    }, duration);
  };

  const handlePointerUpOrb = (person: Person, e: React.PointerEvent) => {
    e.stopPropagation();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }

    // If released before long press, treat as tap selection
    if (holdProgress < 0.85) {
      if (selectedPersonId === person.id) {
        onSelectPerson(null);
      } else {
        onSelectPerson(person.id);
        ambientAudio.playRippleTone(380);
      }
    }

    setHoldingPersonId(null);
    setHoldProgress(0);
  };

  const handlePointerCancelOrb = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    setHoldingPersonId(null);
    setHoldProgress(0);
  };

  const selectedPerson = people.find((p) => p.id === selectedPersonId);

  return (
    <div
      ref={containerRef}
      id="spatial-stage-background"
      onClick={handleStageClick}
      className="relative w-full h-full overflow-hidden select-none"
      dir="ltr"
    >
      {/* Background Interactive Resonance & Stardust Canvas */}
      <canvas
        id="spatial-bg-canvas"
        ref={backgroundCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Empty Space State: Waiting for Real People / Companions */}
      {people.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="absolute top-[42%] sm:top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center gap-3 p-4 sm:p-6 rounded-3xl bg-zinc-950/85 border border-amber-400/20 backdrop-blur-xl text-center w-[90vw] max-w-sm shadow-2xl"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
            <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">
              {isRealPeopleOnly ? t.realPeopleOnly : t.waitingForRealPeople}
            </h4>
            <p className="text-xs text-zinc-300 font-light mt-1 leading-relaxed">
              {isRealPeopleOnly ? t.realPeopleOnlyDesc : t.inviteModalDesc}
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full mt-1">
            {onOpenInvite && (
              <button
                id="btn-empty-send-invite"
                onClick={onOpenInvite}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-400 text-black text-xs font-semibold uppercase tracking-wider hover:bg-amber-300 transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>{t.sendInviteLink}</span>
              </button>
            )}

            <div className="flex items-center gap-2 w-full">
              {onOpenRegistration && (
                <button
                  id="btn-empty-add-companion"
                  onClick={onOpenRegistration}
                  className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-200 text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.newCompanionTab}</span>
                </button>
              )}

              {onRestoreBots && (
                <button
                  id="btn-empty-restore-bots"
                  onClick={onRestoreBots}
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1"
                  title={t.restoreBots}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t.restoreBots}</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {people.map((person) => {
        const isSelected = selectedPersonId === person.id;
        const isAnySelected = selectedPersonId !== null;
        const pos = getPersonPosition(person);
        const isHoldingThis = holdingPersonId === person.id;
        const currentSize = isSelected ? selectedOrbSize : personOrbSize;
        const halfSize = currentSize / 2;

        return (
          <motion.div
            key={person.id}
            id={`spatial-orb-wrapper-${person.id}`}
            animate={{
              x: pos.x - halfSize,
              y: pos.y - halfSize,
              scale: isSelected ? 1.15 : isAnySelected ? 0.8 : 1.0,
              opacity: isSelected ? 1 : isAnySelected ? 0.35 : 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 70,
              damping: 18,
              mass: 0.9,
            }}
            className="absolute top-0 left-0 z-10 flex flex-col items-center justify-center cursor-pointer touch-none"
            style={{ width: currentSize, height: currentSize }}
          >
            <LivingOrb
              person={person}
              color={person.color}
              presence={person.presence}
              texture={person.texture}
              motionPersonality={person.motionPersonality}
              breathRate={person.breathRate}
              size={currentSize}
              isSelected={isSelected}
              holdProgress={isHoldingThis ? holdProgress : 0}
              onPointerDown={(e) => handlePointerDownOrb(person, e)}
              onPointerUp={(e) => handlePointerUpOrb(person, e)}
              onPointerCancel={handlePointerCancelOrb}
            />

            {/* Subtle Name / Identity fade-in */}
            <motion.div
              animate={{
                opacity: isSelected || showAccessibilityLabels ? 0.95 : 0.6,
                y: isSelected ? 6 : 2,
              }}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="text-center pointer-events-none transition-all mt-0.5 whitespace-nowrap"
            >
              <span
                className="text-[10px] sm:text-[11px] tracking-wider font-medium drop-shadow"
                style={{
                  color: isSelected ? person.color.accent : '#d1d5db',
                }}
              >
                {person.name}
              </span>
              {showAccessibilityLabels && (
                <span className="block text-[8px] sm:text-[9px] text-zinc-400 uppercase tracking-widest">
                  {t.presenceStates[person.presence]?.label || person.presence}
                </span>
              )}
            </motion.div>
          </motion.div>
        );
      })}

      {/* User's Own Orb in Center-Lower area */}
      <motion.div
        id="user-orb-wrapper"
        animate={{
          x: dimensions.width / 2 - userOrbSize / 2,
          y: dimensions.height - (isMobile ? 100 : 115) - userOrbSize / 2,
          scale: selectedPersonId ? 0.9 : 1.0,
          opacity: selectedPersonId ? 0.8 : 1.0,
        }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        className="absolute top-0 left-0 z-20 flex flex-col items-center justify-center cursor-pointer"
        style={{ width: userOrbSize, height: userOrbSize }}
        onClick={(e) => {
          e.stopPropagation();
          onOpenIdentity();
        }}
        title={t.personalSignature}
      >
        <LivingOrb
          color={user.color}
          presence={user.presence}
          texture={user.texture}
          motionPersonality={user.motionPersonality}
          breathRate={user.breathRate}
          size={userOrbSize}
          isUser={true}
        />
        <motion.span
          animate={{ opacity: 0.6 }}
          dir={isRtl ? 'rtl' : 'ltr'}
          className="text-[9px] sm:text-[10px] uppercase tracking-widest text-zinc-300 mt-1 pointer-events-none"
        >
          {t.you}
        </motion.span>
      </motion.div>

      {/* Spatial Contextual Actions when an Orb is Selected */}
      <AnimatePresence>
        {selectedPerson && (
          <motion.div
            id="spatial-context-actions"
            initial={{ opacity: 0, scale: 0.85, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 15 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-auto max-w-[94vw] w-full"
          >
            {/* Person Bio / Connection Snippet */}
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-black/75 border border-white/10 backdrop-blur-md text-[11px] sm:text-xs text-zinc-300 max-w-full truncate">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: selectedPerson.color.primary,
                  boxShadow: `0 0 8px ${selectedPerson.color.glow}`,
                }}
              />
              <span className="font-light truncate">{selectedPerson.name} ({selectedPerson.relationship})</span>
              {selectedPerson.bioSnippet && (
                <>
                  <span className="text-zinc-600 hidden sm:inline">•</span>
                  <span className="text-zinc-400 italic font-light truncate hidden sm:inline">{selectedPerson.bioSnippet}</span>
                </>
              )}
            </div>

            {/* Contextual Action Cluster */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 bg-zinc-950/90 border border-white/15 p-1.5 sm:p-2 rounded-2xl sm:rounded-full backdrop-blur-xl shadow-2xl max-w-full">
              {/* Send Tactile Signal */}
              <button
                id="btn-action-send-signal"
                onClick={() => onOpenComposer(selectedPerson)}
                className="px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[11px] sm:text-xs font-medium uppercase tracking-wider text-black transition-all hover:scale-105 cursor-pointer"
                style={{
                  backgroundColor: selectedPerson.color.accent,
                  boxShadow: `0 0 16px ${selectedPerson.color.glow}`,
                }}
              >
                {t.sendSignal}
              </button>

              {/* Quick Instant Heartbeat / Harmonic Pulse */}
              <button
                id="btn-action-instant-pulse"
                onClick={() => onTriggerInstantPulse(selectedPerson)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[11px] sm:text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/15 transition-all cursor-pointer"
                title={t.instantWave}
              >
                {t.instantWave}
              </button>

              {/* Shared Language */}
              <button
                id="btn-action-shared-language"
                onClick={() => onOpenSharedLanguage(selectedPerson)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-full text-[11px] sm:text-xs text-zinc-300 hover:text-white bg-white/5 hover:bg-white/15 transition-all cursor-pointer"
              >
                {t.sharedLanguage}
              </button>

              {/* Dismiss / Close */}
              <button
                id="btn-action-dismiss"
                onClick={() => onSelectPerson(null)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs transition-colors cursor-pointer"
                title={t.dissolve}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

