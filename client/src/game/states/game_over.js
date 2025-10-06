var TextConfigurer = require('../util/text_configurer');

class GameOver extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  init(data) {
    this.winnerColor = data.gameWinnerColor;
    this.winByDefault = data.noOpponents;
  }

  create() {
    let textToDisplay = this.winByDefault ?
      "     No other players remaining.\n              You win by default." :
      "       Game Over. Winner: " + this.winnerColor;

    textToDisplay += "\n\nPress Enter to return to main menu.";

    const textObject = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      textToDisplay
    );
    textObject.setOrigin(0.5, 0.5);
    TextConfigurer.configureText(textObject, "white", 28);

    // Phaser 3: Create key object
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
  }

  update() {
    // Phaser 3: Check key state
    if(this.enterKey.isDown) {
      this.returnToLobby();
    }
  }

  returnToLobby() {
    this.scene.start("Lobby");
  }
}

module.exports = GameOver;
