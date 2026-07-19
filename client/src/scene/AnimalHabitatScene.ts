import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { AnimalHabitatConfig, SceneHandle } from './types';

interface AnimalModelPlacement {
  url: string;
  position: THREE.Vector3;
  rotationY: number;
  scale: number;
}

const animalModelPlacements: Record<string, AnimalModelPlacement> = {
  tiger: {
    url: '/models/animals/fox.glb',
    position: new THREE.Vector3(-1.65, -0.82, 0.75),
    rotationY: Math.PI * 0.2,
    scale: 0.018,
  },
  toucan: {
    url: '/models/animals/parrot.glb',
    position: new THREE.Vector3(0.6, 1.55, 1.35),
    rotationY: -Math.PI * 0.35,
    scale: 0.012,
  },
};

function animalKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function createLabel(text: string, position: THREE.Vector3, highlighted = false): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'rgba(15, 23, 42, 0.86)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = highlighted ? '#facc15' : '#22c55e';
  context.lineWidth = 6;
  context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  context.fillStyle = '#ecfccb';
  context.font = 'bold 42px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(1.7, 0.42, 1);
  return sprite;
}

function createTree(x: number, z: number, height: number): THREE.Object3D[] {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.13, height, 10),
    new THREE.MeshStandardMaterial({ color: 0x7c4a2d, roughness: 0.9 })
  );
  trunk.position.set(x, height / 2 - 1, z);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.48 + height * 0.05, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 })
  );
  canopy.position.set(x, height - 0.55, z);

  return [trunk, canopy];
}

function createAnimalMarker(
  name: string,
  position: THREE.Vector3,
  color: number,
  highlighted: boolean
): THREE.Object3D[] {
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 20, 20),
    new THREE.MeshStandardMaterial({
      color,
      emissive: highlighted ? 0xfacc15 : 0x000000,
      emissiveIntensity: highlighted ? 0.45 : 0,
      roughness: 0.7,
    })
  );
  body.position.copy(position);
  body.userData.animalName = name;

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    new THREE.MeshStandardMaterial({
      color,
      emissive: highlighted ? 0xfacc15 : 0x000000,
      emissiveIntensity: highlighted ? 0.45 : 0,
      roughness: 0.7,
    })
  );
  head.position.set(position.x + 0.24, position.y + 0.09, position.z);
  head.userData.animalName = name;

  const label = createLabel(name, new THREE.Vector3(position.x, position.y + 0.55, position.z), highlighted);
  label.userData.animalName = name;

  return [body, head, label];
}

function createPhotoBillboard(
  animalName: string,
  imageUrl: string,
  position: THREE.Vector3,
  highlighted: boolean
): THREE.Group {
  const group = new THREE.Group();
  group.name = `${animalName} photo billboard`;
  group.userData.animalName = animalName;
  group.position.set(position.x, position.y + 0.62, position.z);

  const frame = new THREE.Mesh(
    new THREE.PlaneGeometry(1.02, 0.76),
    new THREE.MeshBasicMaterial({
      color: highlighted ? 0xfacc15 : 0xe2e8f0,
      side: THREE.DoubleSide,
    })
  );
  frame.position.z = -0.01;
  frame.userData.animalName = animalName;
  group.add(frame);

  const photo = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.66),
    new THREE.MeshBasicMaterial({
      color: 0x334155,
      side: THREE.DoubleSide,
    })
  );
  photo.userData.animalName = animalName;
  group.add(photo);

  new THREE.TextureLoader().load(
    imageUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      photo.material.map = texture;
      photo.material.color.set(0xffffff);
      photo.material.needsUpdate = true;
    },
    undefined,
    () => {
      photo.material.color.set(0x475569);
      photo.material.needsUpdate = true;
    }
  );

  return group;
}

function createHabitat(
  config: AnimalHabitatConfig,
  selectedAnimalName: string | null,
  focusTargets: Map<string, THREE.Vector3>
): THREE.Object3D[] {
  const objects: THREE.Object3D[] = [];

  const river = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.04, 5.4),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.2,
      roughness: 0.25,
    })
  );
  river.position.set(1.95, -0.96, 0);
  river.rotation.y = -0.22;
  objects.push(river);

  [
    [-3.1, -1.8, 2.8],
    [-2.55, 1.35, 2.35],
    [-1.55, -0.35, 2.65],
    [0.15, 1.75, 2.2],
    [1.1, -1.55, 2.5],
    [2.8, 1.35, 2.1],
  ].forEach(([x, z, height]) => {
    objects.push(...createTree(x, z, height));
  });

  const vinesMaterial = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.8 });
  for (let i = 0; i < 8; i += 1) {
    const vine = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.2, 6), vinesMaterial);
    vine.position.set(-2.9 + i * 0.75, 0.45 + (i % 3) * 0.18, -1.25 + (i % 2) * 2.25);
    vine.rotation.z = 0.18;
    objects.push(vine);
  }

  const animalPositions = [
    new THREE.Vector3(-1.65, -0.72, 0.75),
    new THREE.Vector3(-2.55, 1.25, -1.2),
    new THREE.Vector3(0.6, 1.55, 1.35),
    new THREE.Vector3(1.55, -0.7, -1.35),
    new THREE.Vector3(2.55, 0.85, 0.85),
  ];
  const markerColors = [0xf97316, 0xa16207, 0xfacc15, 0x22c55e, 0x38bdf8];

  config.animals.slice(0, 5).forEach((animal, index) => {
    const highlighted = animal.name === selectedAnimalName;
    focusTargets.set(animalKey(animal.name), animalPositions[index].clone());
    objects.push(...createAnimalMarker(animal.name, animalPositions[index], markerColors[index], highlighted));
    objects.push(createPhotoBillboard(animal.name, animal.imageUrl, animalPositions[index], highlighted));
  });

  if (config.showLabels) {
    objects.push(createLabel(config.habitatType, new THREE.Vector3(0, 2.55, -1.9)));
    objects.push(createLabel(`${config.climate} climate`, new THREE.Vector3(2.6, 1.65, -1.8)));
  }

  return objects;
}

async function loadAnimalModels(
  config: AnimalHabitatConfig,
  loader: GLTFLoader,
  selectedAnimalName: string | null
): Promise<THREE.Object3D[]> {
  const loadedModels = await Promise.all(
    config.animals.map(async (animal) => {
      const placement = animalModelPlacements[animal.name.toLowerCase()];
      if (!placement) {
        return null;
      }

      try {
        const gltf = await loader.loadAsync(placement.url);
        const model = gltf.scene;
        model.name = `${animal.name} model`;
        model.userData.animalName = animal.name;
        model.position.copy(placement.position);
        model.rotation.y = placement.rotationY;
        model.scale.setScalar(placement.scale);
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData.animalName = animal.name;
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((material) => {
              if ('emissive' in material && animal.name === selectedAnimalName) {
                material.emissive = new THREE.Color(0x4d3b00);
                material.emissiveIntensity = 0.45;
              }
            });
          }
        });
        return model;
      } catch (err) {
        console.warn(`Could not load model for ${animal.name}:`, err);
        return null;
      }
    })
  );

  return loadedModels.filter((model): model is THREE.Group => model !== null);
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach((mat) => mat.dispose());
      } else {
        material.dispose();
      }
    }

    if (child instanceof THREE.Sprite) {
      child.material.map?.dispose();
      child.material.dispose();
    }
  });
}

export function initAnimalHabitatScene(
  container: HTMLElement,
  config: AnimalHabitatConfig,
  onAnimalSelect?: (animalName: string) => void
): SceneHandle<AnimalHabitatConfig> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07140d);
  scene.fog = new THREE.Fog(0x07140d, 6, 13);

  const camera = new THREE.PerspectiveCamera(
    48,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 3.2, 7.4);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.shadowMap.enabled = true;
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.3, 0);

  scene.add(new THREE.AmbientLight(0xd9f99d, 0.45));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(3, 6, 4);
  sun.castShadow = true;
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 6),
    new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1;
  ground.receiveShadow = true;
  scene.add(ground);

  let habitatObjects: THREE.Object3D[] = [];
  let modelLoadVersion = 0;
  let currentConfig = config;
  let selectedAnimalName: string | null = null;
  const focusTargets = new Map<string, THREE.Vector3>();
  const loader = new GLTFLoader();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function clearHabitat() {
    habitatObjects.forEach((obj) => {
      scene.remove(obj);
      disposeObject(obj);
    });
    habitatObjects = [];
  }

  function moveCameraToAnimal(animalName: string) {
    const target = focusTargets.get(animalKey(animalName));
    if (!target) {
      return;
    }

    controls.target.copy(target);
    camera.position.set(target.x + 1.6, target.y + 1.3, target.z + 2.4);
    camera.lookAt(target);
    controls.update();
  }

  function applyConfig(nextConfig: AnimalHabitatConfig) {
    currentConfig = nextConfig;
    modelLoadVersion += 1;
    const currentVersion = modelLoadVersion;
    focusTargets.clear();
    clearHabitat();
    habitatObjects = createHabitat(nextConfig, selectedAnimalName, focusTargets);
    habitatObjects.forEach((obj) => scene.add(obj));

    loadAnimalModels(nextConfig, loader, selectedAnimalName).then((models) => {
      if (currentVersion !== modelLoadVersion) {
        models.forEach(disposeObject);
        return;
      }

      models.forEach((model) => {
        habitatObjects.push(model);
        scene.add(model);
      });
    });
  }

  applyConfig(config);

  function focusAnimal(animalName: string) {
    selectedAnimalName = animalName;
    applyConfig(currentConfig);
    moveCameraToAnimal(animalName);
    onAnimalSelect?.(animalName);
  }

  function onPointerDown(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const hits = raycaster.intersectObjects(habitatObjects, true);
    const animalHit = hits.find((hit) => typeof hit.object.userData.animalName === 'string');
    const animalName = animalHit?.object.userData.animalName;
    if (animalName) {
      focusAnimal(animalName);
    }
  }
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  let animationId = 0;
  let tick = 0;
  function animate() {
    animationId = requestAnimationFrame(animate);
    tick += 0.018;
    habitatObjects.forEach((obj, index) => {
      if (obj instanceof THREE.Sprite) {
        obj.position.y += Math.sin(tick + index) * 0.0008;
      }
      if (obj.userData.animalName && obj instanceof THREE.Group && obj.name.includes('photo billboard')) {
        obj.lookAt(camera.position);
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
      applyConfig(nextConfig);
    },
    focusAnimal,
    dispose() {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      clearHabitat();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      scene.remove(ground);
      disposeObject(ground);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
