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

    // Phaser 3: Set body size and offset (offset is from sprite origin, not anchor)
    // Player sprite is roughly 32x32, but body should be smaller for better gameplay
    this.body.setSize(20, 20);
    this.body.setOffset(6, 12); // Center the collision box on the character's feet area

    // Add shadow under player
    this.shadow = scene.add.ellipse(x, y + 12, 18, 6, 0x000000, 0.4);
    this.shadow.setDepth(-1);

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

  preUpdate(time, delta) {
    super.preUpdate(time, delta);

    // Update shadow position to follow player
    if (this.shadow) {
      this.shadow.x = this.x;
      this.shadow.y = this.y + 12;
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

  celebrate() {
    // Victory jump animation
    this.scene.tweens.add({
      targets: this,
      y: this.y - 30,
      duration: 400,
      ease: 'Quad.easeOut',
      yoyo: true,
      repeat: 2,
      onUpdate: () => {
        // Update shadow during jump
        if (this.shadow) {
          this.shadow.y = this.y + 12;
        }
      }
    });

    // Spin animation
    this.scene.tweens.add({
      targets: this,
      angle: 360,
      duration: 800,
      ease: 'Linear',
      repeat: 1
    });

    // Victory particles - confetti effect
    const colors = [0xffff00, 0xff6600, 0x00ff00, 0x0099ff, 0xff00ff];
    const particleEmitter = this.scene.add.particles(this.x, this.y - 20, TEXTURES, {
      frame: 'gamesprites/bomb/bomb_01.png',
      speed: { min: 100, max: 200 },
      angle: { min: -120, max: -60 },
      scale: { start: 0.3, end: 0.1 },
      alpha: { start: 1, end: 0 },
      lifespan: 1000,
      gravityY: 300,
      blendMode: 'ADD',
      tint: colors,
      quantity: 3,
      frequency: 100,
      maxParticles: 30
    });
    particleEmitter.setDepth(15);

    // Stop particles after celebration
    this.scene.time.delayedCall(1600, () => {
      particleEmitter.stop();
      this.scene.time.delayedCall(1000, () => {
        particleEmitter.destroy();
      });
    });
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

    // Reset shadow visibility and position
    if (this.shadow) {
      this.shadow.setVisible(true);
      this.shadow.x = this.x;
      this.shadow.y = this.y + 12;
    }
  }
}

module.exports = Player;