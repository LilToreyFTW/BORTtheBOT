// # ADDED: Electron main process for BORTtheBOT Server GUI
const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let serverProcess = null;
const SERVER_PORT = 3000;
// # UPDATED: Use WireGuard tunnel IP for robot printer network
const SERVER_HOST = process.env.HOST || '10.2.0.2';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    // icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    titleBarStyle: 'default'
  });

  mainWindow.loadFile(path.join(__dirname, '../gui.html'));

  mainWindow.on('closed', () => {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('start-server', async () => {
  if (serverProcess) {
    return { success: false, message: 'Server is already running' };
  }

  try {
    // Path to server launcher (assumes server is in sibling directory)
    // When packaged, we need to find the server relative to the app
    const appPath = app.isPackaged 
      ? path.dirname(process.execPath)
      : path.resolve(__dirname, '../..');
    
    const serverDir = path.resolve(appPath, 'server');
    const launcherPath = path.join(serverDir, 'src/launcher.ts');
    
    // Check if Bun is available
    serverProcess = spawn('bun', ['run', launcherPath], {
      cwd: appPath,
      shell: true,
      env: { 
        ...process.env, 
        PORT: SERVER_PORT.toString(),
        HOST: SERVER_HOST,
        CORS_ORIGIN: `http://${SERVER_HOST}:3001,http://${SERVER_HOST}:3000,http://localhost:3001,http://localhost:3000`
      }
    });

    let output = '';
    let errorOutput = '';

    serverProcess.stdout?.on('data', (data) => {
      output += data.toString();
      mainWindow?.webContents.send('server-output', data.toString());
    });

    serverProcess.stderr?.on('data', (data) => {
      errorOutput += data.toString();
      mainWindow?.webContents.send('server-error', data.toString());
    });

    serverProcess.on('close', (code) => {
      serverProcess = null;
      mainWindow?.webContents.send('server-stopped', code);
    });

    serverProcess.on('error', (error) => {
      serverProcess = null;
      mainWindow?.webContents.send('server-error', error.message);
      return { success: false, message: `Failed to start: ${error.message}` };
    });

    // Wait a bit to see if server starts successfully
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return { success: true, message: 'Server started', port: SERVER_PORT };
  } catch (error) {
    serverProcess = null;
    return { success: false, message: error.message };
  }
});

ipcMain.handle('stop-server', async () => {
  if (!serverProcess) {
    return { success: false, message: 'Server is not running' };
  }

  try {
    serverProcess.kill();
    serverProcess = null;
    return { success: true, message: 'Server stopped' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('check-server-status', async () => {
  if (!serverProcess) {
    return { running: false };
  }

  try {
    const response = await fetch(`http://${SERVER_HOST}:${SERVER_PORT}`);
    return { running: response.ok };
  } catch {
    return { running: false };
  }
});

ipcMain.handle('get-server-url', () => {
  return `http://${SERVER_HOST}:${SERVER_PORT}`;
});

ipcMain.handle('get-server-host', () => {
  return SERVER_HOST;
});

