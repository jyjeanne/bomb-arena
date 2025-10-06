var TextConfigurer = require('../util/text_configurer');

const xOffset = 40;
const yOffset = 50;
const buttonXOffset = 330;
const startGameButtonYOffset = 400;
const leaveButtonYOffset = 450;
const characterSquareStartingX = 330;
const characterSquareStartingY = 80;
const characterSquareXDistance = 105;
const characterSquareYDistance = 100;
const characterOffsetX = 4.5;
const characterOffsetY = 4.5;
const minPlayerMessageOffsetX = 80;
const minPlayerMessageOffsetY = 400;
const numCharacterSquares = 6;

let repeatingBombTilesprite;

class PendingGame extends Phaser.Scene {
  constructor() {
    super({ key: 'PendingGame' });
  }

  init(data) {
    this.tilemapName = data.tilemapName;
    this.gameId = data.gameId;
    repeatingBombTilesprite = data.rbts;
  }

  create() {
    socket.emit("enter pending game", {gameId: this.gameId});

    const backdrop = this.add.image(xOffset, yOffset, TEXTURES, "lobby/backdrop.png");
    backdrop.setOrigin(0, 0);

    // Start game button (initially disabled)
    this.startGameButton = this.add.image(buttonXOffset, startGameButtonYOffset, TEXTURES, "lobby/buttons/start_game_button_03.png");
    this.startGameButton.setOrigin(0, 0);

    // Leave game button
    this.leaveGameButton = this.add.image(buttonXOffset, leaveButtonYOffset, TEXTURES, "lobby/buttons/leave_game_button_01.png");
    this.leaveGameButton.setOrigin(0, 0);
    this.leaveGameButton.setInteractive();

    this.leaveGameButton.on('pointerover', () => {
      this.leaveGameButton.setFrame("lobby/buttons/leave_game_button_02.png");
    });

    this.leaveGameButton.on('pointerout', () => {
      this.leaveGameButton.setFrame("lobby/buttons/leave_game_button_01.png");
    });

    this.leaveGameButton.on('pointerdown', () => {
      window.buttonClickSound.play();
      this.leaveGameAction();
    });

    this.characterSquares = this.drawCharacterSquares(4);
    this.characterImages = [];
    this.numPlayersInGame = 0;

    this.minPlayerMessage = this.add.text(minPlayerMessageOffsetX, minPlayerMessageOffsetY, "Cannot start game without\nat least 2 players.");
    TextConfigurer.configureText(this.minPlayerMessage, "red", 17);
    this.minPlayerMessage.visible = false;

    socket.on("show current players", this.populateCharacterSquares.bind(this));
    socket.on("player joined", this.playerJoined.bind(this));
    socket.on("player left", this.playerLeft.bind(this));
    socket.on("start game on client", this.startGame.bind(this));
  }

  update() {
    if (repeatingBombTilesprite) {
      repeatingBombTilesprite.tilePositionX++;
      repeatingBombTilesprite.tilePositionY--;
    }
  }

  drawCharacterSquares(numOpenings) {
    const characterSquares = [];
    let yOff = characterSquareStartingY;
    let xOff = characterSquareStartingX;

    for(let i = 0; i < numCharacterSquares; i++) {
      const frame = i < numOpenings ? "lobby/slots/character_square_01.png" : "lobby/slots/character_square_02.png";
      characterSquares[i] = this.add.sprite(xOff, yOff, TEXTURES, frame);
      characterSquares[i].setOrigin(0, 0);

      if(i % 2 == 0) {
        xOff += characterSquareXDistance;
      } else {
        xOff = characterSquareStartingX;
        yOff += characterSquareYDistance;
      }
    }

    return characterSquares;
  }

  populateCharacterSquares(data) {
    this.numPlayersInGame = 0;

    for(let playerId in data.players) {
      const color = data.players[playerId].color;
      this.characterImages[playerId] = this.add.image(
        this.characterSquares[this.numPlayersInGame].x + characterOffsetX,
        this.characterSquares[this.numPlayersInGame].y + characterOffsetY,
        TEXTURES,
        "lobby/bomberman_head/bomberman_head_" + color + ".png"
      );
      this.characterImages[playerId].setOrigin(0, 0);
      this.numPlayersInGame++;
    }

    if(this.numPlayersInGame > 1) {
      this.activateStartGameButton();
    } else {
      this.minPlayerMessage.visible = true;
    }
  }

  playerJoined(data) {
    this.numPlayersInGame++;
    const index = this.numPlayersInGame - 1;

    this.characterImages[data.id] = this.add.image(
      this.characterSquares[index].x + characterOffsetX,
      this.characterSquares[index].y + characterOffsetY,
      TEXTURES,
      "lobby/bomberman_head/bomberman_head_" + data.color + ".png"
    );
    this.characterImages[data.id].setOrigin(0, 0);

    // Activate start game button if this is the second player
    if(this.numPlayersInGame == 2) {
      this.activateStartGameButton();
    }
  }

  activateStartGameButton() {
    this.minPlayerMessage.visible = false;
    this.startGameButton.setFrame("lobby/buttons/start_game_button_01.png");
    this.startGameButton.setInteractive();

    this.startGameButton.removeAllListeners();

    this.startGameButton.on('pointerover', () => {
      this.startGameButton.setFrame("lobby/buttons/start_game_button_02.png");
    });

    this.startGameButton.on('pointerout', () => {
      this.startGameButton.setFrame("lobby/buttons/start_game_button_01.png");
    });

    this.startGameButton.on('pointerdown', () => {
      window.buttonClickSound.play();
      this.startGameAction();
    });
  }

  deactivateStartGameButton() {
    this.minPlayerMessage.visible = true;
    this.startGameButton.setFrame("lobby/buttons/start_game_button_03.png");
    this.startGameButton.removeAllListeners();
    this.startGameButton.disableInteractive();
  }

  playerLeft(data) {
    this.numPlayersInGame--;

    if(this.numPlayersInGame == 1) {
      this.deactivateStartGameButton();
    }

    for(let playerId in this.characterImages) {
      this.characterImages[playerId].destroy();
    }
    this.populateCharacterSquares(data);
  }

  startGameAction() {
    socket.emit("start game on server");
  }

  leaveGameAction() {
    socket.emit("leave pending game");
    socket.removeAllListeners();
    this.scene.start("Lobby", { rbts: repeatingBombTilesprite });
  }

  startGame(data) {
    socket.removeAllListeners();
    this.scene.start("Level", { tilemapName: data.mapName, players: data.players, id: socket.id });
  }
}

module.exports = PendingGame;
