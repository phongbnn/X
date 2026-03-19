# 🖱️ Remote Mouse Pro

Turn your phone into a **wireless mouse & keyboard** for your PC. No apps needed — just open the browser on your phone!

## ✨ Features

- **Zero-delay touchpad** — single-finger mouse movement with acceleration
- **Tap gestures** — tap to click, double-tap to double-click, long-press to drag
- **Two-finger scroll** — natural or standard scroll direction
- **Right click** — two-finger tap or dedicated button
- **Drag & drop** — long press activates drag mode
- **Full virtual keyboard** — F1–F12, arrows, nav keys, modifiers
- **Quick shortcuts** — Copy, Paste, Cut, Undo, Redo, and more
- **Media controls** — Play/Pause, Next/Prev, Volume, Mute
- **System shortcuts** — Lock screen, Task Manager, File Explorer
- **Bluetooth keyboard** — any BT keyboard connected to phone is forwarded to PC
- **Text input** — type on phone, text appears on PC
- **QR code** — scan to connect from any device on same network
- **Adjustable settings** — sensitivity, scroll speed, tap threshold
- **Auto-reconnect** — reconnects automatically if connection drops
- **Screen wake lock** — keeps phone screen on while in use

## 🚀 Quick Start

### 1. Install Node.js
Download from https://nodejs.org (v16 or newer)

### 2. Install dependencies

```bash
cd remote-mouse
npm install
```

> **Note:** robotjs requires build tools:
> - **Windows:** `npm install --global windows-build-tools` (run as admin)
> - **macOS:** `xcode-select --install`
> - **Linux:** `sudo apt install build-essential libxtst-dev`

### 3. Start the server

```bash
npm start
```

You'll see:
```
╔══════════════════════════════════════╗
║      🖱️  Remote Mouse Pro Server      ║
╠══════════════════════════════════════╣
║  📱 Phone URL: http://192.168.1.x:8765
║  💻 Local:     http://localhost:8765
╚══════════════════════════════════════╝
```

### 4. Open on phone

- Type the URL shown in your phone browser
- OR scan the QR code shown in the app Settings tab
- Make sure phone and PC are on the **same WiFi network**

## 🎮 Controls

### Trackpad
| Gesture | Action |
|---------|--------|
| 1 finger drag | Move mouse |
| 1 finger tap | Left click |
| 1 finger double-tap | Double click |
| 2 finger drag | Scroll |
| 2 finger tap | Right click |
| Long press | Drag mode (hold left button) |

### Buttons
- **LEFT** — left mouse button (hold for drag)
- **↕** — scroll lock toggle
- **RIGHT** — right mouse button

### Bluetooth Keyboard
When a BT keyboard is connected to your phone, **all key presses are automatically forwarded to the PC** — no setup needed!

## ⚙️ Configuration

Adjust in the **Settings** tab:
- **Sensitivity** (0.5–5.0) — mouse speed
- **Scroll Speed** (0.5–5.0) — two-finger scroll rate
- **Acceleration** — speed boost on fast movements
- **Natural Scroll** — invert scroll direction
- **Tap Click** — enable/disable tap to click
- **Tap Threshold** — max milliseconds to register as a tap

## 🔧 Troubleshooting

**"robotjs" build fails:**
```bash
# Windows (admin PowerShell)
npm install --global windows-build-tools
npm install

# macOS
xcode-select --install
npm install

# Linux (Ubuntu/Debian)
sudo apt install build-essential libxtst-dev libpng-dev
npm install
```

**Can't connect from phone:**
- Ensure phone and PC are on the same WiFi
- Disable PC firewall temporarily or allow port 8765
- Try `http://[PC-IP]:8765` directly

**Mouse/keyboard not responding:**
- On macOS: grant Accessibility permission to Terminal
- On Windows: run as Administrator if needed

## 📦 Port Change

```bash
PORT=3000 npm start
```

## License
MIT — Free to use, modify, and distribute.
