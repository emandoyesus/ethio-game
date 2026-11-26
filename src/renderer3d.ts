import * as THREE from 'three';
import type { RouteStage } from './types';

export type CameraMode = 'CHASE' | 'HOOD' | 'TOP_DOWN';

export class Renderer3D {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;

  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;
  public sunLight: THREE.DirectionalLight;
  public terrainMesh: THREE.Mesh;
  public skyDome: THREE.Mesh;
  public mountainRing: THREE.Mesh;
  public celestialDisc: THREE.Mesh;

  private smoothSpeedRatio: number = 0;
  private smoothCamSteerOffset: number = 0;

  public cameraMode: CameraMode = 'CHASE';

  // 3D Weather Particle System
  private rainGeometry: THREE.BufferGeometry | null = null;
  private rainStreaks: THREE.LineSegments | null = null;
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
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // Atmospheric Lighting (Hemisphere bounce + Directional Sun + Ambient fill)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x265c3a, 0.8);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 2.3);
    this.sunLight.position.set(55, 65, 35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.025;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 450;
    this.sunLight.shadow.camera.left = -90;
    this.sunLight.shadow.camera.right = 90;
    this.sunLight.shadow.camera.top = 90;
    this.sunLight.shadow.camera.bottom = -90;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Massive Highland Ground Terrain (Fallback backdrop below road elevation)
    const terrainGeo = new THREE.PlaneGeometry(3600, 3600, 12, 12);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x265c3a, // Rich Ethiopian highland green / acacia savanna
      roughness: 0.95,
      metalness: 0.05
    });
    this.terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    this.terrainMesh.position.y = -1.2;
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // Gradient Sky Dome for natural horizon blending
    const skyGeo = new THREE.SphereGeometry(1500, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        zenith: { value: new THREE.Color() },
        mid: { value: new THREE.Color() },
        horizon: { value: new THREE.Color() },
        night: { value: 0 },
        cloudCover: { value: 0.54 },
        cloudLight: { value: new THREE.Color(0xfff7e7) },
      },
      vertexShader: `
        varying vec3 direction;
        void main() {
          direction = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
        }
      `,
      fragmentShader: `
        varying vec3 direction;
        uniform vec3 zenith, mid, horizon, cloudLight;
        uniform float night, cloudCover;
        float hash(vec2 p) {
          vec3 q = fract(p.xyx * .1031);
          q += dot(q, q.yzx + 33.33);
          return fract((q.x + q.y) * q.z);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3. - 2. * f);
          return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                     mix(hash(i + vec2(0,1)), hash(i + 1.), f.x), f.y);
        }
        void main() {
          vec3 d = normalize(direction);
          float h = max(d.y, 0.);
          vec3 sky = mix(horizon, mid, smoothstep(0., .30, h));
          sky = mix(sky, zenith, smoothstep(.20, .92, h));
          vec2 p = d.xz / (.12 + h) * vec2(3., 5.);
          float vapor = .56 * noise(p) + .29 * noise(p * 2.1) + .15 * noise(p * 4.3);
          float clouds = smoothstep(cloudCover, cloudCover + .19, vapor) * smoothstep(.01,.16,h);
          vec2 stars = d.xz / (1. + h) * 340.;
          float star = smoothstep(.985, 1., hash(floor(stars))) *
                       (1. - smoothstep(.03, .26, length(fract(stars) - .5)));
          sky += vec3(.72,.84,1.) * star * night * smoothstep(.02,.2,h);
          sky = mix(sky, cloudLight, clouds * .74);
          float sun = max(dot(d, normalize(vec3(280.,320.,950.))), 0.);
          sky += cloudLight * pow(sun, 96.) * .55;
          gl_FragColor = vec4(sky, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    });
    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.skyDome.renderOrder = -2;
    this.scene.add(this.skyDome);
    this.updateSkyDomeColors(0x1d4ed8, 0x93c5fd, 0xdbeafe);

    // Distant Entoto Mountain Ridge Ring around Horizon
    const mtnSegs = 64;
    const mtnGeo = new THREE.CylinderGeometry(1150, 1200, 140, mtnSegs, 1, true);
    const mtnPos = mtnGeo.attributes.position;
    for (let i = 0; i < mtnPos.count; i++) {
      const y = mtnPos.getY(i);
      if (y > 0) {
        const angle = Math.atan2(mtnPos.getZ(i), mtnPos.getX(i));
        const ridge = Math.sin(angle * 7) * 32 + Math.cos(angle * 13) * 20 + Math.sin(angle * 23) * 10;
        mtnPos.setY(i, 45 + Math.max(-25, ridge));
      } else {
        mtnPos.setY(i, -40);
      }
    }
    mtnGeo.computeVertexNormals();
    const mtnMat = new THREE.MeshBasicMaterial({
      color: 0x3b6e8c,
      side: THREE.BackSide,
      fog: false
    });
    this.mountainRing = new THREE.Mesh(mtnGeo, mtnMat);
    this.scene.add(this.mountainRing);

    // Glowing Sun / Moon Disc
    const discGeo = new THREE.CircleGeometry(42, 24);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      fog: false,
      depthWrite: false
    });
    this.celestialDisc = new THREE.Mesh(discGeo, discMat);
    this.scene.add(this.celestialDisc);

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

  private updateSkyDomeColors(zenithHex: number, midHex: number, horizonHex: number) {
    const uniforms = (this.skyDome.material as THREE.ShaderMaterial).uniforms;
    uniforms.zenith.value.setHex(zenithHex);
    uniforms.mid.value.setHex(midHex);
    uniforms.horizon.value.setHex(horizonHex);
  }

  public setupStageEnvironment(stage: RouteStage) {
    // A panoramic sky probe gives bodywork, glass and wet asphalt a shared horizon.
    const probe = document.createElement('canvas');
    probe.width = 256;
    probe.height = 128;
    const ctx = probe.getContext('2d')!;
    const palette = stage.skyTheme === 'day' ? ['#5995c6', '#e3eceb', '#787963'] :
      stage.skyTheme === 'sunset' ? ['#746588', '#ffc194', '#705949'] :
      ['#192b43', '#708299', '#292c32'];
    const gradient = ctx.createLinearGradient(0, 0, 0, probe.height);
    gradient.addColorStop(0, palette[0]);
    gradient.addColorStop(0.48, palette[1]);
    gradient.addColorStop(0.55, palette[2]);
    gradient.addColorStop(1, '#242427');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, probe.width, probe.height);
    ctx.fillStyle = palette[2];
    for (let x = 0; x < probe.width; x++) {
      const angle = x * Math.PI * 2 / probe.width;
      const ridge = 63 - 3 * Math.sin(angle * 3) - 2 * Math.cos(angle * 11);
      ctx.fillRect(x, ridge, 1, 73 - ridge);
    }
    const reflection = new THREE.CanvasTexture(probe);
    reflection.colorSpace = THREE.SRGBColorSpace;
    reflection.mapping = THREE.EquirectangularReflectionMapping;
    this.scene.environment?.dispose();
    this.scene.environment = reflection;
    this.scene.environmentIntensity = stage.skyTheme === 'night' ? 0.5 : 0.8;

    const sky = (this.skyDome.material as THREE.ShaderMaterial).uniforms;
    sky.night.value = stage.skyTheme === 'night' ? 1 : 0;
    sky.cloudCover.value = stage.weather === 'rain' ? 0.39 : 0.52;
    sky.cloudLight.value.setHex(stage.skyTheme === 'night' ? 0x455377 :
      stage.skyTheme === 'sunset' ? 0xffc39c : 0xfff7e7);
    if (stage.skyTheme === 'day') {
      this.scene.background = new THREE.Color(0xbfe3ff);
      this.scene.fog = new THREE.FogExp2(0xc7e6ff, 0.0021);
      this.updateSkyDomeColors(0x0284c7, 0x60a5fa, 0xc7e6ff);
      this.ambientLight.color.setHex(0xe0f2fe);
      this.ambientLight.intensity = 0.4;
      this.hemiLight.color.setHex(0x93c5fd);
      this.hemiLight.groundColor.setHex(0x265c3a);
      this.hemiLight.intensity = 0.9;
      this.sunLight.color.setHex(0xfffbeb);
      this.sunLight.intensity = 2.3;
      (this.terrainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x265c3a);
      (this.mountainRing.material as THREE.MeshBasicMaterial).color.setHex(0x4a7c9b);
      (this.celestialDisc.material as THREE.MeshBasicMaterial).color.setHex(0xfef9c3);
    } else if (stage.skyTheme === 'sunset') {
      this.scene.background = new THREE.Color(0xf97316);
      this.scene.fog = new THREE.FogExp2(0xfb923c, 0.0023);
      this.updateSkyDomeColors(0x3b0764, 0xc2410c, 0xfdba74);
      this.ambientLight.color.setHex(0xfed7aa);
      this.ambientLight.intensity = 0.35;
      this.hemiLight.color.setHex(0xfdba74);
      this.hemiLight.groundColor.setHex(0x3b2f1e);
      this.hemiLight.intensity = 0.75;
      this.sunLight.color.setHex(0xfb923c);
      this.sunLight.intensity = 1.9;
      (this.terrainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x3b2f1e);
      (this.mountainRing.material as THREE.MeshBasicMaterial).color.setHex(0x7c2d12);
      (this.celestialDisc.material as THREE.MeshBasicMaterial).color.setHex(0xfb923c);
    } else {
      // Entoto Mountain Night
      this.scene.background = new THREE.Color(0x090d16);
      this.scene.fog = new THREE.FogExp2(0x090d16, 0.0032);
      this.updateSkyDomeColors(0x020617, 0x0f172a, 0x1e293b);
      this.ambientLight.color.setHex(0x1e293b);
      this.ambientLight.intensity = 0.25;
      this.hemiLight.color.setHex(0x38bdf8);
      this.hemiLight.groundColor.setHex(0x061e14);
      this.hemiLight.intensity = 0.45;
      this.sunLight.color.setHex(0x38bdf8);
      this.sunLight.intensity = 0.65;
      (this.terrainMesh.material as THREE.MeshStandardMaterial).color.setHex(0x061e14);
      (this.mountainRing.material as THREE.MeshBasicMaterial).color.setHex(0x0f172a);
      (this.celestialDisc.material as THREE.MeshBasicMaterial).color.setHex(0xe2e8f0);
    }

    if (this.rainStreaks) {
      this.rainStreaks.visible = stage.weather === 'rain' || stage.weather === 'sunshower';
    }
  }

  private initRain() {
    const rainCount = 1500;
    this.rainGeometry = new THREE.BufferGeometry();
    this.rainCoords = new Float32Array(rainCount * 6);

    for (let i = 0; i < rainCount; i++) {
      const start = i * 6;
      const x = (Math.random() - 0.5) * 80;
      const y = Math.random() * 45;
      const z = (Math.random() - 0.5) * 120;
      this.rainCoords.set([x, y, z, x + 0.07, y + 0.45 + Math.random() * 0.4, z], start);
    }

    this.rainGeometry.setAttribute('position', new THREE.BufferAttribute(this.rainCoords, 3));

    const rainMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      depthWrite: false,
      transparent: true,
      opacity: 0.38
    });

    this.rainStreaks = new THREE.LineSegments(this.rainGeometry, rainMat);
    this.rainStreaks.visible = false;
    this.scene.add(this.rainStreaks);
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
    // 1. Keep Terrain, Sky Dome, Mountains, Sun Disc & Sun Light Centered Around Player
    this.terrainMesh.position.set(playerPos.x, playerPos.y - 1.2, playerPos.z);
    this.skyDome.position.copy(playerPos);
    this.mountainRing.position.set(playerPos.x, playerPos.y - 4, playerPos.z);
    this.celestialDisc.position.set(playerPos.x + 280, playerPos.y + 320, playerPos.z + 950);
    this.celestialDisc.lookAt(this.camera.position);

    const shadowCenter = playerPos.clone().addScaledVector(tangent, 25);
    this.sunLight.position.set(shadowCenter.x + 55, shadowCenter.y + 65, shadowCenter.z + 35);
    this.sunLight.target.position.copy(shadowCenter);
    this.sunLight.target.updateMatrixWorld();

    // Smooth camera state parameters (never lag behind the car in world space!)
    this.smoothSpeedRatio += (playerSpeedRatio - this.smoothSpeedRatio) * Math.min(1.0, dt * 6.0);
    this.smoothCamSteerOffset += (steerAngle - this.smoothCamSteerOffset) * Math.min(1.0, dt * 8.0);

    // Gently widen the lens as the vehicle accelerates.
    const targetFov = 57 + this.smoothSpeedRatio * 6 + (isBoosting ? 3 : 0);
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 6.5);
    this.camera.updateProjectionMatrix();

    // 3. Camera Dynamic Following Aligned with Highway Tangent
    const lookAheadDist = 16.0;
    const lookTarget = playerPos.clone().addScaledVector(tangent, lookAheadDist);
    lookTarget.y += 1.3 + bounce * 0.03;

    // Stable horizontal forward vector for camera positioning behind vehicle
    const horizTangent = new THREE.Vector3(tangent.x, 0, tangent.z).normalize();
    if (horizTangent.lengthSq() === 0) horizTangent.set(0, 0, 1);

    if (this.cameraMode === 'CHASE') {
      const followDist = 7.4 + this.smoothSpeedRatio * 1.6 + (isBoosting ? 0.6 : 0);
      const followHeight = 3.2 + bounce * 0.025;
      const camPos = playerPos
        .clone()
        .addScaledVector(horizTangent, -followDist)
        .addScaledVector(normal, -this.smoothCamSteerOffset * 1.1);
      camPos.y = playerPos.y + followHeight;

      this.camera.position.copy(camPos);
      this.camera.lookAt(lookTarget);
      this.camera.rotateZ(-this.smoothCamSteerOffset * 0.03);
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
      const topPos = playerPos.clone().addScaledVector(horizTangent, -14.0);
      topPos.y = playerPos.y + 20.0;
      this.camera.position.copy(topPos);
      this.camera.lookAt(playerPos.clone().addScaledVector(tangent, 10.0));
    }

    // 5. Update 3D Rain Droplets
    if (this.rainStreaks && this.rainStreaks.visible && this.rainCoords && this.rainGeometry) {
      this.rainStreaks.position.set(playerPos.x, playerPos.y, playerPos.z);
      const posAttr = this.rainGeometry.attributes.position;
      const arr = posAttr.array as Float32Array;
      for (let i = 1; i < arr.length; i += 6) {
        const nextY = THREE.MathUtils.euclideanModulo(arr[i] - dt * 65, 45);
        arr[i + 3] += nextY - arr[i];
        arr[i] = nextY;
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
