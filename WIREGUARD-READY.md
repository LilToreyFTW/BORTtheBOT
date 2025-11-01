# ✅ BORTtheBOT Server - WireGuard Network Ready!

## 🎉 Configuration Complete

Your BORTtheBOT server is now configured to host on your WireGuard tunnel network:

- **IP Address**: `10.2.0.2`
- **Port**: `3000`
- **Network**: WireGuard Tunnel

## 📦 Available Executables

### 1. GUI Server Launcher (Recommended)
**Location**: `apps/server-gui/dist/BORTtheBOT Server Setup 1.0.0.exe`
- Full installer with desktop shortcuts
- Beautiful GUI for server management
- Shows WireGuard network status
- Real-time server logs

**Portable Version**: `apps/server-gui/dist/win-unpacked/BORTtheBOT Server.exe`
- No installation needed
- Just double-click to run

### 2. Batch File Launcher
**Location**: `apps/server/BORTtheBOT-Server.bat`
- Pre-configured for WireGuard network
- Simple double-click to start

## 🚀 Quick Start

1. **Ensure WireGuard tunnel is active**
2. **Run the GUI**: Double-click `BORTtheBOT Server.exe`
3. **Click "Start Server"**
4. **Server runs on**: http://10.2.0.2:3000

## 🌐 Access from WireGuard Network

All devices on your WireGuard network can access:

- **API**: http://10.2.0.2:3000/trpc
- **Program Downloads**: http://10.2.0.2:3000/programs/{token}
- **Health Check**: http://10.2.0.2:3000/

## 🤖 Robot Printer Integration

Your robot printers can connect using:

```python
SERVER_URL = "http://10.2.0.2:3000"
API_URL = f"{SERVER_URL}/trpc"
```

## ✅ Test Connection

From any device on WireGuard network:

```bash
curl http://10.2.0.2:3000
# Expected: OK
```

## 📋 Network Information

- **Server IP**: 10.2.0.2
- **Subnet**: 255.255.255.255
- **DNS**: 10.2.0.1
- **Port**: 3000 (Server API)
- **Port**: 3001 (Web App - if running)

## 🔧 Configuration

All configurations are automatic. The server will:
- Bind to `10.2.0.2` by default
- Allow CORS from WireGuard network
- Serve all robot printer endpoints

**Your BORTtheBOT server is ready to serve your robot printer system!** 🤖

