var PowerupIds = require("../../../../common/powerup_ids");

var notificationImageMap = {};
notificationImageMap[PowerupIds.BOMB_STRENGTH] = "gamesprites/bomb_strength_notification.png";
notificationImageMap[PowerupIds.BOMB_CAPACITY] = "gamesprites/bomb_count_notification.png";
notificationImageMap[PowerupIds.SPEED] = "gamesprites/speed_notification.png";

exports.showPowerupNotification = function(powerupId, playerX, playerY) {
  // Get the Level scene
  const scene = window.game.scene.getScene('Level');
  if (!scene) return;

  const notificationImageKey = notificationImageMap[powerupId];

  // Phaser 3: add.image instead of new Phaser.Image
  const image = scene.add.image(playerX, playerY - 10, TEXTURES, notificationImageKey);
  image.setOrigin(0.5, 0.5);

  // Phaser 3: tweens.add for both tweens
  scene.tweens.add({
    targets: image,
    y: image.y - 30,
    duration: 600,
    ease: 'Linear'
  });

  scene.tweens.add({
    targets: image,
    alpha: 0,
    duration: 600,
    ease: 'Linear',
    onComplete: () => {
      image.destroy();
    }
  });
}
