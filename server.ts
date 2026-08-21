import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";

export interface Participant {
  id: string;
  name: string;
  relationship?: string;
  color: {
    base: string;
    accent: string;
    glow: string;
    border: string;
  };
  presence: string;
  texture: string;
  breathRate: number;
  bioSnippet?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  role?: 'user' | 'admin' | 'super_admin';
  lastSeen: number;
  x?: number;
  y?: number;
  angle?: number;
  distance?: number;
}

export interface TapPoint {
  id?: string;
  time: number;
  x: number;
  y: number;
  intensity: number;
  pitchFreq?: number;
}

export interface CustomTapLoop {
  id: string;
  name: string;
  description?: string;
  taps: TapPoint[];
  totalDuration: number;
  color?: any;
  tempoSpeed?: number;
  createdAt: number;
  authorName: string;
  authorId?: string;
  targetPersonId?: string;
}

export interface SignalEvent {
  id: string;
  senderId: string;
  senderName: string;
  recipientId?: string; // empty means broadcast to all
  wave: string;
  intensity: number;
  tempo: number;
  color: string;
  privateIntention?: string;
  symbolMeaning?: string;
  sourceType?: 'gesture' | 'tap_loop' | 'resonance' | 'biometric_rhythm';
  customTapLoop?: CustomTapLoop;
  timestamp: number;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  spaceId: string;
  privacyLevel?: 'normal' | 'private' | 'generic';
  createdAt: number;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: number;
  color: any;
  texture: string;
  presence: string;
}

export interface UserSession {
  token: string;
  userId: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: number;
  expiresAt: number;
}

export interface SpaceState {
  id: string;
  name: string;
  description?: string;
  hostName: string;
  hostEmail?: string;
  hostId: string;
  createdAt: number;
  participants: Map<string, Participant>;
  signals: SignalEvent[];
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Disk storage paths for PostgreSQL-compatible persistence layer
const DATA_DIR = path.join(process.cwd(), ".data");
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");
const SPACES_FILE = path.join(DATA_DIR, "spaces.json");
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, "push-subscriptions.json");
const TAP_LOOPS_FILE = path.join(DATA_DIR, "tap-loops.json");

// In-memory caches backed by disk persistence
const users = new Map<string, UserAccount>(); // email -> UserAccount
const usersById = new Map<string, UserAccount>(); // id -> UserAccount
const sessions = new Map<string, UserSession>(); // token -> UserSession
const spaces = new Map<string, SpaceState>(); // spaceId -> SpaceState
const pushSubscriptions = new Map<string, Map<string, PushSubscriptionRecord>>(); // spaceId -> Map<endpoint, sub>
const sharedTapLoops = new Map<string, CustomTapLoop[]>(); // spaceId -> CustomTapLoop[]
const sseClients = new Map<string, Set<{ res: Response; userId: string }>>();

const SUPER_ADMIN_EMAIL = "soraun.com@gmail.com";
const DEFAULT_MASTER_SPACE_ID = "main-cosmic-circle";

// Persistence load functions
function loadDataFromDisk() {
  try {
    // 1. Users
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf-8");
      const list: UserAccount[] = JSON.parse(raw);
      for (const u of list) {
        users.set(u.email.toLowerCase(), u);
        usersById.set(u.id, u);
      }
    }

    // 2. Sessions
    if (fs.existsSync(SESSIONS_FILE)) {
      const raw = fs.readFileSync(SESSIONS_FILE, "utf-8");
      const list: UserSession[] = JSON.parse(raw);
      const now = Date.now();
      for (const s of list) {
        if (s.expiresAt > now) {
          sessions.set(s.token, s);
        }
      }
    }

    // 3. Spaces
    if (fs.existsSync(SPACES_FILE)) {
      const raw = fs.readFileSync(SPACES_FILE, "utf-8");
      const list: Array<Omit<SpaceState, "participants"> & { participants: Participant[] }> = JSON.parse(raw);
      for (const s of list) {
        const pMap = new Map<string, Participant>();
        for (const p of s.participants || []) {
          pMap.set(p.id, p);
        }
        spaces.set(s.id, {
          ...s,
          participants: pMap,
          signals: s.signals || [],
        });
      }
    }

    // 4. Push Subscriptions
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, "utf-8");
      const data: Record<string, PushSubscriptionRecord[]> = JSON.parse(raw);
      for (const [spaceId, subs] of Object.entries(data)) {
        if (!pushSubscriptions.has(spaceId)) {
          pushSubscriptions.set(spaceId, new Map());
        }
        const map = pushSubscriptions.get(spaceId)!;
        for (const sub of subs) {
          if (sub?.endpoint && sub?.keys) {
            map.set(sub.endpoint, sub);
          }
        }
      }
    }

    // 5. Tap Loops
    if (fs.existsSync(TAP_LOOPS_FILE)) {
      const raw = fs.readFileSync(TAP_LOOPS_FILE, "utf-8");
      const data: Record<string, CustomTapLoop[]> = JSON.parse(raw);
      for (const [spaceId, loops] of Object.entries(data)) {
        sharedTapLoops.set(spaceId, loops);
      }
    }
  } catch (err) {
    console.warn("[SKALA Server] Data load error:", err);
  }

  // Ensure default master space exists
  if (!spaces.has(DEFAULT_MASTER_SPACE_ID)) {
    spaces.set(DEFAULT_MASTER_SPACE_ID, {
      id: DEFAULT_MASTER_SPACE_ID,
      name: "حلقه اصلی اسکالا • SKALA Sanctuary",
      description: "فضای مرکزی و کیهانی حضور آرامش‌بخش",
      hostName: "مدیر ارشد (soraun)",
      hostEmail: SUPER_ADMIN_EMAIL,
      hostId: "host-superadmin",
      createdAt: Date.now() - 86400000,
      participants: new Map(),
      signals: [],
    });
    saveSpacesToDisk();
  }
}

function saveUsersToDisk() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(users.values()), null, 2));
  } catch {}
}

function saveSessionsToDisk() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(Array.from(sessions.values()), null, 2));
  } catch {}
}

function saveSpacesToDisk() {
  try {
    const list = Array.from(spaces.values()).map((s) => ({
      ...s,
      participants: Array.from(s.participants.values()),
    }));
    fs.writeFileSync(SPACES_FILE, JSON.stringify(list, null, 2));
  } catch {}
}

function savePushSubscriptionsToDisk() {
  try {
    const data: Record<string, PushSubscriptionRecord[]> = {};
    for (const [spaceId, map] of pushSubscriptions.entries()) {
      data[spaceId] = Array.from(map.values());
    }
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

function saveTapLoopsToDisk() {
  try {
    const data: Record<string, CustomTapLoop[]> = {};
    for (const [spaceId, loops] of sharedTapLoops.entries()) {
      data[spaceId] = loops;
    }
    fs.writeFileSync(TAP_LOOPS_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

loadDataFromDisk();

// VAPID Keys setup for Push Notifications
const VAPID_KEY_FILE = path.join(DATA_DIR, "vapid-keys.json");
let vapidKeys: { publicKey: string; privateKey: string };

try {
  if (fs.existsSync(VAPID_KEY_FILE)) {
    vapidKeys = JSON.parse(fs.readFileSync(VAPID_KEY_FILE, "utf-8"));
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_KEY_FILE, JSON.stringify(vapidKeys, null, 2));
  }
} catch {
  vapidKeys = webpush.generateVAPIDKeys();
}

const VAPID_SUBJECT = `mailto:${SUPER_ADMIN_EMAIL}`;
webpush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);

// Authentication & Authorization Helper Functions & Middlewares
export interface AuthRequest extends Request {
  user?: UserAccount;
  sessionToken?: string;
}

function authenticate(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const customHeader = (req.headers["x-session-token"] as string) || null;
  const queryToken = (req.query.sessionToken as string) || null;

  const token = headerToken || customHeader || queryToken;
  if (token && sessions.has(token)) {
    const session = sessions.get(token)!;
    if (session.expiresAt > Date.now()) {
      const user = usersById.get(session.userId);
      if (user) {
        req.user = user;
        req.sessionToken = token;
      }
    }
  }
  next();
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "احراز هویت الزامی است" });
  }
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "super_admin")) {
    return res.status(403).json({ error: "دسترسی مجاز نیست" });
  }
  next();
}

app.use(authenticate);

function generateSecureSession(user: UserAccount): UserSession {
  const token = `skala_sess_${crypto.randomBytes(32).toString("hex")}`;
  const session: UserSession = {
    token,
    userId: user.id,
    role: user.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  sessions.set(token, session);
  saveSessionsToDisk();
  return session;
}

function isSuperAdminEmail(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

function getOrCreateSpace(
  spaceId: string,
  hostName = "مدیر فضا",
  hostId = "",
  hostEmail = "",
  description = ""
): SpaceState {
  if (!spaces.has(spaceId)) {
    spaces.set(spaceId, {
      id: spaceId,
      name: `حلقه ${hostName}`,
      description: description || `فضای حضور و اتصال آرامش‌بخش`,
      hostName,
      hostEmail: hostEmail || (isSuperAdminEmail(hostEmail) ? SUPER_ADMIN_EMAIL : undefined),
      hostId,
      createdAt: Date.now(),
      participants: new Map(),
      signals: [],
    });
    saveSpacesToDisk();
  }
  const s = spaces.get(spaceId)!;
  if (hostEmail && !s.hostEmail) {
    s.hostEmail = hostEmail;
  }
  if (description && !s.description) {
    s.description = description;
  }
  return s;
}

function broadcastToSpace(spaceId: string, type: string, data: any) {
  const clients = sseClients.get(spaceId);
  if (!clients || clients.size === 0) return;

  const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}

// Push notification sender with Privacy Mode support
async function sendPushNotificationToSpace(
  spaceId: string,
  payload: {
    senderName: string;
    waveName: string;
    waveEmoji: string;
    intensityPct: number;
    symbolMeaning?: string;
    privateIntention?: string;
    data?: any;
  },
  excludeUserId?: string,
  targetRecipientId?: string
) {
  let targetSubs: PushSubscriptionRecord[] = [];
  const spaceSubs = pushSubscriptions.get(spaceId);
  if (spaceSubs && spaceSubs.size > 0) {
    targetSubs.push(...Array.from(spaceSubs.values()));
  }

  if (spaceId !== DEFAULT_MASTER_SPACE_ID && pushSubscriptions.has(DEFAULT_MASTER_SPACE_ID)) {
    const masterSubs = pushSubscriptions.get(DEFAULT_MASTER_SPACE_ID)!;
    for (const sub of masterSubs.values()) {
      if (!targetSubs.some((s) => s.endpoint === sub.endpoint)) {
        targetSubs.push(sub);
      }
    }
  }

  if (targetSubs.length === 0) return;

  const hasExactRecipient =
    targetRecipientId &&
    targetSubs.some((s) => s.userId && s.userId.toLowerCase() === targetRecipientId.toLowerCase());

  let hasDeadEndpoints = false;

  for (const sub of targetSubs) {
    if (excludeUserId && sub.userId && sub.userId.toLowerCase() === excludeUserId.toLowerCase()) {
      continue;
    }

    if (hasExactRecipient && sub.userId && sub.userId.toLowerCase() !== targetRecipientId!.toLowerCase()) {
      continue;
    }

    // Privacy-aware notification titles and bodies
    let title = `${payload.senderName} • ${payload.waveName} ${payload.waveEmoji}`;
    let body = payload.symbolMeaning
      ? `امضای «${payload.symbolMeaning}» (${payload.intensityPct}٪)`
      : `سیگنال «${payload.waveName}» با شدت ${payload.intensityPct}٪`;

    if (sub.privacyLevel === "generic" || sub.privacyLevel === "private") {
      title = "SKALA • حضور آرامش‌بخش";
      body = "یک حضور تازه منتظر توست ✨";
    }

    const payloadString = JSON.stringify({
      title,
      body,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: payload.data || { url: `/?space=${spaceId}`, spaceId },
    });

    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        },
        payloadString,
        {
          TTL: 86400,
          urgency: "high",
          headers: {
            Topic: "presence-signal",
          },
        }
      );
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        for (const map of pushSubscriptions.values()) {
          map.delete(sub.endpoint);
        }
        hasDeadEndpoints = true;
      }
    }
  }

  if (hasDeadEndpoints) {
    savePushSubscriptionsToDisk();
  }
}

// Clean up stale participants every 20 seconds
setInterval(() => {
  const now = Date.now();
  const timeoutMs = 45000;

  for (const [spaceId, space] of spaces.entries()) {
    let changed = false;
    for (const [userId, participant] of space.participants.entries()) {
      if (now - participant.lastSeen > timeoutMs && !participant.isAdmin) {
        space.participants.delete(userId);
        changed = true;
      }
    }
    if (changed) {
      broadcastToSpace(spaceId, "MEMBERS_UPDATED", {
        participants: Array.from(space.participants.values()),
      });
      saveSpacesToDisk();
    }
  }
}, 20000);

// ==========================================
// API ENDPOINTS
// ==========================================

// 1. User Registration & Secure Auth
app.post("/api/auth/register", (req: Request, res: Response) => {
  const { name, email, color, texture, presence } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "نام و ایمیل الزامی است" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const isSuper = isSuperAdminEmail(cleanEmail);
  const role: 'user' | 'admin' | 'super_admin' = isSuper ? "super_admin" : "admin";

  let user = users.get(cleanEmail);
  if (!user) {
    user = {
      id: `user-${crypto.randomBytes(6).toString("hex")}`,
      name: name.trim(),
      email: cleanEmail,
      role,
      createdAt: Date.now(),
      color: color || {
        name: isSuper ? "Solar Amber" : "Celestial Cyan",
        primary: isSuper ? "#f59e0b" : "#0ea5e9",
        glow: isSuper ? "rgba(245, 158, 11, 0.65)" : "rgba(14, 165, 233, 0.65)",
        ambient: isSuper ? "rgba(245, 158, 11, 0.18)" : "rgba(14, 165, 233, 0.18)",
        accent: isSuper ? "#fbbf24" : "#38bdf8",
      },
      texture: texture || (isSuper ? "aurora" : "fluid"),
      presence: presence || "present",
    };
    users.set(cleanEmail, user);
    usersById.set(user.id, user);
    saveUsersToDisk();
  } else {
    user.name = name.trim();
    if (color) user.color = color;
    if (texture) user.texture = texture;
    user.role = role;
    saveUsersToDisk();
  }

  const session = generateSecureSession(user);

  res.json({
    success: true,
    sessionToken: session.token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.role === "admin" || user.role === "super_admin",
      isSuperAdmin: user.role === "super_admin",
      role: user.role,
      color: user.color,
      presence: user.presence,
      texture: user.texture,
      motionPersonality: "meditative",
      breathRate: 4.5,
    },
  });
});

// 2. Get Current Auth Status
app.get("/api/auth/me", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isAdmin: req.user.role === "admin" || req.user.role === "super_admin",
      isSuperAdmin: req.user.role === "super_admin",
      color: req.user.color,
      presence: req.user.presence,
      texture: req.user.texture,
    },
  });
});

// 3. Circles Management
app.get("/api/circles", (_req: Request, res: Response) => {
  const list = Array.from(spaces.values()).map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description || "",
    hostName: s.hostName,
    hostEmail: s.hostEmail || "",
    hostId: s.hostId,
    createdAt: s.createdAt,
    memberCount: s.participants.size,
    isSuperAdminHost: isSuperAdminEmail(s.hostEmail),
  }));

  res.json({
    success: true,
    circles: list,
    superAdminEmail: SUPER_ADMIN_EMAIL,
  });
});

app.post("/api/circles", (req: AuthRequest, res: Response) => {
  const { name, description, hostName, hostEmail, hostId } = req.body;
  if (!name) {
    return res.status(400).json({ error: "نام حلقه الزامی است" });
  }

  const effectiveHostName = req.user?.name || hostName || "مدیر حلقه";
  const effectiveHostEmail = req.user?.email || (hostEmail || "").trim().toLowerCase();
  const effectiveHostId = req.user?.id || hostId || `host-${Date.now()}`;
  const circleId = `circle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const newSpace: SpaceState = {
    id: circleId,
    name: name.trim(),
    description: description?.trim() || `حلقه اختصاصی ایجاد شده توسط ${effectiveHostName}`,
    hostName: effectiveHostName,
    hostEmail: effectiveHostEmail || undefined,
    hostId: effectiveHostId,
    createdAt: Date.now(),
    participants: new Map(),
    signals: [],
  };

  spaces.set(circleId, newSpace);
  saveSpacesToDisk();

  res.json({
    success: true,
    circle: {
      id: newSpace.id,
      name: newSpace.name,
      description: newSpace.description,
      hostName: newSpace.hostName,
      hostEmail: newSpace.hostEmail,
      hostId: newSpace.hostId,
      createdAt: newSpace.createdAt,
      memberCount: 0,
    },
  });
});

app.delete("/api/circles/:spaceId", (req: AuthRequest, res: Response) => {
  const { spaceId } = req.params;
  const { requesterEmail, requesterId } = req.body;

  if (spaceId === DEFAULT_MASTER_SPACE_ID) {
    return res.status(400).json({ error: "حلقه اصلی قابل حذف نیست" });
  }

  const space = spaces.get(spaceId);
  if (!space) {
    return res.status(404).json({ error: "حلقه یافت نشد" });
  }

  const userEmail = req.user?.email || requesterEmail;
  const userId = req.user?.id || requesterId;

  const isSuper = req.user?.role === "super_admin" || isSuperAdminEmail(userEmail);
  const isOwner = space.hostId === userId || (space.hostEmail && space.hostEmail.toLowerCase() === (userEmail || "").toLowerCase());

  if (!isSuper && !isOwner) {
    return res.status(403).json({ error: "فقط سازنده حلقه یا مدیر ارشد امکان حذف دارند" });
  }

  broadcastToSpace(spaceId, "CIRCLE_DELETED", { spaceId });
  spaces.delete(spaceId);
  saveSpacesToDisk();

  res.json({ success: true, message: "حلقه با موفقیت حذف شد" });
});

// 4. Space Details & Join
app.get("/api/spaces/:spaceId", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const space = spaces.get(spaceId);

  if (!space) {
    return res.json({
      exists: false,
      spaceId,
      participants: [],
    });
  }

  res.json({
    exists: true,
    space: {
      id: space.id,
      name: space.name,
      description: space.description,
      hostName: space.hostName,
      hostEmail: space.hostEmail,
      hostId: space.hostId,
      createdAt: space.createdAt,
      participants: Array.from(space.participants.values()),
    },
  });
});

app.post("/api/spaces/:spaceId/join", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const { participant, spaceName, hostEmail, description } = req.body;

  if (!participant || !participant.id || !participant.name) {
    return res.status(400).json({ error: "Invalid participant data" });
  }

  const space = getOrCreateSpace(
    spaceId,
    participant.isAdmin ? participant.name : undefined,
    participant.isAdmin ? participant.id : undefined,
    hostEmail,
    description
  );

  if (spaceName && participant.isAdmin) {
    space.name = spaceName;
  }

  const memberCount = space.participants.size;
  const angle = memberCount === 0 ? -1.57 : (memberCount * (2 * Math.PI / Math.max(memberCount + 1, 5))) - 1.57;
  const distance = 0.55;
  const x = 0.5 + Math.cos(angle) * (distance * 0.42);
  const y = 0.5 + Math.sin(angle) * (distance * 0.42);

  const updatedParticipant: Participant = {
    ...participant,
    lastSeen: Date.now(),
    angle: participant.angle ?? angle,
    distance: participant.distance ?? distance,
    x: participant.x ?? x,
    y: participant.y ?? y,
  };

  space.participants.set(participant.id, updatedParticipant);
  saveSpacesToDisk();

  broadcastToSpace(spaceId, "MEMBER_JOINED", {
    participant: updatedParticipant,
    participants: Array.from(space.participants.values()),
  });

  res.json({
    success: true,
    space: {
      id: space.id,
      name: space.name,
      description: space.description,
      hostName: space.hostName,
      hostEmail: space.hostEmail,
      hostId: space.hostId,
      participants: Array.from(space.participants.values()),
    },
    participant: updatedParticipant,
  });
});

// 5. Heartbeat & Presence
app.post("/api/spaces/:spaceId/heartbeat", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const { userId, presence, bioSnippet } = req.body;

  const space = spaces.get(spaceId);
  if (!space) return res.status(404).json({ error: "Space not found" });

  const participant = space.participants.get(userId);
  if (participant) {
    participant.lastSeen = Date.now();
    if (presence && presence !== participant.presence) {
      participant.presence = presence;
      broadcastToSpace(spaceId, "PRESENCE_CHANGED", {
        userId,
        presence,
      });
    }
    if (bioSnippet !== undefined) {
      participant.bioSnippet = bioSnippet;
    }
  }

  res.json({ success: true, count: space.participants.size });
});

// 6. Leave Space
app.post("/api/spaces/:spaceId/leave", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const { userId } = req.body;

  const space = spaces.get(spaceId);
  if (space && space.participants.has(userId)) {
    const left = space.participants.get(userId);
    space.participants.delete(userId);
    saveSpacesToDisk();
    broadcastToSpace(spaceId, "MEMBER_LEFT", {
      userId,
      name: left?.name,
      participants: Array.from(space.participants.values()),
    });
  }

  res.json({ success: true });
});

// 7. Send Real-Time Non-Verbal Signal
app.post("/api/spaces/:spaceId/signal", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const { signal } = req.body;

  if (!signal || !signal.senderId) {
    return res.status(400).json({ error: "Invalid signal data" });
  }

  const space = spaces.get(spaceId);
  if (!space) return res.status(404).json({ error: "Space not found" });

  const signalEvent: SignalEvent = {
    ...signal,
    id: signal.id || `sig-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
  };

  space.signals.push(signalEvent);
  if (space.signals.length > 50) {
    space.signals.shift();
  }
  saveSpacesToDisk();

  broadcastToSpace(spaceId, "SIGNAL_RECEIVED", signalEvent);

  // Trigger Web Push Notification
  const waveLabels: Record<string, { nameFa: string; emoji: string }> = {
    soft_wave: { nameFa: "موج نرم", emoji: "〰️" },
    double_pulse: { nameFa: "تپش دوگانه", emoji: "💓" },
    radiant_burst: { nameFa: "فوران تابناک", emoji: "💥" },
    starlit_flicker: { nameFa: "سوسوی ستاره‌ای", emoji: "✨" },
    deep_echo: { nameFa: "پژواک عمیق", emoji: "🌊" },
    steady_hum: { nameFa: "زمزمه ممتد", emoji: "🔆" },
  };

  const waveInfo = waveLabels[signalEvent.wave] || { nameFa: "سیگنال نوری", emoji: "✨" };
  const intensityPct = Math.round((signalEvent.intensity || 0.6) * 100);

  sendPushNotificationToSpace(
    spaceId,
    {
      senderName: signalEvent.senderName,
      waveName: waveInfo.nameFa,
      waveEmoji: waveInfo.emoji,
      intensityPct,
      symbolMeaning: signalEvent.symbolMeaning,
      privateIntention: signalEvent.privateIntention,
      data: {
        url: `/?space=${spaceId}`,
        spaceId,
        signalId: signalEvent.id,
        senderId: signalEvent.senderId,
        wave: signalEvent.wave,
        intensity: signalEvent.intensity,
      },
    },
    signalEvent.senderId,
    signalEvent.recipientId
  );

  res.json({ success: true, signal: signalEvent });
});

// 8. Push Subscription Endpoints
app.get("/api/push/vapid-public-key", (_req: Request, res: Response) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post("/api/push/subscribe", (req: Request, res: Response) => {
  const { spaceId, userId, subscription, privacyLevel } = req.body;

  if (!spaceId || !subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: "Invalid subscription payload" });
  }

  if (!pushSubscriptions.has(spaceId)) {
    pushSubscriptions.set(spaceId, new Map());
  }

  const spaceSubs = pushSubscriptions.get(spaceId)!;
  spaceSubs.set(subscription.endpoint, {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    userId: userId || "anonymous",
    spaceId,
    privacyLevel: privacyLevel || "normal",
    createdAt: Date.now(),
  });

  savePushSubscriptionsToDisk();
  res.json({ success: true, count: spaceSubs.size });
});

app.post("/api/push/unsubscribe", (req: Request, res: Response) => {
  const { spaceId, subscription } = req.body;

  if (spaceId && subscription?.endpoint && pushSubscriptions.has(spaceId)) {
    pushSubscriptions.get(spaceId)!.delete(subscription.endpoint);
    savePushSubscriptionsToDisk();
  }

  res.json({ success: true });
});

app.post("/api/push/test", async (req: Request, res: Response) => {
  const { subscription, name } = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  try {
    const payloadString = JSON.stringify({
      title: "SKALA • تست اعلان آنی",
      body: `سلام ${name || "همراه عزیز"}! اتصال نوتیفیکیشن موبایل با موفقیت فعال شد ✨`,
      icon: "/icon.svg",
      badge: "/icon.svg",
      data: { url: "/", test: true },
    });

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      payloadString,
      {
        TTL: 60,
        urgency: "high",
      }
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error("Test push error:", err);
    res.status(500).json({ error: err.message || "Failed to send test push" });
  }
});

// 9. Synchronous Co-Touch Real-Time Bridge
interface ActiveTouchInfo {
  userId: string;
  userName: string;
  userColor: any;
  targetPersonId?: string;
  x: number;
  y: number;
  intensity: number;
  updatedAt: number;
}
const activeCoTouches = new Map<string, Map<string, ActiveTouchInfo>>();

app.post("/api/spaces/:spaceId/co-touch", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const { action, touch } = req.body;

  if (!spaceId || !touch || !touch.userId) {
    return res.status(400).json({ error: "Invalid touch payload" });
  }

  if (!activeCoTouches.has(spaceId)) {
    activeCoTouches.set(spaceId, new Map());
  }

  const spaceTouches = activeCoTouches.get(spaceId)!;

  if (action === "end") {
    spaceTouches.delete(touch.userId);
  } else {
    spaceTouches.set(touch.userId, {
      ...touch,
      updatedAt: Date.now(),
    });
  }

  const activeList = Array.from(spaceTouches.values()).filter(
    (t) => Date.now() - t.updatedAt < 2500
  );

  broadcastToSpace(spaceId, "CO_TOUCH_EVENT", {
    action,
    touch,
    activeTouches: activeList,
  });

  res.json({ success: true, activeCount: activeList.length });
});

// 10. Custom Sensory Tap Loops Storage & Retrieval
app.get("/api/spaces/:spaceId/tap-loops", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const loops = sharedTapLoops.get(spaceId) || [];
  res.json({ success: true, loops });
});

app.post("/api/spaces/:spaceId/tap-loops", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const { tapLoop } = req.body;

  if (!tapLoop || !tapLoop.name || !Array.isArray(tapLoop.taps)) {
    return res.status(400).json({ error: "Invalid tap loop data" });
  }

  if (!sharedTapLoops.has(spaceId)) {
    sharedTapLoops.set(spaceId, []);
  }

  const list = sharedTapLoops.get(spaceId)!;
  const newLoop: CustomTapLoop = {
    ...tapLoop,
    id: tapLoop.id || `loop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };

  list.unshift(newLoop);
  if (list.length > 40) list.pop();
  saveTapLoopsToDisk();

  broadcastToSpace(spaceId, "TAP_LOOP_SAVED", { tapLoop: newLoop });

  res.json({ success: true, tapLoop: newLoop });
});

// 11. Server-Sent Events (SSE)
app.get("/api/spaces/:spaceId/events", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const userId = (req.query.userId as string) || "anonymous";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  if (!sseClients.has(spaceId)) {
    sseClients.set(spaceId, new Set());
  }

  const client = { res, userId };
  sseClients.get(spaceId)!.add(client);

  const space = spaces.get(spaceId);
  res.write(
    `data: ${JSON.stringify({
      type: "CONNECTED",
      spaceId,
      participants: space ? Array.from(space.participants.values()) : [],
      timestamp: Date.now(),
    })}\n\n`
  );

  const pingInterval = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: "PING", timestamp: Date.now() })}\n\n`);
    } catch {
      clearInterval(pingInterval);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(pingInterval);
    const clients = sseClients.get(spaceId);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) {
        sseClients.delete(spaceId);
      }
    }
  });
});

// 12. Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    product: "SKALA",
    activeSpaces: spaces.size,
    registeredUsers: users.size,
    activeSessions: sessions.size,
  });
});

// Vite & Static server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SKALA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
