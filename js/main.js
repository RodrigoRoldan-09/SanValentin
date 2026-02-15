import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { generateHeartSurfacePoints } from './mathUtils.js';

let scene, camera, renderer, controls;
let heartPoints = [];
let particlesGeometry;
let particlesMaterial;
let particlesSystem;
let clock;
let animationIndex = 0;
let animationSpeed = 50;

// --- Funciones UI Globales ---
window.toggleMusic = function () {
    const audio = document.getElementById('bg-music');
    if (audio.paused) {
        audio.play().catch(e => alert("Por favor, interactúa con la página primero para reproducir audio (política de navegadores)."));
    } else {
        audio.pause();
    }
}

window.openModal = function (id) {
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('show');
    if (id === 'gallery-modal') {
        showSlides(slideIndex);
    }
}

window.closeModal = function (id) {
    document.getElementById(id).classList.remove('show');
    document.getElementById(id).classList.add('hidden');
}

// --- Galería Slider ---
let slideIndex = 1;
window.plusSlides = function (n) {
    showSlides(slideIndex += n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("slide");
    if (slides.length === 0) return;

    if (n > slides.length) { slideIndex = 1 }
    if (n < 1) { slideIndex = slides.length }

    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    slides[slideIndex - 1].style.display = "block";
}

// --- ThreeJS Init ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 4);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.material.opacity = 0.3;
    axesHelper.material.transparent = true;
    scene.add(axesHelper);

    const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    console.log("Generando puntos...");
    const rawPoints = generateHeartSurfacePoints(20000);
    rawPoints.sort((a, b) => a.y - b.y);
    heartPoints = rawPoints;

    particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(heartPoints.length * 3);
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setDrawRange(0, 0);

    const sprite = new THREE.TextureLoader().load('https://threejs.org/examples/textures/sprites/disc.png');
    particlesMaterial = new THREE.PointsMaterial({
        color: 0xff0040,
        size: 0.06, // Un poco más grande
        map: sprite,
        alphaTest: 0.5,
        transparent: true,
        opacity: 0.9,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });

    particlesSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesSystem);

    // Fondo de estrellas
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 2000;
    const starsPos = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
        starsPos[i] = (Math.random() - 0.5) * 20;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.5 });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    clock = new THREE.Clock();

    window.addEventListener('resize', onWindowResize);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();

    const time = Date.now() * 0.001;
    const scale = 1 + Math.sin(time * 5) * 0.05 + Math.sin(time * 15) * 0.02;
    if (particlesSystem) {
        particlesSystem.scale.set(scale, scale, scale);
    }

    if (animationIndex < heartPoints.length) {
        const positions = particlesSystem.geometry.attributes.position.array;
        let count = 0;
        while (count < animationSpeed && animationIndex < heartPoints.length) {
            const p = heartPoints[animationIndex];
            positions[animationIndex * 3] = p.x;
            positions[animationIndex * 3 + 1] = p.y;
            positions[animationIndex * 3 + 2] = p.z;
            animationIndex++;
            count++;
        }
        particlesSystem.geometry.setDrawRange(0, animationIndex);
        particlesSystem.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}

init();
