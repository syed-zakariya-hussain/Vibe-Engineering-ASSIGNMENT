# 📐 Technical Specification & Architecture Document

## Project: NEON OVERDRIVE 2099 (3D Cyberpunk Game)

---

## 1. System Architecture Overview

```
                          ┌────────────────────────┐
                          │       index.html       │
                          └───────────┬────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │       src/main.js       │
                         └──────┬──────┬─────┬─────┘
                                │      │     │     │
         ┌──────────────────────┘      │     │     └─────────────────────┐
         │                             │     │                           │
┌────────▼─────────┐    ┌──────────────▼───┐ │ ┌───────────────────┐ ┌───▼──────────────┐
│  SoundManager    │    │   GarageSystem   │ │ │   GameEngine      │ │    UIManager       │
│ (Web Audio Synth)│    │ (Persistence/Shop│ │ │ (Three.js/Loop)   │ │ (HUD/Gauges/Audio) │
└──────────────────┘    └──────────────────┘ │ └─────────┬─────────┘ └──────────────────┘
                                             │           │
                                             │     ┌─────┼─────────────┬─────────────┐
                                             │     │     │             │             │
                                             │ ┌───▼─┐ ┌─▼───────────┐ ┌▼──────────┐ ┌▼───────────┐
                                             │ │City │ │PlayerVehicle│ │Obstacles  │ │CombatSystem │
                                             │ └─────┘ └─────────────┘ └───────────┘ └─────────────┘
```

---

## 2. Component Specifications

### 2.1 Three.js Rendering Engine (`src/game/GameEngine.js`)
- **Tone Mapping**: `ACESFilmicToneMapping` with exposure `1.25` for high dynamic range neon colors.
- **Camera Configurations**:
  - Chase View: Lerped exponential follow ($\alpha = 18$), dynamic FOV interpolation based on speed ($65^\circ \to 82^\circ$).
  - Cockpit View: Fixed windshield coordinates with road tilt projection.
  - Top-Down View: $75^\circ$ pitch orthographic perspective.
- **Time Dilation**: Dynamic `timeScale` multiplier ($0.45\times$ during Chrono Slow-Mo) allowing bullet-time physics without desynchronizing rendering frames.

### 2.2 Procedural City & Highway Generator (`src/game/CityGenerator.js`)
- **Infinite Recycling Buffer**: Object pooling system maintaining 12 road segments and 72 building meshes with zero runtime garbage collection.
- **Segment Shifting**: Segments exceeding $Z_{\text{player}} - 90\text{m}$ are recycled and placed at $Z_{\text{max}} + 60\text{m}$.
- **Procedural Neon Skyscrapers**: Variable height ($40\text{m} - 150\text{m}$), randomized glowing window matrices, and rooftop spires.

### 2.3 Hovercraft Physics Model (`src/game/PlayerVehicle.js`)
- **Hover Oscillation**:
  $$y(t) = y_{\text{base}} + A \sin(\omega t) + y_{\text{jump}}$$
  where $A = 0.08\text{m}$, $\omega = 4.0\text{ rad/s}$.
- **Banking Angle ($\theta_{\text{roll}}$)**:
  $$\theta_{\text{roll}} = -\left(\frac{v_x}{v_{x,\text{max}}}\right) \cdot \theta_{\text{max}}$$
  where $\theta_{\text{max}} = 0.45\text{ rad}$.
- **Particle Thrusters**: Point cloud with 60 instanced particles, additive blending, and life-cycle respawn behind engine nozzles.

### 2.4 Procedural Web Audio API Synthesizer (`src/audio/SoundManager.js`)
- **Architecture**:
  - `OscillatorNode` (Sawtooth & Square) $\to$ `BiquadFilterNode` (Lowpass with exponential decay envelope) $\to$ `GainNode` $\to$ `MasterGain` $\to$ `AnalyserNode` $\to$ `AudioDestination`.
- **Drums**:
  - Kick: Sine oscillator starting at $140\text{ Hz}$ ramping down to $35\text{ Hz}$ in $120\text{ ms}$.
  - Snare/Hi-hat: White noise buffer generator passed through bandpass ($7500\text{ Hz}$) and highpass ($1000\text{ Hz}$) filters.
- **Synthesizer Sequencer**: 16-step cyclic tracker playing rolling 16th bassline and arpeggiated synth chords in C-Minor / D-Minor scales.

### 2.5 Combat & Collision Matrix (`src/game/CombatSystem.js` & `ObstacleManager.js`)
- **Spatial Collision Detection**: Spherical and Axis-Aligned Bounding Box (AABB) intersection tests.
- **Magnet Pull Dynamics**:
  $$\vec{F}_{\text{pull}} = \frac{\vec{P}_{\text{player}} - \vec{P}_{\text{coin}}}{\|\vec{P}_{\text{player}} - \vec{P}_{\text{coin}}\|} \cdot v_{\text{pull}}$$
  active when $\|\vec{P}_{\text{player}} - \vec{P}_{\text{coin}}\| < R_{\text{magnet}}$.

---

## 3. Performance & Optimization Standards

- **Frame Rate Target**: 60 FPS locked on standard desktop and mobile GPUs.
- **Draw Call Minimization**: Shared materials and pooled geometries across buildings, coins, and laser beams.
- **Memory Footprint**: Strict reuse of memory buffers; no heap allocation inside requestAnimationFrame step.
- **Zero Asset Dependencies**: 100% generated in JavaScript/Web Audio, eliminating network latency and 404 image/audio errors.
