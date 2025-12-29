/**
 * gameEngine.js
 * Fruit Catcher Game Logic
 */

class GameEngine {
  constructor() {
    this.score = 0;
    this.level = 1;
    this.gameState = "START"; // START, PLAYING, GAMEOVER
    this.items = []; // Falling items
    this.lastSpawnTime = 0;
    this.spawnInterval = 1500; // Initial spawn interval (ms)
    this.playerPos = "CENTER"; // LEFT, CENTER, RIGHT

    // Game constants
    this.lanes = {
      LEFT: 0.2,   // x coordinate ratio (0.0 ~ 1.0)
      CENTER: 0.5,
      RIGHT: 0.8
    };
    this.itemTypes = [
      { type: "APPLE", score: 100, color: "red", prob: 0.6, speed: 0.002, img: null, src: "./assets/apple.png" },
      { type: "GOLD", score: 300, color: "gold", prob: 0.1, speed: 0.004, img: null, src: "./assets/gold_apple.png" },
      { type: "BOMB", score: 0, color: "black", prob: 0.3, speed: 0.002, img: null, src: "./assets/bomb.png" } // Game Over
    ];

    this.playerImg = null;
    this.playerSrc = "./assets/basket.png";

    this.onGameEnd = null;

    // Preload images
    this.preloadImages();
  }

  preloadImages() {
    // Load Item Images
    this.itemTypes.forEach(item => {
      const img = new Image();
      img.src = item.src;
      item.img = img;
    });

    // Load Player Image
    this.playerImg = new Image();
    this.playerImg.src = this.playerSrc;
  }

  start() {
    this.gameState = "PLAYING";
    this.score = 0;
    this.level = 1;
    this.items = [];
    this.warnings = []; // Array to store active warnings
    this.spawnInterval = 1500;
    this.stopGameLoop = false;
    this.accumulatedTime = 0;
    this.lastTime = performance.now();

    // Start game loop
    this.loop();
  }

  stop() {
    this.gameState = "GAMEOVER";
    this.stopGameLoop = true;
    if (this.onGameEnd) {
      this.onGameEnd(this.score, this.level);
    }
  }

  setPlayerAction(action) {
    if (["LEFT", "CENTER", "RIGHT"].includes(action)) {
      this.playerPos = action;
    }
  }

  loop() {
    if (this.stopGameLoop) return;

    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.update(deltaTime);

    requestAnimationFrame(() => this.loop());
  }

  update(deltaTime) {
    if (this.gameState !== "PLAYING") return;

    // 1. Manage Warnings and Spawning
    // Process existing warnings
    for (let i = this.warnings.length - 1; i >= 0; i--) {
      const warning = this.warnings[i];
      warning.remainingTime -= deltaTime;

      if (warning.remainingTime <= 0) {
        // Time's up! Spawn the actual item
        this.spawnActualItem(warning);
        this.warnings.splice(i, 1);
      }
    }

    // Schedule new warning
    this.accumulatedTime += deltaTime;
    if (this.accumulatedTime > this.spawnInterval) {
      this.createWarning();
      this.accumulatedTime = 0;
    }

    // 2. Move Items
    // Speed increases with level
    const speedMultiplier = 1 + (this.level - 1) * 0.1;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.y += item.speed * speedMultiplier * deltaTime;

      // 3. Collision Detection
      // Player is at y=0.8 ~ 0.9 (approx)
      if (item.y > 0.8 && item.y < 0.95) {
        if (item.lane === this.playerPos) {
          this.handleCollision(item);
          this.items.splice(i, 1);
          continue;
        }
      }

      // 4. Remove missed items
      if (item.y > 1.0) {
        this.items.splice(i, 1);
      }
    }
  }

  createWarning() {
    const laneKeys = Object.keys(this.lanes);
    const randomLane = laneKeys[Math.floor(Math.random() * laneKeys.length)];

    const rand = Math.random();
    let selectedType = this.itemTypes[0];
    let cumulativeProb = 0;

    for (const type of this.itemTypes) {
      cumulativeProb += type.prob;
      if (rand < cumulativeProb) {
        selectedType = type;
        break;
      }
    }

    // Create a warning instead of the item directly
    this.warnings.push({
      lane: randomLane,
      x: this.lanes[randomLane],
      remainingTime: 500, // 0.5 seconds warning
      itemData: {
        type: selectedType.type,
        color: selectedType.color,
        score: selectedType.score,
        speed: selectedType.speed,
        img: selectedType.img
      }
    });
  }

  spawnActualItem(warning) {
    this.items.push({
      lane: warning.lane,
      x: warning.x,
      y: 0, // Start at top
      ...warning.itemData
    });
  }

  handleCollision(item) {
    if (item.type === "BOMB") {
      this.stop();
    } else {
      this.addScore(item.score);
    }
  }

  addScore(points) {
    this.score += points;
    // Level up every 1000 points
    if (Math.floor(this.score / 1000) + 1 > this.level) {
      this.level++;
      // Decrease spawn interval
      this.spawnInterval = Math.max(500, 1500 - (this.level * 100));
    }
  }

  draw(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // Draw Background/Status
    if (this.gameState === "PLAYING") {
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${this.score}`, 10, 30);
      ctx.fillText(`Level: ${this.level}`, 10, 60);
    } else if (this.gameState === "GAMEOVER") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", w / 2, h / 2);
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${this.score}`, w / 2, h / 2 + 40);
      ctx.textAlign = "start"; // Reset
      return;
    } else {
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Ready?", w / 2, h / 2);
      ctx.textAlign = "start";
    }

    if (this.gameState !== "PLAYING") return;

    // Draw Warnings
    this.warnings.forEach(warning => {
      const x = warning.x * w;
      const y = 30; // Near top

      // Draw a pulsating or blinking indicator
      ctx.globalAlpha = 0.6 + Math.sin(performance.now() / 50) * 0.2; // Blink effect
      ctx.fillStyle = "red";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("!", x, y);
      ctx.globalAlpha = 1.0; // Reset alpha
    });

    // Draw Player
    const playerX = this.lanes[this.playerPos] * w;
    const playerY = h * 0.85; // Player fixed Y position

    // Draw Basket (Player)
    if (this.playerImg && this.playerImg.complete) {
      // Center the image
      const size = 60; // Desired size
      ctx.drawImage(this.playerImg, playerX - size / 2, playerY - size / 2, size, size);
    } else {
      // Fallback
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(playerX, playerY, 20, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Draw Items
    this.items.forEach(item => {
      const itemX = item.x * w;
      const itemY = item.y * h;

      const size = 50;
      if (item.img && item.img.complete) {
        ctx.drawImage(item.img, itemX - size / 2, itemY - size / 2, size, size);
      } else {
        // Fallback
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(itemX, itemY, 15, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }

  setGameEndCallback(callback) {
    this.onGameEnd = callback;
  }
}

window.GameEngine = GameEngine;
