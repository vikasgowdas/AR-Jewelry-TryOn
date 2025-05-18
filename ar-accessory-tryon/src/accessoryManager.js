class AccessoryManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.accessories = [];
  }

  loadAccessory(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }

  async addAccessory(url, position) {
    const accessory = await this.loadAccessory(url);
    this.accessories.push({ img: accessory, position });
    this.render();
  }

  removeAccessory(index) {
    if (index >= 0 && index < this.accessories.length) {
      this.accessories.splice(index, 1);
      this.render();
    }
  }

  setPosition(index, position) {
    if (index >= 0 && index < this.accessories.length) {
      this.accessories[index].position = position;
      this.render();
    }
  }

  render() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.accessories.forEach(({ img, position }) => {
      this.context.drawImage(img, position.x, position.y, img.width, img.height);
    });
  }
}

export default AccessoryManager;