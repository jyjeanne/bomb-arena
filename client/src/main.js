console.log("[MAIN] Starting Bomb Arena...");
console.log("[MAIN] Phaser version:", Phaser.VERSION);

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

console.log("[MAIN] Config created, initializing Phaser game...");

// Global references (to be migrated to scene data/registry)
try {
    window.game = new Phaser.Game(config);
    console.log("[MAIN] Phaser game instance created successfully");
} catch (error) {
    console.error("[MAIN] Error creating Phaser game:", error);
    throw error;
}

window.player = null;
window.socket = null;
window.level = null;
window.TEXTURES = "bbo_textures";

startGame();

function startGame() {
    console.log("[MAIN] Connecting to socket.io server...");
    try {
        socket = io("http://localhost:8007"); // TODO check port already used

        socket.on('connect', function() {
            console.log("[SOCKET] Connected to server, socket ID:", socket.id);
        });

        socket.on('connect_error', function(error) {
            console.error("[SOCKET] Connection error:", error);
        });

        socket.on('disconnect', function(reason) {
            console.log("[SOCKET] Disconnected:", reason);
        });

        console.log("[MAIN] Socket.io connection initiated");
    } catch (error) {
        console.error("[MAIN] Error connecting to socket:", error);
    }

    // Phaser enhancements will need to be updated for Phaser 3
    try {
        require("./game/mods/phaser_enhancements");
        console.log("[MAIN] Phaser enhancements loaded");
    } catch (error) {
        console.error("[MAIN] Error loading phaser enhancements:", error);
    }

    console.log("[MAIN] Initialization complete");
}