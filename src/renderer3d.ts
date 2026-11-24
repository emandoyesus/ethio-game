import * as THREE from 'three';
import type { RouteStage } from './types';

export type CameraMode = 'CHASE' | 'HOOD' | 'TOP_DOWN';

export class Renderer3D {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public ambientLight: THREE.AmbientLight;
  public sunLight: THREE.DirectionalLight;
  public terrainMesh: THREE.Mesh;

  public cameraMode: CameraMode = 'CHASE';

  // 3D Weather Particle System
  private rainGeometry: THREE.BufferGeometry | null = null;
  private rainPoints: THREE.Points | null = null;
  private rainCoords: Float32Array | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    // Perspective Camera: 60° FOV, proper initial position & aspect ratio
    const width = Math.max(canvas.width, 900);
    const height = Math.max(canvas.height, 600);
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    this.camera.position.set(0, 4.5, -10);
    this.camera.lookAt(0, 1.2, 20);

    // WebGL Renderer with High-DPI support, Soft PCF Shadows & ACES Filmic Tone Mapping
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height, false);
    // Optimized pixel ratio capped at 1.25 to prevent GPU fillrate stalls on 2K/4K/Retina displays
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Atmospheric Lighting
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    this.sunLight.position.set(50, 100, 60);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 512;
    this.sunLight.shadow.mapSize.height = 512;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.scene.add(this.sunLight);

    // Massive Highland Ground Terrain (Optimized mesh density)
    const terrainGeo = new THREE.PlaneGeometry(2400, 2400, 12, 12);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x22543d, // Rich Ethiopian highland green / acacia savanna
      roughness: 0.95,
      metalness: 0.05
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.position.y = -0.05;
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    this.initRain();
  }

  public isPerformanceMode: boolean = false;

  public togglePerformanceMode(): boolean {
    this.isPerformanceMode = !this.isPerformanceMode;
    if (this.isPerformanceMode) {
      this.renderer.shadowMap.enabled = false;
      this.sunLight.castShadow = false;
      this.renderer.setPixelRatio(1.0);
      this.ambientLight.intensity = 1.05;
    } else {
      this.renderer.shadowMap.enabled = true;
      this.sunLight.castShadow = true;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      this.ambientLight.intensity = 0.85;
    }
    return this.isPerformanceMode;
  }

  public resize(width: number, height: number) {
    if (width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public cycleCamera(): CameraMode {
    if (this.cameraMode === 'CHASE') this.cameraMode = 'HOOD';
    else if (this.cameraMode === 'HOOD') this.cameraMode = 'TOP_DOWN';
    else this.cameraMode = 'CHASE';
    return this.cameraMode;
  }

  public setupStageEnvironment(stage: RouteStage) {
    if (stage.skyTheme === 'day') {
      this.scene.background = new THREE.Color(0x38bdf8); // Sky blue
      this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0015);
      this.ambientLight.color.setHex(0xe0f2fe);
      this.ambientLight.intensity = 0.9;
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 2.1;
      (this.terrainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x2d6a4f);
    } else if (stage.skyTheme === 'sunset') {
      this.scene.background = new THREE.Color(0xc2410c); // Sunset amber
      this.scene.fog = new THREE.FogExp2(0xf97316, 0.0018);
      this.ambientLight.color.setHex(0xfed7aa);
      this.ambientLight.intensity = 0.7;
      this.sunLight.color.setHex(0xfb923c);
      this.sunLight.intensity = 1.7;
      (this.terrainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x431407);
    } else {
      // Entoto Mountain Night
      this.scene.background = new THREE.Color(0x020617);
      this.scene.fog = new THREE.FogExp2(0x090d16, 0.003);
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.35;
      this.sunLight.color.setHex(0x38bdf8);
      this.sunLight.intensity = 0.5;
      (this.terrainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x061e14);
    }

    if (this.rainPoints) {
      this.rainPoints.visible = stage.weather === 'rain' || stage.weather === 'sunshower';
    }
  }

  private initRain() {
    const rainCount = 1500;
    this.rainGeometry = new THREE.BufferGeometry();
    this.rainCoords = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      this.rainCoords[i * 3] = (Math.random() - 0.5) * 80;
      this.rainCoords[i * 3 + 1] = Math.random() * 45;
      this.rainCoords[i * 3 + 2] = (Math.random() - 0.5) * 120;
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainCoords, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.18,
      transparent: true,
      opacity: 0.65
    });

    this.rainPoints = new THREE.Points(this.rainGeometry, rainMat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);
  }

  public update(
    playerPos: THREE.Vector3,
    tangent: THREE.Vector3,
    normal: THREE.Vector3,
    playerSpeedRatio: number,
    steerAngle: number,
    bounce: number,
    dt: number,
    isBoosting: boolean = false
  ) {
    // 1. Keep Terrain & Sun Centered and Elevation-Synced Around Player
    this.terrainMesh.position.set(playerPos.x, playerPos.y - 0.2, playerPos.z);

    this.sunLight.position.set(playerPos.x + 40, playerPos.y + 90, playerPos.z + 50);
    this.sunLight.target.position.copy(playerPos);

    // 2. Racing Limits Dynamic FOV & Speed Warping (Tunnel Vision from 60° up to 78°, 84° on boost)
    const targetFov = 60 + (playerSpeedRatio * 16.0) + (isBoosting ? 8.0 : 0.0);
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 6.5);
    this.camera.updateProjectionMatrix();

    // 3. Camera Dynamic Following Aligned with Highway Tangent
    const lookAheadDist = 18.0;
    const lookTarget = playerPos.clone().addScaledVector(tangent, lookAheadDist);
    lookTarget.y += 1.4 + bounce * 0.04;

    // Stable horizontal forward vector for camera positioning behind vehicle
    const horizTangent = new THREE.Vector3(tangent.x, 0, tangent.z).normalize();
    if (horizTangent.lengthSq() === 0) horizTangent.set(0, 0, 1);

    if (this.cameraMode === 'CHASE') {
      const followDist = 8.5 + playerSpeedRatio * 2.8;
      const followHeight = 3.6 + bounce * 0.03;
      const camTargetPos = playerPos
        .clone()
        .addScaledVector(horizTangent, -followDist)
        .addScaledVector(normal, -steerAngle * 1.5);
      camTargetPos.y = playerPos.y + followHeight;

      this.camera.position.lerp(camTargetPos, Math.min(1.0, dt * 10));
      this.camera.lookAt(lookTarget);
      this.camera.rotateZ(-steerAngle * 0.035);
    } else if (this.cameraMode === 'HOOD') {
      const hoodPos = playerPos.clone().addScaledVector(tangent, 0.9);
      hoodPos.y = playerPos.y + 1.45 + bounce * 0.05;
      this.camera.position.copy(hoodPos);

      const hoodLookTarget = playerPos.clone().addScaledVector(tangent, 28.0).addScaledVector(normal, steerAngle * 2.0);
      hoodLookTarget.y = playerPos.y + 1.2;
      this.camera.lookAt(hoodLookTarget);
      this.camera.rotateZ(-steerAngle * 0.04);
    } else {
      // Top-down / Bird's Eye helicopter view
      const topPos = playerPos.clone().addScaledVector(horizTangent, -16.0);
      topPos.y = playerPos.y + 22.0;
      this.camera.position.lerp(topPos, Math.min(1.0, dt * 8));
      this.camera.lookAt(playerPos.clone().addScaledVector(tangent, 10.0));
    }

    // 4. Aerodynamic High-Speed Camera Vibration (> 130 km/h)
    if (playerSpeedRatio > 0.75) {
      const jitterIntensity = (playerSpeedRatio - 0.75) * 0.08;
      this.camera.position.x += (Math.random() - 0.5) * jitterIntensity;
      this.camera.position.y += (Math.random() - 0.5) * jitterIntensity;
    }

    // 5. Update 3D Rain Droplets
    if (this.rainPoints && this.rainPoints.visible && this.rainCoords && this.rainGeometry) {
      this.rainPoints.position.set(playerPos.x, playerPos.y, playerPos.z);
      const posAttr = this.rainGeometry.attributes.position;
      const arr = posAttr.array as Float32Array;
      const count = arr.length / 3;

      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] -= dt * 65;
        if (arr[i * 3 + 1] < 0) {
          arr[i * 3 + 1] = 45;
        }
      }
      posAttr.needsUpdate = true;
    }
  }

  public triggerLightning() {
    const origIntensity = this.ambientLight.intensity;
    this.ambientLight.intensity = 3.5;
    setTimeout(() => {
      this.ambientLight.intensity = origIntensity;
    }, 90);
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }
}
