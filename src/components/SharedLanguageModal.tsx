import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Person, UserIdentity, SharedLanguageItem, WaveShape } from '../types';
import { LivingOrb } from './LivingOrb';
import { WaveSignatureVisualizer } from './WaveSignatureVisualizer';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';

interface SharedLanguageModalProps {
  person: Person;
  user: UserIdentity;
  existingLanguages: SharedLanguageItem[];
  onSaveLanguage: (newItem: SharedLanguageItem) => void;
  onClose: () => void;
}

export const SharedLanguageModal: React.FC<SharedLanguageModalProps> = ({
  person,
  user,
  existingLanguages,
  onSaveLanguage,
  onClose,
}) => {
  const { t, isRtl } = useLanguage();
  const [selectedShape, setSelectedShape] = useState<WaveShape>('soft_wave');
  const [intensity] = useState<number>(0.6);
  const [label, setLabel] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const shapeKeys: WaveShape[] = [
    'soft_wave',
    'double_pulse',
    'radiant_burst',
    'starlit_flicker',
    'deep_echo',
    'steady_hum',
  ];

  const personLanguages = existingLanguages.filter((l) => l.personId === person.id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    const newItem: SharedLanguageItem = {
      id: `sl-${Date.now()}`,
      personId: person.id,
      waveShape: selectedShape,
      intensity,
      label: label.trim(),
      description: description.trim() || t.privateUnspokenSymbol,
      createdAt: Date.now(),
    };

    ambientAudio.playWaveSignatureSound(selectedShape, intensity);
    onSaveLanguage(newItem);
    setLabel('');
    setDescription('');
  };

  return (
    <motion.div
      id="shared-language-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl ${
        isRtl ? 'rtl' : 'ltr'
      }`}
    >
      <div className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6 shadow-2xl overflow-y-auto max-h-[94dvh]">
        {/* Intimate Header */}
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 block">{t.privateSymbolicCodex}</span>
            <h2 className="text-lg font-light text-zinc-100 mt-1">
              {t.sharedLanguageWith} <span style={{ color: person.color.accent }}>{person.name}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t.sharedLanguageDesc}
            </p>
          </div>
          <button
            id="btn-close-shared-lang"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* The Dual Orb Connection Space */}
        <div
          className="relative rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center border border-white/5"
          style={{
            background: `radial-gradient(circle at center, ${person.color.ambient} 0%, rgba(15, 17, 23, 0.8) 100%)`,
          }}
        >
          <div className="flex items-center justify-center gap-4 sm:gap-8 w-full">
            <div className="flex flex-col items-center gap-1.5">
              <LivingOrb
                color={user.color}
                texture={user.texture}
                motionPersonality={user.motionPersonality}
                breathRate={user.breathRate}
                size={54}
                isUser={true}
              />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.you}</span>
            </div>

            {/* Live pulsating symbolic bridge */}
            <div className="flex-1 max-w-[180px] flex flex-col items-center justify-center">
              <WaveSignatureVisualizer
                waveShape={selectedShape}
                color={person.color}
                intensity={intensity}
                height={48}
                className="w-full"
              />
              <span className="text-[9px] uppercase tracking-wider text-zinc-300 mt-1 font-medium">
                {t.waves[selectedShape]?.label}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1.5">
              <LivingOrb
                person={person}
                color={person.color}
                texture={person.texture}
                motionPersonality={person.motionPersonality}
                breathRate={person.breathRate}
                size={58}
                isSelected={true}
              />
              <span className="text-[10px] uppercase tracking-widest text-zinc-400" style={{ color: person.color.accent }}>
                {person.name}
              </span>
            </div>
          </div>
        </div>

        {/* Invent New Signal Form */}
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">{t.shapeTheSignal}</span>

          {/* Wave selection */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {shapeKeys.map((shapeId) => {
              const active = selectedShape === shapeId;
              const info = t.waves[shapeId];
              return (
                <button
                  key={shapeId}
                  type="button"
                  id={`btn-shared-shape-${shapeId}`}
                  onClick={() => {
                    setSelectedShape(shapeId);
                    ambientAudio.playWaveSignatureSound(shapeId, intensity);
                  }}
                  className={`p-2.5 rounded-xl border text-start flex flex-col gap-0.5 transition-all cursor-pointer ${
                    active
                      ? 'border-white/40 bg-white/20 text-white shadow-sm ring-1 ring-white/20'
                      : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-xs font-medium text-zinc-200">{info.label}</span>
                  <span className="text-[10px] text-zinc-500 line-clamp-1">{info.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Meaning Inputs */}
          <div className="flex flex-col gap-3">
            <div>
              <label htmlFor="input-symbolic-meaning" className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">
                {t.privateIntimateMeaning}
              </label>
              <input
                id="input-symbolic-meaning"
                type="text"
                placeholder={t.meaningPlaceholder}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={40}
                required
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
              />
            </div>

            <div>
              <label htmlFor="input-symbolic-context" className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-1">
                {t.contextualResonance}
              </label>
              <input
                id="input-symbolic-context"
                type="text"
                placeholder={t.contextPlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          <button
            type="submit"
            id="btn-save-shared-symbol"
            disabled={!label.trim()}
            className="w-full py-3 rounded-xl text-xs uppercase tracking-widest font-semibold text-black transition-all disabled:opacity-40 cursor-pointer"
            style={{
              backgroundColor: person.color.accent,
            }}
          >
            {t.preserveInSharedLanguage}
          </button>
        </form>

        {/* Existing Private Symbols */}
        <div className="flex flex-col gap-2 pt-3 border-t border-white/10">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            {t.activeSharedVocabulary} ({personLanguages.length})
          </span>
          {personLanguages.length === 0 ? (
            <p className="text-xs text-zinc-600 italic py-2">{t.noSymbolsYet}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {personLanguages.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-zinc-200">"{item.label}"</span>
                    <span className="text-[11px] text-zinc-500">{item.description}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {t.waves[item.waveShape]?.label || item.waveShape}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

