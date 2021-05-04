import * as THREE from 'three';

let cube;
let h = 0;
const boxHeight = 10;
const startOffset = 100;
const cubes = []
let dir = 1;

const comboPlanes = []

const clock = new THREE.Clock();

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.y = 200;
camera.position.x = -250;
camera.position.z = -250;

const scene = new THREE.Scene();

const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.color.setHSL(0.1, 1, 0.95);
dirLight.position.set(- 1, 1.75, -0.5);
dirLight.position.multiplyScalar(30);
scene.add(dirLight);

dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

const d = 50;

dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;

dirLight.shadow.camera.far = 3500;
dirLight.shadow.bias = - 0.0001;

scene.add(dirLight);

const material = new THREE.MeshPhongMaterial({ color: new THREE.Color(`hsl(${h * 5}, 50%, 50%)`) });

const base = new THREE.Mesh(new THREE.BoxGeometry(100, 500, 100), material);
base.position.y = -255
scene.add(base)

let lastBox = new THREE.Box3(
  new THREE.Vector3(-50, -10, -50),
  new THREE.Vector3(50, 0, 50),
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener('resize', onWindowResize);

window.addEventListener('click', onClick)

spawnBox()

animate();

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function onClick() {
  cutBox()
  spawnBox()
}

function cutBox() {
  const box = new THREE.Box3().setFromObject(cube);
  const oldCenter = new THREE.Vector3()
  lastBox.getCenter(oldCenter)
  const currentCenter = new THREE.Vector3()
  box.getCenter(currentCenter)
  const diff = currentCenter.sub(oldCenter)
  console.log(diff)
  const eps = 0.05
  const oldSize = lastBox.getSize()
  const errorX = Math.abs(diff.x) / oldSize.x
  const errorZ = Math.abs(diff.z) / oldSize.z
  console.log(errorX, errorZ)
  if (errorX <= eps && errorZ <= eps) {
    console.log('wow')
    diff.x = 0
    diff.z = 0

    const geometry = new THREE.PlaneGeometry(oldSize.x + 10, oldSize.z + 10);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    material.transparent = true
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(
      oldCenter.x,
      oldCenter.y + 5,
      oldCenter.z
    )
    plane.rotation.x = Math.PI / 2
    scene.add(plane);
    comboPlanes.push(plane)
  }
  const size = new THREE.Vector3()
  lastBox.getSize(size)
  size.x -= Math.abs(diff.x)
  size.z -= Math.abs(diff.z)

  if (size.x < 0 || size.z < 0) {
    reset()
    return
  }


  const cutCube = new THREE.Mesh(new THREE.BoxGeometry(size.x, boxHeight, size.z), material);
  cutCube.position.set(oldCenter.x + diff.x / 2, cube.position.y, oldCenter.z + diff.z / 2);
  cutCube.material = cube.material.clone()
  scene.add(cutCube);

  cubes.push(cutCube)
  cubes.splice(cubes.indexOf(cube), 1)

  scene.remove(cube)

  lastBox = new THREE.Box3().setFromObject(cutCube);

  document.querySelector('#points').textContent = h
}

function spawnBox() {
  const size = lastBox.getSize()
  const center = lastBox.getCenter()
  const newCube = new THREE.Mesh(new THREE.BoxGeometry(size.x, boxHeight, size.z), material);
  const even = h % 2 == 0
  newCube.position.set(even ? startOffset : center.x, h * boxHeight, !even ? startOffset : center.z);
  newCube.material = material.clone()
  newCube.material.color = new THREE.Color(`hsl(${(h + 1) * 10}, 50%, 50%)`)
  scene.add(newCube);
  cubes.push(newCube)

  cube = newCube

  camera.position.y += boxHeight
  camera.lookAt(new THREE.Vector3(0, boxHeight * h, 0));
  h += 1
}

function reset() {
  cubes.forEach(c => scene.remove(c))
  camera.position.y = 200
  h = 0
  lastBox = new THREE.Box3(
    new THREE.Vector3(-50, -10, -50),
    new THREE.Vector3(50, 0, 50),
  );
  document.querySelector('#points').textContent = h
}

function animate() {

  requestAnimationFrame(animate);

  render();

}

function render() {

  const delta = clock.getDelta();
  const time = clock.getElapsedTime() * 10;

  const axis = h % 2 == 0 ? 'z' : 'x'
  cube.position[axis] += delta * 100 * dir

  if (Math.abs(cube.position[axis]) >= 100) {
    dir = -dir
  }

  cube.position.clamp(
    new THREE.Vector3(-100, Number.NEGATIVE_INFINITY, -100),
    new THREE.Vector3(100, Number.POSITIVE_INFINITY, 100)
  )

  comboPlanes.forEach((plane, i) => {
    if (plane.material.opacity <= 0) {
      comboPlanes.splice(i, 1)
    }
    plane.material.opacity -= delta * 2
  })

  renderer.render(scene, camera);
}