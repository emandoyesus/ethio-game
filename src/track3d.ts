import * as THREE from 'three';
import {
  createMinibus3D,
  createLada3D,
  createBajaj3D,
  createIsuzu3D,
  createPolice3D,
  createEV3D,
  createElectricBus3D,
  createZebuCow3D,
  createGoat3D,
  createPothole3D,
  createBirrCoin3D,
  createBunnaJebena3D,
  createFuelCan3D,
  createPassenger3D,
  createCyclist3D,
  createPoliceCone3D,
  createAcaciaTree3D,
  createEucalyptusTree3D,
  createPalmTree3D,
  createStreetLamp3D,
  createBillboard3D,
  createBuilding3D,
  createTaxiSign3D,
  createCheckpointGate3D,
  createCBETower3D,
  createLightRailViaduct3D,
  createTrafficLightGantry3D,
  createLaneArrowMesh3D,
  materials,
  type Vehicle3DModel
} from './models3d';
import { ROAD, type RoadManager } from './road';
import { addStreetShops, districtSign } from './streetscape';
import { clearHumanAnimations, createRealHuman3D, preloadHumanCharacters, updateHumanAnimations } from './characters3d';
import type { RouteStage, SpriteInstance } from './types';

export class Track3D {
  public group: THREE.Group;
  public roadGroup: THREE.Group;
  public entitiesGroup: THREE.Group;
  public sceneryGroup: THREE.Group;

  public roadMesh: THREE.Mesh | null = null;
  public shoulderMesh: THREE.Mesh | null = null;
  public markingsMesh: THREE.Mesh | null = null;

  public spinePoints: THREE.Vector3[] = [];
  public spineNormals: THREE.Vector3[] = [];
  public spineTangents: THREE.Vector3[] = [];

  private lrtTrains: { mesh: THREE.Object3D; dir: number; offset: number }[] = [];
  private lrtProgress: number = 0;
  private bikeCyclists: { mesh: THREE.Object3D; trackZ: number; side: number; speed: number; wheels: THREE.Object3D[] }[] = [];
  private sidewalkWalkers: { mesh: THREE.Object3D; trackZ: number; side: number; dir: number; speed: number; lat: number }[] = [];
  private policeLights: { red: THREE.PointLight; blue: THREE.PointLight }[] = [];

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.roadGroup = new THREE.Group();
    this.entitiesGroup = new THREE.Group();
    this.sceneryGroup = new THREE.Group();

    this.group.add(this.roadGroup);
    this.group.add(this.entitiesGroup);
    this.group.add(this.sceneryGroup);

    scene.add(this.group);
  }

  public build(road: RoadManager, stage: RouteStage) {
    // 1. Dispose old entities and scenery
    this.clearGroup(this.roadGroup);
    this.clearGroup(this.entitiesGroup);
    this.clearGroup(this.sceneryGroup);
    clearHumanAnimations();
    preloadHumanCharacters();
    this.policeLights = [];
    this.lrtTrains = [];
    this.bikeCyclists = [];
    this.sidewalkWalkers = [];

    this.spinePoints = [];
    this.spineNormals = [];
    this.spineTangents = [];

    const segments = road.segments;
    const total = segments.length;
    if (total === 0) return;

    // 2. Calculate continuous smooth 3D Track Spine
    let curX = 0;
    let dx = 0;
    const segLength3D = 6.0; // 6 meters per segment in 3D world space
    const elevationScale = 0.005; // Realistic smooth highway grade (~4-6%)

    for (let i = 0; i < total; i++) {
      const seg = segments[i];
      curX += dx * 0.08;
      dx += seg.curve;
      const y = seg.p1.y * elevationScale;
      const z = i * segLength3D;
      this.spinePoints.push(new THREE.Vector3(curX, y, z));
    }

    // Compute tangents and normals
    const count = this.spinePoints.length;
    for (let i = 0; i < count; i++) {
      const p = this.spinePoints[i];
      const nextP = this.spinePoints[(i + 1) % count];
      const tangent = new THREE.Vector3().subVectors(nextP, p).normalize();
      if (tangent.lengthSq() === 0) tangent.set(0, 0, 1);
      this.spineTangents.push(tangent);

      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      this.spineNormals.push(normal);
    }

    // 3. Build Road Geometry Ribbon
    this.buildRoadRibbon(segments, stage);

    // 4. Build Landmarks (CBE 209m Tower, Light Rail Viaduct & Multi-Row City Blocks)
    this.buildLandmarks(stage, road);
    this.buildCityBlocks(stage, road);

    // 5. Build Intersection Crossroads
    this.buildIntersectionCrossroads(road);

    // 6. Instantiate 3D Meshes for all track sprites
    this.buildTrackEntities(road);

    // 7. Build Cross-Traffic Vehicles
    this.buildCrossTraffic(road);
  }

  private clearGroup(g: THREE.Group) {
    while (g.children.length > 0) {
      const child = g.children[0];
      g.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    }
  }

  public getPointAtZ(trackZ: number): { pos: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3 } {
    const totalSegments = this.spinePoints.length;
    if (totalSegments === 0) {
      return { pos: new THREE.Vector3(), tangent: new THREE.Vector3(0, 0, 1), normal: new THREE.Vector3(1, 0, 0) };
    }

    const segLength3D = 6.0;
    const progressZ = (trackZ / ROAD.SEGMENT_LENGTH) * segLength3D;
    let segIdx = Math.floor(progressZ / segLength3D) % totalSegments;
    if (segIdx < 0) segIdx += totalSegments;
    const nextIdx = (segIdx + 1) % totalSegments;

    const p0 = this.spinePoints[segIdx];
    const p1 = this.spinePoints[nextIdx];
    let fractZ = progressZ % segLength3D;
    if (fractZ < 0) fractZ += segLength3D;
    const t = Math.max(0, Math.min(1, fractZ / segLength3D));

    const pos = new THREE.Vector3().lerpVectors(p0, p1, t);
    const t0 = this.spineTangents[segIdx] || new THREE.Vector3(0, 0, 1);
    const t1 = this.spineTangents[nextIdx] || t0;
    const tangent = new THREE.Vector3().lerpVectors(t0, t1, t).normalize();

    const n0 = this.spineNormals[segIdx] || new THREE.Vector3(1, 0, 0);
    const n1 = this.spineNormals[nextIdx] || n0;
    const normal = new THREE.Vector3().lerpVectors(n0, n1, t).normalize();

    return { pos, tangent, normal };
  }

  private buildRoadRibbon(segments: any[], stage: RouteStage) {
    const count = this.spinePoints.length;
    const roadHalfWidth = 9.0; // 18m wide (3 lanes)
    const shoulderWidth = 4.5; // Red clay shoulders

    const roadVerts: number[] = [];
    const roadIndices: number[] = [];
    const roadUVs: number[] = [];

    const shoulderVerts: number[] = [];
    const shoulderUVs: number[] = [];
    const shoulderIndices: number[] = [];

    const grassVerts: number[] = [];
    const grassUVs: number[] = [];
    const grassIndices: number[] = [];

    const markVerts: number[] = [];
    const markIndices: number[] = [];

    for (let i = 0; i < count; i++) {
      const p = this.spinePoints[i];
      const normal = this.spineNormals[i];
      const tangent = this.spineTangents[i];

      // Road Vertices (2 vertices per cross-section)
      const leftRoad = p.clone().addScaledVector(normal, -roadHalfWidth);
      const rightRoad = p.clone().addScaledVector(normal, roadHalfWidth);

      // Lift road slightly above ground to prevent z-fighting
      leftRoad.y += 0.08;
      rightRoad.y += 0.08;

      roadVerts.push(leftRoad.x, leftRoad.y, leftRoad.z);
      roadVerts.push(rightRoad.x, rightRoad.y, rightRoad.z);

      roadUVs.push(0, i * 0.2);
      roadUVs.push(1, i * 0.2);

      // Volcanic Red Shoulder Vertices (4 vertices per cross-section)
      const leftShoulderOut = p.clone().addScaledVector(normal, -(roadHalfWidth + shoulderWidth));
      const rightShoulderOut = p.clone().addScaledVector(normal, roadHalfWidth + shoulderWidth);

      leftShoulderOut.y += 0.02;
      rightShoulderOut.y += 0.02;

      shoulderVerts.push(leftShoulderOut.x, leftShoulderOut.y, leftShoulderOut.z);
      shoulderVerts.push(leftRoad.x, leftRoad.y - 0.01, leftRoad.z);
      shoulderVerts.push(rightRoad.x, rightRoad.y - 0.01, rightRoad.z);
      shoulderVerts.push(rightShoulderOut.x, rightShoulderOut.y, rightShoulderOut.z);
      shoulderUVs.push(0, i * 0.5, 1, i * 0.5, 1, i * 0.5, 0, i * 0.5);

      // Elevation-matched roadside grass apron extending 130m outward on both sides
      const grassWidth = 130;
      const leftGrassOut = p.clone().addScaledVector(normal, -(roadHalfWidth + shoulderWidth + grassWidth));
      const rightGrassOut = p.clone().addScaledVector(normal, roadHalfWidth + shoulderWidth + grassWidth);
      leftGrassOut.y -= 0.04;
      rightGrassOut.y -= 0.04;

      grassVerts.push(leftGrassOut.x, leftGrassOut.y, leftGrassOut.z);
      grassVerts.push(leftShoulderOut.x, leftShoulderOut.y - 0.02, leftShoulderOut.z);
      grassVerts.push(rightShoulderOut.x, rightShoulderOut.y - 0.02, rightShoulderOut.z);
      grassVerts.push(rightGrassOut.x, rightGrassOut.y, rightGrassOut.z);
      grassUVs.push(0, i * 0.25, 4, i * 0.25, 0, i * 0.25, 4, i * 0.25);

      if (i < count - 1) {
        // Counter-Clockwise Road Quad facing UPWARDS: (r0, r2, r1) and (r1, r2, r3)
        const r0 = i * 2;
        const r1 = i * 2 + 1;
        const r2 = (i + 1) * 2;
        const r3 = (i + 1) * 2 + 1;

        roadIndices.push(r0, r2, r1);
        roadIndices.push(r1, r2, r3);

        // Left Shoulder Quad
        const sl0 = i * 4;
        const sl1 = i * 4 + 1;
        const sl2 = (i + 1) * 4;
        const sl3 = (i + 1) * 4 + 1;
        shoulderIndices.push(sl0, sl2, sl1);
        shoulderIndices.push(sl1, sl2, sl3);

        // Right Shoulder Quad
        const sr0 = i * 4 + 2;
        const sr1 = i * 4 + 3;
        const sr2 = (i + 1) * 4 + 2;
        const sr3 = (i + 1) * 4 + 3;
        shoulderIndices.push(sr0, sr2, sr1);
        shoulderIndices.push(sr1, sr2, sr3);

        // Left & Right Grass Apron Quads
        grassIndices.push(sl0, sl2, sl1, sl1, sl2, sl3);
        grassIndices.push(sr0, sr2, sr1, sr1, sr2, sr3);
      }

      // Markings (Dashed highway lines, Stop Lines & Zebra crossings)
      const seg = segments[i];
      if (seg && seg.hasStopLine) {
        // Solid White Stop Line Bar across entire road
        const barL = p.clone().addScaledVector(normal, -roadHalfWidth * 0.96);
        const barR = p.clone().addScaledVector(normal, roadHalfWidth * 0.96);
        const barNextL = barL.clone().addScaledVector(tangent, 1.4);
        const barNextR = barR.clone().addScaledVector(tangent, 1.4);

        const idx = markVerts.length / 3;
        markVerts.push(barL.x, barL.y + 0.12, barL.z);
        markVerts.push(barR.x, barR.y + 0.12, barR.z);
        markVerts.push(barNextL.x, barNextL.y + 0.12, barNextL.z);
        markVerts.push(barNextR.x, barNextR.y + 0.12, barNextR.z);

        markIndices.push(idx, idx + 2, idx + 1);
        markIndices.push(idx + 1, idx + 2, idx + 3);
      } else if (seg && seg.hasZebraCrossing) {
        // Pedestrian Zebra Crosswalk bars
        const numBars = 10;
        for (let b = 0; b < numBars; b++) {
          const frac = -0.8 + (1.6 / (numBars - 1)) * b;
          const barCenter = p.clone().addScaledVector(normal, roadHalfWidth * frac);
          const barL = barCenter.clone().addScaledVector(normal, -0.38);
          const barR = barCenter.clone().addScaledVector(normal, 0.38);
          const barNextL = barL.clone().addScaledVector(tangent, 3.2);
          const barNextR = barR.clone().addScaledVector(tangent, 3.2);

          const idx = markVerts.length / 3;
          markVerts.push(barL.x, barL.y + 0.11, barL.z);
          markVerts.push(barR.x, barR.y + 0.11, barR.z);
          markVerts.push(barNextL.x, barNextL.y + 0.11, barNextL.z);
          markVerts.push(barNextR.x, barNextR.y + 0.11, barNextR.z);

          markIndices.push(idx, idx + 2, idx + 1);
          markIndices.push(idx + 1, idx + 2, idx + 3);
        }
      } else if (i % 2 === 0 && i < count - 1) {
        // Dashed Lane Stripes (3 Lanes)
        [-0.33, 0.33].forEach(laneFrac => {
          const stripeCenter = p.clone().addScaledVector(normal, roadHalfWidth * laneFrac);
          const sL = stripeCenter.clone().addScaledVector(normal, -0.12);
          const sR = stripeCenter.clone().addScaledVector(normal, 0.12);
          const sNextL = sL.clone().addScaledVector(tangent, 3.0);
          const sNextR = sR.clone().addScaledVector(tangent, 3.0);

          const idx = markVerts.length / 3;
          markVerts.push(sL.x, sL.y + 0.1, sL.z);
          markVerts.push(sR.x, sR.y + 0.1, sR.z);
          markVerts.push(sNextL.x, sNextL.y + 0.1, sNextL.z);
          markVerts.push(sNextR.x, sNextR.y + 0.1, sNextR.z);

          markIndices.push(idx, idx + 2, idx + 1);
          markIndices.push(idx + 1, idx + 2, idx + 3);
        });
      }
    }

    // Asphalt Mesh
    const roadGeo = new THREE.BufferGeometry();
    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(roadVerts, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(roadUVs, 2));
    roadGeo.setIndex(roadIndices);
    roadGeo.computeVertexNormals();

    // Procedural Asphalt, Shoulder & Grass Canvas Textures
    const makeGrainTex = (baseHex: string, speckA: string, speckB: string, isRoad: boolean = false) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = baseHex;
      ctx.fillRect(0, 0, 256, 256);

      if (isRoad) {
        // Subtle dark tire-wear tracks in the 3 lanes
        for (const center of [42, 128, 214]) {
          for (const wheel of [center - 11, center + 11]) {
            const wear = ctx.createLinearGradient(wheel - 7, 0, wheel + 7, 0);
            wear.addColorStop(0, 'transparent');
            wear.addColorStop(0.5, 'rgba(20,18,16,0.24)');
            wear.addColorStop(1, 'transparent');
            ctx.fillStyle = wear;
            ctx.fillRect(wheel - 7, 0, 14, 256);
          }
        }
        // Crisp white outer road edge lines
        ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
        ctx.fillRect(4, 0, 2, 256);
        ctx.fillRect(250, 0, 2, 256);
      }

      for (let k = 0; k < 1800; k++) {
        ctx.fillStyle = k % 2 === 0 ? speckA : speckB;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 4;
      return tex;
    };

    const roadTex = makeGrainTex(
      stage.isWetRoad ? '#494a49' : '#60605c',
      'rgba(255,255,255,0.05)',
      'rgba(0,0,0,0.14)',
      true
    );
    // Addis Ababa Corridor Development Sidewalk: Interlocking Pavers + Protected Green Bike Lane + Black/White Curb
    const makeSidewalkTex = () => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = stage.skyTheme === 'night' ? '#334155' : '#8b6f5c';
      ctx.fillRect(0, 0, 256, 256);

      // Terracotta & grey interlocking block pavers for pedestrian walkway (x = 0..160)
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.lineWidth = 1.5;
      for (let y = 0; y < 256; y += 24) {
        if ((y / 24) % 3 === 0) {
          ctx.fillStyle = stage.skyTheme === 'night' ? '#3f4e63' : '#7c7672';
          ctx.fillRect(14, y, 146, 24);
        }
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(160, y);
        ctx.stroke();
        const offset = (y / 24) % 2 === 0 ? 0 : 16;
        for (let x = offset; x < 160; x += 32) {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 24);
          ctx.stroke();
        }
      }

      // Wide dedicated green-painted Corridor bicycle lane (x = 160..232)
      ctx.fillStyle = stage.skyTheme === 'night' ? '#14532d' : '#16a34a';
      ctx.fillRect(160, 0, 72, 256);
      ctx.fillStyle = 'rgba(248, 250, 252, 0.92)';
      ctx.fillRect(158, 0, 4, 256);
      ctx.fillRect(229, 0, 3, 256);

      // Painted white bicycle symbol + directional arrow on bike lane
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.9)';
      ctx.fillStyle = 'rgba(248, 250, 252, 0.9)';
      ctx.lineWidth = 3;
      // Rear & front wheels
      ctx.beginPath();
      ctx.arc(196, 175, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(196, 125, 11, 0, Math.PI * 2);
      ctx.stroke();
      // Frame & handlebars
      ctx.beginPath();
      ctx.moveTo(196, 175);
      ctx.lineTo(196, 125);
      ctx.moveTo(185, 132);
      ctx.lineTo(207, 132);
      ctx.stroke();
      // Forward direction chevron
      ctx.beginPath();
      ctx.moveTo(196, 60);
      ctx.lineTo(184, 78);
      ctx.lineTo(208, 78);
      ctx.closePath();
      ctx.fill();

      // Iconic Addis Ababa alternating black & white painted curb along road edge (x = 232..256)
      for (let y = 0; y < 256; y += 64) {
        ctx.fillStyle = (y / 64) % 2 === 0 ? '#f8fafc' : '#18181b';
        ctx.fillRect(232, y, 24, 64);
      }

      // Red volcanic soil planter strip on outer edge of sidewalk
      ctx.fillStyle = stage.skyTheme === 'night' ? '#450a0a' : '#8c2d19';
      ctx.fillRect(0, 0, 12, 256);

      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 4;
      return tex;
    };

    const shoulderTex = makeSidewalkTex();
    const grassTex = makeGrainTex(
      stage.skyTheme === 'night' ? '#072217' : stage.skyTheme === 'sunset' ? '#3d311f' : '#28603c',
      'rgba(134,239,172,0.07)',
      'rgba(0,0,0,0.14)',
      false
    );

    const roadMat = new THREE.MeshStandardMaterial({
      map: roadTex,
      roughness: stage.isWetRoad ? 0.22 : 0.78,
      metalness: 0,
      side: THREE.DoubleSide
    });
    this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.roadMesh.receiveShadow = true;
    this.roadGroup.add(this.roadMesh);

    // Volcanic Red Soil Shoulder Mesh
    const shoulderGeo = new THREE.BufferGeometry();
    shoulderGeo.setAttribute('position', new THREE.Float32BufferAttribute(shoulderVerts, 3));
    shoulderGeo.setAttribute('uv', new THREE.Float32BufferAttribute(shoulderUVs, 2));
    shoulderGeo.setIndex(shoulderIndices);
    shoulderGeo.computeVertexNormals();

    const shoulderMat = new THREE.MeshStandardMaterial({
      map: shoulderTex,
      roughness: 0.92,
      side: THREE.DoubleSide
    });
    this.shoulderMesh = new THREE.Mesh(shoulderGeo, shoulderMat);
    this.shoulderMesh.receiveShadow = true;
    this.roadGroup.add(this.shoulderMesh);

    // Elevation-Matched Roadside Grass Apron Mesh
    const grassGeo = new THREE.BufferGeometry();
    grassGeo.setAttribute('position', new THREE.Float32BufferAttribute(grassVerts, 3));
    grassGeo.setAttribute('uv', new THREE.Float32BufferAttribute(grassUVs, 2));
    grassGeo.setIndex(grassIndices);
    grassGeo.computeVertexNormals();

    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.95,
      side: THREE.DoubleSide
    });
    const grassMesh = new THREE.Mesh(grassGeo, grassMat);
    grassMesh.receiveShadow = true;
    this.roadGroup.add(grassMesh);

    // Reflective Road Markings Mesh
    if (markVerts.length > 0) {
      const markGeo = new THREE.BufferGeometry();
      markGeo.setAttribute('position', new THREE.Float32BufferAttribute(markVerts, 3));
      markGeo.setIndex(markIndices);
      markGeo.computeVertexNormals();

      const markMat = new THREE.MeshStandardMaterial({
        roughness: stage.isWetRoad ? 0.32 : 0.83,
        color: 0xd7d4c7,
        side: THREE.DoubleSide
      });
      this.markingsMesh = new THREE.Mesh(markGeo, markMat);
      this.markingsMesh.receiveShadow = true;
      this.roadGroup.add(this.markingsMesh);
    }
  }

  private buildLandmarks(stage: RouteStage, road: RoadManager) {
    addStreetShops(this.sceneryGroup, this.spinePoints, this.spineNormals, stage.id, road.segments);
    const districts = stage.id === 1 ? [['መገናኛ', 'Megenagna'], ['ካዛንቺስ', 'Kazanchis'], ['ፒያሳ', 'Piazza']] :
      stage.id === 2 ? [['ቦሌ', 'Bole'], ['ኦሊምፒያ', 'Olympia'], ['መስቀል አደባባይ', 'Meskel Square']] :
      [['መርካቶ', 'Merkato'], ['ሽሮ ሜዳ', 'Shiro Meda'], ['እንጦጦ', 'Entoto']];
    districts.forEach(([amharic, english], i) => {
      const index = i === 0 ? 4 : Math.floor(this.spinePoints.length * (i === 1 ? 0.34 : 0.77));
      const sign = districtSign(amharic, english);
      sign.position.copy(this.spinePoints[index]).addScaledVector(this.spineNormals[index], 12.2);
      const tangent = this.spineTangents[index];
      sign.rotation.y = Math.atan2(-tangent.x, -tangent.z);
      this.sceneryGroup.add(sign);
    });
    if (stage.id === 2) {
      // Stepped public seating opens onto the Meskel Square crossing.
      const index = Math.floor(this.spinePoints.length * 0.82);
      const plaza = new THREE.Group();
      const paving = new THREE.MeshStandardMaterial({ color: 0xb6a997, roughness: 0.95 });
      const steps = new THREE.InstancedMesh(new THREE.BoxGeometry(66, 0.48, 1.8), paving, 12);
      const transform = new THREE.Matrix4();
      for (let row = 0; row < 12; row++) {
        steps.setMatrixAt(row, transform.makeTranslation(0, 0.24 + row * 0.45, row * 1.7));
      }
      plaza.add(steps);
      const apron = new THREE.Mesh(new THREE.BoxGeometry(70, 0.16, 15), paving);
      apron.position.z = -8;
      plaza.add(apron);
      plaza.position.copy(this.spinePoints[index]).addScaledVector(this.spineNormals[index], 32);
      const outward = this.spineNormals[index];
      plaza.rotation.y = Math.atan2(outward.x, outward.z);
      this.sceneryGroup.add(plaza);
    }
    if (stage.id === 1 || stage.id === 2) {
      // 1. Commercial Bank of Ethiopia (CBE) 209m Skyscraper
      const cbeIdx = Math.floor(this.spinePoints.length * 0.42);
      if (this.spinePoints[cbeIdx]) {
        const cbe = createCBETower3D();
        const pt = this.spinePoints[cbeIdx];
        const normal = this.spineNormals[cbeIdx];
        cbe.position.copy(pt).addScaledVector(normal, 95.0);
        this.sceneryGroup.add(cbe);
      }

      // 2. Addis Light Rail Transit (AALRT) Elevated Viaducts & Animated Trains along corridor
      const viaductFracs = [0.22, 0.52, 0.80];
      viaductFracs.forEach((frac, idx) => {
        const viaductIdx = Math.floor(this.spinePoints.length * frac);
        if (this.spinePoints[viaductIdx]) {
          const viaduct = createLightRailViaduct3D();
          const pt = this.spinePoints[viaductIdx];
          const normal = this.spineNormals[viaductIdx];
          const tangent = this.spineTangents[viaductIdx];
          viaduct.position.copy(pt).addScaledVector(normal, -22.5);
          viaduct.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
          this.sceneryGroup.add(viaduct);
          const train = viaduct.children.find(c => c.userData.isLrtTrain);
          if (train) {
            this.lrtTrains.push({ mesh: train, dir: idx % 2 === 0 ? 1 : -1, offset: idx * 65 });
          }
        }
      });

      // 3. Parallel At-Grade Railway Track & Highway Railway Level Crossing
      this.buildRailwayCorridor(road);
    }

    // 4. Protected Bicycle Lane Bollards & Cyclists (Addis Corridor NMT)
    this.buildBikeLaneDetails(road);

    // 5. Sidewalk Pedestrians & Shoppers
    this.buildSidewalkPedestrians(road);
  }

  private buildBikeLaneDetails(road: RoadManager) {
    const count = this.spinePoints.length;
    if (count < 20) return;

    const isNearInter = (idx: number) =>
      road.intersections.some(inter => Math.abs(inter.segmentIndex - idx) <= 6);

    const bollardSites: THREE.Vector3[] = [];
    for (let i = 6; i < count - 10; i += 3) {
      if (isNearInter(i)) continue;
      const pt = this.spinePoints[i];
      const normal = this.spineNormals[i];
      bollardSites.push(pt.clone().addScaledVector(normal, -9.25));
      bollardSites.push(pt.clone().addScaledVector(normal, 9.25));
    }

    if (bollardSites.length > 0) {
      const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 0.78, 6);
      const bandGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.16, 6);
      const postMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xca8a04, emissiveIntensity: 0.25 });

      const posts = new THREE.InstancedMesh(postGeo, postMat, bollardSites.length);
      const bands = new THREE.InstancedMesh(bandGeo, bandMat, bollardSites.length);
      const dummy = new THREE.Object3D();

      bollardSites.forEach((p, idx) => {
        dummy.position.set(p.x, p.y + 0.39, p.z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        posts.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(p.x, p.y + 0.62, p.z);
        dummy.updateMatrix();
        bands.setMatrixAt(idx, dummy.matrix);
      });
      this.sceneryGroup.add(posts, bands);
    }

    // 3D Articulated Cyclists riding along both protected green bike lanes
    for (let i = 14; i < count - 16; i += 12) {
      if (isNearInter(i)) continue;
      const side = ((i - 14) / 12) % 2 === 0 ? 1 : -1;
      const pt = this.spinePoints[i];
      const normal = this.spineNormals[i];
      const tangent = this.spineTangents[i];

      const cyclist = createCyclist3D();
      cyclist.position.copy(pt).addScaledVector(normal, side * 10.1);
      cyclist.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), side > 0 ? tangent : tangent.clone().negate());
      this.sceneryGroup.add(cyclist);
      this.bikeCyclists.push({
        mesh: cyclist,
        trackZ: i * ROAD.SEGMENT_LENGTH,
        side,
        speed: 950 + (i % 5) * 90,
        wheels: (cyclist.userData.wheels as THREE.Object3D[]) || []
      });
    }
  }

  private buildSidewalkPedestrians(road: RoadManager) {
    const count = this.spinePoints.length;
    if (count < 20) return;

    const isNearInter = (idx: number) =>
      road.intersections.some(inter => Math.abs(inter.segmentIndex - idx) <= 6);

    for (let i = 8; i < count - 12; i += 9) {
      if (isNearInter(i)) continue;
      const pt = this.spinePoints[i];
      const normal = this.spineNormals[i];
      const tangent = this.spineTangents[i];

      // Spawn walking pedestrians on both sidewalks
      for (const side of [-1, 1]) {
        if ((i + (side > 0 ? 1 : 0)) % 3 === 0) continue;
        const dir = ((i + side) % 2 === 0) ? 1 : -1;
        const lat = 11.7 + ((i * 7 + side) % 3) * 0.55;
        const walker = createRealHuman3D('pedestrian');
        walker.position.copy(pt).addScaledVector(normal, side * lat);
        walker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir > 0 ? tangent : tangent.clone().negate());
        this.sceneryGroup.add(walker);
        this.sidewalkWalkers.push({
          mesh: walker,
          trackZ: i * ROAD.SEGMENT_LENGTH,
          side,
          dir,
          speed: 220 + (i % 4) * 35,
          lat
        });
      }
    }
  }

  private buildRailwayCorridor(road: RoadManager) {
    const count = this.spinePoints.length;
    if (count < 30) return;

    const ballastMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.96 });
    const sleeperMat = new THREE.MeshStandardMaterial({ color: 0x3f3a36, roughness: 0.9 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });

    const dummy = new THREE.Object3D();
    const ballastSites: { pos: THREE.Vector3; rotY: number }[] = [];
    const sleeperSites: { pos: THREE.Vector3; rotY: number }[] = [];
    const railSites: { pos: THREE.Vector3; rotY: number }[] = [];

    const isNearInter = (idx: number) =>
      road.intersections.some(inter => Math.abs(inter.segmentIndex - idx) <= 7);

    // Parallel at-grade railway line on left side (-16.2m from road centerline)
    for (let i = 6; i < count - 12; i += 2) {
      if (isNearInter(i)) continue;
      const pt = this.spinePoints[i];
      const normal = this.spineNormals[i];
      const tangent = this.spineTangents[i];
      const rotY = Math.atan2(tangent.x, tangent.z);
      const trackCenter = pt.clone().addScaledVector(normal, -16.2);

      ballastSites.push({ pos: trackCenter, rotY });
      sleeperSites.push({ pos: trackCenter, rotY });
      for (const railOff of [-0.72, 0.72]) {
        railSites.push({
          pos: trackCenter.clone().addScaledVector(normal, railOff),
          rotY
        });
      }
    }

    if (ballastSites.length > 0) {
      const ballastGeo = new THREE.BoxGeometry(3.2, 0.14, 12.2);
      const sleeperGeo = new THREE.BoxGeometry(2.4, 0.12, 0.35);
      const railGeo = new THREE.BoxGeometry(0.12, 0.16, 12.2);

      const ballasts = new THREE.InstancedMesh(ballastGeo, ballastMat, ballastSites.length);
      const sleepers = new THREE.InstancedMesh(sleeperGeo, sleeperMat, sleeperSites.length);
      const rails = new THREE.InstancedMesh(railGeo, railMat, railSites.length);

      ballastSites.forEach((s, idx) => {
        dummy.position.set(s.pos.x, s.pos.y + 0.04, s.pos.z);
        dummy.rotation.set(0, s.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        ballasts.setMatrixAt(idx, dummy.matrix);
      });
      sleeperSites.forEach((s, idx) => {
        dummy.position.set(s.pos.x, s.pos.y + 0.13, s.pos.z);
        dummy.rotation.set(0, s.rotY, 0);
        dummy.updateMatrix();
        sleepers.setMatrixAt(idx, dummy.matrix);
      });
      railSites.forEach((s, idx) => {
        dummy.position.set(s.pos.x, s.pos.y + 0.22, s.pos.z);
        dummy.rotation.set(0, s.rotY, 0);
        dummy.updateMatrix();
        rails.setMatrixAt(idx, dummy.matrix);
      });
      this.sceneryGroup.add(ballasts, sleepers, rails);
    }

    // Highway Railway Level Crossing (at 62% of the route)
    const crossIdx = Math.floor(count * 0.62);
    if (this.spinePoints[crossIdx] && !isNearInter(crossIdx)) {
      const pt = this.spinePoints[crossIdx];
      const normal = this.spineNormals[crossIdx];
      const tangent = this.spineTangents[crossIdx];
      const crossing = new THREE.Group();
      crossing.position.copy(pt);
      crossing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);

      // Concrete crossing apron & twin steel rails cutting across all 3 lanes
      const apron = new THREE.Mesh(new THREE.BoxGeometry(20.0, 0.06, 3.6), materials.concretePillar);
      apron.position.y = 0.08;
      crossing.add(apron);

      for (const rz of [-0.75, 0.75]) {
        const crossRail = new THREE.Mesh(new THREE.BoxGeometry(58.0, 0.12, 0.14), railMat);
        crossRail.position.set(0, 0.13, rz);
        crossing.add(crossRail);
      }

      // Red & white railway crossing barrier posts on both shoulders
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 2.8, 8), materials.fuelRed);
        post.position.set(side * 10.6, 1.4, -2.0);
        crossing.add(post);

        const arm = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 0.14), materials.minibusWhite);
        arm.position.set(side * 9.0, 2.5, -2.0);
        arm.rotation.z = side * 0.65; // Raised open gate arm
        crossing.add(arm);

        const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 0.15), materials.fuelRed);
        stripe.position.set(side * 8.4, 2.9, -2.0);
        stripe.rotation.z = side * 0.65;
        crossing.add(stripe);
      }

      // Keep road alignment clean on curves
      void normal;
      this.sceneryGroup.add(crossing);
    }
  }

  private buildCityBlocks(stage: RouteStage, road: RoadManager) {
    const count = this.spinePoints.length;
    if (count < 20) return;

    const midRiseSites: { pos: THREE.Vector3; rotY: number; sx: number; sy: number; sz: number }[] = [];
    const towerSites: { pos: THREE.Vector3; rotY: number; sx: number; sy: number; sz: number }[] = [];
    const houseSites: { pos: THREE.Vector3; rotY: number; sx: number; sy: number; sz: number }[] = [];

    const maxSeg = stage.id === 3 ? Math.floor(count * 0.52) : count - 15;
    const isNearInter = (idx: number) =>
      road.intersections.some(inter => Math.abs(inter.segmentIndex - idx) <= 8);

    // Deterministic pseudo-random helper so blocks look organic and consistent
    const hash = (n: number) => {
      const s = Math.sin(n * 127.1 + stage.id * 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    for (let i = 10; i < maxSeg; i += 4) {
      if (isNearInter(i)) continue;
      // Leave cross-street corridors every ~24 segments
      if (i % 24 < 3) continue;

      const pt = this.spinePoints[i];
      const normal = this.spineNormals[i];
      const tangent = this.spineTangents[i];
      const baseRot = Math.atan2(tangent.x, tangent.z);

      for (const side of [-1, 1]) {
        const r1 = hash(i * 3 + side);
        const r2 = hash(i * 7 + side * 13);

        // Row 2 (42m - 68m from road center): Mid-rise apartments & neighborhood houses
        if (r1 > 0.18) {
          const dist2 = 42 + r2 * 24;
          const pos2 = pt.clone().addScaledVector(normal, side * dist2);
          const jitterRot = baseRot + (r1 - 0.5) * 0.22;

          if (stage.id === 3 || (stage.id === 1 && r1 > 0.65)) {
            houseSites.push({
              pos: pos2,
              rotY: jitterRot,
              sx: 0.9 + r2 * 0.45,
              sy: 0.85 + r1 * 0.4,
              sz: 0.9 + r1 * 0.45
            });
          } else {
            midRiseSites.push({
              pos: pos2,
              rotY: jitterRot,
              sx: 0.85 + r2 * 0.55,
              sy: 0.8 + r1 * 1.1,
              sz: 0.85 + r1 * 0.5
            });
          }
        }

        // Row 3 (74m - 116m from road center): Deeper city blocks & glass skyline towers
        if (r2 > 0.25) {
          const dist3 = 74 + r1 * 38;
          const pos3 = pt.clone().addScaledVector(normal, side * dist3);
          const jitterRot = baseRot + (r2 - 0.5) * 0.28;

          if (stage.id !== 3 && r2 > 0.52) {
            towerSites.push({
              pos: pos3,
              rotY: jitterRot,
              sx: 0.9 + r1 * 0.6,
              sy: 1.0 + r2 * 1.45,
              sz: 0.9 + r2 * 0.55
            });
          } else {
            midRiseSites.push({
              pos: pos3,
              rotY: jitterRot,
              sx: 1.0 + r1 * 0.6,
              sy: 0.7 + r2 * 0.9,
              sz: 1.0 + r2 * 0.5
            });
          }
        }
      }
    }

    const dummy = new THREE.Object3D();

    // Procedural architectural window-grid facade material helper
    const makeFacadeMat = (wallHex: string, spandrelHex: string, glassHex: string, cols: number, rows: number, isGlassTower = false) => {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d')!;
      ctx.fillStyle = wallHex;
      ctx.fillRect(0, 0, 256, 256);

      const cellW = 256 / cols;
      const cellH = 256 / rows;
      for (let r = 0; r < rows; r++) {
        // Floor spandrel band
        ctx.fillStyle = spandrelHex;
        ctx.fillRect(0, r * cellH, 256, Math.max(3, cellH * 0.22));
        for (let col = 0; col < cols; col++) {
          const lit = ((r * 7 + col * 13) % 11) === 0;
          ctx.fillStyle = lit ? '#fde68a' : glassHex;
          const padX = isGlassTower ? 2 : cellW * 0.18;
          const padY = cellH * 0.28;
          ctx.fillRect(
            col * cellW + padX,
            r * cellH + padY,
            cellW - padX * 2,
            cellH * 0.58
          );
        }
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.anisotropy = 4;
      return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: isGlassTower ? 0.28 : 0.82,
        metalness: isGlassTower ? 0.35 : 0.05
      });
    };

    // 1. Mid-rise cream, terracotta & sandstone city-block apartments (batched with window facades)
    if (midRiseSites.length > 0) {
      const boxGeo = new THREE.BoxGeometry(12, 14, 10);
      const roofGeo = new THREE.BoxGeometry(12.4, 0.6, 10.4);
      const creamMat = makeFacadeMat('#e2d4bc', '#c8b89d', '#293241', 5, 5, false);
      const terraMat = makeFacadeMat('#be6a48', '#964e32', '#262930', 5, 5, false);
      const ochreMat = makeFacadeMat('#d4a359', '#b0823d', '#2b303a', 5, 5, false);
      const buckets = [
        { sites: midRiseSites.filter((_, idx) => idx % 3 === 0), mat: creamMat },
        { sites: midRiseSites.filter((_, idx) => idx % 3 === 1), mat: terraMat },
        { sites: midRiseSites.filter((_, idx) => idx % 3 === 2), mat: ochreMat }
      ];

      for (const { sites, mat } of buckets) {
        if (!sites.length) continue;
        const bodies = new THREE.InstancedMesh(boxGeo, mat, sites.length);
        const roofs = new THREE.InstancedMesh(roofGeo, materials.bldgDarkTrim, sites.length);
        sites.forEach((s, idx) => {
          dummy.position.set(s.pos.x, s.pos.y + 7 * s.sy, s.pos.z);
          dummy.rotation.set(0, s.rotY, 0);
          dummy.scale.set(s.sx, s.sy, s.sz);
          dummy.updateMatrix();
          bodies.setMatrixAt(idx, dummy.matrix);

          dummy.position.set(s.pos.x, s.pos.y + 14 * s.sy + 0.3, s.pos.z);
          dummy.scale.set(s.sx, 1, s.sz);
          dummy.updateMatrix();
          roofs.setMatrixAt(idx, dummy.matrix);
        });
        bodies.receiveShadow = true;
        this.sceneryGroup.add(bodies, roofs);
      }
    }

    // 2. Deeper skyline towers (charcoal-bronze, warm limestone & slate-glass, batched)
    if (towerSites.length > 0) {
      const towerGeo = new THREE.BoxGeometry(13, 30, 12);
      const crownGeo = new THREE.BoxGeometry(11, 1.4, 10);
      const bronzeTowerMat = makeFacadeMat('#4a433d', '#2b2623', '#1e293b', 6, 10, true);
      const stoneTowerMat = makeFacadeMat('#d1c7b7', '#9e9484', '#263646', 6, 10, false);
      const slateTowerMat = makeFacadeMat('#364152', '#1e293b', '#334e68', 6, 10, true);
      const towerBuckets = [
        { sites: towerSites.filter((_, idx) => idx % 3 === 0), mat: bronzeTowerMat },
        { sites: towerSites.filter((_, idx) => idx % 3 === 1), mat: stoneTowerMat },
        { sites: towerSites.filter((_, idx) => idx % 3 === 2), mat: slateTowerMat }
      ];

      for (const { sites, mat } of towerBuckets) {
        if (!sites.length) continue;
        const towers = new THREE.InstancedMesh(towerGeo, mat, sites.length);
        const crowns = new THREE.InstancedMesh(crownGeo, materials.bldgDarkTrim, sites.length);
        sites.forEach((s, idx) => {
          dummy.position.set(s.pos.x, s.pos.y + 15 * s.sy, s.pos.z);
          dummy.rotation.set(0, s.rotY, 0);
          dummy.scale.set(s.sx, s.sy, s.sz);
          dummy.updateMatrix();
          towers.setMatrixAt(idx, dummy.matrix);

          dummy.position.set(s.pos.x, s.pos.y + 30 * s.sy + 0.7, s.pos.z);
          dummy.scale.set(s.sx, 1, s.sz);
          dummy.updateMatrix();
          crowns.setMatrixAt(idx, dummy.matrix);
        });
        this.sceneryGroup.add(towers, crowns);
      }
    }

    // 3. Neighborhood corrugated-roof houses (batched)
    if (houseSites.length > 0) {
      const hBodyGeo = new THREE.BoxGeometry(9, 4.2, 8);
      const hRoofGeo = new THREE.ConeGeometry(6.6, 2.2, 4);
      const hBodies = new THREE.InstancedMesh(hBodyGeo, materials.bldgStuccoCream, houseSites.length);
      const hRoofs = new THREE.InstancedMesh(hRoofGeo, materials.bldgRoofRed, houseSites.length);
      houseSites.forEach((s, idx) => {
        dummy.position.set(s.pos.x, s.pos.y + 2.1 * s.sy, s.pos.z);
        dummy.rotation.set(0, s.rotY, 0);
        dummy.scale.set(s.sx, s.sy, s.sz);
        dummy.updateMatrix();
        hBodies.setMatrixAt(idx, dummy.matrix);

        dummy.position.set(s.pos.x, s.pos.y + 4.2 * s.sy + 1.1, s.pos.z);
        dummy.rotation.set(0, s.rotY + Math.PI / 4, 0);
        dummy.scale.set(s.sx, 1, s.sz);
        dummy.updateMatrix();
        hRoofs.setMatrixAt(idx, dummy.matrix);
      });
      this.sceneryGroup.add(hBodies, hRoofs);
    }
  }

  private buildIntersectionCrossroads(road: RoadManager) {
    for (const inter of road.intersections) {
      const pt = this.getPointAtZ(inter.zStopLine + ROAD.SEGMENT_LENGTH * 2);
      const crossRoadGeo = new THREE.PlaneGeometry(16.0, 78.0);
      crossRoadGeo.rotateX(-Math.PI / 2);
      const crossRoadMat = new THREE.MeshStandardMaterial({
        color: 0x181e28,
        roughness: 0.8,
        side: THREE.DoubleSide
      });
      const crossRoadMesh = new THREE.Mesh(crossRoadGeo, crossRoadMat);
      crossRoadMesh.position.copy(pt.pos);
      crossRoadMesh.position.y += 0.05;
      crossRoadMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pt.normal);
      this.roadGroup.add(crossRoadMesh);
    }
  }

  private buildCrossTraffic(road: RoadManager) {
    for (const inter of road.intersections) {
      for (const cv of inter.crossTrafficVehicles) {
        const model = cv.type === 'LADA' ? createLada3D(false) : cv.type === 'BAJAJ' ? createBajaj3D(false) : cv.type === 'MINIBUS' ? createMinibus3D(false) : createIsuzu3D(false);
        cv.mesh3d = model.group;
        this.entitiesGroup.add(model.group);
      }
    }
  }

  private buildTrackEntities(road: RoadManager) {
    for (let i = 0; i < road.segments.length; i++) {
      const seg = road.segments[i];

      // Spawn directional lane arrows preceding intersections
      if (seg.hasLaneArrows) {
        [-0.65, 0, 0.65].forEach((laneOffset, idx) => {
          const dir = idx === 0 ? 'LEFT' : idx === 1 ? 'STRAIGHT' : 'RIGHT';
          const arrowMesh = createLaneArrowMesh3D(dir);
          const z = seg.p1.z + 100;
          const { pos, tangent, normal } = this.getPointAtZ(z);
          const arrowPos = pos.clone().addScaledVector(normal, laneOffset * 9.0);
          arrowPos.y += 0.08;
          arrowMesh.position.copy(arrowPos);
          arrowMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
          this.roadGroup.add(arrowMesh);
        });
      }

      for (const sprite of seg.sprites) {
        const meshData = this.instantiateSpriteMesh(sprite, road);
        if (meshData) {
          if (sprite.type !== 'OBSTACLE_POTHOLE' && !sprite.type.startsWith('INTERSECTION_ARROW_')) {
            meshData.traverse(obj => {
              if ((obj as THREE.Mesh).isMesh) {
                obj.castShadow = true;
              }
            });
          }
          sprite.mesh3d = meshData;
          this.entitiesGroup.add(meshData);
        }
      }
    }
  }

  private instantiateSpriteMesh(sprite: SpriteInstance, road: RoadManager): THREE.Object3D | null {
    switch (sprite.type) {
      case 'TRAFFIC_LADA': {
        const v = createLada3D(false);
        v.group.userData.vehicleModel = v;
        return v.group;
      }
      case 'TRAFFIC_BAJAJ': {
        const v = createBajaj3D(false);
        v.group.userData.vehicleModel = v;
        return v.group;
      }
      case 'TRAFFIC_ISUZU': {
        const v = createIsuzu3D(false);
        v.group.userData.vehicleModel = v;
        return v.group;
      }
      case 'TRAFFIC_EV': {
        const v = createEV3D();
        v.group.userData.vehicleModel = v;
        return v.group;
      }
      case 'TRAFFIC_BUS': {
        const v = createElectricBus3D();
        v.group.userData.vehicleModel = v;
        return v.group;
      }
      case 'TRAFFIC_POLICE': {
        const v = createPolice3D(false);
        v.group.userData.vehicleModel = v;
        if (v.policeStrobeRed && v.policeStrobeBlue) {
          this.policeLights.push({ red: v.policeStrobeRed, blue: v.policeStrobeBlue });
        }
        return v.group;
      }
      case 'TRAFFIC_LIGHT_GANTRY': {
        const gantry = createTrafficLightGantry3D();
        const tag = sprite.tag;
        if (tag && tag.startsWith('intersection_')) {
          const idx = parseInt(tag.split('_')[1], 10);
          const inter = road.intersections[idx];
          if (inter) {
            inter.gantryModel = gantry;
            gantry.setState(inter.lightState);
          }
        }
        return gantry.group;
      }
      case 'INTERSECTION_ARROW_STRAIGHT':
        return createLaneArrowMesh3D('STRAIGHT');
      case 'INTERSECTION_ARROW_LEFT':
        return createLaneArrowMesh3D('LEFT');
      case 'INTERSECTION_ARROW_RIGHT':
        return createLaneArrowMesh3D('RIGHT');
      case 'OBSTACLE_POTHOLE':
        return createPothole3D();
      case 'OBSTACLE_GOAT':
        return createGoat3D();
      case 'OBSTACLE_COW':
        return createZebuCow3D();
      case 'ITEM_BIRR':
        return createBirrCoin3D();
      case 'ITEM_BUNNA':
        return createBunnaJebena3D();
      case 'ITEM_FUEL':
        return createFuelCan3D();
      case 'PASSENGER':
        return createPassenger3D('passenger');
      case 'SCENERY_ZEBRA_PEDESTRIAN':
        return createPassenger3D('pedestrian');
      case 'SCENERY_POLICE_CONE':
        return createPoliceCone3D();
      case 'SCENERY_RADAR_SIGN':
      case 'SCENERY_TAXI_SIGN':
        return createTaxiSign3D();
      case 'SCENERY_ACACIA':
        return createAcaciaTree3D();
      case 'SCENERY_EUCALYPTUS':
        return createEucalyptusTree3D();
      case 'SCENERY_PALM':
        return createPalmTree3D();
      case 'SCENERY_LAMP':
        return createStreetLamp3D();
      case 'SCENERY_BILLBOARD':
        return createBillboard3D();
      case 'SCENERY_BUILDING_APARTMENT': {
        const b = createBuilding3D('APARTMENT');
        b.userData.isBuilding = true;
        return b;
      }
      case 'SCENERY_BUILDING_SHOP': {
        const b = createBuilding3D('SHOP');
        b.userData.isBuilding = true;
        return b;
      }
      case 'SCENERY_BUILDING_TOWER': {
        const b = createBuilding3D('TOWER');
        b.userData.isBuilding = true;
        return b;
      }
      case 'SCENERY_BUILDING_HOUSE': {
        const b = createBuilding3D('HOUSE');
        b.userData.isBuilding = true;
        return b;
      }
      case 'CHECKPOINT_GATE':
        return createCheckpointGate3D();
      default:
        return null;
    }
  }

  public updateEntities(road: RoadManager, dt: number, playerZ: number) {
    const totalTrackZ = road.trackLength;
    const now = Date.now();

    // Alternate Police Strobes
    const redOn = now % 300 < 150;
    for (const pl of this.policeLights) {
      pl.red.intensity = redOn ? 7.0 : 0.2;
      pl.blue.intensity = redOn ? 0.2 : 7.0;
    }

    // Animate rigged GLB human characters (Idle / Walk)
    updateHumanAnimations(dt);

    // Animate LRT Trains along 240m viaducts
    this.lrtProgress += dt * 16.0;
    for (const train of this.lrtTrains) {
      const p = (this.lrtProgress + train.offset) % 200;
      train.mesh.position.z = train.dir > 0 ? -100 + p : 100 - p;
    }

    // Move 3D cyclists along the green bicycle lanes & spin their wheels
    for (const c of this.bikeCyclists) {
      c.trackZ = (c.trackZ + c.side * c.speed * dt + totalTrackZ) % totalTrackZ;
      let dist = c.trackZ - playerZ;
      if (dist < -totalTrackZ / 2) dist += totalTrackZ;
      if (dist > totalTrackZ / 2) dist -= totalTrackZ;
      if (dist < -1500 || dist > 18000) {
        c.mesh.visible = false;
        continue;
      }
      c.mesh.visible = true;
      const { pos, tangent, normal } = this.getPointAtZ(c.trackZ);
      c.mesh.position.copy(pos).addScaledVector(normal, c.side * 10.1);
      c.mesh.position.y += 0.02;
      c.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), c.side > 0 ? tangent : tangent.clone().negate());
      for (const w of c.wheels) {
        w.rotation.x += dt * 10.5;
      }
    }

    // Move 3D sidewalk pedestrians along both walkways
    for (const w of this.sidewalkWalkers) {
      w.trackZ = (w.trackZ + w.dir * w.speed * dt + totalTrackZ) % totalTrackZ;
      let dist = w.trackZ - playerZ;
      if (dist < -totalTrackZ / 2) dist += totalTrackZ;
      if (dist > totalTrackZ / 2) dist -= totalTrackZ;
      if (dist < -1500 || dist > 16000) {
        w.mesh.visible = false;
        continue;
      }
      w.mesh.visible = true;
      const { pos, tangent, normal } = this.getPointAtZ(w.trackZ);
      w.mesh.position.copy(pos).addScaledVector(normal, w.side * w.lat);
      w.mesh.position.y += 0.02;
      w.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), w.dir > 0 ? tangent : tangent.clone().negate());
    }

    // Update Intersections & Cross-Traffic Vehicles
    for (const inter of road.intersections) {
      if (inter.gantryModel && inter.gantryModel.setState) {
        inter.gantryModel.setState(inter.lightState);
      }

      const pt = this.getPointAtZ(inter.zStopLine + ROAD.SEGMENT_LENGTH * 2);
      const isNearPlayer = Math.abs(inter.zStopLine - playerZ) < 18000;

      for (const cv of inter.crossTrafficVehicles) {
        if (!cv.mesh3d) continue;

        if (!isNearPlayer) {
          cv.mesh3d.visible = false;
          continue;
        }

        cv.mesh3d.visible = true;

        const crossPos = pt.pos.clone()
          .addScaledVector(pt.normal, cv.crossX)
          .addScaledVector(pt.tangent, cv.laneZ);
        crossPos.y += 0.05;
        cv.mesh3d.position.copy(crossPos);

        const crossDir = pt.normal.clone().multiplyScalar(cv.direction);
        cv.mesh3d.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), crossDir);
      }
    }

    const segments = road.segments;
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      for (const sprite of seg.sprites) {
        const mesh = sprite.mesh3d as THREE.Object3D | undefined;
        if (!mesh) continue;

        // Hide collected items
        if (sprite.collected) {
          mesh.visible = false;
          continue;
        }

        const spriteZ = seg.p1.z + (sprite.zOffset || 0);

        // Distance relative to player
        let dist = spriteZ - playerZ;
        if (dist < -totalTrackZ / 2) dist += totalTrackZ;
        if (dist > totalTrackZ / 2) dist -= totalTrackZ;

        // View frustum draw distance (~330m ahead for buildings, 270m for entities)
        const maxDrawDist = mesh.userData.isBuilding ? 22000 : 18000;
        if (dist < -1500 || dist > maxDrawDist) {
          mesh.visible = false;
          continue;
        }

        mesh.visible = true;

        const { pos, tangent, normal } = this.getPointAtZ(spriteZ);
        const worldPos = pos.clone().addScaledVector(normal, sprite.offset * 9.0);

        // Align mesh orientation with track tangent (face oncoming vehicles 180° towards player)
        const meshDir = sprite.isOncoming ? tangent.clone().negate() : tangent;
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), meshDir);
        if (mesh.userData.isBuilding) {
          mesh.rotation.set(0, Math.atan2(-normal.x * sprite.offset, -normal.z * sprite.offset), 0);
        }

        // Racing Limits: Traffic Turn Signal Blinker & Hazard Animation
        const vModel = mesh.userData?.vehicleModel as Vehicle3DModel | undefined;
        if (vModel) {
          const blinkPhase = Math.floor(now / 160) % 2 === 0;
          const leftOn = (sprite.blinkerState === 'left' || sprite.isYielding) && blinkPhase;
          const rightOn = (sprite.blinkerState === 'right' || sprite.isYielding) && blinkPhase;

          if (vModel.leftBlinkers) {
            for (const b of vModel.leftBlinkers) {
              b.material = leftOn ? materials.blinkerAmberOn : materials.blinkerAmberOff;
            }
          }
          if (vModel.rightBlinkers) {
            for (const b of vModel.rightBlinkers) {
              b.material = rightOn ? materials.blinkerAmberOn : materials.blinkerAmberOff;
            }
          }
        }

        if (sprite.type === 'ITEM_BIRR') {
          worldPos.y += 0.45;
          mesh.position.copy(worldPos);
          mesh.rotateY(now * 0.004);
        } else if (sprite.type === 'ITEM_BUNNA') {
          worldPos.y += 0.35 + Math.sin((spriteZ + now * 0.006)) * 0.12;
          mesh.position.copy(worldPos);
          mesh.rotateY(now * 0.002);
        } else if (sprite.type === 'ITEM_FUEL') {
          worldPos.y += 0.35 + Math.cos((spriteZ + now * 0.005)) * 0.1;
          mesh.position.copy(worldPos);
        } else if (sprite.type === 'OBSTACLE_POTHOLE') {
          worldPos.y += 0.04;
          mesh.position.copy(worldPos);
        } else if (sprite.type === 'PASSENGER' || sprite.type.startsWith('PASSENGER_')) {
          worldPos.y += 0.02;
          mesh.position.copy(worldPos);
          const wavingArm = mesh.userData.wavingArm as THREE.Object3D | undefined;
          if (wavingArm) {
            wavingArm.rotation.z = 2.45 + Math.sin(now * 0.008 + spriteZ * 0.02) * 0.28;
          }
        } else {
          worldPos.y += 0.02;
          mesh.position.copy(worldPos);
        }
      }
    }
  }
}
