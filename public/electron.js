const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      experimentalFeatures: true, // Web MIDI API用
      allowRunningInsecureContent: true, // MIDI接続用
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Ginjake MixDeck',
    show: false
  });

  // ブラウザ版と同じアプリを表示
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 開発時はDevToolsを閉じる（PowerShellログを見るため）
    // if (isDev) {
    //   mainWindow.webContents.openDevTools();
    //   console.log('Dev tools opened for debugging');
    // }
    
    console.log('Ginjake MixDeck started');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// プレイリスト保存・読み込み用のIPCハンドラー
const playlistPath = path.join(app.getPath('userData'), 'ginjake-mixdeck-playlist.json');

ipcMain.handle('save-playlist', (event, data) => {
  try {
    fs.writeFileSync(playlistPath, JSON.stringify(data));
    console.log('💾 Playlist saved to file:', playlistPath);
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to save playlist:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-playlist', () => {
  try {
    if (fs.existsSync(playlistPath)) {
      const data = fs.readFileSync(playlistPath, 'utf8');
      console.log('📁 Playlist loaded from file:', playlistPath);
      return { success: true, data: JSON.parse(data) };
    } else {
      console.log('📁 No playlist file found');
      return { success: true, data: null };
    }
  } catch (error) {
    console.error('❌ Failed to load playlist:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-playlist', () => {
  try {
    if (fs.existsSync(playlistPath)) {
      fs.unlinkSync(playlistPath);
      console.log('🗑️ Playlist file deleted');
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete playlist:', error);
    return { success: false, error: error.message };
  }
});

// MIDI関連のログをPowerShellに出力（文字化け対策）
ipcMain.handle('log-to-console', (event, type, message, data) => {
  const timestamp = new Date().toLocaleTimeString();
  
  switch(type) {
    case 'midi-init':
      console.log(`[${timestamp}] MIDI: ${message}`);
      if (data) console.log(`[${timestamp}] Data:`, data);
      break;
    case 'midi-signal':
      console.log(`[${timestamp}] MIDI SIGNAL: ${message}`);
      if (data) {
        console.log(`[${timestamp}] ========================`);
        console.log(`[${timestamp}] Status: ${data.status} | Data1: ${data.data1} | Data2: ${data.data2}`);
        console.log(`[${timestamp}] Button: ${data.buttonPressed ? 'PRESSED' : 'RELEASED'} | Control: ${data.decimal}`);
        console.log(`[${timestamp}] ========================`);
      }
      break;
    case 'midi-action':
      console.log(`[${timestamp}] MIDI ACTION: ${message}`);
      if (data) console.log(`[${timestamp}] Details:`, data);
      break;
    case 'error':
      console.error(`[${timestamp}] ERROR: ${message}`);
      if (data) console.error(`[${timestamp}] Error details:`, data);
      break;
    default:
      console.log(`[${timestamp}] ${message}`);
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});