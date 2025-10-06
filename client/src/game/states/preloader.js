var TextConfigurer = require("../util/text_configurer");

class Preloader extends Phaser.Scene {
  constructor() {
    super({ key: 'Preloader' });
    console.log("[PRELOADER] Scene constructor called");
  }

  displayLoader() {
    console.log("[PRELOADER] Setting up loader display");
    // Phaser 3: this.add instead of game.add, this.cameras.main instead of game.camera
    this.text = this.add.text(this.cameras.main.width / 2, 250, "Loading... ");
    this.text.setOrigin(0.5, 0.5); // Phaser 3: setOrigin instead of anchor.setTo
    TextConfigurer.configureText(this.text, "white", 32);

    // Phaser 3: load events are different
    this.load.on('progress', (progress) => {
      this.text.setText("Loading... " + Math.floor(progress * 100) + "%");
    });

    this.load.on('complete', () => {
      this.scene.start("TitleScreen");
    });
  }

  preload() {
    console.log("[PRELOADER] Starting asset preload");
    this.displayLoader();

    // Phaser 3: atlas method changed
    console.log("[PRELOADER] Loading texture atlas");
    this.load.atlas("bbo_textures", "assets/textures/bbo_textures.png", "assets/textures/bbo_textures.json");

    // Phaser 3: tilemapTiledJSON instead of tilemap
    console.log("[PRELOADER] Loading tilemaps");
    this.load.tilemapTiledJSON("levelOne", "assets/levels/level_one.json");
    this.load.tilemapTiledJSON("levelTwo", "assets/levels/level_two.json");
    this.load.image("tiles", "assets/tiles/tileset.png");
    this.load.image("repeating_bombs", "/assets/repeating_bombs.png");

    // Phaser 3: audio loading is the same
    console.log("[PRELOADER] Loading audio");
    this.load.audio("explosion", "assets/sounds/bomb.ogg");
    this.load.audio("powerup", "assets/sounds/powerup.ogg");
    this.load.audio("click", "assets/sounds/click.ogg");

    this.load.on('loaderror', (file) => {
      console.error("[PRELOADER] Error loading file:", file.key, file.src);
    });
  }

  create() {
    // Phaser 3: sound.add instead of new Phaser.Sound
    window.buttonClickSound = this.sound.add("click", { volume: 0.25 });
  }
}

module.exports = Preloader;
