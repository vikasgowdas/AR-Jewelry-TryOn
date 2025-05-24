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

const params = new URLSearchParams(window.location.search);
const tryonId = params.get('tryon');
const imgPath = params.get('img');

let overlayImg = new Image();
if (imgPath) {
  overlayImg.src = decodeURIComponent(imgPath);
  // Use overlayImg in your AR overlay logic
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

    if (tryonId && overlayImg.src && overlayImg.complete && overlayImg.naturalWidth > 0) {
      // Decide if this is glasses or necklace based on the image path or tryonId
      if (imgPath && (imgPath.includes('sun') || imgPath.includes('glass'))) {
        // Draw glasses using eye landmarks
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const leftCorner = leftEye[0];
        const rightCorner = rightEye[3];

        const centerX = (leftCorner.x + rightCorner.x) / 2;
        const centerY = (leftCorner.y + rightCorner.y) / 2;

        const glassesWidth = (rightCorner.x - leftCorner.x) * 1.7;
        const glassesHeight = glassesWidth / overlayImg.width * overlayImg.height;

        // Move glasses lower by 12 pixels (adjust as needed)
        const glassesYOffset = 12;

        ctx.drawImage(
          overlayImg,
          centerX - glassesWidth / 2,
          centerY - glassesHeight / 2 + glassesYOffset,
          glassesWidth,
          glassesHeight
        );
      } else {
        // Draw necklace using jaw/chin landmarks
        const chin = landmarks.getJawOutline()[8];
        const leftJaw = landmarks.getJawOutline()[3];
        const rightJaw = landmarks.getJawOutline()[13];
        const necklaceWidth = rightJaw.x - leftJaw.x + 40;
        const necklaceHeight = necklaceWidth / overlayImg.width * overlayImg.height;
        ctx.drawImage(
          overlayImg,
          chin.x - necklaceWidth / 2,
          chin.y + 10,
          necklaceWidth,
          necklaceHeight
        );
      }
    }
  }

  requestAnimationFrame(detectLoop);
}

// Auto-start for tryon (necklace or glasses)
if (tryonId && imgPath) {
  window.addEventListener('DOMContentLoaded', async () => {
    // Hide controls if present
    const controls = document.getElementById('controls');
    if (controls) controls.style.display = 'none';

    await loadModels();
    await startCamera();
  });
}