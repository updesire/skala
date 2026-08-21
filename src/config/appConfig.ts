/**
 * Centralized Application Configuration for SKALA
 * Ambient non-verbal communication platform
 */

export interface AppConfig {
  productName: string;
  shortName: string;
  tagline: {
    fa: string;
    en: string;
  };
  defaultLanguage: 'fa' | 'en';
  supportedLanguages: ('fa' | 'en')[];
  version: string;
  storagePrefix: string;
  legacyPrefix: string;
  quietHoursDefault: {
    enabled: boolean;
    start: string; // "23:00"
    end: string;   // "07:30"
  };
  notificationPrivacyDefault: {
    showSender: boolean;
    showSignalType: boolean;
    genericOnly: boolean;
  };
  signalTtlSeconds: number; // Max age of offline signal before expiring (5 mins)
}

export const appConfig: AppConfig = {
  productName: 'SKALA',
  shortName: 'SKALA',
  tagline: {
    fa: 'حضور، بی‌نیاز از کلمات',
    en: 'Presence without words',
  },
  defaultLanguage: 'fa',
  supportedLanguages: ['fa', 'en'],
  version: '2.4.0',
  storagePrefix: 'skala_',
  legacyPrefix: 'aetheria_',
  quietHoursDefault: {
    enabled: false,
    start: '23:30',
    end: '07:30',
  },
  notificationPrivacyDefault: {
    showSender: true,
    showSignalType: true,
    genericOnly: false,
  },
  signalTtlSeconds: 300, // 5 minutes
};

/**
 * Safe migration function: Migrates legacy `aetheria_*` keys in localStorage to `skala_*`
 * without deleting or corrupting existing user state.
 */
export function migrateLegacyStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const legacyKeys = [
      'aetheria_user_id',
      'aetheria_user_registered',
      'aetheria_user_identity',
      'aetheria_space_id',
      'aetheria_space_name',
      'aetheria_real_people_only',
      'aetheria_people_list',
      'aetheria_shared_languages',
      'aetheria_memories_archive',
      'aetheria_saved_circles',
      'aetheria_lang',
      'aetheria_notification_prefs',
      'aetheria_sound_muted',
      'aetheria_tap_loops',
    ];

    for (const oldKey of legacyKeys) {
      const val = localStorage.getItem(oldKey);
      if (val !== null) {
        const newKey = oldKey.replace('aetheria_', 'skala_');
        // Only set new key if it doesn't already exist
        if (localStorage.getItem(newKey) === null) {
          localStorage.setItem(newKey, val);
        }
      }
    }
  } catch (err) {
    console.warn('[SKALA] Storage migration error:', err);
  }
}
