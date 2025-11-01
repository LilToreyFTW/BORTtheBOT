# BORTtheBOT Server GUI

Graphical user interface for launching and managing the BORTtheBOT server.

## Building the EXE

### Prerequisites
- Node.js 18+ (or Bun)
- Electron Builder

### Quick Build

```bash
cd apps/server-gui
npm install
npm run build:win
```

This will create:
- `apps/server-gui/dist/BORTtheBOT Server Setup.exe` - Installer
- `apps/server-gui/dist/win-unpacked/` - Portable version

### Development

```bash
npm install
npm run dev
```

## Features

- ✅ Start/Stop server with one click
- ✅ Real-time server logs
- ✅ Status monitoring
- ✅ Quick links to web app and API
- ✅ Beautiful modern UI

## Requirements

- Bun must be installed on the system
- Server must be in `apps/server/` directory relative to project root

