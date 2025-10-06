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

    this.initializeMap();

    // Phaser 3: Groups are created differently
    this.bombs = this.physics.add.group();
    this.items = {};

    // Phaser 3: Physics is enabled via physics.add.existing
    // blockLayer physics will be handled via collider

    this.setEventHandlers();
    this.initializePlayers();

    // Set up collisions
    if (window.player) {
      this.physics.add.collider(window.player, this.blockLayer);
      this.physics.add.collider(window.player, this.bombs);
    }

    this.createDimGraphic();
    this.beginRoundAnimation("round_text/round_1.png");
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
    this.tearDownMap();
    this.initializeMap();

    // Phaser 3: clear and recreate group
    this.bombs.clear(true, true);
    this.destroyItems();

    // Re-setup collisions
    if (window.player) {
      this.physics.add.collider(window.player, this.blockLayer);
      this.physics.add.collider(window.player, this.bombs);
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

  onNewRound(data) {
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

    // Phaser 3: chain tweens differently
    const timeline = this.tweens.createTimeline();

    timeline.add({
      targets: beginRoundText,
      x: this.cameras.main.width / 2,
      duration: 300,
      ease: 'Linear'
    });

    timeline.add({
      targets: beginRoundText,
      x: 1000,
      duration: 300,
      delay: 800,
      ease: 'Linear',
      onComplete: () => {
        this.dimGraphic.destroy();
        beginRoundText.destroy();
        this.gameFrozen = false;

        if(callback) {
          callback();
        }
      }
    });

    timeline.play();
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
    } else {
      const playerToRemove = this.remotePlayers[data.id];
      if (playerToRemove) {
        playerToRemove.setActive(false);
        playerToRemove.setVisible(false);
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
      this.items[data.powerupId].destroy();
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
  }
}

module.exports = Level;
