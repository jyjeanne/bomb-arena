const xOffset = 40;
const yOffset = 50;
const thumbnailXOffset = 255;
const thumbnailYOffset = 150;
const stageNameYOffset = 328;

let repeatingBombTilesprite;

const stages = [
  {name: "Limitless Brook", thumbnailKey: "thumbnails/limitless_brook_thumbnail.png", tilemapName: "levelOne", maxPlayers: 4, size: "small"},
  {name: "Danger Desert", thumbnailKey: "thumbnails/danger_desert_thumbnail.png", tilemapName: "levelTwo", maxPlayers: 4, size: "medium"}
];

class StageSelect extends Phaser.Scene {
  constructor() {
    super({ key: 'StageSelect' });
  }

  init(data) {
    repeatingBombTilesprite = data.rbts;
    this.gameId = data.gameId;
  }

  create() {
    const selectionWindow = this.add.image(xOffset, yOffset, TEXTURES, "lobby/select_stage.png");
    selectionWindow.setOrigin(0, 0);

    this.selectedStageIndex = 0;
    const initialStage = stages[this.selectedStageIndex];

    // Phaser 3: Interactive images instead of buttons
    this.leftButton = this.add.image(150, 180, TEXTURES, "lobby/buttons/left_select_button_01.png");
    this.leftButton.setOrigin(0, 0);
    this.leftButton.setInteractive();

    this.leftButton.on('pointerover', () => {
      this.leftButton.setFrame("lobby/buttons/left_select_button_02.png");
    });

    this.leftButton.on('pointerout', () => {
      this.leftButton.setFrame("lobby/buttons/left_select_button_01.png");
    });

    this.leftButton.on('pointerdown', () => {
      window.buttonClickSound.play();
      this.leftSelect();
    });

    this.rightButton = this.add.image(400, 180, TEXTURES, "lobby/buttons/right_select_button_01.png");
    this.rightButton.setOrigin(0, 0);
    this.rightButton.setInteractive();

    this.rightButton.on('pointerover', () => {
      this.rightButton.setFrame("lobby/buttons/right_select_button_02.png");
    });

    this.rightButton.on('pointerout', () => {
      this.rightButton.setFrame("lobby/buttons/right_select_button_01.png");
    });

    this.rightButton.on('pointerdown', () => {
      window.buttonClickSound.play();
      this.rightSelect();
    });

    this.okButton = this.add.image(495, 460, TEXTURES, "lobby/buttons/ok_button_01.png");
    this.okButton.setOrigin(0, 0);
    this.okButton.setInteractive();

    this.okButton.on('pointerover', () => {
      this.okButton.setFrame("lobby/buttons/ok_button_02.png");
    });

    this.okButton.on('pointerout', () => {
      this.okButton.setFrame("lobby/buttons/ok_button_01.png");
    });

    this.okButton.on('pointerdown', () => {
      window.buttonClickSound.play();
      this.confirmStageSelection();
    });

    this.thumbnail = this.add.image(thumbnailXOffset, thumbnailYOffset, TEXTURES, initialStage.thumbnailKey);
    this.thumbnail.setOrigin(0, 0);

    // Display title
    this.text = this.add.text(this.cameras.main.width / 2, stageNameYOffset, initialStage.name);
    this.configureText(this.text, "white", 28);
    this.text.setOrigin(0.5, 0.5);

    // Display number of players
    this.numPlayersText = this.add.text(145, 390, "Max # of players:   " + initialStage.maxPlayers);
    this.configureText(this.numPlayersText, "white", 18);

    // Display stage size
    this.stageSizeText = this.add.text(145, 420, "Map size:   " + initialStage.size);
    this.configureText(this.stageSizeText, "white", 18);
  }

  leftSelect() {
    if(this.selectedStageIndex === 0) {
      this.selectedStageIndex = stages.length - 1;
    } else {
      this.selectedStageIndex--;
    }

    this.updateStageInfo();
  }

  rightSelect() {
    if(this.selectedStageIndex === stages.length - 1) {
      this.selectedStageIndex = 0;
    } else {
      this.selectedStageIndex++;
    }

    this.updateStageInfo();
  }

  update() {
    if (repeatingBombTilesprite) {
      repeatingBombTilesprite.tilePositionX++;
      repeatingBombTilesprite.tilePositionY--;
    }
  }

  updateStageInfo() {
    const newStage = stages[this.selectedStageIndex];
    this.text.setText(newStage.name);
    this.numPlayersText.setText("Max # of players:   " + newStage.maxPlayers);
    this.stageSizeText.setText("Map size:   " + newStage.size);
    this.thumbnail.setFrame(newStage.thumbnailKey);
  }

  configureText(text, color, size) {
    text.setFontFamily("Carter One");
    text.setColor(color);
    text.setFontSize(size);
  }

  confirmStageSelection() {
    const selectedStage = stages[this.selectedStageIndex];

    socket.emit("select stage", {mapName: selectedStage.tilemapName});
    this.scene.start("PendingGame", { tilemapName: selectedStage.tilemapName, gameId: this.gameId, rbts: repeatingBombTilesprite });
  }
}

module.exports = StageSelect;
