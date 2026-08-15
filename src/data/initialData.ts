import { Person, UserIdentity, SharedLanguageItem, MemoryItem, OrbColor } from '../types';

export const ORB_PALETTES: Record<string, OrbColor> = {
  cyan: {
    name: 'Celestial Cyan',
    primary: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.65)',
    ambient: 'rgba(14, 165, 233, 0.18)',
    accent: '#38bdf8',
  },
  emerald: {
    name: 'Mystic Emerald',
    primary: '#10b981',
    glow: 'rgba(16, 185, 129, 0.65)',
    ambient: 'rgba(16, 185, 129, 0.18)',
    accent: '#34d399',
  },
  violet: {
    name: 'Cosmic Violet',
    primary: '#a855f7',
    glow: 'rgba(168, 85, 247, 0.65)',
    ambient: 'rgba(168, 85, 247, 0.18)',
    accent: '#c084fc',
  },
  amber: {
    name: 'Solar Amber',
    primary: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.65)',
    ambient: 'rgba(245, 158, 11, 0.18)',
    accent: '#fbbf24',
  },
  rose: {
    name: 'Astral Rose',
    primary: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.65)',
    ambient: 'rgba(244, 63, 94, 0.18)',
    accent: '#fb7185',
  },
  pearl: {
    name: 'Luminous Pearl',
    primary: '#38bdf8',
    glow: 'rgba(224, 242, 254, 0.6)',
    ambient: 'rgba(56, 189, 248, 0.16)',
    accent: '#f8fafc',
  },
  sage: {
    name: 'Ethereal Sage',
    primary: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.65)',
    ambient: 'rgba(20, 184, 166, 0.18)',
    accent: '#2dd4bf',
  },
  ochre: {
    name: 'Stellar Gold',
    primary: '#eab308',
    glow: 'rgba(234, 179, 8, 0.65)',
    ambient: 'rgba(234, 179, 8, 0.18)',
    accent: '#fde047',
  }
};

export const INITIAL_USER: UserIdentity = {
  name: 'You',
  color: ORB_PALETTES.pearl,
  presence: 'present',
  texture: 'fluid',
  motionPersonality: 'meditative',
  breathRate: 4.8,
};

export const INITIAL_PEOPLE: Person[] = [
  {
    id: 'p-arman',
    name: 'آرمان',
    relationship: 'همراه صمیمی',
    color: ORB_PALETTES.amber,
    presence: 'present',
    texture: 'fluid',
    motionPersonality: 'meditative',
    breathRate: 4.2,
    baseDistance: 0.38,
    angle: -0.85, // top right quadrant
    x: 0.68,
    y: 0.32,
    bioSnippet: 'قدم زدن در جنگل‌های عصرگاهی',
    lastInteraction: '۲ ساعت پیش',
  },
  {
    id: 'p-elena',
    name: 'النا',
    relationship: 'هم‌راز خلاق',
    color: ORB_PALETTES.cyan,
    presence: 'deep_focus',
    texture: 'aurora',
    motionPersonality: 'subtle',
    breathRate: 5.6,
    baseDistance: 0.46,
    angle: -2.3, // top left quadrant
    x: 0.28,
    y: 0.36,
    bioSnippet: 'در حال سفالگری و خلوت هنری',
    lastInteraction: 'دیروز',
  },
  {
    id: 'p-maya',
    name: 'مایا',
    relationship: 'خواهر و لنگرگاه آرامش',
    color: ORB_PALETTES.violet,
    presence: 'reaching', // wants contact with gentle pulse
    texture: 'fluid',
    motionPersonality: 'pulsing',
    breathRate: 3.8,
    baseDistance: 0.34,
    angle: 0.6, // lower right
    x: 0.74,
    y: 0.64,
    bioSnippet: 'تماشای باران از پنجره',
    lastInteraction: '۱۰ دقیقه پیش',
  },
  {
    id: 'p-kael',
    name: 'کیان',
    relationship: 'هم‌مسیر شب‌های آرام',
    color: ORB_PALETTES.sage,
    presence: 'resting',
    texture: 'crystalline',
    motionPersonality: 'subtle',
    breathRate: 6.2,
    baseDistance: 0.52,
    angle: 2.2, // lower left
    x: 0.22,
    y: 0.72,
    bioSnippet: 'گوش دادن به موسیقی ملایم شبانه',
    lastInteraction: '۳ روز پیش',
  },
  {
    id: 'p-soren',
    name: 'سورن',
    relationship: 'هم‌فکر و هم‌کلام',
    color: ORB_PALETTES.rose,
    presence: 'quiet',
    texture: 'deep_core',
    motionPersonality: 'resonant',
    breathRate: 5.0,
    baseDistance: 0.56,
    angle: -1.57, // directly above
    x: 0.50,
    y: 0.18,
    bioSnippet: 'نوشتن دست‌نوشته در نور ملایم چراغ',
    lastInteraction: '۵ ساعت پیش',
  }
];

export const INITIAL_SHARED_LANGUAGES: SharedLanguageItem[] = [
  {
    id: 'sl-1',
    personId: 'p-arman',
    waveShape: 'soft_wave',
    intensity: 0.45,
    label: 'Thinking of you',
    description: 'A gentle slow rolling wave sent without words during quiet evening moments.',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'sl-2',
    personId: 'p-arman',
    waveShape: 'deep_echo',
    intensity: 0.75,
    label: 'Safe now / I am here',
    description: 'A low resonant pulse that grounds and centers the space.',
    createdAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'sl-3',
    personId: 'p-maya',
    waveShape: 'double_pulse',
    intensity: 0.65,
    label: 'Breathe with me',
    description: 'Two rhythmic pulses paced to synchronise deep breaths.',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'sl-4',
    personId: 'p-elena',
    waveShape: 'starlit_flicker',
    intensity: 0.5,
    label: 'Look at the sky',
    description: 'A delicate sparkling dispersion to pause and look up.',
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'sl-5',
    personId: 'p-kael',
    waveShape: 'steady_hum',
    intensity: 0.35,
    label: 'Quiet company',
    description: 'A continuous subtle ambient warmth indicating presence without distraction.',
    createdAt: Date.now() - 86400000 * 20,
  }
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    personId: 'p-maya',
    personName: 'Maya',
    timestamp: Date.now() - 1000 * 60 * 35, // 35 min ago
    sharedMeaning: 'Breathe with me',
    reflectionNote: 'Arrived just as twilight set in; a quiet reminder to exhale.',
    signal: {
      id: 'sig-m1',
      senderId: 'p-maya',
      recipientId: 'user',
      waveShape: 'double_pulse',
      intensity: 0.65,
      rhythmSpeed: 1.0,
      duration: 3.5,
      color: ORB_PALETTES.violet,
      sharedMeaning: 'Breathe with me',
      createdAt: Date.now() - 1000 * 60 * 35,
    }
  },
  {
    id: 'mem-2',
    personId: 'p-arman',
    personName: 'Arman',
    timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    sharedMeaning: 'Thinking of you',
    reflectionNote: 'Sent across the late afternoon while walking.',
    signal: {
      id: 'sig-m2',
      senderId: 'p-arman',
      recipientId: 'user',
      waveShape: 'soft_wave',
      intensity: 0.5,
      rhythmSpeed: 0.8,
      duration: 4.0,
      color: ORB_PALETTES.amber,
      sharedMeaning: 'Thinking of you',
      createdAt: Date.now() - 1000 * 60 * 60 * 3,
    }
  },
  {
    id: 'mem-3',
    personId: 'p-elena',
    personName: 'Elena',
    timestamp: Date.now() - 1000 * 60 * 60 * 26, // yesterday
    sharedMeaning: 'Look at the sky',
    reflectionNote: 'The crescent moon was hovering over the hills.',
    signal: {
      id: 'sig-m3',
      senderId: 'p-elena',
      recipientId: 'user',
      waveShape: 'starlit_flicker',
      intensity: 0.7,
      rhythmSpeed: 1.3,
      duration: 4.5,
      color: ORB_PALETTES.cyan,
      sharedMeaning: 'Look at the sky',
      createdAt: Date.now() - 1000 * 60 * 60 * 26,
    }
  },
  {
    id: 'mem-4',
    personId: 'p-kael',
    personName: 'Kael',
    timestamp: Date.now() - 1000 * 60 * 60 * 72, // 3 days ago
    sharedMeaning: 'Quiet company',
    reflectionNote: 'Sitting in mutual silence across hundreds of miles.',
    signal: {
      id: 'sig-m4',
      senderId: 'p-kael',
      recipientId: 'user',
      waveShape: 'steady_hum',
      intensity: 0.35,
      rhythmSpeed: 0.6,
      duration: 5.0,
      color: ORB_PALETTES.sage,
      sharedMeaning: 'Quiet company',
      createdAt: Date.now() - 1000 * 60 * 60 * 72,
    }
  }
];
