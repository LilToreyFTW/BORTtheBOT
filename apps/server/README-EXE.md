# Building BORTtheBOT Server EXE

## Quick Start

The easiest way to run the server is using the batch file:

**Windows:**
```bash
BORTtheBOT-Server.bat
```

**Or directly with Bun:**
```bash
bun run src/launcher.ts
```

## Creating a Standalone EXE

Due to Bun's compile limitations with workspace dependencies, creating a truly standalone EXE requires additional steps:

### Method 1: Batch to EXE Converter (Recommended)

1. Install [Bat To Exe Converter](https://www.battoexeconverter.com/) or similar tool
2. Open `BORTtheBOT-Server.bat` in the converter
3. Set options:
   - **Visible**: Hidden (optional)
   - **Include files**: Check "Include files from folder"
   - **Output**: `BORTtheBOT-Server.exe`
4. Click "Compile" to create the EXE

**Requirements:**
- Bun runtime must be installed on target systems
- The EXE will run the batch file which starts Bun

### Method 2: Using PowerShell Script

Run the build script:

```powershell
.\build-exe.ps1
```

This will:
- Install all dependencies
- Build TypeScript files
- Prepare everything for running

Then use Method 1 to convert the batch file to EXE.

### Method 3: Using Bun Bundle (Experimental)

```bash
cd apps/server
bun run bundle
```

This creates a bundled version, but still requires Bun runtime.

## Current Limitations

Bun's `--compile` feature has trouble resolving workspace dependencies (`@project/api`, `@project/db`, etc.), so direct compilation doesn't work well for monorepos.

## Distribution

To distribute the server:

1. **Option A**: Distribute the batch file + require Bun installation
2. **Option B**: Convert batch to EXE (still requires Bun)
3. **Option C**: Bundle Bun runtime with your application (complex, large file size)

## Recommended Approach

For production use, keep the batch file approach. It's reliable and works well across different environments.

