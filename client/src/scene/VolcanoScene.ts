import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SceneHandle, VolcanoConfig } from './types';

function createLabel(text: string, position: THREE.Vector3): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'rgba(15, 23, 42, 0.86)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#38bdf8';
  context.lineWidth = 6;
  context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  context.fillStyle = '#e2e8f0';
  context.font = 'bold 42px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(1.9, 0.48, 1);
  return sprite;
}

function createVolcano(config: VolcanoConfig): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];
  const mountainMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b4f3a,
    roughness: 0.9,
  });
  const volcano = new THREE.Mesh(new THREE.ConeGeometry(1.9, 3.2, 48, 1, true), mountainMaterial);
  volcano.position.set(-2.1, 0.6, 0);
  objects.push(volcano);

  const crater = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.08, 12, 48),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.75 })
  );
  crater.position.set(-2.1, 2.22, 0);
  crater.rotation.x = Math.PI / 2;
  objects.push(crater);

  const vent = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.26, 2.2, 20),
    new THREE.MeshStandardMaterial({
      color: 0xff3b1f,
      emissive: 0xff2600,
      emissiveIntensity: 0.8 + config.eruptionLevel * 0.25,
    })
  );
  vent.position.set(-2.1, 1.1, 0);
  objects.push(vent);

  const lava = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16 + config.eruptionLevel * 0.08, 0.1, 0.5 + config.eruptionLevel * 0.35, 24),
    new THREE.MeshStandardMaterial({
      color: 0xff6b1a,
      emissive: 0xff4d00,
      emissiveIntensity: 1.1 + config.eruptionLevel * 0.35,
    })
  );
  lava.position.set(-2.1, 2.45 + config.eruptionLevel * 0.14, 0);
  objects.push(lava);

  const flow = new THREE.Mesh(
    new THREE.BoxGeometry(0.28 + config.eruptionLevel * 0.12, 0.09, 2.2),
    new THREE.MeshStandardMaterial({
      color: 0xff5f1f,
      emissive: 0xff2a00,
      emissiveIntensity: 0.85,
    })
  );
  flow.position.set(-1.65, 0.65, 0.72);
  flow.rotation.x = -0.55;
  flow.rotation.z = -0.18;
  objects.push(flow);

  for (let i = 0; i < config.eruptionLevel * 7; i += 1) {
    const ash = new THREE.Mesh(
      new THREE.SphereGeometry(0.055 + (i % 3) * 0.015, 10, 10),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0x64748b : 0xf97316,
        emissive: i % 2 === 0 ? 0x000000 : 0xff4500,
        emissiveIntensity: i % 2 === 0 ? 0 : 0.75,
      })
    );
    const angle = i * 1.7;
    const radius = 0.22 + (i % 5) * 0.11;
    ash.position.set(
      -2.1 + Math.cos(angle) * radius,
      2.8 + i * 0.08,
      Math.sin(angle) * radius
    );
    objects.push(ash);
  }

  if (config.showLabels) {
    objects.push(createLabel('Crater', new THREE.Vector3(-2.9, 2.7, 0)));
    objects.push(createLabel('Lava Flow', new THREE.Vector3(-0.7, 1.1, 1.25)));
    objects.push(createLabel('Magma Vent', new THREE.Vector3(-3.2, 1.1, -0.45)));
  }

  return objects;
}

function createEarthLayers(showLabels: boolean): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];
  const layers = [
    { name: 'Inner Core', radius: 0.42, color: 0xfacc15, x: 2.25 },
    { name: 'Outer Core', radius: 0.72, color: 0xfb923c, x: 2.25 },
    { name: 'Mantle', radius: 1.05, color: 0xef4444, x: 2.25 },
    { name: 'Crust', radius: 1.25, color: 0x22c55e, x: 2.25 },
  ];

  layers
    .slice()
    .reverse()
    .forEach((layer) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(layer.radius, layer.radius, 0.18, 64),
        new THREE.MeshStandardMaterial({ color: layer.color, roughness: 0.55 })
      );
      mesh.position.set(layer.x, 1.1, 0);
      mesh.rotation.x = Math.PI / 2;
      objects.push(mesh);
    });

  const cutaway = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 2.8, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 1 })
  );
  cutaway.position.set(1.55, 1.1, 0.02);
  objects.push(cutaway);

  if (showLabels) {
    objects.push(createLabel('Crust', new THREE.Vector3(3.7, 2.35, 0)));
    objects.push(createLabel('Mantle', new THREE.Vector3(3.8, 1.7, 0)));
    objects.push(createLabel('Outer Core', new THREE.Vector3(3.9, 1.05, 0)));
    objects.push(createLabel('Inner Core', new THREE.Vector3(3.8, 0.38, 0)));
  }

  return objects;
}

function disposeObject(obj: THREE.Object3D) {
  if (obj instanceof THREE.Mesh) {
    obj.geometry.dispose();
    const material = obj.material;
    if (Array.isArray(material)) {
      material.forEach((mat) => mat.dispose());
    } else {
      material.dispose();
    }
  }

  if (obj instanceof THREE.Sprite) {
    obj.material.map?.dispose();
    obj.material.dispose();
  }
}

export function initVolcanoScene(container: HTMLElement, config: VolcanoConfig): SceneHandle<VolcanoConfig> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08111f);

  const camera = new THREE.PerspectiveCamera(
    48,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0.6, 3.4, 8);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0.2, 1.25, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.42));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(3, 5, 4);
  scene.add(sun);
  const lavaLight = new THREE.PointLight(0xff5a1f, 1.4, 7);
  lavaLight.position.set(-2.1, 2.4, 0);
  scene.add(lavaLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(9, 6),
    new THREE.MeshStandardMaterial({ color: 0x264034, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.02;
  scene.add(ground);

  let labObjects: THREE.Object3D[] = [];

  function clearSceneObjects() {
    labObjects.forEach((obj) => {
      scene.remove(obj);
      disposeObject(obj);
    });
    labObjects = [];
  }

  function applyConfig(nextConfig: VolcanoConfig) {
    clearSceneObjects();
    const focusArea = nextConfig.focusArea ?? 'both';
    if (focusArea === 'volcano' || focusArea === 'both') {
      labObjects.push(...createVolcano(nextConfig));
    }
    if (focusArea === 'earth_layers' || focusArea === 'both') {
      labObjects.push(...createEarthLayers(nextConfig.showLabels));
    }
    labObjects.forEach((obj) => scene.add(obj));
  }

  applyConfig(config);

  let animationId = 0;
  let tick = 0;
  function animate() {
    animationId = requestAnimationFrame(animate);
    tick += 0.02;
    lavaLight.intensity = 1.1 + Math.sin(tick * 3) * 0.25 + config.eruptionLevel * 0.2;
    labObjects.forEach((obj, index) => {
      if (obj instanceof THREE.Mesh && obj.geometry instanceof THREE.SphereGeometry) {
        obj.position.y += Math.sin(tick * 2 + index) * 0.0018;
      }
    });
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
    update(nextConfig) {
      if (nextConfig.sceneType === 'volcano') {
        applyConfig(nextConfig);
      }
    },
    dispose() {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      clearSceneObjects();
      scene.remove(ground);
      disposeObject(ground);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
