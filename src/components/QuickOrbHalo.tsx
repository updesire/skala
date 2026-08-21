import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Person, WaveShape } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ambientAudio } from '../services/audio';
import { Sparkles, Sliders, Waves, Heart, Radio, Sun } from 'lucide-react';

interface QuickOrbHaloProps {
  person: Person;
  centerPos: { x: number; y: number };
  onSendWave: (waveShape: WaveShape, intensity: number, label: string) => void;
  onOpenFullComposer: () => void;
  onCancel: () => void;
}

interface HaloNode {
  id: string;
  waveShape: WaveShape | 'more';
  angleDeg: number; // in degrees: 0 = right, 90 = bottom, 180 = left, 270 = top
  icon: React.ReactNode;
  labelKey: string;
  color: string;
  glow: string;
}

export const QuickOrbHalo: React.FC<QuickOrbHaloProps> = ({
  person,
  centerPos,
  onSendWave,
  onOpenFullComposer,
  onCancel,
}) => {
  const { t, isRtl } = useLanguage();
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [dragIntensity, setDragIntensity] = useState<number>(0.7);
  const lastActiveNodeRef = useRef<string | null>(null);

  const radius = 78; // distance of petals from center

  const nodes: HaloNode[] = [
    {
      id: 'top-soft',
      waveShape: 'soft_wave',
      angleDeg: 270, // Top
      icon: <Waves className="w-4 h-4" />,
      labelKey: t.gestureSoftWave,
      color: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.6)',
    },
    {
      id: 'right-heartbeat',
      waveShape: 'double_pulse',
      angleDeg: 0, // Right
      icon: <Heart className="w-4 h-4" />,
      labelKey: t.gestureHeartbeat,
      color: '#f43f5e',
      glow: 'rgba(244, 63, 94, 0.6)',
    },
    {
      id: 'bottom-echo',
      waveShape: 'deep_echo',
      angleDeg: 90, // Bottom
      icon: <Radio className="w-4 h-4" />,
      labelKey: t.gestureDeepEcho,
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.6)',
    },
    {
      id: 'left-starlit',
      waveShape: 'starlit_flicker',
      angleDeg: 180, // Left
      icon: <Sparkles className="w-4 h-4" />,
      labelKey: t.gestureStarlit,
      color: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.6)',
    },
    {
      id: 'corner-more',
      waveShape: 'more',
      angleDeg: 315, // Top-Right corner
      icon: <Sliders className="w-3.5 h-3.5" />,
      labelKey: t.gestureMoreOptions,
      color: '#e4e4e7',
      glow: 'rgba(255, 255, 255, 0.4)',
    },
  ];

  // Track global pointer move to detect drag direction & distance
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const dx = e.clientX - centerPos.x;
      const dy = e.clientY - centerPos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 22) {
        // In center deadzone
        if (activeNodeId !== null) {
          setActiveNodeId(null);
          lastActiveNodeRef.current = null;
        }
        return;
      }

      // Calculate intensity (0.4 at r=28px, 1.0 at r=110px)
      const intensity = Math.max(0.4, Math.min(1.0, (dist - 20) / 90));
      setDragIntensity(intensity);

      // Calculate pointer angle in degrees (0 to 360)
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle < 0) angle += 360;

      // Find closest node
      let closestNode: HaloNode | null = null;
      let minAngleDiff = 999;

      nodes.forEach((node) => {
        let diff = Math.abs(node.angleDeg - angle);
        if (diff > 180) diff = 360 - diff;

        // Special tighter threshold for the 'more' corner button
        const threshold = node.id === 'corner-more' ? 28 : 45;
        if (diff < threshold && diff < minAngleDiff) {
          minAngleDiff = diff;
          closestNode = node;
        }
      });

      if (closestNode) {
        const found = closestNode as HaloNode;
        if (lastActiveNodeRef.current !== found.id) {
          lastActiveNodeRef.current = found.id;
          setActiveNodeId(found.id);
          ambientAudio.playRippleTone(380 + (found.angleDeg / 360) * 200);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(12);
          }
        }
      } else {
        if (activeNodeId !== null) {
          setActiveNodeId(null);
          lastActiveNodeRef.current = null;
        }
      }
    };

    const handlePointerUp = () => {
      const activeNode = nodes.find((n) => n.id === lastActiveNodeRef.current);
      if (activeNode) {
        if (activeNode.waveShape === 'more') {
          onOpenFullComposer();
        } else {
          onSendWave(activeNode.waveShape as WaveShape, dragIntensity, activeNode.labelKey);
        }
      } else {
        onCancel();
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', onCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [centerPos, activeNodeId, dragIntensity, onSendWave, onOpenFullComposer, onCancel, nodes]);

  const activeNode = nodes.find((n) => n.id === activeNodeId);

  return (
    <div
      id="quick-orb-halo-container"
      className="absolute top-0 left-0 pointer-events-none z-50 select-none"
      style={{
        transform: `translate(${centerPos.x}px, ${centerPos.y}px)`,
      }}
    >
      {/* Outer Luminous Harmonic Orbit Ring */}
      <motion.div
        initial={{ scale: 0.3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.3, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-zinc-950/60 backdrop-blur-md"
        style={{
          width: radius * 2 + 36,
          height: radius * 2 + 36,
          boxShadow: `0 0 32px ${person.color.glow}, inset 0 0 20px rgba(255,255,255,0.05)`,
        }}
      />

      {/* Pulsing Central Guidance & Active Node Preview */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute left-1/2 -translate-x-1/2 -top-[64px] z-20 pointer-events-none whitespace-nowrap"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div
          className="px-3.5 py-1.5 rounded-full text-xs font-medium border backdrop-blur-xl shadow-xl flex items-center gap-2 transition-all"
          style={{
            backgroundColor: activeNode ? 'rgba(0,0,0,0.85)' : 'rgba(24,24,27,0.85)',
            borderColor: activeNode ? activeNode.color : 'rgba(255,255,255,0.15)',
            color: activeNode ? activeNode.color : '#e4e4e7',
            boxShadow: activeNode ? `0 0 16px ${activeNode.glow}` : 'none',
          }}
        >
          {activeNode ? (
            <>
              <span>{activeNode.icon}</span>
              <span className="font-semibold">{activeNode.labelKey}</span>
              {activeNode.waveShape !== 'more' && (
                <span className="text-[10px] opacity-75 font-mono">
                  {Math.round(dragIntensity * 100)}%
                </span>
              )}
            </>
          ) : (
            <span className="text-[11px] text-zinc-300 tracking-wider">
              {t.gestureHintInstruction}
            </span>
          )}
        </div>
      </motion.div>

      {/* Orbit Petals / Gesture Nodes */}
      {nodes.map((node) => {
        const rad = (node.angleDeg * Math.PI) / 180;
        const nodeDist = node.id === 'corner-more' ? radius * 0.92 : radius;
        const nx = Math.cos(rad) * nodeDist;
        const ny = Math.sin(rad) * nodeDist;
        const isActive = activeNodeId === node.id;

        return (
          <motion.div
            key={node.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isActive ? 1.35 : 1.0,
              opacity: 1,
              x: nx,
              y: ny,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-auto cursor-pointer"
          >
            {/* Glow Aura when active */}
            {isActive && (
              <motion.div
                layoutId="halo-active-glow"
                className="absolute -inset-3 rounded-full blur-md opacity-80"
                style={{ backgroundColor: node.glow }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              />
            )}

            <div
              className={`relative flex items-center justify-center rounded-full transition-all duration-200 ${
                node.id === 'corner-more' ? 'w-8 h-8' : 'w-10 h-10'
              }`}
              style={{
                backgroundColor: isActive ? node.color : 'rgba(24, 24, 27, 0.88)',
                color: isActive ? '#000000' : node.color,
                border: `1.5px solid ${isActive ? '#ffffff' : node.color + '88'}`,
                boxShadow: isActive ? `0 0 20px ${node.glow}` : '0 2px 8px rgba(0,0,0,0.5)',
              }}
            >
              {node.icon}
            </div>

            {/* Label below/above node */}
            <motion.span
              animate={{ opacity: isActive ? 1 : 0.75, scale: isActive ? 1.05 : 0.9 }}
              className="mt-1 text-[9px] font-medium tracking-wider whitespace-nowrap drop-shadow"
              style={{
                color: isActive ? node.color : '#a1a1aa',
              }}
            >
              {node.labelKey}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
};
