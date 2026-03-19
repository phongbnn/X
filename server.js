/**
 * Remote Mouse Pro - Server
 * Controls PC mouse & keyboard via WebSocket from phone
 */

const express = require('express');
const WebSocket = require('ws');
const robot = require('robotjs');
const QRCode = require('qrcode');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8765;

// ─── Helpers ───────────────────────────────────────────────────────────────

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Browser key → robotjs key name mapping
const KEY_MAP = {
  'Enter': 'enter', 'Return': 'enter',
  'Backspace': 'backspace', 'Delete': 'delete',
  'Tab': 'tab', 'Escape': 'escape', 'Space': 'space', ' ': 'space',
  'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
  'Home': 'home', 'End': 'end', 'PageUp': 'pageup', 'PageDown': 'pagedown',
  'Insert': 'insert', 'PrintScreen': 'printscreen', 'ScrollLock': 'scrolllock',
  'Pause': 'pause', 'CapsLock': 'caps_lock', 'NumLock': 'numlock',
  'F1':'f1','F2':'f2','F3':'f3','F4':'f4','F5':'f5','F6':'f6',
  'F7':'f7','F8':'f8','F9':'f9','F10':'f10','F11':'f11','F12':'f12',
  'Control': 'control', 'Shift': 'shift', 'Alt': 'alt',
  'Meta': process.platform === 'darwin' ? 'command' : 'win',
  'AudioVolumeMute': 'audio_mute',
  'AudioVolumeUp': 'audio_vol_up',
  'AudioVolumeDown': 'audio_vol_down',
  'MediaPlayPause': 'audio_play',
  'MediaStop': 'audio_stop',
  'MediaTrackNext': 'audio_next',
  'MediaTrackPrevious': 'audio_prev',
};

function mapKey(key) {
  if (KEY_MAP[key]) return KEY_MAP[key];
  if (key && key.length === 1) return key.toLowerCase();
  return null;
}

// ─── Express Routes ─────────────────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'public')));

app.get('/qr', async (req, res) => {
  const ip = getLocalIP();
  const url = `http://${ip}:${PORT}`;
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: { dark: '#00d4ff', light: '#0a0a0f' }
    });
    res.json({ qr: dataUrl, url, ip, port: PORT });
  } catch (e) {
    res.json({ url, ip, port: PORT });
  }
});

app.get('/info', (req, res) => {
  const screen = robot.getScreenSize();
  res.json({ screen, platform: process.platform });
});

// ─── WebSocket Server ────────────────────────────────────────────────────────

const server = app.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIP();
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║      🖱️  Remote Mouse Pro Server      ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  📱 Phone URL: http://${ip}:${PORT}`);
  console.log(`║  💻 Local:     http://localhost:${PORT}`);
  console.log('║  Press Ctrl+C to stop                ║');
  console.log('╚══════════════════════════════════════╝\n');
});

const wss = new WebSocket.Server({ server });

// robotjs: zero delay for real-time control
robot.setMouseDelay(0);
robot.setKeyboardDelay(0);

const clients = new Set();

wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  clients.add(ws);
  console.log(`✅ Connected: ${clientIP} (${clients.size} client(s))`);

  // Send ack
  ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      handleMessage(msg, ws);
    } catch (e) {
      // ignore malformed
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`❌ Disconnected: ${clientIP} (${clients.size} client(s))`);
  });

  ws.on('error', () => clients.delete(ws));
});

// ─── Message Handler ─────────────────────────────────────────────────────────

function handleMessage(msg, ws) {
  try {
    switch (msg.type) {

      // ── Mouse Movement ──
      case 'move': {
        const pos = robot.getMousePos();
        const screen = robot.getScreenSize();
        const x = Math.max(0, Math.min(screen.width - 1,  Math.round(pos.x + (msg.dx || 0))));
        const y = Math.max(0, Math.min(screen.height - 1, Math.round(pos.y + (msg.dy || 0))));
        robot.moveMouse(x, y);
        break;
      }

      // ── Move to absolute position ──
      case 'moveto': {
        const screen = robot.getScreenSize();
        const x = Math.max(0, Math.min(screen.width  - 1, Math.round(msg.x)));
        const y = Math.max(0, Math.min(screen.height - 1, Math.round(msg.y)));
        robot.moveMouse(x, y);
        break;
      }

      // ── Mouse Click ──
      case 'click': {
        robot.mouseClick(msg.button || 'left', msg.double || false);
        break;
      }

      // ── Mouse Down / Up (drag) ──
      case 'mousedown': {
        robot.mouseToggle('down', msg.button || 'left');
        break;
      }
      case 'mouseup': {
        robot.mouseToggle('up', msg.button || 'left');
        break;
      }

      // ── Scroll ──
      case 'scroll': {
        // robotjs: scrollMouse(x, y) - positive y = scroll down
        const sx = Math.round(msg.dx || 0);
        const sy = Math.round(msg.dy || 0);
        if (sx !== 0 || sy !== 0) robot.scrollMouse(sx, sy);
        break;
      }

      // ── Key Tap (press and release) ──
      case 'keypress': {
        const key = mapKey(msg.key);
        if (key) {
          const mods = (msg.modifiers || []).map(m => mapKey(m)).filter(Boolean);
          robot.keyTap(key, mods);
        }
        break;
      }

      // ── Key Down ──
      case 'keydown': {
        const key = mapKey(msg.key);
        if (key) {
          const mods = (msg.modifiers || []).map(m => mapKey(m)).filter(Boolean);
          robot.keyToggle(key, 'down', mods);
        }
        break;
      }

      // ── Key Up ──
      case 'keyup': {
        const key = mapKey(msg.key);
        if (key) {
          robot.keyToggle(key, 'up');
        }
        break;
      }

      // ── Type text string ──
      case 'type': {
        if (msg.text && msg.text.length > 0) {
          robot.typeString(msg.text);
        }
        break;
      }

      // ── Ping / heartbeat ──
      case 'ping': {
        ws.send(JSON.stringify({ type: 'pong', ts: msg.ts }));
        break;
      }

      // ── Get cursor position ──
      case 'getpos': {
        const pos = robot.getMousePos();
        const screen = robot.getScreenSize();
        ws.send(JSON.stringify({ type: 'pos', ...pos, screen }));
        break;
      }
    }
  } catch (err) {
    console.error('Handler error:', err.message);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Server stopped.');
  process.exit(0);
});
