import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import webpush from "web-push";

interface Participant {
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
  lastSeen: number;
  x?: number;
  y?: number;
  angle?: number;
  distance?: number;
}

interface TapPoint {
  id?: string;
  time: number;
  x: number;
  y: number;
  intensity: number;
  pitchFreq?: number;
}

interface CustomTapLoop {
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

interface SignalEvent {
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
  customTapLoop?: CustomTapLoop;
  timestamp: number;
}

interface PushSubscriptionRecord {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: string;
  spaceId: string;
  createdAt: number;
}

interface SpaceState {
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

// In-memory real-time state for spaces
const spaces = new Map<string, SpaceState>();

// Pre-populate Master Default Circle
const DEFAULT_MASTER_SPACE_ID = "main-cosmic-circle";
spaces.set(DEFAULT_MASTER_SPACE_ID, {
  id: DEFAULT_MASTER_SPACE_ID,
  name: "حلقه اصلی آتریا • Aetheria Sanctuary",
  description: "فضای مرکزی و کیهانی حضور آرامش‌بخش",
  hostName: "مدیر ارشد (soraun)",
  hostEmail: "soraun.com@gmail.com",
  hostId: "host-superadmin",
  createdAt: Date.now() - 86400000,
  participants: new Map(),
  signals: [],
});
// Active SSE connections: spaceId -> Set of Response objects
const sseClients = new Map<string, Set<{ res: Response; userId: string }>>();
// Push Subscriptions: spaceId -> Map<endpoint, PushSubscriptionRecord>
const pushSubscriptions = new Map<string, Map<string, PushSubscriptionRecord>>();
const SUBSCRIPTIONS_FILE = path.join(process.cwd(), ".push-subscriptions.json");

function loadPushSubscriptions() {
  try {
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
  } catch (err) {
    console.warn("Failed to load push subscriptions:", err);
  }
}

function savePushSubscriptions() {
  try {
    const data: Record<string, PushSubscriptionRecord[]> = {};
    for (const [spaceId, map] of pushSubscriptions.entries()) {
      data[spaceId] = Array.from(map.values());
    }
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed to save push subscriptions:", err);
  }
}

loadPushSubscriptions();

// VAPID Keys setup for iOS / Web Push
const VAPID_KEY_FILE = path.join(process.cwd(), ".vapid-keys.json");
let vapidKeys: { publicKey: string; privateKey: string };

try {
  if (fs.existsSync(VAPID_KEY_FILE)) {
    const raw = fs.readFileSync(VAPID_KEY_FILE, "utf-8");
    vapidKeys = JSON.parse(raw);
  } else {
    vapidKeys = webpush.generateVAPIDKeys();
    fs.writeFileSync(VAPID_KEY_FILE, JSON.stringify(vapidKeys, null, 2), "utf-8");
  }
} catch {
  vapidKeys = webpush.generateVAPIDKeys();
}

const VAPID_SUBJECT = "mailto:soraun.com@gmail.com";
webpush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);

async function sendPushNotificationToSpace(
  spaceId: string,
  payload: { title: string; body: string; data?: any },
  excludeUserId?: string,
  targetRecipientId?: string
) {
  // Collect all relevant subscriptions from target space and fallback to default space
  let targetSubs: PushSubscriptionRecord[] = [];
  const spaceSubs = pushSubscriptions.get(spaceId);
  if (spaceSubs && spaceSubs.size > 0) {
    targetSubs.push(...Array.from(spaceSubs.values()));
  }

  // Also include subscriptions from the master circle if different
  if (spaceId !== DEFAULT_MASTER_SPACE_ID && pushSubscriptions.has(DEFAULT_MASTER_SPACE_ID)) {
    const masterSubs = pushSubscriptions.get(DEFAULT_MASTER_SPACE_ID)!;
    for (const sub of masterSubs.values()) {
      if (!targetSubs.some((s) => s.endpoint === sub.endpoint)) {
        targetSubs.push(sub);
      }
    }
  }

  // Also include any global registered subscription if no other candidates found
  if (targetSubs.length === 0) {
    for (const map of pushSubscriptions.values()) {
      for (const sub of map.values()) {
        if (!targetSubs.some((s) => s.endpoint === sub.endpoint)) {
          targetSubs.push(sub);
        }
      }
    }
  }

  if (targetSubs.length === 0) return;

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: payload.data || { url: `/?space=${spaceId}`, spaceId },
  });

  // Check if targetRecipientId matches any specific subscriber exactly
  const hasExactRecipient =
    targetRecipientId &&
    targetSubs.some((s) => s.userId && s.userId.toLowerCase() === targetRecipientId.toLowerCase());

  let hasDeadEndpoints = false;

  for (const sub of targetSubs) {
    // Skip sender's own device
    if (excludeUserId && sub.userId && sub.userId.toLowerCase() === excludeUserId.toLowerCase()) {
      continue;
    }

    // If an exact recipient exists and matches, send only to them; otherwise send to all in space
    if (hasExactRecipient && sub.userId && sub.userId.toLowerCase() !== targetRecipientId!.toLowerCase()) {
      continue;
    }

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
          TTL: 86400, // 24 hours delivery guarantee
          urgency: "high",
          headers: {
            Topic: "presence-signal",
          },
        }
      );
    } catch (err: any) {
      console.warn("Push delivery error for endpoint:", sub.endpoint, err?.statusCode || err?.message);
      // 404 or 410 means subscription expired or was revoked by iOS APNs
      if (err.statusCode === 404 || err.statusCode === 410) {
        for (const map of pushSubscriptions.values()) {
          map.delete(sub.endpoint);
        }
        hasDeadEndpoints = true;
      }
    }
  }

  if (hasDeadEndpoints) {
    savePushSubscriptions();
  }
}

const SUPER_ADMIN_EMAIL = "soraun.com@gmail.com";

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

// Clean up stale participants every 15 seconds
setInterval(() => {
  const now = Date.now();
  const timeoutMs = 45000; // 45 seconds timeout

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
    }
  }
}, 15000);

// API Endpoints

// 0. User Registration / Auth with Email
app.post("/api/auth/register", (req: Request, res: Response) => {
  const { name, email, color, texture, presence } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "نام و ایمیل الزامی است" });
  }

  const cleanEmail = email.trim().toLowerCase();
  const isSuperAdmin = cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase();

  res.json({
    success: true,
    user: {
      id: `user-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`,
      name: name.trim(),
      email: cleanEmail,
      isAdmin: true, // admin of their own circles
      isSuperAdmin,  // global super admin if soraun.com@gmail.com
      color: color || {
        name: isSuperAdmin ? "Solar Amber" : "Celestial Cyan",
        primary: isSuperAdmin ? "#f59e0b" : "#0ea5e9",
        glow: isSuperAdmin ? "rgba(245, 158, 11, 0.65)" : "rgba(14, 165, 233, 0.65)",
        ambient: isSuperAdmin ? "rgba(245, 158, 11, 0.18)" : "rgba(14, 165, 233, 0.18)",
        accent: isSuperAdmin ? "#fbbf24" : "#38bdf8",
      },
      presence: presence || "present",
      texture: texture || (isSuperAdmin ? "aurora" : "fluid"),
      motionPersonality: "meditative",
      breathRate: 4.5,
    },
  });
});

// 0.1 List All Circles
app.get("/api/circles", (req: Request, res: Response) => {
  const { userEmail } = req.query;
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

// 0.2 Create New Circle
app.post("/api/circles", (req: Request, res: Response) => {
  const { name, description, hostName, hostEmail, hostId } = req.body;
  if (!name) {
    return res.status(400).json({ error: "نام حلقه الزامی است" });
  }

  const cleanEmail = (hostEmail || "").trim().toLowerCase();
  const circleId = `circle-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  const newSpace: SpaceState = {
    id: circleId,
    name: name.trim(),
    description: description?.trim() || `حلقه اختصاصی ایجاد شده توسط ${hostName || "کاربر"}`,
    hostName: hostName || "مدیر حلقه",
    hostEmail: cleanEmail || undefined,
    hostId: hostId || `host-${Date.now()}`,
    createdAt: Date.now(),
    participants: new Map(),
    signals: [],
  };

  spaces.set(circleId, newSpace);

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

// 0.3 Delete Circle (by Host or SuperAdmin)
app.delete("/api/circles/:spaceId", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const { requesterEmail, requesterId } = req.body;

  if (spaceId === DEFAULT_MASTER_SPACE_ID) {
    return res.status(400).json({ error: "حلقه اصلی قابل حذف نیست" });
  }

  const space = spaces.get(spaceId);
  if (!space) {
    return res.status(404).json({ error: "حلقه یافت نشد" });
  }

  const isSuper = isSuperAdminEmail(requesterEmail);
  const isOwner = space.hostId === requesterId || (space.hostEmail && space.hostEmail.toLowerCase() === (requesterEmail || "").toLowerCase());

  if (!isSuper && !isOwner) {
    return res.status(403).json({ error: "فقط سازنده حلقه یا مدیر ارشد امکان حذف دارند" });
  }

  // Notify connected clients
  broadcastToSpace(spaceId, "CIRCLE_DELETED", { spaceId });
  spaces.delete(spaceId);

  res.json({ success: true, message: "حلقه با موفقیت حذف شد" });
});

// 1. Get Space Details & Active Members
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

// 2. Create or Join Space
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

  // Calculate dynamic circular position around circle for new joiner
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

  // Broadcast join event
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

// 3. Heartbeat / Presence update
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

// 4. Leave Space
app.post("/api/spaces/:spaceId/leave", (req: Request, res: Response) => {
  const { spaceId } = req.params;
  const { userId } = req.body;

  const space = spaces.get(spaceId);
  if (space && space.participants.has(userId)) {
    const left = space.participants.get(userId);
    space.participants.delete(userId);
    broadcastToSpace(spaceId, "MEMBER_LEFT", {
      userId,
      name: left?.name,
      participants: Array.from(space.participants.values()),
    });
  }

  res.json({ success: true });
});

// 5. Send Real-time Signal to Space
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

  broadcastToSpace(spaceId, "SIGNAL_RECEIVED", signalEvent);

  // Trigger real-time background Web Push to Apple APNs / devices
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

  const signalDescription = signalEvent.symbolMeaning
    ? `«${signalEvent.symbolMeaning}» • امضای ${waveInfo.nameFa} (${intensityPct}٪)`
    : signalEvent.privateIntention
    ? `«${signalEvent.privateIntention}» • امضای ${waveInfo.nameFa} (${intensityPct}٪)`
    : `یک «${waveInfo.nameFa}» با شدت ${intensityPct}٪ برای شما فرستاد ${waveInfo.emoji}`;

  sendPushNotificationToSpace(
    spaceId,
    {
      title: `${signalEvent.senderName} • ${waveInfo.nameFa} ${waveInfo.emoji}`,
      body: signalDescription,
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

// 6. Push Notifications Subscription Endpoints
app.get("/api/push/vapid-public-key", (_req: Request, res: Response) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

app.post("/api/push/subscribe", (req: Request, res: Response) => {
  const { spaceId, userId, subscription } = req.body;

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
    createdAt: Date.now(),
  });

  savePushSubscriptions();
  res.json({ success: true, count: spaceSubs.size });
});

app.post("/api/push/unsubscribe", (req: Request, res: Response) => {
  const { spaceId, subscription } = req.body;

  if (spaceId && subscription?.endpoint && pushSubscriptions.has(spaceId)) {
    pushSubscriptions.get(spaceId)!.delete(subscription.endpoint);
    savePushSubscriptions();
  }

  res.json({ success: true });
});

// 7. Send Immediate Test Notification to User's Device
app.post("/api/push/test", async (req: Request, res: Response) => {
  const { subscription, name } = req.body;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: "Invalid subscription" });
  }

  try {
    const payloadString = JSON.stringify({
      title: "اتریا • تست اعلان آیفون",
      body: `سلام ${name || "عزیز"}! نوتیفیکیشن در حالت خروج و صفحه قفل با موفقیت فعال شد ✨`,
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

// 8. Synchronous Co-Touch Real-Time Bridge Synchronization
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
  const { action, touch } = req.body; // action: 'start' | 'move' | 'end'

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

  // Check if multiple users are touching simultaneously in this space
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

// 9. Custom Sensory Tap Loops Storage & Retrieval
const sharedTapLoops = new Map<string, CustomTapLoop[]>();

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

  broadcastToSpace(spaceId, "TAP_LOOP_SAVED", { tapLoop: newLoop });

  res.json({ success: true, tapLoop: newLoop });
});

// 10. Server-Sent Events (SSE) for instant live streaming
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

  // Send initial handshake
  const space = spaces.get(spaceId);
  res.write(
    `data: ${JSON.stringify({
      type: "CONNECTED",
      spaceId,
      participants: space ? Array.from(space.participants.values()) : [],
      timestamp: Date.now(),
    })}\n\n`
  );

  // Keep-alive ping every 15s to prevent connection drops
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

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", activeSpaces: spaces.size });
});

// Vite middleware for development & Static serving for production
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
    console.log(`Aetheria server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
