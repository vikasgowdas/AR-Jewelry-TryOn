export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });
}

export function calculatePosition(faceBox, accessoryWidth, accessoryHeight) {
  const x = faceBox.x + (faceBox.width / 2) - (accessoryWidth / 2);
  const y = faceBox.y + (faceBox.height / 2) - (accessoryHeight / 2);
  return { x, y };
}

export function drawAccessory(ctx, img, position) {
  ctx.drawImage(img, position.x, position.y, img.width, img.height);
}