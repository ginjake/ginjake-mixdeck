const { contextBridge, ipcRenderer } = require('electron');

// ElectronのAPIをレンダラープロセスで使用できるようにする
contextBridge.exposeInMainWorld('electronAPI', {
  savePlaylist: (data) => ipcRenderer.invoke('save-playlist', data),
  loadPlaylist: () => ipcRenderer.invoke('load-playlist'),
  deletePlaylist: () => ipcRenderer.invoke('delete-playlist'),
  logToConsole: (type, message, data) => ipcRenderer.invoke('log-to-console', type, message, data)
});

console.log('📋 Preload script loaded - Electron API exposed');