// File: ar-accessory-tryon/ar-accessory-tryon/src/index.js

const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const accessoryManager = new AccessoryManager(ctx);

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadAccessories() {
    await accessoryManager.loadAccessories([
        'assets/accessories/jewelry.svg',
        'assets/accessories/sunglasses.svg',
        'assets/accessories/hat.svg'
    ]);
}

function draw() {
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    accessoryManager.drawAccessories();
    requestAnimationFrame(draw);
}

async function init() {
    await setupCamera();
    await loadAccessories();
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
    draw();
}

video.addEventListener('loadeddata', init);