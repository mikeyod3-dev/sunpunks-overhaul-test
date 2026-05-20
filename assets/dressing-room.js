// Sun Punks — Dressing Room (Three.js)
// Mannequin built from primitives + a t-shirt and shorts that drop in and fit.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const stage = document.getElementById('stage');
if (!stage) { throw new Error('No #stage element'); }

const W = () => stage.clientWidth;
const H = () => stage.clientHeight;

// ---------- Scene, camera, renderer ----------
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf4ead5, 6, 16);

const camera = new THREE.PerspectiveCamera(34, W() / H(), 0.1, 100);
camera.position.set(0, 1.3, 4.8);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) {
  stage.innerHTML = '<div class="dressing-room__fallback">Your browser doesn’t support WebGL — try a recent Chrome, Safari, or Firefox.</div>';
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(W(), H());
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.appendChild(renderer.domElement);

// ---------- Controls ----------
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.target.set(0, 1.05, 0);
orbit.enableDamping = true;
orbit.dampingFactor = 0.08;
orbit.enablePan = false;
orbit.minDistance = 2.6;
orbit.maxDistance = 7;
orbit.minPolarAngle = Math.PI * 0.18;
orbit.maxPolarAngle = Math.PI * 0.6;
orbit.autoRotate = true;
orbit.autoRotateSpeed = 0.65;

let resumeRotateTimer;
orbit.addEventListener('start', () => {
  orbit.autoRotate = false;
  clearTimeout(resumeRotateTimer);
});
orbit.addEventListener('end', () => {
  resumeRotateTimer = setTimeout(() => { orbit.autoRotate = true; }, 2500);
});

renderer.domElement.addEventListener('dblclick', () => {
  camera.position.set(0, 1.3, 4.8);
  orbit.target.set(0, 1.05, 0);
});

// ---------- Lighting ----------
scene.add(new THREE.HemisphereLight(0xfff5dc, 0xf4ead5, 0.55));
const key = new THREE.DirectionalLight(0xfff2c8, 1.7);
key.position.set(3, 6, 4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.near = 1;
key.shadow.camera.far = 14;
key.shadow.camera.left = -2.5;
key.shadow.camera.right = 2.5;
key.shadow.camera.top = 3;
key.shadow.camera.bottom = -1;
key.shadow.bias = -0.0007;
scene.add(key);
const rim = new THREE.DirectionalLight(0xffb78c, 0.45);
rim.position.set(-4, 3, -3);
scene.add(rim);

// ---------- Floor (turntable) ----------
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(2.4, 64),
  new THREE.MeshStandardMaterial({ color: 0xede0c4, roughness: 0.95 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(2.34, 2.4, 64),
  new THREE.MeshStandardMaterial({ color: 0xe8552c, roughness: 0.4 })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.002;
scene.add(ring);

// ---------- Mannequin ----------
const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbf6e9, roughness: 0.72 });

function meshAt(geo, x, y, z, mat = skinMat) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

const mannequin = new THREE.Group();
mannequin.add(meshAt(new THREE.SphereGeometry(0.16, 32, 24), 0, 1.86, 0));
mannequin.add(meshAt(new THREE.CylinderGeometry(0.07, 0.085, 0.1, 24), 0, 1.7, 0));
mannequin.add(meshAt(new THREE.CylinderGeometry(0.28, 0.34, 0.7, 32), 0, 1.30, 0));
mannequin.add(meshAt(new THREE.SphereGeometry(0.10, 24, 18), 0.34, 1.6, 0));
mannequin.add(meshAt(new THREE.SphereGeometry(0.10, 24, 18), -0.34, 1.6, 0));
mannequin.add(meshAt(new THREE.CylinderGeometry(0.32, 0.30, 0.25, 32), 0, 0.92, 0));
for (const s of [-1, 1]) {
  mannequin.add(meshAt(new THREE.CylinderGeometry(0.07, 0.085, 0.78, 24), s * 0.36, 1.28, 0));
  mannequin.add(meshAt(new THREE.SphereGeometry(0.085, 18, 14), s * 0.36, 0.89, 0));
  mannequin.add(meshAt(new THREE.CylinderGeometry(0.10, 0.11, 0.86, 24), s * 0.14, 0.42, 0));
}
const stand = new THREE.Mesh(
  new THREE.CylinderGeometry(0.04, 0.05, 0.02, 24),
  new THREE.MeshStandardMaterial({ color: 0x1b2a3a, roughness: 0.4 })
);
stand.position.y = 0.011; stand.receiveShadow = true;
scene.add(stand);
scene.add(mannequin);

// ---------- Graphic canvas ----------
function makeGraphic(kind) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 512, 512);
  if (kind === 'none') return new THREE.CanvasTexture(c);

  if (kind === 'tribal') {
    ctx.strokeStyle = '#1b2a3a';
    ctx.lineWidth = 12;
    // concentric triangles + dots
    for (let r = 60; r <= 200; r += 35) {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / 3);
        const x = 256 + Math.cos(a) * r;
        const y = 256 + Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    ctx.fillStyle = '#e8552c';
    for (let i = 0; i < 8; i++) {
      const a = i * (Math.PI / 4);
      ctx.beginPath();
      ctx.arc(256 + Math.cos(a) * 230, 256 + Math.sin(a) * 230, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }

  // sun disc
  ctx.fillStyle = '#f7d24c';
  ctx.beginPath();
  ctx.arc(256, 215, 130, 0, Math.PI * 2);
  ctx.fill();
  // sun rays
  ctx.strokeStyle = '#f7d24c';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.1;
    const x1 = 256 + Math.cos(a) * 148, y1 = 215 + Math.sin(a) * 148;
    const x2 = 256 + Math.cos(a) * 188, y2 = 215 + Math.sin(a) * 188;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  // text
  ctx.fillStyle = '#1b2a3a';
  ctx.font = 'bold 80px Anton, Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SUN', 256, 200);
  ctx.fillText('PUNKS', 256, 275);

  if (kind === 'usa') {
    ctx.strokeStyle = '#e8552c';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(80, 360); ctx.lineTo(432, 360); ctx.stroke();
    ctx.fillStyle = '#1f8a8f';
    ctx.font = 'bold 32px Anton, Impact, sans-serif';
    ctx.fillText('STARS · SUNSETS · 30A', 256, 395);
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// ---------- Real-shirt texture (pulled from sunpunksclothing.com) ----------
const realShirtTexture = new THREE.TextureLoader().load(
  'assets/shirt-graphics/sun-punks-irl.jpg',
  (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; }
);

// ---------- T-shirt ----------
const shirtGroup = new THREE.Group();
shirtGroup.userData.baseY = 0;
const shirtMat = new THREE.MeshStandardMaterial({ color: 0xfbf6e9, roughness: 0.87 });

const shirtBody = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.66, 0.58), shirtMat);
shirtBody.position.y = 1.30; shirtBody.castShadow = true; shirtBody.receiveShadow = true;
shirtGroup.add(shirtBody);
for (const s of [-1, 1]) {
  const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.48), shirtMat);
  sleeve.position.set(s * 0.52, 1.49, 0);
  sleeve.castShadow = true; sleeve.receiveShadow = true;
  shirtGroup.add(sleeve);
}
// graphic plane
let graphicTex = makeGraphic('punks');
const graphicMat = new THREE.MeshStandardMaterial({
  map: graphicTex, transparent: true, roughness: 0.95, alphaTest: 0.05
});
const graphic = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.58), graphicMat);
graphic.position.set(0, 1.30, 0.292);
shirtGroup.add(graphic);
scene.add(shirtGroup);

// ---------- Shorts ----------
const shortsGroup = new THREE.Group();
shortsGroup.userData.baseY = 0;
const shortsMat = new THREE.MeshStandardMaterial({ color: 0x1b2a3a, roughness: 0.85 });

const waist = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 0.58), shortsMat);
waist.position.y = 0.88; waist.castShadow = true;
shortsGroup.add(waist);
for (const s of [-1, 1]) {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.48), shortsMat);
  leg.position.set(s * 0.18, 0.56, 0);
  leg.castShadow = true;
  shortsGroup.add(leg);
}
// drawstring detail
const string = new THREE.Mesh(
  new THREE.TorusGeometry(0.04, 0.012, 8, 16),
  new THREE.MeshStandardMaterial({ color: 0xfbf6e9, roughness: 0.6 })
);
string.position.set(0, 1.0, 0.3);
shortsGroup.add(string);
scene.add(shortsGroup);

// ---------- Drop animation ----------
const drops = [];
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function flashDrop(group, delay = 0) {
  for (let i = drops.length - 1; i >= 0; i--) {
    if (drops[i].obj === group) drops.splice(i, 1);
  }
  group.position.y = 4;
  group.rotation.z = 0;
  drops.push({ obj: group, start: performance.now() + delay, dur: 900 });
}

function applyDrop(d, now) {
  const t = (now - d.start) / d.dur;
  if (t < 0) { d.obj.position.y = 4; return false; }
  if (t >= 1) {
    d.obj.position.y = d.obj.userData.baseY;
    d.obj.rotation.z = 0;
    return true;
  }
  const e = easeOutBack(Math.max(0, t));
  d.obj.position.y = 4 + (d.obj.userData.baseY - 4) * e;
  // little settling sway near the end
  if (t > 0.7) {
    d.obj.rotation.z = Math.sin((t - 0.7) * 40) * 0.04 * (1 - t);
  }
  return false;
}

flashDrop(shirtGroup, 150);
flashDrop(shortsGroup, 550);

// ---------- Render loop ----------
function loop(now) {
  for (let i = drops.length - 1; i >= 0; i--) {
    if (applyDrop(drops[i], now)) drops.splice(i, 1);
  }
  orbit.update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- Resize ----------
function onResize() {
  camera.aspect = W() / H();
  camera.updateProjectionMatrix();
  renderer.setSize(W(), H());
}
window.addEventListener('resize', onResize);
new ResizeObserver(onResize).observe(stage);

// ---------- UI hooks ----------
function setActive(b) {
  b.parentElement.querySelectorAll('button').forEach(x => x.classList.remove('is-active'));
  b.classList.add('is-active');
}

document.querySelectorAll('[data-shirt-color]').forEach(b => {
  b.addEventListener('click', () => {
    shirtMat.color.set(b.dataset.shirtColor);
    setActive(b);
    flashDrop(shirtGroup);
  });
});
document.querySelectorAll('[data-shorts-color]').forEach(b => {
  b.addEventListener('click', () => {
    shortsMat.color.set(b.dataset.shortsColor);
    setActive(b);
    flashDrop(shortsGroup);
  });
});
document.querySelectorAll('[data-shirt-print]').forEach(b => {
  b.addEventListener('click', () => {
    const kind = b.dataset.shirtPrint;
    const oldTex = graphic.material.map;

    if (kind === 'irl') {
      // Real product photo pulled from sunpunksclothing.com
      graphic.material.map = realShirtTexture;
      graphic.material.transparent = false;
      graphic.material.needsUpdate = true;
      graphic.visible = true;
      if (oldTex && oldTex !== realShirtTexture) oldTex.dispose();
    } else {
      const newTex = makeGraphic(kind);
      graphic.material.map = newTex;
      graphic.material.transparent = true;
      graphic.material.needsUpdate = true;
      graphic.visible = kind !== 'none';
      if (oldTex && oldTex !== newTex && oldTex !== realShirtTexture) oldTex.dispose();
    }

    setActive(b);
    flashDrop(shirtGroup);
  });
});

document.getElementById('replay')?.addEventListener('click', () => {
  flashDrop(shirtGroup, 50);
  flashDrop(shortsGroup, 400);
});
