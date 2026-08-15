import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryItem, Person, UserIdentity } from '../types';
import { LivingOrb } from './LivingOrb';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';

interface MemoriesSpaceProps {
  memories: MemoryItem[];
  people: Person[];
  user: UserIdentity;
  onClose: () => void;
}

export const MemoriesSpace: React.FC<MemoriesSpaceProps> = ({
  memories,
  people,
  user,
  onClose,
}) => {
  const { t, isRtl, language } = useLanguage();
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [isPlayingReconstruction, setIsPlayingReconstruction] = useState<boolean>(false);

  const handleSelectMemory = (mem: MemoryItem) => {
    setSelectedMemory(mem);
    setIsPlayingReconstruction(true);
    ambientAudio.playSignalResonance(mem.signal.intensity);
  };

  const activeSender = selectedMemory
    ? people.find((p) => p.id === selectedMemory.personId) || {
        id: selectedMemory.personId,
        name: selectedMemory.personName,
        color: selectedMemory.signal.color,
        texture: 'fluid',
        presence: 'present',
        motionPersonality: 'meditative',
        breathRate: 4.5,
      }
    : null;

  return (
    <motion.div
      id="memories-space-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 overflow-y-auto min-h-[100dvh] flex flex-col justify-between items-center p-3.5 sm:p-6 md:p-10 bg-black/90 backdrop-blur-2xl select-none gap-4 ${
        isRtl ? 'rtl' : 'ltr'
      }`}
    >
      {/* Top Header */}
      <div className="w-full max-w-2xl flex justify-between items-center">
        <button
          id="btn-close-memories"
          onClick={onClose}
          className="px-4 py-2 rounded-full text-xs uppercase tracking-wider text-zinc-400 hover:text-zinc-200 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          {t.returnToField}
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500 block">{t.archiveOfLight}</span>
          <span className="text-sm font-light text-zinc-200">{t.revisitingPresence}</span>
        </div>

        <div className="w-16" />
      </div>

      {/* Main Memory Field / Timeline of preserved light fragments */}
      <div className="w-full max-w-2xl flex-1 my-6 overflow-y-auto pr-2 flex flex-col gap-4">
        {memories.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
            {t.noMemoriesYet}
          </div>
        ) : (
          <div className={`relative ${isRtl ? 'pr-6 sm:pr-10 before:right-3' : 'pl-6 sm:pl-10 before:left-3'} space-y-6 before:absolute before:top-4 before:bottom-4 before:w-[1px] before:bg-white/10`}>
            {memories.map((mem) => {
              const sender = people.find((p) => p.id === mem.personId);
              const color = sender ? sender.color : mem.signal.color;
              const dateStr = new Date(mem.timestamp).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              const isSelected = selectedMemory?.id === mem.id;

              return (
                <motion.div
                  key={mem.id}
                  id={`memory-item-${mem.id}`}
                  onClick={() => handleSelectMemory(mem)}
                  whileHover={{ x: isRtl ? -4 : 4 }}
                  className={`relative p-5 rounded-2xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'border-white/40 bg-white/10 shadow-2xl'
                      : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Glowing Node on timeline */}
                  <div
                    className={`absolute ${isRtl ? '-right-[19px] sm:-right-[35px]' : '-left-[19px] sm:-left-[35px]'} top-6 w-3 h-3 rounded-full border border-black transition-all`}
                    style={{
                      backgroundColor: color.accent,
                      boxShadow: `0 0 10px ${color.glow}`,
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: color.primary,
                          boxShadow: `0 0 8px ${color.glow}`,
                        }}
                      />
                      <span className="text-sm font-medium text-zinc-200" style={{ color: color.accent }}>
                        {mem.personName}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">{dateStr}</span>
                  </div>

                  <div className="mt-2.5">
                    <div className="text-xs text-zinc-300 font-light italic">
                      "{mem.sharedMeaning || t.wordlessSignal}"
                    </div>
                    {mem.reflectionNote && (
                      <p className="text-[11px] text-zinc-500 mt-1">{mem.reflectionNote}</p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-[10px] text-zinc-500 uppercase tracking-widest">
                    <span>{t.wave}: {t.waves[mem.signal.waveShape]?.label || mem.signal.waveShape}</span>
                    <span>•</span>
                    <span>{t.intensity}: {Math.round(mem.signal.intensity * 100)}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Memory Signal Reconstructor Player */}
      <AnimatePresence>
        {selectedMemory && activeSender && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-3xl p-5 flex flex-col items-center gap-4 shadow-2xl"
          >
            <div className="w-full flex justify-between items-center text-xs">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400">
                {t.reconstructingMoment}: <span className="text-zinc-200">{selectedMemory.personName}</span>
              </span>
              <button
                id="btn-replay-memory"
                onClick={() => {
                  setIsPlayingReconstruction(false);
                  setTimeout(() => {
                    setIsPlayingReconstruction(true);
                    ambientAudio.playSignalResonance(selectedMemory.signal.intensity);
                  }, 100);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-zinc-200 rounded-full text-[11px] uppercase tracking-wider cursor-pointer"
              >
                {t.replayResonance}
              </button>
            </div>

            {/* Living dynamic replay between You and Sender */}
            <div className="w-full flex items-center justify-around py-3 px-4 rounded-2xl bg-white/5 border border-white/5">
              <div className="flex flex-col items-center gap-1">
                <LivingOrb
                  person={activeSender as Person}
                  color={activeSender.color}
                  texture={(activeSender as Person).texture || 'fluid'}
                  size={52}
                  isSelected={true}
                />
                <span className="text-[10px] text-zinc-400">{activeSender.name}</span>
              </div>

              {/* Dynamic Wave Reconstruction */}
              <div className="flex-1 mx-4 relative h-16 flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 160 40">
                  <motion.path
                    d="M 5 20 Q 40 5 80 20 T 155 20"
                    fill="none"
                    stroke={activeSender.color.accent}
                    strokeWidth={isPlayingReconstruction ? 3 : 1.5}
                    animate={
                      isPlayingReconstruction
                        ? {
                            d: [
                              'M 5 20 Q 40 5 80 20 T 155 20',
                              'M 5 20 Q 40 35 80 20 T 155 20',
                              'M 5 20 Q 40 5 80 20 T 155 20',
                            ],
                            opacity: [0.4, 1, 0.4],
                          }
                        : {}
                    }
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </svg>
              </div>

              <div className="flex flex-col items-center gap-1">
                <LivingOrb
                  color={user.color}
                  texture={user.texture}
                  size={48}
                  isUser={true}
                />
                <span className="text-[10px] text-zinc-400">{t.you}</span>
              </div>
            </div>

            <div className="text-center text-xs text-zinc-400">
              <span className="italic">"{selectedMemory.sharedMeaning || t.wordlessSignal}"</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

