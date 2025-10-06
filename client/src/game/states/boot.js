var AudioPlayer = require("../util/audio_player");

class Boot extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload() {
    // Fill in later.
  }

  create() {
    // Phaser 3 handles visibility automatically, but you can configure it
    this.game.events.on('hidden', () => {
      // Game paused when hidden (optional)
    });

    this.game.events.on('visible', () => {
      // Game resumed when visible (optional)
    });

    AudioPlayer.initialize();

    // Phaser 3 scale configuration (should be in game config, but can adjust here)
    if (this.sys.game.device.os.desktop) {
      // Desktop specific settings if needed
    } else {
      // Mobile scaling - Phaser 3 handles this better in config
      // Scale mode is set in main config
    }

    this.scene.start('Preloader');
  }
}

module.exports = Boot;
