# Quick Start: BORTtheBOT on WireGuard Network

## 🚀 Starting the Server

### Option 1: GUI Launcher (Easiest)
1. Double-click: `apps/server-gui/dist/win-unpacked/BORTtheBOT Server.exe`
2. Click **"Start Server"** button
3. Server starts on `http://10.2.0.2:3000`

### Option 2: Batch File
1. Double-click: `apps/server/BORTtheBOT-Server.bat`
2. Server starts automatically on WireGuard network

### Option 3: Command Line
```bash
cd apps/server
set HOST=10.2.0.2
bun run src/launcher.ts
```

## 🌐 Access URLs

Once the server is running, access it from any device on your WireGuard network:

- **Server**: http://10.2.0.2:3000
- **API**: http://10.2.0.2:3000/trpc
- **Web App**: http://10.2.0.2:3001 (if running web app separately)

## 🤖 Robot Printer Integration

Your robot printers can connect to the server using:

```python
import requests

# Server URL on WireGuard network
SERVER_URL = "http://10.2.0.2:3000"

# Example: Get list of robots
response = requests.post(f"{SERVER_URL}/trpc/bots.list")
robots = response.json()

# Example: Download program
token = "your-program-token"
response = requests.get(f"{SERVER_URL}/programs/{token}")
program_code = response.text
```

## ✅ Verify It's Working

Test from any device on WireGuard network:

```bash
curl http://10.2.0.2:3000
# Should return: OK
```

## 📋 Configuration Summary

- **Network**: WireGuard Tunnel
- **Server IP**: 10.2.0.2
- **Port**: 3000
- **All robots on WireGuard network can access**: http://10.2.0.2:3000

## 🎯 Next Steps

1. Start the server using one of the methods above
2. Access the web interface at http://10.2.0.2:3001 (if web app is running)
3. Configure your robot printers to connect to http://10.2.0.2:3000
4. Build robots using the Robot Builder interface
5. Upload Python programs for your robots

Your BORTtheBOT server is now ready to serve your robot printer system! 🤖

