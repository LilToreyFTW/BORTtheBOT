# How to Create BORTtheBOT Server EXE

## Quick Method: Convert Batch to EXE

Since Bun's compile has limitations with workspace dependencies, the easiest way is to convert the batch file to an EXE:

### Step 1: Build the Project

```powershell
cd apps/server
.\build-exe.ps1
```

Or manually:
```powershell
cd C:\Users\ghost\Desktop\got-ya\BORTtheBOT
bun install
cd apps/server
bun run build
```

### Step 2: Use Bat To Exe Converter

1. Download [Bat To Exe Converter](https://www.battoexeconverter.com/) (free tool)
2. Open the tool
3. Click "Browse" and select `apps/server/BORTtheBOT-Server.bat`
4. Configure options:
   - **Run**: Normal application
   - **Invisible**: Check if you want hidden console
   - **Icon**: Optional - add a custom icon
5. Click "Compile" and save as `BORTtheBOT-Server.exe`

### Step 3: Test the EXE

Double-click `BORTtheBOT-Server.exe` - it should start the server.

**Note**: The EXE still requires Bun to be installed on the target system.

## Alternative: Direct Execution

You can also just run:
- `BORTtheBOT-Server.bat` (Windows batch file)
- `bun run src/launcher.ts` (Direct Bun command)

Both work the same way and are ready to use!

