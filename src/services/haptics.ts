/**
 * SKALA Semantic Haptic Service
 * Platform-independent haptic abstraction for Web PWA, Android Capacitor, and ambient interaction.
 */

export type SemanticHapticPattern =
  | 'softPulse'
  | 'doublePulse'
  | 'deepPulse'
  | 'echoPulse'
  | 'waveRise'
  | 'sustainedPresence'
  | 'radiantBurst';

export interface HapticListener {
  (pattern: SemanticHapticPattern, durationMs: number): void;
}

class HapticService {
  private enabled: boolean = true;
  private listeners: Set<HapticListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const savedPref = localStorage.getItem('skala_haptics_enabled');
      if (savedPref !== null) {
        this.enabled = savedPref === 'true';
      }
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('skala_haptics_enabled', String(enabled));
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public onVisualFallback(listener: HapticListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyFallback(pattern: SemanticHapticPattern, durationMs: number): void {
    for (const listener of this.listeners) {
      try {
        listener(pattern, durationMs);
      } catch {
        // Safe swallow
      }
    }
  }

  /**
   * Triggers a semantic haptic pattern.
   * Maps to navigator.vibrate when available; notifies listeners for visual/motion fallbacks.
   */
  public trigger(pattern: SemanticHapticPattern): void {
    if (!this.enabled) return;

    const hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;

    switch (pattern) {
      case 'softPulse':
        if (hasVibration) navigator.vibrate(20);
        this.notifyFallback('softPulse', 150);
        break;

      case 'doublePulse':
        if (hasVibration) navigator.vibrate([25, 40, 25]);
        this.notifyFallback('doublePulse', 250);
        break;

      case 'deepPulse':
        if (hasVibration) navigator.vibrate([60, 50, 40]);
        this.notifyFallback('deepPulse', 300);
        break;

      case 'echoPulse':
        if (hasVibration) navigator.vibrate([35, 60, 20, 80, 15]);
        this.notifyFallback('echoPulse', 400);
        break;

      case 'waveRise':
        if (hasVibration) navigator.vibrate([15, 30, 30, 40, 50]);
        this.notifyFallback('waveRise', 350);
        break;

      case 'sustainedPresence':
        if (hasVibration) navigator.vibrate([40, 30, 40, 30, 40]);
        this.notifyFallback('sustainedPresence', 500);
        break;

      case 'radiantBurst':
        if (hasVibration) navigator.vibrate([30, 20, 45, 20, 60]);
        this.notifyFallback('radiantBurst', 450);
        break;

      default:
        if (hasVibration) navigator.vibrate(20);
        this.notifyFallback('softPulse', 100);
    }
  }

  // Direct helper methods for quick access
  public softPulse() { this.trigger('softPulse'); }
  public doublePulse() { this.trigger('doublePulse'); }
  public deepPulse() { this.trigger('deepPulse'); }
  public echoPulse() { this.trigger('echoPulse'); }
  public waveRise() { this.trigger('waveRise'); }
  public sustainedPresence() { this.trigger('sustainedPresence'); }
  public radiantBurst() { this.trigger('radiantBurst'); }
}

export const hapticService = new HapticService();
