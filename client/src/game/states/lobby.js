var TextConfigurer = require("../util/text_configurer");

const initialSlotYOffset = 130;
const slotXOffset = 40;
const lobbySlotDistance = 60;
const textXOffset = 260;
const textYOffset = 25;
const headerYOffset = 70;

let repeatingBombTilesprite;

class Lobby extends Phaser.Scene {
  constructor() {
    super({ key: 'Lobby' });
  }

  init(data) {
    repeatingBombTilesprite = data ? data.rbts : null;
  }

  create() {
    this.stateSettings = {
      empty: {
        outFrame: "lobby/slots/game_slot_01.png",
        overFrame: "lobby/slots/game_slot_02.png",
        text: "Host Game ",
        callback: this.hostGameAction
      },
      joinable: {
        outFrame: "lobby/slots/game_slot_03.png",
        overFrame: "lobby/slots/game_slot_04.png",
        text: "Join Game ",
        callback: this.joinGameAction
      },
      settingup: {
        outFrame: "lobby/slots/game_slot_05.png",
        overFrame: "lobby/slots/game_slot_05.png",
        text: "Game is being set up... ",
        callback: null
      },
      inprogress: {
        outFrame: "lobby/slots/game_slot_05.png",
        overFrame: "lobby/slots/game_slot_05.png",
        text: "Game in Progress ",
        callback: null
      },
      full: {
        outFrame: "lobby/slots/game_slot_05.png",
        overFrame: "lobby/slots/game_slot_05.png",
        text: "Game Full ",
        callback: null
      }
    };

    // Phaser 3: tileSprite
    if(repeatingBombTilesprite == null) {
      repeatingBombTilesprite = this.add.tileSprite(0, 0, 608, 608, "repeating_bombs");
      repeatingBombTilesprite.setOrigin(0, 0);
    }

    this.backdrop = this.add.image(12.5, 12.5, TEXTURES, "lobby/lobby_backdrop.png");
    this.backdrop.setOrigin(0, 0);

    this.header = this.add.text(this.cameras.main.width / 2, headerYOffset, "Lobby");
    this.header.setOrigin(0.5, 0.5);
    TextConfigurer.configureText(this.header, "white", 32);

    this.slots = [];
    this.labels = [];

    socket.emit("enter lobby");

    // Clean up old listeners
    socket.off("add slots");
    socket.off("update slot");

    socket.on("add slots", this.addSlots.bind(this));
    socket.on("update slot", this.updateSlot.bind(this));
  }

  update() {
    if (repeatingBombTilesprite) {
      repeatingBombTilesprite.tilePositionX++;
      repeatingBombTilesprite.tilePositionY--;
    }
  }

  addSlots(gameData) {
    if(this.slots.length > 0) {
      return;
    }

    for(let i = 0; i < gameData.length; i++) {
      let callback = null;
      const state = gameData[i].state;
      const settings = this.stateSettings[state];

      // Create closure for callback
      if(settings.callback != null) {
        callback = () => {
          settings.callback.call(this, i);
        };
      }

      const slotYOffset = initialSlotYOffset + i * lobbySlotDistance;

      // Phaser 3: Interactive image instead of button
      this.slots[i] = this.add.image(slotXOffset, slotYOffset, TEXTURES, settings.outFrame);
      this.slots[i].setOrigin(0, 0);

      if (callback) {
        this.slots[i].setInteractive();

        this.slots[i].on('pointerover', () => {
          this.slots[i].setFrame(settings.overFrame);
        });

        this.slots[i].on('pointerout', () => {
          this.slots[i].setFrame(settings.outFrame);
        });

        this.slots[i].on('pointerdown', () => {
          window.buttonClickSound.play();
          callback();
        });
      }

      const text = this.add.text(slotXOffset + textXOffset, slotYOffset + textYOffset, settings.text);
      TextConfigurer.configureText(text, "white", 18);
      text.setOrigin(0.5, 0.5);

      this.labels[i] = text;
    }
  }

  hostGameAction(gameId) {
    socket.emit("host game", {gameId: gameId});
    socket.removeAllListeners();
    this.scene.start("StageSelect", { gameId: gameId, rbts: repeatingBombTilesprite });
  }

  joinGameAction(gameId) {
    socket.removeAllListeners();
    this.scene.start("PendingGame", { tilemapName: null, gameId: gameId, rbts: repeatingBombTilesprite });
  }

  updateSlot(updateInfo) {
    const settings = this.stateSettings[updateInfo.newState];
    const id = updateInfo.gameId;
    const button = this.slots[id];

    this.labels[id].setText(settings.text);
    button.setFrame(settings.outFrame);

    // Remove old listeners
    button.removeAllListeners();

    // Add new callback if available
    if (settings.callback) {
      button.setInteractive();

      button.on('pointerover', () => {
        button.setFrame(settings.overFrame);
      });

      button.on('pointerout', () => {
        button.setFrame(settings.outFrame);
      });

      button.on('pointerdown', () => {
        window.buttonClickSound.play();
        settings.callback.call(this, id);
      });
    } else {
      button.disableInteractive();
    }
  }
}

module.exports = Lobby;
