import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const RIGGED_AVATAR_PATHS = [
  '/models/Black_M_1_Casual.glb',
  '/models/Black_M_2_Busi.glb',
  '/models/Black_M_3_Util.glb',
  '/models/Black_F_1_Casual.glb',
  '/models/Black_F_2_Busi.glb',
  '/models/Black_F_3_Casual.glb',
  '/models/Michelle.glb'
] as const;

const CESIUM_MAN_PATH = '/models/CesiumMan.glb';

const loader = new GLTFLoader();
const loadedAvatars: Record<string, GLTF> = {};
const loadAvatarPromises: Record<string, Promise<GLTF>> = {};
let loadedMan: GLTF | null = null;
let loadManPromise: Promise<GLTF> | null = null;

interface AnimatedHuman {
  root: THREE.Object3D;
  role: 'passenger' | 'pedestrian' | 'cyclist';
  phase: number;
  rightArm?: { bone: THREE.Object3D; base: THREE.Quaternion };
  leftArm?: { bone: THREE.Object3D; base: THREE.Quaternion };
  leftUpLeg?: { bone: THREE.Object3D; base: THREE.Quaternion };
  rightUpLeg?: { bone: THREE.Object3D; base: THREE.Quaternion };
  leftLeg?: { bone: THREE.Object3D; base: THREE.Quaternion };
  rightLeg?: { bone: THREE.Object3D; base: THREE.Quaternion };
}

const activeHumans: Set<AnimatedHuman> = new Set();
const activeMixers: Set<{ mixer: THREE.AnimationMixer; root: THREE.Object3D }> = new Set();
let animTime = 0;

function findBone(root: THREE.Object3D, suffix: string): THREE.Object3D | undefined {
  let found: THREE.Object3D | undefined;
  root.traverse(obj => {
    if (
      !found &&
      (obj.name === suffix || obj.name === `mixamorig${suffix}` || obj.name === `mixamorig:${suffix}`)
    ) {
      found = obj;
    }
  });
  return found;
}

function loadAvatar(path: string): Promise<GLTF> {
  if (loadedAvatars[path]) return Promise.resolve(loadedAvatars[path]);
  if (!loadAvatarPromises[path]) {
    loadAvatarPromises[path] = loader.loadAsync(path).then(gltf => {
      loadedAvatars[path] = gltf;
      return gltf;
    });
  }
  return loadAvatarPromises[path];
}

function loadMan(): Promise<GLTF> {
  if (loadedMan) return Promise.resolve(loadedMan);
  if (!loadManPromise) {
    loadManPromise = loader.loadAsync(CESIUM_MAN_PATH).then(gltf => {
      loadedMan = gltf;
      return gltf;
    });
  }
  return loadManPromise;
}

export function preloadHumanCharacters(): void {
  for (const path of RIGGED_AVATAR_PATHS) {
    void loadAvatar(path);
  }
  void loadMan();
}

export function clearHumanAnimations(): void {
  activeHumans.clear();
  for (const m of activeMixers) {
    m.mixer.stopAllAction();
  }
  activeMixers.clear();
}

const tmpQuat = new THREE.Quaternion();
const xAxis = new THREE.Vector3(1, 0, 0);
const zAxis = new THREE.Vector3(0, 0, 1);

export function updateHumanAnimations(dt: number): void {
  animTime += dt;
  for (const m of activeMixers) {
    if (m.root.visible) m.mixer.update(dt);
  }
  for (const h of activeHumans) {
    if (!h.root.visible) continue;
    const t = animTime * 4.5 + h.phase;

    if (h.role === 'passenger' && h.rightArm) {
      tmpQuat.setFromAxisAngle(zAxis, Math.sin(t * 1.4) * 0.22);
      h.rightArm.bone.quaternion.copy(h.rightArm.base).multiply(tmpQuat);
    } else if (h.role === 'pedestrian') {
      const stride = Math.sin(t) * 0.38;
      if (h.leftUpLeg) {
        tmpQuat.setFromAxisAngle(xAxis, stride);
        h.leftUpLeg.bone.quaternion.copy(h.leftUpLeg.base).multiply(tmpQuat);
      }
      if (h.rightUpLeg) {
        tmpQuat.setFromAxisAngle(xAxis, -stride);
        h.rightUpLeg.bone.quaternion.copy(h.rightUpLeg.base).multiply(tmpQuat);
      }
      if (h.leftArm) {
        tmpQuat.setFromAxisAngle(xAxis, -stride * 0.55);
        h.leftArm.bone.quaternion.copy(h.leftArm.base).multiply(tmpQuat);
      }
      if (h.rightArm) {
        tmpQuat.setFromAxisAngle(xAxis, stride * 0.55);
        h.rightArm.bone.quaternion.copy(h.rightArm.base).multiply(tmpQuat);
      }
    } else if (h.role === 'cyclist') {
      const pL = Math.sin(t * 1.8) * 0.28;
      const pR = Math.sin(t * 1.8 + Math.PI) * 0.28;
      if (h.leftUpLeg) {
        tmpQuat.setFromAxisAngle(xAxis, pL);
        h.leftUpLeg.bone.quaternion.copy(h.leftUpLeg.base).multiply(tmpQuat);
      }
      if (h.leftLeg) {
        tmpQuat.setFromAxisAngle(xAxis, -pL * 0.65);
        h.leftLeg.bone.quaternion.copy(h.leftLeg.base).multiply(tmpQuat);
      }
      if (h.rightUpLeg) {
        tmpQuat.setFromAxisAngle(xAxis, pR);
        h.rightUpLeg.bone.quaternion.copy(h.rightUpLeg.base).multiply(tmpQuat);
      }
      if (h.rightLeg) {
        tmpQuat.setFromAxisAngle(xAxis, -pR * 0.65);
        h.rightLeg.bone.quaternion.copy(h.rightLeg.base).multiply(tmpQuat);
      }
    }
  }
}

function captureBase(bone?: THREE.Object3D) {
  return bone ? { bone, base: bone.quaternion.clone() } : undefined;
}

function aimBoneAt(
  root: THREE.Object3D,
  bone: THREE.Object3D | undefined,
  child: THREE.Object3D | undefined,
  targetInRootSpace: THREE.Vector3
) {
  if (!bone || !child || !bone.parent) return;
  root.updateMatrixWorld(true);
  const p0 = bone.getWorldPosition(new THREE.Vector3());
  const p1 = child.getWorldPosition(new THREE.Vector3());
  const targetWorld = targetInRootSpace.clone().applyMatrix4(root.matrixWorld);

  const currentDir = p1.sub(p0).normalize();
  const desiredDir = targetWorld.sub(p0).normalize();
  if (currentDir.lengthSq() < 0.0001 || desiredDir.lengthSq() < 0.0001) return;

  const deltaWorld = new THREE.Quaternion().setFromUnitVectors(currentDir, desiredDir);
  const parentWorldQ = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  const boneWorldQ = bone.getWorldQuaternion(new THREE.Quaternion());
  const newWorldQ = deltaWorld.multiply(boneWorldQ);
  bone.quaternion.copy(parentWorldQ.invert().multiply(newWorldQ));
  root.updateMatrixWorld(true);
}

function attachRiggedHuman(
  container: THREE.Group,
  gltf: GLTF,
  role: 'passenger' | 'pedestrian' | 'cyclist',
  isMichelle: boolean
) {
  const clone = SkeletonUtils.clone(gltf.scene);
  clone.scale.setScalar(role === 'cyclist' ? 0.96 : 1.04);

  // Subtle per-person outfit tint on Michelle; VALID avatars already have unique outfits/skin/hair
  const tint = isMichelle
    ? [0xffffff, 0xdbeafe, 0xfef3c7, 0xfce7f3, 0xdcfce7][Math.floor(Math.random() * 5)]
    : 0xffffff;

  clone.traverse(obj => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      if (tint !== 0xffffff && mesh.material && !Array.isArray(mesh.material)) {
        const clonedMat = (mesh.material as THREE.MeshStandardMaterial).clone();
        clonedMat.color.multiply(new THREE.Color(tint));
        mesh.material = clonedMat;
      }
    }
  });

  const leftArm = findBone(clone, 'LeftArm');
  const rightArm = findBone(clone, 'RightArm');
  const leftForeArm = findBone(clone, 'LeftForeArm');
  const rightForeArm = findBone(clone, 'RightForeArm');
  const leftHand = findBone(clone, 'LeftHand');
  const rightHand = findBone(clone, 'RightHand');
  const leftUpLeg = findBone(clone, 'LeftUpLeg');
  const rightUpLeg = findBone(clone, 'RightUpLeg');
  const leftLeg = findBone(clone, 'LeftLeg');
  const rightLeg = findBone(clone, 'RightLeg');
  const spine = findBone(clone, 'Spine');
  const spine1 = findBone(clone, 'Spine1');

  container.add(clone);

  if (role === 'cyclist') {
    clone.position.set(0, 0.12, -0.26);
    if (spine) spine.rotateX(0.32);
    if (spine1) spine1.rotateX(0.22);

    const leftGrip = new THREE.Vector3(0.22, 0.94, 0.36);
    const rightGrip = new THREE.Vector3(-0.22, 0.94, 0.36);
    aimBoneAt(container, leftArm, leftForeArm, leftGrip);
    aimBoneAt(container, leftForeArm, leftHand, leftGrip);
    aimBoneAt(container, rightArm, rightForeArm, rightGrip);
    aimBoneAt(container, rightForeArm, rightHand, rightGrip);

    if (leftUpLeg) leftUpLeg.rotateX(0.95);
    if (rightUpLeg) rightUpLeg.rotateX(0.95);
    if (leftLeg) leftLeg.rotateX(-1.15);
    if (rightLeg) rightLeg.rotateX(-1.15);
  } else {
    // Lower arms naturally to sides using world-space aiming
    const leftSide = new THREE.Vector3(0.26, 0.78, 0.04);
    aimBoneAt(container, leftArm, leftForeArm, leftSide);
    aimBoneAt(container, leftForeArm, leftHand, leftSide);

    if (role === 'passenger') {
      const waveTarget = new THREE.Vector3(-0.34, 1.85, 0.22);
      aimBoneAt(container, rightArm, rightForeArm, waveTarget);
      aimBoneAt(container, rightForeArm, rightHand, waveTarget);
    } else {
      const rightSide = new THREE.Vector3(-0.26, 0.78, 0.04);
      aimBoneAt(container, rightArm, rightForeArm, rightSide);
      aimBoneAt(container, rightForeArm, rightHand, rightSide);
    }
  }

  activeHumans.add({
    root: container,
    role,
    phase: Math.random() * Math.PI * 2,
    leftArm: captureBase(leftArm),
    rightArm: captureBase(rightArm),
    leftUpLeg: captureBase(leftUpLeg),
    rightUpLeg: captureBase(rightUpLeg),
    leftLeg: captureBase(leftLeg),
    rightLeg: captureBase(rightLeg)
  });
}

function attachCesiumMan(
  container: THREE.Group,
  gltf: GLTF,
  role: 'passenger' | 'pedestrian'
) {
  const clone = SkeletonUtils.clone(gltf.scene);
  clone.scale.setScalar(1.05);

  const outfitTints = [0xffffff, 0xdbeafe, 0xfef3c7, 0xd1fae5, 0xe5e7eb];
  const tint = outfitTints[Math.floor(Math.random() * outfitTints.length)];
  clone.traverse(obj => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      if (tint !== 0xffffff && mesh.material && !Array.isArray(mesh.material)) {
        const clonedMat = (mesh.material as THREE.MeshStandardMaterial).clone();
        clonedMat.color.multiply(new THREE.Color(tint));
        mesh.material = clonedMat;
      }
    }
  });

  container.add(clone);

  if (gltf.animations && gltf.animations.length > 0) {
    const mixer = new THREE.AnimationMixer(clone);
    const action = mixer.clipAction(gltf.animations[0]);
    action.time = Math.random() * gltf.animations[0].duration;
    if (role === 'passenger') {
      action.timeScale = 0.08;
    }
    action.play();
    activeMixers.add({ mixer, root: container });
  }
}

export function createRealHuman3D(role: 'passenger' | 'pedestrian' | 'cyclist'): THREE.Group {
  const container = new THREE.Group();
  const totalPool = RIGGED_AVATAR_PATHS.length + (role === 'cyclist' ? 0 : 1);
  const pick = Math.floor(Math.random() * totalPool);

  if (pick >= RIGGED_AVATAR_PATHS.length) {
    if (loadedMan) {
      attachCesiumMan(container, loadedMan, role as 'passenger' | 'pedestrian');
    } else {
      void loadMan()
        .then(gltf => attachCesiumMan(container, gltf, role as 'passenger' | 'pedestrian'))
        .catch(() => {});
    }
  } else {
    const path = RIGGED_AVATAR_PATHS[pick];
    const isMichelle = path.includes('Michelle');
    const cached = loadedAvatars[path];
    if (cached) {
      attachRiggedHuman(container, cached, role, isMichelle);
    } else {
      void loadAvatar(path)
        .then(gltf => attachRiggedHuman(container, gltf, role, isMichelle))
        .catch(() => {});
    }
  }

  return container;
}
