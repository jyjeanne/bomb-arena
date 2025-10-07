var AudioPlayer = require("../util/audio_player");
var TextureUtil = require("../util/texture_util");

function getFrame(prefix, number) {
  return "gamesprites/" + prefix + "/" + prefix + "_" + number + ".png";
}

// Phaser 3: Convert to ES6 class extending Phaser.Physics.Arcade.Sprite
class Bomb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, id) {
    super(scene, x, y, TEXTURES, "gamesprites/bomb/bomb_01.png");

    this.scene = scene;
    this.id = id;

    this.setOrigin(0.5, 0.5);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.immovable = true;

    // Add shadow under bomb
    this.shadow = scene.add.ellipse(x, y + 10, 20, 8, 0x000000, 0.3);
    this.shadow.setDepth(0);

    // Add glow effect
    this.glow = scene.add.circle(x, y, 16, 0xffaa00, 0);
    this.glow.setDepth(5);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);

    // Phaser 3: tweens.add instead of game.add.tween
    this.sizeTween = scene.tweens.add({
      targets: this.scale,
      x: 1.2,
      y: 1.2,
      duration: 500,
      ease: 'Linear',
      yoyo: true,
      repeat: -1
    });

    // Pulsing glow effect that intensifies over time
    scene.tweens.add({
      targets: this.glow,
      alpha: 0.6,
      scale: 1.5,
      duration: 500,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1
    });
  }

  remove() {
    if (this.sizeTween) {
      this.sizeTween.stop();
    }
    if (this.shadow) {
      this.shadow.destroy();
    }
    if (this.glow) {
      this.glow.destroy();
    }
    this.destroy();
  }

  // Static method for rendering explosions
  static renderExplosion(scene, explosions) {
    // Screen shake effect
    scene.cameras.main.shake(300, 0.01);

    explosions.forEach(function(explosion) {
      const explosionSprite = scene.add.sprite(explosion.x, explosion.y, TEXTURES, getFrame(explosion.key, "01"));
      explosionSprite.setOrigin(0.5, 0.5);

      // Add flash effect
      const flash = scene.add.circle(explosion.x, explosion.y, 30, 0xffff00, 1);
      flash.setDepth(15);
      flash.setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({
        targets: flash,
        alpha: 0,
        scale: 3,
        duration: 300,
        ease: 'Cubic.easeOut',
        onComplete: () => flash.destroy()
      });

      // Create particle emitter for fire/smoke effect
      const particles = scene.add.particles(explosion.x, explosion.y, TEXTURES, {
        frame: 'gamesprites/bomb/bomb_01.png',
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.3, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 600,
        blendMode: 'ADD',
        tint: [0xff6600, 0xff3300, 0xffaa00],
        quantity: 15,
        duration: 100
      });
      particles.setDepth(12);

      // Clean up particles after they're done
      scene.time.delayedCall(800, () => {
        particles.destroy();
      });

      // Create animation if it doesn't exist
      const animKey = `explosion_${explosion.key}`;
      if (!scene.anims.exists(animKey)) {
        const frames = TextureUtil.getFrames(getFrame, explosion.key, ["02", "03", "04", "05"]);
        scene.anims.create({
          key: animKey,
          frames: frames.map(frame => ({ key: TEXTURES, frame: frame })),
          frameRate: 17,
          repeat: 0
        });
      }

      // Phaser 3: on('animationcomplete') instead of onComplete
      explosionSprite.on('animationcomplete', () => {
        scene.deadGroup.push(explosionSprite);
      });

      // Set depth based on hide flag
      if(explosion.hide) {
        explosionSprite.setDepth(1);
      } else {
        explosionSprite.setDepth(10);
      }

      explosionSprite.play(animKey);
      AudioPlayer.playBombSound();
    });
  }
}

module.exports = Bomb;
