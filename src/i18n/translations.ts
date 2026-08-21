import { PresenceState, OrbTexture, MotionPersonality, WaveShape } from '../types';

export type Language = 'fa' | 'en';

export interface PresenceInfo {
  label: string;
  desc: string;
}

export interface TextureInfo {
  label: string;
  desc: string;
}

export interface PersonalityInfo {
  label: string;
  desc: string;
}

export interface WaveInfo {
  label: string;
  desc: string;
}

export interface Translations {
  appName: string;
  appTagline: string;
  appTitle: string;
  appSubtitle: string;
  you: string;
  sound: string;
  soundActive: string;
  atmosphereActive: string;
  muteAtmosphere: string;
  enableAtmosphere: string;
  memories: string;
  memoriesArchive: string;
  simulateInbound: string;
  accessibilityLabels: string;
  toggleAccessibility: string;
  languageToggle: string;
  toggleLanguage: string;
  
  // Presence states mapping
  presenceStates: Record<PresenceState, PresenceInfo>;

  // Actions
  sendSignal: string;
  instantWave: string;
  sharedLanguage: string;
  dissolve: string;
  returnToSpace: string;
  returnToField: string;
  replayResonance: string;
  echoResonance: string;
  reachedYou: string;

  // Composer
  composingTo: string;
  waveSignature: string;
  resonanceIntensity: string;
  tempoPace: string;
  rhythm: string;
  sharedLanguageSymbol: string;
  privateIntention: string;
  intentionPlaceholder: string;
  privateIntentionPlaceholder: string;
  releaseSignal: string;
  releasingSignal: string;
  gentleWhisper: string;
  balanced: string;
  radiantSurge: string;

  // Wave shapes mapping
  waves: Record<WaveShape, WaveInfo>;

  // Shared language modal
  sharedLangCodex: string;
  privateSymbolicCodex: string;
  sharedLangWith: string;
  sharedLanguageWith: string;
  sharedLangDesc: string;
  sharedLanguageDesc: string;
  shapeTheSignal: string;
  privateUnspokenSymbol: string;
  privateMeaningLabel: string;
  privateIntimateMeaning: string;
  privateMeaningPlaceholder: string;
  meaningPlaceholder: string;
  contextualResonance: string;
  contextualResonanceLabel: string;
  contextualResonancePlaceholder: string;
  contextPlaceholder: string;
  preserveInSharedLang: string;
  preserveInSharedLanguage: string;
  activeSharedVocab: string;
  activeSharedVocabulary: string;
  noSharedSymbolsYet: string;
  noSymbolsYet: string;

  // Memories
  archiveOfLight: string;
  archivePreservedLight: string;
  revisitingPresence: string;
  revisitingMoments: string;
  noMemoriesYet: string;
  reconstructingMoment: string;
  wordlessSignal: string;
  intensity: string;
  wave: string;

  // Identity customizer
  personalSignature: string;
  yourLivingOrbIdentity: string;
  livingOrbIdentity: string;
  identityDesc: string;
  currentPresenceState: string;
  baseIdentityTone: string;
  internalTexture: string;
  internalOrganismTexture: string;
  diaphragmaticBreathRate: string;
  secondsPerCycle: string;
  motionPersonality: string;
  preserveInPresence: string;

  // Textures mapping
  textures: Record<OrbTexture, TextureInfo>;

  // Motion personalities mapping
  personalities: Record<MotionPersonality, PersonalityInfo>;

  // Registration & Circle Management
  registration: string;
  registrationTitle: string;
  myProfileTab: string;
  newCompanionTab: string;
  circleMembersTab: string;
  registerDesc: string;
  yourNameLabel: string;
  yourNamePlaceholder: string;
  companionNameLabel: string;
  companionNamePlaceholder: string;
  relationshipLabel: string;
  relationshipPlaceholder: string;
  bioLabel: string;
  bioPlaceholder: string;
  saveProfileBtn: string;
  registerCompanionBtn: string;
  activeCompanions: string;
  noCompanionsRegistered: string;
  removeCompanion: string;
  sharePresenceLink: string;
  linkCopied: string;
  quickRegister: string;
  registrationSuccess: string;

  // Real-time Space & Admin Invites
  adminMode: string;
  adminBadge: string;
  realPeopleOnly: string;
  realPeopleOnlyDesc: string;
  inviteModalTitle: string;
  inviteModalDesc: string;
  sendInviteLink: string;
  copyInviteLink: string;
  inviteLinkCopied: string;
  spaceNameLabel: string;
  spaceNamePlaceholder: string;
  waitingForRealPeople: string;
  guestWelcomeTitle: string;
  guestWelcomeSubtitle: string;
  joinLiveSpaceBtn: string;
  clearBots: string;
  restoreBots: string;
  connectedRealUsers: string;
  liveSyncStatus: string;

  // Idea 3: Synchronous Co-Touch Canvas
  coTouchTitle: string;
  coTouchActive: string;
  coTouchHolding: string;
  coTouchResonanceDesc: string;
  coTouchConnectedWith: string;
  coTouchInstruction: string;
  coTouchHarmonyScore: string;

  // Idea 5: Custom Sensory Tap Loops
  tapLoopsTitle: string;
  tapLoopsSubtitle: string;
  tapStudioBtn: string;
  recordTapLoop: string;
  recordingTapLoop: string;
  tapPadInstruction: string;
  tapLoopNameLabel: string;
  tapLoopNamePlaceholder: string;
  saveTapLoopBtn: string;
  playTapLoopBtn: string;
  sendTapLoopBtn: string;
  savedTapLoops: string;
  noTapLoopsYet: string;
  loopPresets: string;
  tapLoopSentSuccess: string;
  tapLoopPlaying: string;
  tapPointsCount: string;
  tempoMultiplier: string;
  clearRecording: string;
}

export const translations: Record<Language, Translations> = {
  fa: {
    appName: 'اسکالا (SKALA)',
    appTagline: 'حضور سیال و سیگنال‌های زنده',
    appTitle: 'اسکالا',
    appSubtitle: 'حضور سیال و سیگنال‌های زنده',
    you: 'شما',
    sound: 'صدا',
    soundActive: 'اتمسفر صوتی فعال',
    atmosphereActive: 'اتمسفر فعال',
    muteAtmosphere: 'بی‌صدا کردن اتمسفر صوتی',
    enableAtmosphere: 'فعال‌سازی اتمسفر صوتی ملایم',
    memories: 'خاطره‌ها',
    memoriesArchive: 'آرشیو خاطره‌ها',
    simulateInbound: 'شبیه‌سازی سیگنال دریافتی',
    accessibilityLabels: 'برچسب‌های دسترس‌پذیری',
    toggleAccessibility: 'تغییر وضعیت برچسب‌های معنایی حضور',
    languageToggle: 'English',
    toggleLanguage: 'تغییر زبان به انگلیسی',

    presenceStates: {
      present: { label: 'حاضر و باز', desc: 'درخشان و پذیرا برای حلقه نزدیکان' },
      deep_focus: { label: 'غرق در تمرکز', desc: 'نور آرام، پایدار و متمرکز' },
      reaching: { label: 'مشتاق تماس', desc: 'پالس هارمونیک و ریتمیک ملایم' },
      resting: { label: 'در آرامش و استراحت', desc: 'تنفس ملایم و مراقبه‌ای' },
      quiet: { label: 'مشاهده‌گر خاموش', desc: 'شناور در فضای ملایم محیطی' },
    },

    sendSignal: 'ارسال سیگنال',
    instantWave: 'موج آنی',
    sharedLanguage: 'زبان مشترک',
    dissolve: 'بستن و رهایی',
    returnToSpace: 'بازگشت به فضای اصلی',
    returnToField: 'بازگشت به فضای سیال',
    replayResonance: 'بازپخش طنین',
    echoResonance: 'پژواک طنین',
    reachedYou: 'به شما رسید',

    composingTo: 'در حال ارسال به',
    waveSignature: 'امضای موجی',
    resonanceIntensity: 'شدت طنین',
    tempoPace: 'ضرب‌آهنگ',
    rhythm: 'ریتم',
    sharedLanguageSymbol: 'نماد زبان مشترک',
    privateIntention: 'نیت قلبی / پیام خصوصی (اختیاری)',
    intentionPlaceholder: 'مثلاً: در سکوت به یادتم، تماشای باران...',
    privateIntentionPlaceholder: 'مثلاً: در سکوت به یادتم، تماشای باران...',
    releaseSignal: 'رهاسازی سیگنال در فضا',
    releasingSignal: 'در حال رهاسازی سیگنال...',
    gentleWhisper: 'زمزمه نرم',
    balanced: 'متعادل',
    radiantSurge: 'موج درخشان',

    waves: {
      soft_wave: { label: 'موج نرم', desc: 'حضور ملایم و روان' },
      double_pulse: { label: 'تپش دوگانه', desc: 'دو ضربان طنین‌انداز' },
      radiant_burst: { label: 'فوران تابناک', desc: 'گرمای گسترده و فروزان' },
      starlit_flicker: { label: 'سوسوی ستاره‌ای', desc: 'پراکندگی ظریف کیهانی' },
      deep_echo: { label: 'پژواک عمیق', desc: 'طنین آرامش‌بخش و زمینی' },
      steady_hum: { label: 'نوای پیوسته', desc: 'همراهی بی‌صدا و پایدار' },
    },

    sharedLangCodex: 'مجموعه نمادهای خصوصی',
    privateSymbolicCodex: 'مجموعه نمادهای خصوصی',
    sharedLangWith: 'زبان مشترک با',
    sharedLanguageWith: 'زبان مشترک با',
    sharedLangDesc: 'ابداع سیگنال‌های حسی و ناگفته که فقط میان شما دو نفر معنی دارد.',
    sharedLanguageDesc: 'ابداع سیگنال‌های حسی و ناگفته که فقط میان شما دو نفر معنی دارد.',
    shapeTheSignal: 'شکل‌دهی به سیگنال',
    privateUnspokenSymbol: 'نماد حسی خصوصی',
    privateMeaningLabel: 'معنای صمیمانه و خصوصی',
    privateIntimateMeaning: 'معنای صمیمانه و خصوصی',
    privateMeaningPlaceholder: 'مثلاً: به یادتم، آروم باش، به آسمون نگاه کن...',
    meaningPlaceholder: 'مثلاً: به یادتم، آروم باش، به آسمون نگاه کن...',
    contextualResonance: 'زمینه احساسی',
    contextualResonanceLabel: 'زمینه احساسی (توضیح اختیاری)',
    contextualResonancePlaceholder: 'مثلاً: وقتی در غروب بارانی به یاد هم می‌افتیم...',
    contextPlaceholder: 'مثلاً: وقتی در غروب بارانی به یاد هم می‌افتیم...',
    preserveInSharedLang: 'ثبت در گنجینه زبان مشترک',
    preserveInSharedLanguage: 'ثبت در گنجینه زبان مشترک',
    activeSharedVocab: 'واژگان فعال مشترک',
    activeSharedVocabulary: 'واژگان فعال مشترک',
    noSharedSymbolsYet: 'هنوز نمادی ساخته نشده است. اولین نماد خود را در بالا خلق کنید.',
    noSymbolsYet: 'هنوز نمادی ساخته نشده است. اولین نماد خود را در بالا خلق کنید.',

    archiveOfLight: 'آرشیو نورهای ماندگار',
    archivePreservedLight: 'آرشیو نورهای ماندگار',
    revisitingPresence: 'بازخوانی لحظات حضور مشترک',
    revisitingMoments: 'بازخوانی لحظات حضور مشترک',
    noMemoriesYet: 'هنوز خاطره‌ای ثبت نشده است. سیگنال‌های دریافتی به صورت اخگرهای نور در اینجا ذخیره می‌شوند.',
    reconstructingMoment: 'بازآفرینی لحظه',
    wordlessSignal: 'سیگنال بی‌کلام',
    intensity: 'شدت',
    wave: 'موج',

    personalSignature: 'امضای شخصی',
    yourLivingOrbIdentity: 'هویت گوی زنده شما',
    livingOrbIdentity: 'هویت گوی زنده شما',
    identityDesc: 'هاله بصری و ریتم حیاتی که حلقه نزدیکان از شما تجربه می‌کنند.',
    currentPresenceState: 'حالت کنونی حضور',
    baseIdentityTone: 'رنگ‌مایه هویتی',
    internalTexture: 'بافت ارگانیک درونی',
    internalOrganismTexture: 'بافت ارگانیک درونی',
    diaphragmaticBreathRate: 'آهنگ تنفس دیافراگمی',
    secondsPerCycle: 'ثانیه در هر چرخه',
    motionPersonality: 'شخصیت حرکتی',
    preserveInPresence: 'ذخیره در حضور',

    textures: {
      fluid: { label: 'موجود سیال', desc: 'موج‌های پیوسته ارگانیک' },
      aurora: { label: 'شفق قطبی', desc: 'جریان‌های نورانی نرم' },
      stardust: { label: 'غبار ستاره‌ای', desc: 'ذرات شناور در مدار داخلی' },
      crystalline: { label: 'بلورین', desc: 'تراش‌های منشوری درونی' },
      deep_core: { label: 'هسته ژرف', desc: 'قلب گرانشی گرم و چگال' },
    },

    personalities: {
      meditative: { label: 'مراقبه‌ای', desc: 'تنفس عمیق و آرام' },
      lively: { label: 'سرزنده', desc: 'طنین انرژی‌بخش نرم' },
      subtle: { label: 'بسیار ظریف', desc: 'حرکت بسیار آرام و کمینه' },
      pulsing: { label: 'تپنده', desc: 'امواج هم‌مرکز و گرم' },
      resonant: { label: 'طنین‌انداز', desc: 'آهنگ ریتمیک و سنگین' },
    },

    registration: 'ثبت‌نام و همراهان',
    registrationTitle: 'ثبت‌نام و مدیریت حلقه سیگنال',
    myProfileTab: 'هویت من',
    newCompanionTab: 'ثبت‌نام فرد جدید',
    circleMembersTab: 'اعضای حلقه',
    registerDesc: 'نام و مشخصات خود یا همراهانتان را ثبت کنید تا گوی زنده در فضا تشکیل شود.',
    yourNameLabel: 'نام شما',
    yourNamePlaceholder: 'مثلاً: سهراب، نیما، مریم...',
    companionNameLabel: 'نام همراه / دوست',
    companionNamePlaceholder: 'مثلاً: سارا، مهدی، آرمین...',
    relationshipLabel: 'نوع ارتباط / نسبت',
    relationshipPlaceholder: 'مثلاً: دوست صمیمی، هم‌سفر، خانواده...',
    bioLabel: 'یادداشت حال و هوا (اختیاری)',
    bioPlaceholder: 'مثلاً: گوش دادن به موسیقی، تماشای باران...',
    saveProfileBtn: 'ذخیره و ثبت هویت من',
    registerCompanionBtn: 'ثبت و افزودن به حلقه سیگنال',
    activeCompanions: 'همراهان ثبت‌شده در حلقه',
    noCompanionsRegistered: 'هنوز هیچ همراهی ثبت نشده است. از زبانه بالا اولین دوست خود را ثبت کنید.',
    removeCompanion: 'حذف از حلقه',
    sharePresenceLink: 'کپی پیوند دعوت و اتصال',
    linkCopied: 'پیوند دعوت کپی شد!',
    quickRegister: 'ثبت‌نام سریع',
    registrationSuccess: 'با موفقیت ثبت شد',

    // Real-time Space & Admin Invites
    adminMode: 'حالت مدیر و میزبان',
    adminBadge: 'شما مدیر این فضا هستید',
    realPeopleOnly: 'حلقه فقط افراد واقعی',
    realPeopleOnlyDesc: 'همراهان نمونه پاک شدند. تنها افرادی که با لینک دعوت شما وارد شوند نمایش داده می‌شوند.',
    inviteModalTitle: 'ارسال لینک دعوت به حلقه اختصاصی',
    inviteModalDesc: 'این لینک را برای دوستان واقعی خود ارسال کنید. با ورود آن‌ها، گوی زنده نوری‌شان مستقیماً در مدار حضور شما شکل می‌گیرد.',
    sendInviteLink: 'ارسال لینک دعوت',
    copyInviteLink: 'کپی لینک دعوت اختصاصی',
    inviteLinkCopied: 'لینک دعوت کپی شد! برای دوستانتان ارسال کنید.',
    spaceNameLabel: 'نام فضای اختصاصی',
    spaceNamePlaceholder: 'مثلاً: حلقه شبانه آرامش، فضای سکوت...',
    waitingForRealPeople: 'در انتظار پیوستن همراهان واقعی با لینک دعوت...',
    guestWelcomeTitle: 'دعوت به حلقه حضور اختصاصی',
    guestWelcomeSubtitle: 'شما توسط {host} به این فضای آرام و سیگنال زنده دعوت شده‌اید.',
    joinLiveSpaceBtn: 'ورود به مدار و تشکیل گوی من',
    clearBots: 'شروع با صفحه خالی (فقط آدم‌های واقعی)',
    restoreBots: 'مشاهده همراهان نمونه',
    connectedRealUsers: 'همراهان آنلاین در این فضا',
    liveSyncStatus: 'متصل به سرور زنده',

    // Idea 3: Synchronous Co-Touch Canvas
    coTouchTitle: 'لمس مشترک همزمان',
    coTouchActive: 'رزونانس لمس همزمان برقرار است',
    coTouchHolding: 'نگه‌داشتن لمس روی گوی',
    coTouchResonanceDesc: 'وقتی دو نفر همزمان گوی‌های یکدیگر را لمس می‌کنند، پلی از نور زنده و ارتعاش صوتی پیوسته شکل می‌گیرد.',
    coTouchConnectedWith: 'در تماس ارتعاشی زنده با',
    coTouchInstruction: 'انگشت خود را روی گوی نگه دارید و از همراهتان بخواهید همزمان گوی شما را لمس کند...',
    coTouchHarmonyScore: 'میزان هماهنگی ارتعاشی',

    // Idea 5: Custom Sensory Tap Loops
    tapLoopsTitle: 'کتابچه ریتم‌های حسی و تپ اختصاصی',
    tapLoopsSubtitle: 'ضبط، ذخیره و ارسال ریتم‌های لمسی اختصاصی به‌عنوان زبان احساسی',
    tapStudioBtn: 'استودیوی تپ حسی',
    recordTapLoop: 'شروع ضبط ریتم',
    recordingTapLoop: 'در حال ضبط ضرب‌آهنگ شما...',
    tapPadInstruction: 'روی پد لمسی با انگشتان خود ریتم بنوازید (ضربه در نقاط مختلف، فرکانس‌های دلنشین متفاوتی ایجاد می‌کند)',
    tapLoopNameLabel: 'نام ریتم حسی',
    tapLoopNamePlaceholder: 'مثلاً: ضربان قلب آرام، سه‌ضربه شبانه، کد دلتنگی...',
    saveTapLoopBtn: 'ذخیره در کتابخانه ریتم‌ها',
    playTapLoopBtn: 'پیش‌نمایش پخش ریتم',
    sendTapLoopBtn: 'ارسال این ریتم به همراه',
    savedTapLoops: 'ریتم‌های ضبط‌شده من',
    noTapLoopsYet: 'هنوز هیچ ریتم اختصاصی ضبط نشده است. روی دکمه ضبط بزنید و الگوی لمسی خود را خلق کنید.',
    loopPresets: 'ریتم‌های پیش‌فرض کیهانی',
    tapLoopSentSuccess: 'ریتم لمسی با موفقیت در فضا طنین‌انداز شد ✨',
    tapLoopPlaying: 'در حال طنین‌اندازی ریتم لمسی اختصاصی...',
    tapPointsCount: 'ضربه ضبط‌شده',
    tempoMultiplier: 'سرعت پخش',
    clearRecording: 'پاک کردن و ضبط مجدد',
  },
  en: {
    appName: 'SKALA',
    appTagline: 'Ambient Presence & Living Signals',
    appTitle: 'SKALA',
    appSubtitle: 'Ambient Presence & Living Signals',
    you: 'You',
    sound: 'Sound',
    soundActive: 'Atmosphere Active',
    atmosphereActive: 'Atmosphere Active',
    muteAtmosphere: 'Mute Ambient Atmosphere',
    enableAtmosphere: 'Enable Soft Ambient Atmosphere',
    memories: 'Memories',
    memoriesArchive: 'Memories Archive',
    simulateInbound: 'Simulate Inbound',
    accessibilityLabels: 'Toggle Semantic Presence Labels',
    toggleAccessibility: 'Toggle Semantic Presence Labels & Assistive Indicators',
    languageToggle: 'فارسی',
    toggleLanguage: 'Switch language to Persian',

    presenceStates: {
      present: { label: 'Open Presence', desc: 'Luminous and receptive to close circle' },
      deep_focus: { label: 'Deep Immersion', desc: 'Quiet, calm, steady glow' },
      reaching: { label: 'Reaching Out', desc: 'Subtle rhythmic harmonic pulse' },
      resting: { label: 'Deep Rest', desc: 'Dimmer, soft meditative breathing' },
      quiet: { label: 'Quiet Observer', desc: 'Drifting softly in ambient space' },
    },

    sendSignal: 'Send Signal',
    instantWave: 'Instant Wave',
    sharedLanguage: 'Shared Language',
    dissolve: 'Dissolve',
    returnToSpace: 'Return to Spatial Field',
    returnToField: 'Return to Spatial Field',
    replayResonance: 'Replay Resonance',
    echoResonance: 'Echo Resonance',
    reachedYou: 'reached you',

    composingTo: 'Composing to',
    waveSignature: 'Wave Signature',
    resonanceIntensity: 'Resonance Intensity',
    tempoPace: 'Tempo Pace',
    rhythm: 'Rhythm',
    sharedLanguageSymbol: 'Shared Language Symbol',
    privateIntention: 'Private Intention (Optional)',
    intentionPlaceholder: 'e.g. Quiet thinking of you, Looking at the moon...',
    privateIntentionPlaceholder: 'e.g. Quiet thinking of you, Looking at the moon...',
    releaseSignal: 'Release Signal Into Space',
    releasingSignal: 'Releasing Signal...',
    gentleWhisper: 'Gentle Whisper',
    balanced: 'Balanced',
    radiantSurge: 'Radiant Surge',

    waves: {
      soft_wave: { label: 'Soft Wave', desc: 'Gentle, rolling presence' },
      double_pulse: { label: 'Double Pulse', desc: 'Two resonant heartbeats' },
      radiant_burst: { label: 'Radiant Burst', desc: 'Luminous expansive warmth' },
      starlit_flicker: { label: 'Starlit Flicker', desc: 'Delicate starry dispersion' },
      deep_echo: { label: 'Deep Echo', desc: 'Low grounding resonance' },
      steady_hum: { label: 'Steady Hum', desc: 'Continuous silent company' },
    },

    sharedLangCodex: 'Private Symbolic Codex',
    privateSymbolicCodex: 'Private Symbolic Codex',
    sharedLangWith: 'Shared Language with',
    sharedLanguageWith: 'Shared Language with',
    sharedLangDesc: 'Invent tactile, non-verbal signals known only between the two of you.',
    sharedLanguageDesc: 'Invent tactile, non-verbal signals known only between the two of you.',
    shapeTheSignal: 'Shape the Signal',
    privateUnspokenSymbol: 'Private Unspoken Symbol',
    privateMeaningLabel: 'Private Intimate Meaning',
    privateIntimateMeaning: 'Private Intimate Meaning',
    privateMeaningPlaceholder: "e.g. 'Thinking of you', 'Safe now', 'Look outside'...",
    meaningPlaceholder: "e.g. 'Thinking of you', 'Safe now', 'Look outside'...",
    contextualResonance: 'Contextual Resonance',
    contextualResonanceLabel: 'Contextual Resonance (Optional note)',
    contextualResonancePlaceholder: 'e.g. Sent when we are in different time zones during quiet moments...',
    contextPlaceholder: 'e.g. Sent when we are in different time zones during quiet moments...',
    preserveInSharedLang: 'Preserve in Shared Language',
    preserveInSharedLanguage: 'Preserve in Shared Language',
    activeSharedVocab: 'Active Shared Vocabulary',
    activeSharedVocabulary: 'Active Shared Vocabulary',
    noSharedSymbolsYet: 'No symbols created yet. Define your first above.',
    noSymbolsYet: 'No symbols created yet. Define your first above.',

    archiveOfLight: 'Archive of Preserved Light',
    archivePreservedLight: 'Archive of Preserved Light',
    revisitingPresence: 'Revisiting Moments of Shared Presence',
    revisitingMoments: 'Revisiting Moments of Shared Presence',
    noMemoriesYet: 'No memories preserved yet. Signals received will form fragments here.',
    reconstructingMoment: 'Reconstructing Moment',
    wordlessSignal: 'Wordless Signal',
    intensity: 'Intensity',
    wave: 'Wave',

    personalSignature: 'Personal Signature',
    yourLivingOrbIdentity: 'Your Living Orb Identity',
    livingOrbIdentity: 'Your Living Orb Identity',
    identityDesc: 'Shape the non-verbal visual aura that your close circle experiences.',
    currentPresenceState: 'Current Presence State',
    baseIdentityTone: 'Base Identity Tone',
    internalTexture: 'Internal Organism Texture',
    internalOrganismTexture: 'Internal Organism Texture',
    diaphragmaticBreathRate: 'Diaphragmatic Breath Rate',
    secondsPerCycle: 's / cycle',
    motionPersonality: 'Motion Personality',
    preserveInPresence: 'Preserve In Presence',

    textures: {
      fluid: { label: 'Fluid Organism', desc: 'Continuous organic undulation' },
      aurora: { label: 'Aurora Swirl', desc: 'Soft luminous currents' },
      stardust: { label: 'Stardust Motes', desc: 'Faint internal orbiting stars' },
      crystalline: { label: 'Crystalline', desc: 'Prismatic internal facets' },
      deep_core: { label: 'Deep Core', desc: 'Dense warm gravitational heart' },
    },

    personalities: {
      meditative: { label: 'Meditative', desc: 'Slow, peaceful breath' },
      lively: { label: 'Lively', desc: 'Gentle energetic resonance' },
      subtle: { label: 'Subtle', desc: 'Quiet, minimal movement' },
      pulsing: { label: 'Pulsing', desc: 'Concentric warm waves' },
      resonant: { label: 'Resonant', desc: 'Deep rhythmic cadence' },
    },

    registration: 'Register & Circle',
    registrationTitle: 'Registration & Signal Circle',
    myProfileTab: 'My Identity',
    newCompanionTab: 'Register New Companion',
    circleMembersTab: 'Circle Members',
    registerDesc: 'Register your own identity or add companions to form living orbs in space.',
    yourNameLabel: 'Your Name',
    yourNamePlaceholder: 'e.g. Alex, Nima, Maya...',
    companionNameLabel: 'Companion Name',
    companionNamePlaceholder: 'e.g. Sara, Mehdi, Chris...',
    relationshipLabel: 'Relationship / Circle Note',
    relationshipPlaceholder: 'e.g. Close friend, Travel companion, Family...',
    bioLabel: 'Current Vibe / Note (Optional)',
    bioPlaceholder: 'e.g. Listening to music, watching the rain...',
    saveProfileBtn: 'Save & Register My Identity',
    registerCompanionBtn: 'Register & Add to Signal Space',
    activeCompanions: 'Registered Companions in Circle',
    noCompanionsRegistered: 'No companions registered yet. Register your first friend in the tab above.',
    removeCompanion: 'Remove from Circle',
    sharePresenceLink: 'Copy Presence Invite Link',
    linkCopied: 'Invite link copied!',
    quickRegister: 'Quick Register',
    registrationSuccess: 'Saved successfully',

    // Real-time Space & Admin Invites
    adminMode: 'Admin & Host Mode',
    adminBadge: 'You are the Space Admin',
    realPeopleOnly: 'Real People Only Space',
    realPeopleOnlyDesc: 'Sample companions cleared. Only real people who join via your invite link will appear.',
    inviteModalTitle: 'Invite Companions to Private Space',
    inviteModalDesc: 'Send this link to real friends. When they join, their living orb will form directly in your presence field in real-time.',
    sendInviteLink: 'Invite Link',
    copyInviteLink: 'Copy Private Invite Link',
    inviteLinkCopied: 'Invite link copied! Send it to your friends.',
    spaceNameLabel: 'Private Space Name',
    spaceNamePlaceholder: 'e.g. Midnight Sanctuary, Calm Harbor...',
    waitingForRealPeople: 'Waiting for real companions to join via invite link...',
    guestWelcomeTitle: 'Invited to Private Signal Space',
    guestWelcomeSubtitle: 'You have been invited by {host} to this living ambient presence circle.',
    joinLiveSpaceBtn: 'Enter Orbit & Form My Orb',
    clearBots: 'Start with Empty Space (Real People Only)',
    restoreBots: 'Show Sample Companions',
    connectedRealUsers: 'Real Companions Online',
    liveSyncStatus: 'Live Real-Time Synced',

    // Idea 3: Synchronous Co-Touch Canvas
    coTouchTitle: 'Synchronous Co-Touch',
    coTouchActive: 'Live Co-Touch Resonance Active',
    coTouchHolding: 'Holding touch on orb',
    coTouchResonanceDesc: 'When two people touch each other\'s orbs simultaneously, a living bridge of light and continuous acoustic harmonic resonance connects them.',
    coTouchConnectedWith: 'In live harmonic resonance with',
    coTouchInstruction: 'Hold your touch on their orb and invite them to touch your orb simultaneously...',
    coTouchHarmonyScore: 'Harmonic Alignment',

    // Idea 5: Custom Sensory Tap Loops
    tapLoopsTitle: 'Custom Sensory Tap Loops',
    tapLoopsSubtitle: 'Record, compose, and send custom tactile rhythm languages',
    tapStudioBtn: 'Sensory Tap Studio',
    recordTapLoop: 'Start Recording Rhythm',
    recordingTapLoop: 'Recording your sensory rhythm...',
    tapPadInstruction: 'Tap on the tactile surface with your fingers (different coordinates generate harmonious musical pitches)',
    tapLoopNameLabel: 'Sensory Rhythm Name',
    tapLoopNamePlaceholder: 'e.g. Calm Heartbeat, Starlit Triplets, Presence Code...',
    saveTapLoopBtn: 'Save to Tap Loops Codex',
    playTapLoopBtn: 'Preview Sensory Loop',
    sendTapLoopBtn: 'Transmit Rhythm Across Space',
    savedTapLoops: 'My Recorded Loops',
    noTapLoopsYet: 'No custom tap loops recorded yet. Tap start recording to craft your first tactile pattern.',
    loopPresets: 'Celestial Loop Presets',
    tapLoopSentSuccess: 'Sensory tap loop resonated across space ✨',
    tapLoopPlaying: 'Resonating custom tactile tap loop...',
    tapPointsCount: 'Taps Recorded',
    tempoMultiplier: 'Playback Speed',
    clearRecording: 'Clear & Re-record',
  },
};
