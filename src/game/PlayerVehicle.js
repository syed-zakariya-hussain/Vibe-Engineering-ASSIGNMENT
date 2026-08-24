/**
 * PlayerVehicle.js
 * 3D Procedural Hovercraft Geometries, Physics, Banking, Engine Thrusters, and Visual FX
 */

import * as THREE from 'three';

export class PlayerVehicle {
  constructor(scene) {
    this.scene = scene;
    this.mesh = new THREE.Group();
    this.scene.add(this.mesh);

    // Physics & Movement state
    this.position = this.mesh.position;
    this.targetX = 0;
    this.speedX = 0;
    this.laneWidth = 14; // total road width limit (-14 to +14)
    this.laneX = 0;
    
    this.baseY = 0.8;
    this.jumpY = 0;
    this.jumpVelocity = 0;
    this.isJumping = false;

    this.currentRoll = 0;
    this.currentPitch = 0;
    this.hoverTime = 0;

    // Vehicle custom stats
    this.currentShipId = 'phantom';
    this.currentColor = '#00f0ff';
    this.currentTrail = 'plasma';

    // Particle Thruster System
    this.thrusterParticles = [];
    this.thrusterGroup = new THREE.Group();
    this.scene.add(this.thrusterGroup);

    // Shield mesh
    this.shieldMesh = null;
    this.shieldActive = false;

    // Build initial ship
    this.buildShip(this.currentShipId, this.currentColor);
    this.createShield();
    this.initThrusterParticles();
  }

  buildShip(shipId = 'phantom', colorHex = '#00f0ff') {
    this.currentShipId = shipId;
    this.currentColor = colorHex;

    // Remove existing ship geometry children
    while (this.mesh.children.length > 0) {
      const obj = this.mesh.children[0];
      this.mesh.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }

    const mainColor = new THREE.Color(colorHex);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x11131c,
      metalness: 0.85,
      roughness: 0.2,
      envMapIntensity: 1.0
    });

    const neonMat = new THREE.MeshStandardMaterial({
      color: mainColor,
      emissive: mainColor,
      emissiveIntensity: 2.2,
      roughness: 0.1
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x050711,
      metalness: 0.95,
      roughness: 0.05,
      transparent: true,
      opacity: 0.85
    });

    // SHIP MODEL 1: APEX PHANTOM (Delta Interceptor)
    if (shipId === 'phantom') {
      // Main Body
      const bodyGeo = new THREE.ConeGeometry(0.9, 3.2, 5);
      bodyGeo.rotateX(Math.PI / 2);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.scale.set(1.4, 0.5, 1.2);
      this.mesh.add(body);

      // Cockpit Canopy
      const cockpitGeo = new THREE.SphereGeometry(0.45, 16, 16);
      const cockpit = new THREE.Mesh(cockpitGeo, glassMat);
      cockpit.scale.set(0.8, 0.5, 1.8);
      cockpit.position.set(0, 0.22, 0.2);
      this.mesh.add(cockpit);

      // Left & Right Delta Wings
      const wingGeo = new THREE.BoxGeometry(2.4, 0.08, 1.4);
      const leftWing = new THREE.Mesh(wingGeo, bodyMat);
      leftWing.position.set(-1.1, 0, -0.4);
      leftWing.rotation.y = 0.25;
      this.mesh.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, bodyMat);
      rightWing.position.set(1.1, 0, -0.4);
      rightWing.rotation.y = -0.25;
      this.mesh.add(rightWing);

      // Neon Wingtips & Hull Trims
      const trimGeo = new THREE.BoxGeometry(0.12, 0.12, 1.6);
      const leftTrim = new THREE.Mesh(trimGeo, neonMat);
      leftTrim.position.set(-2.2, 0.06, -0.4);
      this.mesh.add(leftTrim);

      const rightTrim = new THREE.Mesh(trimGeo, neonMat);
      rightTrim.position.set(2.2, 0.06, -0.4);
      this.mesh.add(rightTrim);

      // Thruster Nozzles
      const thrusterGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.6, 12);
      thrusterGeo.rotateX(Math.PI / 2);
      const leftThruster = new THREE.Mesh(thrusterGeo, neonMat);
      leftThruster.position.set(-0.55, 0, -1.6);
      this.mesh.add(leftThruster);

      const rightThruster = new THREE.Mesh(thrusterGeo, neonMat);
      rightThruster.position.set(0.55, 0, -1.6);
      this.mesh.add(rightThruster);
    }
    // SHIP MODEL 2: VIPER STRIKE (Forward-Swept Stealth)
    else if (shipId === 'viper') {
      const bodyGeo = new THREE.BoxGeometry(1.0, 0.4, 3.4);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      this.mesh.add(body);

      const noseGeo = new THREE.ConeGeometry(0.5, 1.2, 4);
      noseGeo.rotateX(Math.PI / 2);
      const nose = new THREE.Mesh(noseGeo, bodyMat);
      nose.position.set(0, 0, 2.0);
      this.mesh.add(nose);

      // Forward swept wings
      const wingGeo = new THREE.BoxGeometry(1.6, 0.06, 0.8);
      const leftWing = new THREE.Mesh(wingGeo, bodyMat);
      leftWing.position.set(-1.4, 0.1, 0.4);
      leftWing.rotation.y = -0.45;
      leftWing.rotation.z = -0.15;
      this.mesh.add(leftWing);

      const rightWing = new THREE.Mesh(wingGeo, bodyMat);
      rightWing.position.set(1.4, 0.1, 0.4);
      rightWing.rotation.y = 0.45;
      rightWing.rotation.z = 0.15;
      this.mesh.add(rightWing);

      // Quad Neon fins
      const finGeo = new THREE.BoxGeometry(0.08, 0.6, 1.2);
      const leftFin = new THREE.Mesh(finGeo, neonMat);
      leftFin.position.set(-0.8, 0.4, -1.0);
      leftFin.rotation.z = -0.3;
      this.mesh.add(leftFin);

      const rightFin = new THREE.Mesh(finGeo, neonMat);
      rightFin.position.set(0.8, 0.4, -1.0);
      rightFin.rotation.z = 0.3;
      this.mesh.add(rightFin);

      // Central Plasma Jet
      const jetGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.7, 16);
      jetGeo.rotateX(Math.PI / 2);
      const mainJet = new THREE.Mesh(jetGeo, neonMat);
      mainJet.position.set(0, 0, -1.7);
      this.mesh.add(mainJet);
    }
    // SHIP MODEL 3: VORTEX CRUISER (Dual Ring Turbine)
    else if (shipId === 'vortex') {
      const bodyGeo = new THREE.CylinderGeometry(0.6, 0.7, 3.0, 12);
      bodyGeo.rotateX(Math.PI / 2);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      this.mesh.add(body);

      // Dual Armored Turbine Rings
      const ringGeo = new THREE.TorusGeometry(0.7, 0.12, 12, 24);
      const leftRing = new THREE.Mesh(ringGeo, neonMat);
      leftRing.position.set(-1.4, 0, -0.4);
      this.mesh.add(leftRing);

      const rightRing = new THREE.Mesh(ringGeo, neonMat);
      rightRing.position.set(1.4, 0, -0.4);
      this.mesh.add(rightRing);

      // Heavy Spoiler
      const spoilerGeo = new THREE.BoxGeometry(3.0, 0.1, 0.5);
      const spoiler = new THREE.Mesh(spoilerGeo, neonMat);
      spoiler.position.set(0, 0.6, -1.4);
      this.mesh.add(spoiler);
    }
    // SHIP MODEL 4: CYBER DREADNOUGHT (Titan Warship)
    else {
      const bodyGeo = new THREE.BoxGeometry(1.6, 0.6, 3.6);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      this.mesh.add(body);

      const sideArmorGeo = new THREE.BoxGeometry(0.5, 0.7, 2.8);
      const leftArmor = new THREE.Mesh(sideArmorGeo, bodyMat);
      leftArmor.position.set(-1.1, 0.1, 0);
      this.mesh.add(leftArmor);

      const rightArmor = new THREE.Mesh(sideArmorGeo, bodyMat);
      rightArmor.position.set(1.1, 0.1, 0);
      this.mesh.add(rightArmor);

      // Glowing Neon Energy Ribs
      for (let i = -1; i <= 1; i += 0.8) {
        const ribGeo = new THREE.BoxGeometry(2.4, 0.08, 0.15);
        const rib = new THREE.Mesh(ribGeo, neonMat);
        rib.position.set(0, 0.35, i);
        this.mesh.add(rib);
      }

      // Triple Engine Cluster
      for (let x = -0.6; x <= 0.6; x += 0.6) {
        const jetGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.5, 12);
        jetGeo.rotateX(Math.PI / 2);
        const jet = new THREE.Mesh(jetGeo, neonMat);
        jet.position.set(x, 0, -1.8);
        this.mesh.add(jet);
      }
    }

    // Headlight Spotlights
    const headLight = new THREE.SpotLight(0x00f0ff, 5, 45, Math.PI / 6, 0.5, 1.5);
    headLight.position.set(0, 0.2, 1.5);
    headLight.target.position.set(0, 0, 30);
    this.mesh.add(headLight);
    this.mesh.add(headLight.target);
  }

  createShield() {
    const shieldGeo = new THREE.SphereGeometry(2.2, 24, 24);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.0,
      wireframe: true
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.mesh.add(this.shieldMesh);
  }

  setShieldVisual(active) {
    this.shieldActive = active;
    if (this.shieldMesh) {
      this.shieldMesh.material.opacity = active ? 0.35 : 0.0;
    }
  }

  initThrusterParticles() {
    const particleCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = -9999;
      scales[i] = 1.0;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('scale', new THREE.BufferAttribute(scales, 1));

    const pMat = new THREE.PointsMaterial({
      color: new THREE.Color(this.currentColor),
      size: 0.45,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    this.particleSystem = new THREE.Points(pGeo, pMat);
    this.thrusterGroup.add(this.particleSystem);

    this.particleData = [];
    for (let i = 0; i < particleCount; i++) {
      this.particleData.push({
        x: 0, y: 0, z: 0,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.2,
        vz: -(Math.random() * 0.8 + 0.8),
        life: 0,
        maxLife: Math.random() * 0.3 + 0.2
      });
    }
  }

  update(dt, input, isBoosting, speed) {
    this.hoverTime += dt * 4;

    // 1. Steering & Lateral Movement
    const steerSpeed = 26;
    if (input.left) {
      this.speedX = -steerSpeed;
    } else if (input.right) {
      this.speedX = steerSpeed;
    } else {
      this.speedX *= 0.82; // Inertia dampening
    }

    this.laneX += this.speedX * dt;
    this.laneX = Math.max(-this.laneWidth, Math.min(this.laneWidth, this.laneX));
    this.position.x = this.laneX;

    // 2. Hover Oscillation & Jump Physics
    const hoverOsc = Math.sin(this.hoverTime) * 0.08;
    if (this.isJumping) {
      this.jumpVelocity -= 40 * dt;
      this.jumpY += this.jumpVelocity * dt;
      if (this.jumpY <= 0) {
        this.jumpY = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
      }
    }
    this.position.y = this.baseY + hoverOsc + this.jumpY;

    // 3. Banking & Tilting Physics
    const targetRoll = (-this.speedX / steerSpeed) * 0.45;
    this.currentRoll += (targetRoll - this.currentRoll) * 12 * dt;
    this.mesh.rotation.z = this.currentRoll;

    const targetPitch = isBoosting ? -0.1 : (input.down ? 0.12 : 0);
    this.currentPitch += (targetPitch - this.currentPitch) * 8 * dt;
    this.mesh.rotation.x = this.currentPitch;

    // 4. Update Thruster Particles
    this.updateParticles(dt, isBoosting, speed);

    // 5. Shield visual pulsing
    if (this.shieldActive && this.shieldMesh) {
      this.shieldMesh.rotation.y += dt * 2;
      this.shieldMesh.rotation.x += dt * 1.5;
    }
  }

  triggerJump(strength = 14) {
    if (!this.isJumping) {
      this.isJumping = true;
      this.jumpVelocity = strength;
    }
  }

  updateParticles(dt, isBoosting, speed) {
    if (!this.particleSystem) return;
    const positions = this.particleSystem.geometry.attributes.position.array;
    const spawnZ = this.position.z - 1.6;

    for (let i = 0; i < this.particleData.length; i++) {
      const p = this.particleData[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        // Respawn behind ship thrusters
        p.life = 0;
        const sideOffset = (Math.random() > 0.5 ? 0.45 : -0.45);
        p.x = this.position.x + sideOffset + (Math.random() - 0.5) * 0.2;
        p.y = this.position.y + (Math.random() - 0.5) * 0.2;
        p.z = spawnZ;
        p.vz = -(Math.random() * 20 + 25) * (isBoosting ? 1.8 : 1.0);
      } else {
        p.x += p.vx * dt * 20;
        p.y += p.vy * dt * 20;
        p.z += p.vz * dt;
      }

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
  }

  reset() {
    this.laneX = 0;
    this.position.x = 0;
    this.position.y = this.baseY;
    this.speedX = 0;
    this.jumpY = 0;
    this.isJumping = false;
    this.mesh.rotation.set(0, 0, 0);
  }
}
