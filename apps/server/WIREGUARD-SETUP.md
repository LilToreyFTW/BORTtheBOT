# WireGuard Network Setup for BORTtheBOT

## Network Configuration

The server is configured to use your WireGuard tunnel network:

- **Server IP**: `10.2.0.2`
- **Port**: `3000` (default)
- **Subnet**: `255.255.255.255`
- **DNS**: `10.2.0.1`

## Server Access URLs

- **Server**: http://10.2.0.2:3000
- **API**: http://10.2.0.2:3000/trpc
- **Web App**: http://10.2.0.2:3001 (if running web app)

## Configuration

The server automatically binds to `10.2.0.2` when started. To override:

1. Set environment variable:
   ```bash
   HOST=10.2.0.2 bun run src/launcher.ts
   ```

2. Or create `.env` file in `apps/server/`:
   ```
   HOST=10.2.0.2
   PORT=3000
   ```

## Network Requirements

- WireGuard tunnel must be active
- Firewall must allow traffic on port 3000
- Other devices on the WireGuard network can access via `10.2.0.2:3000`

## Robot Printer System Access

All robots and printers on the WireGuard network can connect to:
- `http://10.2.0.2:3000` - Main server
- `http://10.2.0.2:3000/trpc` - tRPC API endpoint

## Testing

Test the server is accessible:
```bash
curl http://10.2.0.2:3000
# Should return: OK
```

## GUI Configuration

The GUI launcher will automatically use the WireGuard IP address and display the correct URLs.

