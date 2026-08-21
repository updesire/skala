import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserIdentity, CircleGroup, OrbColor } from '../types';
import { ORB_PALETTES } from '../data/initialData';
import { useLanguage } from '../context/LanguageContext';
import { spaceSync } from '../services/spaceSync';
import { ambientAudio } from '../services/audio';
import {
  Users,
  PlusCircle,
  ShieldCheck,
  Crown,
  Share2,
  Trash2,
  Check,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Layers,
  Radio,
  X,
  Mail,
  UserCheck,
  AlertCircle,
  Copy
} from 'lucide-react';

interface CirclesManagerModalProps {
  user: UserIdentity;
  currentSpaceId: string;
  currentSpaceName: string;
  onSwitchSpace: (spaceId: string, spaceName: string, isAdmin: boolean) => void;
  onUpdateUser: (updated: Partial<UserIdentity>) => void;
  onClose: () => void;
}

export const CirclesManagerModal: React.FC<CirclesManagerModalProps> = ({
  user,
  currentSpaceId,
  currentSpaceName,
  onSwitchSpace,
  onUpdateUser,
  onClose,
}) => {
  const { t, isRtl, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'my_circles' | 'create_circle' | 'profile'>('my_circles');
  const [circles, setCircles] = useState<CircleGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Circle Form
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDesc, setNewCircleDesc] = useState('');
  const [newCircleTheme, setNewCircleTheme] = useState<OrbColor>(ORB_PALETTES.cyan);

  // Profile Email & Name Form
  const [profileName, setProfileName] = useState(user.name || '');
  const [profileEmail, setProfileEmail] = useState(user.email || '');

  // Copy feedback state
  const [copiedCircleId, setCopiedCircleId] = useState<string | null>(null);

  const loadCircles = async () => {
    setIsLoading(true);
    const list = await spaceSync.fetchCircles();
    // Also load locally remembered circles from localStorage
    try {
      const localCirclesRaw = localStorage.getItem('skala_saved_circles') || localStorage.getItem('aetheria_saved_circles');
      const localCircles: CircleGroup[] = localCirclesRaw ? JSON.parse(localCirclesRaw) : [];
      const combined = [...list];
      for (const lc of localCircles) {
        if (!combined.some((c) => c.id === lc.id)) {
          combined.push(lc);
        }
      }
      setCircles(combined);
    } catch {
      setCircles(list);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCircles();
  }, []);

  const isSuperAdmin = user.email?.trim().toLowerCase() === 'soraun.com@gmail.com' || user.isSuperAdmin;

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;

    setIsSubmitting(true);
    setActionMessage(null);

    const res = await spaceSync.createCircle({
      name: newCircleName.trim(),
      description: newCircleDesc.trim() || undefined,
      hostName: user.name || 'مدیر حلقه',
      hostEmail: user.email || (isSuperAdmin ? 'soraun.com@gmail.com' : undefined),
      hostId: user.id || `host-${Date.now()}`,
    });

    setIsSubmitting(false);

    if (res.success && res.circle) {
      ambientAudio.playSignalResonance(0.8);
      // Save locally
      try {
        const localCirclesRaw = localStorage.getItem('skala_saved_circles') || localStorage.getItem('aetheria_saved_circles');
        const localCircles: CircleGroup[] = localCirclesRaw ? JSON.parse(localCirclesRaw) : [];
        localCircles.unshift(res.circle);
        localStorage.setItem('skala_saved_circles', JSON.stringify(localCircles));
      } catch {}

      setActionMessage({
        text: isRtl ? `حلقه «${res.circle.name}» با موفقیت ایجاد شد ✨` : `Circle "${res.circle.name}" created successfully!`,
        type: 'success',
      });

      setNewCircleName('');
      setNewCircleDesc('');
      await loadCircles();

      // Automatically switch to the newly created circle
      setTimeout(() => {
        onSwitchSpace(res.circle!.id, res.circle!.name, true);
        onClose();
      }, 1000);
    } else {
      setActionMessage({
        text: res.error || (isRtl ? 'خطا در ایجاد حلقه' : 'Failed to create circle'),
        type: 'error',
      });
    }
  };

  const handleDeleteCircle = async (circle: CircleGroup) => {
    if (!window.confirm(isRtl ? `آیا از حذف حلقه «${circle.name}» مطمئن هستید؟` : `Are you sure you want to delete "${circle.name}"?`)) {
      return;
    }

    const res = await spaceSync.deleteCircle(circle.id, user.email, user.id);
    if (res.success) {
      ambientAudio.playRippleTone(300);
      try {
        const localCirclesRaw = localStorage.getItem('skala_saved_circles') || localStorage.getItem('aetheria_saved_circles');
        const localCircles: CircleGroup[] = localCirclesRaw ? JSON.parse(localCirclesRaw) : [];
        const filtered = localCircles.filter((c) => c.id !== circle.id);
        localStorage.setItem('skala_saved_circles', JSON.stringify(filtered));
      } catch {}

      setActionMessage({
        text: isRtl ? 'حلقه با موفقیت حذف شد' : 'Circle deleted successfully',
        type: 'success',
      });
      await loadCircles();

      if (currentSpaceId === circle.id) {
        // Fall back to master circle
        onSwitchSpace('main-cosmic-circle', 'حلقه اصلی اسکالا • SKALA Sanctuary', isSuperAdmin);
      }
    } else {
      setActionMessage({
        text: res.error || (isRtl ? 'خطا در حذف حلقه' : 'Failed to delete circle'),
        type: 'error',
      });
    }
  };

  const handleCopyInviteLink = (circle: CircleGroup) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const hostParam = encodeURIComponent(circle.hostName || user.name || 'مدیر');
    const inviteUrl = `${origin}${pathname}?space=${encodeURIComponent(circle.id)}&host=${hostParam}`;

    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(inviteUrl);
      }
    } catch {}

    setCopiedCircleId(circle.id);
    ambientAudio.playRippleTone(660);
    setTimeout(() => setCopiedCircleId(null), 3000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim() || !profileEmail.trim()) return;

    setIsSubmitting(true);
    const res = await spaceSync.registerUser(profileName.trim(), profileEmail.trim(), user.color);
    setIsSubmitting(false);

    if (res.success && res.user) {
      ambientAudio.playSignalResonance(0.85);
      onUpdateUser({
        name: res.user.name,
        email: res.user.email,
        isAdmin: true,
        isSuperAdmin: res.user.isSuperAdmin,
      });

      setActionMessage({
        text: isRtl ? 'مشخصات و ایمیل شما با موفقیت بروزرسانی شد' : 'Profile updated successfully!',
        type: 'success',
      });
      setTimeout(() => setActionMessage(null), 3000);
    } else {
      setActionMessage({
        text: res.error || (isRtl ? 'خطا در ثبت ایمیل' : 'Registration error'),
        type: 'error',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl animate-fade-in select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative w-full max-w-xl rounded-3xl bg-zinc-950/95 border border-white/15 p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col gap-4 text-white max-h-[92dvh] overflow-y-auto"
      >
        {/* Ambient background glow */}
        <div
          className="absolute -top-28 -right-28 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: isSuperAdmin ? '#f59e0b' : '#0ea5e9' }}
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isSuperAdmin ? 'bg-amber-400/20 border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-cyan-400/15 border-cyan-400/30 text-cyan-300'
            }`}>
              {isSuperAdmin ? <Crown className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base sm:text-lg font-semibold tracking-wide text-zinc-100">
                  {isRtl ? 'مدیریت و ساخت حلقه‌ها (گروه‌ها)' : 'Circles & Groups Hub'}
                </h3>
                {isSuperAdmin && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-300" />
                    {isRtl ? 'مدیر کل' : 'Super Admin'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                {isRtl ? 'هر کاربر می‌تواند حلقه اختصاصی خود را بسازد و افرادش را دعوت کند.' : 'Create your own circles and invite companions.'}
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

        {/* Tabs Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/40 border border-white/10 text-xs">
          <button
            onClick={() => { setActiveTab('my_circles'); setActionMessage(null); }}
            className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'my_circles'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{isRtl ? 'حلقه‌های من' : 'Circles'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-zinc-300">
              {circles.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab('create_circle'); setActionMessage(null); }}
            className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'create_circle'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isRtl ? 'ساخت حلقه جدید' : 'Create Circle'}</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setActionMessage(null); }}
            className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isRtl ? 'حساب کاربری' : 'Account'}</span>
          </button>
        </div>

        {/* Action Message Alert */}
        {actionMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}
          >
            {actionMessage.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* TAB 1: Circles List */}
        {activeTab === 'my_circles' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>{isRtl ? 'حلقه‌های فعال و قابل دسترسی:' : 'Available Circles:'}</span>
              <button
                onClick={loadCircles}
                className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
              >
                {isRtl ? 'بروزرسانی لیست' : 'Refresh'}
              </button>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Radio className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs">{isRtl ? 'در حال بارگذاری حلقه‌ها...' : 'Loading circles...'}</span>
              </div>
            ) : circles.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-white/[0.02] border border-white/5 gap-2">
                <Users className="w-8 h-8 text-zinc-600" />
                <p className="text-xs text-zinc-400">
                  {isRtl ? 'هنوز حلقه‌ای ثبت نشده است. همین حالا اولین حلقه اختصاصی خود را بسازید!' : 'No circles found. Create your first circle!'}
                </p>
                <button
                  onClick={() => setActiveTab('create_circle')}
                  className="mt-2 px-4 py-2 rounded-xl bg-cyan-400 text-black text-xs font-semibold flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  {isRtl ? 'ساخت اولین حلقه' : 'Create Circle'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[50dvh] overflow-y-auto pr-1">
                {circles.map((circle) => {
                  const isCurrent = circle.id === currentSpaceId;
                  const isHost = circle.hostId === user.id || (circle.hostEmail && circle.hostEmail.toLowerCase() === (user.email || '').toLowerCase());
                  const canDelete = isHost || isSuperAdmin;
                  const isMasterCircle = circle.id === 'main-cosmic-circle';

                  return (
                    <div
                      key={circle.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col gap-2.5 ${
                        isCurrent
                          ? 'bg-white/10 border-cyan-400/40 ring-1 ring-cyan-400/25 shadow-lg'
                          : 'bg-zinc-900/60 hover:bg-zinc-900/90 border-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-zinc-100">
                              {circle.name}
                            </span>
                            {isMasterCircle && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                {isRtl ? 'حلقه مرکزی آتریا' : 'Master Sanctuary'}
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {isRtl ? 'حلقه فعلی شما' : 'Active'}
                              </span>
                            )}
                            {isHost && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-cyan-400/15 text-cyan-300 border border-cyan-400/30">
                                {isRtl ? 'مدیر: شما' : 'You are Host'}
                              </span>
                            )}
                          </div>
                          {circle.description && (
                            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                              {circle.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-zinc-500 mt-1">
                            <span>
                              {isRtl ? `میزبان: ${circle.hostName || 'ناشناس'}` : `Host: ${circle.hostName || 'Anonymous'}`}
                            </span>
                            <span>•</span>
                            <span>
                              {isRtl ? `${circle.memberCount || 0} نفر حاضر` : `${circle.memberCount || 0} active members`}
                            </span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Copy invite link button */}
                          <button
                            onClick={() => handleCopyInviteLink(circle)}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-300 border border-white/10 text-xs transition-all flex items-center gap-1 cursor-pointer"
                            title={isRtl ? 'کپی لینک دعوت این حلقه' : 'Copy Invite Link'}
                          >
                            {copiedCircleId === circle.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px] text-emerald-400">{isRtl ? 'کپی شد' : 'Copied'}</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3.5 h-3.5 text-zinc-300" />
                                <span className="text-[10px] hidden sm:inline">{isRtl ? 'دعوت' : 'Invite'}</span>
                              </>
                            )}
                          </button>

                          {/* Switch Button */}
                          {!isCurrent ? (
                            <button
                              onClick={() => {
                                onSwitchSpace(circle.id, circle.name, isHost || isSuperAdmin);
                                onClose();
                              }}
                              className="px-3 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-semibold transition-all cursor-pointer shadow-md flex items-center gap-1"
                            >
                              <span>{isRtl ? 'ورود' : 'Join'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="px-3 py-2 text-xs text-emerald-400 font-medium flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              {isRtl ? 'متصل' : 'Connected'}
                            </span>
                          )}

                          {/* Delete Button (Host or SuperAdmin) */}
                          {canDelete && !isMasterCircle && (
                            <button
                              onClick={() => handleDeleteCircle(circle)}
                              className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/20 text-xs transition-colors cursor-pointer"
                              title={isRtl ? 'حذف این حلقه' : 'Delete Circle'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Create New Circle */}
        {activeTab === 'create_circle' && (
          <form onSubmit={handleCreateCircle} className="flex flex-col gap-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/25 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" />
              <p className="text-xs text-cyan-200 leading-relaxed">
                {isRtl
                  ? 'شما مدیر کامل حلقه خود خواهید بود و می‌توانید پیوند دعوت آن را برای دوستان، خانواده یا همکارانتان بفرستید.'
                  : 'You will be the admin of your new circle with full invite controls.'}
              </p>
            </div>

            {/* Circle Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-300 font-medium flex items-center justify-between">
                <span>{isRtl ? 'نام حلقه یا گروه' : 'Circle Name'} <span className="text-rose-400">*</span></span>
                <span className="text-[10px] text-zinc-500">
                  {isRtl ? 'مثلاً: دوستان دوران دانشگاه، خانواده من' : 'e.g. Family, Close Friends'}
                </span>
              </label>
              <input
                id="input-circle-name"
                type="text"
                required
                autoFocus
                value={newCircleName}
                onChange={(e) => setNewCircleName(e.target.value)}
                placeholder={isRtl ? 'نام حلقه را وارد کنید...' : 'Enter circle name...'}
                className="bg-zinc-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-300 font-medium">
                {isRtl ? 'توضیحات یا قصد حلقه (اختیاری)' : 'Description (Optional)'}
              </label>
              <textarea
                id="input-circle-desc"
                rows={2}
                value={newCircleDesc}
                onChange={(e) => setNewCircleDesc(e.target.value)}
                placeholder={isRtl ? 'فضایی برای اتصال صمیمانه و ارتعاش حضور...' : 'A private space for gentle resonance and presence...'}
                className="bg-zinc-900/90 border border-white/15 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
              />
            </div>

            {/* Creator Info summary */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-zinc-400">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                {isRtl ? `ثبت به عنوان سازنده: ${user.name}` : `Creator: ${user.name}`}
              </span>
              <span className="text-[10px] text-zinc-500">{user.email || 'بدون ایمیل'}</span>
            </div>

            {/* Submit Button */}
            <button
              id="btn-create-new-circle-submit"
              type="submit"
              disabled={isSubmitting || !newCircleName.trim()}
              className="w-full py-3.5 rounded-2xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-400/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <Radio className="w-4 h-4 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              <span>{isRtl ? 'ایجاد و ورود به حلقه جدید ✨' : 'Create & Enter Circle'}</span>
            </button>
          </form>
        )}

        {/* TAB 3: Profile & Email Account */}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/25 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-300 font-medium text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>{isRtl ? 'وضعیت دسترسی و حساب کاربری' : 'Account & Access Level'}</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {isRtl
                  ? 'ثبت نام و ذخیره هویت از طریق ایمیل انجام می‌شود. ایمیل soraun.com@gmail.com به عنوان مدیر ارشد سیستم با دسترسی کامل شناسایی می‌شود.'
                  : 'Identity is registered via Email. soraun.com@gmail.com is recognized as Global Super Admin.'}
              </p>
            </div>

            {/* Super Admin Status Banner */}
            {isSuperAdmin ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-amber-300">
                    {isRtl ? 'مدیر ارشد سامانه (Super Admin)' : 'Global Super Admin'}
                  </span>
                  <span className="text-[10px] text-zinc-300">
                    soraun.com@gmail.com • {isRtl ? 'دسترسی نامحدود به ساخت و مدیریت تمامی حلقه‌ها' : 'Full system privileges'}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-cyan-300" />
                {isRtl ? 'نام نمایشی شما' : 'Your Display Name'} <span className="text-rose-400">*</span>
              </label>
              <input
                id="input-profile-name"
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder={isRtl ? 'نام خود را وارد کنید...' : 'Your name...'}
                className="bg-zinc-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-zinc-300 font-medium flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-300" />
                  {isRtl ? 'آدرس ایمیل' : 'Email Address'} <span className="text-rose-400">*</span>
                </span>
                <span className="text-[10px] text-zinc-500">
                  {isRtl ? 'برای مدیریت و بازیابی حلقه‌ها' : 'For circle management'}
                </span>
              </label>
              <input
                id="input-profile-email"
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-zinc-900/90 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
              />
            </div>

            {/* Save Profile Button */}
            <button
              id="btn-save-profile-email"
              type="submit"
              disabled={isSubmitting || !profileName.trim() || !profileEmail.trim()}
              className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-400/25 flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
            >
              {isSubmitting ? (
                <Radio className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>{isRtl ? 'ذخیره و ثبت هویت ایمیل' : 'Save Identity & Email'}</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
