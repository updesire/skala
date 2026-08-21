export type OrbColor = {
  name: string;
  primary: string; // e.g. '#df8a5a'
  glow: string;    // e.g. 'rgba(223, 138, 90, 0.4)'
  ambient: string; // e.g. 'rgba(223, 138, 90, 0.08)'
  accent: string;  // e.g. '#f5cba7'
};

export type PresenceState = 'present' | 'deep_focus' | 'quiet' | 'reaching' | 'resting';

export type OrbTexture = 'fluid' | 'aurora' | 'stardust' | 'crystalline' | 'deep_core';

export type MotionPersonality = 'meditative' | 'lively' | 'subtle' | 'pulsing' | 'resonant';

export interface Person {
  id: string;
  name: string;
  relationship: string;
  color: OrbColor;
  presence: PresenceState;
  texture: OrbTexture;
  motionPersonality: MotionPersonality;
  breathRate: number; // seconds per cycle (e.g. 4.5)
  baseDistance: number; // 0.2 (close) to 0.9 (distant)
  angle: number; // radians around center
  x: number; // viewport normalized 0..1
  y: number; // viewport normalized 0..1
  avatarUrl?: string;
  bioSnippet?: string;
  lastInteraction?: string;
}

export type WaveShape = 'soft_wave' | 'double_pulse' | 'radiant_burst' | 'starlit_flicker' | 'deep_echo' | 'steady_hum';

export interface TapPoint {
  id?: string;
  time: number; // ms offset from start of loop
  x: number; // 0..1 relative touch position
  y: number; // 0..1 relative touch position
  intensity: number; // 0.1 .. 1.0 touch force/pressure
  pitchFreq?: number; // audio pitch frequency
}

export interface CustomTapLoop {
  id: string;
  name: string;
  description?: string;
  taps: TapPoint[];
  totalDuration: number; // in ms
  color?: OrbColor;
  tempoSpeed?: number;
  createdAt: number;
  authorName: string;
  authorId?: string;
  targetPersonId?: string;
}

export interface CoTouchState {
  active: boolean;
  userId: string;
  userName: string;
  userColor: OrbColor;
  targetPersonId?: string;
  x: number; // 0..1 normalized coords
  y: number;
  intensity: number;
  updatedAt: number;
}

export interface CoTouchBridge {
  id: string;
  userA: {
    id: string;
    name: string;
    color: OrbColor;
    x: number;
    y: number;
  };
  userB: {
    id: string;
    name: string;
    color: OrbColor;
    x: number;
    y: number;
  };
  harmonyScore: number;
  activeSince: number;
}

export interface SignalData {
  id: string;
  senderId: string;
  recipientId: string;
  waveShape: WaveShape;
  intensity: number; // 0.1 to 1.0
  rhythmSpeed: number; // 0.5 to 2.0
  duration: number; // in seconds
  color: OrbColor;
  sharedMeaning?: string;
  customTapLoop?: CustomTapLoop;
  createdAt: number;
  read?: boolean;
}

export interface SharedLanguageItem {
  id: string;
  personId: string;
  waveShape: WaveShape;
  intensity: number;
  label: string;
  description: string;
  createdAt: number;
}

export interface MemoryItem {
  id: string;
  personId: string;
  personName: string;
  signal: SignalData;
  timestamp: number;
  sharedMeaning: string;
  reflectionNote?: string;
}

export interface UserIdentity {
  id?: string;
  name: string;
  email?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  color: OrbColor;
  presence: PresenceState;
  texture: OrbTexture;
  motionPersonality: MotionPersonality;
  breathRate: number;
}

export interface CircleGroup {
  id: string;
  name: string;
  description?: string;
  hostName: string;
  hostEmail?: string;
  hostId: string;
  createdAt: number;
  memberCount: number;
  isCustom?: boolean;
  colorTheme?: string;
  iconName?: string;
}

export interface TouchRipple {
  id: string;
  x: number;
  y: number;
  color: string;
  radius: number;
  maxRadius: number;
  opacity: number;
  birth: number;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: number;
  lastSeen?: number;
  texture?: string;
  presence?: string;
  color?: OrbColor;
}

export interface AdminSpaceRecord {
  id: string;
  name: string;
  description?: string;
  hostName: string;
  hostEmail?: string;
  hostId: string;
  createdAt: number;
  memberCount: number;
  signalsCount?: number;
}

export interface AdminStatsOverview {
  databaseType: 'mysql' | 'local_file';
  mysqlConnected: boolean;
  dbHost?: string;
  dbName?: string;
  totalUsers: number;
  totalSpaces: number;
  totalSignals: number;
  totalPushSubscriptions: number;
  activeOnlineUsers: number;
  serverUptimeSeconds: number;
  superAdminEmail: string;
}

export interface TravelingSignal {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number; // 0 to 1
  color: OrbColor;
  waveShape: WaveShape;
  intensity: number;
  senderName: string;
  recipientName: string;
  meaning?: string;
  customTapLoop?: CustomTapLoop;
}

