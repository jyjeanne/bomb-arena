// Phaser 3: Audio system updated
// Note: Sounds are now created in scenes, so we store references
var bombSound;
var powerupSound;

module.exports = {
  initialize: function() {
    // Sounds are created in Boot scene via this.sound.add
    // We'll access them through the global game object
    // This will be set in the Preloader scene
  },

  playBombSound: function() {
    // Access current scene's sound manager
    if (window.game && window.game.scene && window.game.scene.scenes[0]) {
      const scene = window.game.scene.getScene('Level') || window.game.scene.scenes[0];
      if (scene && scene.sound) {
        scene.sound.play("explosion");
      }
    }
  },

  playPowerupSound: function() {
    if (window.game && window.game.scene && window.game.scene.scenes[0]) {
      const scene = window.game.scene.getScene('Level') || window.game.scene.scenes[0];
      if (scene && scene.sound) {
        scene.sound.play("powerup");
      }
    }
  }
}
