var Bomb = require("./bomb");
var TextureUtil = require("../util/texture_util");

var DEFAULT_PLAYER_SPEED = 180;
var PLAYER_SPEED_POWERUP_INCREMENT = 60;

// Phaser 3: Sprite class signature changed
class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, id, color) {
    const firstFrame = Player.prototype.getFrame(color, "01");
    super(scene, x, y, TEXTURES, firstFrame);

    this.scene = scene;
    this.spawnPoint = {x: x, y: y};
    this.id = id;
    this.facing = "down";
    this.setOrigin(0.5, 0.5); // Phaser 3: setOrigin instead of anchor.setTo
    this.bombButtonJustPressed = false;
    this.speed = DEFAULT_PLAYER_SPEED;
    this.firstFrame = firstFrame;
    this.color = color;

    // Phaser 3: physics is enabled by default for Physics.Arcade.Sprite
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Phaser 3: body.setSize parameters changed
    this.body.setSize(15, 16);
    this.body.setOffset(1, 15);

    // Create animations for this player color
    this.createAnimations(color);
  }

  createAnimations(color) {
    const downFrames = TextureUtil.getFrames(this.getFrame, color, ["01", "02", "03", "04", "05"]);
    const upFrames = TextureUtil.getFrames(this.getFrame, color, ["06", "07", "08", "09", "10"]);
    const rightFrames = TextureUtil.getFrames(this.getFrame, color, ["11", "12", "13"]);
    const leftFrames = TextureUtil.getFrames(this.getFrame, color, ["14", "15", "16"]);

    // Phaser 3: animations are created globally or per sprite
    const animKey = `player_${color}`;

    if (!this.scene.anims.exists(`${animKey}_down`)) {
      this.scene.anims.create({
        key: `${animKey}_down`,
        frames: downFrames.map(frame => ({ key: TEXTURES, frame: frame })),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.scene.anims.exists(`${animKey}_up`)) {
      this.scene.anims.create({
        key: `${animKey}_up`,
        frames: upFrames.map(frame => ({ key: TEXTURES, frame: frame })),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.scene.anims.exists(`${animKey}_right`)) {
      this.scene.anims.create({
        key: `${animKey}_right`,
        frames: rightFrames.map(frame => ({ key: TEXTURES, frame: frame })),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.scene.anims.exists(`${animKey}_left`)) {
      this.scene.anims.create({
        key: `${animKey}_left`,
        frames: leftFrames.map(frame => ({ key: TEXTURES, frame: frame })),
        frameRate: 10,
        repeat: -1
      });
    }

    this.animKey = animKey;
  }

  handleInput() {
    this.handleMotionInput();
    this.handleBombInput();
  }

  handleMotionInput() {
    let moving = true;

    // Phaser 3: collision is handled in Level scene via physics.add.collider
    // These collision calls will be moved to the scene

    // Phaser 3: keyboard input changed
    const cursors = this.scene.input.keyboard.createCursorKeys();

    if (cursors.left.isDown) {
      this.body.velocity.y = 0;
      this.body.velocity.x = -this.speed;
      this.facing = "left";
    } else if (cursors.right.isDown) {
      this.body.velocity.y = 0;
      this.body.velocity.x = this.speed;
      this.facing = "right";
    } else if (cursors.up.isDown) {
      this.body.velocity.x = 0;
      this.body.velocity.y = -this.speed;
      this.facing = "up";
    } else if (cursors.down.isDown) {
      this.body.velocity.x = 0;
      this.body.velocity.y = this.speed;
      this.facing = "down";
    } else {
      moving = false;
      this.freeze();
    }

    if(moving) {
      this.play(`${this.animKey}_${this.facing}`, true);
      socket.emit("move player", {x: this.x, y: this.y, facing: this.facing});
    }
  }

  handleBombInput() {
    const spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Check for bomb overlap in Level scene
    const overlapping = this.scene.physics.overlap(this, this.scene.bombs);

    if(spaceKey.isDown && !overlapping && !this.bombButtonJustPressed) {
      this.bombButtonJustPressed = true;

      // Bombs for a player are identified by timestamp.
      socket.emit("place bomb", {x: this.body.x, y: this.body.y, id: this.scene.time.now});
    } else if(!spaceKey.isDown && this.bombButtonJustPressed) {
      this.bombButtonJustPressed = false;
    }
  }

  freeze() {
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.stop(); // Phaser 3: stop() instead of animations.stop()
  }

  applySpeedPowerup() {
    this.speed += PLAYER_SPEED_POWERUP_INCREMENT;
  }

  getFrame(prefix, number) {
    return "gamesprites/bomberman_" + prefix + "/bomberman_" + prefix + "_" + number + ".png";
  }

  reset() {
    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.setFrame(this.firstFrame);
    this.facing = "down";
    this.bombButtonJustPressed = false;
    this.speed = DEFAULT_PLAYER_SPEED;

    if(!this.active) {
      this.setActive(true);
      this.setVisible(true);
    }
  }
}

module.exports = Player;