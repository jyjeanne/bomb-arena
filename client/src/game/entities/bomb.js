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
  }

  remove() {
    if (this.sizeTween) {
      this.sizeTween.stop();
    }
    this.destroy();
  }

  // Static method for rendering explosions
  static renderExplosion(scene, explosions) {
    explosions.forEach(function(explosion) {
      const explosionSprite = scene.add.sprite(explosion.x, explosion.y, TEXTURES, getFrame(explosion.key, "01"));
      explosionSprite.setOrigin(0.5, 0.5);

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
