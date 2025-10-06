var Fader = require("../util/fader");

class TitleScreen extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScreen' });
  }

  create() {
    this.showingInstructions = false;
    this.justClickedHowTo = false;
    this.justClickedOutOfHowTo = false;

    this.createClouds();
    this.createButtons();

    var startButtonTween = this.createInitialButtonTween(this.startButton, 200);
    var howToButtonTween = this.createInitialButtonTween(this.howToButton, 400);

    var title = this.add.image(55, 20 - 200, TEXTURES, "titlescreen/title.png");
    title.setOrigin(0, 0);

    // Phaser 3: tweens.add instead of game.add.tween
    this.tweens.add({
      targets: title,
      y: 20,
      duration: 500,
      ease: 'Bounce.easeOut',
      delay: 200
    });

    var bomberman = this.add.sprite(305 + 400, 265, TEXTURES, "titlescreen/bomberman/bomberman_01.png");
    bomberman.setOrigin(0, 0);

    // Phaser 3: anims.create for animations
    this.anims.create({
      key: 'bomb_animation',
      frames: [
        { key: TEXTURES, frame: "titlescreen/bomberman/bomberman_01.png" },
        { key: TEXTURES, frame: "titlescreen/bomberman/bomberman_02.png" },
        { key: TEXTURES, frame: "titlescreen/bomberman/bomberman_03.png" },
        { key: TEXTURES, frame: "titlescreen/bomberman/bomberman_04.png" },
        { key: TEXTURES, frame: "titlescreen/bomberman/bomberman_05.png" }
      ],
      frameRate: 5,
      repeat: -1
    });

    this.tweens.add({
      targets: bomberman,
      x: 305,
      duration: 300,
      ease: 'Linear',
      delay: 100,
      onComplete: () => {
        bomberman.play("bomb_animation");
      }
    });
  }

  createInitialButtonTween(button, delay) {
    return this.tweens.add({
      targets: button,
      x: 40,
      duration: 300,
      ease: 'Linear',
      delay: delay
    });
  }

  createClouds() {
    const cloudRightmostPointX = 700;
    const cloudLeftmostPointX = -260;
    const cloudTweenDuration = 80000;
    const tweenDuration = cloudTweenDuration * (this.cameras.main.width - cloudLeftmostPointX) / this.cameras.main.width;

    this.add.image(0, 0, TEXTURES, "titlescreen/background.png").setOrigin(0, 0);

    const cloudData = [
      {startingX: 400, startingY: 50, image: "cloud1"},
      {startingX: -150, startingY: 140, image: "cloud1"},
      {startingX: 375, startingY: 200, image: "cloud1"},
      {startingX: 330, startingY: -20, image: "cloud1"},
      {startingX: 110, startingY: 110, image: "cloud2"},
      {startingX: -300, startingY: 140, image: "cloud2"},
      {startingX: -300, startingY: -30, image: "cloud2"},
      {startingX: 0, startingY: 140, image: "cloud3"},
      {startingX: -75, startingY: 200, image: "cloud4"},
      {startingX: 200, startingY: 20, image: "cloud5"},
      {startingX: 100, startingY: -20, image: "cloud5"},
      {startingX: -200, startingY: 250, image: "cloud6"},
      {startingX: 40, startingY: 80, image: "cloud7"},
      {startingX: 200, startingY: 180, image: "cloud1"},
      {startingX: -150, startingY: 20, image: "cloud5"},
      {startingX: 300, startingY: 230, image: "cloud4"}
    ];

    for(let x = 0; x < cloudData.length; x++) {
      const data = cloudData[x];
      const cloudImage = this.add.image(data.startingX, data.startingY, TEXTURES, "titlescreen/" + data.image + ".png");
      cloudImage.setOrigin(0, 0);

      const initialTweenDuration = cloudTweenDuration * (this.cameras.main.width - data.startingX) / this.cameras.main.width;

      this.tweens.add({
        targets: cloudImage,
        x: cloudRightmostPointX,
        duration: initialTweenDuration,
        ease: 'Linear',
        onComplete: () => {
          cloudImage.x = cloudLeftmostPointX;
          this.tweens.add({
            targets: cloudImage,
            x: cloudRightmostPointX,
            duration: tweenDuration,
            ease: 'Linear',
            repeat: -1
          });
        }
      });
    }
  }

  createButtons() {
    // Phaser 3: Buttons are now interactive images
    this.startButton = this.add.image(40 - 250, 275, TEXTURES, "titlescreen/buttons/startbutton_01.png");
    this.startButton.setOrigin(0, 0);
    this.startButton.setInteractive();

    this.startButton.on('pointerover', () => {
      this.startButton.setFrame("titlescreen/buttons/startbutton_02.png");
    });

    this.startButton.on('pointerout', () => {
      this.startButton.setFrame("titlescreen/buttons/startbutton_01.png");
    });

    this.startButton.on('pointerdown', () => {
      if(!this.showingInstructions && !this.justClickedOutOfHowTo) {
        window.buttonClickSound.play();
        Fader.fadeOut(() => {
          this.scene.start("Lobby");
        });
      }
    });

    this.howToButton = this.add.image(40 - 250, 360, TEXTURES, "titlescreen/buttons/howtobutton_01.png");
    this.howToButton.setOrigin(0, 0);
    this.howToButton.setInteractive();

    this.howToButton.on('pointerover', () => {
      this.howToButton.setFrame("titlescreen/buttons/howtobutton_02.png");
    });

    this.howToButton.on('pointerout', () => {
      this.howToButton.setFrame("titlescreen/buttons/howtobutton_01.png");
    });

    this.howToButton.on('pointerdown', () => {
      if(!this.showingInstructions && !this.justClickedOutOfHowTo) {
        window.buttonClickSound.play();
        this.showingInstructions = true;
        Fader.fadeOut(() => {
          this.howTo = this.add.image(0, 0, TEXTURES, "titlescreen/howtoplay.png");
          this.howTo.setOrigin(0, 0);
          this.justClickedHowTo = true;
          Fader.fadeIn();
        }, this);
      }
    });
  }

  update() {
    // Phaser 3: activePointer is now this.input.activePointer
    if(!this.input.activePointer.isDown && this.justClickedHowTo) {
      this.justClickedHowTo = false;
    }

    if(!this.input.activePointer.isDown && this.justClickedOutOfHowTo) {
      this.justClickedOutOfHowTo = false;
    }

    if(this.input.activePointer.isDown && this.showingInstructions && !this.justClickedHowTo) {
      window.buttonClickSound.play();
      this.showingInstructions = false;
      this.justClickedOutOfHowTo = true;
      Fader.fadeOut(() => {
        this.howTo.destroy();
        Fader.fadeIn();
      }, this);
    }
  }
}

module.exports = TitleScreen;
