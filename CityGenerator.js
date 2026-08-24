/**
 * CityGenerator.js
 * Infinite Procedural Cyberpunk Metropolis, Neon Grid Track, Holographic Billboards, and Laser Arches
 */

import * as THREE from 'three';

export class CityGenerator {
  constructor(scene) {
    this.scene = scene;
    this.segments = [];
    this.buildings = [];
    this.arches = [];
    this.billboards = [];

    this.segmentLength = 60;
    this.numSegments = 12; // Total view distance = 720m
    this.roadWidth = 32;

    this.trackGroup = new THREE.Group();
    this.cityGroup = new THREE.Group();
    this.propsGroup = new THREE.Group();

    this.scene.add(this.trackGroup);
    this.scene.add(this.cityGroup);
    this.scene.add(this.propsGroup);

    this.neonPalette = [0x00f0ff, 0xff007f, 0x9d00ff, 0xffd700, 0x00ffaa];

    this.initMaterials();
    this.initEnvironment();
    this.generateInitialWorld();
  }

  initMaterials() {
    // Road Surface Material
    this.roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x080914,
      metalness: 0.9,
      roughness: 0.15
    });

    // Road Grid / Markings Material
    this.gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });

    // Neon Curbs Material
    this.curbMaterial = new THREE.MeshStandardMaterial({
      color: 0xff007f,
      emissive: 0xff007f,
      emissiveIntensity: 2.5
    });

    // Building Base Material
    this.buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0c16,
      metalness: 0.8,
      roughness: 0.4
    });

    // Neon Windows / Trims Material
    this.windowMaterials = this.neonPalette.map(col => new THREE.MeshBasicMaterial({
      color: col,
      transparent: true,
      opacity: 0.8
    }));
  }

  initEnvironment() {
    // Atmospheric Cyber Fog
    this.scene.fog = new THREE.FogExp2(0x060714, 0.0035);

    // Ambient Cyber Glow
    const ambientLight = new THREE.AmbientLight(0x1a1c35, 1.5);
    this.scene.add(ambientLight);

    // Directional Sunlight / Cyber Moon
    const dirLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    dirLight.position.set(20, 60, 40);
    this.scene.add(dirLight);

    // Distant Starfield Dome
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1500;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 400 + Math.random() * 100;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 20;
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x9dc9ff,
      size: 1.8,
      transparent: true,
      opacity: 0.7
    });
    this.starfield = new THREE.Points(starGeo, starMat);
    this.scene.add(this.starfield);
  }

  generateInitialWorld() {
    for (let i = 0; i < this.numSegments; i++) {
      const zPos = i * this.segmentLength;
      this.createTrackSegment(zPos);
      this.createCityRow(zPos);
      if (i % 2 === 0) {
        this.createLaserArch(zPos + this.segmentLength * 0.5);
      }
    }
  }

  createTrackSegment(zPos) {
    const segGroup = new THREE.Group();
    segGroup.position.z = zPos;

    // 1. Asphalt Deck
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength);
    roadGeo.rotateX(-Math.PI / 2);
    const road = new THREE.Mesh(roadGeo, this.roadMaterial);
    road.position.y = 0;
    segGroup.add(road);

    // 2. Holographic Grid Layer
    const gridGeo = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength, 8, 12);
    gridGeo.rotateX(-Math.PI / 2);
    const grid = new THREE.Mesh(gridGeo, this.gridMaterial);
    grid.position.y = 0.02;
    segGroup.add(grid);

    // 3. Glowing Neon Curbs (Left & Right)
    const curbGeo = new THREE.BoxGeometry(0.6, 0.4, this.segmentLength);
    const leftCurb = new THREE.Mesh(curbGeo, this.curbMaterial);
    leftCurb.position.set(-this.roadWidth / 2, 0.2, 0);
    segGroup.add(leftCurb);

    const rightCurb = new THREE.Mesh(curbGeo, this.curbMaterial);
    rightCurb.position.set(this.roadWidth / 2, 0.2, 0);
    segGroup.add(rightCurb);

    // 4. Center Striping
    const centerGeo = new THREE.BoxGeometry(0.3, 0.05, 4);
    const centerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    for (let z = -this.segmentLength / 2 + 4; z < this.segmentLength / 2; z += 10) {
      const stripe = new THREE.Mesh(centerGeo, centerMat);
      stripe.position.set(0, 0.04, z);
      segGroup.add(stripe);
    }

    this.trackGroup.add(segGroup);
    this.segments.push(segGroup);
  }

  createCityRow(zPos) {
    const numBuildings = 6;
    for (let side of [-1, 1]) {
      for (let i = 0; i < numBuildings / 2; i++) {
        const width = 14 + Math.random() * 16;
        const height = 40 + Math.random() * 110;
        const depth = 14 + Math.random() * 16;

        const buildingGeo = new THREE.BoxGeometry(width, height, depth);
        const bMesh = new THREE.Mesh(buildingGeo, this.buildingMaterial);

        const xPos = side * (this.roadWidth / 2 + 12 + i * 18 + Math.random() * 6);
        const zBuilding = zPos + (Math.random() - 0.5) * this.segmentLength;
        bMesh.position.set(xPos, height / 2, zBuilding);

        // Add Neon Window Strips
        const winGeo = new THREE.BoxGeometry(width + 0.2, 0.6, depth + 0.2);
        const winMat = this.windowMaterials[Math.floor(Math.random() * this.windowMaterials.length)];
        const floors = Math.floor(height / 10);
        for (let f = 1; f < floors; f++) {
          const winMesh = new THREE.Mesh(winGeo, winMat);
          winMesh.position.set(0, (f * 10) - (height / 2), 0);
          bMesh.add(winMesh);
        }

        // Rooftop Neon Spire / Antenna
        if (Math.random() > 0.4) {
          const spireHeight = 10 + Math.random() * 20;
          const spireGeo = new THREE.CylinderGeometry(0.1, 0.4, spireHeight, 6);
          const spireMat = new THREE.MeshBasicMaterial({ color: 0xff007f });
          const spire = new THREE.Mesh(spireGeo, spireMat);
          spire.position.set(0, height / 2 + spireHeight / 2, 0);
          bMesh.add(spire);
        }

        this.cityGroup.add(bMesh);
        this.buildings.push(bMesh);
      }
    }
  }

  createLaserArch(zPos) {
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, zPos);

    const archColor = this.neonPalette[Math.floor(Math.random() * this.neonPalette.length)];
    const archMat = new THREE.MeshStandardMaterial({
      color: archColor,
      emissive: archColor,
      emissiveIntensity: 3.0
    });

    const pillarGeo = new THREE.BoxGeometry(0.8, 14, 0.8);
    const leftPillar = new THREE.Mesh(pillarGeo, archMat);
    leftPillar.position.set(-this.roadWidth / 2 + 0.5, 7, 0);
    archGroup.add(leftPillar);

    const rightPillar = new THREE.Mesh(pillarGeo, archMat);
    rightPillar.position.set(this.roadWidth / 2 - 0.5, 7, 0);
    archGroup.add(rightPillar);

    const beamGeo = new THREE.BoxGeometry(this.roadWidth, 0.8, 0.8);
    const topBeam = new THREE.Mesh(beamGeo, archMat);
    topBeam.position.set(0, 14, 0);
    archGroup.add(topBeam);

    // Glowing Laser Barrier across top
    const laserGeo = new THREE.PlaneGeometry(this.roadWidth - 2, 0.2);
    const laserMat = new THREE.MeshBasicMaterial({
      color: archColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const laser = new THREE.Mesh(laserGeo, laserMat);
    laser.position.set(0, 13.2, 0);
    archGroup.add(laser);

    this.propsGroup.add(archGroup);
    this.arches.push(archGroup);
  }

  update(playerZ) {
    // Keep starfield centered relative to player
    if (this.starfield) {
      this.starfield.position.z = playerZ;
    }

    // Recycle Track Segments that are behind the player
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i];
      if (seg.position.z < playerZ - this.segmentLength * 1.5) {
        // Find maximum Z of all segments
        let maxZ = 0;
        for (let j = 0; j < this.segments.length; j++) {
          if (this.segments[j].position.z > maxZ) {
            maxZ = this.segments[j].position.z;
          }
        }
        seg.position.z = maxZ + this.segmentLength;
      }
    }

    // Recycle Buildings
    for (let i = 0; i < this.buildings.length; i++) {
      const b = this.buildings[i];
      if (b.position.z < playerZ - this.segmentLength * 1.5) {
        let maxZ = playerZ;
        for (let j = 0; j < this.buildings.length; j++) {
          if (this.buildings[j].position.z > maxZ) {
            maxZ = this.buildings[j].position.z;
          }
        }
        b.position.z = maxZ + (Math.random() * 20 + 10);
      }
    }

    // Recycle Laser Arches
    for (let i = 0; i < this.arches.length; i++) {
      const arch = this.arches[i];
      if (arch.position.z < playerZ - this.segmentLength * 1.5) {
        let maxZ = playerZ;
        for (let j = 0; j < this.arches.length; j++) {
          if (this.arches[j].position.z > maxZ) {
            maxZ = this.arches[j].position.z;
          }
        }
        arch.position.z = maxZ + this.segmentLength * 2;
      }
    }
  }

  reset() {
    for (let i = 0; i < this.segments.length; i++) {
      this.segments[i].position.z = i * this.segmentLength;
    }
    for (let i = 0; i < this.buildings.length; i++) {
      this.buildings[i].position.z = Math.floor(i / 6) * this.segmentLength + (Math.random() - 0.5) * 20;
    }
    for (let i = 0; i < this.arches.length; i++) {
      this.arches[i].position.z = i * this.segmentLength * 2 + 30;
    }
  }
}
