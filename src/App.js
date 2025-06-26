import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background: #1a1a1a;
  color: white;
  font-family: Arial, sans-serif;
`;

const VideoPanel = styled.div`
  flex: 2;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const PlaylistPanel = styled.div`
  flex: 1;
  background: #2a2a2a;
  padding: 20px;
  border-left: 1px solid #444;
`;

const DropZone = styled.div`
  border: 2px dashed #666;
  border-radius: 5px;
  padding: 40px;
  text-align: center;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  
  ${props => props.isDragOver && `
    border-color: #4CAF50;
    background: rgba(76, 175, 80, 0.1);
  `}
`;

const Video = styled.video`
  max-width: 90%;
  max-height: 70vh;
  object-fit: contain;
`;

const VideoContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

const SeekBar = styled.div`
  width: 90%;
  height: 8px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  margin-top: 20px;
  cursor: pointer;
  position: relative;
`;

const SeekProgress = styled.div`
  height: 100%;
  background: #ff6b6b;
  border-radius: 4px;
  width: ${props => props.progress}%;
  transition: width 0.1s ease;
`;

const TimeDisplay = styled.div`
  color: white;
  font-size: 14px;
  margin-top: 10px;
  font-family: monospace;
`;

const NoVideo = styled.div`
  color: #666;
  font-size: 18px;
  text-align: center;
`;

const PlaylistTitle = styled.h2`
  margin: 0 0 20px 0;
  color: #fff;
`;

const MidiStatus = styled.div`
  padding: 10px;
  background: #333;
  border-radius: 5px;
  margin-bottom: 20px;
  font-size: 12px;
  color: #ccc;
  text-align: center;
`;

const AddButton = styled.button`
  width: 100%;
  padding: 15px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 20px;

  &:hover {
    background: #45a049;
  }
`;

const PlaylistItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: ${props => props.active ? '#555' : '#333'};
  margin-bottom: 5px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  
  &:hover {
    background: #444;
  }
`;

const PlaylistItemName = styled.div`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DeleteButton = styled.button`
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 10px;
  flex-shrink: 0;
  
  &:hover {
    background: #cc0000;
  }
`;

const Controls = styled.div`
  margin-top: 20px;
  display: flex;
  gap: 10px;
`;

const ControlButton = styled.button`
  padding: 10px 20px;
  background: #2196F3;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  
  &:hover {
    background: #1976D2;
  }
`;

function App() {
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false); // 初期化完了フラグ
  const [midiStatus, setMidiStatus] = useState('初期化中...'); // MIDI接続状態
  const videoRef = useRef(null);
  
  // MIDI用の最新状態参照
  const playlistRef = useRef(playlist);
  const currentIndexRef = useRef(currentIndex);
  const isPlayingRef = useRef(isPlaying);
  
  // refを常に最新に保つ
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);
  
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // ファイルをプレイリストに追加
  const addFilesToPlaylist = (files) => {
    const newVideos = files.map((file, index) => {
      const video = {
        id: Date.now() + index,
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        size: file.size,
        lastModified: file.lastModified
      };

      // Electron環境では実際のファイルパスを保存
      if (window.electronAPI && file.path) {
        video.path = file.path;
        console.log('📁 File path saved for Electron:', file.path);
      } else {
        // ブラウザ環境では代替パス情報を保存
        video.path = file.webkitRelativePath || file.name;
        console.log('🌐 Browser environment - using blob URL');
      }

      return video;
    });
    
    setPlaylist(prev => [...prev, ...newVideos]);
    console.log('📥 Added', newVideos.length, 'files to playlist');
  };

  // ファイル選択
  const addVideos = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'video/*,image/*';
    
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      addFilesToPlaylist(files);
    };
    
    input.click();
  };

  // ドラッグアンドドロップ
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('video/') || file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      addFilesToPlaylist(files);
    }
  };

  // 動画選択（安定化）
  const selectVideo = useCallback((index) => {
    console.log('🎯 Video selected:', index);
    setCurrentIndex(index);
  }, []);

  // プレイリストから削除
  const removeFromPlaylist = (index) => {
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist);
    
    // 削除したアイテムが現在選択中の場合、インデックスを調整
    if (index === currentIndex) {
      if (newPlaylist.length === 0) {
        setCurrentIndex(0);
      } else if (index >= newPlaylist.length) {
        setCurrentIndex(newPlaylist.length - 1);
      }
    } else if (index < currentIndex) {
      setCurrentIndex(currentIndex - 1);
    }

    // 削除後の自動保存は通常のuseEffectに任せる（重複を避けるため）
    console.log('🗑️ Item removed from playlist, auto-save will be triggered by useEffect');
  };

  // 次の動画（安定化）
  const nextVideo = useCallback(() => {
    console.log('🎬 nextVideo() called');
    const currentPlaylist = playlistRef.current;
    const currentIdx = currentIndexRef.current;
    console.log('Playlist length:', currentPlaylist.length);
    console.log('Current index before:', currentIdx);
    
    if (currentPlaylist.length > 0) {
      const newIndex = (currentIdx + 1) % currentPlaylist.length;
      console.log('New index will be:', newIndex);
      setCurrentIndex(newIndex);
    } else {
      console.log('❌ Cannot switch: playlist is empty');
    }
  }, []);

  // 前の動画（安定化）
  const previousVideo = useCallback(() => {
    console.log('🎬 previousVideo() called');
    const currentPlaylist = playlistRef.current;
    const currentIdx = currentIndexRef.current;
    console.log('Playlist length:', currentPlaylist.length);
    console.log('Current index before:', currentIdx);
    
    if (currentPlaylist.length > 0) {
      const newIndex = (currentIdx - 1 + currentPlaylist.length) % currentPlaylist.length;
      console.log('New index will be:', newIndex);
      setCurrentIndex(newIndex);
    } else {
      console.log('❌ Cannot switch: playlist is empty');
    }
  }, []);

  // 再生/停止（安定化）
  const togglePlay = useCallback(() => {
    console.log('🎮 togglePlay() called');
    const currentIsPlaying = isPlayingRef.current;
    console.log('Current playing state:', currentIsPlaying);
    console.log('Video element exists:', !!videoRef.current);
    
    if (videoRef.current) {
      // 動画の実際の再生状態を確認
      const isVideoPlaying = !videoRef.current.paused;
      console.log('Video actual playing state:', isVideoPlaying);
      
      if (isVideoPlaying) {
        console.log('⏸️ Pausing video playback');
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('▶️ Starting video playback');
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((error) => {
          console.log('❌ Play failed:', error);
          setIsPlaying(false);
        });
      }
    } else {
      console.log('❌ No video element to control');
      // 状態だけ切り替え
      setIsPlaying(!currentIsPlaying);
    }
  }, []);

  // 動画スキップ機能（安定化）
  const skipVideo = useCallback((seconds) => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const newTime = Math.max(0, Math.min(currentTime + seconds, videoRef.current.duration || 0));
      videoRef.current.currentTime = newTime;
      console.log(`⏩ Skipped ${seconds}s: ${currentTime.toFixed(1)}s → ${newTime.toFixed(1)}s`);
    }
  }, []);

  // シークバークリック
  const handleSeekBarClick = (e) => {
    if (videoRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      videoRef.current.currentTime = newTime;
    }
  };

  // 時間フォーマット
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 現在の動画を取得（Electron環境とブラウザ環境で異なる処理）
  const currentVideo = playlist[currentIndex];
  const getCurrentVideoSrc = () => {
    if (!currentVideo) return null;
    
    // Electron環境では実際のファイルパスを使用
    if (window.electronAPI && currentVideo.path) {
      return `file://${currentVideo.path}`;
    }
    
    // ブラウザ環境ではblobURLを使用（ただし無効な場合は警告）
    if (currentVideo.url && currentVideo.url.startsWith('blob:')) {
      return currentVideo.url;
    }
    
    // URLが無効な場合
    console.warn('⚠️ Video URL is invalid:', currentVideo.url);
    return null;
  };

  // 動画の時間更新
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [currentVideo]);

  // プレイリストの自動保存（初期化後のみ）
  useEffect(() => {
    if (!isInitialized) return; // 初期化完了まで保存しない
    
    const savePlaylist = async () => {
      if (playlist.length > 0) {
        const saveData = {
          playlist: playlist.map(video => ({
            id: video.id,
            name: video.name,
            url: video.url,
            path: video.path,
            type: video.type,
            size: video.size,
            lastModified: video.lastModified
          })),
          currentIndex
        };

        // Electron環境とブラウザ環境を分ける
        if (window.electronAPI) {
          try {
            const result = await window.electronAPI.savePlaylist(saveData);
            if (result.success) {
              console.log('💾 Playlist saved to Electron file');
            } else {
              console.error('❌ Failed to save to Electron file:', result.error);
              // フォールバックとしてlocalStorageに保存
              localStorage.setItem('vjPlaylist', JSON.stringify(saveData));
              console.log('💾 Playlist saved to localStorage (fallback)');
            }
          } catch (error) {
            console.error('❌ Electron save error:', error);
            localStorage.setItem('vjPlaylist', JSON.stringify(saveData));
            console.log('💾 Playlist saved to localStorage (fallback)');
          }
        } else {
          // ブラウザ環境
          localStorage.setItem('vjPlaylist', JSON.stringify(saveData));
          console.log('💾 Playlist saved to localStorage');
        }
      } else {
        // プレイリストが空の場合は保存データをクリア
        if (window.electronAPI) {
          try {
            await window.electronAPI.deletePlaylist();
            console.log('💾 Playlist file deleted');
          } catch (error) {
            console.error('❌ Failed to delete playlist file:', error);
          }
        } else {
          localStorage.removeItem('vjPlaylist');
          console.log('💾 Playlist cleared from localStorage');
        }
      }
    };

    savePlaylist();
  }, [playlist, currentIndex, isInitialized]);

  // 起動時にプレイリストを復元
  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        let saveData = null;

        // Electron環境とブラウザ環境を分ける
        if (window.electronAPI) {
          try {
            const result = await window.electronAPI.loadPlaylist();
            if (result.success && result.data) {
              saveData = result.data;
              console.log('📁 Playlist loaded from Electron file');
            } else {
              console.log('📁 No playlist file found in Electron');
            }
          } catch (error) {
            console.error('❌ Failed to load from Electron file:', error);
            // フォールバックとしてlocalStorageから読み込み
            const saved = localStorage.getItem('vjPlaylist');
            if (saved) {
              saveData = JSON.parse(saved);
              console.log('📁 Playlist loaded from localStorage (fallback)');
            }
          }
        } else {
          // ブラウザ環境
          const saved = localStorage.getItem('vjPlaylist');
          if (saved) {
            saveData = JSON.parse(saved);
            console.log('📁 Playlist loaded from localStorage');
          } else {
            console.log('📁 No saved playlist found in localStorage');
          }
        }

        if (saveData && saveData.playlist && saveData.playlist.length > 0) {
          // Electron環境とブラウザ環境で異なる復元処理
          if (window.electronAPI) {
            // Electron環境：ファイルパスベースで復元
            setPlaylist(saveData.playlist);
            setCurrentIndex(saveData.currentIndex || 0);
            console.log('📁 Playlist restored in Electron:', saveData.playlist.length, 'items');
          } else {
            // ブラウザ環境：blobURLが無効になっている可能性があることを警告
            setPlaylist(saveData.playlist);
            setCurrentIndex(saveData.currentIndex || 0);
            console.log('📁 Playlist restored in browser:', saveData.playlist.length, 'items');
            console.warn('⚠️ Note: Video files may need to be re-added due to browser security restrictions');
          }
        } else {
          console.log('📁 No playlist items found');
        }
      } catch (error) {
        console.error('❌ Failed to load playlist:', error);
      }
      
      // 初期化完了をマーク
      setIsInitialized(true);
      console.log('✅ App initialization completed');
    };

    loadPlaylist();
  }, []);

  // キーボード操作
  useEffect(() => {
    const handleKeyPress = (e) => {
      console.log('⌨️ Key pressed:', e.key);
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          console.log('⌨️ Arrow Left - calling previousVideo()');
          previousVideo();
          break;
        case 'ArrowRight':
          e.preventDefault();
          console.log('⌨️ Arrow Right - calling nextVideo()');
          nextVideo();
          break;
        case ' ':
          e.preventDefault();
          console.log('⌨️ Space - calling togglePlay()');
          togglePlay();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playlist.length]);

  // MIDIメッセージハンドラー（PowerShellログ対応）
  const handleMIDIMessage = useCallback((message) => {
    const [status, data1, data2] = message.data;
    
    // PowerShellコンソールにMIDI信号をログ出力
    const midiData = {
      status: '0x' + status.toString(16),
      data1: '0x' + data1.toString(16),
      data2: data2,
      decimal: data1,
      buttonPressed: data2 > 0
    };

    if (window.electronAPI) {
      window.electronAPI.logToConsole('midi-signal', 'MIDI signal received', midiData);
    } else {
      // ブラウザ環境では従来通りconsole.log
      console.log('🎛️ ===== MIDI SIGNAL =====');
      console.log('Status:', midiData.status, 'Data1:', midiData.data1, 'Data2:', data2);
      console.log('Decimal data1:', data1);
      console.log('Button pressed:', data2 > 0);
      console.log('==========================');
    }

    // ボタンが押された時のみ処理（data2 > 0）
    if (data2 === 0) {
      if (window.electronAPI) {
        window.electronAPI.logToConsole('midi-action', 'Button released - ignoring');
      } else {
        console.log('⚪ Button released - ignoring');
      }
      return;
    }

    if (window.electronAPI) {
      window.electronAPI.logToConsole('midi-action', `Processing MIDI control: 0x${data1.toString(16)}`);
    } else {
      console.log('🔥 Processing MIDI control: 0x' + data1.toString(16));
    }

    // あなたのDDJ400の実際のマッピング（逆にしてテスト）
    switch(data1) {
      case 0x33: // 前の動画（逆にしてテスト）
        if (window.electronAPI) {
          window.electronAPI.logToConsole('midi-action', 'Previous video button executed');
        } else {
          console.log('⬅️ EXECUTING: Previous video function (was next)');
        }
        previousVideo();
        break;
      case 0x37: // 次の動画（逆にしてテスト）
        if (window.electronAPI) {
          window.electronAPI.logToConsole('midi-action', 'Next video button executed');
        } else {
          console.log('➡️ EXECUTING: Next video function (was previous)');
        }
        nextVideo();
        break;
      case 0x30: // 再生/停止トグル
        const videoExists = !!videoRef.current;
        const isPaused = videoRef.current ? videoRef.current.paused : true;
        
        if (window.electronAPI) {
          window.electronAPI.logToConsole('midi-action', 'Play/pause button pressed', {
            videoExists,
            isPaused,
            currentlyPlaying: isPlayingRef.current
          });
        } else {
          console.log('⏯️ MIDI PLAY/PAUSE BUTTON PRESSED');
          console.log('Current video exists:', videoExists);
          console.log('Current isPlaying state:', isPlayingRef.current);
        }
        
        // 直接的な再生/停止制御
        if (videoRef.current) {
          if (videoRef.current.paused) {
            if (window.electronAPI) {
              window.electronAPI.logToConsole('midi-action', 'Video was paused - starting play');
            } else {
              console.log('🔥 VIDEO WAS PAUSED - STARTING PLAY');
            }
            
            videoRef.current.play().then(() => {
              setIsPlaying(true);
              if (window.electronAPI) {
                window.electronAPI.logToConsole('midi-action', 'Play succeeded');
              } else {
                console.log('✅ Play succeeded');
              }
            }).catch(error => {
              if (window.electronAPI) {
                window.electronAPI.logToConsole('error', 'Play failed', error);
              } else {
                console.error('❌ Play failed:', error);
              }
            });
          } else {
            if (window.electronAPI) {
              window.electronAPI.logToConsole('midi-action', 'Video was playing - pausing');
            } else {
              console.log('🔥 VIDEO WAS PLAYING - PAUSING');
            }
            
            videoRef.current.pause();
            setIsPlaying(false);
            
            if (window.electronAPI) {
              window.electronAPI.logToConsole('midi-action', 'Pause succeeded');
            } else {
              console.log('✅ Pause succeeded');
            }
          }
        } else {
          if (window.electronAPI) {
            window.electronAPI.logToConsole('error', 'No video element found');
          } else {
            console.error('❌ NO VIDEO ELEMENT FOUND');
          }
        }
        break;
      case 0x31: // 3秒進める
        console.log('⏩ EXECUTING: Skip +3s');
        skipVideo(3);
        break;
      case 0x35: // 3秒戻す
        console.log('⏪ EXECUTING: Skip -3s');
        skipVideo(-3);
        break;
      case 0x32: // 15秒進める
        console.log('⏩⏩ EXECUTING: Skip +15s');
        skipVideo(15);
        break;
      case 0x36: // 15秒戻す
        console.log('⏪⏪ EXECUTING: Skip -15s');
        skipVideo(-15);
        break;
      default:
        if (window.electronAPI) {
          window.electronAPI.logToConsole('midi-action', `Unhandled MIDI control: 0x${data1.toString(16)} (decimal: ${data1})`);
        } else {
          console.log('❓ UNHANDLED MIDI control: 0x' + data1.toString(16), 'decimal:', data1);
        }
    }
  }, [nextVideo, previousVideo, togglePlay, skipVideo]);

  // DDJ400 MIDI対応（Electron対応強化）
  useEffect(() => {
    let midiAccess = null;

    const initMIDI = async () => {
      try {
        if (window.electronAPI) {
          window.electronAPI.logToConsole('midi-init', 'MIDI support check started', {
            navigatorExists: !!navigator,
            requestMIDIAccessExists: !!navigator.requestMIDIAccess,
            electronEnvironment: true
          });
        } else {
          console.log('🔍 Checking MIDI support...');
          console.log('Navigator exists:', !!navigator);
          console.log('RequestMIDIAccess exists:', !!navigator.requestMIDIAccess);
          console.log('Running in Electron:', !!window.electronAPI);
        }
        
        setMidiStatus('MIDI初期化中...');
        
        if (!navigator.requestMIDIAccess) {
          if (window.electronAPI) {
            window.electronAPI.logToConsole('error', 'Web MIDI API not supported');
          } else {
            console.error('❌ Web MIDI API not supported in this environment');
          }
          setMidiStatus('❌ MIDI未対応');
          return;
        }

        if (window.electronAPI) {
          window.electronAPI.logToConsole('midi-init', 'Requesting MIDI access...');
        } else {
          console.log('🎛️ Requesting MIDI access...');
        }
        setMidiStatus('MIDI接続中...');
        
        midiAccess = await navigator.requestMIDIAccess();
        
        if (window.electronAPI) {
          window.electronAPI.logToConsole('midi-init', 'MIDI access acquired successfully', {
            inputCount: midiAccess.inputs.size
          });
        } else {
          console.log('✅ MIDI Access acquired successfully');
          console.log('Available MIDI inputs:', midiAccess.inputs.size);
        }

        let connectedDevices = 0;
        
        for (let input of midiAccess.inputs.values()) {
          const deviceInfo = {
            name: input.name,
            id: input.id,
            manufacturer: input.manufacturer,
            state: input.state,
            connection: input.connection
          };
          
          if (window.electronAPI) {
            window.electronAPI.logToConsole('midi-init', 'MIDI input device found', deviceInfo);
          } else {
            console.log('🎹 MIDI Input found:', deviceInfo);
          }
          
          // すべてのMIDI入力デバイスに接続（DDJ400を見逃さないため）
          input.onmidimessage = handleMIDIMessage;
          connectedDevices++;
          
          if (window.electronAPI) {
            window.electronAPI.logToConsole('midi-init', `Connected to MIDI device: ${input.name || 'Unknown Device'}`);
          } else {
            console.log('✅ Connected to MIDI device:', input.name || 'Unknown Device');
          }
        }

        if (connectedDevices === 0) {
          if (window.electronAPI) {
            window.electronAPI.logToConsole('error', 'No MIDI devices found', {
              checkList: [
                'DDJ400 is connected via USB',
                'DDJ400 drivers are installed',
                'DDJ400 is powered on'
              ]
            });
          } else {
            console.error('❌ No MIDI devices found');
            console.log('💡 Please check:');
            console.log('   1. DDJ400 is connected via USB');
            console.log('   2. DDJ400 drivers are installed');
            console.log('   3. DDJ400 is powered on');
          }
          setMidiStatus('❌ MIDIデバイス未接続');
        } else {
          if (window.electronAPI) {
            window.electronAPI.logToConsole('midi-init', `MIDI connection complete - connected to ${connectedDevices} device(s)`);
          } else {
            console.log(`✅ Successfully connected to ${connectedDevices} MIDI device(s)`);
          }
          setMidiStatus(`✅ MIDI接続済み (${connectedDevices}台)`);
        }
      } catch (error) {
        if (window.electronAPI) {
          window.electronAPI.logToConsole('error', 'MIDI initialization failed', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        } else {
          console.error('❌ MIDI initialization failed:', error);
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        setMidiStatus('❌ MIDI初期化失敗');
      }
    };

    // 少し遅延してMIDI初期化（Electronの初期化完了を待つ）
    const timer = setTimeout(() => {
      initMIDI();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (midiAccess) {
        for (let input of midiAccess.inputs.values()) {
          input.onmidimessage = null;
        }
      }
    };
  }, [handleMIDIMessage]); // handleMIDIMessageのみを依存関係に

  return (
    <AppContainer>
      <VideoPanel>
        {currentVideo && getCurrentVideoSrc() ? (
          <VideoContainer>
            <Video
              ref={videoRef}
              key={currentVideo.id}
              src={getCurrentVideoSrc()}
              autoPlay={isPlaying}
              loop
              muted
              controls={false}
            />
            <SeekBar onClick={handleSeekBarClick}>
              <SeekProgress progress={duration > 0 ? (currentTime / duration) * 100 : 0} />
            </SeekBar>
            <TimeDisplay>
              {formatTime(currentTime)} / {formatTime(duration)}
            </TimeDisplay>
          </VideoContainer>
        ) : currentVideo && !getCurrentVideoSrc() ? (
          <NoVideo>
            ⚠️ 動画ファイルが見つかりません
            <br />
            "{currentVideo.name}"
            <br />
            プレイリストから削除して再度追加してください
          </NoVideo>
        ) : (
          <NoVideo>
            動画を選択してください
            <br />
            右側のパネルから動画を追加できます
          </NoVideo>
        )}
      </VideoPanel>
      
      <PlaylistPanel
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <PlaylistTitle>プレイリスト</PlaylistTitle>
        
        <MidiStatus>{midiStatus}</MidiStatus>
        
        <DropZone isDragOver={isDragOver}>
          {isDragOver ? (
            <div>ファイルをドロップしてください</div>
          ) : (
            <div>
              <div>動画・画像をドラッグ＆ドロップ</div>
              <div style={{ margin: '10px 0' }}>または</div>
              <AddButton onClick={addVideos}>
                ファイルを選択
              </AddButton>
            </div>
          )}
        </DropZone>
        
        <div>
          {playlist.map((video, index) => (
            <PlaylistItem
              key={video.id}
              active={index === currentIndex}
            >
              <PlaylistItemName onClick={() => selectVideo(index)}>
                {video.name}
              </PlaylistItemName>
              <DeleteButton 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromPlaylist(index);
                }}
              >
                削除
              </DeleteButton>
            </PlaylistItem>
          ))}
        </div>
        
        <Controls>
          <ControlButton onClick={previousVideo}>前</ControlButton>
          <ControlButton onClick={togglePlay}>
            {isPlaying ? '停止' : '再生'}
          </ControlButton>
          <ControlButton onClick={nextVideo}>次</ControlButton>
        </Controls>
      </PlaylistPanel>
    </AppContainer>
  );
}

export default App;