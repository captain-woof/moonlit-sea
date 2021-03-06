import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader"
import { FontLoader } from "three/examples/jsm/loaders/FontLoader"
import { Water } from "three/examples/jsm/objects/Water"
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry"
import { GUI } from 'dat.gui'

// Assets
const sailboatModelGltf = "/models/sailboat/scene.gltf";
const moonTextureImg = "/images/moon.jpg";
const skyTextureImg = "/images/sky.webp";
const fontPath = "/fonts/comfortaa.json"

// Colors
const blueColor = "#513873";
const blueLightColor = "#455377";
const blueDarkColor = "#192e46";
const whiteLightColor = "#98a6bb";
const blackColor = "#000000";
const whiteColor = "#ffffff";

// Globals
let camera = null;
let scene = null;
let renderer = null;
let orbitControls = null;
let canvas = document.querySelector("#scene-canvas");
let sceneAspectRatio = canvas.clientWidth / canvas.clientHeight;
let gltfLoader = null;
let textureLoader = null;
let fontLoader = null;
let sailboatMesh = null;
let seaMesh = null;
let moonMesh = null;
let skyMesh = null;
let creditsMesh = null;
let moonLight = null;
let moonLightHemisphere = null;
let font = null;

// Function to initialise rendering
async function init() {
    // Setting up globals
    camera = new THREE.PerspectiveCamera(60, sceneAspectRatio, 0.1, 20000);
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas });
    orbitControls = new OrbitControls(camera, canvas);
    gltfLoader = new GLTFLoader();
    textureLoader = new THREE.TextureLoader();
    fontLoader = new FontLoader();

    // Modifying camera
    camera.position.set(1, 0.7, 7.8);
    orbitControls.target.set(0, 1.5, 0);
    orbitControls.maxPolarAngle = Math.PI * 0.55;
    orbitControls.enableDamping = true;
    orbitControls.rotateSpeed = 0.8;
    orbitControls.enablePan = false;
    orbitControls.update();

    // Modifying renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Loading textures and models
    let moonTexture = null;
    let skyTexture = null;
    [sailboatMesh, moonTexture, skyTexture, font] = await Promise.all([
        gltfLoader.loadAsync(sailboatModelGltf),
        textureLoader.loadAsync(moonTextureImg),
        textureLoader.loadAsync(skyTextureImg),
        fontLoader.loadAsync(fontPath)
    ])

    // Sailboat    
    sailboatMesh.scene.position.set(0, 0, 0);
    sailboatMesh.scene.scale.set(0.0025, 0.0025, 0.0025);
    sailboatMesh.scene.rotation.set(0, -(Math.PI / 2), 0);
    sailboatMesh.scene.traverse((obj) => {
        obj.receiveShadow = true;
    })
    scene.add(sailboatMesh.scene);

    // Moon
    let moonGeometry = new THREE.SphereGeometry(7, 75, 75);
    let moonMaterial = new THREE.MeshBasicMaterial({
        map: moonTexture
    });
    moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.position.set(-10, 29, -42);
    scene.add(moonMesh);

    // Moonlight
    moonLight = new THREE.PointLight(whiteLightColor, 1, 200, 1.5);
    moonLight.position.set(-10, 29, -42);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(1024 * 2, 1024 * 2);
    scene.add(moonLight);

    // Moonlight hemisphere
    moonLightHemisphere = new THREE.HemisphereLight(whiteLightColor, blueDarkColor, 0.3);
    moonLightHemisphere.position.set(0, 3, 0);
    scene.add(moonLightHemisphere);

    // Sky
    let skyGeometry = new THREE.SphereGeometry(10000, 200, 200, 0);
    skyTexture.wrapS = skyTexture.wrapT = THREE.MirroredRepeatWrapping;
    skyTexture.repeat.set(6, 6);
    let skyMaterial = new THREE.MeshBasicMaterial({
        map: skyTexture,
        side: THREE.BackSide
    });
    skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
    skyMesh.rotation.set(2.7, 0, 0);
    scene.add(skyMesh);

    // Sea
    let seaGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
    let waterTexture = await textureLoader.loadAsync("/images/water.jpg");
    waterTexture.wrapS = waterTexture.wrapT = THREE.RepeatWrapping;
    seaMesh = new Water(seaGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: waterTexture,
        sunDirection: new THREE.Vector3(-10, 29, -42),
        sunColor: blackColor,
        waterColor: blueDarkColor,
        distortionScale: 3
    });
    seaMesh.rotation.set(-(Math.PI / 2), 0, 0);
    seaMesh.material.uniforms.size.value = 2;
    seaMesh.receiveShadow = true;
    scene.add(seaMesh);

    // Credits
    let creditGeometry = new TextGeometry("Created by Sohail", {
        font: font,
        size: 2.5,
        height: 0.5
    });
    let creditMaterial = new THREE.MeshPhongMaterial({ color: whiteColor });
    creditsMesh = new THREE.Mesh(creditGeometry, creditMaterial);
    creditsMesh.position.set(25, 0, 27);
    creditsMesh.rotation.set(0, Math.PI, 0);
    scene.add(creditsMesh);

    // Setting gui (Only for Dev env)
    if (import.meta.env.DEV) {
        const gui = new GUI({ closed: true });
        gui.domElement.parentElement.classList.add("hover-on-top");

        let cameraFolder = gui.addFolder("Camera");
        let cameraPositionFolder = cameraFolder.addFolder("position");
        cameraPositionFolder.add(camera.position, "x", -50, 50).listen();
        cameraPositionFolder.add(camera.position, "y", -50, 50).listen();
        cameraPositionFolder.add(camera.position, "z", -50, 50).listen();
        let seaMeshFolder = gui.addFolder("Sea");
        let seaMeshRotationFolder = seaMeshFolder.addFolder("rotation");
        seaMeshRotationFolder.add(seaMesh.rotation, "x", -Math.PI, Math.PI).listen();
        seaMeshRotationFolder.add(seaMesh.rotation, "y", -Math.PI, Math.PI).listen();
        seaMeshRotationFolder.add(seaMesh.rotation, "z", -Math.PI, Math.PI).listen();
        let sailboatMeshFolder = gui.addFolder("Sailboat");
        let seaboatMeshRotationFolder = sailboatMeshFolder.addFolder("rotation");
        seaboatMeshRotationFolder.add(sailboatMesh.scene.rotation, "x", -3, 3).listen();
        seaboatMeshRotationFolder.add(sailboatMesh.scene.rotation, "y", -3, 3).listen();
        seaboatMeshRotationFolder.add(sailboatMesh.scene.rotation, "z", -3, 3).listen();
        let moonMeshFolder = gui.addFolder("Moon");
        let moonMeshPositionFolder = moonMeshFolder.addFolder("Position");
        moonMeshPositionFolder.add(moonMesh.position, "x", -45, 45).listen();
        moonMeshPositionFolder.add(moonMesh.position, "y", -45, 45).listen();
        moonMeshPositionFolder.add(moonMesh.position, "z", -45, 45).listen();
        let moonLightHemisphereFolder = gui.addFolder("Moonlight hemisphere");
        let moonLightHemispherePositionFolder = moonLightHemisphereFolder.addFolder("position");
        moonLightHemispherePositionFolder.add(moonLightHemisphere.position, "x", -10, 10).listen();
        moonLightHemispherePositionFolder.add(moonLightHemisphere.position, "y", -10, 10).listen();
        moonLightHemispherePositionFolder.add(moonLightHemisphere.position, "z", -10, 10).listen();
        let skyMeshFolder = gui.addFolder("Sky");
        let skyMeshRotationFolder = skyMeshFolder.addFolder("Rotation");
        skyMeshRotationFolder.add(skyMesh.rotation, "x", -5, 5).listen();
        skyMeshRotationFolder.add(skyMesh.rotation, "y", -5, 5).listen();
        skyMeshRotationFolder.add(skyMesh.rotation, "z", -5, 5).listen();
        let creditsMeshFolder = gui.addFolder("Credits");
        let creditsMeshPositionFolder = creditsMeshFolder.addFolder("position");
        creditsMeshPositionFolder.add(creditsMesh.position, "x", -30, 30);
        creditsMeshPositionFolder.add(creditsMesh.position, "y", -30, 30);
        creditsMeshPositionFolder.add(creditsMesh.position, "z", -30, 30);
        let creditsMeshRotationFolder = creditsMeshFolder.addFolder("rotation");
        creditsMeshRotationFolder.add(creditsMesh.rotation, "x", -10, 10);
        creditsMeshRotationFolder.add(creditsMesh.rotation, "y", -10, 10);
        creditsMeshRotationFolder.add(creditsMesh.rotation, "z", -10, 10);
    }

    // Show canvas
    canvas.classList.add("visible");
}

// Function to start rendering
function start() {
    requestAnimationFrame(start);
    orbitControls.update();
    creditsMesh.position.setY((Math.sin(Date.now() / 600) / 4) - 0.175);
    sailboatMesh.scene.rotateX(Math.sin(Date.now() / 650) / 750);
    sailboatMesh.scene.rotateZ(Math.cos(Date.now() / 650) / 750);
    seaMesh.material.uniforms.time.value += 1 / 50;
    renderer.render(scene, camera);
}

// Function to start listeners
function startListeners() {
    // Listener to keep `windowAspectRatio` updated
    window.addEventListener('resize', () => {
        sceneAspectRatio = (canvas.clientWidth / canvas.clientHeight);
        camera.aspect = sceneAspectRatio;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(sceneAspectRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
    })
}

// Start everything
init().then(() => {
    startListeners();
    start();
});