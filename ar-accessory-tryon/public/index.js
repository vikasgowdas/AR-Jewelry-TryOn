const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');
const jewelryBtn = document.getElementById('add-jewelry');

// Product images for try-on
const productImages = {
  "1": "https://pngimg.com/d/necklace_PNG45.png",
  "2": "https://pngimg.com/d/necklace_PNG51.png",
  "3": "https://pngimg.com/d/necklace_PNG52.png"
};

const necklaceImg = new Image();

// Sunglasses images for try-on
const glassImages = {
  "1": "https://pngimg.com/d/sunglasses_PNG35499.png", // Aviator
  "2": "https://pngimg.com/d/sunglasses_PNG35497.png", // Wayfarer
  "3": "https://pngimg.com/d/sunglasses_PNG35491.png"  // Round Retro
};

const glassTryonId = getQueryParam('glass_tryon');
const imgUrl = getQueryParam('img_url');
let glassImg = new Image();

if (imgUrl) {
  glassImg.src = decodeURIComponent(imgUrl);
} else if (glassTryonId && glassImages[glassTryonId]) {
  glassImg.src = glassImages[glassTryonId];
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

const tryonId = getQueryParam('tryon');
if (tryonId && productImages[tryonId]) {
  necklaceImg.src = productImages[tryonId];
}

let modelsLoaded = false;
let streamStarted = false;

async function loadModels() {
  if (modelsLoaded) return;
  await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/');
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri('https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/');
  modelsLoaded = true;
}

async function startCamera() {
  if (streamStarted) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      video.style.display = 'block';
      canvas.style.display = 'block';
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      detectLoop();
    };
    streamStarted = true;
  } catch (err) {
    alert("Webcam error: " + err.message);
  }
}

async function detectLoop() {
  const options = new faceapi.TinyFaceDetectorOptions();
  const result = await faceapi.detectSingleFace(video, options).withFaceLandmarks(true);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (result && result.landmarks) {
    const landmarks = result.landmarks;

    // For necklace (if needed)
    if (tryonId && productImages[tryonId]) {
      const chin = landmarks.getJawOutline()[8];
      const leftJaw = landmarks.getJawOutline()[3];
      const rightJaw = landmarks.getJawOutline()[13];
      const necklaceWidth = rightJaw.x - leftJaw.x + 40;
      const necklaceHeight = necklaceWidth / necklaceImg.width * necklaceImg.height;
      ctx.drawImage(
        necklaceImg,
        chin.x - necklaceWidth / 2,
        chin.y + 10,
        necklaceWidth,
        necklaceHeight
      );
    }

    // For sunglasses
    if (glassTryonId && glassImg.src && glassImg.complete && glassImg.naturalWidth > 0) {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      const glassesWidth = rightEye[3].x - leftEye[0].x + 60;
      const glassesHeight = glassesWidth / glassImg.width * glassImg.height;
      const centerX = (leftEye[0].x + rightEye[3].x) / 2;
      const centerY = (leftEye[0].y + rightEye[3].y) / 2;

      ctx.drawImage(
        glassImg,
        centerX - glassesWidth / 2,
        centerY - glassesHeight / 2 + 9,
        glassesWidth,
        glassesHeight
      );
    }
  }

  requestAnimationFrame(detectLoop);
}

// Auto-start for tryon (necklace or glasses)
if ((tryonId && productImages[tryonId]) || (glassTryonId && glassImages[glassTryonId])) {
  window.addEventListener('DOMContentLoaded', async () => {
    // Hide controls if present
    const controls = document.getElementById('controls');
    if (controls) controls.style.display = 'none';

    await loadModels();
    await startCamera();
  });
}