import React, { useRef, useEffect } from 'react';
import { Person, PresenceState, OrbTexture, MotionPersonality, OrbColor } from '../types';
import { PresenceIndicator } from './PresenceIndicator';

export { PresenceIndicator };

interface LivingOrbProps {
  person?: Person;
  color: OrbColor;
  presence?: PresenceState;
  texture?: OrbTexture;
  motionPersonality?: MotionPersonality;
  breathRate?: number;
  size?: number;
  isSelected?: boolean;
  isUser?: boolean;
  onClick?: () => void;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerCancel?: (e: React.PointerEvent) => void;
  holdProgress?: number; // 0 to 1
  isReachingPulse?: boolean;
  className?: string;
  id?: string;
}

interface InternalStar {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  orbitR: number;
  twinklePhase: number;
  zDepth: number;
}

// Generate a reusable noise pattern canvas for soft organic film grain
let cachedNoisePattern: CanvasPattern | null = null;
function getNoisePattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (cachedNoisePattern) return cachedNoisePattern;
  if (typeof document === 'undefined') return null;

  const nCanvas = document.createElement('canvas');
  nCanvas.width = 64;
  nCanvas.height = 64;
  const nCtx = nCanvas.getContext('2d');
  if (!nCtx) return null;

  const imgData = nCtx.createImageData(64, 64);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const val = Math.floor(Math.random() * 255);
    data[i] = val;     // R
    data[i + 1] = val; // G
    data[i + 2] = val; // B
    data[i + 3] = Math.floor(Math.random() * 18 + 6); // Very subtle alpha
  }
  nCtx.putImageData(imgData, 0, 0);
  cachedNoisePattern = ctx.createPattern(nCanvas, 'repeat');
  return cachedNoisePattern;
}

export const LivingOrb: React.FC<LivingOrbProps> = ({
  person,
  color,
  presence = 'present',
  texture = 'fluid',
  motionPersonality = 'meditative',
  breathRate = 4.5,
  size = 76,
  isSelected = false,
  isUser = false,
  onClick,
  onPointerDown,
  onPointerUp,
  onPointerCancel,
  holdProgress = 0,
  isReachingPulse = false,
  className = '',
  id,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const internalStarsRef = useRef<InternalStar[]>([]);

  // Initialize micro cosmic motes & stardust with 3D depth parallax
  useEffect(() => {
    const starCount = texture === 'stardust' ? 22 : texture === 'crystalline' ? 14 : 10;
    const stars: InternalStar[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: 0,
        y: 0,
        radius: Math.random() * 1.8 + 0.6,
        speed: (Math.random() * 0.018 + 0.006) * (motionPersonality === 'lively' ? 1.6 : 1),
        angle: Math.random() * Math.PI * 2,
        orbitR: Math.random() * 0.62 + 0.12,
        twinklePhase: Math.random() * Math.PI * 2,
        zDepth: Math.random() * 0.8 + 0.2,
      });
    }
    internalStarsRef.current = stars;
  }, [texture, size, motionPersonality]);

  // Main Canvas render loop with High-DPI Retina support and fluid physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let time = Math.random() * 1000;

    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2.5) : 1;
    const canvasDim = size * 3.0; // Generous space for soft chromatic auras and refraction glow

    canvas.width = canvasDim * dpr;
    canvas.height = canvasDim * dpr;

    // Presence dynamics
    const brightnessMult =
      presence === 'present' ? 1.0 :
      presence === 'reaching' ? 1.4 :
      presence === 'deep_focus' ? 0.92 :
      presence === 'resting' ? 0.65 : 0.85;

    const speedMult =
      motionPersonality === 'lively' ? 1.45 :
      motionPersonality === 'subtle' ? 0.65 :
      motionPersonality === 'pulsing' ? 1.25 : 1.0;

    const render = () => {
      time += 0.018 * speedMult;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvasDim, canvasDim);

      const cx = canvasDim / 2;
      const cy = canvasDim / 2;
      const baseRadius = (size / 2) * 0.74;

      // 1. Multi-harmonic Organic Breathing (Inhale expansion + Exhale relaxation)
      const breathPhase = (time / breathRate) * Math.PI * 2;
      const breathSine = Math.sin(breathPhase);
      const breathSecondary = Math.sin(breathPhase * 2) * 0.18; // Organic asymmetry in breath
      const breathScale = 1 + (breathSine + breathSecondary) * 0.08 * (motionPersonality === 'subtle' ? 0.5 : 1.0);
      const currentRadius = baseRadius * breathScale * (1 + holdProgress * 0.18);

      // 2. Interaction & Reaching Harmonic Radiant Shockwaves
      if ((presence === 'reaching' || isReachingPulse) && !isUser) {
        for (let wave = 0; wave < 3; wave++) {
          const wavePhase = ((time * 0.95 + wave * 1.1) % 3.0) / 3.0;
          const waveR = currentRadius + wavePhase * baseRadius * 1.9;
          const waveAlpha = Math.sin(wavePhase * Math.PI) * 0.45 * brightnessMult;

          ctx.strokeStyle = color.accent.replace(/[\d.]+\)$/g, `${waveAlpha})`);
          ctx.lineWidth = 1.8 - wavePhase * 0.8;
          ctx.beginPath();
          ctx.arc(cx, cy, waveR, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 3. Deep Volumetric Astral Chromatic Aura (Outer Multi-tier Bloom)
      const outerAuraR = currentRadius * (isSelected ? 2.9 : 2.3);
      const outerGlow = ctx.createRadialGradient(cx, cy, currentRadius * 0.2, cx, cy, outerAuraR);
      outerGlow.addColorStop(0, color.glow);
      outerGlow.addColorStop(0.32, color.ambient);
      outerGlow.addColorStop(0.68, color.glow.replace(/[\d.]+\)$/g, '0.07)'));
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, outerAuraR, 0, Math.PI * 2);
      ctx.fill();

      // 4. Harmonic Fluid Organic Perimeter (36 Multi-Octave Spline Vertices)
      const numPoints = 36;
      const points: Array<{ x: number; y: number }> = [];

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Multi-frequency surface tension & fluid wave equations
        const wave1 = Math.sin(angle * 3 + time * 1.6) * 2.8;
        const wave2 = Math.cos(angle * 4 - time * 1.2) * 1.9;
        const wave3 = Math.sin(angle * 6 + time * 2.4) * 1.2;
        const wave4 = Math.cos(angle * 2 + time * 0.8) * 2.2;
        const fluidFactor = texture === 'fluid' ? 1.4 : texture === 'aurora' ? 1.6 : texture === 'deep_core' ? 0.9 : 0.8;
        const deform = (wave1 + wave2 + wave3 + wave4) * fluidFactor * (motionPersonality === 'subtle' ? 0.6 : 1.0);
        const r = currentRadius + deform;

        points.push({
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        });
      }

      // 5. Construct Smooth Continuous Bezier Fluid Perimeter Path
      ctx.beginPath();
      ctx.moveTo((points[0].x + points[numPoints - 1].x) / 2, (points[0].y + points[numPoints - 1].y) / 2);

      for (let i = 0; i < numPoints; i++) {
        const next = points[(i + 1) % numPoints];
        const midX = (points[i].x + next.x) / 2;
        const midY = (points[i].y + next.y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
      }
      ctx.closePath();

      // Save clipping region for rich internal liquid & nebula rendering
      ctx.save();
      ctx.clip();

      // 6. Deep Internal Bioluminescent Fluid Body Gradient
      // Fluid core drifts organically inside the membrane
      const coreOffsetX = Math.sin(time * 0.75) * (currentRadius * 0.22);
      const coreOffsetY = Math.cos(time * 0.65) * (currentRadius * 0.22);

      const bodyGrad = ctx.createRadialGradient(
        cx + coreOffsetX,
        cy + coreOffsetY,
        currentRadius * 0.04,
        cx,
        cy,
        currentRadius * 1.12
      );

      bodyGrad.addColorStop(0, '#ffffff'); // Pure radiant energy heart
      bodyGrad.addColorStop(0.16, '#ffffff');
      bodyGrad.addColorStop(0.35, color.accent);
      bodyGrad.addColorStop(0.68, color.primary);
      bodyGrad.addColorStop(0.9, color.glow);
      bodyGrad.addColorStop(1, 'rgba(6, 8, 12, 0.98)'); // Deep infinite edge

      ctx.fillStyle = bodyGrad;
      ctx.fill();

      // 7. Dynamic Internal Counter-Rotating Fluid Vortices (Liquid Plasma Streams)
      // Vortex 1 (Clockwise Warm Plasma Stream)
      const swirl1Angle = time * 0.85;
      const swirl1Dist = currentRadius * (0.32 + Math.sin(time * 0.5) * 0.08);
      const swirl1X = cx + Math.cos(swirl1Angle) * swirl1Dist;
      const swirl1Y = cy + Math.sin(swirl1Angle) * swirl1Dist;
      const swirl1Grad = ctx.createRadialGradient(swirl1X, swirl1Y, 0, swirl1X, swirl1Y, currentRadius * 0.72);
      swirl1Grad.addColorStop(0, `rgba(255, 255, 255, ${0.65 * brightnessMult})`);
      swirl1Grad.addColorStop(0.35, color.accent);
      swirl1Grad.addColorStop(0.8, color.primary);
      swirl1Grad.addColorStop(1, 'transparent');
      ctx.fillStyle = swirl1Grad;
      ctx.fillRect(cx - currentRadius * 1.6, cy - currentRadius * 1.6, currentRadius * 3.2, currentRadius * 3.2);

      // Vortex 2 (Counter-Clockwise Cool Refractive Eddy)
      const swirl2Angle = -time * 0.65 + Math.PI * 0.75;
      const swirl2Dist = currentRadius * (0.38 + Math.cos(time * 0.6) * 0.08);
      const swirl2X = cx + Math.cos(swirl2Angle) * swirl2Dist;
      const swirl2Y = cy + Math.sin(swirl2Angle) * swirl2Dist;
      const swirl2Grad = ctx.createRadialGradient(swirl2X, swirl2Y, 0, swirl2X, swirl2Y, currentRadius * 0.62);
      swirl2Grad.addColorStop(0, color.glow);
      swirl2Grad.addColorStop(0.45, color.ambient);
      swirl2Grad.addColorStop(1, 'transparent');
      ctx.fillStyle = swirl2Grad;
      ctx.fillRect(cx - currentRadius * 1.6, cy - currentRadius * 1.6, currentRadius * 3.2, currentRadius * 3.2);

      // Texture Specific Aurora / Crystalline / Deep Core filaments
      if (texture === 'aurora') {
        // Waving iridescent vertical-curved light bands
        for (let b = -2; b <= 2; b++) {
          const bandX = cx + b * (currentRadius * 0.28) + Math.sin(time * 1.2 + b) * 8;
          const bandGrad = ctx.createLinearGradient(bandX, cy - currentRadius, bandX + 15, cy + currentRadius);
          bandGrad.addColorStop(0, 'transparent');
          bandGrad.addColorStop(0.4, color.accent);
          bandGrad.addColorStop(0.7, color.primary);
          bandGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = bandGrad;
          ctx.fillRect(bandX - 10, cy - currentRadius, 20, currentRadius * 2);
        }
      } else if (texture === 'crystalline') {
        // Prismatic light facets & caustic lines
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.28 * brightnessMult})`;
        ctx.lineWidth = 0.9;
        for (let k = 0; k < 6; k++) {
          const faAngle = (k / 6) * Math.PI * 2 + time * 0.3;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(faAngle) * (currentRadius * 0.2), cy + Math.sin(faAngle) * (currentRadius * 0.2));
          ctx.lineTo(cx + Math.cos(faAngle + 1.2) * (currentRadius * 0.88), cy + Math.sin(faAngle + 1.2) * (currentRadius * 0.88));
          ctx.stroke();
        }
        ctx.restore();
      }

      // 8. Orbiting Stardust Stars & Micro Sparkles with 3D Depth
      internalStarsRef.current.forEach((star) => {
        star.angle += star.speed * (star.zDepth > 0.5 ? 1 : 0.7);
        const starDist = currentRadius * star.orbitR * (0.85 + Math.sin(time + star.angle) * 0.15);
        const px = cx + Math.cos(star.angle) * starDist;
        const py = cy + Math.sin(star.angle) * starDist * 0.9; // subtle orbital inclination

        const twinkle = (Math.sin(time * 3.2 + star.twinklePhase) + 1) * 0.5;
        const starAlpha = (0.35 + twinkle * 0.65) * brightnessMult * star.zDepth;

        // Micro star glow
        const glowRadius = star.radius * (3.0 * star.zDepth);
        const starGlow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
        starGlow.addColorStop(0, `rgba(255, 255, 255, ${starAlpha})`);
        starGlow.addColorStop(0.4, color.accent);
        starGlow.addColorStop(1, 'transparent');

        ctx.fillStyle = starGlow;
        ctx.beginPath();
        ctx.arc(px, py, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Star solid core
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * 1.3})`;
        ctx.beginPath();
        ctx.arc(px, py, star.radius * 0.85 * star.zDepth, 0, Math.PI * 2);
        ctx.fill();
      });

      // 9. Soft Procedural Noise / Micro-grain Matrix Layer (Anti-banding & Tactile Depth)
      const noisePattern = getNoisePattern(ctx);
      if (noisePattern) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = noisePattern;
        ctx.fillRect(cx - currentRadius * 1.5, cy - currentRadius * 1.5, currentRadius * 3, currentRadius * 3);
        ctx.restore();
      }

      // 10. Light Refraction & Optical Fresnel Caustics
      // Primary Specular Crescent (Top-Left Light Source)
      const specularX = cx - currentRadius * 0.34;
      const specularY = cy - currentRadius * 0.34;
      const specularGrad = ctx.createRadialGradient(specularX, specularY, 0, specularX, specularY, currentRadius * 0.52);
      specularGrad.addColorStop(0, 'rgba(255, 255, 255, 0.72)');
      specularGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.22)');
      specularGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.04)');
      specularGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = specularGrad;
      ctx.beginPath();
      ctx.arc(specularX, specularY, currentRadius * 0.52, 0, Math.PI * 2);
      ctx.fill();

      // Secondary Bounce Refraction (Bottom-Right Ambient Glow)
      const bounceX = cx + currentRadius * 0.28;
      const bounceY = cy + currentRadius * 0.28;
      const bounceGrad = ctx.createRadialGradient(bounceX, bounceY, 0, bounceX, bounceY, currentRadius * 0.42);
      bounceGrad.addColorStop(0, color.accent.replace(/[\d.]+\)$/g, '0.35)'));
      bounceGrad.addColorStop(0.6, color.ambient);
      bounceGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bounceGrad;
      ctx.beginPath();
      ctx.arc(bounceX, bounceY, currentRadius * 0.42, 0, Math.PI * 2);
      ctx.fill();

      // Inner Fresnel Rim Sheen (Exponential Falloff at Membrane Edge)
      const rimGrad = ctx.createRadialGradient(cx, cy, currentRadius * 0.68, cx, cy, currentRadius * 1.02);
      rimGrad.addColorStop(0, 'transparent');
      rimGrad.addColorStop(0.72, 'rgba(255, 255, 255, 0.08)');
      rimGrad.addColorStop(0.92, 'rgba(255, 255, 255, 0.35)');
      rimGrad.addColorStop(1, color.accent);
      ctx.fillStyle = rimGrad;
      ctx.fillRect(cx - currentRadius * 1.3, cy - currentRadius * 1.3, currentRadius * 2.6, currentRadius * 2.6);

      ctx.restore(); // Exit clipping region

      // 11. Refraction Chromatic Fringe & Ethereal Boundary Halo
      // Outer chromatic dispersion stroke
      ctx.strokeStyle = isSelected
        ? 'rgba(255, 255, 255, 0.95)'
        : color.accent.replace(/[\d.]+\)$/g, `${0.55 * brightnessMult})`);
      ctx.lineWidth = isSelected ? 2.2 : 1.4;
      ctx.stroke();

      // 12. Touch & Hold Tactile Energy Charging Meter
      if (holdProgress > 0.02) {
        const holdR = currentRadius + 8;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.4;
        ctx.lineCap = 'round';
        ctx.shadowColor = color.accent;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(cx, cy, holdR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * holdProgress);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [
    color,
    presence,
    texture,
    motionPersonality,
    breathRate,
    size,
    isSelected,
    isUser,
    holdProgress,
    isReachingPulse,
  ]);

  const canvasDim = size * 3.0;

  return (
    <div
      id={id || (person ? `orb-container-${person.id}` : 'user-orb-container')}
      className={`relative select-none flex items-center justify-center cursor-pointer transition-transform duration-300 ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      role="button"
      tabIndex={0}
      aria-label={person ? `${person.name}'s living presence orb` : "Your living presence orb"}
    >
      {/* Living Core Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute pointer-events-none z-0"
        style={{
          width: canvasDim,
          height: canvasDim,
          transform: 'translate(-50%, -50%)',
          left: '50%',
          top: '50%',
        }}
      />

      {/* Non-Textual Motion Presence Indicator Sub-component */}
      <PresenceIndicator
        presence={presence}
        color={color}
        size={size}
        motionPersonality={motionPersonality}
        breathRate={breathRate}
        isSelected={isSelected}
      />
    </div>
  );
};
