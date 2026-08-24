/**
 * GameEngine.js
 * Core Three.js Renderer, Physics Coordination, Camera Modes, Collision Detection, and Game Loop
 */

import * as THREE from 'three';
import { PlayerVehicle } from './PlayerVehicle.js';
import { CityGenerator } from './CityGenerator.js';
import { ObstacleManager } from './ObstacleManager.js';
import { CombatSystem } from './CombatSystem.js';

export class GameEngine {
  constructor(garageSystem, soundManager, uiManager) {
    this.garage = garageSystem;
    this.sound = soundManager;
    this.ui = uiManager;

    this.gameState = 'MENU'; // 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    this.gameMode = 'endless'; // 'endless' | 'timeattack' | 'combat'

    // Camera modes: 'chase' | 'cockpit' | 'topdown' | 'orbit'
    this.cameraModes = ['chase', 'cockpit', 'topdown'];
    this.currentCamIndex = 0;
    this.cameraMode = this.cameraModes[this.currentCamIndex];

    this.inputState = {
      left: false,
      right: false,
      up: false,
      down: false,
      fire: false
    };

    this.initThreeJS();
    this.initEntities();
    this.initStats();

    // Start requestAnimationFrame loop
    this.lastTime = performance.now();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThreeJS() {
    this.canvas = document.getElementById('webgl-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060714);

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 5, -10);
    this.camera.lookAt(0, 1, 10);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  initEntities() {
    this.city = new CityGenerator(this.scene);
    this.player = new PlayerVehicle(this.scene);
    this.obstacles = new ObstacleManager(this.scene);
    this.combat = new CombatSystem(this.scene, this.sound);
  }

  initStats() {
    this.score = 0;
    this.distance = 0;
    this.creditsEarned = 0;
    this.dronesDestroyed = 0;
    this.multiplier = 1.0;
    this.comboTimer = 0;

    this.speed = 35; // base speed in m/s
    this.targetSpeed = 35;
    this.maxSpeedReached = 35;

    this.boostEnergy = 100;
    this.isBoosting = false;

    this.shield = 100;
    this.maxShield = 100;

    this.timeScale = 1.0; // Slow-Mo dilated time scale
    this.gameTimer = 60; // For Time Attack mode

    this.activePowerups = {
      shield: { active: false, timeLeft: 0 },
      boost: { active: false, timeLeft: 0 },
      slowmo: { active: false, timeLeft: 0 }
    };
  }

  startRun(mode = 'endless') {
    this.gameMode = mode;
    this.gameState = 'PLAYING';

    const mods = this.garage.getGameplayModifiers();
    this.maxShield = mods.maxShield;
    this.shield = this.maxShield;
    this.baseSpeed = 38 * mods.speedMultiplier;
    this.speed = this.baseSpeed;
    this.targetSpeed = this.baseSpeed;
    this.maxSpeedReached = this.speed;

    this.score = 0;
    this.distance = 0;
    this.creditsEarned = 0;
    this.dronesDestroyed = 0;
    this.multiplier = 1.0;
    this.comboTimer = 0;
    this.boostEnergy = 100;
    this.gameTimer = 60;
    this.timeScale = 1.0;

    for (let key in this.activePowerups) {
      this.activePowerups[key].active = false;
      this.activePowerups[key].timeLeft = 0;
    }

    // Refresh equipped vehicle custom settings
    this.player.buildShip(this.garage.state.equippedShip, this.garage.state.equippedColor);
    this.player.reset();
    this.city.reset();
    this.obstacles.reset();
    this.combat.reset();

    this.ui.showHUD();
    this.sound.startMusic();
    this.sound.startEngine();
    this.ui.showAlert('RUN INITIALIZED // SYSTEM GO!', '#00f0ff');
  }

  switchCamera() {
    this.currentCamIndex = (this.currentCamIndex + 1) % this.cameraModes.length;
    this.cameraMode = this.cameraModes[this.currentCamIndex];
  }

  togglePause() {
    if (this.gameState === 'PLAYING') {
      this.gameState = 'PAUSED';
      this.ui.showPauseScreen();
      this.sound.stopEngine();
    } else if (this.gameState === 'PAUSED') {
      this.gameState = 'PLAYING';
      this.ui.hidePauseScreen();
      this.sound.startEngine();
    }
  }

  gameOver() {
    this.gameState = 'GAMEOVER';
    this.sound.playExplosion();
    this.sound.stopEngine();
    this.sound.stopMusic();

    this.garage.addCredits(this.creditsEarned);
    const isNewHigh = this.garage.recordRunStats(this.score, this.distance, this.dronesDestroyed);

    this.ui.showGameOver({
      score: this.score,
      distance: this.distance,
      dronesDestroyed: this.dronesDestroyed,
      maxSpeed: this.maxSpeedReached,
      creditsEarned: this.creditsEarned,
      isNewRecord: isNewHigh
    });
  }

  animate(time) {
    requestAnimationFrame(this.animate);

    const rawDt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    const dt = rawDt * this.timeScale;

    if (this.gameState === 'PLAYING') {
      this.updatePlaying(dt);
    } else if (this.gameState === 'MENU') {
      this.updateMenu(rawDt);
    } else if (this.gameState === 'GAMEOVER') {
      this.updateGameOver(rawDt);
    }

    this.renderer.render(this.scene, this.camera);
  }

  updateMenu(dt) {
    // Cinematic orbit camera around player ship
    const orbitTime = performance.now() * 0.0006;
    const radius = 9;
    this.camera.position.x = Math.sin(orbitTime) * radius;
    this.camera.position.z = Math.cos(orbitTime) * radius - 2;
    this.camera.position.y = 3.5;
    this.camera.lookAt(0, 0.8, 0);

    this.player.mesh.rotation.y = Math.sin(orbitTime * 0.5) * 0.2;
  }

  updateGameOver(dt) {
    this.camera.position.y += (4.5 - this.camera.position.y) * 2 * dt;
    this.camera.position.x += (this.player.position.x * 0.5 - this.camera.position.x) * 2 * dt;
  }

  updatePlaying(dt) {
    const mods = this.garage.getGameplayModifiers();

    // 1. Boost Mechanics
    this.isBoosting = this.inputState.up && this.boostEnergy > 0;
    if (this.activePowerups.boost.active) {
      this.isBoosting = true;
    }

    if (this.isBoosting) {
      this.targetSpeed = this.baseSpeed * 1.6;
      if (!this.activePowerups.boost.active) {
        this.boostEnergy = Math.max(0, this.boostEnergy - 30 * dt);
      }
      this.ui.setBoostFX(true);
    } else if (this.inputState.down) {
      this.targetSpeed = this.baseSpeed * 0.55; // Air brake
      this.boostEnergy = Math.min(100, this.boostEnergy + 20 * dt);
      this.ui.setBoostFX(false);
    } else {
      this.targetSpeed = this.baseSpeed;
      this.boostEnergy = Math.min(100, this.boostEnergy + 12 * dt);
      this.ui.setBoostFX(false);
    }

    // Smooth speed acceleration
    this.speed += (this.targetSpeed - this.speed) * 3 * dt;
    // Gradually increase base speed over time
    this.baseSpeed += 0.4 * dt;
    if (this.speed > this.maxSpeedReached) {
      this.maxSpeedReached = this.speed;
    }

    // Distance and forward motion
    this.distance += this.speed * dt;
    this.player.position.z += this.speed * dt;

    // Multiplier & Score calculation
    this.score += this.speed * this.multiplier * dt * 10;
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.multiplier = Math.max(1.0, this.multiplier - 0.5);
      }
    }

    // 2. Update Entities
    this.player.update(dt, this.inputState, this.isBoosting, this.speed);
    this.city.update(this.player.position.z);
    this.obstacles.update(dt, this.player.position.z, mods.magnetRadius, this.player.position);
    this.combat.update(dt, this.player.position, this.inputState.fire, this.obstacles, (targetType) => {
      this.onEnemyDestroyed(targetType);
    });

    // 3. Audio engine modulation
    this.sound.updateEngine(Math.min(1.0, this.speed / 100));

    // 4. Update Active Power-ups
    this.updatePowerups(dt);

    // 5. Collisions Check
    this.checkCollisions();

    // 6. Camera Follow
    this.updateCamera(dt);

    // 7. Update UI HUD
    this.ui.updateHUD({
      score: this.score,
      multiplier: this.multiplier,
      distance: this.distance,
      creditsEarned: this.creditsEarned,
      speed: this.speed,
      shield: this.shield,
      maxShield: this.maxShield,
      boostEnergy: this.boostEnergy,
      weaponHeat: this.combat.heat,
      cameraMode: this.cameraMode,
      activePowerups: this.activePowerups
    });
  }

  updatePowerups(dt) {
    for (let key in this.activePowerups) {
      const p = this.activePowerups[key];
      if (p.active) {
        p.timeLeft -= dt;
        if (p.timeLeft <= 0) {
          p.active = false;
          if (key === 'slowmo') {
            this.timeScale = 1.0;
            this.ui.setSlowMoFX(false);
          } else if (key === 'shield') {
            this.player.setShieldVisual(false);
          }
        }
      }
    }
  }

  checkCollisions() {
    const playerPos = this.player.position;
    const playerRadius = 1.2;

    // Check Collectibles
    const collectibles = this.obstacles.collectibles;
    for (let i = collectibles.length - 1; i >= 0; i--) {
      const item = collectibles[i];
      const dx = playerPos.x - item.mesh.position.x;
      const dy = playerPos.y - item.mesh.position.y;
      const dz = playerPos.z - item.mesh.position.z;
      const distSq = dx * dx + dy * dy + dz * dz;

      if (distSq < (playerRadius + item.radius) * (playerRadius + item.radius)) {
        if (item.type === 'coin') {
          this.creditsEarned += item.value;
          this.score += item.value * 50 * this.multiplier;
          this.sound.playCoin();
          this.obstacles.removeCollectible(item);
        } else if (item.type === 'powerup') {
          this.activatePowerup(item.powerType);
          this.obstacles.removeCollectible(item);
        }
      }
    }

    // Check Obstacles & Hazards
    const obstacles = this.obstacles.obstacles;
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];

      if (obs.type === 'ramp') {
        // Jump ramp detection
        if (playerPos.z >= obs.bounds.zMin && playerPos.z <= obs.bounds.zMax &&
            playerPos.x >= obs.bounds.xMin && playerPos.x <= obs.bounds.xMax) {
          this.player.triggerJump(22);
          this.sound.playBoost();
          this.ui.showAlert('HYPER JUMP!', '#ffd700');
        }
      } else if (obs.type === 'laser') {
        // Laser barrier check
        if (Math.abs(playerPos.z - obs.bounds.z) < 1.0 &&
            playerPos.x >= obs.bounds.xMin && playerPos.x <= obs.bounds.xMax &&
            playerPos.y <= obs.bounds.yMax && playerPos.y >= obs.bounds.yMin) {
          this.handleDamage(35, obs);
        }
      } else {
        // Drones / Mines
        const dx = playerPos.x - obs.mesh.position.x;
        const dy = playerPos.y - obs.mesh.position.y;
        const dz = playerPos.z - obs.mesh.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < (playerRadius + obs.radius) * (playerRadius + obs.radius)) {
          this.handleDamage(45, obs);
          this.combat.createExplosion(obs.mesh.position, 0xff0033);
          this.obstacles.removeObstacle(obs);
        }
      }
    }
  }

  handleDamage(amount, source) {
    if (this.activePowerups.shield.active) {
      this.sound.playShield();
      this.ui.showAlert('SHIELD DEFLECTED IMPACT!', '#00aaff');
      return;
    }

    this.shield -= amount;
    this.ui.showDamageFX();
    this.sound.playExplosion();

    // Reset multiplier on hit
    this.multiplier = 1.0;

    if (this.shield <= 0) {
      this.shield = 0;
      this.gameOver();
    }
  }

  activatePowerup(type) {
    this.activePowerups[type].active = true;
    this.activePowerups[type].timeLeft = 6.0;

    if (type === 'shield') {
      this.player.setShieldVisual(true);
      this.sound.playShield();
      this.ui.showAlert('PHASE SHIELD ACTIVE!', '#00aaff');
    } else if (type === 'boost') {
      this.sound.playBoost();
      this.ui.showAlert('QUANTUM OVERDRIVE!', '#ffd700');
    } else if (type === 'slowmo') {
      this.timeScale = 0.45;
      this.ui.setSlowMoFX(true);
      this.sound.playSlowMo();
      this.ui.showAlert('CHRONO SLOW-MO!', '#9d00ff');
    }
  }

  onEnemyDestroyed(type) {
    this.dronesDestroyed++;
    const bounty = type === 'drone' ? 500 : 250;
    this.score += bounty * this.multiplier;
    this.multiplier = Math.min(8.0, this.multiplier + 0.5);
    this.comboTimer = 4.0;
    this.creditsEarned += 15;
    this.ui.showAlert(`TARGET ELIMINATED! +${bounty}`, '#ff007f');
  }

  updateCamera(dt) {
    const pPos = this.player.position;

    if (this.cameraMode === 'chase') {
      const targetCamZ = pPos.z - 7.5;
      const targetCamY = pPos.y + 3.2;
      const targetCamX = pPos.x * 0.75;

      this.camera.position.x += (targetCamX - this.camera.position.x) * 10 * dt;
      this.camera.position.y += (targetCamY - this.camera.position.y) * 8 * dt;
      this.camera.position.z += (targetCamZ - this.camera.position.z) * 18 * dt;

      // Dynamic FOV on boost
      const targetFOV = this.isBoosting ? 82 : 65;
      this.camera.fov += (targetFOV - this.camera.fov) * 5 * dt;
      this.camera.updateProjectionMatrix();

      this.camera.lookAt(pPos.x * 0.4, pPos.y + 1.2, pPos.z + 18);
    } else if (this.cameraMode === 'cockpit') {
      this.camera.position.set(pPos.x, pPos.y + 0.35, pPos.z + 0.4);
      this.camera.lookAt(pPos.x, pPos.y + 0.4, pPos.z + 30);
      this.camera.fov = 75;
      this.camera.updateProjectionMatrix();
    } else if (this.cameraMode === 'topdown') {
      this.camera.position.set(pPos.x * 0.5, pPos.y + 18, pPos.z - 4);
      this.camera.lookAt(pPos.x * 0.5, pPos.y, pPos.z + 16);
    }
  }
}
