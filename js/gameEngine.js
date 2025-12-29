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
      { type: "APPLE", score: 100, color: "red", prob: 0.6, speed: 0.005 },
      { type: "GOLD", score: 300, color: "gold", prob: 0.1, speed: 0.008 },
      { type: "BOMB", score: 0, color: "black", prob: 0.3, speed: 0.005 } // Game Over
    ];
    
    this.onGameEnd = null;
  }

  start() {
    this.gameState = "PLAYING";
    this.score = 0;
    this.level = 1;
    this.items = [];
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

    // 1. Spawn Items
    this.accumulatedTime += deltaTime;
    if (this.accumulatedTime > this.spawnInterval) {
      this.spawnItem();
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

  spawnItem() {
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

    this.items.push({
      lane: randomLane,
      x: this.lanes[randomLane],
      y: 0,
      type: selectedType.type,
      color: selectedType.color,
      score: selectedType.score,
      speed: selectedType.speed
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
      ctx.fillText("GAME OVER", w/2, h/2);
      ctx.font = "20px Arial";
      ctx.fillText(`Score: ${this.score}`, w/2, h/2 + 40);
      ctx.textAlign = "start"; // Reset
      return;
    } else {
       ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
       ctx.fillRect(0, 0, w, h);
       ctx.fillStyle = "white";
       ctx.font = "20px Arial";
       ctx.textAlign = "center";
       ctx.fillText("Ready?", w/2, h/2);
       ctx.textAlign = "start";
    }

    if (this.gameState !== "PLAYING") return;

    // Draw Player
    const playerX = this.lanes[this.playerPos] * w;
    const playerY = h * 0.85; // Player fixed Y position
    
    ctx.fillStyle = "blue";
    ctx.beginPath();
    ctx.arc(playerX, playerY, 20, 0, 2 * Math.PI); // Simple circle player
    ctx.fill();

    // Draw Items
    this.items.forEach(item => {
      const itemX = item.x * w;
      const itemY = item.y * h;
      
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(itemX, itemY, 15, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  setGameEndCallback(callback) {
    this.onGameEnd = callback;
  }
}

window.GameEngine = GameEngine;
