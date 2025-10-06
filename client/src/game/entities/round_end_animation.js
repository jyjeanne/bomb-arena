var TextConfigurer = require('../util/text_configurer');

const screenWidth = 600;
const xOffset = 100 - screenWidth;
const yOffset = 60;
const headerXOffset = 150 - screenWidth;
const headerYOffset = 65;
const winnerPicXOffset = 225 - screenWidth;
const winnerPicYOffset = 310;
const defaultTextXOffset = 220 - screenWidth;
const defaultTextYOffset = 220;
const singleWinnerText = "Winner is...";
const roundEndTieText = "Draw! Winners are...";

// Phaser 3: Convert to Container instead of Group
class RoundEndAnimation extends Phaser.GameObjects.Container {
  constructor(scene, roundNumber, winningColors) {
    super(scene);

    this.scene = scene;
    this.winnerImageIndices = [];

    // Add to scene
    scene.add.existing(this);

    // Create round end window
    const roundEndWindow = scene.add.image(xOffset, yOffset, TEXTURES, "lobby/end_of_round_window.png");
    roundEndWindow.setOrigin(0, 0);

    const header = scene.add.text(headerXOffset, headerYOffset, "Round " + roundNumber + " Complete!");
    TextConfigurer.configureText(header, "white", 32);

    // Text and offset differ based on whether there was a tie
    const actualTextXOffset = winningColors.length > 1 ? defaultTextXOffset - 55 : defaultTextXOffset;
    const actualTextToDisplay = winningColors.length > 1 ? roundEndTieText : singleWinnerText;

    const textObject = scene.add.text(actualTextXOffset, defaultTextYOffset, actualTextToDisplay);
    TextConfigurer.configureText(textObject, "white", 28);
    textObject.setAlpha(0);

    // Add children to container
    this.add(roundEndWindow);
    this.add(header);
    this.add(textObject);

    this.createAndAddWinnerImages(winningColors);
  }

  createAndAddWinnerImages(winningColors) {
    let index = 3; // 3 is the index of the first winner image

    winningColors.forEach((color) => {
      const winnerPicImage = this.scene.add.image(winnerPicXOffset, winnerPicYOffset, TEXTURES, "lobby/bomberman_head/bomberman_head_" + color + ".png");
      winnerPicImage.setOrigin(0, 0);
      winnerPicImage.setScale(1.75, 1.75);
      winnerPicImage.setAlpha(0);

      this.add(winnerPicImage);
      this.winnerImageIndices.push(index++);
    });
  }

  beginAnimation(callback) {
    // Entrance tween
    const entranceTween = this.scene.tweens.add({
      targets: this,
      x: screenWidth,
      duration: 300,
      ease: 'Linear',
      onComplete: () => {
        winnerTextTween.play();
      }
    });

    // Winner text tween
    const winnerTextTween = this.scene.tweens.add({
      targets: this.list[2], // textObject is at index 2
      alpha: 1,
      duration: 800,
      ease: 'Linear',
      paused: true,
      onComplete: () => {
        winnerDisplayTween.play();
      }
    });

    // Exit tween
    const exitTween = this.scene.tweens.add({
      targets: this,
      x: 2 * screenWidth,
      duration: 300,
      delay: 200,
      ease: 'Linear',
      paused: true,
      onComplete: () => {
        callback();
        this.destroy();
      }
    });

    // Winner images display tween
    const winnerDisplayTween = this.generateWinnerImageTween(this.winnerImageIndices, exitTween);
  }

  generateWinnerImageTween(indices, nextTween) {
    const winnerImageTweens = [];

    for (let i = 0; i < indices.length; i++) {
      const tween = this.scene.tweens.add({
        targets: this.list[indices[i]],
        alpha: 1,
        duration: 900,
        ease: 'Linear',
        paused: true,
        onComplete: () => {
          if (i < indices.length - 1) {
            // Fade out and start next
            this.scene.tweens.add({
              targets: this.list[indices[i]],
              alpha: 0,
              duration: 900,
              ease: 'Linear',
              onComplete: () => {
                if (winnerImageTweens[i + 1]) {
                  winnerImageTweens[i + 1].play();
                }
              }
            });
          } else {
            // Last winner, start exit tween
            nextTween.play();
          }
        }
      });

      winnerImageTweens.push(tween);
    }

    return winnerImageTweens[0];
  }
}

module.exports = RoundEndAnimation;
