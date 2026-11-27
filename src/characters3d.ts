import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
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
loader.setMeshoptDecoder(MeshoptDecoder);

const loadedAvatars: Record<string, GLTF> = {};
const loadAvatarPromises: Record<string, Promise<GLTF>> = {};
let loadedMan: GLTF | null = null;
let loadManPromise: Promise<GLTF> | null = null;

interface BoneTrack {
  bone: THREE.Object3D;
  base: THREE.Quaternion;
  swingAxis: THREE.Vector3;
}

interface AnimatedHuman {
  root: THREE.Object3D;
  role: 'passenger' | 'pedestrian' | 'cyclist';
  phase: number;
  rightArm?: BoneTrack;
  leftArm?: BoneTrack;
  rightForeArm?: BoneTrack;
  leftForeArm?: BoneTrack;
  leftUpLeg?: BoneTrack;
  rightUpLeg?: BoneTrack;
  leftLeg?: BoneTrack;
  rightLeg?: BoneTrack;
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

export function updateHumanAnimations(dt: number): void {
  animTime += dt;
  for (const m of activeMixers) {
    if (m.root.visible) m.mixer.update(dt);
  }
  for (const h of activeHumans) {
    if (!h.root.visible) continue;
    const t = animTime * 3.2 + h.phase;

    if (h.role === 'passenger' && h.rightArm) {
      tmpQuat.setFromAxisAngle(h.rightArm.swingAxis, Math.sin(t * 1.4) * 0.22);
      h.rightArm.bone.quaternion.copy(h.rightArm.base).multiply(tmpQuat);
    } else if (h.role === 'pedestrian') {
      const stride = Math.sin(t) * 0.36;
      const kneeL = Math.max(0, Math.sin(t + 0.7)) * 0.65;
      const kneeR = Math.max(0, Math.sin(t + Math.PI + 0.7)) * 0.65;
      if (h.leftUpLeg) {
        tmpQuat.setFromAxisAngle(h.leftUpLeg.swingAxis, stride);
        h.leftUpLeg.bone.quaternion.copy(h.leftUpLeg.base).multiply(tmpQuat);
      }
      if (h.rightUpLeg) {
        tmpQuat.setFromAxisAngle(h.rightUpLeg.swingAxis, -stride);
        h.rightUpLeg.bone.quaternion.copy(h.rightUpLeg.base).multiply(tmpQuat);
      }
      if (h.leftLeg) {
        tmpQuat.setFromAxisAngle(h.leftLeg.swingAxis, -kneeL);
        h.leftLeg.bone.quaternion.copy(h.leftLeg.base).multiply(tmpQuat);
      }
      if (h.rightLeg) {
        tmpQuat.setFromAxisAngle(h.rightLeg.swingAxis, -kneeR);
        h.rightLeg.bone.quaternion.copy(h.rightLeg.base).multiply(tmpQuat);
      }
      if (h.leftArm) {
        tmpQuat.setFromAxisAngle(h.leftArm.swingAxis, -stride * 0.55);
        h.leftArm.bone.quaternion.copy(h.leftArm.base).multiply(tmpQuat);
      }
      if (h.rightArm) {
        tmpQuat.setFromAxisAngle(h.rightArm.swingAxis, stride * 0.55);
        h.rightArm.bone.quaternion.copy(h.rightArm.base).multiply(tmpQuat);
      }
      if (h.leftForeArm) {
        tmpQuat.setFromAxisAngle(h.leftForeArm.swingAxis, 0.25 + Math.max(0, -stride) * 0.4);
        h.leftForeArm.bone.quaternion.copy(h.leftForeArm.base).multiply(tmpQuat);
      }
      if (h.rightForeArm) {
        tmpQuat.setFromAxisAngle(h.rightForeArm.swingAxis, 0.25 + Math.max(0, stride) * 0.4);
        h.rightForeArm.bone.quaternion.copy(h.rightForeArm.base).multiply(tmpQuat);
      }
    } else if (h.role === 'cyclist') {
      const pL = Math.sin(t * 1.8) * 0.28;
      const pR = Math.sin(t * 1.8 + Math.PI) * 0.28;
      if (h.leftUpLeg) {
        tmpQuat.setFromAxisAngle(h.leftUpLeg.swingAxis, pL);
        h.leftUpLeg.bone.quaternion.copy(h.leftUpLeg.base).multiply(tmpQuat);
      }
      if (h.leftLeg) {
        tmpQuat.setFromAxisAngle(h.leftLeg.swingAxis, -pL * 0.7);
        h.leftLeg.bone.quaternion.copy(h.leftLeg.base).multiply(tmpQuat);
      }
      if (h.rightUpLeg) {
        tmpQuat.setFromAxisAngle(h.rightUpLeg.swingAxis, pR);
        h.rightUpLeg.bone.quaternion.copy(h.rightUpLeg.base).multiply(tmpQuat);
      }
      if (h.rightLeg) {
        tmpQuat.setFromAxisAngle(h.rightLeg.swingAxis, -pR * 0.7);
        h.rightLeg.bone.quaternion.copy(h.rightLeg.base).multiply(tmpQuat);
      }
    }
  }
}

function captureBone(
  root: THREE.Object3D,
  bone: THREE.Object3D | undefined,
  axisInRootSpace: THREE.Vector3
): BoneTrack | undefined {
  if (!bone) return undefined;
  root.updateMatrixWorld(true);
  const rootWorldQ = root.getWorldQuaternion(new THREE.Quaternion());
  const boneWorldQ = bone.getWorldQuaternion(new THREE.Quaternion());
  const localAxis = axisInRootSpace
    .clone()
    .applyQuaternion(rootWorldQ)
    .applyQuaternion(boneWorldQ.invert())
    .normalize();
  return { bone, base: bone.quaternion.clone(), swingAxis: localAxis };
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
  const leftFoot = findBone(clone, 'LeftFoot');
  const rightFoot = findBone(clone, 'RightFoot');
  const spine = findBone(clone, 'Spine');
  const head = findBone(clone, 'Head');

  container.add(clone);

  if (role === 'cyclist') {
    // Sit hips squarely on bicycle saddle (y ≈ 0.90m)
    clone.position.set(0, -0.08, -0.24);

    // Lean torso forward toward handlebars
    aimBoneAt(container, spine, head, new THREE.Vector3(0, 1.38, 0.14));

    // Aim both hands directly onto handlebar grips (±0.22, 0.94, 0.36)
    const leftGrip = new THREE.Vector3(0.22, 0.94, 0.36);
    const rightGrip = new THREE.Vector3(-0.22, 0.94, 0.36);
    aimBoneAt(container, leftArm, leftForeArm, leftGrip);
    aimBoneAt(container, leftForeArm, leftHand, leftGrip);
    aimBoneAt(container, rightArm, rightForeArm, rightGrip);
    aimBoneAt(container, rightForeArm, rightHand, rightGrip);

    // Aim thighs forward to knees and calves down to pedals
    const leftKnee = new THREE.Vector3(0.14, 0.72, 0.24);
    const rightKnee = new THREE.Vector3(-0.14, 0.72, 0.24);
    const leftPedal = new THREE.Vector3(0.14, 0.32, 0.04);
    const rightPedal = new THREE.Vector3(-0.14, 0.32, 0.04);
    aimBoneAt(container, leftUpLeg, leftLeg, leftKnee);
    aimBoneAt(container, leftLeg, leftFoot, leftPedal);
    aimBoneAt(container, rightUpLeg, rightLeg, rightKnee);
    aimBoneAt(container, rightLeg, rightFoot, rightPedal);
  } else {
    // Lower arms naturally to sides using world-space aiming
    const leftSide = new THREE.Vector3(0.24, 0.78, 0.04);
    aimBoneAt(container, leftArm, leftForeArm, leftSide);
    aimBoneAt(container, leftForeArm, leftHand, leftSide);

    if (role === 'passenger') {
      const waveTarget = new THREE.Vector3(-0.34, 1.85, 0.22);
      aimBoneAt(container, rightArm, rightForeArm, waveTarget);
      aimBoneAt(container, rightForeArm, rightHand, waveTarget);
    } else {
      const rightSide = new THREE.Vector3(-0.24, 0.78, 0.04);
      aimBoneAt(container, rightArm, rightForeArm, rightSide);
      aimBoneAt(container, rightForeArm, rightHand, rightSide);
    }
  }

  const rootRight = new THREE.Vector3(1, 0, 0);
  const rootForward = new THREE.Vector3(0, 0, 1);

  activeHumans.add({
    root: container,
    role,
    phase: Math.random() * Math.PI * 2,
    leftArm: captureBone(container, leftArm, rootRight),
    rightArm: captureBone(container, rightArm, role === 'passenger' ? rootForward : rootRight),
    leftForeArm: captureBone(container, leftForeArm, rootRight),
    rightForeArm: captureBone(container, rightForeArm, rootRight),
    leftUpLeg: captureBone(container, leftUpLeg, rootRight),
    rightUpLeg: captureBone(container, rightUpLeg, rootRight),
    leftLeg: captureBone(container, leftLeg, rootRight),
    rightLeg: captureBone(container, rightLeg, rootRight)
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
