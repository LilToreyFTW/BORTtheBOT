BORTtheBOT Server release

Requirements:
- Bun 1.2+ (https://bun.sh)
- Windows x64

Quick start:
1. Unzip / place this folder on the target machine.
2. Edit `.env` or place an `.env` file in this folder if needed (see `.env.example`).
3. Run `BORTtheBOT-Server.bat` (double-click or from PowerShell).

Files included:
- `dist/` - compiled server JS
- `bundle/` - esbuild bundle used for packaging
- `BORTtheBOT-Server.bat` - batch launcher
- `BORTtheBOT-Server.exe` - optional packaged EXE (may be experimental)

Notes:
- This release expects Bun to be installed and accessible on PATH. If not installed, download from https://bun.sh and add to PATH.
- For a single-file EXE, native modules (libsql) may need special inclusion; see repo `apps/server/BUILD-EXE.md`.
