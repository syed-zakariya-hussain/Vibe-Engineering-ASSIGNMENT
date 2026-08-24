/**
 * main.js
 * Application Entry Point, Input Listeners, and Game Event Coordination
 */

import { SoundManager } from './audio/SoundManager.js';
import { GarageSystem } from './game/GarageSystem.js';
import { UIManager } from './ui/UIManager.js';
import { GameEngine } from './game/GameEngine.js';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Core Systems
  const soundManager = new SoundManager();
  const garageSystem = new GarageSystem();
  const uiManager = new UIManager(garageSystem, soundManager);
  const gameEngine = new GameEngine(garageSystem, soundManager, uiManager);

  // 2. Setup Keyboard Controls
  window.addEventListener('keydown', (e) => {
    soundManager.ensureAudio();

    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      gameEngine.inputState.left = true;
    }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      gameEngine.inputState.right = true;
    }
    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      gameEngine.inputState.up = true;
    }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      gameEngine.inputState.down = true;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      gameEngine.inputState.fire = true;
    }
    if (e.code === 'KeyC') {
      gameEngine.switchCamera();
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      gameEngine.togglePause();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
      gameEngine.inputState.left = false;
    }
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
      gameEngine.inputState.right = false;
    }
    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
      gameEngine.inputState.up = false;
    }
    if (e.code === 'KeyS' || e.code === 'ArrowDown') {
      gameEngine.inputState.down = false;
    }
    if (e.code === 'Space') {
      gameEngine.inputState.fire = false;
    }
  });

  // 3. Mouse Laser Firing
  window.addEventListener('mousedown', (e) => {
    // Only fire if clicking on canvas or HUD area, not on modal buttons
    if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
      soundManager.ensureAudio();
      gameEngine.inputState.fire = true;
    }
  });

  window.addEventListener('mouseup', () => {
    gameEngine.inputState.fire = false;
  });

  // 4. Mobile / Virtual Touch Controls
  const btnTouchLeft = document.getElementById('btn-touch-left');
  const btnTouchRight = document.getElementById('btn-touch-right');
  const btnTouchFire = document.getElementById('btn-touch-fire');
  const btnTouchBoost = document.getElementById('btn-touch-boost');
  const btnTouchBrake = document.getElementById('btn-touch-brake');

  const addTouchEvents = (btn, onPress, onRelease) => {
    if (!btn) return;
    const startHandler = (e) => {
      e.preventDefault();
      soundManager.ensureAudio();
      onPress();
    };
    const endHandler = (e) => {
      e.preventDefault();
      onRelease();
    };
    btn.addEventListener('touchstart', startHandler, { passive: false });
    btn.addEventListener('touchend', endHandler, { passive: false });
    btn.addEventListener('mousedown', startHandler);
    btn.addEventListener('mouseup', endHandler);
    btn.addEventListener('mouseleave', endHandler);
  };

  addTouchEvents(btnTouchLeft, () => { gameEngine.inputState.left = true; }, () => { gameEngine.inputState.left = false; });
  addTouchEvents(btnTouchRight, () => { gameEngine.inputState.right = true; }, () => { gameEngine.inputState.right = false; });
  addTouchEvents(btnTouchFire, () => { gameEngine.inputState.fire = true; }, () => { gameEngine.inputState.fire = false; });
  addTouchEvents(btnTouchBoost, () => { gameEngine.inputState.up = true; }, () => { gameEngine.inputState.up = false; });
  addTouchEvents(btnTouchBrake, () => { gameEngine.inputState.down = true; }, () => { gameEngine.inputState.down = false; });

  // 5. Game Launch & Menu Navigation Event Listeners
  const btnLaunch = document.getElementById('btn-launch');
  btnLaunch.addEventListener('click', () => {
    soundManager.ensureAudio();
    const selectedMode = document.querySelector('input[name="game-mode"]:checked')?.value || 'endless';
    gameEngine.startRun(selectedMode);
  });

  // Mode radio buttons visual styling
  document.querySelectorAll('.mode-btn').forEach(label => {
    label.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(l => l.classList.remove('active'));
      label.classList.add('active');
    });
  });

  // Camera switch HUD button
  document.getElementById('btn-cam-switch').addEventListener('click', () => {
    gameEngine.switchCamera();
  });

  // Pause HUD button
  document.getElementById('btn-pause').addEventListener('click', () => {
    gameEngine.togglePause();
  });

  // Pause Menu buttons
  document.getElementById('btn-resume').addEventListener('click', () => {
    gameEngine.togglePause();
  });

  document.getElementById('btn-restart-pause').addEventListener('click', () => {
    uiManager.hidePauseScreen();
    gameEngine.startRun(gameEngine.gameMode);
  });

  document.getElementById('btn-quit-pause').addEventListener('click', () => {
    uiManager.hidePauseScreen();
    gameEngine.gameState = 'MENU';
    soundManager.stopEngine();
    soundManager.stopMusic();
    uiManager.showStartScreen();
  });

  // Game Over buttons
  document.getElementById('btn-retry').addEventListener('click', () => {
    gameEngine.startRun(gameEngine.gameMode);
  });

  document.getElementById('btn-go-hangar').addEventListener('click', () => {
    gameEngine.gameState = 'MENU';
    uiManager.showStartScreen();
    uiManager.openGarage();
  });

  document.getElementById('btn-go-menu').addEventListener('click', () => {
    gameEngine.gameState = 'MENU';
    uiManager.showStartScreen();
  });
});
