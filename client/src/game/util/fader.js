// Phaser 3: Fader utility needs scene context
const BLACK_HEX_CODE = 0x000000;

module.exports = {
  fadeGraphic: null,

  createFadeTween: function(scene, alphaFrom, alphaTo, fadeDuration) {
    fadeDuration = fadeDuration || 300;

    if(this.fadeGraphic) {
      this.fadeGraphic.destroy();
    }

    // Phaser 3: graphics API changed
    this.fadeGraphic = scene.add.graphics();
    this.fadeGraphic.fillStyle(BLACK_HEX_CODE, 1);
    this.fadeGraphic.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);
    this.fadeGraphic.setScrollFactor(0); // Phaser 3: equivalent to fixedToCamera

    this.fadeGraphic.setAlpha(alphaFrom);

    // Phaser 3: tweens.add instead of game.add.tween
    const tween = scene.tweens.add({
      targets: this.fadeGraphic,
      alpha: alphaTo,
      duration: fadeDuration,
      ease: 'Linear',
      paused: true
    });

    return tween;
  },

  createFadeInTween: function(scene, fadeDuration) {
    return this.createFadeTween(scene, 1, 0, fadeDuration);
  },

  createFadeOutTween: function(scene, fadeDuration) {
    return this.createFadeTween(scene, 0, 1, fadeDuration);
  },

  fadeOut: function(callback, callbackContext, fadeDuration) {
    // Get current active scene
    const scene = window.game.scene.scenes.find(s => s.scene.isActive());
    if (!scene) return;

    callbackContext = callbackContext || this;

    const fadeOutTween = this.createFadeOutTween(scene, fadeDuration);

    if(typeof callback === 'function') {
      fadeOutTween.on('complete', callback, callbackContext);
    }

    fadeOutTween.play();
  },

  fadeIn: function(callback, callbackContext, fadeDuration) {
    const scene = window.game.scene.scenes.find(s => s.scene.isActive());
    if (!scene) return;

    callbackContext = callbackContext || this;

    const fadeInTween = this.createFadeInTween(scene, fadeDuration);

    if(typeof callback === 'function') {
      fadeInTween.on('complete', callback, callbackContext);
    }

    fadeInTween.play();
  }
}
