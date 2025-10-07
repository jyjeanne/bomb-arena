# Debugging Guide - Bomb Arena

## White Screen Issue - How to Debug

### 1. Open Browser Console

**Chrome/Edge:**
- Press `F12` or `Ctrl+Shift+I`
- Click "Console" tab

**Firefox:**
- Press `F12` or `Ctrl+Shift+K`
- Click "Console" tab

### 2. Expected Console Output

You should see messages like:
```
[MAIN] Starting Bomb Arena...
[MAIN] Phaser version: 3.90.0
[MAIN] Config created, initializing Phaser game...
[MAIN] Phaser game instance created successfully
[MAIN] Connecting to socket.io server...
[MAIN] Socket.io connection initiated
[MAIN] Phaser enhancements loaded
[MAIN] Initialization complete
[BOOT] Scene constructor called
[BOOT] Preload phase
[BOOT] Create phase - initializing game
[BOOT] Audio player initialized
[BOOT] Desktop mode detected
[BOOT] Starting Preloader scene
[PRELOADER] Scene constructor called
[PRELOADER] Starting asset preload
[PRELOADER] Setting up loader display
[PRELOADER] Loading texture atlas
[PRELOADER] Loading tilemaps
[PRELOADER] Loading audio
[SOCKET] Connected to server, socket ID: abc123
```

### 3. Common Issues & Solutions

#### Issue: "Cannot GET /client/index.html"
**Solution:** Use correct URL:
- ✅ `http://localhost:8007/index.html`
- ✅ `http://localhost:8007`
- ❌ `http://localhost:8007/client/index.html`

#### Issue: White screen, no console output
**Causes:**
1. JavaScript not loading
2. Build file missing or old
3. Browser caching issue

**Solution:**
```bash
# Rebuild the game
npx gulp compile

# Hard refresh browser
Ctrl+F5 (Windows/Linux)
Cmd+Shift+R (Mac)
```

#### Issue: "[PRELOADER] Error loading file: ..."
**Cause:** Missing asset files

**Solution:**
Check that these folders exist:
- `client/assets/textures/`
- `client/assets/levels/`
- `client/assets/sounds/`
- `client/assets/tiles/`

#### Issue: Socket connection errors
**Example:** `[SOCKET] Connection error: ...`

**Solution:**
1. Ensure server is running: `npm start`
2. Check server port in console
3. Verify `client/src/main.js` line 49 matches server port

#### Issue: Phaser not defined
**Example:** `ReferenceError: Phaser is not defined`

**Solution:**
Check `client/index.html` loads Phaser before game:
```html
<script src="../node_modules/phaser/dist/phaser.min.js"></script>
<script src="/socket.io/socket.io.js"></script>
<script src="dist/bomb_arena.min.js"></script>
```

### 4. Checking Build Output

Verify the build file exists and is recent:
```bash
ls -lh client/dist/bomb_arena.min.js
```

Should show ~65KB file with recent timestamp.

### 5. Network Tab (Advanced)

In browser DevTools:
1. Go to "Network" tab
2. Refresh page
3. Check all files load (200 status):
   - `index.html`
   - `phaser.min.js`
   - `bomb_arena.min.js`
   - `socket.io.js`

Red files (404/500) indicate loading issues.

### 6. Clear Browser Cache

Sometimes old files cause issues:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### 7. Server Logs

Check terminal where you ran `npm start`:
```
Server listening on port 8007
Socket connection from: [socket-id]
```

### 8. Common Console Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `io is not defined` | socket.io not loaded | Check script order in HTML |
| `TEXTURES is not defined` | Global not set | Rebuild with `npx gulp compile` |
| `Cannot read property 'add'` | Scene context issue | Check scene binding |
| `Failed to load resource` | Missing asset | Check file paths |

### 9. Manual Test Steps

1. **Start server:**
   ```bash
   npm start
   ```
   Look for: `Server listening on port 8007`

2. **Open browser:**
   Navigate to `http://localhost:8007`

3. **Check console:**
   Should see `[MAIN] Starting Bomb Arena...`

4. **Wait for loading:**
   Should see progress: "Loading... 0%" → "Loading... 100%"

5. **Expect title screen:**
   Should see animated title screen with clouds

### 10. Emergency Reset

If all else fails:
```bash
# Clean and rebuild
rm -rf node_modules/
npm install
npx gulp compile

# Restart server
npm start
```

Then hard refresh browser (Ctrl+F5).

## Getting Help

When reporting issues, include:
1. **Console output** (all red errors)
2. **Network tab** (any 404/500 errors)
3. **Server logs** (terminal output)
4. **Steps to reproduce**

## Success Indicators

✅ Game is working when you see:
- Console shows all `[MAIN]`, `[BOOT]`, `[PRELOADER]` messages
- No red errors in console
- Title screen appears with animated clouds
- Socket connection confirmed
- "Loading..." text appears and completes

Happy debugging! 🎮
