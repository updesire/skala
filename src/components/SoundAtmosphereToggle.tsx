import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';

export const SoundAtmosphereToggle: React.FC = () => {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    setIsPlaying(ambientAudio.getSoundState());
  }, []);

  const handleToggle = () => {
    const newState = ambientAudio.toggleSound();
    setIsPlaying(newState);
  };

  return (
    <button
      id="btn-toggle-ambient-sound"
      onClick={handleToggle}
      className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/5 backdrop-blur-md transition-all flex items-center gap-2 group cursor-pointer"
      title={isPlaying ? t.muteAtmosphere : t.enableAtmosphere}
      aria-label="Toggle ambient atmospheric audio"
    >
      {isPlaying ? (
        <>
          <Volume2 className="w-4 h-4 text-zinc-200 animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-zinc-300 hidden sm:inline">{t.atmosphereActive}</span>
        </>
      ) : (
        <>
          <VolumeX className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 group-hover:text-zinc-300 hidden sm:inline">{t.sound}</span>
        </>
      )}
    </button>
  );
};

