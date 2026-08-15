import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Person, UserIdentity, PresenceState, OrbTexture, OrbColor } from '../types';
import { ORB_PALETTES } from '../data/initialData';
import { LivingOrb } from './LivingOrb';
import { ambientAudio } from '../services/audio';
import { useLanguage } from '../context/LanguageContext';
import { User, UserPlus, Users, Sparkles, Copy, Check, Trash2, Send, Share2, X, Mail, Crown } from 'lucide-react';

interface RegistrationModalProps {
  user: UserIdentity;
  people: Person[];
  onUpdateUser: (updated: Partial<UserIdentity>) => void;
  onAddPerson: (newPerson: Person) => void;
  onRemovePerson: (personId: string) => void;
  onSelectPersonToSend: (person: Person) => void;
  onClose: () => void;
}

type TabType = 'my_profile' | 'new_companion' | 'circle';

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  user,
  people,
  onUpdateUser,
  onAddPerson,
  onRemovePerson,
  onSelectPersonToSend,
  onClose,
}) => {
  const { t, isRtl, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('new_companion');

  // Form state for My Profile
  const [userName, setUserName] = useState(user.name === 'You' || user.name === 'شما' ? '' : user.name);
  const [userColor, setUserColor] = useState<OrbColor>(user.color);
  const [userPresence, setUserPresence] = useState<PresenceState>(user.presence);
  const [userTexture, setUserTexture] = useState<OrbTexture>(user.texture);
  const [userBreathRate, setUserBreathRate] = useState<number>(user.breathRate);
  const [savedSuccessMyProfile, setSavedSuccessMyProfile] = useState(false);

  // Form state for New Companion
  const [companionName, setCompanionName] = useState('');
  const [companionRelationship, setCompanionRelationship] = useState('');
  const [companionBio, setCompanionBio] = useState('');
  const [companionColor, setCompanionColor] = useState<OrbColor>(ORB_PALETTES.cyan);
  const [companionPresence, setCompanionPresence] = useState<PresenceState>('present');
  const [companionTexture, setCompanionTexture] = useState<OrbTexture>('fluid');
  const [companionSavedSuccess, setCompanionSavedSuccess] = useState(false);

  // Copy link state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const presenceKeys: PresenceState[] = ['present', 'deep_focus', 'reaching', 'resting', 'quiet'];
  const textureKeys: OrbTexture[] = ['fluid', 'aurora', 'stardust', 'crystalline', 'deep_core'];

  const handleSaveMyProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = userName.trim() ? userName.trim() : (language === 'fa' ? 'شما' : 'You');
    onUpdateUser({
      name: finalName,
      color: userColor,
      presence: userPresence,
      texture: userTexture,
      breathRate: userBreathRate,
    });
    ambientAudio.playSignalResonance(0.7);
    setSavedSuccessMyProfile(true);
    setTimeout(() => {
      setSavedSuccessMyProfile(false);
    }, 2000);
  };

  const handleRegisterNewCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companionName.trim()) return;

    // Calculate dynamic circular layout coordinate around center (0.5, 0.5)
    const existingCount = people.length;
    const angle = (existingCount / (existingCount + 1)) * Math.PI * 2 - Math.PI / 2 + Math.random() * 0.4;
    const distance = 0.36 + (existingCount % 3) * 0.08;
    const x = Math.max(0.18, Math.min(0.82, 0.5 + Math.cos(angle) * distance));
    const y = Math.max(0.18, Math.min(0.82, 0.5 + Math.sin(angle) * distance));

    const newPerson: Person = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: companionName.trim(),
      relationship: companionRelationship.trim() || (language === 'fa' ? 'همراه صمیمی' : 'Companion'),
      bioSnippet: companionBio.trim() || (language === 'fa' ? 'حاضر در فضای سیگنال' : 'Present in spatial circle'),
      color: companionColor,
      presence: companionPresence,
      texture: companionTexture,
      motionPersonality: 'meditative',
      breathRate: 4.2 + Math.random() * 1.5,
      baseDistance: distance,
      angle: angle,
      x: x,
      y: y,
      lastInteraction: language === 'fa' ? 'به تازگی ملحق شد' : 'Just joined',
    };

    onAddPerson(newPerson);
    ambientAudio.playSignalResonance(0.8);
    setCompanionSavedSuccess(true);

    // Reset companion form
    setCompanionName('');
    setCompanionRelationship('');
    setCompanionBio('');

    setTimeout(() => {
      setCompanionSavedSuccess(false);
      setActiveTab('circle');
    }, 1200);
  };

  const handleCopyLink = (code: string) => {
    const inviteUrl = `${window.location.origin}/#connect=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(code);
    ambientAudio.playRippleTone(520);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-xl ${
        isRtl ? 'rtl' : 'ltr'
      }`}
    >
      <div className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-3xl flex flex-col shadow-2xl overflow-hidden max-h-[94dvh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-200 shrink-0">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-light text-zinc-100">{t.registrationTitle}</h2>
              <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">{t.registerDesc}</p>
            </div>
          </div>
          <button
            id="btn-close-registration"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
            aria-label="Close registration"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-3 sm:px-6 pt-2 sm:pt-3 gap-1 sm:gap-2 bg-zinc-900/40 overflow-x-auto no-scrollbar">
          <button
            id="tab-new-companion"
            onClick={() => setActiveTab('new_companion')}
            className={`pb-2.5 sm:pb-3 px-2 sm:px-3 text-[11px] sm:text-xs tracking-wider flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'new_companion'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t.newCompanionTab}</span>
          </button>

          <button
            id="tab-circle-members"
            onClick={() => setActiveTab('circle')}
            className={`pb-2.5 sm:pb-3 px-2 sm:px-3 text-[11px] sm:text-xs tracking-wider flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'circle'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.circleMembersTab} ({people.length})</span>
          </button>

          <button
            id="tab-my-profile"
            onClick={() => setActiveTab('my_profile')}
            className={`pb-2.5 sm:pb-3 px-2 sm:px-3 text-[11px] sm:text-xs tracking-wider flex items-center gap-1.5 sm:gap-2 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'my_profile'
                ? 'border-amber-400 text-amber-300 font-medium'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{t.myProfileTab}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 sm:gap-6">
          {/* TAB 1: Register New Companion */}
          {activeTab === 'new_companion' && (
            <form onSubmit={handleRegisterNewCompanion} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Companion Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-300 font-light flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{t.companionNameLabel} *</span>
                  </label>
                  <input
                    id="input-companion-name"
                    type="text"
                    required
                    value={companionName}
                    onChange={(e) => setCompanionName(e.target.value)}
                    placeholder={t.companionNamePlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/30 transition-all placeholder:text-zinc-600"
                  />
                </div>

                {/* Relationship Note */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-300 font-light">
                    {t.relationshipLabel}
                  </label>
                  <input
                    id="input-companion-relationship"
                    type="text"
                    value={companionRelationship}
                    onChange={(e) => setCompanionRelationship(e.target.value)}
                    placeholder={t.relationshipPlaceholder}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 transition-all placeholder:text-zinc-600"
                  />
                </div>
              </div>

              {/* Bio Note */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-light">
                  {t.bioLabel}
                </label>
                <input
                  id="input-companion-bio"
                  type="text"
                  value={companionBio}
                  onChange={(e) => setCompanionBio(e.target.value)}
                  placeholder={t.bioPlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 transition-all placeholder:text-zinc-600"
                />
              </div>

              {/* Presence State selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase tracking-widest text-zinc-400">
                  {t.currentPresenceState}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {presenceKeys.map((pmKey) => {
                    const active = companionPresence === pmKey;
                    const info = t.presenceStates[pmKey];
                    return (
                      <button
                        type="button"
                        key={pmKey}
                        id={`btn-companion-presence-${pmKey}`}
                        onClick={() => setCompanionPresence(pmKey)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                          active
                            ? 'border-amber-400/60 bg-amber-400/15 text-white shadow-md'
                            : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs font-medium text-zinc-200">{info.label}</span>
                        <span className="text-[10px] text-zinc-500 line-clamp-1">{info.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Orb Color Palette */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase tracking-widest text-zinc-400">
                  {t.baseIdentityTone}
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {Object.entries(ORB_PALETTES).map(([key, col]) => {
                    const active = companionColor.name === col.name;
                    return (
                      <button
                        type="button"
                        key={key}
                        id={`btn-companion-color-${key}`}
                        onClick={() => setCompanionColor(col)}
                        className={`w-9 h-9 rounded-full transition-all border flex items-center justify-center cursor-pointer ${
                          active ? 'scale-110 border-white ring-2 ring-amber-400/50' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          background: `radial-gradient(circle at 35% 35%, ${col.accent}, ${col.primary})`,
                          boxShadow: `0 0 10px ${col.glow}`,
                        }}
                      >
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Texture selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase tracking-widest text-zinc-400">
                  {t.internalTexture}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {textureKeys.map((txKey) => {
                    const active = companionTexture === txKey;
                    const info = t.textures[txKey];
                    return (
                      <button
                        type="button"
                        key={txKey}
                        id={`btn-companion-texture-${txKey}`}
                        onClick={() => setCompanionTexture(txKey)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-amber-400/60 bg-amber-400/15 text-white'
                            : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs font-medium text-zinc-200 block">{info.label}</span>
                        <span className="text-[10px] text-zinc-500">{info.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-register-companion"
                type="submit"
                disabled={!companionName.trim()}
                className="w-full py-3.5 rounded-2xl text-xs uppercase tracking-widest font-semibold bg-amber-400 hover:bg-amber-300 text-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {companionSavedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-900" />
                    <span>{t.registrationSuccess}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>{t.registerCompanionBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Circle Members List */}
          {activeTab === 'circle' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">{t.activeCompanions} ({people.length})</span>
                <button
                  id="btn-switch-to-add-companion"
                  onClick={() => setActiveTab('new_companion')}
                  className="px-3 py-1.5 rounded-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{t.newCompanionTab}</span>
                </button>
              </div>

              {people.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 border border-white/5 text-center flex flex-col items-center gap-3">
                  <Users className="w-8 h-8 text-zinc-600" />
                  <p className="text-xs text-zinc-400 max-w-sm">{t.noCompanionsRegistered}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {people.map((p) => (
                    <div
                      key={p.id}
                      id={`circle-member-item-${p.id}`}
                      className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3.5">
                        <LivingOrb
                          color={p.color}
                          presence={p.presence}
                          texture={p.texture}
                          motionPersonality={p.motionPersonality}
                          breathRate={p.breathRate}
                          size={42}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-100">{p.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
                              {t.presenceStates[p.presence]?.label || p.presence}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400">{p.relationship}</span>
                          {p.bioSnippet && (
                            <span className="text-[10px] text-zinc-500 italic mt-0.5 line-clamp-1">
                              {p.bioSnippet}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          id={`btn-send-signal-from-circle-${p.id}`}
                          onClick={() => {
                            onClose();
                            onSelectPersonToSend(p);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-200 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          title={t.sendSignal}
                        >
                          <Send className="w-3 h-3 text-amber-300" />
                          <span className="hidden sm:inline">{t.sendSignal}</span>
                        </button>

                        <button
                          id={`btn-copy-invite-${p.id}`}
                          onClick={() => handleCopyLink(p.id)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                          title={t.sharePresenceLink}
                        >
                          {copiedId === p.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          id={`btn-remove-companion-${p.id}`}
                          onClick={() => {
                            onRemovePerson(p.id);
                            ambientAudio.playRippleTone(180);
                          }}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer"
                          title={t.removeCompanion}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Shareable connection box */}
              <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/15 flex items-center justify-between gap-4 mt-2">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                  <div>
                    <span className="text-xs text-zinc-200 font-medium block">{t.sharePresenceLink}</span>
                    <span className="text-[10px] text-zinc-400">
                      {isRtl ? 'لینک حضور خود را برای دوستان بفرستید تا در فضا حضور یابند.' : 'Share your invite link so friends can enter your spatial circle.'}
                    </span>
                  </div>
                </div>
                <button
                  id="btn-copy-my-link"
                  onClick={() => handleCopyLink('my-presence-root')}
                  className="px-3.5 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  {copiedId === 'my-presence-root' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{t.linkCopied}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{t.sharePresenceLink}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: My Profile & Identity */}
          {activeTab === 'my_profile' && (
            <form onSubmit={handleSaveMyProfile} className="flex flex-col gap-5">
              {/* Preview of User's Orb */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/5">
                <LivingOrb
                  color={userColor}
                  presence={userPresence}
                  texture={userTexture}
                  motionPersonality="meditative"
                  breathRate={userBreathRate}
                  size={84}
                  isUser={true}
                />
                <span className="text-xs text-zinc-300 font-medium mt-2">
                  {userName.trim() || t.you}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {t.presenceStates[userPresence]?.label}
                </span>
              </div>

              {/* Super Admin Notice if applicable */}
              {(user.email?.toLowerCase() === 'soraun.com@gmail.com' || user.isSuperAdmin) && (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-400/40 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/30 text-amber-300 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-start">
                    <span className="text-xs font-bold text-amber-300">
                      {isRtl ? 'حساب کاربری مدیر ارشد (Super Admin)' : 'Super Admin Account'}
                    </span>
                    <span className="text-[10px] text-zinc-300 font-mono">
                      soraun.com@gmail.com
                    </span>
                  </div>
                </div>
              )}

              {/* Your Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-light">
                  {t.yourNameLabel}
                </label>
                <input
                  id="input-user-name"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={t.yourNamePlaceholder}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 transition-all placeholder:text-zinc-600"
                />
              </div>

              {/* Email field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-300 font-light flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isRtl ? 'ایمیل شما' : 'Email Address'}</span>
                </label>
                <input
                  id="input-user-email"
                  type="email"
                  value={user.email || ''}
                  onChange={(e) => onUpdateUser({ email: e.target.value.trim().toLowerCase(), isSuperAdmin: e.target.value.trim().toLowerCase() === 'soraun.com@gmail.com' })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-100 text-xs focus:outline-none focus:border-amber-400/60 transition-all placeholder:text-zinc-600 font-mono"
                />
              </div>

              {/* Presence State Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase tracking-widest text-zinc-400">
                  {t.currentPresenceState}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {presenceKeys.map((pmKey) => {
                    const active = userPresence === pmKey;
                    const info = t.presenceStates[pmKey];
                    return (
                      <button
                        type="button"
                        key={pmKey}
                        id={`btn-user-presence-${pmKey}`}
                        onClick={() => setUserPresence(pmKey)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                          active
                            ? 'border-white/40 bg-white/15 text-white'
                            : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs font-medium text-zinc-200">{info.label}</span>
                        <span className="text-[10px] text-zinc-500 line-clamp-1">{info.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Base Tone Palette */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase tracking-widest text-zinc-400">
                  {t.baseIdentityTone}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {Object.entries(ORB_PALETTES).map(([key, col]) => {
                    const active = userColor.name === col.name;
                    return (
                      <button
                        type="button"
                        key={key}
                        id={`btn-user-color-${key}`}
                        onClick={() => setUserColor(col)}
                        className={`w-9 h-9 rounded-full transition-all border flex items-center justify-center cursor-pointer ${
                          active ? 'scale-110 border-white ring-2 ring-white/30' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        style={{
                          background: `radial-gradient(circle at 35% 35%, ${col.accent}, ${col.primary})`,
                          boxShadow: `0 0 10px ${col.glow}`,
                        }}
                      >
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Internal Texture */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase tracking-widest text-zinc-400">
                  {t.internalTexture}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {textureKeys.map((txKey) => {
                    const active = userTexture === txKey;
                    const info = t.textures[txKey];
                    return (
                      <button
                        type="button"
                        key={txKey}
                        id={`btn-user-texture-${txKey}`}
                        onClick={() => setUserTexture(txKey)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'border-white/40 bg-white/15 text-white'
                            : 'border-white/5 bg-white/5 text-zinc-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xs font-medium text-zinc-200 block">{info.label}</span>
                        <span className="text-[10px] text-zinc-500">{info.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Breath Rate Slider */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[10px] uppercase tracking-widest text-zinc-400">{t.diaphragmaticBreathRate}</span>
                  <span className="text-zinc-300 font-mono text-[11px]">{userBreathRate} {t.secondsPerCycle}</span>
                </div>
                <input
                  id="slider-user-breath-rate"
                  type="range"
                  min="2.5"
                  max="8.0"
                  step="0.1"
                  value={userBreathRate}
                  onChange={(e) => setUserBreathRate(parseFloat(e.target.value))}
                  className="w-full accent-white h-1 bg-white/20 rounded-lg cursor-pointer"
                />
              </div>

              {/* Save Profile Button */}
              <button
                id="btn-save-my-profile"
                type="submit"
                className="w-full py-3.5 rounded-2xl text-xs uppercase tracking-widest font-semibold bg-white text-black hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2"
              >
                {savedSuccessMyProfile ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-900" />
                    <span>{t.registrationSuccess}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{t.saveProfileBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};
