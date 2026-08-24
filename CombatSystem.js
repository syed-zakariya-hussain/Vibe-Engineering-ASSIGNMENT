/**
 * CombatSystem.js
 * Dual Plasma Blasters, Projectile Physics, Target Collisions, and Particle Explosions
 */

import * as THREE from 'three';

export class CombatSystem {
  constructor(scene, soundManager) {
    this.scene = scene;
    this.soundManager = soundManager;

    this.lasers = [];
    this.explosions = [];

    this.laserGroup = new THREE.Group();
    this.particleGroup = new THREE.Group();
    this.scene.add(this.laserGroup);
    this.scene.add(this.particleGroup);

    this.fireCooldown = 0;
    this.baseFireRate = 0.18; // seconds between shots
    this.laserSpeed = 160; // m/s
    this.laserRange = 220; // max travel distance

    this.heat = 0; // weapon heat 0 to 100
    this.isOverheated = false;

    this.initMaterials();
  }

  initMaterials() {
    this.laserMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });

    this.laserGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.2, 8);
    this.laserGeo.rotateX(Math.PI / 2);
  }

  update(dt, playerPos, isFiring, obstacleManager, onTargetHit) {
    // 1. Weapon cooldown & heat management
    this.fireCooldown -= dt;
    if (this.isOverheated) {
      this.heat -= 35 * dt;
      if (this.heat <= 10) {
        this.isOverheated = false;
      }
    } else {
      this.heat = Math.max(0, this.heat - 25 * dt);
    }

    // 2. Firing triggers
    if (isFiring && this.fireCooldown <= 0 && !this.isOverheated) {
      this.fireLasers(playerPos);
      this.fireCooldown = this.baseFireRate;
      this.heat += 14;
      if (this.heat >= 100) {
        this.heat = 100;
        this.isOverheated = true;
      }
    }

    // 3. Update Laser Projectiles
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.mesh.position.z += this.laserSpeed * dt;
      laser.distanceTraveled += this.laserSpeed * dt;

      // Collision check against drones and obstacles
      let hit = false;
      const obstacles = obstacleManager.obstacles;

      for (let j = obstacles.length - 1; j >= 0; j--) {
        const obs = obstacles[j];
        if (obs.type === 'drone' || obs.type === 'mine') {
          const dx = laser.mesh.position.x - obs.mesh.position.x;
          const dy = laser.mesh.position.y - obs.mesh.position.y;
          const dz = laser.mesh.position.z - obs.mesh.position.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < obs.radius * obs.radius) {
            // Target Destroyed!
            hit = true;
            this.createExplosion(obs.mesh.position, obs.type === 'drone' ? 0xff0055 : 0xffaa00);
            this.soundManager.playExplosion();
            obstacleManager.removeObstacle(obs);
            if (onTargetHit) onTargetHit(obs.type);
            break;
          }
        }
      }

      // Remove laser if hit or traveled beyond range
      if (hit || laser.distanceTraveled > this.laserRange) {
        this.laserGroup.remove(laser.mesh);
        this.lasers.splice(i, 1);
      }
    }

    // 4. Update Particle Explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.life += dt;

      const positions = exp.points.geometry.attributes.position.array;
      for (let p = 0; p < exp.velocities.length; p++) {
        positions[p * 3] += exp.velocities[p].x * dt;
        positions[p * 3 + 1] += exp.velocities[p].y * dt;
        positions[p * 3 + 2] += exp.velocities[p].z * dt;
        // Gravity on debris
        exp.velocities[p].y -= 9.8 * dt;
      }
      exp.points.geometry.attributes.position.needsUpdate = true;
      exp.points.material.opacity = 1 - (exp.life / exp.maxLife);

      if (exp.life >= exp.maxLife) {
        this.particleGroup.remove(exp.points);
        exp.points.geometry.dispose();
        exp.points.material.dispose();
        this.explosions.splice(i, 1);
      }
    }
  }

  fireLasers(playerPos) {
    this.soundManager.playLaser();

    // Dual wing lasers
    const offsets = [-0.85, 0.85];
    offsets.forEach(xOffset => {
      const laserMesh = new THREE.Mesh(this.laserGeo, this.laserMat);
      laserMesh.position.set(playerPos.x + xOffset, playerPos.y + 0.1, playerPos.z + 1.2);
      this.laserGroup.add(laserMesh);

      this.lasers.push({
        mesh: laserMesh,
        distanceTraveled: 0
      });
    });
  }

  createExplosion(position, colorHex = 0xff007f) {
    const particleCount = 45;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = position.x;
      positions[i * 3 + 1] = position.y;
      positions[i * 3 + 2] = position.z;

      const speed = 10 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      velocities.push({
        x: speed * Math.sin(phi) * Math.cos(theta),
        y: speed * Math.cos(phi) + 4,
        z: speed * Math.sin(phi) * Math.sin(theta)
      });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: new THREE.Color(colorHex),
      size: 0.6,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geo, mat);
    this.particleGroup.add(points);

    this.explosions.push({
      points: points,
      velocities: velocities,
      life: 0,
      maxLife: 0.6
    });
  }

  triggerEMPNuke(playerZ, obstacleManager, onTargetHit) {
    const obstacles = [...obstacleManager.obstacles];
    for (let obs of obstacles) {
      if (obs.mesh.position.z > playerZ && obs.mesh.position.z < playerZ + 200) {
        this.createExplosion(obs.mesh.position, 0x00f0ff);
        obstacleManager.removeObstacle(obs);
        if (onTargetHit) onTargetHit(obs.type);
      }
    }
    this.soundManager.playExplosion();
  }

  reset() {
    for (let l of this.lasers) {
      this.laserGroup.remove(l.mesh);
    }
    for (let exp of this.explosions) {
      this.particleGroup.remove(exp.points);
    }
    this.lasers = [];
    this.explosions = [];
    this.heat = 0;
    this.isOverheated = false;
  }
}
