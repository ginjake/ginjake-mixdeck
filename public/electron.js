const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// 入力ログファイルのパス
const inputLogPath = path.join('E:', 'programing', 'vj', 'toAI', 'input.log');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      experimentalFeatures: true, // Web MIDI API用
      allowRunningInsecureContent: true, // MIDI接続用
      backgroundThrottling: false, // Canvas描画用
      offscreen: false, // Canvas描画用
      hardwareAcceleration: true, // GPU加速有効
      additionalArguments: ['--enable-web-midi'], // Web MIDI API明示的有効化
      preload: path.join(__dirname, 'preload.js')
    },
    title: 'Ginjake MixDeck',
    backgroundColor: '#1a1a1a', // 背景色設定
    show: false
  });

  // ブラウザ版と同じアプリを表示
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  mainWindow.once('ready-to-show', () => {
    // 少し遅延してから表示（React初期化完了を待つ）
    setTimeout(() => {
      mainWindow.show();
    }, 1000);
    
    // DevToolsを無効化
    // if (isDev) {
    //   mainWindow.webContents.openDevTools();
    // }
    
  });

  // ページ読み込み完了時のログ
  mainWindow.webContents.on('did-finish-load', () => {
  });

  // ページ読み込み失敗時のログ
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorCode, errorDescription);
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
    // console.log('💾 Playlist saved to file:', playlistPath);
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
      // console.log('📁 Playlist loaded from file:', playlistPath);
      return { success: true, data: JSON.parse(data) };
    } else {
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
      // console.log('🗑️ Playlist file deleted');
    }
    return { success: true };
  } catch (error) {
    console.error('❌ Failed to delete playlist:', error);
    return { success: false, error: error.message };
  }
});

// MIDI関連のログをPowerShellに出力（文字化け対策）
ipcMain.handle('log-to-console', (event, type, message, data) => {
  if (type === 'debug') {
    process.stdout.write(message + '\n');
  } else if (type === 'midi-signal') {
    // デバッグ：すべてのmidi-signalを表示してデータ構造を確認
    if (data) {
      process.stdout.write('MIDI_DEBUG: Status=' + data.status + ' Data1=' + data.data1 + ' Data2=' + data.data2 + '\n');
      process.stdout.write('MIDI_DEBUG: Status type=' + typeof data.status + ' Data1 type=' + typeof data.data1 + '\n');
      process.stdout.write('MIDI_DEBUG: Status hex=0x' + data.status.toString(16) + ' Data1 hex=0x' + data.data1.toString(16) + '\n');
    }
  }
});

// 入力ログをファイルに書き込む
ipcMain.handle('write-input-log', (event, type, data) => {
  // ターミナルに即座に出力（最優先）
  console.log('=== ELECTRON LOG ===');
  console.log('Type:', type);
  console.log('Data:', data);
  console.log('Timestamp:', new Date().toISOString());
  console.log('=====================');
  
  process.stdout.write('WRITE_LOG_TEST: write-input-log called with type: ' + type + '\n');
  
  try {
    const logDir = 'E:\\programing\\vj\\toAI';
    const logPath = path.join(logDir, 'input.log');
    
    process.stdout.write('WRITE_LOG_TEST: logPath = ' + logPath + '\n');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
      process.stdout.write('WRITE_LOG_TEST: Directory created\n');
    }
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: type,
      data: data
    };
    
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf8');
    process.stdout.write('WRITE_LOG_TEST: File written successfully\n');
    return { success: true };
  } catch (error) {
    process.stdout.write('WRITE_LOG_TEST: ERROR - ' + error.message + '\n');
    return { success: false, error: error.message };
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