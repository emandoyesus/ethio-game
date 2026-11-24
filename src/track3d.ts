import * as THREE from 'three';
import {
  createMinibus3D,
  createLada3D,
  createBajaj3D,
  createIsuzu3D,
  createPolice3D,
  createZebuCow3D,
  createGoat3D,
  createPothole3D,
  createBirrCoin3D,
  createBunnaJebena3D,
  createFuelCan3D,
  createPassenger3D,
  createPoliceCone3D,
  createAcaciaTree3D,
  createEucalyptusTree3D,
  createStreetLamp3D,
  createBillboard3D,
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

  private lrtTrainMesh: THREE.Object3D | null = null;
  private lrtProgress: number = 0;
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
    this.policeLights = [];
    this.lrtTrainMesh = null;

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

    // 4. Build Landmarks (CBE 209m Tower & Light Rail Viaduct)
    this.buildLandmarks(stage);

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
    const tangent = this.spineTangents[segIdx] || new THREE.Vector3(0, 0, 1);
    const normal = this.spineNormals[segIdx] || new THREE.Vector3(1, 0, 0);

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
    const shoulderIndices: number[] = [];

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

    const asphaltColor = stage.skyTheme === 'night' ? 0x1e293b : 0x272e38;
    const roadMat = new THREE.MeshStandardMaterial({
      color: asphaltColor,
      roughness: stage.isWetRoad ? 0.25 : 0.7,
      metalness: stage.isWetRoad ? 0.3 : 0.05,
      side: THREE.DoubleSide
    });
    this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.roadMesh.receiveShadow = true;
    this.roadGroup.add(this.roadMesh);

    // Volcanic Red Soil Shoulder Mesh
    const shoulderGeo = new THREE.BufferGeometry();
    shoulderGeo.setAttribute('position', new THREE.Float32BufferAttribute(shoulderVerts, 3));
    shoulderGeo.setIndex(shoulderIndices);
    shoulderGeo.computeVertexNormals();

    const shoulderColor = stage.skyTheme === 'night' ? 0x450a0a : 0x991b1b;
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: shoulderColor,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    this.shoulderMesh = new THREE.Mesh(shoulderGeo, shoulderMat);
    this.shoulderMesh.receiveShadow = true;
    this.roadGroup.add(this.shoulderMesh);

    // Reflective Road Markings Mesh
    if (markVerts.length > 0) {
      const markGeo = new THREE.BufferGeometry();
      markGeo.setAttribute('position', new THREE.Float32BufferAttribute(markVerts, 3));
      markGeo.setIndex(markIndices);
      markGeo.computeVertexNormals();

      const markMat = new THREE.MeshBasicMaterial({
        color: 0xf8fafc,
        side: THREE.DoubleSide
      });
      this.markingsMesh = new THREE.Mesh(markGeo, markMat);
      this.roadGroup.add(this.markingsMesh);
    }
  }

  private buildLandmarks(stage: RouteStage) {
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

      // 2. Addis Light Rail Transit (AALRT) Elevated Viaduct
      const viaductIdx = Math.floor(this.spinePoints.length * 0.25);
      if (this.spinePoints[viaductIdx]) {
        const viaduct = createLightRailViaduct3D();
        const pt = this.spinePoints[viaductIdx];
        const normal = this.spineNormals[viaductIdx];
        const tangent = this.spineTangents[viaductIdx];
        viaduct.position.copy(pt).addScaledVector(normal, -24.0);
        viaduct.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        this.sceneryGroup.add(viaduct);
        this.lrtTrainMesh = viaduct.children.find(c => c.position.y > 7.0) || null;
      }
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
      case 'SCENERY_ZEBRA_PEDESTRIAN':
        return createPassenger3D();
      case 'SCENERY_POLICE_CONE':
        return createPoliceCone3D();
      case 'SCENERY_RADAR_SIGN':
      case 'SCENERY_TAXI_SIGN':
        return createTaxiSign3D();
      case 'SCENERY_ACACIA':
        return createAcaciaTree3D();
      case 'SCENERY_EUCALYPTUS':
        return createEucalyptusTree3D();
      case 'SCENERY_LAMP':
        return createStreetLamp3D();
      case 'SCENERY_BILLBOARD':
        return createBillboard3D();
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

    // Animate LRT Train
    if (this.lrtTrainMesh) {
      this.lrtProgress = (this.lrtProgress + dt * 12.0) % 80;
      this.lrtTrainMesh.position.z = -40 + this.lrtProgress;
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

        // View frustum draw distance (~270m ahead, 20m behind for smooth 60 FPS)
        if (dist < -1200 || dist > 18000) {
          mesh.visible = false;
          continue;
        }

        mesh.visible = true;

        const { pos, tangent, normal } = this.getPointAtZ(spriteZ);
        const worldPos = pos.clone().addScaledVector(normal, sprite.offset * 9.0);

        // Align mesh orientation with track tangent (face oncoming vehicles 180° towards player)
        const meshDir = sprite.isOncoming ? tangent.clone().negate() : tangent;
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), meshDir);

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
        } else {
          worldPos.y += 0.02;
          mesh.position.copy(worldPos);
        }
      }
    }
  }
}
