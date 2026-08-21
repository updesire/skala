// Web Push Notification Client Service for iOS PWA and Modern Browsers

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isIosDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('Failed to register service worker:', err);
    return null;
  }
}

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) return null;
    const data = await res.json();
    return data.publicKey || null;
  } catch (err) {
    console.error('Error fetching VAPID public key:', err);
    return null;
  }
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToPush(
  spaceId: string,
  userId: string
): Promise<{ success: boolean; error?: string; subscription?: PushSubscription }> {
  if (!isPushSupported()) {
    if (isIosDevice() && !isStandalonePwa()) {
      return {
        success: false,
        error: 'ios_needs_pwa', // Need Add to Home Screen first
      };
    }
    return {
      success: false,
      error: 'not_supported',
    };
  }

  try {
    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: permission === 'denied' ? 'permission_denied' : 'permission_dismissed',
      };
    }

    // 2. Ensure service worker is registered and ready
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, error: 'sw_registration_failed' };
    }

    // 3. Fetch VAPID key
    const publicKey = await getVapidPublicKey();
    if (!publicKey) {
      return { success: false, error: 'vapid_key_unavailable' };
    }

    // 4. Subscribe to PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 5. Send subscription to server
    const subJson = subscription.toJSON();
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spaceId,
        userId,
        subscription: {
          endpoint: subJson.endpoint,
          keys: subJson.keys,
        },
      }),
    });

    if (!res.ok) {
      return { success: false, error: 'server_registration_failed' };
    }

    return { success: true, subscription };
  } catch (err: any) {
    console.error('Subscription error:', err);
    return { success: false, error: err.message || 'unknown_error' };
  }
}

export async function unsubscribeFromPush(
  spaceId: string
): Promise<{ success: boolean }> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spaceId,
          subscription: subscription.toJSON(),
        }),
      });
      await subscription.unsubscribe();
    }
    return { success: true };
  } catch (err) {
    console.error('Unsubscribe error:', err);
    return { success: false };
  }
}

export async function showDirectLocalNotification(
  title: string = 'SKALA • اعلان حضور',
  body: string = 'سیگنال حضور و نوتیفیکیشن موبایل شما با موفقیت فعال شد ✨'
): Promise<{ success: boolean; error?: string }> {
  try {
    let reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: 'سرویس‌ورکر فعال نیست' };
    }

    if (Notification.permission !== 'granted') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        return { success: false, error: 'مجوز اعلان رد شده است' };
      }
    }

    await reg.showNotification(title, {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `direct-${Date.now()}`,
      renotify: true,
      data: { url: '/' },
    } as any);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در نمایش اعلان' };
  }
}

export async function sendTestPush(name: string): Promise<{ success: boolean; error?: string }> {
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      return { success: false, error: 'اشتراک فعالی وجود ندارد. لطفاً ابتدا دکمه فعال‌سازی را بزنید.' };
    }

    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        name,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return { success: false, error: err.error || 'خطا در ارسال نوتیفیکیشن آزمایشی سرور' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطای شبکه در ارسال تست' };
  }
}

export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

