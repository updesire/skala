import React, { useEffect, useRef } from 'react';
import { WaveShape, OrbColor } from '../types';

export interface WaveSignatureVisualizerProps {
  waveShape: WaveShape;
  color: OrbColor;
  intensity?: number;
  rhythmSpeed?: number;
  width?: number | string;
  height?: number;
  showParticles?: boolean;
  className?: string;
  isCompact?: boolean;
}

export const WaveSignatureVisualizer: React.FC<WaveSignatureVisualizerProps> = ({
  waveShape,
  color,
  intensity = 0.6,
  rhythmSpeed = 1.0,
  width = '100%',
  height = 64,
  showParticles = true,
  className = '',
  isCompact = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width || (typeof width === 'number' ? width : 260);
      const h = rect.height || height;
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      time += 0.02 * rhythmSpeed;

      const cy = h / 2;
      const startX = isCompact ? 8 : 16;
      const endX = w - (isCompact ? 8 : 16);
      const totalLen = Math.max(10, endX - startX);
      const baseAmp = (h * 0.36) * Math.min(1.2, Math.max(0.2, intensity));

      // 1. Soft Ambient Underlying Glow
      ctx.beginPath();
      ctx.moveTo(startX, cy);
      ctx.lineTo(endX, cy);
      ctx.strokeStyle = color.glow || 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = Math.max(2, baseAmp * 0.8);
      ctx.lineCap = 'round';
      ctx.stroke();

      // 2. Wave Shape Mathematical Generators
      switch (waveShape) {
        case 'double_pulse': {
          // Double Rhythmic Heartbeat Packet traveling from left to right
          const speed = (time * 0.55) % 1.0;
          const p1 = speed;
          const p2 = (speed - 0.16 + 1.0) % 1.0;

          // Main wave line
          ctx.beginPath();
          const points = 80;
          for (let i = 0; i <= points; i++) {
            const frac = i / points;
            const x = startX + frac * totalLen;
            const envelope = Math.sin(frac * Math.PI); // Pinned at both ends

            // Pulse 1 (Primary beat)
            const dist1 = frac - p1;
            const pulse1 = Math.exp(-(dist1 * dist1) / 0.006) * Math.sin(dist1 * 36);

            // Pulse 2 (Secondary beat)
            const dist2 = frac - p2;
            const pulse2 = Math.exp(-(dist2 * dist2) / 0.005) * Math.sin(dist2 * 40) * 0.75;

            // Ambient breathing ripple
            const baseSin = Math.sin(frac * Math.PI * 3 - time * 2) * 0.15;

            const y = cy - (pulse1 + pulse2 + baseSin) * baseAmp * envelope * 1.5;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          // Main stroke
          ctx.strokeStyle = color.accent;
          ctx.lineWidth = isCompact ? 2 : 3 + intensity * 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Traveling twin pulse glowing cores
          if (showParticles) {
            [p1, p2].forEach((posFrac, idx) => {
              if (posFrac > 0.05 && posFrac < 0.95) {
                const px = startX + posFrac * totalLen;
                const env = Math.sin(posFrac * Math.PI);
                const py = cy - (idx === 0 ? 1 : 0.75) * baseAmp * env * 0.8;
                const pRad = (idx === 0 ? 5 : 3.5) * (0.8 + intensity * 0.4);

                const grad = ctx.createRadialGradient(px, py, 0, px, py, pRad * 2.5);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.5, color.accent);
                grad.addColorStop(1, 'transparent');

                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(px, py, pRad * 2.5, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
          break;
        }

        case 'radiant_burst': {
          // Radiating Expanding Solar Burst Shockwaves
          const burstCycle = (time * 0.75) % 1.0;
          const burstAmp = Math.sin(burstCycle * Math.PI) * baseAmp * 1.4;

          // Multi-layer bursting corona arcs
          [0, 0.25, 0.5].forEach((offset, layerIdx) => {
            const phase = (time * 0.9 + offset) % 1.0;
            const alpha = (1 - phase) * (0.7 / (layerIdx + 1));
            const layerAmp = burstAmp * (1 - offset * 0.5);

            ctx.beginPath();
            const points = 70;
            for (let i = 0; i <= points; i++) {
              const frac = i / points;
              const x = startX + frac * totalLen;
              const env = Math.sin(frac * Math.PI);
              const distFromCenter = Math.abs(frac - 0.5);
              const wave = Math.cos(distFromCenter * 14 - time * 5) * Math.exp(-distFromCenter * 2.5);

              const y = cy - (wave * layerAmp + Math.sin(frac * Math.PI * 2 - time * 3) * 3) * env;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }

            ctx.strokeStyle = layerIdx === 0 ? color.accent : color.primary.replace(/[\d.]+\)$/g, `${alpha})`);
            ctx.lineWidth = layerIdx === 0 ? (isCompact ? 2.5 : 3.5 + intensity * 2) : 1.5;
            ctx.lineCap = 'round';
            ctx.stroke();
          });

          // Center Sun/Burst Diamond
          if (showParticles) {
            const cx = startX + 0.5 * totalLen;
            const flareRad = (6 + Math.sin(time * 6) * 3) * (0.8 + intensity * 0.5);
            const flareGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, flareRad * 3);
            flareGrad.addColorStop(0, '#ffffff');
            flareGrad.addColorStop(0.4, color.accent);
            flareGrad.addColorStop(1, 'transparent');

            ctx.fillStyle = flareGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, flareRad * 3, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        case 'starlit_flicker': {
          // Sharp, Faceted Crystalline Zig-Zag Line with Micro-Sparks
          ctx.beginPath();
          const segments = isCompact ? 14 : 22;
          const segWidth = totalLen / segments;

          for (let i = 0; i <= segments; i++) {
            const frac = i / segments;
            const x = startX + i * segWidth;
            const env = Math.sin(frac * Math.PI);

            // Staccato jitter + crystalline alternation
            const sign = i % 2 === 0 ? 1 : -1;
            const highFreqFlicker = Math.sin(time * 12 + i * 2.1) * 0.35 + 0.65;
            const y = cy - sign * baseAmp * env * highFreqFlicker * 1.25;

            if (i === 0) ctx.moveTo(x, cy);
            else ctx.lineTo(x, y);
          }

          ctx.strokeStyle = color.accent;
          ctx.lineWidth = isCompact ? 1.8 : 2.5 + intensity * 1.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'miter';
          ctx.stroke();

          // Twinkling Star vertices
          if (showParticles) {
            for (let i = 1; i < segments; i += 2) {
              const frac = i / segments;
              const x = startX + i * segWidth;
              const env = Math.sin(frac * Math.PI);
              const sign = i % 2 === 0 ? 1 : -1;
              const y = cy - sign * baseAmp * env * (Math.sin(time * 12 + i * 2.1) * 0.35 + 0.65) * 1.25;

              const twinkle = (Math.sin(time * 10 + i * 3) + 1) * 0.5;
              if (twinkle > 0.4) {
                const sSize = 2.5 + twinkle * 3;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(x - sSize / 2, y - 0.75, sSize, 1.5);
                ctx.fillRect(x - 0.75, y - sSize / 2, 1.5, sSize);
              }
            }
          }
          break;
        }

        case 'deep_echo': {
          // Heavy, Deep Low-Frequency Resonance with Reverb Echo Ghosts
          const echoHarmonics = [
            { delay: 0, alpha: 1.0, scale: 1.0, width: isCompact ? 2.5 : 3.5 },
            { delay: 0.2, alpha: 0.45, scale: 0.75, width: 1.8 },
            { delay: 0.4, alpha: 0.25, scale: 0.5, width: 1.2 },
          ];

          echoHarmonics.forEach(({ delay, alpha, scale, width }) => {
            const curTime = time - delay;
            ctx.beginPath();
            const points = 60;
            for (let i = 0; i <= points; i++) {
              const frac = i / points;
              const x = startX + frac * totalLen;
              const env = Math.sin(frac * Math.PI);

              // Deep plunge downwards with reverberation
              const deepDip = Math.sin(frac * Math.PI * 2 - curTime * 2.5) * baseAmp * 1.35 * scale;
              const overtone = Math.sin(frac * Math.PI * 4 - curTime * 5) * (baseAmp * 0.25) * scale;
              const y = cy + (deepDip + overtone) * env;

              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }

            ctx.strokeStyle = delay === 0 ? color.accent : color.primary.replace(/[\d.]+\)$/g, `${alpha})`);
            ctx.lineWidth = width + intensity * 1.5;
            ctx.lineCap = 'round';
            ctx.stroke();
          });
          break;
        }

        case 'steady_hum': {
          // Focused Laser Line with Micro-Plasma Vibration and High-speed Particles
          ctx.beginPath();
          const points = 90;
          for (let i = 0; i <= points; i++) {
            const frac = i / points;
            const x = startX + frac * totalLen;
            const env = Math.sin(frac * Math.PI);

            // Fast tight micro-vibration
            const microHum = Math.sin(frac * 48 - time * 18) * (baseAmp * 0.18);
            const y = cy + microHum * env;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          // Intense core beam
          ctx.strokeStyle = color.accent;
          ctx.lineWidth = isCompact ? 2 : 2.5 + intensity * 2;
          ctx.stroke();

          // Outer plasma halo
          ctx.strokeStyle = color.glow;
          ctx.lineWidth = (isCompact ? 4 : 7) * (0.8 + intensity * 0.5);
          ctx.stroke();

          // High-speed photons streaming across
          if (showParticles) {
            for (let p = 0; p < 4; p++) {
              const pFrac = ((time * 1.2 + p * 0.25) % 1.0);
              const px = startX + pFrac * totalLen;
              const env = Math.sin(pFrac * Math.PI);
              const py = cy;
              const pRad = (2.5 + p * 0.4) * env;

              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(px, py, pRad, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;
        }

        case 'soft_wave':
        default: {
          // Smooth Harmonious Sine Wave with Multi-octave Flow
          ctx.beginPath();
          const points = 70;
          for (let i = 0; i <= points; i++) {
            const frac = i / points;
            const x = startX + frac * totalLen;
            const env = Math.sin(frac * Math.PI);

            // Fundamental sine wave + subtle harmonic overtone
            const sine1 = Math.sin(frac * Math.PI * 3 - time * 2.8) * baseAmp;
            const sine2 = Math.sin(frac * Math.PI * 6 + time * 1.5) * (baseAmp * 0.25);
            const y = cy - (sine1 + sine2) * env;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          ctx.strokeStyle = color.accent;
          ctx.lineWidth = isCompact ? 2.5 : 3.5 + intensity * 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Traveling soft harmonic crest node
          if (showParticles) {
            const crestFrac = ((time * 0.45) % 1.0);
            const cx = startX + crestFrac * totalLen;
            const env = Math.sin(crestFrac * Math.PI);
            const cyNode = cy - Math.sin(crestFrac * Math.PI * 3 - time * 2.8) * baseAmp * env;

            const grad = ctx.createRadialGradient(cx, cyNode, 0, cx, cyNode, 10);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, color.accent);
            grad.addColorStop(1, 'transparent');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cyNode, 10, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [waveShape, color, intensity, rhythmSpeed, width, height, showParticles, isCompact]);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden pointer-events-none select-none ${className}`}
      style={{ width, height }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />
    </div>
  );
};
