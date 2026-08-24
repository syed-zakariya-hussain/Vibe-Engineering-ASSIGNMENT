/**
 * ObstacleManager.js
 * Spawns and manages 3D Obstacles (Laser Barriers, Drones, Mines, Ramps) and Collectibles (Energy Cells, Power-ups)
 */

import * as THREE from 'three';

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.collectibles = [];
    this.drones = [];

    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.spawnDistanceAhead = 260; // Spawn 260m in front of player
    this.despawnDistanceBehind = 30; // Remove 30m behind player
    this.lastSpawnZ = 40;
    this.spawnInterval = 32; // Distance between obstacle clusters

    this.initGeometriesAndMaterials();
  }

  initGeometriesAndMaterials() {
    // 1. Laser Barrier Material & Geo
    this.laserMat = new THREE.MeshStandardMaterial({
      color: 0xff0055,
      emissive: 0xff0055,
      emissiveIntensity: 3.0
    });
    this.postMat = new THREE.MeshStandardMaterial({
      color: 0x222233,
      metalness: 0.8
    });

    // 2. Drone Materials
    this.droneBodyMat = new THREE.MeshStandardMaterial({
      color: 0x151622,
      metalness: 0.9,
      roughness: 0.2
    });
    this.droneGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff0033,
      emissiveIntensity: 3.5
    });

    // 3. EMP Mine Material
    this.mineMat = new THREE.MeshStandardMaterial({
      color: 0xff3300,
      emissive: 0xff3300,
      emissiveIntensity: 2.5,
      roughness: 0.3
    });

    // 4. Boost / Jump Ramp Material
    this.rampMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 2.0
    });

    // 5. Energy Credit / Coin Material
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.0,
      metalness: 0.8
    });

    // 6. Power-up Materials
    this.shieldPowerMat = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x00aaff,
      emissiveIntensity: 2.5
    });
    this.boostPowerMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 2.5
    });
    this.slowPowerMat = new THREE.MeshStandardMaterial({
      color: 0x9d00ff,
      emissive: 0x9d00ff,
      emissiveIntensity: 2.5
    });
  }

  update(dt, playerZ, magnetRadius = 0, playerPos = null) {
    // 1. Spawn new obstacles ahead of player
    while (this.lastSpawnZ < playerZ + this.spawnDistanceAhead) {
      this.lastSpawnZ += this.spawnInterval;
      this.spawnPattern(this.lastSpawnZ);
    }

    // 2. Update Drone AI and patrol animation
    for (let i = 0; i < this.drones.length; i++) {
      const drone = this.drones[i];
      drone.time += dt * 3;
      drone.mesh.position.x = drone.startX + Math.sin(drone.time) * drone.patrolRange;
      drone.mesh.position.y = 1.6 + Math.cos(drone.time * 1.5) * 0.4;
      drone.mesh.rotation.y += dt * 2;
    }

    // 3. Update spinning Collectibles and Magnet pull
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.mesh.rotation.y += dt * 3;
      item.mesh.rotation.x += dt * 2;

      // Magnet effect pulling towards player
      if (magnetRadius > 0 && playerPos) {
        const dx = playerPos.x - item.mesh.position.x;
        const dy = playerPos.y - item.mesh.position.y;
        const dz = playerPos.z - item.mesh.position.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < magnetRadius * magnetRadius && distSq > 0.1) {
          const dist = Math.sqrt(distSq);
          const pullSpeed = 35;
          item.mesh.position.x += (dx / dist) * pullSpeed * dt;
          item.mesh.position.y += (dy / dist) * pullSpeed * dt;
          item.mesh.position.z += (dz / dist) * pullSpeed * dt;
        }
      }

      // Despawn behind player
      if (item.mesh.position.z < playerZ - this.despawnDistanceBehind) {
        this.group.remove(item.mesh);
        this.collectibles.splice(i, 1);
      }
    }

    // 4. Despawn obstacles behind player
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.mesh.position.z < playerZ - this.despawnDistanceBehind) {
        this.group.remove(obs.mesh);
        this.obstacles.splice(i, 1);
      }
    }

    for (let i = this.drones.length - 1; i >= 0; i--) {
      const drone = this.drones[i];
      if (drone.mesh.position.z < playerZ - this.despawnDistanceBehind) {
        this.drones.splice(i, 1);
      }
    }
  }

  spawnPattern(zPos) {
    const rand = Math.random();

    // Pattern 1: Security Drone + Coins
    if (rand < 0.3) {
      this.spawnDrone((Math.random() - 0.5) * 16, zPos);
      this.spawnCoinArc((Math.random() - 0.5) * 12, zPos + 12);
    }
    // Pattern 2: Laser Gate with safe lane
    else if (rand < 0.6) {
      const openSide = Math.random() > 0.5 ? 1 : -1;
      this.spawnLaserGate(openSide * 6, zPos);
      this.spawnCoinLine(-openSide * 5, zPos - 10, 5);
    }
    // Pattern 3: EMP Minefield or Ramp
    else if (rand < 0.85) {
      if (Math.random() > 0.4) {
        this.spawnJumpRamp((Math.random() - 0.5) * 10, zPos);
        this.spawnHighCoinArc(zPos + 8);
      } else {
        this.spawnMineRow(zPos);
      }
    }
    // Pattern 4: Power-up capsule with laser challenge
    else {
      this.spawnPowerUp((Math.random() - 0.5) * 12, zPos);
      this.spawnDrone((Math.random() - 0.5) * 14, zPos + 14);
    }
  }

  spawnLaserGate(centerX, zPos) {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(centerX, 0, zPos);

    const width = 16;
    const postGeo = new THREE.CylinderGeometry(0.3, 0.4, 3.2, 8);
    const leftPost = new THREE.Mesh(postGeo, this.postMat);
    leftPost.position.set(-width / 2, 1.6, 0);
    gateGroup.add(leftPost);

    const rightPost = new THREE.Mesh(postGeo, this.postMat);
    rightPost.position.set(width / 2, 1.6, 0);
    gateGroup.add(rightPost);

    // Glowing Laser Beam
    const beamGeo = new THREE.BoxGeometry(width, 0.25, 0.25);
    const beam = new THREE.Mesh(beamGeo, this.laserMat);
    beam.position.set(0, 1.4, 0);
    gateGroup.add(beam);

    this.group.add(gateGroup);
    this.obstacles.push({
      type: 'laser',
      mesh: gateGroup,
      radius: 1.2,
      bounds: { xMin: centerX - width / 2, xMax: centerX + width / 2, yMin: 0.3, yMax: 2.2, z: zPos }
    });
  }

  spawnDrone(xPos, zPos) {
    const droneGroup = new THREE.Group();
    droneGroup.position.set(xPos, 1.6, zPos);

    // Drone Hull
    const hullGeo = new THREE.OctahedronGeometry(0.9);
    const hull = new THREE.Mesh(hullGeo, this.droneBodyMat);
    hull.scale.set(1.2, 0.6, 1.2);
    droneGroup.add(hull);

    // Glowing Red Eye
    const eyeGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const eye = new THREE.Mesh(eyeGeo, this.droneGlowMat);
    eye.position.set(0, 0, 0.6);
    droneGroup.add(eye);

    // Side Rotor Blades
    for (let s of [-1, 1]) {
      const rotorGeo = new THREE.RingGeometry(0.3, 0.45, 12);
      const rotor = new THREE.Mesh(rotorGeo, this.droneGlowMat);
      rotor.rotation.x = Math.PI / 2;
      rotor.position.set(s * 1.2, 0.2, 0);
      droneGroup.add(rotor);
    }

    this.group.add(droneGroup);

    const droneObj = {
      type: 'drone',
      mesh: droneGroup,
      startX: xPos,
      patrolRange: 4 + Math.random() * 3,
      time: Math.random() * 10,
      radius: 1.4,
      health: 1
    };

    this.obstacles.push(droneObj);
    this.drones.push(droneObj);
  }

  spawnMineRow(zPos) {
    const numMines = 3;
    const spacing = 7;
    const startX = -((numMines - 1) * spacing) / 2;

    for (let i = 0; i < numMines; i++) {
      const x = startX + i * spacing;
      const mineGeo = new THREE.DodecahedronGeometry(0.65);
      const mine = new THREE.Mesh(mineGeo, this.mineMat);
      mine.position.set(x, 0.8, zPos);

      this.group.add(mine);
      this.obstacles.push({
        type: 'mine',
        mesh: mine,
        radius: 0.9
      });
    }
  }

  spawnJumpRamp(xPos, zPos) {
    const rampGroup = new THREE.Group();
    rampGroup.position.set(xPos, 0, zPos);

    const rampGeo = new THREE.BoxGeometry(4.5, 0.2, 5.0);
    const ramp = new THREE.Mesh(rampGeo, this.rampMat);
    ramp.rotation.x = -0.28;
    ramp.position.set(0, 0.6, 0);
    rampGroup.add(ramp);

    this.group.add(rampGroup);
    this.obstacles.push({
      type: 'ramp',
      mesh: rampGroup,
      radius: 2.2,
      bounds: { xMin: xPos - 2.5, xMax: xPos + 2.5, zMin: zPos - 2.5, zMax: zPos + 2.5 }
    });
  }

  spawnCoinLine(xPos, zPos, count = 4) {
    const coinGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    for (let i = 0; i < count; i++) {
      const coin = new THREE.Mesh(coinGeo, this.coinMat);
      coin.position.set(xPos, 0.9, zPos + i * 4);
      this.group.add(coin);
      this.collectibles.push({
        type: 'coin',
        value: 10,
        mesh: coin,
        radius: 0.8
      });
    }
  }

  spawnCoinArc(xPos, zPos) {
    const coinGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const count = 5;
    for (let i = 0; i < count; i++) {
      const t = (i / (count - 1)) * 2 - 1;
      const x = xPos + t * 4;
      const coin = new THREE.Mesh(coinGeo, this.coinMat);
      coin.position.set(x, 0.9, zPos + i * 3.5);
      this.group.add(coin);
      this.collectibles.push({
        type: 'coin',
        value: 10,
        mesh: coin,
        radius: 0.8
      });
    }
  }

  spawnHighCoinArc(zPos) {
    const coinGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    const count = 5;
    for (let i = 0; i < count; i++) {
      const height = 3.5 + Math.sin((i / (count - 1)) * Math.PI) * 3.5;
      const coin = new THREE.Mesh(coinGeo, this.coinMat);
      coin.position.set(0, height, zPos + i * 4);
      this.group.add(coin);
      this.collectibles.push({
        type: 'coin',
        value: 25,
        mesh: coin,
        radius: 1.0
      });
    }
  }

  spawnPowerUp(xPos, zPos) {
    const powerTypes = ['shield', 'boost', 'slowmo'];
    const pType = powerTypes[Math.floor(Math.random() * powerTypes.length)];

    let mat = this.shieldPowerMat;
    if (pType === 'boost') mat = this.boostPowerMat;
    if (pType === 'slowmo') mat = this.slowPowerMat;

    const geo = new THREE.IcosahedronGeometry(0.85);
    const powerMesh = new THREE.Mesh(geo, mat);
    powerMesh.position.set(xPos, 1.4, zPos);

    this.group.add(powerMesh);
    this.collectibles.push({
      type: 'powerup',
      powerType: pType,
      mesh: powerMesh,
      radius: 1.2
    });
  }

  removeObstacle(obs) {
    const idx = this.obstacles.indexOf(obs);
    if (idx !== -1) {
      this.group.remove(obs.mesh);
      this.obstacles.splice(idx, 1);
    }
    const dIdx = this.drones.indexOf(obs);
    if (dIdx !== -1) {
      this.drones.splice(dIdx, 1);
    }
  }

  removeCollectible(item) {
    const idx = this.collectibles.indexOf(item);
    if (idx !== -1) {
      this.group.remove(item.mesh);
      this.collectibles.splice(idx, 1);
    }
  }

  reset() {
    for (let obs of this.obstacles) {
      this.group.remove(obs.mesh);
    }
    for (let item of this.collectibles) {
      this.group.remove(item.mesh);
    }
    this.obstacles = [];
    this.collectibles = [];
    this.drones = [];
    this.lastSpawnZ = 40;
  }
}
