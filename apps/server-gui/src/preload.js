// # ADDED: Preload script for Electron IPC
const { contextBridge, ipcRenderer } = require('electron');
const { shell } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  checkServerStatus: () => ipcRenderer.invoke('check-server-status'),
  getServerUrl: () => ipcRenderer.invoke('get-server-url'),
  onServerOutput: (callback) => {
    ipcRenderer.on('server-output', (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('server-output');
  },
  onServerError: (callback) => {
    ipcRenderer.on('server-error', (_, data) => callback(data));
    return () => ipcRenderer.removeAllListeners('server-error');
  },
  onServerStopped: (callback) => {
    ipcRenderer.on('server-stopped', (_, code) => callback(code));
    return () => ipcRenderer.removeAllListeners('server-stopped');
  },
  openExternal: (url) => shell.openExternal(url)
});

