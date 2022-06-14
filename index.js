import * as THREE from "./js/three.module.js";
import { gui, GUI } from "./js/dat.gui.module.js";
import { OrbitControls } from "./js/OrbitControls.js";
import { TransformControls } from "./js/TransformControls.js";
import { TeapotBufferGeometry } from "./js/TeapotBufferGeometry.js";
import { GLTFLoader } from "./js/GLTFLoader.js";
var camera, scene, renderer, control, orbit;
var mesh, texture;
var raycaster, light, PointLightHelper, meshplan;
var type_material = 3;
var material = new THREE.MeshBasicMaterial({ color: "#327562" });
material.color.needsUpdate = true;

var mouse = new THREE.Vector2();

var loader = new THREE.FontLoader();
var textGeometry = undefined;
loader.load("./js/gentilis_regular.typeface.json", function (font) {
  textGeometry = new THREE.TextGeometry(parameters.mytext, {
    font: font,

    size: 20,
    height: 10,
    curveSegments: 12,

    bevelThickness: 1,
    bevelSize: 1,
    bevelEnabled: true,
  });
});

var textMaterial = new THREE.MeshBasicMaterial({ color: "#327562" });

//var TextGeometry = new THREE.Mesh(textGeometry, textMaterial);
// Geometry
var BoxGeometry = new THREE.BoxGeometry(30, 30, 30, 15, 15, 15);
var SphereGeometry = new THREE.SphereGeometry(15, 50, 50);
var ConeGeometry = new THREE.ConeGeometry(15, 30, 30, 30);
var CylinderGeometry = new THREE.CylinderGeometry(15, 15, 30, 30, 5);
var TorusGeometry = new THREE.TorusGeometry(11, 4, 15, 100);
var TorusKnotGeometry = new THREE.TorusKnotBufferGeometry(9, 3, 100, 10);
var TeapotGeometry = new TeapotBufferGeometry(15, 10);
var DodecahedronGeometry = new THREE.DodecahedronBufferGeometry(16);
var IcosahedronGeometry = new THREE.IcosahedronBufferGeometry(17);
var OctahedronGeometry = new THREE.OctahedronBufferGeometry(15);
var TetrahedronGeometry = new THREE.TetrahedronBufferGeometry(25);
const loader1 = new GLTFLoader();
loader1.load("./model/Soldier.glb", function (gltf) {
  model = gltf.scene;
  scene.add(model);

  model.traverse(function (object) {
    if (object.isMesh) object.castShadow = true;
  });
  skeleton = new THREE.SkeletonHelper(model);
  skeleton.visible = false;
  scene.add(skeleton);

  //

  createPanel();

  //

  const animations = gltf.animations;

  mixer = new THREE.AnimationMixer(model);

  idleAction = mixer.clipAction(animations[0]);
  walkAction = mixer.clipAction(animations[3]);
  runAction = mixer.clipAction(animations[1]);

  actions = [idleAction, walkAction, runAction];

  activateAllActions();

  animate();
});

const points = [];
var twoPi = Math.PI * 2;
for (let i = 0; i < 10; i++) {
  points.push(new THREE.Vector2(Math.sin(i * 0.2) * 10 + 5, (i - 5) * 2));
}
var LatheGeometry = new THREE.LatheBufferGeometry(points, 24, 0, twoPi);
//var TextGeometry = new THREE.TextGeometry(  'Hello, Three.js', fonts);
const parameters = {
  fov: 75,
  near: 0.1,
  far: 1000,
  colorOb: "#327562",
  colorLight: "#dcdcdc",
  mytext: "text",
  update: function () {},
};
var jar;

init();
animate();
//render();

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x343a40);
  //0x343a40
  // Camera
  var camera_x = 0;
  var camera_y = 50;
  var camera_z = 100;
  camera = new THREE.PerspectiveCamera(
    100,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  );
  camera.position.set(camera_x, camera_y, camera_z);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Grid
  var size = 300;
  var divisions = 40;

  var gridHelper = new THREE.GridHelper(size, divisions, 0x888888);
  scene.add(gridHelper);

  //Gui
  displaygui();

  // Renderer
  raycaster = new THREE.Raycaster();
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0x327562, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document
    .getElementById("rendering")
    .addEventListener("mousedown", onMouseDown, false);
  document.getElementById("rendering").appendChild(renderer.domElement);
  window.addEventListener("resize", () => {
    var width = window.innerWidth;
    var height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  });

  orbit = new OrbitControls(camera, renderer.domElement);
  orbit.update();
  orbit.addEventListener("change", render);
  control = new TransformControls(camera, renderer.domElement);
  control.addEventListener("change", render);
  control.addEventListener("dragging-changed", function (event) {
    orbit.enabled = !event.value;
  });
}
//gui
function displaygui() {
  var gui = new GUI();

  var speed = 0.1;

  var fov = gui.add(parameters, "fov").min(0).max(180).step(speed).name("FOV");
  fov.onChange(function (jar) {
    camera.fov = jar;
    camera.updateProjectionMatrix();
  });

  var near = gui
    .add(parameters, "near")
    .min(0.1)
    .max(100)
    .step(speed)
    .name("Near");
  near.onChange(function (jar) {
    camera.near = jar;
    camera.updateProjectionMatrix();
  });

  var far = gui
    .add(parameters, "far")
    .min(200)
    .max(2000)
    .step(speed)
    .name("Far");
  far.onChange(function (jar) {
    camera.far = jar;
    camera.updateProjectionMatrix();
  });

  var color = gui.addColor(parameters, "colorOb").name("Object Color");
  color.onChange(function (jar) {
    mesh.material.color.setHex(jar.replace("#", "0x"));
  });

  var colorLight = gui.addColor(parameters, "colorLight").name("Light Color");
  colorLight.onChange(function (jar) {
    light.color.setHex(jar.replace("#", "0x"));
  });

  var te = gui.addFolder("Text");
  var mytext = te
    .add(parameters, "mytext")
    .name("Type Your Text")
    .onFinishChange(function (jar) {
      loader = new THREE.FontLoader();
      textGeometry = undefined;
      loader.load("./js/gentilis_regular.typeface.json", function (font) {
        textGeometry = new THREE.TextGeometry(jar, {
          font: font,

          size: 20,
          height: 10,
          curveSegments: 12,

          bevelThickness: 1,
          bevelSize: 1,
          bevelEnabled: true,
        });
      });

      textMaterial = new THREE.MeshBasicMaterial({
        color: mesh.material.color,
      });
    });

  te.add(parameters, "update")
    .name("Update")
    .onFinishChange(function () {
      RenderGeo(12);
    });

  gui.open();
}

function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  material.needsUpdate = true;
  renderer.render(scene, camera);
}

// 1. Basic 3D model with points, line and solid
function CloneMesh(dummy_mesh) {
  mesh.name = dummy_mesh.name;
  mesh.position.set(
    dummy_mesh.position.x,
    dummy_mesh.position.y,
    dummy_mesh.position.z
  );
  mesh.rotation.set(
    dummy_mesh.rotation.x,
    dummy_mesh.rotation.y,
    dummy_mesh.rotation.z
  );
  mesh.scale.set(dummy_mesh.scale.x, dummy_mesh.scale.y, dummy_mesh.scale.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  control_transform(mesh);
}
function SetMaterial(mat) {
  mesh = scene.getObjectByName("mesh1");
  light = scene.getObjectByName("pl1");
  type_material = mat;
  //mesh.material.color.needsUpdate=true;
  console.log(mesh.material.color);
  if (mesh) {
    const dummy_mesh = mesh.clone();
    scene.remove(mesh);

    switch (type_material) {
      case 1:
        material = new THREE.PointsMaterial({
          color: mesh.material.color,
          size: 0.5,
        });
        mesh = new THREE.Points(dummy_mesh.geometry, material);
        CloneMesh(dummy_mesh);
        break;
      case 2:
        material = new THREE.MeshBasicMaterial({
          color: mesh.material.color,
          wireframe: true,
        });
        mesh = new THREE.Mesh(dummy_mesh.geometry, material);
        CloneMesh(dummy_mesh);
        break;
      case 3:
        if (!light)
          material = new THREE.MeshBasicMaterial({
            color: mesh.material.color,
          });
        else
          material = new THREE.MeshPhongMaterial({
            color: mesh.material.color,
          });
        mesh = new THREE.Mesh(dummy_mesh.geometry, material);
        CloneMesh(dummy_mesh);
        break;
      case 4:
        if (!light)
          material = new THREE.MeshBasicMaterial({
            color: mesh.material.color,
            map: texture,
            transparent: true,
          });
        else
          material = new THREE.MeshLambertMaterial({
            color: mesh.material.color,
            map: texture,
            transparent: true,
          });
        mesh = new THREE.Mesh(dummy_mesh.geometry, material);
        CloneMesh(dummy_mesh);
        break;
    }
    render();
  }
}
window.SetMaterial = SetMaterial;

function RenderGeo(id) {
  mesh = scene.getObjectByName("mesh1");
  scene.remove(mesh);

  switch (id) {
    case 1:
      mesh = new THREE.Mesh(BoxGeometry, material);
      break;
    case 2:
      mesh = new THREE.Mesh(SphereGeometry, material);
      break;
    case 3:
      mesh = new THREE.Mesh(ConeGeometry, material);
      break;
    case 4:
      mesh = new THREE.Mesh(CylinderGeometry, material);
      break;
    case 5:
      mesh = new THREE.Mesh(TorusGeometry, material);
      break;
    case 6:
      mesh = new THREE.Mesh(loader1);
      break;
    case 7:
      mesh = new THREE.Mesh(TeapotGeometry, material);
      break;
    case 8:
      mesh = new THREE.Mesh(IcosahedronGeometry, material);
      break;
    case 9:
      mesh = new THREE.Mesh(DodecahedronGeometry, material);
      break;
    case 10:
      mesh = new THREE.Mesh(OctahedronGeometry, material);
      break;
    case 11:
      mesh = new THREE.Mesh(TetrahedronGeometry, material);
      break;
    case 12:
      mesh = new THREE.Mesh(textGeometry, textMaterial);
      break;
    case 13:
      mesh = new THREE.Mesh(LatheGeometry, material);
  }
  mesh.name = "mesh1";
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.y = 15;
  scene.add(mesh);
  control_transform(mesh);
  render();
}
window.RenderGeo = RenderGeo;

// 2. Affine
function Translate() {
  control.setMode("translate");
}
window.Translate = Translate;

function Rotate() {
  control.setMode("rotate");
}
window.Rotate = Rotate;

function Scale() {
  control.setMode("scale");
}
window.Scale = Scale;

function control_transform(mesh) {
  control.attach(mesh);
  scene.add(control);
  window.addEventListener("keydown", function (event) {
    switch (event.keyCode) {
      case 84: // T
        Translate();
        break;
      case 82: // R
        Rotate();
        break;
      case 83: // S
        Scale();
        break;
      case 88: // X
        control.showX = !control.showX;
        break;
      case 89: // Y
        control.showY = !control.showY;
        break;
      case 90: // Z
        control.showZ = !control.showZ;
        break;
      case 76: // L
        SetPointLight();
        break;
      case 32: // spacebar
        RemoveLight();
        break;
    }
  });
}

// 3.Light
function MoveLight() {
  let count = 0;
  setInterval(() => {
    light.position.y += Math.sin(count);
    light.position.x += Math.cos(count);
    count += Math.PI / 48;
    console.log(light.position.y);
  }, 500);
  render();
}
window.MoveLight = MoveLight;
function StopMoveLight() {
  setInterval(() => {
    light.position.y = 30;
    light.position.x = 30;
  }, 1);

  render();
}
window.StopMoveLight = StopMoveLight;
function SetPointLight() {
  light = scene.getObjectByName("pl1");
  if (!light) {
    {
      const planeSize = 400;
      const loader = new THREE.TextureLoader();
      const planeGeo = new THREE.PlaneBufferGeometry(planeSize, planeSize);
      const planeMat = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide });
      meshplan = new THREE.Mesh(planeGeo, planeMat);
      meshplan.receiveShadow = true;
      meshplan.rotation.x = Math.PI * -0.5;
      meshplan.position.y += 0.5;
      scene.add(meshplan);
    }

    const intensity = 1.2;
    light = new THREE.PointLight(parameters, intensity, 200);
    light.castShadow = true;
    light.position.x = -20;
    light.position.y = 50;

    light.position.z = 30;
    light.name = "pl1";
    scene.add(light);

    control_transform(light);
    if (type_material == 3 || type_material == 4) {
      SetMaterial(type_material);
    }
    PointLightHelper = new THREE.PointLightHelper(light);
    PointLightHelper.name = "plh1";
    scene.add(PointLightHelper);
    render();
  }
}
window.SetPointLight = SetPointLight;

function RemoveLight() {
  scene.remove(light);
  scene.remove(PointLightHelper);
  scene.remove(meshplan);
  if (type_material == 3 || type_material == 4) {
    SetMaterial(type_material);
  }

  render();
}
window.RemoveLight = RemoveLight;

function onMouseDown(event) {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  // find intersections
  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(scene.children);
  let check_obj = 0;
  if (intersects.length > 0) {
    var obj;
    for (obj in intersects) {
      if (intersects[obj].object.name == "mesh1") {
        check_obj = 1;
        control_transform(intersects[obj].object);
        break;
      }
      if (intersects[obj].object.type == "PointLightHelper") {
        check_obj = 1;
        control_transform(light);
        break;
      }
    }
  }
  if (check_obj == 0 && control.dragging == 0) control.detach();
  render();
}
// 4.Texture
function SetTexture(url) {
  mesh = scene.getObjectByName("mesh1");
  if (mesh) {
    texture = new THREE.TextureLoader().load(url, render);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    SetMaterial(4);
  }
}
window.SetTexture = SetTexture;

// 5. Animation
var mesh = new THREE.Mesh();
var id_animation1,
  id_animation2,
  id_animation3,
  id_animation4,
  id_animation5,
  id_animation6,
  id_animation7;

function Animation1() {
  RemoveAnimation2();
  RemoveAnimation3();
  RemoveAnimation4();
  RemoveAnimation5();
  RemoveAnimation6();
  RemoveAnimation7();
  cancelAnimationFrame(id_animation1);
  mesh.rotation.x += 0.015;
  render();
  id_animation1 = requestAnimationFrame(Animation1);
}
window.Animation1 = Animation1;

function Animation2() {
  RemoveAnimation1();
  RemoveAnimation3();
  RemoveAnimation4();
  RemoveAnimation5();
  RemoveAnimation6();
  RemoveAnimation7();
  cancelAnimationFrame(id_animation2);
  mesh.rotation.y += 0.015;
  render();
  id_animation2 = requestAnimationFrame(Animation2);
}
window.Animation2 = Animation2;

function Animation3() {
  RemoveAnimation1();
  RemoveAnimation2();
  RemoveAnimation4();
  RemoveAnimation5();
  RemoveAnimation6();
  RemoveAnimation7();
  mesh.rotation.x += 0.015;
  mesh.rotation.y += 0.015;
  render();
  id_animation3 = requestAnimationFrame(Animation3);
}
window.Animation3 = Animation3;
const position_x = mesh.position.x;
const position_y = mesh.position.y;
const position_z = mesh.position.z;
var kt = 0;
function Animation4() {
  RemoveAnimation1();
  RemoveAnimation2();
  RemoveAnimation3();
  RemoveAnimation5();
  RemoveAnimation6();
  RemoveAnimation7();

  var positionx = mesh.position.x;
  var positiony = mesh.position.y;
  var positionz = mesh.position.z;
  if (positiony < position_y + 30 && kt == 0) {
    mesh.position.y += 0.3;
  }
  if (positiony > position_y + 30 && positionx < position_x + 30) {
    mesh.position.x += 0.3;
  }
  if (positiony > position_y + 30 && positionx > position_x + 30) kt += 1;
  if (kt > 1 && positiony > position_y) {
    mesh.position.y -= 0.3;
  }
  if (kt > 1 && positiony < position_y && positionx > position_x) {
    mesh.position.x -= 0.3;
  }
  if (positiony < position_y && positionx < position_x) kt = 0;
  render();
  id_animation4 = requestAnimationFrame(Animation4);
}
window.Animation4 = Animation4;

var kt2 = 0;
function Animation5() {
  RemoveAnimation1();
  RemoveAnimation2();
  RemoveAnimation3();
  RemoveAnimation4();
  RemoveAnimation6();
  RemoveAnimation7();

  var positiony = mesh.position.y;
  if (positiony < position_y + 35 && kt2 == 0) {
    mesh.position.y += 0.3;
    mesh.rotation.y += 0.03;
  }
  if (positiony > position_y + 35) kt2 += 1;
  if (kt2 > 1 && positiony > position_y) {
    mesh.position.y -= 0.3;
    mesh.rotation.y += 0.03;
  }
  if (positiony < position_y) kt2 = 0;
  mesh.rotation.x += 0.03;
  render();
  id_animation5 = requestAnimationFrame(Animation5);
}
window.Animation5 = Animation5;

function Animation6() {
  RemoveAnimation1();
  RemoveAnimation2();
  RemoveAnimation3();
  RemoveAnimation4();
  RemoveAnimation5();
  RemoveAnimation7();
  var positiony = mesh.position.y;
  if (positiony < position_y + 30 && kt2 == 0) {
    mesh.position.y += 0.3;
  }
  if (positiony > position_y + 30) kt2 += 1;
  if (kt2 > 1 && positiony > position_y) {
    mesh.position.y -= 0.75;
  }
  if (positiony < position_y) kt2 = 0;
  render();
  id_animation6 = requestAnimationFrame(Animation6);
}
window.Animation6 = Animation6;

function Animation7() {
  RemoveAnimation1();
  RemoveAnimation2();
  RemoveAnimation3();
  RemoveAnimation4();
  RemoveAnimation5();
  RemoveAnimation6();
  var positionz = mesh.position.z;
  if (positionz < position_z + 100 && kt2 == 0) {
    mesh.position.z += 0.3;
    mesh.rotation.x += 0.03;
  }
  if (positionz > position_z + 100) kt2 += 1;
  if (kt2 > 1 && positionz > position_z) {
    mesh.position.z -= 0.3;
    mesh.rotation.x -= 0.03;
  }
  if (positionz < position_z) kt2 = 0;

  render();
  id_animation7 = requestAnimationFrame(Animation7);
}
window.Animation7 = Animation7;

function RemoveAnimation1() {
  cancelAnimationFrame(id_animation1);
}
window.RemoveAnimation1 = RemoveAnimation1;

function RemoveAnimation2() {
  cancelAnimationFrame(id_animation2);
}
window.RemoveAnimation2 = RemoveAnimation2;

function RemoveAnimation3() {
  cancelAnimationFrame(id_animation3);
}
window.RemoveAnimation3 = RemoveAnimation3;

function RemoveAnimation4() {
  cancelAnimationFrame(id_animation4);
}
window.RemoveAnimation4 = RemoveAnimation4;

function RemoveAnimation5() {
  cancelAnimationFrame(id_animation5);
}
window.RemoveAnimation5 = RemoveAnimation5;

function RemoveAnimation6() {
  cancelAnimationFrame(id_animation6);
}
window.RemoveAnimation6 = RemoveAnimation6;

function RemoveAnimation7() {
  cancelAnimationFrame(id_animation7);
}
window.RemoveAnimation7 = RemoveAnimation7;

function RemoveAllAnimation() {
  cancelAnimationFrame(id_animation1);
  cancelAnimationFrame(id_animation2);
  cancelAnimationFrame(id_animation3);
  cancelAnimationFrame(id_animation4);
  cancelAnimationFrame(id_animation5);
  cancelAnimationFrame(id_animation6);
  cancelAnimationFrame(id_animation7);
  mesh.rotation.set(0, 0, 0);
  render();
}
window.RemoveAllAnimation = RemoveAllAnimation;

function ResetAnimation() {
  RemoveAllAnimation();
}
window.ResetAnimation = ResetAnimation;

function Uploadimage() {
  document.getElementById("texture").click();
}
window.Uploadimage = Uploadimage;
