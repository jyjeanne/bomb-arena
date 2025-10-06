var AudioPlayer = require("../util/audio_player");

class Boot extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
    console.log("[BOOT] Scene constructor called");
  }

  preload() {
    console.log("[BOOT] Preload phase");
  }

  create() {
    console.log("[BOOT] Create phase - initializing game");

    // Phaser 3 handles visibility automatically, but you can configure it
    this.game.events.on('hidden', () => {
      console.log("[BOOT] Game hidden");
    });

    this.game.events.on('visible', () => {
      console.log("[BOOT] Game visible");
    });

    AudioPlayer.initialize();
    console.log("[BOOT] Audio player initialized");

    // Phaser 3 scale configuration (should be in game config, but can adjust here)
    if (this.sys.game.device.os.desktop) {
      console.log("[BOOT] Desktop mode detected");
    } else {
      console.log("[BOOT] Mobile mode detected");
    }

    console.log("[BOOT] Starting Preloader scene");
    this.scene.start('Preloader');
  }
}

module.exports = Boot;
