/**
 * SKALA Offline Signal Queue Service
 * Handles graceful queueing, TTL validation, and transmission of non-verbal signals during network loss.
 */

import { SignalData, CustomTapLoop } from '../types';
import { appConfig } from '../config/appConfig';

export interface PendingSignalItem {
  id: string;
  signal: {
    recipientId?: string;
    wave: string;
    intensity: number;
    tempo: number;
    color: string;
    privateIntention?: string;
    symbolMeaning?: string;
    customTapLoop?: CustomTapLoop;
  };
  createdAt: number;
  spaceId: string;
}

class OfflineQueueService {
  private queue: PendingSignalItem[] = [];
  private listeners: Set<(queueLength: number) => void> = new Set();
  private storageKey = 'skala_pending_signals';

  constructor() {
    this.loadFromStorage();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.processQueue();
      });
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.queue = JSON.parse(raw);
        this.cleanExpired();
      }
    } catch {
      this.queue = [];
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
      this.notifyListeners();
    } catch {
      // Safe ignore
    }
  }

  private notifyListeners() {
    const len = this.queue.length;
    for (const l of this.listeners) {
      try {
        l(len);
      } catch {
        // Safe swallow
      }
    }
  }

  public subscribe(listener: (queueLength: number) => void): () => void {
    this.listeners.add(listener);
    listener(this.queue.length);
    return () => this.listeners.delete(listener);
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public addPending(item: Omit<PendingSignalItem, 'id' | 'createdAt'>): PendingSignalItem {
    const pendingItem: PendingSignalItem = {
      ...item,
      id: `pending-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    this.queue.push(pendingItem);
    this.saveToStorage();
    return pendingItem;
  }

  private cleanExpired(): void {
    const now = Date.now();
    const maxAgeMs = appConfig.signalTtlSeconds * 1000;
    this.queue = this.queue.filter((item) => now - item.createdAt <= maxAgeMs);
    this.saveToStorage();
  }

  public async processQueue(
    sendCallback?: (item: PendingSignalItem) => Promise<boolean>
  ): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    this.cleanExpired();

    if (this.queue.length === 0) return;

    const itemsToProcess = [...this.queue];
    const remaining: PendingSignalItem[] = [];

    for (const item of itemsToProcess) {
      const now = Date.now();
      // Drop if older than TTL
      if (now - item.createdAt > appConfig.signalTtlSeconds * 1000) {
        continue;
      }

      if (sendCallback) {
        try {
          const success = await sendCallback(item);
          if (!success) {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      } else {
        // Default API post
        try {
          const res = await fetch(`/api/spaces/${encodeURIComponent(item.spaceId)}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ signal: item.signal }),
          });
          if (!res.ok) {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }
    }

    this.queue = remaining;
    this.saveToStorage();
  }
}

export const offlineQueue = new OfflineQueueService();
