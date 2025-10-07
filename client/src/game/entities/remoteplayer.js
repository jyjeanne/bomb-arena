var remotePlayerUpdateInterval = 100;
var TextureUtil = require("../util/texture_util");

function getFrame(color, number) {
  return "gamesprites/bomberman_" + color + "/bomberman_" + color + "_" + number + ".png";
}

// Phaser 3: Convert to ES6 class extending Phaser.Physics.Arcade.Sprite
class RemotePlayer extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, id, color) {
    const firstFrame = getFrame(color, "01");
    super(scene, x, y, TEXTURES, firstFrame);

    this.scene = scene;
    this.id = id;
    this.color = color;
    this.previousPosition = {x: x, y: y};
    this.lastMoveTime = 0;
    this.targetPosition = null;
    this.spawnPoint = {x: x, y: y};
    this.firstFrame = firstFrame;
    this.distanceToCover = null;
    this.distanceCovered = null;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);

    // Add shadow under remote player
    this.shadow = scene.add.ellipse(x, y + 12, 18, 6, 0x000000, 0.4);
    this.shadow.setDepth(-1);

    // Create animations
    this.createAnimations(color);
  }

  createAnimations(color) {
    const downFrames = TextureUtil.getFrames(getFrame, color, ["01", "02", "03", "04", "05"]);
    const upFrames = TextureUtil.getFrames(getFrame, color, ["06", "07", "08", "09", "10"]);
    const rightFrames = TextureUtil.getFrames(getFrame, color, ["11", "12", "13"]);
    const leftFrames = TextureUtil.getFrames(getFrame, color, ["14", "15", "16"]);

    const animKey = `remoteplayer_${color}_${this.id}`;

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

  interpolate(lastFrameTime) {
    if(this.distanceToCover && lastFrameTime) {
      if((this.distanceCovered.x < Math.abs(this.distanceToCover.x) || this.distanceCovered.y < Math.abs(this.distanceToCover.y))) {
        // Phaser 3: this.scene.time.now instead of game.time.now
        var fractionOfTimeStep = (this.scene.time.now - lastFrameTime) / remotePlayerUpdateInterval;
        var distanceCoveredThisFrameX = fractionOfTimeStep * this.distanceToCover.x;
        var distanceCoveredThisFrameY = fractionOfTimeStep * this.distanceToCover.y;

        this.distanceCovered.x += Math.abs(distanceCoveredThisFrameX);
        this.distanceCovered.y += Math.abs(distanceCoveredThisFrameY);

        this.x += distanceCoveredThisFrameX;
        this.y += distanceCoveredThisFrameY;
      } else {
        this.x = this.targetPosition.x;
        this.y = this.targetPosition.y;
      }
    }

    // Update shadow position
    if (this.shadow) {
      this.shadow.x = this.x;
      this.shadow.y = this.y + 12;
    }
  }

  getFrame(color, number) {
    return getFrame(color, number);
  }

  reset() {
    this.x = this.spawnPoint.x;
    this.y = this.spawnPoint.y;
    this.setFrame(this.firstFrame);
    this.previousPosition = {x: this.x, y: this.y};
    this.distanceToCover = null;
    this.distanceCovered = null;
    this.targetPosition = null;
    this.lastMoveTime = null;

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
}

module.exports = RemotePlayer;
