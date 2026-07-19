import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { SceneHandle, TeachingMaterialConfig } from './types';

function createTextSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.fillStyle = 'rgba(15, 23, 42, 0.9)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#facc15';
  context.lineWidth = 6;
  context.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);
  context.fillStyle = '#f8fafc';
  context.font = 'bold 40px system-ui, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.45, 0.36, 1);
  return sprite;
}

function disposeObject(obj: THREE.Object3D) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach((mat) => mat.dispose());
      } else {
        matDispose(material);
      }
    }

    if (child instanceof THREE.Sprite) {
      child.material.map?.dispose();
      child.material.dispose();
    }

    if (child instanceof THREE.Line) {
      child.geometry.dispose();
      const material = child.material;
      if (Array.isArray(material)) {
        material.forEach((mat) => mat.dispose());
      } else {
        material.dispose();
      }
    }
  });
}

function matDispose(material: THREE.Material) {
  const materialWithMap = material as THREE.Material & { map?: THREE.Texture };
  materialWithMap.map?.dispose();
  material.dispose();
}

function createModelLabels(config: TeachingMaterialConfig): THREE.Object3D[] {
  return config.labels.map((label) => {
    const labelSprite = createTextSprite(label.text);
    const modelPosition = config.modelView?.labelPositions?.[label.text.toLowerCase()];
    if (modelPosition) {
      labelSprite.position.fromArray(modelPosition);
    } else {
      labelSprite.position.set(label.x * 1.8, label.y * 1.4, label.z ?? 1.05);
    }
    return labelSprite;
  });
}

function createFloorShadow(topic: string, y = -1.22): THREE.Mesh {
  const floorShadow = new THREE.Mesh(
    new THREE.CircleGeometry(1.7, 48),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    })
  );
  floorShadow.name = `${topic} viewer shadow`;
  floorShadow.position.set(0, y, 0);
  floorShadow.rotation.x = -Math.PI / 2;
  floorShadow.scale.set(1.45, 0.36, 1);
  return floorShadow;
}

function makeStandard(color: number, roughness = 0.65): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0.02,
  });
}

function makePhysical(color: number, roughness = 0.72): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness,
    metalness: 0.03,
    clearcoat: 0.18,
    clearcoatRoughness: 0.72,
  });
}

function addMesh(group: THREE.Group, mesh: THREE.Mesh, position: [number, number, number], rotation?: [number, number, number]) {
  mesh.position.set(...position);
  if (rotation) {
    mesh.rotation.set(...rotation);
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

function addTube(
  group: THREE.Group,
  points: THREE.Vector3[],
  radius: number,
  material: THREE.Material,
  name: string
) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 12, false), material);
  tube.name = name;
  tube.castShadow = true;
  tube.receiveShadow = true;
  group.add(tube);
}

function createVolcanoModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural volcano model built with Three.js geometry';
  const rock = makeStandard(0x6b7280, 0.86);
  const darkRock = makeStandard(0x262626, 0.9);
  const lava = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    emissive: 0xea580c,
    emissiveIntensity: 0.55,
    roughness: 0.42,
    metalness: 0.02,
  });
  const hotCore = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    emissive: 0xfb923c,
    emissiveIntensity: 0.9,
    roughness: 0.35,
  });
  const smoke = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.95,
    transparent: true,
    opacity: 0.72,
  });

  const profile = [
    new THREE.Vector2(1.35, -1.12),
    new THREE.Vector2(1.08, -0.78),
    new THREE.Vector2(0.82, -0.35),
    new THREE.Vector2(0.55, 0.2),
    new THREE.Vector2(0.36, 0.76),
    new THREE.Vector2(0.48, 0.98),
    new THREE.Vector2(0.22, 1.12),
  ];
  const mountain = new THREE.Mesh(new THREE.LatheGeometry(profile, 72), rock);
  mountain.name = 'lathe volcano cone';
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  group.add(mountain);

  addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.06, 14, 48), darkRock), [0, 1.02, 0], [Math.PI / 2, 0, 0]);
  addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.23, 1.85, 24), lava), [0, 0.08, 0.02]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 14), hotCore), [0, 1.08, 0]);

  addTube(
    group,
    [
      new THREE.Vector3(0.04, 1.02, 0.06),
      new THREE.Vector3(0.28, 0.58, 0.18),
      new THREE.Vector3(0.55, 0.05, 0.22),
      new THREE.Vector3(0.83, -0.55, 0.28),
    ],
    0.07,
    lava,
    'curved lava flow right'
  );
  addTube(
    group,
    [
      new THREE.Vector3(-0.06, 0.98, -0.05),
      new THREE.Vector3(-0.28, 0.46, -0.17),
      new THREE.Vector3(-0.52, -0.18, -0.2),
    ],
    0.055,
    lava.clone(),
    'curved lava flow left'
  );

  const strataMaterial = makeStandard(0x404040, 0.92);
  for (let i = 0; i < 4; i += 1) {
    addMesh(
      group,
      new THREE.Mesh(new THREE.TorusGeometry(0.56 + i * 0.18, 0.012, 8, 80), strataMaterial.clone()),
      [0, 0.58 - i * 0.34, 0],
      [Math.PI / 2, 0, 0]
    );
  }

  for (let i = 0; i < 7; i += 1) {
    addMesh(
      group,
      new THREE.Mesh(new THREE.SphereGeometry(0.16 + i * 0.035, 20, 12), smoke.clone()),
      [Math.sin(i * 1.4) * 0.26, 1.36 + i * 0.16, Math.cos(i * 1.7) * 0.16]
    );
  }

  return group;
}

function createSolarSystemModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural solar system model';
  const sun = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xf59e0b, emissiveIntensity: 1.15 });
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.42, 40, 20), sun), [-1.5, 0, 0]);

  const planets = [
    [0x94a3b8, 0.08, -0.8],
    [0xf97316, 0.1, -0.52],
    [0x3b82f6, 0.12, -0.18],
    [0xef4444, 0.09, 0.15],
    [0xd6a35d, 0.26, 0.65],
    [0xeab308, 0.22, 1.18],
    [0x60a5fa, 0.15, 1.62],
  ] as const;

  planets.forEach(([color, radius, x], index) => {
    addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(radius, 30, 16), makeStandard(color, 0.55)), [x, 0, 0]);
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(Math.abs(x + 1.5), 0.006, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.45 })
    );
    orbit.position.set(-1.5, 0, 0);
    orbit.rotation.x = Math.PI / 2;
    orbit.name = `orbit ${index}`;
    group.add(orbit);
  });

  return group;
}

function createFlowerModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural flower model';
  addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.75, 18), makeStandard(0x15803d)), [0, -0.35, 0]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.18, 30, 16), makeStandard(0xfacc15, 0.5)), [0, 0.65, 0]);

  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 14), makeStandard(0xec4899, 0.58));
    petal.scale.set(0.72, 1.25, 0.16);
    addMesh(group, petal, [Math.cos(angle) * 0.34, 0.65 + Math.sin(angle) * 0.34, 0], [0, 0, angle]);
  }

  const leftLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12), makeStandard(0x22c55e));
  leftLeaf.scale.set(1.3, 0.35, 0.18);
  addMesh(group, leftLeaf, [-0.32, -0.35, 0], [0, 0, 0.45]);

  const rightLeaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12), makeStandard(0x16a34a));
  rightLeaf.scale.set(1.3, 0.35, 0.18);
  addMesh(group, rightLeaf, [0.34, -0.55, 0], [0, 0, -0.45]);

  return group;
}

function createCircuitModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural circuit model';
  const wireMaterial = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35, metalness: 0.35 });
  const batteryMaterial = makeStandard(0x2563eb, 0.48);
  const bulbMaterial = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfacc15,
    emissiveIntensity: 0.65,
    roughness: 0.35,
  });

  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.34), batteryMaterial), [-1.0, 0, 0]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 18), bulbMaterial), [1.0, 0.05, 0]);
  addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.25, 18), makeStandard(0x94a3b8)), [1.0, -0.28, 0]);

  const wireTop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.055, 0.055), wireMaterial);
  addMesh(group, wireTop, [0, 0.48, 0]);
  const wireBottom = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.055, 0.055), wireMaterial.clone());
  addMesh(group, wireBottom, [0, -0.48, 0]);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.95, 0.055), wireMaterial.clone()), [-1.42, 0, 0]);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.95, 0.055), wireMaterial.clone()), [1.42, 0, 0]);

  return group;
}

function createTigerModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural realistic tiger teaching model';
  const fur = makePhysical(0xd97706, 0.82);
  const lightFur = makePhysical(0xfef3c7, 0.88);
  const darkStripe = makePhysical(0x111827, 0.86);
  const nose = makePhysical(0x1f2937, 0.7);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.72, 48, 24), fur);
  body.scale.set(1.75, 0.72, 0.62);
  addMesh(group, body, [0, 0, 0]);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 18), lightFur);
  chest.scale.set(0.7, 0.92, 0.25);
  addMesh(group, chest, [-0.72, -0.02, 0.5]);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 40, 22), fur.clone());
  head.scale.set(1.08, 0.92, 0.92);
  addMesh(group, head, [-1.35, 0.26, 0]);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.2, 28, 14), lightFur.clone());
  muzzle.scale.set(1.1, 0.58, 0.7);
  addMesh(group, muzzle, [-1.68, 0.14, 0]);
  addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.055, 20, 10), nose), [-1.88, 0.18, 0]);

  for (const z of [-0.24, 0.24]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.28, 20), fur.clone());
    addMesh(group, ear, [-1.34, 0.72, z], [0, 0, z > 0 ? -0.35 : 0.35]);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 8), darkStripe.clone());
    addMesh(group, eye, [-1.68, 0.3, z * 0.62]);
  }

  const legPositions: Array<[number, number, number]> = [
    [-0.86, -0.58, -0.34],
    [-0.86, -0.58, 0.34],
    [0.72, -0.58, -0.34],
    [0.72, -0.58, 0.34],
  ];
  legPositions.forEach((position) => {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.62, 8, 16), fur.clone());
    addMesh(group, leg, position, [0, 0, 0.03]);
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 10), lightFur.clone());
    paw.scale.set(1.2, 0.42, 0.86);
    addMesh(group, paw, [position[0] - 0.04, -0.93, position[2]]);
  });

  addTube(
    group,
    [
      new THREE.Vector3(1.2, 0.12, 0),
      new THREE.Vector3(1.62, 0.18, -0.12),
      new THREE.Vector3(1.86, 0.42, -0.28),
      new THREE.Vector3(1.65, 0.66, -0.36),
    ],
    0.075,
    fur.clone(),
    'curved tiger tail'
  );

  for (let i = 0; i < 9; i += 1) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.58, 0.035), darkStripe.clone());
    stripe.scale.y = 0.75 + (i % 3) * 0.18;
    addMesh(group, stripe, [-0.55 + i * 0.18, 0.22 - Math.abs(4 - i) * 0.035, 0.58], [0.05, 0.08, -0.32 + i * 0.04]);
  }
  for (let i = 0; i < 5; i += 1) {
    const faceStripe = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.26, 0.03), darkStripe.clone());
    addMesh(group, faceStripe, [-1.42 - i * 0.045, 0.46 - i * 0.025, 0.34], [0.2, -0.35, 0.75]);
    const mirrored = faceStripe.clone();
    mirrored.material = darkStripe.clone();
    addMesh(group, mirrored, [-1.42 - i * 0.045, 0.46 - i * 0.025, -0.34], [-0.2, 0.35, -0.75]);
  }

  return group;
}

function createMathModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural mathematics teaching model';
  const boardMaterial = makePhysical(0x0f172a, 0.7);
  const lineMaterial = makePhysical(0x38bdf8, 0.55);
  const blockMaterial = makePhysical(0xe0f2fe, 0.62);
  const accentMaterial = makePhysical(0xfacc15, 0.55);

  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.28, 0.08), boardMaterial), [0, 0.18, -0.08]);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.035, 0.04), lineMaterial), [0, -0.23, 0]);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.92, 0.04), lineMaterial.clone()), [-0.72, 0.1, 0]);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.82, -0.08, 0.08),
    new THREE.Vector3(-0.42, 0.1, 0.08),
    new THREE.Vector3(0.02, 0.0, 0.08),
    new THREE.Vector3(0.46, 0.35, 0.08),
    new THREE.Vector3(0.86, 0.52, 0.08),
  ]);
  addTube(group, curve.getPoints(5), 0.025, accentMaterial, 'raised formula curve');

  for (let i = 0; i < 4; i += 1) {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), blockMaterial.clone());
    addMesh(group, cube, [-0.72 + i * 0.28, -0.72, 0.15]);
  }
  addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.018, 10, 80), accentMaterial.clone()), [0.65, -0.62, 0.12], [Math.PI / 2, 0, 0]);
  return group;
}

function createPhysicsModel(topic: string): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural physics teaching model';
  const metal = makePhysical(0x94a3b8, 0.45);
  const accent = makePhysical(0x60a5fa, 0.52);
  const bob = makePhysical(0xfacc15, 0.48);

  if (topic.includes('pendulum')) {
    addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.08), metal), [0, 1.0, 0]);
    addTube(
      group,
      [new THREE.Vector3(0, 0.96, 0), new THREE.Vector3(0.65, -0.45, 0)],
      0.018,
      metal.clone(),
      'pendulum string'
    );
    addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 18), bob), [0.65, -0.45, 0]);
    addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.01, 8, 96), accent), [0, 0.2, 0], [Math.PI / 2, 0, 0]);
    return group;
  }

  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.45, 0.45), accent), [-0.35, -0.2, 0]);
  addTube(group, [new THREE.Vector3(0.25, -0.2, 0), new THREE.Vector3(1.2, -0.2, 0)], 0.035, bob, 'force arrow shaft');
  addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 24), bob.clone()), [1.33, -0.2, 0], [0, 0, -Math.PI / 2]);
  addMesh(group, new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.05), metal.clone()), [0, -0.48, 0], [-Math.PI / 2, 0, 0]);
  return group;
}

function createChemistryModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural chemistry molecule model';
  const atomA = makePhysical(0x38bdf8, 0.5);
  const atomB = makePhysical(0xf472b6, 0.5);
  const bond = makePhysical(0xe2e8f0, 0.4);
  const positions: Array<[number, number, number, THREE.Material]> = [
    [0, 0.18, 0, atomA],
    [-0.62, -0.28, 0, atomB],
    [0.62, -0.28, 0, atomB.clone()],
    [0, 0.78, 0.22, atomB.clone()],
  ];
  positions.forEach(([x, y, z, material]) => {
    addMesh(group, new THREE.Mesh(new THREE.SphereGeometry(0.22, 36, 20), material), [x, y, z]);
  });
  addTube(group, [new THREE.Vector3(0, 0.18, 0), new THREE.Vector3(-0.62, -0.28, 0)], 0.035, bond, 'left bond');
  addTube(group, [new THREE.Vector3(0, 0.18, 0), new THREE.Vector3(0.62, -0.28, 0)], 0.035, bond.clone(), 'right bond');
  addTube(group, [new THREE.Vector3(0, 0.18, 0), new THREE.Vector3(0, 0.78, 0.22)], 0.035, bond.clone(), 'top bond');
  return group;
}

function createGeographyModel(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Procedural geography terrain model';
  const land = makePhysical(0x22c55e, 0.86);
  const water = makePhysical(0x38bdf8, 0.55);
  const mountain = makePhysical(0x78716c, 0.78);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 1.35), land), [0, -0.52, 0]);
  addMesh(group, new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 1.42), water), [0.45, -0.42, 0]);
  addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.95, 5), mountain), [-0.62, 0.0, -0.18]);
  addMesh(group, new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.72, 5), mountain.clone()), [-0.15, -0.1, 0.2]);
  return group;
}

function createGenericModel(config: TeachingMaterialConfig): THREE.Group {
  const group = new THREE.Group();
  group.name = `Procedural ${config.topic} model`;
  addMesh(group, new THREE.Mesh(new THREE.IcosahedronGeometry(0.78, 4), makePhysical(0x38bdf8, 0.68)), [0, 0.2, 0]);
  addMesh(group, new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.025, 12, 96), makePhysical(0xfacc15, 0.56)), [0, 0.2, 0], [Math.PI / 2.8, 0.2, 0.2]);
  addMesh(group, new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.9, 0.08, 64), makePhysical(0x334155, 0.82)), [0, -0.78, 0]);
  return group;
}

function createProceduralObject(config: TeachingMaterialConfig): THREE.Object3D[] {
  const topic = `${config.topic} ${config.subject ?? ''}`.toLowerCase();
  let group: THREE.Group;
  if (topic.includes('volcano')) {
    group = createVolcanoModel();
  } else if (topic.includes('solar') || topic.includes('planet') || topic.includes('space')) {
    group = createSolarSystemModel();
  } else if (topic.includes('flower') || topic.includes('plant')) {
    group = createFlowerModel();
  } else if (topic.includes('tiger') || topic.includes('animal')) {
    group = createTigerModel();
  } else if (topic.includes('circuit') || topic.includes('battery') || topic.includes('electric')) {
    group = createCircuitModel();
  } else if (topic.includes('mathematics') || topic.includes('fraction') || topic.includes('geometry') || topic.includes('probability') || topic.includes('algebra')) {
    group = createMathModel();
  } else if (topic.includes('physics') || topic.includes('pendulum') || topic.includes('force') || topic.includes('motion')) {
    group = createPhysicsModel(topic);
  } else if (topic.includes('chemistry') || topic.includes('atom') || topic.includes('molecule')) {
    group = createChemistryModel();
  } else if (topic.includes('geography') || topic.includes('map') || topic.includes('terrain') || topic.includes('river') || topic.includes('mountain')) {
    group = createGeographyModel();
  } else {
    group = createGenericModel(config);
  }

  group.scale.setScalar(1.08);
  group.rotation.y = -0.35;
  return [createFloorShadow(config.topic), group, ...createModelLabels(config)];
}

async function loadModelObject(config: TeachingMaterialConfig, loader: GLTFLoader): Promise<THREE.Object3D[] | null> {
  if (!config.modelUrl) {
    return null;
  }

  try {
    const gltf = await loader.loadAsync(config.modelUrl);
    const model = gltf.scene;
    model.name = `${config.topic} generated model`;

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const largestSide = Math.max(size.x, size.y, size.z) || 1;
    model.position.sub(center);
    model.scale.setScalar((2.4 / largestSide) * (config.modelView?.scale ?? 1));
    if (config.modelView?.rotation) {
      model.rotation.fromArray(config.modelView.rotation);
    } else {
      model.rotation.y = -0.4;
    }

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return [createFloorShadow(config.topic), model, ...createModelLabels(config)];
  } catch (err) {
    console.warn(`Could not load generated model for ${config.topic}:`, err);
    return null;
  }
}

export function initTeachingMaterialScene(
  container: HTMLElement,
  config: TeachingMaterialConfig
): SceneHandle<TeachingMaterialConfig> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08111f);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.35, 5.6);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.45;
  controls.minDistance = 3.2;
  controls.maxDistance = 7.2;
  controls.target.set(0, 0, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x1e293b, 0.55));
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
  keyLight.position.set(3.5, 4.8, 4.2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 16;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xfef3c7, 0.36);
  fillLight.position.set(-4, 2.5, 2.5);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0x93c5fd, 0.65);
  rimLight.position.set(-3, 2.2, -4);
  scene.add(rimLight);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.22 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.28;
  floor.receiveShadow = true;
  scene.add(floor);

  let sceneObjects: THREE.Object3D[] = [];
  let loadVersion = 0;
  const loader = new GLTFLoader();

  function clearSceneObjects() {
    sceneObjects.forEach((obj) => {
      scene.remove(obj);
      disposeObject(obj);
    });
    sceneObjects = [];
  }

  function applyConfig(nextConfig: TeachingMaterialConfig) {
    loadVersion += 1;
    const currentVersion = loadVersion;
    clearSceneObjects();
    sceneObjects = [];
    if (nextConfig.modelView?.cameraPosition) {
      camera.position.fromArray(nextConfig.modelView.cameraPosition);
    } else {
      camera.position.set(0, 0.35, 5.6);
    }
    if (nextConfig.modelView?.target) {
      controls.target.fromArray(nextConfig.modelView.target);
    } else {
      controls.target.set(0, 0, 0);
    }
    controls.update();
    loadModelObject(nextConfig, loader).then((modelObjects) => {
      if (currentVersion !== loadVersion) {
        modelObjects?.forEach(disposeObject);
        return;
      }

      sceneObjects = modelObjects ?? createProceduralObject(nextConfig);
      sceneObjects.forEach((obj) => scene.add(obj));
    });
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
    update(nextConfig) {
      applyConfig(nextConfig);
    },
    dispose() {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', onResize);
      clearSceneObjects();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    },
  };
}
