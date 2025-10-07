var BLACK_HEX_CODE = 0x000000; // Phaser 3 uses hex number not string
var TILE_SIZE = 40;

var PowerupIDs = require("../../../../common/powerup_ids");
var MapInfo = require("../../../../common/map_info");
var AudioPlayer = require("../util/audio_player");
var Player = require("../entities/player");
var RemotePlayer = require("../entities/remoteplayer");
var Bomb = require("../entities/bomb");
var RoundEndAnimation = require("../entities/round_end_animation");
var PowerupImageKeys = require("../util/powerup_image_keys");
var PowerupNotificationPlayer = require("../util/powerup_notification_player");

class Level extends Phaser.Scene {
  constructor() {
    super({ key: 'Level' });
    this.remotePlayers = {};
    this.gameFrozen = true;
  }

  init(data) {
    // Phaser 3: data passed via object
    this.tilemapName = data.tilemapName;
    this.players = data.players;
    this.playerId = data.id;
  }

  setEventHandlers() {
    // Socket.io event handlers - bind to this scene
    socket.on("disconnect", this.onSocketDisconnect.bind(this));
    socket.on("m", this.onMovePlayer.bind(this));
    socket.on("remove player", this.onRemovePlayer.bind(this));
    socket.on("kill player", this.onKillPlayer.bind(this));
    socket.on("place bomb", this.onPlaceBomb.bind(this));
    socket.on("detonate", this.onDetonate.bind(this));
    socket.on("new round", this.onNewRound.bind(this));
    socket.on("end game", this.onEndGame.bind(this));
    socket.on("no opponents left", this.onNoOpponentsLeft.bind(this));
    socket.on("powerup acquired", this.onPowerupAcquired.bind(this));
  }

  create() {
    window.level = this; // Keep global reference for socket handlers
    this.lastFrameTime = null;
    this.deadGroup = [];
    this.colliders = []; // Store colliders so we can destroy them on restart

    this.initializeMap();
    this.createAtmosphericEffects();

    // Phaser 3: Groups are created differently
    this.bombs = this.physics.add.group();
    this.items = {};

    // Phaser 3: Physics is enabled via physics.add.existing
    // blockLayer physics will be handled via collider

    this.setEventHandlers();
    this.initializePlayers();

    // Set up collisions and store them
    if (window.player) {
      this.colliders.push(this.physics.add.collider(window.player, this.blockLayer));
      this.colliders.push(this.physics.add.collider(window.player, this.bombs));
    }

    this.createDimGraphic();
    this.beginRoundAnimation("round_text/round_1.png");
  }

  createAtmosphericEffects() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background gradient for depth
    this.backgroundGradient = this.add.graphics();
    this.backgroundGradient.setDepth(-10);

    // Create a subtle radial gradient effect using multiple circles
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(width, height);

    for (let i = 0; i < 5; i++) {
      const radius = maxRadius * (1 - i * 0.2);
      const alpha = 0.15 - i * 0.03;
      this.backgroundGradient.fillStyle(0x4a5568, alpha);
      this.backgroundGradient.fillCircle(centerX, centerY, radius);
    }

    // Ambient lighting overlay - warm orange tint
    this.ambientLight = this.add.graphics();
    this.ambientLight.setDepth(-9);
    this.ambientLight.fillStyle(0xff6600, 0.08);
    this.ambientLight.fillRect(0, 0, width, height);

    // Atmospheric particles - slow-moving dust/mist
    const particleCount = 20;
    this.atmosphericParticles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.FloatBetween(0.1, 0.3)
      );
      particle.setDepth(-8);
      particle.setBlendMode(Phaser.BlendModes.ADD);

      // Random slow floating motion
      this.tweens.add({
        targets: particle,
        x: particle.x + Phaser.Math.Between(-100, 100),
        y: particle.y + Phaser.Math.Between(-100, 100),
        duration: Phaser.Math.Between(8000, 15000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
      });

      this.atmosphericParticles.push(particle);
    }
  }

  createDimGraphic() {
    this.dimGraphic = this.add.graphics();
    this.dimGraphic.setAlpha(0.7);
    this.dimGraphic.fillStyle(BLACK_HEX_CODE, 1);
    this.dimGraphic.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
  }

  restartGame() {
    this.dimGraphic.destroy();

    if (window.player) {
      window.player.reset();
    }

    for(let i in this.remotePlayers) {
      this.remotePlayers[i].reset();
    }

    this.deadGroup = [];
    this.lastFrameTime = null;

    // Phaser 3: Destroy old colliders before recreating map
    if (this.colliders) {
      this.colliders.forEach(collider => {
        if (collider && collider.destroy) {
          collider.destroy();
        }
      });
      this.colliders = [];
    }

    this.tearDownMap();
    this.tearDownAtmosphericEffects();
    this.initializeMap();
    this.createAtmosphericEffects();

    // Phaser 3: clear and recreate group
    this.bombs.clear(true, true);
    this.destroyItems();

    // Re-setup collisions
    if (window.player) {
      this.colliders.push(this.physics.add.collider(window.player, this.blockLayer));
      this.colliders.push(this.physics.add.collider(window.player, this.bombs));
    }

    this.gameFrozen = false;
    socket.emit("ready for round");
  }

  destroyItems() {
    for(let itemKey in this.items) {
      this.items[itemKey].destroy();
    }
    this.items = {};
  }

  celebrateWinners(winnerColors) {
    // Check if local player won
    if (window.player && window.player.active && winnerColors.includes(window.player.color)) {
      window.player.celebrate();
    }

    // Check remote players
    for (let id in this.remotePlayers) {
      const remotePlayer = this.remotePlayers[id];
      if (remotePlayer.active && winnerColors.includes(remotePlayer.color)) {
        remotePlayer.celebrate();
      }
    }
  }

  onNewRound(data) {
    // Trigger celebration for winning players
    this.celebrateWinners(data.roundWinnerColors);

    this.createDimGraphic();
    const animation = new RoundEndAnimation(this, data.completedRoundNumber, data.roundWinnerColors);
    this.gameFrozen = true;

    let roundImage;
    if(data.completedRoundNumber < 2) {
      roundImage = "round_text/round_" + (data.completedRoundNumber + 1) + ".png";
    } else if (data.completedRoundNumber == 2) {
      roundImage = "round_text/final_round.png";
    } else {
      roundImage = "round_text/tiebreaker.png";
    }

    animation.beginAnimation(() => {
      this.beginRoundAnimation(roundImage, this.restartGame.bind(this));
    });
  }

  onEndGame(data) {
    // Trigger celebration for winning players
    this.celebrateWinners(data.roundWinnerColors);

    this.createDimGraphic();
    this.gameFrozen = true;
    const animation = new RoundEndAnimation(this, data.completedRoundNumber, data.roundWinnerColors);
    animation.beginAnimation(() => {
      this.scene.start("GameOver", { gameWinnerColor: data.gameWinnerColor, noOpponents: false });
    });
  }

  onNoOpponentsLeft(data) {
    this.scene.start("GameOver", { gameWinnerColor: null, noOpponents: true });
  }

  beginRoundAnimation(image, callback) {
    const beginRoundText = this.add.image(-600, this.cameras.main.height / 2, TEXTURES, image);
    beginRoundText.setOrigin(0.5, 0.5);

    // Phaser 3: Chain tweens using onComplete
    this.tweens.add({
      targets: beginRoundText,
      x: this.cameras.main.width / 2,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        // Wait 800ms then tween out
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: beginRoundText,
            x: 1000,
            duration: 300,
            ease: 'Linear',
            onComplete: () => {
              if (this.dimGraphic) {
                this.dimGraphic.destroy();
              }
              beginRoundText.destroy();
              this.gameFrozen = false;

              if(callback) {
                callback();
              }
            }
          });
        });
      }
    });
  }

  update() {
    if(window.player != null && window.player.active) {
      if(this.gameFrozen) {
        window.player.freeze();
      } else {
        window.player.handleInput();

        // Check powerup overlaps
        for(let itemKey in this.items) {
          const item = this.items[itemKey];
          this.physics.overlap(window.player, item, () => {
            socket.emit("powerup overlap", {x: item.x, y: item.y});
          });
        }
      }
    }

    this.stopAnimationForMotionlessPlayers();
    this.storePreviousPositions();

    for(let id in this.remotePlayers) {
      this.remotePlayers[id].interpolate(this.lastFrameTime);
    }

    this.lastFrameTime = this.time.now;

    this.destroyDeadSprites();
  }

  destroyDeadSprites() {
    this.deadGroup.forEach((deadSprite) => {
      deadSprite.destroy();
    });
    this.deadGroup = [];
  }

  storePreviousPositions() {
    for(let id in this.remotePlayers) {
      const remotePlayer = this.remotePlayers[id];
      remotePlayer.previousPosition = {x: remotePlayer.x, y: remotePlayer.y};
    }
  }

  stopAnimationForMotionlessPlayers() {
    for(let id in this.remotePlayers) {
      const remotePlayer = this.remotePlayers[id];
      if(remotePlayer.lastMoveTime < this.time.now - 200) {
        remotePlayer.stop();
      }
    }
  }

  onSocketDisconnect() {
    console.log("Disconnected from socket server.");
  }

  initializePlayers() {
    for(let i in this.players) {
      const data = this.players[i];
      if(data.id == this.playerId) {
        window.player = new Player(this, data.x, data.y, data.id, data.color);
      } else {
        this.remotePlayers[data.id] = new RemotePlayer(this, data.x, data.y, data.id, data.color);
      }
    }
  }

  tearDownAtmosphericEffects() {
    if (this.backgroundGradient) {
      this.backgroundGradient.destroy();
    }
    if (this.ambientLight) {
      this.ambientLight.destroy();
    }
    if (this.atmosphericParticles) {
      this.atmosphericParticles.forEach(particle => particle.destroy());
      this.atmosphericParticles = [];
    }
  }

  tearDownMap() {
    if (this.map) {
      this.map.destroy();
    }
    if (this.groundLayer) {
      this.groundLayer.destroy();
    }
    if (this.blockLayer) {
      this.blockLayer.destroy();
    }
  }

  initializeMap() {
    // Phaser 3: tilemap creation changed significantly
    this.map = this.make.tilemap({ key: this.tilemapName });
    const mapInfo = MapInfo[this.tilemapName];

    const tileset = this.map.addTilesetImage(mapInfo.tilesetName, mapInfo.tilesetImage);

    // Phaser 3: createLayer instead of TilemapLayer constructor
    this.groundLayer = this.map.createLayer(mapInfo.groundLayer, tileset, 0, 0);
    this.blockLayer = this.map.createLayer(mapInfo.blockLayer, tileset, 0, 0);

    // Phaser 3: setCollision works similarly
    this.blockLayer.setCollisionByExclusion([-1]); // Collide with all tiles except -1 (empty)

    // Alternative: use specific collision tiles if needed
    // this.map.setCollision(mapInfo.collisionTiles, true, false, mapInfo.blockLayer);

    // Send map data to server
    const blockLayerData = this.cache.tilemap.get(this.tilemapName).data.layers[1];

    socket.emit("register map", {
      tiles: blockLayerData.data,
      height: blockLayerData.height,
      width: blockLayerData.width,
      destructibleTileId: mapInfo.destructibleTileId
    });
  }

  onMovePlayer(data) {
    if((window.player && data.id == window.player.id) || this.gameFrozen) {
      return;
    }

    const movingPlayer = this.remotePlayers[data.id];

    if (!movingPlayer) {
      return;
    }

    if(movingPlayer.targetPosition) {
      movingPlayer.play(`${movingPlayer.animKey}_${data.f}`, true);
      movingPlayer.lastMoveTime = this.time.now;

      if(data.x == movingPlayer.targetPosition.x && data.y == movingPlayer.targetPosition.y) {
        return;
      }

      movingPlayer.x = movingPlayer.targetPosition.x;
      movingPlayer.y = movingPlayer.targetPosition.y;

      movingPlayer.distanceToCover = {
        x: data.x - movingPlayer.targetPosition.x,
        y: data.y - movingPlayer.targetPosition.y
      };
      movingPlayer.distanceCovered = {x: 0, y: 0};
    }

    movingPlayer.targetPosition = {x: data.x, y: data.y};
  }

  onRemovePlayer(data) {
    const playerToRemove = this.remotePlayers[data.id];

    if(playerToRemove && playerToRemove.active) {
      playerToRemove.destroy();
    }

    delete this.remotePlayers[data.id];
    delete this.players[data.id];
  }

  onKillPlayer(data) {
    if(window.player && data.id == window.player.id) {
      console.log("You've been killed.");
      window.player.setActive(false);
      window.player.setVisible(false);
      if (window.player.shadow) {
        window.player.shadow.setVisible(false);
      }
    } else {
      const playerToRemove = this.remotePlayers[data.id];
      if (playerToRemove) {
        playerToRemove.setActive(false);
        playerToRemove.setVisible(false);
        if (playerToRemove.shadow) {
          playerToRemove.shadow.setVisible(false);
        }
      }
    }
  }

  onPlaceBomb(data) {
    const bomb = new Bomb(this, data.x, data.y, data.id);
    this.bombs.add(bomb);
  }

  onDetonate(data) {
    Bomb.renderExplosion(this, data.explosions);

    // Remove bomb from group
    this.bombs.getChildren().forEach((bomb) => {
      if(bomb && bomb.id == data.id) {
        bomb.remove();
      }
    });

    data.destroyedTiles.forEach((destroyedTile) => {
      // Phaser 3: removeTileAt
      this.map.removeTileAt(destroyedTile.col, destroyedTile.row, true, true, this.blockLayer);

      if(destroyedTile.itemId) {
        this.generateItemEntity(destroyedTile.itemId, destroyedTile.row, destroyedTile.col);
      }
    });
  }

  onPowerupAcquired(data) {
    if (this.items[data.powerupId]) {
      const item = this.items[data.powerupId];

      // Destroy glow effect if it exists
      if (item._glow) {
        item._glow.destroy();
      }

      // Create sparkle effect when collected
      const sparkles = this.add.particles(item.x + 20, item.y + 20, TEXTURES, {
        frame: 'gamesprites/bomb/bomb_01.png',
        speed: { min: 50, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.2, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        blendMode: 'ADD',
        tint: 0x00ffff,
        quantity: 10,
        duration: 100
      });
      sparkles.setDepth(15);

      // Clean up sparkles
      this.time.delayedCall(600, () => {
        sparkles.destroy();
      });

      item.destroy();
      delete this.items[data.powerupId];
    }

    if(window.player && data.acquiringPlayerId === window.player.id) {
      AudioPlayer.playPowerupSound();
      PowerupNotificationPlayer.showPowerupNotification(data.powerupType, window.player.x, window.player.y);
      if(data.powerupType == PowerupIDs.SPEED) {
        window.player.applySpeedPowerup();
      }
    }
  }

  generateItemEntity(itemId, row, col) {
    const imageKey = PowerupImageKeys[itemId];
    const item = this.physics.add.sprite(col * TILE_SIZE, row * TILE_SIZE, TEXTURES, imageKey);
    item.setOrigin(0, 0);
    this.items[row + "." + col] = item;
    item.setDepth(2);

    // Add glow effect to powerup
    const glow = this.add.circle(col * TILE_SIZE + 20, row * TILE_SIZE + 20, 25, 0x00ffff, 0);
    glow.setDepth(1);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    // Pulsing glow animation
    this.tweens.add({
      targets: glow,
      alpha: 0.4,
      scale: 1.3,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Floating animation
    this.tweens.add({
      targets: item,
      y: item.y - 5,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });

    // Store glow reference for cleanup
    item._glow = glow;
  }
}

module.exports = Level;
