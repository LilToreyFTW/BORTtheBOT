# Building BORTtheBOT Server Executable

## Quick Start (Requires Bun)

The simplest way to run the server is using the batch file:

```
BORTtheBOT-Server.bat
```

Or directly:
```bash
bun run src/launcher.ts
```

## Creating a Standalone EXE

Due to workspace dependencies and Bun's compile limitations, creating a truly standalone EXE requires additional steps:

### Option 1: Using Bun (Recommended if Bun is available)

1. Ensure all dependencies are installed:
```bash
bun install
```

2. Build the project:
```bash
bun run build
```

3. Run the launcher:
```bash
bun run src/launcher.ts
```

### Option 2: Convert Batch to EXE

Use a tool like [Bat To Exe Converter](https://www.battoexeconverter.com/) or [IExpress](https://support.microsoft.com/en-us/windows/use-iexpress-to-create-a-self-extracting-package-30a2cecd-5e8b-90fb-58d4-bf7f59ee2c9a) to convert `BORTtheBOT-Server.bat` to an EXE.

### Option 3: Package with Node.js + pkg

If you convert the server to use Node.js instead of Bun:

1. Install pkg globally:
```bash
npm install -g pkg
```

2. Build with pkg:
```bash
npm run build:exe
```

**Note**: This requires refactoring the server to use Node.js instead of Bun's native APIs.

## Current Setup

The server uses:
- **Bun runtime** - for fast execution
- **Workspace packages** - `@project/api`, `@project/db`, `@project/auth`
- **Hono framework** - for the HTTP server

To create a standalone EXE, you would need to:
1. Bundle all workspace dependencies into a single file
2. Ensure all Node.js/npm packages are included
3. Package the Bun runtime (if using Bun)

For now, the batch file is the easiest distribution method.

