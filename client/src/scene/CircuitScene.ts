import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  seriesResistance,
  parallelResistance,
  bulbBrightness,
} from './circuitMath';
import type { CircuitConfig, SceneHandle } from './types';

export type { CircuitConfig } from './types';

function createBattery(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(1.2, 0.6, 0.6);
  const material = new THREE.MeshStandardMaterial({ color: 0x334155 });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(-3, 0, 0);
  return mesh;
}

function createWire(start: THREE.Vector3, end: THREE.Vector3): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(0.04, 0.04, length, 8);
  const material = new THREE.MeshStandardMaterial({ color: 0xfbbf24 });
  const mesh = new THREE.Mesh(geometry, material);

  const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  mesh.position.copy(midpoint);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );
  return mesh;
}

function bulbPositions(count: number, circuitType: 'series' | 'parallel'): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const spacing = 1.4;

  if (circuitType === 'series') {
    for (let i = 0; i < count; i++) {
      positions.push(new THREE.Vector3(-1 + i * spacing, 0, 0));
    }
  } else {
    const rowWidth = (count - 1) * spacing;
    const startX = -rowWidth / 2;
    for (let i = 0; i < count; i++) {
      positions.push(new THREE.Vector3(startX + i * spacing, 0, 1.2));
    }
  }

  return positions;
}

function buildCircuit(
  scene: THREE.Scene,
  config: CircuitConfig
): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = [];
  const bulbs: THREE.Mesh[] = [];
  const wires: THREE.Mesh[] = [];

  const battery = createBattery();
  scene.add(battery);
  meshes.push(battery);

  const positions = bulbPositions(config.numberOfBulbs, config.circuitType);
  const totalResistance =
    config.circuitType === 'series'
      ? seriesResistance(config.resistancePerBulb, config.numberOfBulbs)
      : parallelResistance(config.resistancePerBulb, config.numberOfBulbs);

  const brightness = bulbBrightness(
    config.batteryVoltage,
    totalResistance,
    config.circuitType,
    config.numberOfBulbs
  );

  positions.forEach((pos) => {
    const geometry = new THREE.SphereGeometry(0.35, 24, 24);
    const material = new THREE.MeshStandardMaterial({
      color: 0xfff7ed,
      emissive: new THREE.Color(0xffdd88),
      emissiveIntensity: brightness,
    });
    const bulb = new THREE.Mesh(geometry, material);
    bulb.position.copy(pos);
    scene.add(bulb);
    bulbs.push(bulb);
    meshes.push(bulb);
  });

  const batteryPos = battery.position.clone();
  if (positions.length > 0) {
    wires.push(createWire(batteryPos, positions[0]));
    for (let i = 0; i < positions.length - 1; i++) {
      wires.push(createWire(positions[i], positions[i + 1]));
    }
    const lastPos = positions[positions.length - 1];
    wires.push(createWire(lastPos, new THREE.Vector3(batteryPos.x, batteryPos.y, batteryPos.z + 0.8)));
    wires.push(createWire(new THREE.Vector3(batteryPos.x, batteryPos.y, batteryPos.z + 0.8), batteryPos));
  }

  wires.forEach((wire) => {
    scene.add(wire);
    meshes.push(wire);
  });

  return meshes;
}

export function initCircuitScene(
  container: HTMLElement,
  config: CircuitConfig
): SceneHandle<CircuitConfig> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020617);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 3, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
  keyLight.position.set(4, 6, 4);
  scene.add(keyLight);

  let circuitObjects: THREE.Object3D[] = [];

  function clearCircuit() {
    circuitObjects.forEach((obj) => {
      scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    });
    circuitObjects = [];
  }

  function applyConfig(nextConfig: CircuitConfig) {
    clearCircuit();
    circuitObjects = buildCircuit(scene, nextConfig);
  }

  applyConfig(config);

  let animationId = 0;
  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  return {
    update(nextConfig: CircuitConfig) {
      applyConfig(nextConfig);
    },
    dispose() {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      clearCircuit();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
