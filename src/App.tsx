import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Person,
  UserIdentity,
  SharedLanguageItem,
  MemoryItem,
  TouchRipple,
  TravelingSignal,
  SignalData,
  OrbColor,
  WaveShape,
} from './types';
import {
  INITIAL_PEOPLE,
  INITIAL_USER,
  INITIAL_SHARED_LANGUAGES,
  INITIAL_MEMORIES,
} from './data/initialData';
import { SpatialField } from './components/SpatialField';
import { SignalComposer } from './components/SignalComposer';
import { SharedLanguageModal } from './components/SharedLanguageModal';
import { MemoriesSpace } from './components/MemoriesSpace';
import { IdentityCustomizer } from './components/IdentityCustomizer';
import { RegistrationModal } from './components/RegistrationModal';
import { SpaceInviteModal } from './components/SpaceInviteModal';
import { InvitedGuestJoinModal } from './components/InvitedGuestJoinModal';
import { InitialWelcomeModal } from './components/InitialWelcomeModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { CirclesManagerModal } from './components/CirclesManagerModal';
import { IncomingSignalOverlay } from './components/IncomingSignalOverlay';
import { SoundAtmosphereToggle } from './components/SoundAtmosphereToggle';
import { SensoryTapLoopRecorderModal } from './components/SensoryTapLoopRecorderModal';
import { ambientAudio } from './services/audio';
import { spaceSync } from './services/spaceSync';
import { subscribeToPush, getNotificationPermission } from './services/pushNotification';
import { History, Radio, UserCheck, Languages, UserPlus, Share2, ShieldCheck, MoreHorizontal, Menu, X, Bell, BellRing, Layers, Crown, Music } from 'lucide-react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

function MainAppContent() {
  const { language, setLanguage, t, isRtl } = useLanguage();

  // Permanent User Unique ID
  const [userId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('aetheria_user_id');
      if (savedId) return savedId;
      const newId = `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('aetheria_user_id', newId);
      return newId;
    } catch {
      return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    }
  });

  // Check whether user has already completed real registration
  const [isRegistered, setIsRegistered] = useState<boolean>(() => {
    try {
      const isReg = localStorage.getItem('aetheria_user_registered');
      const savedUser = localStorage.getItem('aetheria_user_identity');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.name && parsed.name.trim() && parsed.name !== 'You' && parsed.name !== 'شما') {
          return true;
        }
      }
      return isReg === 'true';
    } catch {
      return false;
    }
  });

  // Space & Invite Management
  const [spaceId, setSpaceId] = useState<string>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSpace = urlParams.get('space');
      if (urlSpace) return urlSpace;

      const saved = localStorage.getItem('aetheria_space_id');
      if (saved) return saved;

      const newId = `space-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem('aetheria_space_id', newId);
      return newId;
    } catch {
      return `space-${Math.random().toString(36).slice(2, 9)}`;
    }
  });

  const [spaceName, setSpaceName] = useState<string>(() => {
    try {
      return localStorage.getItem('aetheria_space_name') || 'حلقه اختصاصی من';
    } catch {
      return 'حلقه اختصاصی من';
    }
  });

  // Check if current user is an invited guest visiting from an admin invite link
  const [invitedHostName, setInvitedHostName] = useState<string | null>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('host');
    } catch {
      return null;
    }
  });

  // Only trigger guest onboarding if user is NOT yet registered on this device
  const [isGuestJoining, setIsGuestJoining] = useState<boolean>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSpace = urlParams.get('space');
      const savedUser = localStorage.getItem('aetheria_user_identity');
      const isReg = localStorage.getItem('aetheria_user_registered');
      let hasRealName = isReg === 'true';
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.name && parsed.name.trim() && parsed.name !== 'You' && parsed.name !== 'شما') {
          hasRealName = true;
        }
      }
      // If the user already registered before, NEVER show join popup on page reload!
      if (hasRealName) {
        return false;
      }
      return Boolean(urlSpace);
    } catch {
      return false;
    }
  });

  const isAdmin = !invitedHostName;

  // Real People Only mode (default true if user asked for real people only)
  const [isRealPeopleOnly, setIsRealPeopleOnly] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('aetheria_real_people_only');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [user, setUser] = useState<UserIdentity>(() => {
    try {
      const saved = localStorage.getItem('aetheria_user_identity');
      const savedId = localStorage.getItem('aetheria_user_id');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...INITIAL_USER,
          ...parsed,
          id: parsed.id || savedId || undefined,
        };
      }
      return {
        ...INITIAL_USER,
        id: savedId || undefined,
      };
    } catch {
      return INITIAL_USER;
    }
  });

  // Main People state
  const [people, setPeople] = useState<Person[]>(() => {
    try {
      const saved = localStorage.getItem('aetheria_people_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  const [sharedLanguages, setSharedLanguages] = useState<SharedLanguageItem[]>(() => {
    try {
      const saved = localStorage.getItem('aetheria_shared_languages');
      return saved ? JSON.parse(saved) : INITIAL_SHARED_LANGUAGES;
    } catch {
      return INITIAL_SHARED_LANGUAGES;
    }
  });

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('aetheria_memories_archive');
      return saved ? JSON.parse(saved) : INITIAL_MEMORIES;
    } catch {
      return INITIAL_MEMORIES;
    }
  });

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem('aetheria_people_list', JSON.stringify(people));
    } catch (e) {
      console.warn('Failed to save people list', e);
    }
  }, [people]);

  useEffect(() => {
    try {
      localStorage.setItem('aetheria_user_identity', JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user identity', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem('aetheria_real_people_only', JSON.stringify(isRealPeopleOnly));
    } catch (e) {
      console.warn('Failed to save real people mode', e);
    }
  }, [isRealPeopleOnly]);

  useEffect(() => {
    try {
      localStorage.setItem('aetheria_space_name', spaceName);
    } catch (e) {
      console.warn('Failed to save space name', e);
    }
  }, [spaceName]);

  useEffect(() => {
    try {
      localStorage.setItem('aetheria_shared_languages', JSON.stringify(sharedLanguages));
    } catch (e) {
      console.warn('Failed to save shared languages', e);
    }
  }, [sharedLanguages]);

  useEffect(() => {
    try {
      localStorage.setItem('aetheria_memories_archive', JSON.stringify(memories));
    } catch (e) {
      console.warn('Failed to save memories', e);
    }
  }, [memories]);

  // Active Modals & Views
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [composerRecipient, setComposerRecipient] = useState<Person | null>(null);
  const [sharedLangPerson, setSharedLangPerson] = useState<Person | null>(null);
  const [isMemoriesOpen, setIsMemoriesOpen] = useState<boolean>(false);
  const [isIdentityOpen, setIsIdentityOpen] = useState<boolean>(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState<boolean>(false);
  const [isInviteOpen, setIsInviteOpen] = useState<boolean>(false);
  const [isCirclesModalOpen, setIsCirclesModalOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showAccessibilityLabels, setShowAccessibilityLabels] = useState<boolean>(false);

  // Idea 3 & 5: Co-Touch Resonance & Custom Tap Loops State
  const [isCoTouchActive, setIsCoTouchActive] = useState<boolean>(false);
  const [coTouchPartnerName, setCoTouchPartnerName] = useState<string>('');
  const [coTouchPartnerColor, setCoTouchPartnerColor] = useState<string>('#df8a5a');
  const [coTouchHarmonyScore, setCoTouchHarmonyScore] = useState<number>(96);

  const [isTapStudioOpen, setIsTapStudioOpen] = useState<boolean>(false);
  const [tapStudioTargetPerson, setTapStudioTargetPerson] = useState<Person | null>(null);
  const [savedTapLoops, setSavedTapLoops] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('skala_saved_tap_loops');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('skala_saved_tap_loops', JSON.stringify(savedTapLoops));
    } catch (e) {
      console.warn('Failed to save tap loops', e);
    }
  }, [savedTapLoops]);

  // Environmental dynamic effects
  const [ripples, setRipples] = useState<TouchRipple[]>([]);
  const [activeSignals, setActiveSignals] = useState<TravelingSignal[]>([]);
  const [environmentTint, setEnvironmentTint] = useState<OrbColor | null>(null);
  const [currentArrival, setCurrentArrival] = useState<{ signal: SignalData; sender: Person } | null>(null);

  // Clean up old ripples
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRipples((prev) => prev.filter((r) => now - r.birth < 2200));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const addRipple = useCallback((ripple: TouchRipple) => {
    setRipples((prev) => [...prev.slice(-15), ripple]);
  }, []);

  // Update environmental tint when selection changes
  useEffect(() => {
    if (selectedPersonId) {
      const p = people.find((item) => item.id === selectedPersonId);
      setEnvironmentTint(p ? p.color : null);
    } else {
      setEnvironmentTint(null);
    }
  }, [selectedPersonId, people]);

  // Join Real-Time Space
  useEffect(() => {
    if (!spaceId || isGuestJoining) return;

    let mounted = true;

    spaceSync
      .joinSpace(spaceId, user, isAdmin, spaceName)
      .then((res) => {
        if (!mounted) return;
        if (res.participants && res.participants.length > 0) {
          setPeople((prev) => {
            const others = res.participants!.filter((p) => p.name !== user.name);
            if (isRealPeopleOnly) {
              return others;
            } else {
              const ids = new Set(others.map((o) => o.id));
              return [...others, ...prev.filter((p) => !ids.has(p.id))];
            }
          });
        }
      })
      .catch((err) => console.warn('Space join issue:', err));

    const unsubscribe = spaceSync.subscribe((event) => {
      if (!mounted) return;

      if (event.type === 'MEMBER_JOINED') {
        const participant = spaceSync.mapToPerson(event.data.participant);
        if (participant.name !== user.name) {
          setPeople((prev) => {
            const exists = prev.some((p) => p.id === participant.id || p.name === participant.name);
            if (exists) {
              return prev.map((p) => (p.name === participant.name ? participant : p));
            }
            return [...prev, participant];
          });

          // Play arrival resonance
          ambientAudio.playBreathPulse(0.5);
          addRipple({
            id: `rip-join-${Date.now()}`,
            x: (participant.x || 0.5) * window.innerWidth,
            y: (participant.y || 0.5) * window.innerHeight,
            color: participant.color.glow,
            radius: 10,
            maxRadius: 280,
            opacity: 0.85,
            birth: Date.now(),
          });
        }
      } else if (event.type === 'MEMBER_LEFT') {
        setPeople((prev) => prev.filter((p) => p.id !== event.data.userId));
      } else if (event.type === 'MEMBERS_UPDATED') {
        if (Array.isArray(event.data.participants)) {
          const mapped = event.data.participants
            .map((p: any) => spaceSync.mapToPerson(p))
            .filter((p: Person) => p.name !== user.name);
          setPeople(mapped);
        }
      } else if (event.type === 'SIGNAL_RECEIVED') {
        const sig = event.data;
        if (sig.senderName !== user.name) {
          handleInboundRealtimeSignal(sig);
        }
      } else if (event.type === 'CO_TOUCH_EVENT') {
        const { action, touch } = event.data;
        if (touch && touch.userId !== (user.id || 'user')) {
          if (action === 'start' || action === 'move') {
            const partner = people.find((p) => p.id === touch.userId || p.name === touch.userName);
            setIsCoTouchActive(true);
            setCoTouchPartnerName(partner?.name || touch.userName || 'هم‌نوا');
            setCoTouchPartnerColor(partner?.color?.accent || '#df8a5a');
            ambientAudio.startCoTouchResonance(touch.intensity || 0.85);
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([30, 40, 30]);
            }
          } else if (action === 'end') {
            setIsCoTouchActive(false);
            ambientAudio.stopCoTouchResonance();
          }
        }
      } else if (event.type === 'TAP_LOOP_SAVED') {
        if (event.data?.tapLoop) {
          setSavedTapLoops((prev) => {
            const exists = prev.some((l) => l.id === event.data.tapLoop.id);
            if (exists) return prev;
            return [event.data.tapLoop, ...prev];
          });
        }
      }
    });

    // Also fetch saved tap loops from space
    spaceSync.fetchTapLoops(spaceId).then((loops) => {
      if (loops && loops.length > 0) {
        setSavedTapLoops((prev) => {
          const ids = new Set(prev.map((l) => l.id));
          const newOnes = loops.filter((l: any) => !ids.has(l.id));
          return [...prev, ...newOnes];
        });
      }
    }).catch(() => {});

    return () => {
      mounted = false;
      unsubscribe();
      ambientAudio.stopCoTouchResonance();
    };
  }, [spaceId, user.name, isGuestJoining, isRealPeopleOnly]);

  // Auto-sync Web Push subscription when permission is already granted
  useEffect(() => {
    if (getNotificationPermission() === 'granted' && spaceId && user.id) {
      subscribeToPush(spaceId, user.id).catch((err) =>
        console.warn('Auto push subscription sync skipped:', err)
      );
    }
  }, [spaceId, user.id]);

  // Traveling Signal Animation loop
  const animFrameRef = useRef<number | null>(null);
  useEffect(() => {
    if (activeSignals.length === 0) return;

    const updateSignals = () => {
      setActiveSignals((prev) => {
        const next: TravelingSignal[] = [];
        prev.forEach((sig) => {
          const newProgress = sig.progress + 0.012;
          if (newProgress < 1.0) {
            next.push({ ...sig, progress: newProgress });
          } else {
            handleSignalArrivalAtTarget(sig);
          }
        });
        return next;
      });
      animFrameRef.current = requestAnimationFrame(updateSignals);
    };

    animFrameRef.current = requestAnimationFrame(updateSignals);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeSignals]);

  // When a traveling signal hits target
  const handleSignalArrivalAtTarget = (sig: TravelingSignal) => {
    addRipple({
      id: `rip-arr-${Date.now()}`,
      x: sig.targetX,
      y: sig.targetY,
      color: sig.color.glow,
      radius: 20,
      maxRadius: 260,
      opacity: 0.8,
      birth: Date.now(),
    });

    ambientAudio.playSignalResonance(sig.intensity);

    // Idea 5: Playback rhythmic Tap Loop if attached!
    if (sig.customTapLoop && Array.isArray(sig.customTapLoop.taps)) {
      sig.customTapLoop.taps.forEach((tap: any) => {
        setTimeout(() => {
          ambientAudio.playTapPointSound(tap.pitchHz || 440, tap.resonance || 0.8, tap.duration || 0.15);
          addRipple({
            id: `rip-tap-${Date.now()}-${Math.random()}`,
            x: sig.targetX + (tap.offsetX || 0),
            y: sig.targetY + (tap.offsetY || 0),
            color: sig.color.accent || '#38bdf8',
            radius: 14,
            maxRadius: 190,
            opacity: 0.95,
            birth: Date.now(),
          });
        }, tap.timeOffsetMs || 0);
      });
    }

    if (sig.recipientName === 'You' || sig.recipientName === 'شما' || sig.recipientName === user.name) {
      const sender = people.find((p) => p.name === sig.senderName) || {
        id: `guest-${Date.now()}`,
        name: sig.senderName,
        relationship: 'همراه واقعی',
        color: sig.color,
        presence: 'present' as const,
        texture: 'fluid' as const,
        motionPersonality: 'meditative' as const,
        breathRate: 4.5,
        baseDistance: 0.55,
        angle: 0,
        x: 0.5,
        y: 0.3,
      };

      const memoryEntry: MemoryItem = {
        id: `mem-${Date.now()}`,
        personId: sender.id,
        personName: sender.name,
        timestamp: Date.now(),
        sharedMeaning: sig.meaning || (language === 'fa' ? 'موج آرام حضور' : 'A quiet wave of presence'),
        signal: {
          id: `sig-${Date.now()}`,
          senderId: sender.id,
          recipientId: 'user',
          waveShape: sig.waveShape,
          intensity: sig.intensity,
          rhythmSpeed: 1.0,
          duration: 3.5,
          color: sig.color,
          sharedMeaning: sig.meaning,
          customTapLoop: sig.customTapLoop,
          createdAt: Date.now(),
        },
      };

      setMemories((prev) => [memoryEntry, ...prev]);
      setCurrentArrival({ signal: memoryEntry.signal, sender });

      setTimeout(() => {
        setCurrentArrival((curr) => (curr?.signal.id === memoryEntry.signal.id ? null : curr));
      }, 7000);
    }
  };

  // Inbound real-time signal from websocket/SSE
  const handleInboundRealtimeSignal = (sigData: any) => {
    const sender = people.find((p) => p.id === sigData.senderId || p.name === sigData.senderName);
    const startX = sender ? sender.x * window.innerWidth : window.innerWidth / 2;
    const startY = sender ? sender.y * window.innerHeight : window.innerHeight * 0.3;
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight * 0.74;

    const orbColor: OrbColor = sender ? sender.color : {
      name: 'Real-signal',
      primary: sigData.color || '#38bdf8',
      accent: sigData.color || '#7dd3fc',
      glow: 'rgba(56, 189, 248, 0.5)',
      ambient: 'rgba(56, 189, 248, 0.1)',
    };

    const traveling: TravelingSignal = {
      id: sigData.id || `sig-${Date.now()}`,
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      color: orbColor,
      waveShape: sigData.wave || 'soft_wave',
      intensity: sigData.intensity || 0.6,
      senderName: sigData.senderName || 'همراه واقعی',
      recipientName: language === 'fa' ? 'شما' : 'You',
      meaning: sigData.symbolMeaning || (language === 'fa' ? 'سیگنال زنده' : 'Live Signal'),
      customTapLoop: sigData.customTapLoop,
    };

    setEnvironmentTint(orbColor);
    setActiveSignals((prev) => [...prev, traveling]);
    ambientAudio.playBreathPulse(0.6);
  };

  // Send Signal from User to Recipient
  const handleSendSignal = (signal: SignalData) => {
    const recipient = people.find((p) => p.id === signal.recipientId);
    if (!recipient) return;

    const startX = window.innerWidth / 2;
    const startY = window.innerHeight * 0.74;
    const targetX = recipient.x * window.innerWidth;
    const targetY = recipient.y * window.innerHeight;

    const traveling: TravelingSignal = {
      id: signal.id,
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      color: recipient.color,
      waveShape: signal.waveShape,
      intensity: signal.intensity,
      senderName: language === 'fa' ? 'شما' : 'You',
      recipientName: recipient.name,
      meaning: signal.sharedMeaning,
    };

    setActiveSignals((prev) => [...prev, traveling]);

    // Send over real-time server to companion
    spaceSync.sendSignal(signal, user.name || 'مدیر فضا');

    const memItem: MemoryItem = {
      id: `mem-${Date.now()}`,
      personId: recipient.id,
      personName: recipient.name,
      timestamp: Date.now(),
      sharedMeaning: signal.sharedMeaning || (language === 'fa' ? 'سیگنال بی‌کلام' : 'Wordless Signal'),
      reflectionNote: language === 'fa' ? `ارسال شد به ${recipient.name}` : `Sent to ${recipient.name}`,
      signal,
    };
    setMemories((prev) => [memItem, ...prev]);

    setComposerRecipient(null);
    setSelectedPersonId(null);
  };

  // Quick instant pulse
  const handleInstantPulse = (recipient: Person) => {
    const signal: SignalData = {
      id: `sig-instant-${Date.now()}`,
      senderId: 'user',
      recipientId: recipient.id,
      waveShape: 'soft_wave',
      intensity: 0.5,
      rhythmSpeed: 1.0,
      duration: 3.0,
      color: recipient.color,
      sharedMeaning: language === 'fa' ? 'حضور آرام' : 'Gentle presence',
      createdAt: Date.now(),
    };
    handleSendSignal(signal);
  };

  // Zero-friction gesture wave dispatch
  const handleSendCustomWave = (
    recipient: Person,
    waveShape: WaveShape,
    intensity = 0.65,
    customMeaning?: string
  ) => {
    const defaultMeanings: Record<WaveShape, { fa: string; en: string }> = {
      soft_wave: { fa: 'موج نرم حضور', en: 'Gentle presence' },
      double_pulse: { fa: 'تپش صمیمانه قلب', en: 'Heartbeat pulse' },
      deep_echo: { fa: 'پژواک عمیق طنین', en: 'Deep resonance echo' },
      starlit_flicker: { fa: 'سوسوی ستاره‌ای', en: 'Starlit shimmer' },
      radiant_burst: { fa: 'فوران تابناک', en: 'Radiant surge' },
      steady_hum: { fa: 'نوای پیوسته و آرام', en: 'Steady presence' },
    };

    const meaning =
      customMeaning ||
      (language === 'fa'
        ? defaultMeanings[waveShape]?.fa || 'سیگنال زنده'
        : defaultMeanings[waveShape]?.en || 'Live signal');

    const signal: SignalData = {
      id: `sig-quick-${Date.now()}`,
      senderId: 'user',
      recipientId: recipient.id,
      waveShape,
      intensity,
      rhythmSpeed: waveShape === 'double_pulse' ? 1.2 : 1.0,
      duration: 3.2,
      color: recipient.color,
      sharedMeaning: meaning,
      createdAt: Date.now(),
    };

    handleSendSignal(signal);
  };

  // Simulate an incoming signal
  const handleSimulateIncoming = (preferredSender?: Person) => {
    const list = people.length > 0 ? people : INITIAL_PEOPLE;
    const sender = preferredSender || list[Math.floor(Math.random() * list.length)];
    const startX = sender.x * window.innerWidth;
    const startY = sender.y * window.innerHeight;
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight * 0.74;

    const senderLangs = sharedLanguages.filter((l) => l.personId === sender.id);
    const chosenLang = senderLangs.length > 0 ? senderLangs[Math.floor(Math.random() * senderLangs.length)] : null;

    const traveling: TravelingSignal = {
      id: `sig-in-${Date.now()}`,
      startX,
      startY,
      targetX,
      targetY,
      progress: 0,
      color: sender.color,
      waveShape: chosenLang ? chosenLang.waveShape : 'double_pulse',
      intensity: chosenLang ? chosenLang.intensity : 0.65,
      senderName: sender.name,
      recipientName: language === 'fa' ? 'شما' : 'You',
      meaning: chosenLang ? chosenLang.label : (language === 'fa' ? 'در سکوت به یاد شماست' : 'Thinking of you quietly'),
    };

    setEnvironmentTint(sender.color);
    setActiveSignals((prev) => [...prev, traveling]);
    ambientAudio.playBreathPulse(0.6);
  };

  // Idea 3: Send Co-Touch State
  const handleSendCoTouch = (action: 'start' | 'move' | 'end', touch: any) => {
    if (spaceId) {
      spaceSync.sendCoTouchState(
        action,
        {
          ...touch,
          userId: user.id || 'user',
          userName: user.name || 'همراه',
        },
        spaceId
      );
    }

    if (action === 'start') {
      setIsCoTouchActive(true);
      const partner = people.find((p) => p.id === touch.targetPersonId);
      if (partner) {
        setCoTouchPartnerName(partner.name);
        setCoTouchPartnerColor(partner.color.accent);
      }
      ambientAudio.startCoTouchResonance(touch.intensity || 0.85);
    } else if (action === 'end') {
      setIsCoTouchActive(false);
      ambientAudio.stopCoTouchResonance();
    }
  };

  // Idea 5: Save Tap Loop
  const handleSaveTapLoop = (tapLoop: any) => {
    setSavedTapLoops((prev) => [tapLoop, ...prev]);
    if (spaceId) {
      spaceSync.saveTapLoop(tapLoop, spaceId);
    }
  };

  // Idea 5: Transmit Tap Loop immediately
  const handleTransmitTapLoop = (recipient: Person, tapLoop: any) => {
    const signal: SignalData = {
      id: `sig-tap-${Date.now()}`,
      senderId: 'user',
      recipientId: recipient.id,
      waveShape: 'radiant_burst',
      intensity: 0.8,
      rhythmSpeed: tapLoop.tempoSpeed || 1.0,
      duration: (tapLoop.totalDuration / 1000) || 3.0,
      color: recipient.color,
      sharedMeaning: tapLoop.name,
      customTapLoop: tapLoop,
      createdAt: Date.now(),
    };
    handleSendSignal(signal);
  };

  // Toggle Real-People-Only mode vs Demo Bots
  const handleToggleRealPeopleOnly = (realOnly: boolean) => {
    setIsRealPeopleOnly(realOnly);
    if (realOnly) {
      // Keep only non-mock real companions
      setPeople((prev) => prev.filter((p) => p.relationship !== 'هم‌سفر فرضی'));
    } else {
      // Restore initial companions for preview
      setPeople(INITIAL_PEOPLE);
    }
  };

  const handleRestoreBots = () => {
    setIsRealPeopleOnly(false);
    setPeople(INITIAL_PEOPLE);
  };

  // Initial registration for first-time direct users
  const handleInitialRegister = (registeredUser: UserIdentity) => {
    const fullIdentity: UserIdentity = {
      ...registeredUser,
      id: userId,
    };
    setUser(fullIdentity);
    setIsRegistered(true);

    try {
      localStorage.setItem('aetheria_user_registered', 'true');
      localStorage.setItem('aetheria_user_identity', JSON.stringify(fullIdentity));
      localStorage.setItem('aetheria_user_id', userId);
    } catch (e) {
      console.warn('Failed to save initial registration', e);
    }

    if (fullIdentity.email) {
      spaceSync.registerUser(fullIdentity.name, fullIdentity.email, fullIdentity.color);
    }

    if (spaceId) {
      spaceSync.joinSpace(spaceId, fullIdentity, isAdmin, spaceName);
    }
  };

  // Guest join completion handler
  const handleGuestJoin = (guestIdentity: UserIdentity) => {
    const fullIdentity: UserIdentity = {
      ...guestIdentity,
      id: userId,
    };
    setUser(fullIdentity);
    setIsRegistered(true);
    setIsGuestJoining(false);

    try {
      localStorage.setItem('aetheria_user_registered', 'true');
      localStorage.setItem('aetheria_user_identity', JSON.stringify(fullIdentity));
      localStorage.setItem('aetheria_user_id', userId);

      // Clean up host query param from address bar so it looks clean
      const url = new URL(window.location.href);
      url.searchParams.delete('host');
      window.history.replaceState({}, document.title, url.toString());
    } catch (e) {
      console.warn('Failed to save guest registration', e);
    }

    if (fullIdentity.email) {
      spaceSync.registerUser(fullIdentity.name, fullIdentity.email, fullIdentity.color);
    }

    if (spaceId) {
      spaceSync.joinSpace(spaceId, fullIdentity, false).then((res) => {
        if (res.participants) {
          setPeople(res.participants.filter((p) => p.name !== fullIdentity.name));
        }
      });
    }
  };

  // Switch active circle
  const handleSwitchCircle = (newSpaceId: string, newSpaceName: string, isHost: boolean) => {
    setSpaceId(newSpaceId);
    setSpaceName(newSpaceName);
    try {
      localStorage.setItem('aetheria_space_id', newSpaceId);
      localStorage.setItem('aetheria_space_name', newSpaceName);
      const url = new URL(window.location.href);
      url.searchParams.set('space', newSpaceId);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {}

    ambientAudio.playRippleTone(520);
    const isMasterOrHost = isHost || Boolean(user.isSuperAdmin) || user.email?.toLowerCase() === 'soraun.com@gmail.com';
    spaceSync.joinSpace(newSpaceId, user, isMasterOrHost, newSpaceName).then((res) => {
      if (res.participants) {
        const others = res.participants.filter((p) => p.name !== user.name);
        setPeople(others);
      }
    });
  };

  const handleSaveSharedLanguage = (newItem: SharedLanguageItem) => {
    setSharedLanguages((prev) => [newItem, ...prev]);
  };

  const handleAddPerson = (newPerson: Person) => {
    setPeople((prev) => [...prev, newPerson]);
  };

  const handleRemovePerson = (personId: string) => {
    setPeople((prev) => prev.filter((p) => p.id !== personId));
    if (selectedPersonId === personId) setSelectedPersonId(null);
  };

  const handleUpdateUser = (updated: Partial<UserIdentity>) => {
    setUser((prev) => {
      const next = { ...prev, ...updated, id: prev.id || userId };
      try {
        localStorage.setItem('aetheria_user_identity', JSON.stringify(next));
        if (next.name && next.name.trim() && next.name !== 'You' && next.name !== 'شما') {
          localStorage.setItem('aetheria_user_registered', 'true');
          setIsRegistered(true);
        }
      } catch (e) {
        console.warn('Failed to save user identity update', e);
      }
      return next;
    });
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  return (
    <div
      id="aetheria-ambient-root"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`relative w-full h-full min-h-[100vh] min-h-[100dvh] overflow-hidden bg-[#090a0d] text-zinc-100 font-sans select-none ${
        isRtl ? 'rtl' : 'ltr'
      }`}
    >
      {/* 2. Primary Spatial Field with Living Orbs */}
      <SpatialField
        people={people}
        user={user}
        selectedPersonId={selectedPersonId}
        activeSignals={activeSignals}
        onSelectPerson={setSelectedPersonId}
        onOpenComposer={(p) => setComposerRecipient(p)}
        onOpenSharedLanguage={(p) => setSharedLangPerson(p)}
        onOpenMemories={() => setIsMemoriesOpen(true)}
        onOpenIdentity={() => setIsIdentityOpen(true)}
        onOpenRegistration={() => setIsRegistrationOpen(true)}
        onOpenInvite={() => setIsInviteOpen(true)}
        onRestoreBots={handleRestoreBots}
        isRealPeopleOnly={isRealPeopleOnly}
        onTriggerInstantPulse={handleInstantPulse}
        onSendCustomWave={handleSendCustomWave}
        onAddRipple={addRipple}
        showAccessibilityLabels={showAccessibilityLabels}
        onSendCoTouch={handleSendCoTouch}
        isCoTouchActive={isCoTouchActive}
        coTouchPartnerName={coTouchPartnerName}
        coTouchPartnerColor={coTouchPartnerColor}
        coTouchHarmonyScore={coTouchHarmonyScore}
        onOpenTapStudio={(p) => {
          setTapStudioTargetPerson(p || null);
          setIsTapStudioOpen(true);
        }}
      />

      {/* 3. Unified Responsive Floating Navigation Header */}
      <header className="absolute top-0 left-0 right-0 pt-[max(calc(env(safe-area-inset-top,0px)+12px),1.25rem)] px-3 sm:px-5 pb-3 flex items-center justify-between z-30 pointer-events-none bg-gradient-to-b from-black/80 via-black/35 to-transparent">
        {/* Start: SKALA Brand Mark & Space / Admin Status Note */}
        <div
          className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-zinc-950/85 border border-white/15 backdrop-blur-md shadow-lg max-w-[55vw] sm:max-w-none transition-all cursor-pointer hover:border-cyan-400/40 group"
          onClick={() => setIsInviteOpen(true)}
          title={t.inviteModalTitle}
        >
          {/* SKALA Logo Icon Mini */}
          <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/20 shadow-[0_0_10px_rgba(56,189,248,0.4)] group-hover:scale-105 transition-transform">
            <img src="/icon.svg" alt="SKALA" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>

          <div className="flex flex-col text-start overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] sm:text-xs font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-indigo-200 to-pink-300">
                SKALA
              </span>
              <span className="w-1 h-1 rounded-full bg-zinc-500" />
              <span className="text-[11px] sm:text-xs uppercase tracking-wider text-zinc-100 font-medium truncate">
                {isAdmin ? (language === 'fa' ? `مدیر: ${user.name || 'شما'}` : `Admin: ${user.name || 'You'}`) : (language === 'fa' ? `میزبان: ${invitedHostName || 'مدیر'}` : `Host: ${invitedHostName || 'Admin'}`)}
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 truncate hidden sm:block">
              {spaceName} • {isRealPeopleOnly ? (language === 'fa' ? 'فقط افراد واقعی' : 'Real People Only') : (language === 'fa' ? 'همراه با نمونه‌ها' : 'Sample Circle')}
            </span>
          </div>
        </div>

        {/* End: Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Primary Invite Link Button */}
          <button
            id="btn-open-invite"
            onClick={() => setIsInviteOpen(true)}
            className={`min-h-[42px] px-3 sm:px-4 rounded-full backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-lg hover:scale-105 active:scale-95 border shrink-0 ${
              isAdmin
                ? 'bg-amber-400/25 hover:bg-amber-400/35 text-amber-300 border-amber-400/40 ring-1 ring-amber-400/25'
                : 'bg-cyan-400/25 hover:bg-cyan-400/35 text-cyan-300 border-cyan-400/40'
            }`}
            title={t.inviteModalTitle}
            aria-label="Open Invite Link & Space Manager"
          >
            {isAdmin ? <ShieldCheck className="w-4 h-4 text-amber-300" /> : <Share2 className="w-4 h-4 text-cyan-300" />}
            <span className="text-xs font-semibold tracking-wide">
              {language === 'fa' ? 'دعوت' : 'Invite'}
            </span>
            {people.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          {/* Sensory Tap Studio (Idea 5) */}
          <button
            id="btn-open-tap-studio"
            onClick={() => {
              setTapStudioTargetPerson(people[0] || null);
              setIsTapStudioOpen(true);
            }}
            className="min-h-[42px] px-3 sm:px-3.5 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/35 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95"
            title={t.tapLoopsTitle}
            aria-label="Open Sensory Tap Studio"
          >
            <Music className="w-4 h-4 text-cyan-300" />
            <span className="text-xs font-medium hidden md:inline">{t.tapStudioBtn}</span>
          </button>

          {/* iOS Web Push Notifications Setup Button */}
          <button
            id="btn-open-notifications-quick"
            onClick={() => setIsNotificationsOpen(true)}
            className="min-h-[42px] min-w-[42px] p-2 sm:p-2.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/35 backdrop-blur-md transition-all flex items-center justify-center cursor-pointer shadow-md hover:scale-105 active:scale-95"
            title={language === 'fa' ? 'تنظیمات نوتیفیکیشن موبایل' : 'Mobile Push Notifications'}
            aria-label="Open Mobile Push Notifications"
          >
            <BellRing className="w-4 h-4 text-sky-300" />
          </button>

          {/* Sound Atmosphere Toggle (Always accessible) */}
          <SoundAtmosphereToggle />

          {/* Desktop Toolbar Icons (Visible on sm and up) */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
            {/* Circles & Groups Manager Button */}
            <button
              id="btn-open-circles"
              onClick={() => setIsCirclesModalOpen(true)}
              className="px-3 py-2 rounded-full bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/35 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95"
              title={language === 'fa' ? 'مدیریت و ساخت حلقه‌ها و گروه‌ها' : 'Circles & Groups'}
              aria-label="Open Circles & Groups Manager"
            >
              {user.isSuperAdmin || user.email?.toLowerCase() === 'soraun.com@gmail.com' ? (
                <Crown className="w-4 h-4 text-amber-300" />
              ) : (
                <Layers className="w-4 h-4 text-amber-300" />
              )}
              <span className="text-[11px] font-semibold tracking-wide">
                {language === 'fa' ? 'حلقه‌ها' : 'Circles'}
              </span>
            </button>

            {/* Registration & Companion Setup */}
            <button
              id="btn-open-registration"
              onClick={() => setIsRegistrationOpen(true)}
              className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
              title={t.registrationTitle}
              aria-label="Open Registration & Companion Setup"
            >
              <UserPlus className="w-4 h-4 text-zinc-300" />
            </button>

            {/* Language Switcher */}
            <button
              id="btn-toggle-language"
              onClick={toggleLanguage}
              className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
              title={t.toggleLanguage}
              aria-label="Toggle Persian / English"
            >
              <Languages className="w-4 h-4 text-zinc-300" />
              <span className="text-[11px] font-medium tracking-wide">
                {language === 'fa' ? 'EN' : 'فا'}
              </span>
            </button>

            {/* Preserved Memories Archive */}
            <button
              id="btn-open-memories"
              onClick={() => setIsMemoriesOpen(true)}
              className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/10 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
              title={t.memoriesArchive}
              aria-label="Open Memories Archive"
            >
              <History className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 hidden lg:inline">
                {t.memories} ({memories.length})
              </span>
            </button>

            {/* Simulate Signal */}
            <button
              id="btn-simulate-inbound"
              onClick={() => handleSimulateIncoming()}
              className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200 border border-white/10 backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
              title={t.simulateInbound}
              aria-label="Simulate Inbound Friend Signal"
            >
              <Radio className="w-4 h-4 text-zinc-400" />
            </button>

            {/* Accessibility semantic labels toggle */}
            <button
              id="btn-toggle-accessibility"
              onClick={() => setShowAccessibilityLabels((prev) => !prev)}
              className={`p-2 sm:p-2.5 rounded-full border border-white/10 backdrop-blur-md transition-all flex items-center cursor-pointer ${
                showAccessibilityLabels
                  ? 'bg-white/25 text-white'
                  : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200'
              }`}
              title={t.toggleAccessibility}
              aria-label="Toggle Semantic Presence Labels"
            >
              <UserCheck className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Dropdown Toggle Button (Only on mobile <sm) */}
          <div className="relative sm:hidden">
            <button
              id="btn-mobile-menu"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              className="min-h-[42px] min-w-[42px] p-2 rounded-full bg-white/10 text-zinc-200 border border-white/15 backdrop-blur-md cursor-pointer hover:bg-white/20 transition-all flex items-center justify-center"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
            </button>

            {/* Mobile Dropdown Popup */}
            {isMobileMenuOpen && (
              <div
                dir={isRtl ? 'rtl' : 'ltr'}
                className={`absolute top-12 ${
                  isRtl ? 'left-0' : 'right-0'
                } w-52 p-2 rounded-2xl bg-zinc-950/95 border border-white/15 backdrop-blur-xl shadow-2xl flex flex-col gap-1 z-50 animate-fade-in`}
              >
                {/* Sensory Tap Studio */}
                <button
                  onClick={() => {
                    setTapStudioTargetPerson(people[0] || null);
                    setIsTapStudioOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-cyan-400/15 text-xs text-cyan-300 transition-colors text-start"
                >
                  <Music className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{t.tapStudioBtn}</span>
                </button>

                {/* Circles & Groups Manager */}
                <button
                  onClick={() => {
                    setIsCirclesModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-amber-400/15 text-xs text-amber-300 transition-colors text-start"
                >
                  <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="flex-1">{language === 'fa' ? 'حلقه‌ها و گروه‌ها' : 'Circles & Groups'}</span>
                  {(user.isSuperAdmin || user.email?.toLowerCase() === 'soraun.com@gmail.com') && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                      Admin
                    </span>
                  )}
                </button>

                {/* Language switch */}
                <button
                  onClick={() => {
                    toggleLanguage();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-zinc-200 transition-colors text-start"
                >
                  <Languages className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="flex-1">{t.toggleLanguage}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">
                    {language === 'fa' ? 'EN' : 'فا'}
                  </span>
                </button>

                {/* Registration & Companion setup */}
                <button
                  onClick={() => {
                    setIsRegistrationOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-zinc-200 transition-colors text-start"
                >
                  <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t.registrationTitle}</span>
                </button>

                {/* Notifications setup */}
                <button
                  onClick={() => {
                    setIsNotificationsOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-sky-200 transition-colors text-start"
                >
                  <BellRing className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>{language === 'fa' ? 'نوتیفیکیشن پس‌زمینه (آیفون)' : 'Background Notifications'}</span>
                </button>

                {/* Memories Archive */}
                <button
                  onClick={() => {
                    setIsMemoriesOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-zinc-200 transition-colors text-start"
                >
                  <History className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{t.memories} ({memories.length})</span>
                </button>

                {/* Simulate Inbound Signal */}
                <button
                  onClick={() => {
                    handleSimulateIncoming();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-zinc-200 transition-colors text-start"
                >
                  <Radio className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>{t.simulateInbound}</span>
                </button>

                {/* Semantic Labels Toggle */}
                <button
                  onClick={() => {
                    setShowAccessibilityLabels((p) => !p);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-xs text-zinc-200 transition-colors text-start"
                >
                  <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{showAccessibilityLabels ? 'پنهان‌سازی نام‌ها' : 'نمایش برچسب‌ها'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 5. Incoming Signal Arrival Organic Overlay */}
      <IncomingSignalOverlay
        currentArrival={currentArrival}
        onEchoBack={(sender) => {
          handleInstantPulse(sender);
          setCurrentArrival(null);
        }}
        onDismiss={() => setCurrentArrival(null)}
      />

      {/* 6. Modals and Spatial Extensions */}
      <AnimatePresence>
        {/* One-time Initial Registration Modal for New Users */}
        {!isRegistered && !isGuestJoining && (
          <InitialWelcomeModal
            initialUser={user}
            onRegister={handleInitialRegister}
          />
        )}

        {/* Invited Guest Welcome & Onboarding Modal */}
        {isGuestJoining && (
          <InvitedGuestJoinModal
            hostName={invitedHostName || 'مدیر فضا'}
            spaceId={spaceId}
            onJoin={handleGuestJoin}
          />
        )}

        {/* Space Invite & Host Management Modal */}
        {isInviteOpen && (
          <SpaceInviteModal
            user={user}
            spaceId={spaceId}
            spaceName={spaceName}
            isRealPeopleOnly={isRealPeopleOnly}
            connectedPeople={people}
            onToggleRealPeopleOnly={handleToggleRealPeopleOnly}
            onUpdateSpaceName={(name) => setSpaceName(name)}
            onClose={() => setIsInviteOpen(false)}
          />
        )}

        {/* Registration & Companion Management Modal */}
        {isRegistrationOpen && (
          <RegistrationModal
            user={user}
            people={people}
            onUpdateUser={handleUpdateUser}
            onAddPerson={handleAddPerson}
            onRemovePerson={handleRemovePerson}
            onSelectPersonToSend={(p) => setComposerRecipient(p)}
            onClose={() => setIsRegistrationOpen(false)}
          />
        )}

        {/* Signal Composer */}
        {composerRecipient && (
          <SignalComposer
            recipient={composerRecipient}
            user={user}
            sharedLanguages={sharedLanguages}
            savedTapLoops={savedTapLoops}
            onOpenTapStudio={() => setIsTapStudioOpen(true)}
            onSendSignal={handleSendSignal}
            onCancel={() => setComposerRecipient(null)}
          />
        )}

        {/* Sensory Tap Loop Studio Modal */}
        {isTapStudioOpen && (
          <SensoryTapLoopRecorderModal
            isOpen={isTapStudioOpen}
            onClose={() => setIsTapStudioOpen(false)}
            user={user}
            selectedPerson={tapStudioTargetPerson || people[0] || null}
            people={people}
            onTransmitTapLoop={handleTransmitTapLoop}
            onSaveTapLoop={handleSaveTapLoop}
            savedLoops={savedTapLoops}
          />
        )}

        {/* Shared Language Studio */}
        {sharedLangPerson && (
          <SharedLanguageModal
            person={sharedLangPerson}
            user={user}
            existingLanguages={sharedLanguages}
            onSaveLanguage={handleSaveSharedLanguage}
            onClose={() => setSharedLangPerson(null)}
          />
        )}

        {/* Memories Space Archive */}
        {isMemoriesOpen && (
          <MemoriesSpace
            memories={memories}
            people={people}
            user={user}
            onClose={() => setIsMemoriesOpen(false)}
          />
        )}

        {/* User Living Orb & Presence Customizer */}
        {isIdentityOpen && (
          <IdentityCustomizer
            user={user}
            onUpdateUser={handleUpdateUser}
            onClose={() => setIsIdentityOpen(false)}
          />
        )}

        {/* Background & iOS Web Push Notifications Setup */}
        {isNotificationsOpen && (
          <NotificationSettingsModal
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
            spaceId={spaceId}
            userId={user.id}
            userName={user.name}
            isRtl={isRtl}
          />
        )}

        {/* Circles & Groups Multi-Room Manager */}
        {isCirclesModalOpen && (
          <CirclesManagerModal
            isOpen={isCirclesModalOpen}
            onClose={() => setIsCirclesModalOpen(false)}
            currentUser={user}
            currentSpaceId={spaceId}
            onSwitchSpace={handleSwitchCircle}
            onUpdateUser={handleUpdateUser}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MainAppContent />
    </LanguageProvider>
  );
}

