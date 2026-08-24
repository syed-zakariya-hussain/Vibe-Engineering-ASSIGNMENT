# 🏎️ NEON OVERDRIVE 2099 — 3D Cyberpunk Racer & Combat

A high-octane, high-performance 3D Cyberpunk hovercraft racing and arcade combat web game built with **Three.js**, **Vite**, and a procedural **Web Audio API Synth Engine**. Zero external assets required — runs 100% offline and loads instantly anywhere.

---

## 🌟 Key Features

### 🌌 1. Procedural 3D Cyberpunk Universe
- **Infinite Procedural Metropolis**: Towering neon skyscrapers with illuminated window matrices, rooftop antenna spires, and glowing holographic billboards.
- **Dynamic Track & Highway**: Reflective asphalt road deck, animated holographic grid overlays, pulsing neon curbs, and overhead laser gates.
- **Dynamic Lighting & Atmospherics**: Glowing point lights, spotlights, depth fog, and starry synthwave night dome.

### 🚀 2. Physics & Hovercraft Mechanics
- **4 Unlockable 3D Hovercrafts**:
  - *Apex Phantom* (Interceptor Class - agile and balanced)
  - *Viper Strike* (Stealth Fighter - max top speed and sharp handling)
  - *Vortex Cruiser* (Turbine Assault - heavy armor and dual turbine rings)
  - *Cyber Dreadnought* (Heavy Titan - max shield capacity and triple thrusters)
- **Fluid Banking & Physics**: Realistic banking roll on turns, pitch tilting on boost/braking, floating hover sine oscillation, and high-altitude jump ramps.
- **Particle Systems**: Dynamic engine thruster trails (Plasma Flame, Cyber Grid, Warp Dust) and explosive debris systems.

### ⚔️ 3. Combat & Power-Ups
- **Dual Plasma Cannons**: Rapid-fire laser blasters to eliminate rogue surveillance drones and defense mines.
- **Dynamic Hazards**: Moving patrol drones, pulsing laser barriers, EMP mines, and high-speed jump ramps.
- **Field Collectibles**:
  - ⚡ **Energy Cells**: High-value cyber credits for ship purchases and core upgrades.
  - 🛡️ **Phase Shield**: Deflects collisions and laser impacts.
  - 🚀 **Quantum Overdrive**: Instant warp-speed invulnerability.
  - ⏱️ **Chrono Slow-Mo**: Dilates time for precision weaving through obstacles.

### 🎵 4. 100% Procedural Web Audio Synth Engine
- Real-time 80s/90s Synthwave soundtrack generated purely with Web Audio API oscillators, biquad filters, and noise envelopes — no audio files to load, zero CORS or latency issues!
- Procedural sound effects for engine pitch modulation, laser blasts, boost roar, shield deflect, coin pickup chime, and explosion impacts.
- Real-time Audio Frequency Visualizer integrated directly into the HUD.

### 🎮 5. Multiple Camera Perspectives & Responsive Controls
- **3rd-Person Chase Cam**: Dynamic lerp tracking with speed boost FOV expansion.
- **1st-Person Cockpit Cam**: High-immersion canopy view.
- **Top-Down Arcade Cam**: Classic retro shooter angle.
- **Full Mobile Support**: Virtual on-screen touch joystick and action buttons for smartphones and tablets.

---

## 🕹️ Controls Guide

| Action | Desktop Keyboard | Mouse / Touch |
| :--- | :--- | :--- |
| **Steer Left / Right** | `A` / `D` or `◀` / `▶` | Touch Left / Right Buttons |
| **Hyper Boost** | `W` or `▲` | Touch BOOST Button |
| **Air Brake / Drift** | `S` or `▼` | Touch BRAKE Button |
| **Fire Plasma Cannons** | `SPACE` or Left Click | Touch FIRE Button |
| **Switch Camera Mode** | `C` | 📷 HUD Camera Button |
| **Pause / Resume** | `ESC` or `P` | ⏸ HUD Pause Button |

---

## 🚀 Instant Deployment Guide (Vercel & More)

### Option A: Deploy to Vercel (Recommended)

#### 1. Via Vercel CLI
```bash
# Install Vercel CLI globally (if not already installed)
npm install -g vercel

# Deploy directly from project directory
vercel
```

#### 2. Via Vercel Dashboard (GitHub / Git)
1. Push your repository to GitHub or GitLab.
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import this repository.
4. Vercel automatically detects Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **"Deploy"**! Your 3D game will be live with an instant HTTPS URL and global CDN edge distribution.

---

### Option B: Deploy to Netlify
1. Drag and drop the `dist/` folder directly into [Netlify Drop](https://app.netlify.com/drop).
2. Or link your Git repository with build command `npm run build` and publish directory `dist`.

---

### Option C: Local Development & Testing

```bash
# Install dependencies
npm install

# Start local high-speed Vite dev server
npm run dev

# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🛠️ Technology Stack

- **Graphics Engine**: Three.js (WebGL, custom materials, lighting, particle buffers)
- **UI & Design**: Vanilla CSS Glassmorphism, Google Fonts (`Orbitron`, `Rajdhani`, `Chakra Petch`)
- **Audio Engine**: Web Audio API Procedural Synth & Sequencer
- **Build System**: Vite & Rollup with minification
- **Hosting Configuration**: `vercel.json` with cache-control optimization and SPA routing
