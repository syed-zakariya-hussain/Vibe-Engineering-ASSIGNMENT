/**
 * GarageSystem.js
 * Vehicle Store, Customization, Core Upgrades, and LocalStorage Persistence
 */

export class GarageSystem {
  constructor() {
    this.storageKey = 'neon_overdrive_save_v1';
    this.state = this.loadState();
  }

  getDefaultState() {
    return {
      credits: 250, // Starter bonus
      highScore: 0,
      bestDistance: 0,
      totalDrones: 0,
      equippedShip: 'phantom',
      equippedColor: '#00f0ff',
      equippedTrail: 'plasma',
      unlockedShips: ['phantom'],
      unlockedColors: ['#00f0ff', '#ff007f'],
      unlockedTrails: ['plasma'],
      upgrades: {
        speed: 1,      // Level 1-5 (Max Speed multiplier)
        shield: 1,     // Level 1-5 (Shield capacity & recharge)
        magnet: 1,     // Level 1-5 (Credit pull radius)
        blaster: 1     // Level 1-5 (Fire rate & cooldown)
      }
    };
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return { ...this.getDefaultState(), ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('LocalStorage unavailable, using default state');
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save state to LocalStorage');
    }
  }

  getShipsData() {
    return [
      {
        id: 'phantom',
        name: 'APEX PHANTOM',
        class: 'INTERCEPTOR CLASS',
        cost: 0,
        unlocked: true,
        specs: { speed: 85, accel: 90, handling: 85, shield: 75 }
      },
      {
        id: 'viper',
        name: 'VIPER STRIKE',
        class: 'STEALTH FIGHTER',
        cost: 600,
        unlocked: this.state.unlockedShips.includes('viper'),
        specs: { speed: 95, accel: 80, handling: 95, shield: 65 }
      },
      {
        id: 'vortex',
        name: 'VORTEX CRUISER',
        class: 'TURBINE ASSAULT',
        cost: 1200,
        unlocked: this.state.unlockedShips.includes('vortex'),
        specs: { speed: 80, accel: 85, handling: 80, shield: 95 }
      },
      {
        id: 'dreadnought',
        name: 'CYBER DREADNOUGHT',
        class: 'HEAVY TITAN',
        cost: 2000,
        unlocked: this.state.unlockedShips.includes('dreadnought'),
        specs: { speed: 90, accel: 95, handling: 75, shield: 100 }
      }
    ];
  }

  getColorsData() {
    return [
      { hex: '#00f0ff', name: 'NEON CYAN', cost: 0, unlocked: true },
      { hex: '#ff007f', name: 'CYBER PINK', cost: 0, unlocked: true },
      { hex: '#9d00ff', name: 'ULTRA VIOLET', cost: 150, unlocked: this.state.unlockedColors.includes('#9d00ff') },
      { hex: '#ffd700', name: 'SOLAR GOLD', cost: 300, unlocked: this.state.unlockedColors.includes('#ffd700') },
      { hex: '#39ff14', name: 'ACID LIME', cost: 300, unlocked: this.state.unlockedColors.includes('#39ff14') },
      { hex: '#ff2a2a', name: 'CRIMSON RED', cost: 450, unlocked: this.state.unlockedColors.includes('#ff2a2a') },
      { hex: '#ffffff', name: 'PURE CHROMIUM', cost: 600, unlocked: this.state.unlockedColors.includes('#ffffff') }
    ];
  }

  getTrailsData() {
    return [
      { id: 'plasma', name: 'PLASMA EMBER', cost: 0, unlocked: true },
      { id: 'grid', name: 'CYBER GRID', cost: 200, unlocked: this.state.unlockedTrails.includes('grid') },
      { id: 'stardust', name: 'WARP DUST', cost: 400, unlocked: this.state.unlockedTrails.includes('stardust') }
    ];
  }

  getUpgradesData() {
    const u = this.state.upgrades;
    return [
      {
        id: 'speed',
        name: 'HYPER-THRUST ENGINE',
        desc: 'Increases base and overdrive top speeds (+8% per level)',
        level: u.speed,
        maxLevel: 5,
        cost: u.speed * 200
      },
      {
        id: 'shield',
        name: 'NANO-COMPOSITE SHIELD',
        desc: 'Boosts max shield integrity and crash resistance (+20% per level)',
        level: u.shield,
        maxLevel: 5,
        cost: u.shield * 250
      },
      {
        id: 'magnet',
        name: 'MAGNETIC HARVESTER',
        desc: 'Pulls nearby energy cells and power-ups into ship (+4m range per level)',
        level: u.magnet,
        maxLevel: 5,
        cost: u.magnet * 180
      },
      {
        id: 'blaster',
        name: 'OVERCHARGED CAPACITORS',
        desc: 'Increases plasma cannon fire rate and cools weapon heat faster',
        level: u.blaster,
        maxLevel: 5,
        cost: u.blaster * 220
      }
    ];
  }

  unlockShip(shipId, cost) {
    if (this.state.credits >= cost && !this.state.unlockedShips.includes(shipId)) {
      this.state.credits -= cost;
      this.state.unlockedShips.push(shipId);
      this.state.equippedShip = shipId;
      this.saveState();
      return true;
    }
    return false;
  }

  equipShip(shipId) {
    if (this.state.unlockedShips.includes(shipId)) {
      this.state.equippedShip = shipId;
      this.saveState();
      return true;
    }
    return false;
  }

  unlockColor(colorHex, cost) {
    if (this.state.credits >= cost && !this.state.unlockedColors.includes(colorHex)) {
      this.state.credits -= cost;
      this.state.unlockedColors.push(colorHex);
      this.state.equippedColor = colorHex;
      this.saveState();
      return true;
    }
    return false;
  }

  equipColor(colorHex) {
    if (this.state.unlockedColors.includes(colorHex)) {
      this.state.equippedColor = colorHex;
      this.saveState();
      return true;
    }
    return false;
  }

  unlockTrail(trailId, cost) {
    if (this.state.credits >= cost && !this.state.unlockedTrails.includes(trailId)) {
      this.state.credits -= cost;
      this.state.unlockedTrails.push(trailId);
      this.state.equippedTrail = trailId;
      this.saveState();
      return true;
    }
    return false;
  }

  equipTrail(trailId) {
    if (this.state.unlockedTrails.includes(trailId)) {
      this.state.equippedTrail = trailId;
      this.saveState();
      return true;
    }
    return false;
  }

  buyUpgrade(upgradeId) {
    const upgrade = this.getUpgradesData().find(u => u.id === upgradeId);
    if (!upgrade || upgrade.level >= upgrade.maxLevel) return false;

    if (this.state.credits >= upgrade.cost) {
      this.state.credits -= upgrade.cost;
      this.state.upgrades[upgradeId]++;
      this.saveState();
      return true;
    }
    return false;
  }

  addCredits(amount) {
    this.state.credits += amount;
    this.saveState();
  }

  recordRunStats(score, distance, dronesDestroyed) {
    let isNewHigh = false;
    if (score > this.state.highScore) {
      this.state.highScore = score;
      isNewHigh = true;
    }
    if (distance > this.state.bestDistance) {
      this.state.bestDistance = Math.floor(distance);
    }
    this.state.totalDrones += dronesDestroyed;
    this.saveState();
    return isNewHigh;
  }

  // Get active gameplay stat multipliers
  getGameplayModifiers() {
    const u = this.state.upgrades;
    return {
      speedMultiplier: 1.0 + (u.speed - 1) * 0.08,
      maxShield: 100 + (u.shield - 1) * 25,
      magnetRadius: (u.magnet - 1) * 4.5,
      fireRateMultiplier: 1.0 + (u.blaster - 1) * 0.15
    };
  }
}
