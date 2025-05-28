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

    const tryonType = params.get('type'); // Add this to get the type from URL

    if (tryonId && overlayImg.src && overlayImg.complete && overlayImg.naturalWidth > 0) {
      if (
        (imgPath && (imgPath.includes('sun') || imgPath.includes('glass'))) ||
        tryonType === 'glasses'
      ) {
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

        // For glasses
        const overlayCenterX = centerX + overlayTransform.x;
        const overlayCenterY = centerY + glassesYOffset + overlayTransform.y;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.93;
        ctx.translate(overlayCenterX, overlayCenterY);
        ctx.scale(overlayTransform.scale, overlayTransform.scale);
        ctx.drawImage(
          overlayImg,
          -glassesWidth / 2,
          -glassesHeight / 2,
          glassesWidth,
          glassesHeight
        );
        ctx.restore();
      } else if (tryonType === 'earring' || (imgPath && imgPath.includes('earring'))) {
        // Draw earrings using ear landmarks
        const leftEar = landmarks.getLeftEye()[0];  // Approximate ear position
        const rightEar = landmarks.getRightEye()[3]; // Approximate ear position

        const earringWidth = 40 * overlayTransform.scale;
        const earringHeight = 60 * overlayTransform.scale;

        // Left earring
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.93;
        ctx.translate(leftEar.x + overlayTransform.x, leftEar.y + 30 + overlayTransform.y);
        ctx.drawImage(
          overlayImg,
          -earringWidth / 2,
          0,
          earringWidth,
          earringHeight
        );
        ctx.restore();

        // Right earring
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.93;
        ctx.translate(rightEar.x + overlayTransform.x, rightEar.y + 30 + overlayTransform.y);
        ctx.drawImage(
          overlayImg,
          -earringWidth / 2,
          0,
          earringWidth,
          earringHeight
        );
        ctx.restore();
      } else {
        // Draw necklace using jaw/chin landmarks
        const chin = landmarks.getJawOutline()[8];
        const leftJaw = landmarks.getJawOutline()[3];
        const rightJaw = landmarks.getJawOutline()[13];
        const necklaceWidth = rightJaw.x - leftJaw.x + 40;
        const necklaceHeight = necklaceWidth / overlayImg.width * overlayImg.height;

        // For necklace
        const necklaceCenterX = chin.x + overlayTransform.x;
        const necklaceCenterY = chin.y + 10 + overlayTransform.y;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.18)';
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.93;
        ctx.translate(necklaceCenterX, necklaceCenterY);
        ctx.scale(overlayTransform.scale, overlayTransform.scale);
        ctx.drawImage(
          overlayImg,
          -necklaceWidth / 2,
          0,
          necklaceWidth,
          necklaceHeight
        );
        ctx.restore();
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

let overlayTransform = {
  x: 0, y: 0, scale: 1, dragging: false, dragStart: {x:0, y:0}
};

canvas.addEventListener('mousedown', e => {
  overlayTransform.dragging = true;
  overlayTransform.dragStart = { x: e.offsetX - overlayTransform.x, y: e.offsetY - overlayTransform.y };
});
canvas.addEventListener('mousemove', e => {
  if (overlayTransform.dragging) {
    overlayTransform.x = e.offsetX - overlayTransform.dragStart.x;
    overlayTransform.y = e.offsetY - overlayTransform.dragStart.y;
  }
});
canvas.addEventListener('mouseup', () => overlayTransform.dragging = false);
canvas.addEventListener('mouseleave', () => overlayTransform.dragging = false);

// Touch support
canvas.addEventListener('touchstart', e => {
  const t = e.touches[0];
  overlayTransform.dragging = true;
  overlayTransform.dragStart = { x: t.clientX - overlayTransform.x, y: t.clientY - overlayTransform.y };
});
canvas.addEventListener('touchmove', e => {
  if (overlayTransform.dragging) {
    const t = e.touches[0];
    overlayTransform.x = t.clientX - overlayTransform.dragStart.x;
    overlayTransform.y = t.clientY - overlayTransform.dragStart.y;
  }
});
canvas.addEventListener('touchend', () => overlayTransform.dragging = false);

// Mouse wheel for scale
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  overlayTransform.scale += e.deltaY < 0 ? 0.05 : -0.05;
  overlayTransform.scale = Math.max(0.2, Math.min(overlayTransform.scale, 3));
});