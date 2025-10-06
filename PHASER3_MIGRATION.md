# Phaser 3.90.0 Migration Guide

## Overview
This document tracks the migration from Phaser 2.2.2 to Phaser 3.90.0 (latest stable as of October 2025).

## Migration Status

### ✅ Completed
- [x] Update package.json to Phaser 3.90.0
- [x] Install Phaser 3.90.0 via npm
- [x] Update main game initialization (`client/src/main.js`)
- [x] Migrate Boot state to Scene
- [x] Migrate Preloader state to Scene
- [x] Migrate TitleScreen state to Scene
- [x] Migrate Player entity
- [x] Update index.html to load Phaser 3

### 🚧 In Progress
- [ ] Migrate remaining game states
  - [ ] Lobby
  - [ ] StageSelect
  - [ ] PendingGame
  - [ ] Level (main gameplay - CRITICAL)
  - [ ] GameOver

- [ ] Migrate remaining entities
  - [ ] RemotePlayer
  - [ ] Bomb
  - [ ] RoundEndAnimation

- [ ] Update utility files
  - [ ] Fader
  - [ ] AudioPlayer
  - [ ] TextConfigurer
  - [ ] TextureUtil
  - [ ] PowerupNotificationPlayer

### 🔧 Testing & Fixes Required
- [ ] Test game compilation with `gulp`
- [ ] Fix any runtime errors
- [ ] Test multiplayer functionality
- [ ] Test all game mechanics (bomb placement, powerups, collisions)
- [ ] Performance testing and optimization

## Key API Changes (Phaser 2 → 3)

### 1. Game Initialization
**Phaser 2:**
```javascript
window.game = new Phaser.Game(600, 600, Phaser.AUTO, '');
game.state.add("Boot", Boot);
game.state.start('Boot');
```

**Phaser 3:**
```javascript
const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 600,
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [Boot, Preloader, TitleScreen, ...]
};
window.game = new Phaser.Game(config);
```

### 2. States → Scenes
**Phaser 2:**
```javascript
var Boot = function() {};
Boot.prototype = {
    preload: function() {},
    create: function() {},
    update: function() {}
};
```

**Phaser 3:**
```javascript
class Boot extends Phaser.Scene {
    constructor() {
        super({ key: 'Boot' });
    }
    preload() {}
    create() {}
    update() {}
}
```

### 3. Sprites & Entities
**Phaser 2:**
```javascript
var Player = function(x, y, id, color) {
    Phaser.Sprite.call(this, game, x, y, TEXTURES, frame);
    game.physics.enable(this, Phaser.Physics.ARCADE);
    game.add.existing(this);
};
Player.prototype = Object.create(Phaser.Sprite.prototype);
```

**Phaser 3:**
```javascript
class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, id, color) {
        super(scene, x, y, TEXTURES, frame);
        scene.add.existing(this);
        scene.physics.add.existing(this);
    }
}
```

### 4. Asset Loading
**Phaser 2:**
```javascript
this.load.atlasJSONHash(key, png, json);
this.load.tilemap(key, json, null, Phaser.Tilemap.TILED_JSON);
```

**Phaser 3:**
```javascript
this.load.atlas(key, png, json);
this.load.tilemapTiledJSON(key, json);
```

### 5. Physics & Collisions
**Phaser 2:**
```javascript
game.physics.arcade.collide(sprite1, sprite2);
game.physics.arcade.overlap(sprite1, sprite2, callback);
```

**Phaser 3:**
```javascript
// In scene create():
this.physics.add.collider(sprite1, sprite2);
this.physics.add.overlap(sprite1, sprite2, callback);
```

### 6. Input Handling
**Phaser 2:**
```javascript
if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
    // Move left
}
```

**Phaser 3:**
```javascript
const cursors = this.input.keyboard.createCursorKeys();
if (cursors.left.isDown) {
    // Move left
}
```

### 7. Animations
**Phaser 2:**
```javascript
sprite.animations.add("walk", [frame1, frame2], 10, true);
sprite.animations.play("walk");
```

**Phaser 3:**
```javascript
this.anims.create({
    key: 'walk',
    frames: [{ key: atlas, frame: frame1 }, { key: atlas, frame: frame2 }],
    frameRate: 10,
    repeat: -1
});
sprite.play('walk');
```

### 8. Tweens
**Phaser 2:**
```javascript
var tween = game.add.tween(sprite);
tween.to({x: 100}, 300, Phaser.Easing.Default, true);
```

**Phaser 3:**
```javascript
this.tweens.add({
    targets: sprite,
    x: 100,
    duration: 300,
    ease: 'Linear'
});
```

### 9. Tilemaps
**Phaser 2:**
```javascript
this.map = game.add.tilemap(key);
this.map.addTilesetImage(name, key, 40, 40);
this.groundLayer = new Phaser.TilemapLayer(game, this.map, layerIndex, w, h);
game.world.addAt(this.groundLayer, 0);
```

**Phaser 3:**
```javascript
this.map = this.make.tilemap({ key: key });
const tileset = this.map.addTilesetImage(name, key);
this.groundLayer = this.map.createLayer(layerName, tileset, 0, 0);
```

### 10. Text & UI
**Phaser 2:**
```javascript
this.text = game.add.text(x, y, "Hello");
this.text.anchor.setTo(0.5, 0.5);
```

**Phaser 3:**
```javascript
this.text = this.add.text(x, y, "Hello");
this.text.setOrigin(0.5, 0.5);
```

### 11. Graphics
**Phaser 2:**
```javascript
var graphics = game.add.graphics(0, 0);
graphics.beginFill(0x000000, 1);
graphics.drawRect(0, 0, 100, 100);
graphics.endFill();
```

**Phaser 3:**
```javascript
const graphics = this.add.graphics();
graphics.fillStyle(0x000000, 1);
graphics.fillRect(0, 0, 100, 100);
```

### 12. Buttons
**Phaser 2:**
```javascript
this.button = game.add.button(x, y, atlas, callback, this, over, out, down);
```

**Phaser 3:**
```javascript
this.button = this.add.image(x, y, atlas, frame);
this.button.setInteractive();
this.button.on('pointerover', () => { /* hover */ });
this.button.on('pointerout', () => { /* out */ });
this.button.on('pointerdown', callback);
```

### 13. Sound
**Phaser 2:**
```javascript
window.sound = new Phaser.Sound(game, key, volume);
```

**Phaser 3:**
```javascript
window.sound = this.sound.add(key, { volume: volume });
```

### 14. Scene Management
**Phaser 2:**
```javascript
game.state.start('NextState', true, false, param1, param2);
```

**Phaser 3:**
```javascript
this.scene.start('NextState', { param1, param2 });
```

## Performance Improvements in Phaser 3

1. **WebGL Renderer**: Significantly faster with better batching
2. **Texture Management**: Improved texture atlas handling
3. **Physics**: Optimized Arcade Physics engine
4. **Memory**: Better garbage collection
5. **Scene System**: More efficient than state system
6. **Camera**: Multi-camera support with better performance

## Remaining Critical Work

### High Priority
1. **Level.js** - Main gameplay scene (342 lines) - Contains all core game mechanics
   - Tilemap rendering
   - Player/RemotePlayer management
   - Bomb placement and detonation
   - Powerup handling
   - Socket.io event handlers

2. **Bomb.js** - Explosion system
   - Rendering explosions
   - Collision detection
   - Chain reactions

3. **RemotePlayer.js** - Network player interpolation
   - Smooth multiplayer movement
   - Animation sync

### Medium Priority
4. **Lobby.js** - Multiplayer lobby
5. **StageSelect.js** - Map selection
6. **PendingGame.js** - Game waiting room
7. **GameOver.js** - End game screen

### Utility Updates
8. **Fader.js** - Needs `game.add.graphics` → `this.add.graphics`
9. **AudioPlayer.js** - Sound API updates
10. **TextConfigurer.js** - Text style API updates

## Build System
- Gulp + Browserify + Watchify configuration works with Phaser 3
- No changes needed to build pipeline

## Testing Checklist
- [ ] Game loads without errors
- [ ] Asset loading works
- [ ] Title screen displays correctly
- [ ] Lobby functionality
- [ ] Level rendering (tilemap, sprites)
- [ ] Player movement
- [ ] Bomb placement
- [ ] Explosions
- [ ] Powerups
- [ ] Collisions
- [ ] Multiplayer sync
- [ ] Sound effects
- [ ] Animations
- [ ] Win/lose conditions
- [ ] Performance metrics

## Known Issues & Considerations
1. Global `game`, `player`, `socket`, `level` references may cause issues - consider migrating to scene data
2. Phaser 3's coordinate system differs slightly for tilemap layers
3. Animation frame names from texture atlas need verification
4. Physics body offset calculations may need adjustment
5. Socket.io event handlers need to properly bind to scene context

## Next Steps
1. Migrate Level.js (most critical)
2. Migrate Bomb.js and RemotePlayer.js
3. Update utility files
4. Migrate remaining UI scenes
5. Test full gameplay loop
6. Optimize performance
7. Fix multiplayer synchronization
