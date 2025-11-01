# BORTtheBOT WireGuard Network Setup

## Network Configuration

Your server is now configured to host on the WireGuard tunnel network:

- **Server IP**: `10.2.0.2`
- **Port**: `3000`
- **Network**: WireGuard Tunnel
- **Subnet**: `255.255.255.255`
- **DNS**: `10.2.0.1`

## Access URLs

### Server Endpoints
- **Main Server**: http://10.2.0.2:3000
- **tRPC API**: http://10.2.0.2:3000/trpc
- **Health Check**: http://10.2.0.2:3000/

### Web Application
- **Web App**: http://10.2.0.2:3001 (when web app is running)

## Robot Printer System Access

All robots and printers on the WireGuard network can now access:
- Robot Builder API: `http://10.2.0.2:3000/trpc`
- Program downloads: `http://10.2.0.2:3000/programs/{token}`
- Authentication: `http://10.2.0.2:3000/api/auth/*`

## Configuration Files

### Server Configuration
- `apps/server/.env` - Server environment variables
- `apps/server/src/launcher.ts` - Default host: `10.2.0.2`

### Web App Configuration
- `apps/web/.env` - Set `VITE_SERVER_URL=http://10.2.0.2:3000`

### GUI Configuration
- Automatically uses `10.2.0.2` as server host
- Displays WireGuard network info in the GUI

## Starting the Server

### Method 1: Using GUI (Recommended)
1. Run `apps/server-gui/dist/win-unpacked/BORTtheBOT Server.exe`
2. Click "Start Server"
3. Server will start on `10.2.0.2:3000`

### Method 2: Using Batch File
```batch
apps\server\BORTtheBOT-Server.bat
```

### Method 3: Direct Command
```bash
cd apps/server
set HOST=10.2.0.2
bun run src/launcher.ts
```

## Testing Network Access

From any device on the WireGuard network:

```bash
# Test server is running
curl http://10.2.0.2:3000
# Should return: OK

# Test API endpoint
curl http://10.2.0.2:3000/trpc/healthCheck
```

## Firewall Configuration

Ensure Windows Firewall allows:
- **Port 3000** (TCP) - Server API
- **Port 3001** (TCP) - Web App (if running)

## Robot Integration

Your robots can connect to the server using:

```python
import requests

# API endpoint
api_url = "http://10.2.0.2:3000/trpc"

# Example: List robots
response = requests.post(f"{api_url}/bots.list")
robots = response.json()
```

## Troubleshooting

1. **Server not accessible**: Check WireGuard tunnel is active
2. **Connection refused**: Verify firewall allows port 3000
3. **CORS errors**: Server is configured to allow WireGuard network origins

## Network Diagram

```
WireGuard Network (10.2.0.0/24)
├── Server (10.2.0.2:3000) ← BORTtheBOT Server
├── Robot Printer 1
├── Robot Printer 2
└── ... (other devices on network)
```

All devices on the WireGuard network can communicate with the server at `10.2.0.2:3000`.

