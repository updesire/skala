# 🌌 SKALA — Spatial Ambient Presence Platform
> **"Presence without words."** | **«حضور، بی‌نیاز از کلمات.»**

SKALA is an ambient non-verbal communication platform designed to convey human closeness and emotional presence through light, motion, sensory haptics, living Orbs, and shared tactile languages.

Rather than relying on noisy chat rooms, typing indicators, read receipts, or social feeds, SKALA offers a quiet digital sanctuary where connection exists purely through intention and resonance.

---

## ✨ Core Pillars & Philosophy

- **Organic Living Orbs**: People in your inner circle are represented as breathing, dynamic light orbs that reflect presence, spatial proximity, and ambient energy.
- **Signals (Non-Verbal Gestures)**: Send subtle, non-intrusive light pulses, waves, and sensory vibrations across the space without creating an obligation or social pressure to respond.
- **Shared Tactile Language**: Create secret or private touch sequences with intimate partners or close friends, where specific rhythmic combinations carry shared emotional meanings known only to you.
- **Synchronous Co-Touch**: Real-time tactile and resonant interaction where two people touch the space simultaneously, generating visual harmony and synthesized resonance.
- **Sensory Tap Loops Studio**: Record, preview, save, and transmit custom multi-touch tap patterns and haptic rhythm sequences.
- **Local Time & Environmental Awareness**: Subtle atmospheric halos that reflect whether it's daytime, twilight, or quiet night for your connected companions, while strictly preserving their identity colors.
- **Persian & English (Bilingual)**: Native RTL support for Persian (Farsi) as the primary experience, with clean LTR English support.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation & Spatial Physics**: [Motion](https://motion.dev/) (formerly Framer Motion), HTML5 Canvas 2D spatial rendering
- **Audio Engine**: Web Audio API with zero external dependencies — pure procedural harmonic synthesis
- **Backend & Real-Time Sync**: Node.js, [Express](https://expressjs.com/), SSE (Server-Sent Events) and lightweight real-time polling with [tsx](https://github.com/privatenumber/tsx)
- **Bundler & Build Tool**: [Vite](https://vitejs.dev/) + [esbuild](https://esbuild.github.io/)
- **Push & PWA**: Service Worker with offline resilience, Push API, and Web Push notifications

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) / [pnpm](https://pnpm.io/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/skala.git
   cd skala
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   *(Optional)* Configure custom ports, Web Push keys, or Gemini AI API keys if using server-side extensions:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run in Development Mode:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Deployment

To compile and bundle both the client frontend and backend for production:

```bash
npm run build
npm start
```

This outputs:
- Static assets compiled to `/dist`
- Standalone self-contained CommonJS server at `/dist/server.cjs`

---

## 📂 Project Structure

```text
├── public/                # Static assets, icons, manifest.json, sw.js
├── src/
│   ├── components/        # UI & Spatial Components
│   │   ├── LivingOrb.tsx              # Dynamic Canvas/SVG Living Orb
│   │   ├── AmbientHome.tsx            # Main Spatial Interaction Canvas
│   │   ├── SignalComposer.tsx         # Non-verbal Signal Creator
│   │   ├── SensoryTapLoopRecorderModal.tsx # Tap Loop Studio
│   │   ├── CoTouchCanvas.tsx          # Real-time Synchronous Co-Touch
│   │   ├── SharedLanguageModal.tsx    # Private Pattern Dictionary
│   │   ├── MemoriesDrawer.tsx         # Received Signals Timeline
│   │   └── ...
│   ├── context/           # App Context (Theme, Language, User State)
│   ├── data/              # Default companion spaces and mock topologies
│   ├── i18n/              # Bilingual Persian (Fa) & English (En) strings
│   ├── services/          # Pure services:
│   │   ├── audio.ts                   # Web Audio Procedural Resonance Synthesizer
│   │   ├── haptics.ts                 # Vibration & Haptic Pattern Engine
│   │   ├── spaceSync.ts               # Multi-device Space & Co-Touch Sync
│   │   └── notificationService.ts     # PWA & Web Push Notification Handler
│   ├── types.ts           # Core TypeScript Interfaces & Enums
│   ├── App.tsx            # Root Application Component
│   ├── main.tsx           # React DOM Entry
│   └── index.css          # Tailwind CSS Root Styles
├── server.ts              # Express Backend with Space APIs & Server-Sent Events
├── vite.config.ts         # Vite Configuration
├── package.json           # Dependencies and Scripts
└── tsconfig.json          # TypeScript Configuration
```

---

## 🛡️ Privacy & Boundaries

- **No Public Profiles**: Spaces are private, invitation-based sanctuaries.
- **Quiet Hours**: Built-in configurable quiet hours that soften visual motion and mute non-essential alerts without labeling users with intrusive status tags.
- **Privacy Mode Notifications**: Choose between standard notifications («یک سیگنال از آرمان رسید») or discreet privacy-first alerts («یک حضور تازه منتظر توست») that conceal the sender on lock screens.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
