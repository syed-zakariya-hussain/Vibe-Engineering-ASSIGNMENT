/**
 * UIManager.js
 * Controls HUD Readouts, Speedometer Gauges, Screens/Modals, Garage Store, Audio Visualizer, and Touch Inputs
 */

export class UIManager {
  constructor(garageSystem, soundManager) {
    this.garage = garageSystem;
    this.sound = soundManager;

    this.selectedShipIndex = 0;
    this.bindElements();
    this.initVisualizer();
    this.updateMainMenuStats();
  }

  bindElements() {
    // Overlays
    this.fxDamage = document.getElementById('fx-damage');
    this.fxBoost = document.getElementById('fx-boost');
    this.fxSlowmo = document.getElementById('fx-slowmo');
    this.fxSpeedLines = document.getElementById('fx-speed-lines');

    // Screens
    this.screenStart = document.getElementById('screen-start');
    this.screenGarage = document.getElementById('screen-garage');
    this.screenHelp = document.getElementById('screen-help');
    this.screenSettings = document.getElementById('screen-settings');
    this.screenPause = document.getElementById('screen-pause');
    this.screenGameover = document.getElementById('screen-gameover');
    this.hud = document.getElementById('hud');
    this.touchControls = document.getElementById('touch-controls');

    // HUD Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudMultiplier = document.getElementById('hud-multiplier');
    this.hudDistance = document.getElementById('hud-distance');
    this.hudCredits = document.getElementById('hud-credits');
    this.hudSpeed = document.getElementById('hud-speed');
    this.speedGaugeFill = document.getElementById('speed-gauge-fill');
    this.shieldPercent = document.getElementById('shield-percent');
    this.shieldBar = document.getElementById('shield-bar');
    this.boostPercent = document.getElementById('boost-percent');
    this.boostBar = document.getElementById('boost-bar');
    this.weaponHeatBar = document.getElementById('weapon-heat-bar');
    this.powerupSlots = document.getElementById('powerup-slots');
    this.alertContainer = document.getElementById('hud-alert-container');
    this.camModeText = document.getElementById('cam-mode-text');

    // Garage Elements
    this.garageCredits = document.getElementById('garage-credits');
    this.shipName = document.getElementById('ship-name');
    this.shipClass = document.getElementById('ship-class');
    this.specSpeed = document.getElementById('spec-speed');
    this.specAccel = document.getElementById('spec-accel');
    this.specHandling = document.getElementById('spec-handling');
    this.specShield = document.getElementById('spec-shield');
    this.shipUnlockRow = document.getElementById('ship-unlock-row');
    this.paintOptions = document.getElementById('paint-options');
    this.upgradesContainer = document.getElementById('upgrades-container');
    this.trailOptions = document.getElementById('trail-options');

    // Game Over Elements
    this.goScore = document.getElementById('go-score');
    this.goDistance = document.getElementById('go-distance');
    this.goDrones = document.getElementById('go-drones');
    this.goMaxSpeed = document.getElementById('go-maxspeed');
    this.goCredits = document.getElementById('go-credits');
    this.goNewHigh = document.getElementById('go-new-high');

    // Settings
    this.volMusic = document.getElementById('vol-music');
    this.volSfx = document.getElementById('vol-sfx');

    this.bindButtons();
  }

  bindButtons() {
    // Menu navigation
    document.getElementById('btn-open-garage').onclick = () => this.openGarage();
    document.getElementById('btn-close-garage').onclick = () => this.closeGarage();
    document.getElementById('btn-open-help').onclick = () => this.openHelp();
    document.getElementById('btn-close-help').onclick = () => this.closeHelp();
    document.getElementById('btn-open-settings').onclick = () => this.openSettings();
    document.getElementById('btn-close-settings').onclick = () => this.closeSettings();

    // Garage Carousel & Tabs
    document.getElementById('btn-prev-ship').onclick = () => this.prevShip();
    document.getElementById('btn-next-ship').onclick = () => this.nextShip();

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const tabId = `tab-${btn.dataset.tab}`;
        const pane = document.getElementById(tabId);
        if (pane) pane.classList.add('active');
      };
    });

    // Volume sliders
    if (this.volMusic) {
      this.volMusic.oninput = (e) => this.sound.setMusicVolume(e.target.value / 100);
    }
    if (this.volSfx) {
      this.volSfx.oninput = (e) => this.sound.setSfxVolume(e.target.value / 100);
    }

    // Touch controls detect
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      this.touchControls.classList.remove('hidden');
    }
  }

  initVisualizer() {
    this.vizCanvas = document.getElementById('audio-visualizer');
    if (!this.vizCanvas) return;
    this.vizCtx = this.vizCanvas.getContext('2d');
    this.freqData = new Uint8Array(32);
  }

  updateVisualizer() {
    if (!this.vizCtx || !this.sound) return;
    this.sound.getFrequencyData(this.freqData);

    const w = this.vizCanvas.width;
    const h = this.vizCanvas.height;
    this.vizCtx.clearRect(0, 0, w, h);

    const barWidth = (w / this.freqData.length) * 0.8;
    for (let i = 0; i < this.freqData.length; i++) {
      const val = this.freqData[i] / 255;
      const barHeight = val * h;
      const x = i * (w / this.freqData.length);
      const y = h - barHeight;

      this.vizCtx.fillStyle = `hsl(${180 + val * 120}, 100%, 60%)`;
      this.vizCtx.fillRect(x, y, barWidth, barHeight);
    }
  }

  updateHUD(state) {
    // Score & Stats
    this.hudScore.textContent = Math.floor(state.score).toString().padStart(6, '0');
    this.hudMultiplier.textContent = `x${state.multiplier.toFixed(1)}`;
    this.hudDistance.textContent = `${Math.floor(state.distance)} m`;
    this.hudCredits.textContent = `⚡ ${state.creditsEarned}`;

    // Speed & Speedometer
    const speedKmh = Math.floor(state.speed * 3.6);
    this.hudSpeed.textContent = speedKmh;

    // SVG radial gauge (circumference = 408)
    const maxSpeedNorm = Math.min(1.0, state.speed / 120);
    const dashOffset = 408 - (maxSpeedNorm * 306);
    this.speedGaugeFill.style.strokeDashoffset = dashOffset;

    // Status Bars
    const shieldPct = Math.max(0, Math.min(100, (state.shield / state.maxShield) * 100));
    this.shieldBar.style.width = `${shieldPct}%`;
    this.shieldPercent.textContent = `${Math.round(shieldPct)}%`;

    const boostPct = Math.max(0, Math.min(100, state.boostEnergy));
    this.boostBar.style.width = `${boostPct}%`;
    this.boostPercent.textContent = `${Math.round(boostPct)}%`;

    // Weapon Heat
    this.weaponHeatBar.style.width = `${state.weaponHeat}%`;

    // Camera Mode
    this.camModeText.textContent = state.cameraMode.toUpperCase();

    // Active Powerups Badges
    this.renderPowerups(state.activePowerups);

    // Audio Visualizer
    this.updateVisualizer();
  }

  renderPowerups(powerups) {
    let html = '';
    for (let key in powerups) {
      const p = powerups[key];
      if (p.active) {
        let icon = '⚡';
        let color = '#00f0ff';
        if (key === 'shield') { icon = '🛡️'; color = '#00aaff'; }
        if (key === 'boost') { icon = '🚀'; color = '#ffd700'; }
        if (key === 'slowmo') { icon = '⏱️'; color = '#9d00ff'; }

        html += `
          <div class="powerup-badge" style="border-color: ${color}; color: ${color};">
            <span>${icon}</span>
            <span>${key.toUpperCase()} ${p.timeLeft.toFixed(1)}s</span>
          </div>
        `;
      }
    }
    this.powerupSlots.innerHTML = html;
  }

  showAlert(message, color = '#00f0ff') {
    const el = document.createElement('div');
    el.className = 'hud-alert-msg';
    el.style.color = color;
    el.textContent = message;
    this.alertContainer.appendChild(el);

    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 1500);
  }

  showDamageFX() {
    this.fxDamage.style.opacity = '1';
    setTimeout(() => { this.fxDamage.style.opacity = '0'; }, 200);
  }

  setBoostFX(active) {
    this.fxBoost.style.opacity = active ? '1' : '0';
    this.fxSpeedLines.style.opacity = active ? '0.75' : '0';
  }

  setSlowMoFX(active) {
    this.fxSlowmo.style.opacity = active ? '1' : '0';
  }

  // =========================================================================
  // SCREENS TRANSITIONS
  // =========================================================================
  showStartScreen() {
    this.screenStart.classList.remove('hidden');
    this.screenGameover.classList.add('hidden');
    this.screenPause.classList.add('hidden');
    this.hud.classList.add('hidden');
    this.updateMainMenuStats();
  }

  showHUD() {
    this.screenStart.classList.add('hidden');
    this.screenGameover.classList.add('hidden');
    this.screenPause.classList.add('hidden');
    this.screenGarage.classList.add('hidden');
    this.hud.classList.remove('hidden');
  }

  showPauseScreen() {
    this.screenPause.classList.remove('hidden');
  }

  hidePauseScreen() {
    this.screenPause.classList.add('hidden');
  }

  showGameOver(stats) {
    this.hud.classList.add('hidden');
    this.screenGameover.classList.remove('hidden');

    this.goScore.textContent = Math.floor(stats.score).toString().padStart(6, '0');
    this.goDistance.textContent = `${Math.floor(stats.distance)} m`;
    this.goDrones.textContent = stats.dronesDestroyed;
    this.goMaxSpeed.textContent = `${Math.floor(stats.maxSpeed * 3.6)} KM/H`;
    this.goCredits.textContent = `⚡ +${stats.creditsEarned}`;

    if (stats.isNewRecord) {
      this.goNewHigh.classList.remove('hidden');
    } else {
      this.goNewHigh.classList.add('hidden');
    }
  }

  updateMainMenuStats() {
    document.getElementById('menu-high-dist').textContent = `${this.garage.state.bestDistance} m`;
    document.getElementById('menu-high-score').textContent = this.garage.state.highScore;
    document.getElementById('menu-credits').textContent = `⚡ ${this.garage.state.credits}`;
  }

  // =========================================================================
  // GARAGE & UPGRADES MODAL
  // =========================================================================
  openGarage() {
    this.screenGarage.classList.remove('hidden');
    this.renderGarage();
  }

  closeGarage() {
    this.screenGarage.classList.add('hidden');
    this.updateMainMenuStats();
  }

  openHelp() {
    this.screenHelp.classList.remove('hidden');
  }

  closeHelp() {
    this.screenHelp.classList.add('hidden');
  }

  openSettings() {
    this.screenSettings.classList.remove('hidden');
  }

  closeSettings() {
    this.screenSettings.classList.add('hidden');
  }

  renderGarage() {
    this.garageCredits.textContent = `⚡ ${this.garage.state.credits}`;
    const ships = this.garage.getShipsData();
    const ship = ships[this.selectedShipIndex];

    this.shipName.textContent = ship.name;
    this.shipClass.textContent = ship.class;

    this.specSpeed.style.width = `${ship.specs.speed}%`;
    this.specAccel.style.width = `${ship.specs.accel}%`;
    this.specHandling.style.width = `${ship.specs.handling}%`;
    this.specShield.style.width = `${ship.specs.shield}%`;

    // Equip / Unlock Button
    this.shipUnlockRow.innerHTML = '';
    const isEquipped = this.garage.state.equippedShip === ship.id;

    if (isEquipped) {
      this.shipUnlockRow.innerHTML = `<button class="cyber-button primary-button small-btn" disabled>EQUIPPED</button>`;
    } else if (ship.unlocked) {
      const equipBtn = document.createElement('button');
      equipBtn.className = 'cyber-button secondary-button small-btn';
      equipBtn.textContent = 'EQUIP SHIP';
      equipBtn.onclick = () => {
        this.garage.equipShip(ship.id);
        this.renderGarage();
      };
      this.shipUnlockRow.appendChild(equipBtn);
    } else {
      const buyBtn = document.createElement('button');
      buyBtn.className = 'cyber-button primary-button small-btn';
      buyBtn.textContent = `UNLOCK (⚡ ${ship.cost})`;
      buyBtn.onclick = () => {
        if (this.garage.unlockShip(ship.id, ship.cost)) {
          this.sound.playCoin();
          this.renderGarage();
        } else {
          alert('Not enough Energy Cells!');
        }
      };
      this.shipUnlockRow.appendChild(buyBtn);
    }

    // Render Paint Palette
    this.renderPaintPalette();
    // Render Upgrades
    this.renderUpgrades();
    // Render Trails
    this.renderTrails();
  }

  prevShip() {
    const ships = this.garage.getShipsData();
    this.selectedShipIndex = (this.selectedShipIndex - 1 + ships.length) % ships.length;
    this.renderGarage();
  }

  nextShip() {
    const ships = this.garage.getShipsData();
    this.selectedShipIndex = (this.selectedShipIndex + 1) % ships.length;
    this.renderGarage();
  }

  renderPaintPalette() {
    const colors = this.garage.getColorsData();
    this.paintOptions.innerHTML = '';

    colors.forEach(col => {
      const swatch = document.createElement('div');
      swatch.className = `color-swatch ${this.garage.state.equippedColor === col.hex ? 'active' : ''}`;
      swatch.style.backgroundColor = col.hex;
      swatch.style.color = (col.hex === '#ffffff' || col.hex === '#ffd700') ? '#000' : '#fff';
      swatch.textContent = col.unlocked ? (this.garage.state.equippedColor === col.hex ? '✓' : '') : `⚡${col.cost}`;

      swatch.onclick = () => {
        if (col.unlocked) {
          this.garage.equipColor(col.hex);
          this.renderGarage();
        } else {
          if (this.garage.unlockColor(col.hex, col.cost)) {
            this.sound.playCoin();
            this.renderGarage();
          } else {
            alert('Not enough Energy Cells!');
          }
        }
      };

      this.paintOptions.appendChild(swatch);
    });
  }

  renderUpgrades() {
    const upgrades = this.garage.getUpgradesData();
    this.upgradesContainer.innerHTML = '';

    upgrades.forEach(u => {
      const card = document.createElement('div');
      card.className = 'upgrade-card';

      const isMax = u.level >= u.maxLevel;
      card.innerHTML = `
        <div class="upgrade-info">
          <div class="upgrade-title">${u.name}</div>
          <div class="upgrade-desc">${u.desc}</div>
          <div class="upgrade-lvl">LEVEL ${u.level} / ${u.maxLevel}</div>
        </div>
        <button class="cyber-button ${isMax ? 'secondary-button' : 'primary-button'} small-btn" ${isMax ? 'disabled' : ''}>
          ${isMax ? 'MAX LEVEL' : `UPGRADE ⚡${u.cost}`}
        </button>
      `;

      if (!isMax) {
        const btn = card.querySelector('button');
        btn.onclick = () => {
          if (this.garage.buyUpgrade(u.id)) {
            this.sound.playCoin();
            this.renderGarage();
          } else {
            alert('Not enough Energy Cells!');
          }
        };
      }

      this.upgradesContainer.appendChild(card);
    });
  }

  renderTrails() {
    const trails = this.garage.getTrailsData();
    this.trailOptions.innerHTML = '';

    trails.forEach(t => {
      const card = document.createElement('div');
      card.className = `trail-card ${this.garage.state.equippedTrail === t.id ? 'active' : ''}`;
      card.innerHTML = `
        <div class="trail-name">${t.name}</div>
        <div class="trail-status">${t.unlocked ? (this.garage.state.equippedTrail === t.id ? 'EQUIPPED' : 'EQUIP') : `⚡ ${t.cost}`}</div>
      `;

      card.onclick = () => {
        if (t.unlocked) {
          this.garage.equipTrail(t.id);
          this.renderGarage();
        } else {
          if (this.garage.unlockTrail(t.id, t.cost)) {
            this.sound.playCoin();
            this.renderGarage();
          } else {
            alert('Not enough Energy Cells!');
          }
        }
      };

      this.trailOptions.appendChild(card);
    });
  }
}
