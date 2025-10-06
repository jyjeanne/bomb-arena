// Phaser 3 uses config object for initialization
const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 600,
    parent: '',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [
        require("./game/states/boot"),
        require("./game/states/preloader"),
        require("./game/states/title_screen"),
        require("./game/states/lobby"),
        require("./game/states/stage_select"),
        require("./game/states/pending_game"),
        require("./game/states/level"),
        require("./game/states/game_over")
    ]
};

// Global references (to be migrated to scene data/registry)
window.game = new Phaser.Game(config);
window.player = null;
window.socket = null;
window.level = null;
window.TEXTURES = "bbo_textures";

startGame();

function startGame() {
    socket = io("http://localhost:8007"); // TODO check port already used

    // Phaser enhancements will need to be updated for Phaser 3
    require("./game/mods/phaser_enhancements");
}