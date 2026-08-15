import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserIdentity, Person } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  Link as LinkIcon,
  Copy,
  Check,
  Share2,
  ShieldCheck,
  Users,
  Sparkles,
  X,
  ExternalLink,
  Trash2,
  UserCheck
} from 'lucide-react';

interface SpaceInviteModalProps {
  user: UserIdentity;
  spaceId: string;
  spaceName: string;
  isRealPeopleOnly: boolean;
  connectedPeople: Person[];
  onToggleRealPeopleOnly: (realOnly: boolean) => void;
  onUpdateSpaceName: (name: string) => void;
  onClose: () => void;
}

export const SpaceInviteModal: React.FC<SpaceInviteModalProps> = ({
  user,
  spaceId,
  spaceName,
  isRealPeopleOnly,
  connectedPeople,
  onToggleRealPeopleOnly,
  onUpdateSpaceName,
  onClose,
}) => {
  const { t, isRtl } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(spaceName);

  // Generate full invite link
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const hostParam = encodeURIComponent(user.name || 'مدیر فضا');
  const inviteUrl = `${origin}${pathname}?space=${encodeURIComponent(spaceId)}&host=${hostParam}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = inviteUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3500);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `حلقه حضور در اِتریا - دعوت از طرف ${user.name || 'مدیر'}`,
          text: `به مدار حضور زنده و سیگنال‌های لمسی من در اِتریا بپیوند:`,
          url: inviteUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleOpenTestTab = () => {
    window.open(inviteUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative w-full max-w-lg rounded-3xl bg-zinc-950/95 border border-amber-400/25 p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col gap-4 sm:gap-5 text-white max-h-[92dvh] overflow-y-auto"
      >
        {/* Glow ambient accent */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ background: user.color.primary }}
        />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold tracking-wide text-zinc-100">
                  {t.inviteModalTitle}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 font-medium">
                  {t.adminMode}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-light mt-0.5">
                {t.adminBadge} ({user.name || 'شما'})
              </p>
            </div>
          </div>
          <button
            id="btn-close-invite-modal"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real People Only Toggle Card */}
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-zinc-200">
                {t.realPeopleOnly}
              </span>
            </div>
            <button
              id="btn-toggle-real-only"
              onClick={() => onToggleRealPeopleOnly(!isRealPeopleOnly)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isRealPeopleOnly
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {isRealPeopleOnly ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>فعال (فقط آدم‌های واقعی)</span>
                </>
              ) : (
                <span>نمایش همراهان نمونه</span>
              )}
            </button>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed font-light">
            {isRealPeopleOnly ? t.realPeopleOnlyDesc : 'همراهان نمونه نمایشی فعال هستند. برای خلوت کردن فضا و حضور فقط افراد واقعی، دکمه بالا را بزنید.'}
          </p>
        </div>

        {/* Space Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {t.spaceNameLabel}
          </label>
          <div className="flex items-center gap-2">
            <input
              id="input-space-name"
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => onUpdateSpaceName(editingName)}
              placeholder={t.spaceNamePlaceholder}
              className="flex-1 bg-zinc-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Invite Link Box */}
        <div className="flex flex-col gap-2">
          <label className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-amber-400" />
            {t.inviteModalDesc}
          </label>
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-zinc-900/90 border border-amber-400/30">
            <input
              id="input-invite-link"
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-transparent text-xs text-amber-200 font-mono focus:outline-none overflow-hidden text-ellipsis select-all"
            />
            <button
              id="btn-copy-invite-link"
              onClick={handleCopy}
              className={`px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-500 text-black font-semibold'
                  : 'bg-amber-400 text-black hover:bg-amber-300 font-semibold'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? t.inviteLinkCopied : t.copyInviteLink}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Share & Open in Test Tab */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="btn-share-invite"
            onClick={handleShare}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-amber-300" />
            <span>ارسال در پیام‌رسان‌ها</span>
          </button>
          <button
            id="btn-test-tab"
            onClick={handleOpenTestTab}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-zinc-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            title="برای تست همگام‌سازی لحظه‌ای دو کاربر"
          >
            <ExternalLink className="w-4 h-4 text-cyan-300" />
            <span>تست در تب جدید</span>
          </button>
        </div>

        {/* Connected Real Users Live List */}
        <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t.connectedRealUsers} ({connectedPeople.length})
            </span>
          </div>

          {connectedPeople.length === 0 ? (
            <div className="py-4 text-center text-xs text-zinc-500 font-light rounded-xl bg-white/[0.02] border border-dashed border-white/10">
              {t.waitingForRealPeople}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {connectedPeople.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full border"
                      style={{
                        background: person.color.primary,
                        borderColor: person.color.accent,
                        boxShadow: `0 0 10px ${person.color.glow}`,
                      }}
                    />
                    <span className="text-xs font-medium text-zinc-200">{person.name}</span>
                    <span className="text-[10px] text-zinc-400">({person.relationship})</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    آنلاین
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
