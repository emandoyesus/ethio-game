import * as THREE from 'three';
import { ROAD, type RoadManager } from './road';
import type { RouteStage } from './types';

export class Track3D {
  public group: THREE.Group;
  public roadMesh: THREE.Mesh | null = null;
  public shoulderMesh: THREE.Mesh | null = null;
  public markingsMesh: THREE.Mesh | null = null;

  public spinePoints: THREE.Vector3[] = [];
  public spineNormals: THREE.Vector3[] = [];
  public spineTangents: THREE.Vector3[] = [];

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
  }

  public build(road: RoadManager, stage: RouteStage) {
    // Clear previous meshes
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    }

    this.spinePoints = [];
    this.spineNormals = [];
    this.spineTangents = [];

    const segments = road.segments;
    const total = segments.length;
    if (total === 0) return;

    // 1. Calculate continuous smooth 3D Track Spine
    let curX = 0;
    let dx = 0;
    const segLength3D = 6.0; // 6 meters per segment in 3D world space
    const elevationScale = 0.04;

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

    // 2. Build 3D Road Geometry Ribbon (DoubleSide, Counter-Clockwise Winding)
    this.buildRoadRibbon(segments, stage);
  }

  public getPointAtZ(trackZ: number): { pos: THREE.Vector3; tangent: THREE.Vector3; normal: THREE.Vector3 } {
    const totalSegments = this.spinePoints.length;
    if (totalSegments === 0) {
      return { pos: new THREE.Vector3(), tangent: new THREE.Vector3(0, 0, 1), normal: new THREE.Vector3(1, 0, 0) };
    }

    const segLength3D = 6.0;
    const progressZ = (trackZ / ROAD.SEGMENT_LENGTH) * segLength3D;
    const segIdx = Math.floor(progressZ / segLength3D) % totalSegments;
    const nextIdx = (segIdx + 1) % totalSegments;

    const p0 = this.spinePoints[segIdx];
    const p1 = this.spinePoints[nextIdx];
    const t = Math.max(0, Math.min(1, (progressZ % segLength3D) / segLength3D));

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
        // Counter-Clockwise Road Quad: (0, 1, 2) and (1, 3, 2)
        const r0 = i * 2;
        const r1 = i * 2 + 1;
        const r2 = (i + 1) * 2;
        const r3 = (i + 1) * 2 + 1;

        roadIndices.push(r0, r1, r2);
        roadIndices.push(r1, r3, r2);

        // Left Shoulder Quad
        const sl0 = i * 4;
        const sl1 = i * 4 + 1;
        const sl2 = (i + 1) * 4;
        const sl3 = (i + 1) * 4 + 1;
        shoulderIndices.push(sl0, sl1, sl2);
        shoulderIndices.push(sl1, sl3, sl2);

        // Right Shoulder Quad
        const sr0 = i * 4 + 2;
        const sr1 = i * 4 + 3;
        const sr2 = (i + 1) * 4 + 2;
        const sr3 = (i + 1) * 4 + 3;
        shoulderIndices.push(sr0, sr1, sr2);
        shoulderIndices.push(sr1, sr3, sr2);
      }

      // Markings (Dashed highway lines & Zebra crossings)
      const seg = segments[i];
      if (seg && seg.hasZebraCrossing) {
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

          markIndices.push(idx, idx + 1, idx + 2);
          markIndices.push(idx + 1, idx + 3, idx + 2);
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

          markIndices.push(idx, idx + 1, idx + 2);
          markIndices.push(idx + 1, idx + 3, idx + 2);
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
    this.group.add(this.roadMesh);

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
    this.group.add(this.shoulderMesh);

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
      this.group.add(this.markingsMesh);
    }
  }
}
