import React, { useEffect, useRef } from 'react';
import { PresenceState, OrbColor, MotionPersonality } from '../types';

export interface PresenceIndicatorProps {
  presence: PresenceState;
  color: OrbColor;
  size: number;
  motionPersonality?: MotionPersonality;
  breathRate?: number;
  isSelected?: boolean;
  activityLevel?: number; // 0.0 (dormant) to 1.0 (hyper-active)
  className?: string;
}

interface OrbitingMote {
  angle: number;
  orbitRadiusRatio: number;
  inclination: number; // Angle tilt for 3D orbital plane
  speed: number;
  size: number;
  phase: number;
  zDepth: number;
  brightness: number;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  presence,
  color,
  size,
  motionPersonality = 'meditative',
  breathRate = 4.5,
  isSelected = false,
  activityLevel,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const motesRef = useRef<OrbitingMote[]>([]);

  // Calculate configuration based on PresenceState and Motion Design System
  const config = React.useMemo(() => {
    switch (presence) {
      case 'reaching':
        return {
          moteCount: 8,
          speedMult: 2.2,
          glowIntensity: 1.45,
          orbitMin: 0.82,
          orbitMax: 1.35,
          trailLength: 5,
          pulseFreq: 2.0,
          coronaGlow: 0.5,
          harmonicRings: true,
          effectiveActivity: activityLevel ?? 0.95,
        };
      case 'present':
        return {
          moteCount: 5,
          speedMult: 1.0,
          glowIntensity: 1.0,
          orbitMin: 0.75,
          orbitMax: 1.15,
          trailLength: 3,
          pulseFreq: 1.0,
          coronaGlow: 0.25,
          harmonicRings: false,
          effectiveActivity: activityLevel ?? 0.7,
        };
      case 'deep_focus':
        return {
          moteCount: 4,
          speedMult: 0.75,
          glowIntensity: 0.85,
          orbitMin: 0.68,
          orbitMax: 0.92,
          trailLength: 2,
          pulseFreq: 0.65,
          coronaGlow: 0.18,
          harmonicRings: false,
          effectiveActivity: activityLevel ?? 0.5,
        };
      case 'quiet':
        return {
          moteCount: 3,
          speedMult: 0.45,
          glowIntensity: 0.65,
          orbitMin: 0.7,
          orbitMax: 1.05,
          trailLength: 1,
          pulseFreq: 0.5,
          coronaGlow: 0.12,
          harmonicRings: false,
          effectiveActivity: activityLevel ?? 0.3,
        };
      case 'resting':
      default:
        return {
          moteCount: 2,
          speedMult: 0.25,
          glowIntensity: 0.45,
          orbitMin: 0.65,
          orbitMax: 0.95,
          trailLength: 1,
          pulseFreq: 0.35,
          coronaGlow: 0.08,
          harmonicRings: false,
          effectiveActivity: activityLevel ?? 0.15,
        };
    }
  }, [presence, activityLevel]);

  // Motion personality multiplier
  const personalityMult = React.useMemo(() => {
    switch (motionPersonality) {
      case 'lively': return 1.4;
      case 'subtle': return 0.65;
      case 'pulsing': return 1.2;
      case 'resonant': return 1.1;
      case 'meditative':
      default:
        return 1.0;
    }
  }, [motionPersonality]);

  // Initialize orbiting presence particles
  useEffect(() => {
    const motes: OrbitingMote[] = [];
    const count = config.moteCount;

    for (let i = 0; i < count; i++) {
      const baseDist = config.orbitMin + (i / Math.max(1, count - 1)) * (config.orbitMax - config.orbitMin);
      motes.push({
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
        orbitRadiusRatio: baseDist,
        inclination: (i % 2 === 0 ? 1 : -1) * (0.2 + (i * 0.15)),
        speed: (0.012 + (i * 0.003)) * (i % 2 === 0 ? 1 : -0.85),
        size: Math.random() * 1.5 + 1.2,
        phase: Math.random() * Math.PI * 2,
        zDepth: 0.5,
        brightness: Math.random() * 0.4 + 0.6,
      });
    }
    motesRef.current = motes;
  }, [config.moteCount, config.orbitMin, config.orbitMax]);

  // Canvas render loop for high-performance non-textual motion presence cues
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const canvasDim = size * 3.2;

    canvas.width = canvasDim * dpr;
    canvas.height = canvasDim * dpr;

    const render = () => {
      time += 0.016 * config.speedMult * personalityMult;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvasDim, canvasDim);

      const cx = canvasDim / 2;
      const cy = canvasDim / 2;
      const baseOrbRadius = size * 0.38;

      // Synchronize breathing cycle
      const breathPhase = (time / breathRate) * Math.PI * 2;
      const breathPulse = Math.sin(breathPhase) * 0.08 + 0.92;

      // 1. Subtle Radial Corona / Activity Glow Modulation
      const dynamicCoronaRadius = baseOrbRadius * (1.1 + config.coronaGlow * 0.6) * breathPulse;
      const coronaGrad = ctx.createRadialGradient(
        cx, cy, baseOrbRadius * 0.7,
        cx, cy, dynamicCoronaRadius * 1.5
      );
      const alphaVal = config.coronaGlow * config.glowIntensity * (isSelected ? 1.4 : 1.0);
      coronaGrad.addColorStop(0, color.glow.replace(/[\d.]+\)$/g, `${Math.min(0.7, alphaVal * 0.8)})`));
      coronaGrad.addColorStop(0.5, color.ambient.replace(/[\d.]+\)$/g, `${Math.min(0.4, alphaVal * 0.35)})`));
      coronaGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, dynamicCoronaRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Reaching & Active Resonance Harmonic Wavelets
      if (config.harmonicRings || presence === 'reaching') {
        const ringProgress = (time * 0.8) % 1.0;
        const ringRadius = baseOrbRadius * (1.0 + ringProgress * 1.2);
        const ringAlpha = (1 - ringProgress) * 0.45 * config.glowIntensity;

        ctx.strokeStyle = color.accent.replace(/[\d.]+\)$/g, `${ringAlpha})`);
        ctx.lineWidth = 1.4 * (1 - ringProgress * 0.5);
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 3. Orbiting Particles (Activity Indicator Motes with 3D Depth & Light Trails)
      motesRef.current.forEach((mote) => {
        // Increment angle with activity speed
        mote.angle += mote.speed * config.speedMult * personalityMult;

        const currentOrbitR = baseOrbRadius * mote.orbitRadiusRatio * breathPulse;

        // 3D Elliptical coordinate calculation with inclination
        const cosAngle = Math.cos(mote.angle);
        const sinAngle = Math.sin(mote.angle);

        const px = cx + cosAngle * currentOrbitR;
        const py = cy + sinAngle * currentOrbitR * Math.cos(mote.inclination);
        const z = -sinAngle * Math.sin(mote.inclination); // -1 (behind) to +1 (in front)
        mote.zDepth = (z + 1) / 2; // 0.0 to 1.0

        // Light pulse & twinkle
        const twinkle = (Math.sin(time * config.pulseFreq * 3 + mote.phase) + 1) * 0.5;
        const particleAlpha = (0.35 + twinkle * 0.65) * config.glowIntensity * (0.4 + mote.zDepth * 0.6);
        const currentSize = mote.size * (0.7 + mote.zDepth * 0.6);

        // Render Motion Blur / Phosphor Trail for active states
        if (config.trailLength > 1) {
          const trailSteps = config.trailLength;
          for (let t = 1; t <= trailSteps; t++) {
            const prevAngle = mote.angle - mote.speed * t * 1.8;
            const prevX = cx + Math.cos(prevAngle) * currentOrbitR;
            const prevY = cy + Math.sin(prevAngle) * currentOrbitR * Math.cos(mote.inclination);
            const trailAlpha = particleAlpha * (1 - t / (trailSteps + 1)) * 0.4;

            ctx.fillStyle = color.accent.replace(/[\d.]+\)$/g, `${trailAlpha})`);
            ctx.beginPath();
            ctx.arc(prevX, prevY, currentSize * (1 - t * 0.15), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Particle Luminous Halo
        const glowRad = currentSize * 3.2;
        const moteGlow = ctx.createRadialGradient(px, py, 0, px, py, glowRad);
        moteGlow.addColorStop(0, `rgba(255, 255, 255, ${particleAlpha})`);
        moteGlow.addColorStop(0.4, color.accent.replace(/[\d.]+\)$/g, `${particleAlpha * 0.8})`));
        moteGlow.addColorStop(1, 'transparent');

        ctx.fillStyle = moteGlow;
        ctx.beginPath();
        ctx.arc(px, py, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Particle Bright Solid Core
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, particleAlpha * 1.3)})`;
        ctx.beginPath();
        ctx.arc(px, py, currentSize * 0.85, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Deep Focus Containment Ring (Subtle steady magnetic lock)
      if (presence === 'deep_focus') {
        const focusRingR = baseOrbRadius * 0.95;
        ctx.strokeStyle = color.primary.replace(/[\d.]+\)$/g, '0.35)');
        ctx.lineWidth = 1.0;
        ctx.setLineDash([3, 5]);
        ctx.beginPath();
        ctx.arc(cx, cy, focusRingR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    presence,
    color,
    size,
    config,
    personalityMult,
    breathRate,
    isSelected,
  ]);

  const canvasDim = size * 3.2;

  return (
    <div
      className={`pointer-events-none absolute inset-0 flex items-center justify-center ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute pointer-events-none"
        style={{
          width: canvasDim,
          height: canvasDim,
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '50%',
        }}
      />
    </div>
  );
};
