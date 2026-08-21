import { Person, SignalData, UserIdentity, OrbColor, CircleGroup, CoTouchState, CustomTapLoop } from '../types';
import { offlineQueue } from './offlineQueue';

export type SpaceEventHandler = (event: {
  type: 'CONNECTED' | 'MEMBER_JOINED' | 'MEMBER_LEFT' | 'MEMBERS_UPDATED' | 'SIGNAL_RECEIVED' | 'PRESENCE_CHANGED' | 'CIRCLE_DELETED' | 'CO_TOUCH_EVENT' | 'TAP_LOOP_SAVED';
  data: any;
}) => void;

class SpaceSyncService {
  private currentSpaceId: string | null = null;
  private currentUserId: string | null = null;
  private sessionToken: string | null = null;
  private eventSource: EventSource | null = null;
  private heartbeatInterval: any = null;
  private listeners: Set<SpaceEventHandler> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    try {
      if (typeof window !== 'undefined') {
        const savedToken = localStorage.getItem('skala_session_token');
        if (savedToken) {
          this.sessionToken = savedToken;
        }
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('skala_space_channel');
          this.broadcastChannel.onmessage = (event) => {
            this.notifyListeners(event.data.type, event.data.data);
          };
        }
      }
    } catch {
      // Ignore broadcast channel if unsupported
    }
  }

  public setSessionToken(token: string | null) {
    this.sessionToken = token;
  }

  public getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }
    return headers;
  }

  public subscribe(handler: SpaceEventHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  private notifyListeners(type: any, data: any) {
    for (const listener of this.listeners) {
      try {
        listener({ type, data });
      } catch (err) {
        console.error('Error in space event listener:', err);
      }
    }
  }

  public async registerUser(name: string, email: string, color?: OrbColor): Promise<{ success: boolean; user?: UserIdentity; error?: string }> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, color }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'خطا در ثبت نام' };
      }
      if (data.sessionToken) {
        this.sessionToken = data.sessionToken;
        try {
          localStorage.setItem('skala_session_token', data.sessionToken);
        } catch {}
      }
      return { success: true, user: data.user };
    } catch (err: any) {
      // Offline fallback
      const cleanEmail = email.trim().toLowerCase();
      const isSuperAdmin = cleanEmail === 'soraun.com@gmail.com';
      return {
        success: true,
        user: {
          id: `user-${cleanEmail.replace(/[^a-z0-9]/g, '-')}`,
          name: name.trim(),
          email: cleanEmail,
          isAdmin: true,
          isSuperAdmin,
          color: color || {
            name: isSuperAdmin ? 'Solar Amber' : 'Celestial Cyan',
            primary: isSuperAdmin ? '#f59e0b' : '#0ea5e9',
            glow: isSuperAdmin ? 'rgba(245, 158, 11, 0.65)' : 'rgba(14, 165, 233, 0.65)',
            ambient: isSuperAdmin ? 'rgba(245, 158, 11, 0.18)' : 'rgba(14, 165, 233, 0.18)',
            accent: isSuperAdmin ? '#fbbf24' : '#38bdf8',
          },
          presence: 'present',
          texture: isSuperAdmin ? 'aurora' : 'fluid',
          motionPersonality: 'meditative',
          breathRate: 4.5,
        },
      };
    }
  }

  public async fetchCircles(): Promise<CircleGroup[]> {
    try {
      const res = await fetch('/api/circles');
      if (res.ok) {
        const data = await res.json();
        return data.circles || [];
      }
    } catch (err) {
      console.warn('Failed to fetch circles from server:', err);
    }
    return [];
  }

  public async createCircle(params: {
    name: string;
    description?: string;
    hostName: string;
    hostEmail?: string;
    hostId: string;
  }): Promise<{ success: boolean; circle?: CircleGroup; error?: string }> {
    try {
      const res = await fetch('/api/circles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'خطا در ایجاد حلقه' };
      }
      return { success: true, circle: data.circle };
    } catch (err: any) {
      return { success: false, error: err.message || 'خطای شبکه' };
    }
  }

  public async deleteCircle(spaceId: string, requesterEmail?: string, requesterId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/circles/${encodeURIComponent(spaceId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterEmail, requesterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'خطا در حذف حلقه' };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'خطای شبکه' };
    }
  }

  public async joinSpace(
    spaceId: string,
    user: UserIdentity,
    isAdmin = false,
    spaceName?: string,
    description?: string
  ): Promise<{ success: boolean; space?: any; participants?: Person[] }> {
    this.leaveSpace();

    this.currentSpaceId = spaceId;
    const userId = user.id || (user.name ? `user-${user.name.toLowerCase().replace(/\s+/g, '-')}` : `user-${Math.random().toString(36).slice(2, 8)}`);
    this.currentUserId = userId;

    const participantData = {
      id: userId,
      name: user.name || (isAdmin ? 'مدیر فضا' : 'همراه مهمان'),
      email: user.email,
      color: {
        base: user.color.primary,
        accent: user.color.accent,
        glow: user.color.glow,
        border: user.color.ambient,
      },
      presence: user.presence,
      texture: user.texture,
      breathRate: user.breathRate,
      isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    };

    try {
      const response = await fetch(`/api/spaces/${encodeURIComponent(spaceId)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant: participantData,
          spaceName,
          hostEmail: user.email,
          description,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to join space: ${response.statusText}`);
      }

      const data = await response.json();
      this.connectSSE(spaceId, userId);
      this.startHeartbeat(spaceId, userId, user.presence);

      // Broadcast to local tabs
      this.broadcastChannel?.postMessage({
        type: 'MEMBER_JOINED',
        data: { participant: data.participant },
      });

      return {
        success: true,
        space: data.space,
        participants: (data.space?.participants || []).map((p: any) => this.mapToPerson(p)),
      };
    } catch (err) {
      console.warn('Server join failed, falling back to offline space mode:', err);
      return { success: true, participants: [] };
    }
  }

  private connectSSE(spaceId: string, userId: string) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    try {
      this.eventSource = new EventSource(`/api/spaces/${encodeURIComponent(spaceId)}/events?userId=${encodeURIComponent(userId)}`);

      this.eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed.type === 'PING') return;
          this.notifyListeners(parsed.type, parsed.data);
        } catch (err) {
          console.error('Failed to parse SSE payload:', err);
        }
      };

      this.eventSource.onerror = () => {
        // SSE auto-reconnects
      };
    } catch (err) {
      console.warn('SSE connection unavailable:', err);
    }
  }

  private startHeartbeat(spaceId: string, userId: string, presence: string) {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(async () => {
      try {
        await fetch(`/api/spaces/${encodeURIComponent(spaceId)}/heartbeat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, presence }),
        });
      } catch {
        // Ignore heartbeat network drop
      }
    }, 15000);
  }

  public async sendSignal(signal: SignalData, senderName: string): Promise<boolean> {
    if (!this.currentSpaceId) return false;

    const payload = {
      senderId: this.currentUserId || signal.senderId,
      senderName,
      recipientId: signal.recipientId,
      wave: signal.waveShape,
      intensity: signal.intensity,
      tempo: signal.rhythmSpeed,
      color: signal.color.accent,
      symbolMeaning: signal.sharedMeaning,
    };

    // Broadcast locally to tabs
    this.broadcastChannel?.postMessage({
      type: 'SIGNAL_RECEIVED',
      data: payload,
    });

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      offlineQueue.addPending({
        spaceId: this.currentSpaceId,
        signal: payload,
      });
      return true;
    }

    try {
      const res = await fetch(`/api/spaces/${encodeURIComponent(this.currentSpaceId)}/signal`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ signal: payload }),
      });
      if (!res.ok) {
        offlineQueue.addPending({
          spaceId: this.currentSpaceId,
          signal: payload,
        });
      }
      return res.ok;
    } catch {
      offlineQueue.addPending({
        spaceId: this.currentSpaceId,
        signal: payload,
      });
      return true;
    }
  }

  public leaveSpace() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.currentSpaceId && this.currentUserId) {
      try {
        fetch(`/api/spaces/${encodeURIComponent(this.currentSpaceId)}/leave`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: this.currentUserId }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    }
    this.currentSpaceId = null;
    this.currentUserId = null;
  }

  /**
   * Broadcasts real-time Co-Touch coordinate & state
   */
  public async sendCoTouchState(action: 'start' | 'move' | 'end', touch: CoTouchState, targetSpaceId?: string): Promise<void> {
    const spaceId = targetSpaceId || this.currentSpaceId;
    if (!spaceId) return;
    try {
      await fetch(`/api/spaces/${encodeURIComponent(spaceId)}/co-touch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, touch }),
      });
      // Also broadcast locally across tabs
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'CO_TOUCH_EVENT',
          data: { action, touch },
        });
      }
    } catch {}
  }

  /**
   * Saves and broadcasts a custom sensory tap loop to the active space
   */
  public async saveTapLoop(tapLoop: CustomTapLoop, targetSpaceId?: string): Promise<CustomTapLoop | null> {
    const spaceId = targetSpaceId || this.currentSpaceId;
    if (!spaceId) return null;
    try {
      const res = await fetch(`/api/spaces/${encodeURIComponent(spaceId)}/tap-loops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tapLoop }),
      });
      const data = await res.json();
      if (data.success && data.tapLoop) {
        if (this.broadcastChannel) {
          this.broadcastChannel.postMessage({
            type: 'TAP_LOOP_SAVED',
            data: { tapLoop: data.tapLoop },
          });
        }
        return data.tapLoop;
      }
    } catch (err) {
      console.error('Error saving tap loop:', err);
    }
    return null;
  }

  /**
   * Fetches saved custom tap loops for the space
   */
  public async fetchTapLoops(targetSpaceId?: string): Promise<CustomTapLoop[]> {
    const spaceId = targetSpaceId || this.currentSpaceId;
    if (!spaceId) return [];
    try {
      const res = await fetch(`/api/spaces/${encodeURIComponent(spaceId)}/tap-loops`);
      const data = await res.json();
      if (data.success && Array.isArray(data.loops)) {
        return data.loops;
      }
    } catch {}
    return [];
  }

  public mapToPerson(p: any): Person {
    const defaultColor: OrbColor = {
      name: 'Custom',
      primary: p.color?.base || '#df8a5a',
      accent: p.color?.accent || '#f5cba7',
      glow: p.color?.glow || 'rgba(223, 138, 90, 0.4)',
      ambient: p.color?.border || 'rgba(223, 138, 90, 0.08)',
    };

    return {
      id: p.id,
      name: p.name,
      relationship: p.isAdmin ? 'مدیر و میزبان فضا' : (p.relationship || 'همراه واقعی'),
      color: defaultColor,
      presence: p.presence || 'present',
      texture: p.texture || 'fluid',
      motionPersonality: 'meditative',
      breathRate: p.breathRate || 4.5,
      baseDistance: p.distance || 0.55,
      angle: p.angle || 0,
      x: p.x ?? 0.5,
      y: p.y ?? 0.5,
      bioSnippet: p.bioSnippet || (p.isAdmin ? 'میزبان فضای زنده' : 'حضور زنده با پیوند دعوت'),
      lastInteraction: 'اکنون آنلاین',
    };
  }
}

export const spaceSync = new SpaceSyncService();
