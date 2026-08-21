import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Share2,
  PlusSquare,
  Sparkles,
  Send,
  X,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  isIosDevice,
  isStandalonePwa,
  isPushSupported,
  getNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  showDirectLocalNotification,
  getExistingSubscription,
} from '../services/pushNotification';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  spaceId: string;
  userId: string;
  userName: string;
  isRtl?: boolean;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  spaceId,
  userId,
  userName,
  isRtl = true,
}) => {
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const checkStatus = async () => {
    setIsIos(isIosDevice());
    setIsStandalone(isStandalonePwa());
    setPermission(getNotificationPermission());
    const sub = await getExistingSubscription();
    setHasSubscription(!!sub);
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
      setStatusMessage(null);
    }
  }, [isOpen, spaceId, userId]);

  const handleEnablePush = async () => {
    setIsLoading(true);
    setStatusMessage(null);

    const result = await subscribeToPush(spaceId, userId);
    setIsLoading(false);

    if (result.success) {
      setHasSubscription(true);
      setPermission('granted');
      setStatusMessage({
        text: isRtl
          ? 'اعلان‌های پس‌زمینه با موفقیت فعال شدند! حالا حتی اگر از اپ خارج شوید، سیگنال‌های دوستان را دریافت خواهید کرد.'
          : 'Background notifications successfully activated! You will receive signals even when the app is closed.',
        type: 'success',
      });
    } else {
      if (result.error === 'ios_needs_pwa') {
        setStatusMessage({
          text: isRtl
            ? 'در آیفون، حتماً باید ابتدا با زدن دکمه Share در سافاری گزینه Add to Home Screen را انتخاب کرده و از آیکون روی صفحه اصلی وارد شوید.'
            : 'On iPhone, you must first tap Share in Safari, select "Add to Home Screen", and open from your home screen.',
          type: 'error',
        });
      } else if (result.error === 'permission_denied') {
        setStatusMessage({
          text: isRtl
            ? 'مجوز اعلان رد شده است. لطفاً در تنظیمات آیفون (Settings > Notifications > SKALA) اجازه دریافت اعلان را فعال کنید.'
            : 'Permission was denied. Please allow notifications in iPhone Settings > Notifications > SKALA.',
          type: 'error',
        });
      } else {
        setStatusMessage({
          text: isRtl
            ? `خطا در فعال‌سازی: ${result.error || 'لطفاً دوباره تلاش کنید'}`
            : `Activation error: ${result.error || 'Please try again'}`,
          type: 'error',
        });
      }
    }
  };

  const handleDisablePush = async () => {
    setIsLoading(true);
    await unsubscribeFromPush(spaceId);
    setHasSubscription(false);
    setIsLoading(false);
    setStatusMessage({
      text: isRtl ? 'اعلان‌های پس‌زمینه غیرفعال شدند.' : 'Background notifications disabled.',
      type: 'info',
    });
  };

  const handleDirectLocalTest = async () => {
    setIsLoading(true);
    const res = await showDirectLocalNotification(
      isRtl ? `SKALA • سیگنال از ${userName || 'دوست شما'}` : `SKALA • Signal from ${userName || 'Friend'}`,
      isRtl ? 'یک پیام ارتعاشی و حضور ملایم ارسال شد ✨' : 'A gentle presence resonance was sent ✨'
    );
    setIsLoading(false);
    if (res.success) {
      setStatusMessage({
        text: isRtl
          ? 'اعلان آنی با موفقیت ارسال شد! اگر روی صفحه قفل یا بالای نمایشگر دیدید، اتصال دیوایس شما ۱۰۰٪ برقرار است.'
          : 'Instant test notification sent successfully!',
        type: 'success',
      });
      setPermission('granted');
    } else {
      setStatusMessage({
        text: isRtl ? `خطا: ${res.error}` : `Error: ${res.error}`,
        type: 'error',
      });
    }
  };

  const handleSendTestNotification = async () => {
    setIsLoading(true);
    const res = await sendTestPush(userName);
    setIsLoading(false);

    if (res.success) {
      setStatusMessage({
        text: isRtl
          ? 'پیام آزمایشی ارسال شد! همین الان فوراً از اپلیکیشن خارج شوید یا گوشی را قفل کنید تا نوتیفیکیشن را روی صفحه آیفون ببینید ✨'
          : 'Test notification sent! Minimize the app or lock your iPhone right now to see the notification on your lock screen ✨',
        type: 'success',
      });
    } else {
      setStatusMessage({
        text: isRtl
          ? `خطا در ارسال تست: ${res.error || 'اشتراک فعالی یافت نشد'}`
          : `Test failed: ${res.error || 'No active subscription found'}`,
        type: 'error',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-fade-in select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative w-full max-w-lg rounded-3xl bg-zinc-950/95 border border-sky-400/25 p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col gap-4 sm:gap-5 text-white max-h-[92dvh] overflow-y-auto"
      >
        {/* Glow Accent */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none blur-3xl opacity-30"
          style={{ backgroundColor: '#38bdf8' }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-300 shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.25)]">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-medium text-zinc-100">
                {isRtl ? 'نوتیفیکیشن موبایل و پس‌زمینه' : 'Mobile Background Notifications'}
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
                {isRtl
                  ? 'دریافت سیگنال‌های لمسی و حضور حتی هنگام بسته بودن برنامه'
                  : 'Receive tactile presence signals even when app is closed'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                : 'bg-sky-950/50 border-sky-500/40 text-sky-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* iPhone (iOS) Specific Status & Instructions */}
        {isIos && !isStandalone && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-300 font-medium text-xs">
              <Smartphone className="w-4 h-4" />
              <span>{isRtl ? 'نکته بسیار مهم برای آیفون (iOS):' : 'Important note for iPhone (iOS):'}</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              {isRtl
                ? 'سیستم‌عامل اپل (iOS) دریافت نوتیفیکیشن در حالت قفل یا پس‌زمینه را فقط زمانی فعال می‌کند که وب‌اپ را روی صفحه اصلی نصب کرده باشید:'
                : 'Apple iOS requires the web app to be added to your Home Screen to receive notifications when closed:'}
            </p>
            <div className="flex flex-col gap-2.5 bg-black/40 p-3 rounded-xl border border-white/5 text-xs text-zinc-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                <span>{isRtl ? 'در مرورگر Safari دکمه' : 'In Safari, tap'}</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono flex items-center gap-1 text-[11px]">
                  <Share2 className="w-3 h-3" /> Share
                </span>
                <span>{isRtl ? 'در نوار پایین را بزنید' : 'button'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                <span>{isRtl ? 'گزینه' : 'Select'}</span>
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-mono flex items-center gap-1 text-[11px]">
                  <PlusSquare className="w-3 h-3" /> Add to Home Screen
                </span>
                <span>{isRtl ? 'را انتخاب کنید' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                <span>{isRtl ? 'سپس از آیکون ساخته شده روی صفحه گوشی وارد شوید و دکمه فعال‌سازی را بزنید.' : 'Open from the new Home Screen icon and activate notifications.'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Requirements Checklist Card */}
        <div className="flex flex-col gap-2 p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
          <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">
            {isRtl ? 'وضعیت اتصال و دسترسی‌ها' : 'Connection & Permission Status'}
          </span>

          {/* Item 1: PWA Installation */}
          <div className="flex items-center justify-between py-1.5 border-b border-white/5">
            <span className="text-zinc-300">{isRtl ? 'حالت وب‌اپلیکیشن مستقل (PWA)' : 'Standalone PWA Mode'}</span>
            <span className={`flex items-center gap-1 text-[11px] font-medium ${isStandalone ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {isStandalone ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isRtl ? 'نصب شده روی صفحه اصلی' : 'Installed'}
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  {isRtl ? 'درون مرورگر' : 'In Browser'}
                </>
              )}
            </span>
          </div>

          {/* Item 2: Notification Permission */}
          <div className="flex items-center justify-between py-1.5 border-b border-white/5">
            <span className="text-zinc-300">{isRtl ? 'مجوز نوتیفیکیشن سیستم‌عامل' : 'OS Notification Permission'}</span>
            <span
              className={`flex items-center gap-1 text-[11px] font-medium ${
                permission === 'granted'
                  ? 'text-emerald-400'
                  : permission === 'denied'
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {permission === 'granted'
                ? isRtl ? 'مجاز شده (Granted)' : 'Granted'
                : permission === 'denied'
                ? isRtl ? 'رد شده در تنظیمات گوشی' : 'Denied'
                : isRtl ? 'در انتظار تأیید' : 'Pending'}
            </span>
          </div>

          {/* Item 3: Web Push Subscription */}
          <div className="flex items-center justify-between py-1.5">
            <span className="text-zinc-300">{isRtl ? 'اتصال به سرور اعلان (Push Service)' : 'Push Service Subscription'}</span>
            <span className={`flex items-center gap-1 text-[11px] font-medium ${hasSubscription ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {hasSubscription ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isRtl ? 'فعال و ثبت‌شده' : 'Active'}
                </>
              ) : (
                isRtl ? 'غیرفعال' : 'Inactive'
              )}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          {!hasSubscription ? (
            <button
              id="btn-enable-push-notifications"
              onClick={handleEnablePush}
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <BellRing className="w-4 h-4" />
              <span>
                {isLoading
                  ? isRtl ? 'در حال ثبت اشتراک...' : 'Activating...'
                  : isRtl ? 'فعال‌سازی نوتیفیکیشن در پس‌زمینه' : 'Enable Background Notifications'}
              </span>
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Test Notification Button (Server Remote Push) */}
              <button
                id="btn-test-push-notification"
                onClick={handleSendTestNotification}
                disabled={isLoading}
                className="w-full py-3 rounded-2xl bg-sky-400/20 hover:bg-sky-400/30 text-sky-200 border border-sky-400/40 text-xs font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Send className="w-4 h-4 text-sky-300" />
                <span>
                  {isLoading
                    ? isRtl ? 'در حال ارسال پیام تست...' : 'Sending test...'
                    : isRtl ? '🚀 ارسال نوتیفیکیشن آزمایشی سرور' : '🚀 Send Server Test Notification'}
                </span>
              </button>

              {/* Direct Local Test Button */}
              <button
                id="btn-test-direct-notification"
                onClick={handleDirectLocalTest}
                disabled={isLoading}
                className="w-full py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 border border-emerald-500/30 text-xs font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>
                  {isRtl ? '⚡ تست فوری اعلان محلی در دستگاه' : '⚡ Instant Local Notification Test'}
                </span>
              </button>

              {/* Disable Button */}
              <button
                id="btn-disable-push-notifications"
                onClick={handleDisablePush}
                disabled={isLoading}
                className="w-full py-2 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 text-[11px] transition-colors cursor-pointer"
              >
                {isRtl ? 'غیرفعال‌سازی موقت اعلان‌ها' : 'Disable notifications'}
              </button>
            </div>
          )}

          {/* Quick info footer note */}
          <p className="text-[10px] text-zinc-400 text-center leading-relaxed mt-1">
            {isRtl
              ? 'با فعال‌سازی نوتیفیکیشن، هر زمان دوستانتان سیگنال لمسی یا ارتعاش بفرستند، پیام آن روی صفحه گوشی شما ظاهر می‌شود.'
              : 'With notifications enabled, you receive instant tactile vibrations and signals when someone in your circle reaches out.'}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

