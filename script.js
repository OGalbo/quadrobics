// ====== 1. Частицы (Canvas) ======
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];
const PARTICLE_COUNT = 150;

function initParticles() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            radius: Math.random() * 2.5 + 1,
            color: `hsl(${Math.random() * 60 + 30}, 70%, 60%)`
        });
    }
}

function drawParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
    });
    requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', initParticles);
initParticles();
drawParticles();

// ====== 2. Three.js 3D анимация ======
import * as THREE from 'three';

const container = document.getElementById('three-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0b1a);

const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
camera.position.set(5, 3, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// Свет
const ambientLight = new THREE.AmbientLight(0x404060);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffd93d, 1);
dirLight.position.set(2, 5, 3);
dirLight.castShadow = true;
scene.add(dirLight);
const backLight = new THREE.DirectionalLight(0x6bcbff, 0.5);
backLight.position.set(-3, 1, -4);
scene.add(backLight);

// Создаём фигуру человека (примитивы)
const group = new THREE.Group();

// Тело (сфера + цилиндр)
const bodyMat = new THREE.MeshStandardMaterial({ color: 0x6bcbff, emissive: 0x1a2a4a, roughness: 0.3, metalness: 0.1 });
const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 8), bodyMat);
body.position.y = 1.0;
group.add(body);

// Голова
const headMat = new THREE.MeshStandardMaterial({ color: 0xffd93d, emissive: 0x3a2a0a, roughness: 0.4 });
const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 16), headMat);
head.position.y = 1.8;
group.add(head);

// Конечности (руки и ноги) - будут анимироваться
const limbMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, emissive: 0x2a0a0a, roughness: 0.5 });

function createLimb(x, y, z, rx, ry, rz, scaleY = 1.2) {
    const limb = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, scaleY, 6), limbMat);
    limb.position.set(x, y, z);
    limb.rotation.set(rx, ry, rz);
    return limb;
}

// Левая рука (передняя)
const armL = createLimb(-0.9, 1.2, 0.2, 0, 0, -0.4);
group.add(armL);
// Правая рука
const armR = createLimb(0.9, 1.2, -0.2, 0, 0, 0.4);
group.add(armR);
// Левая нога (задняя)
const legL = createLimb(-0.5, 0.0, 0.4, 0.2, 0, 0.2, 1.0);
group.add(legL);
// Правая нога
const legR = createLimb(0.5, 0.0, -0.4, -0.2, 0, -0.2, 1.0);
group.add(legR);

// Добавляем пол (прозрачный круг)
const groundMat = new THREE.MeshStandardMaterial({ color: 0x2a2a4a, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
const ground = new THREE.Mesh(new THREE.RingGeometry(1.5, 2.5, 32), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.2;
group.add(ground);

scene.add(group);

// Анимация вращения и покачивания
let time = 0;

function animate3D() {
    time += 0.02;
    // Вращение всей группы
    group.rotation.y += 0.005;
    // Анимация конечностей (имитация бега)
    const swing = Math.sin(time * 2) * 0.6;
    const swing2 = Math.sin(time * 2 + Math.PI) * 0.6;
    armL.rotation.z = -0.4 + swing * 0.3;
    armR.rotation.z = 0.4 + swing2 * 0.3;
    legL.rotation.x = 0.2 + swing * 0.2;
    legR.rotation.x = -0.2 + swing2 * 0.2;
    // Покачивание головы
    head.rotation.z = Math.sin(time * 1.5) * 0.05;
    head.rotation.x = Math.sin(time * 1.2) * 0.05;

    renderer.render(scene, camera);
    requestAnimationFrame(animate3D);
}

animate3D();

// Адаптация 3D при изменении размера
window.addEventListener('resize', () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});

// ====== 3. Симулятор тренировки ======
let steps = 0;
let calories = 0;
let seconds = 0;
let intervalId = null;
let isRunning = false;

const stepsSpan = document.getElementById('steps');
const caloriesSpan = document.getElementById('calories');
const timeSpan = document.getElementById('time');

function updateDisplay() {
    stepsSpan.textContent = steps;
    caloriesSpan.textContent = Math.floor(calories);
    timeSpan.textContent = seconds + 'с';
}

function addStep() {
    steps++;
    calories += 0.05; // примерно 0.05 ккал за шаг
    updateDisplay();
}

function startAuto() {
    if (isRunning) return;
    isRunning = true;
    intervalId = setInterval(() => {
        addStep();
        seconds++;
        updateDisplay();
    }, 1000);
}

function resetAll() {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        isRunning = false;
    }
    steps = 0;
    calories = 0;
    seconds = 0;
    updateDisplay();
}

document.getElementById('stepBtn').addEventListener('click', addStep);
document.getElementById('startBtn').addEventListener('click', startAuto);
document.getElementById('resetBtn').addEventListener('click', resetAll);

// ====== 4. Галерея - клик ======
document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
        const emojis = ['🏃', '🐾', '💪', '🔥', '⚡', '🌀', '🦵', '🤸', '🦍', '🐆'];
        const newEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        item.textContent = newEmoji;
        item.style.transition = 'all 0.1s';
        item.style.transform = 'scale(1.3)';
        setTimeout(() => item.style.transform = 'scale(1)', 200);
    });
});

console.log('Сайт Квадробика загружен! Удачи в тренировках!');