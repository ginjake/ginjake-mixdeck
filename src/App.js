import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: grid;
  grid-template-columns: 2fr 1.04fr 1.04fr;
  grid-template-rows: 4fr 1fr;
  height: 100vh;
  background: #1a1a1a;
  color: white;
  font-family: Arial, sans-serif;
  gap: 10px;
  padding: 10px;

  /* Electron互換性のためのフォールバック */
  @supports not (display: grid) {
    display: flex;
    flex-direction: column;
    
    & > * {
      flex: 1;
    }
  }

  /* Electron初期化時の表示確保 */
  min-height: 100vh;
  opacity: 1;
  visibility: visible;
`;

const VideoPanel = styled.div`
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 2px solid ${props => props.active ? '#4CAF50' : '#444'};
  aspect-ratio: ${props => props.isMain ? '16/9' : 'auto'};
  width: 100%;
  height: ${props => props.isMain ? 'auto' : '100%'};
  max-height: ${props => props.isMain ? '100%' : 'none'};
`;

const PlaylistPanel = styled.div`
  background: #2a2a2a;
  padding: 10px;
  border-radius: 8px;
  border: ${props => props.isActive ? '3px solid #ff4444' : '1px solid #444'};
  overflow-y: auto;
  font-size: 11px;
  box-shadow: ${props => props.isActive ? '0 0 10px rgba(255, 68, 68, 0.5)' : 'none'};
`;

const BlendPanel = styled.div`
  grid-column: span 3;
  background: #2a2a2a;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #444;
  display: flex;
  align-items: center;
  gap: 20px;
`;

const BlendSlider = styled.input`
  flex: 1;
  height: 8px;
  background: ${props => props.disabled ? '#666' : 'linear-gradient(to right, #ff6b6b, #4CAF50)'};
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${props => props.disabled ? '#999' : 'white'};
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${props => props.disabled ? '#999' : 'white'};
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
`;

const DropZone = styled.div`
  border: 2px dashed #666;
  border-radius: 5px;
  padding: 12px;
  text-align: center;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  font-size: 10px;
  
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

const Image = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  width: auto;
  height: auto;
  display: block;
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
  margin: 0 0 15px 0;
  color: #fff;
  font-size: 14px;
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
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 12px;
  cursor: pointer;
  margin-bottom: 15px;

  &:hover {
    background: #45a049;
  }
`;

const PlaylistItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: ${props => props.active ? '#555' : '#333'};
  margin-bottom: 2px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  
  &:hover {
    background: #444;
  }
`;

const PlaylistItemName = styled.div`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-right: 8px;
  font-size: 10px;
`;

const DeleteButton = styled.button`
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 50%;
  padding: 0;
  width: 18px;
  height: 18px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 6px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  
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
  // デュアルプレイリストシステム
  const [playlist1, setPlaylist1] = useState([]);
  const [playlist2, setPlaylist2] = useState([]);
  const [currentIndex1, setCurrentIndex1] = useState(0);
  const [currentIndex2, setCurrentIndex2] = useState(0);
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);
  const [isDragOver1, setIsDragOver1] = useState(false);
  const [isDragOver2, setIsDragOver2] = useState(false);
  
  // ブレンド機能
  const [blendRatio, setBlendRatio] = useState(0.5); // 0=画面1のみ, 1=画面2のみ
  const [mixDisabled, setMixDisabled] = useState(false); // Mix無効モード
  
  // 画面1と画面2の状態
  const [currentTime1, setCurrentTime1] = useState(0);
  const [currentTime2, setCurrentTime2] = useState(0);
  const [duration1, setDuration1] = useState(0);
  const [duration2, setDuration2] = useState(0);
  
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [midiStatus, setMidiStatus] = useState('初期化中...');
  
  // 2つのビデオ要素とCanvasブレンド用
  const videoRef1 = useRef(null);
  const videoRef2 = useRef(null);
  const canvasRef = useRef(null);
  
  // 画像キャッシュ用
  const imageCache1 = useRef(null);
  const imageCache2 = useRef(null);
  
  // MIDI用の最新状態参照
  const playlist1Ref = useRef(playlist1);
  const playlist2Ref = useRef(playlist2);
  const currentIndex1Ref = useRef(currentIndex1);
  const currentIndex2Ref = useRef(currentIndex2);
  const isPlaying1Ref = useRef(isPlaying1);
  const isPlaying2Ref = useRef(isPlaying2);
  const blendRatioRef = useRef(blendRatio);
  
  // MIDI更新の最適化用
  const lastMidiUpdateRef = useRef(0);
  
  // 現在操作中のプレイリスト (0: プレイリスト1, 1: プレイリスト2)
  const [activePlaylist, setActivePlaylist] = useState(0);
  const activePlaylistRef = useRef(activePlaylist);
  
  // MIDI連続制御用の状態管理
  const midiControlRef = useRef({
    // ブレンド制御
    blendIncreasing: false,
    blendDecreasing: false,
    blendDoubleSpeed: false,
    blendInterval: null,
    
    // 動画制御
    rewindInterval1: null,
    rewindInterval2: null,
    fastForwardInterval1: null,
    fastForwardInterval2: null
  });
  
  // refを常に最新に保つ
  useEffect(() => {
    playlist1Ref.current = playlist1;
  }, [playlist1]);
  
  useEffect(() => {
    playlist2Ref.current = playlist2;
  }, [playlist2]);
  
  useEffect(() => {
    currentIndex1Ref.current = currentIndex1;
  }, [currentIndex1]);
  
  useEffect(() => {
    currentIndex2Ref.current = currentIndex2;
  }, [currentIndex2]);
  
  useEffect(() => {
    isPlaying1Ref.current = isPlaying1;
  }, [isPlaying1]);
  
  useEffect(() => {
    isPlaying2Ref.current = isPlaying2;
  }, [isPlaying2]);
  
  useEffect(() => {
    blendRatioRef.current = blendRatio;
  }, [blendRatio]);
  
  useEffect(() => {
    activePlaylistRef.current = activePlaylist;
  }, [activePlaylist]);
  


  // デバッグ：アプリ起動時の状態確認
  useEffect(() => {
    window.electronAPI.logToConsole('debug', 'STARTUP_DEBUG: App started');
    window.electronAPI.logToConsole('debug', 'STARTUP_DEBUG: electronAPI exists: true');
    window.electronAPI.logToConsole('debug', 'STARTUP_DEBUG: writeInputLog exists: ' + !!window.electronAPI?.writeInputLog);
    
    // ログ出力テスト
    if (window.electronAPI?.writeInputLog) {
      window.electronAPI.writeInputLog('startup', 'App started - writeInputLog working');
    }
  }, []);



  // 現在の動画を取得
  const currentVideo1 = playlist1[currentIndex1];
  const currentVideo2 = playlist2[currentIndex2];

  // ブレンド処理用Canvas更新（Electron対応強化）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('Canvas ref not available');
      return;
    }
    
    let ctx;
    try {
      ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context');
        return;
      }
    } catch (error) {
      console.error('Canvas context error:', error);
      return;
    }
    
    const video1 = videoRef1.current;
    const video2 = videoRef2.current;
    let animationFrameId;
    
    const drawFrame = () => {
      try {
        if (!ctx || !canvas) return;
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // デフォルト背景色
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Mix無効モードかブレンドモードかで描画方法を変更
        if (mixDisabled) {
          // Mix無効モード：プレイリスト1の上にプレイリスト2を重ね合わせ
          
          // プレイリスト1を背景として描画
          if (currentVideo1) {
            try {
              ctx.globalAlpha = 1.0;
              if (currentVideo1.type === 'video' && video1 && video1.readyState >= 2) {
                ctx.drawImage(video1, 0, 0, canvas.width, canvas.height);
              } else if (currentVideo1.type === 'image' && imageCache1.current) {
                // 画像のアスペクト比を保持して最大サイズで描画（右下基準）
                const img = imageCache1.current;
                const imgAspect = img.naturalWidth / img.naturalHeight;
                const canvasAspect = canvas.width / canvas.height;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspect > canvasAspect) {
                  // 画像が横長の場合、幅を基準にする
                  drawWidth = canvas.width;
                  drawHeight = canvas.width / imgAspect;
                  drawX = 0;
                  drawY = canvas.height - drawHeight; // 右下基準（下端揃え）
                } else {
                  // 画像が縦長の場合、高さを基準にする
                  drawHeight = canvas.height;
                  drawWidth = canvas.height * imgAspect;
                  drawX = canvas.width - drawWidth; // 右下基準（右端揃え）
                  drawY = 0;
                }
                
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
              }
            } catch (error) {
              console.warn('Video1 draw error:', error);
            }
          }
          
          // プレイリスト2を前景として描画（透過PNG対応）
          if (currentVideo2) {
            try {
              ctx.globalAlpha = 1.0; // 透過PNGの透過情報をそのまま使用
              if (currentVideo2.type === 'video' && video2 && video2.readyState >= 2) {
                ctx.drawImage(video2, 0, 0, canvas.width, canvas.height);
              } else if (currentVideo2.type === 'image' && imageCache2.current) {
                // 画像のアスペクト比を保持して最大サイズで描画（右下基準）
                const img = imageCache2.current;
                const imgAspect = img.naturalWidth / img.naturalHeight;
                const canvasAspect = canvas.width / canvas.height;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspect > canvasAspect) {
                  // 画像が横長の場合、幅を基準にする
                  drawWidth = canvas.width;
                  drawHeight = canvas.width / imgAspect;
                  drawX = 0;
                  drawY = canvas.height - drawHeight; // 右下基準（下端揃え）
                } else {
                  // 画像が縦長の場合、高さを基準にする
                  drawHeight = canvas.height;
                  drawWidth = canvas.height * imgAspect;
                  drawX = canvas.width - drawWidth; // 右下基準（右端揃え）
                  drawY = 0;
                }
                
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
              }
            } catch (error) {
              console.warn('Video2 draw error:', error);
            }
          }
        } else {
          // 通常のブレンドモード
          const currentBlendRatio = blendRatioRef.current;
          
          // 画面1を描画（アルファ値でブレンド）
          if (currentVideo1) {
            try {
              if (currentVideo1.type === 'video' && video1 && video1.readyState >= 2) {
                ctx.globalAlpha = 1 - currentBlendRatio;
                ctx.drawImage(video1, 0, 0, canvas.width, canvas.height);
              } else if (currentVideo1.type === 'image' && imageCache1.current) {
                ctx.globalAlpha = 1 - currentBlendRatio;
                // 画像のアスペクト比を保持して最大サイズで描画（右下基準）
                const img = imageCache1.current;
                const imgAspect = img.naturalWidth / img.naturalHeight;
                const canvasAspect = canvas.width / canvas.height;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspect > canvasAspect) {
                  // 画像が横長の場合、幅を基準にする
                  drawWidth = canvas.width;
                  drawHeight = canvas.width / imgAspect;
                  drawX = 0;
                  drawY = canvas.height - drawHeight; // 右下基準（下端揃え）
                } else {
                  // 画像が縦長の場合、高さを基準にする
                  drawHeight = canvas.height;
                  drawWidth = canvas.height * imgAspect;
                  drawX = canvas.width - drawWidth; // 右下基準（右端揃え）
                  drawY = 0;
                }
                
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
              }
            } catch (error) {
              console.warn('Video1 draw error:', error);
            }
          }
          
          // 画面2を描画（アルファ値でブレンド）
          if (currentVideo2) {
            try {
              if (currentVideo2.type === 'video' && video2 && video2.readyState >= 2) {
                ctx.globalAlpha = currentBlendRatio;
                ctx.drawImage(video2, 0, 0, canvas.width, canvas.height);
              } else if (currentVideo2.type === 'image' && imageCache2.current) {
                ctx.globalAlpha = currentBlendRatio;
                // 画像のアスペクト比を保持して最大サイズで描画（右下基準）
                const img = imageCache2.current;
                const imgAspect = img.naturalWidth / img.naturalHeight;
                const canvasAspect = canvas.width / canvas.height;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspect > canvasAspect) {
                  // 画像が横長の場合、幅を基準にする
                  drawWidth = canvas.width;
                  drawHeight = canvas.width / imgAspect;
                  drawX = 0;
                  drawY = canvas.height - drawHeight; // 右下基準（下端揃え）
                } else {
                  // 画像が縦長の場合、高さを基準にする
                  drawHeight = canvas.height;
                  drawWidth = canvas.height * imgAspect;
                  drawX = canvas.width - drawWidth; // 右下基準（右端揃え）
                  drawY = 0;
                }
                
                ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
              }
            } catch (error) {
              console.warn('Video2 draw error:', error);
            }
          }
        }
        
        ctx.globalAlpha = 1.0;
        
        // 次のフレームをリクエスト
        animationFrameId = requestAnimationFrame(drawFrame);
      } catch (error) {
        console.error('Canvas draw frame error:', error);
      }
    };
    
    // 初期化を少し遅延
    const initTimeout = setTimeout(() => {
      drawFrame();
    }, 100);
    
    return () => {
      clearTimeout(initTimeout);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [currentVideo1, currentVideo2, mixDisabled]);

  // 画像1のキャッシュ更新
  useEffect(() => {
    if (currentVideo1 && currentVideo1.type === 'image') {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      // 透過PNG対応のために強制的にRGBA形式で読み込み
      img.onload = () => {
        // 画像が正常に読み込まれたらキャッシュに保存
        imageCache1.current = img;
        console.log('Image1 loaded with transparency support');
      };
      img.onerror = () => {
        console.warn('Failed to load image1');
        imageCache1.current = null;
      };
      img.src = getCurrentVideoSrc1();
    } else {
      imageCache1.current = null;
    }
  }, [currentVideo1]);

  // 画像2のキャッシュ更新
  useEffect(() => {
    if (currentVideo2 && currentVideo2.type === 'image') {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      // 透過PNG対応のために強制的にRGBA形式で読み込み
      img.onload = () => {
        // 画像が正常に読み込まれたらキャッシュに保存
        imageCache2.current = img;
        console.log('Image2 loaded with transparency support');
      };
      img.onerror = () => {
        console.warn('Failed to load image2');
        imageCache2.current = null;
      };
      img.src = getCurrentVideoSrc2();
    } else {
      imageCache2.current = null;
    }
  }, [currentVideo2]);

  // 動画1の時間更新
  useEffect(() => {
    const video = videoRef1.current;
    if (!video) return;

    const updateTime = () => setCurrentTime1(video.currentTime);
    const updateDuration = () => setDuration1(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [currentVideo1]);

  // 動画2の時間更新
  useEffect(() => {
    const video = videoRef2.current;
    if (!video) return;

    const updateTime = () => setCurrentTime2(video.currentTime);
    const updateDuration = () => setDuration2(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [currentVideo2]);

  // デュアルプレイリストの自動保存（初期化後のみ）
  useEffect(() => {
    if (!isInitialized) return;
    
    const savePlaylist = async () => {
      const saveData = {
        playlist1: playlist1.map(video => ({
          id: video.id,
          name: video.name,
          url: video.url,
          path: video.path,
          type: video.type,
          size: video.size,
          lastModified: video.lastModified
        })),
        playlist2: playlist2.map(video => ({
          id: video.id,
          name: video.name,
          url: video.url,
          path: video.path,
          type: video.type,
          size: video.size,
          lastModified: video.lastModified
        })),
        currentIndex1,
        currentIndex2,
        blendRatio
      };

      try {
        await window.electronAPI.savePlaylist(saveData);
      } catch (error) {
        // エラーログは電子が処理
      }
    };

    savePlaylist();
  }, [playlist1, playlist2, currentIndex1, currentIndex2, blendRatio, isInitialized]);

  // 起動時にデュアルプレイリストを復元
  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        let saveData = null;

        try {
          const result = await window.electronAPI.loadPlaylist();
          if (result.success && result.data) {
            saveData = result.data;
          }
        } catch (error) {
          // エラーログは電子が処理
        }

        if (saveData) {
          if (saveData.playlist1) {
            setPlaylist1(saveData.playlist1);
            setCurrentIndex1(saveData.currentIndex1 || 0);
          }
          if (saveData.playlist2) {
            setPlaylist2(saveData.playlist2);
            setCurrentIndex2(saveData.currentIndex2 || 0);
          }
          if (saveData.blendRatio !== undefined) {
            setBlendRatio(saveData.blendRatio);
          }
        }
      } catch (error) {
        console.error('❌ Failed to load dual playlists:', error);
      }
      
      setIsInitialized(true);
    };

    loadPlaylist();
  }, []);

  // ファイルをプレイリスト1に追加
  const addFilesToPlaylist1 = (files) => {
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
      }

      return video;
    });
    
    setPlaylist1(prev => [...prev, ...newVideos]);
  };

  // ファイルをプレイリスト2に追加
  const addFilesToPlaylist2 = (files) => {
    const newVideos = files.map((file, index) => {
      const video = {
        id: Date.now() + index + 1000, // IDが重複しないように
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        size: file.size,
        lastModified: file.lastModified
      };

      // Electron環境では実際のファイルパスを保存
      if (window.electronAPI && file.path) {
        video.path = file.path;
      }

      return video;
    });
    
    setPlaylist2(prev => [...prev, ...newVideos]);
  };

  // ファイル選択（プレイリスト1用）
  const addVideos1 = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'video/*,image/*';
    
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      addFilesToPlaylist1(files);
    };
    
    input.click();
  };

  // ファイル選択（プレイリスト2用）
  const addVideos2 = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'video/*,image/*';
    
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      addFilesToPlaylist2(files);
    };
    
    input.click();
  };

  // ドラッグアンドドロップ（プレイリスト1用）
  const handleDragOver1 = (e) => {
    e.preventDefault();
    setIsDragOver1(true);
  };

  const handleDragLeave1 = (e) => {
    e.preventDefault();
    setIsDragOver1(false);
  };

  const handleDrop1 = (e) => {
    e.preventDefault();
    setIsDragOver1(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('video/') || file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      addFilesToPlaylist1(files);
    }
  };

  // ドラッグアンドドロップ（プレイリスト2用）
  const handleDragOver2 = (e) => {
    e.preventDefault();
    setIsDragOver2(true);
  };

  const handleDragLeave2 = (e) => {
    e.preventDefault();
    setIsDragOver2(false);
  };

  const handleDrop2 = (e) => {
    e.preventDefault();
    setIsDragOver2(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('video/') || file.type.startsWith('image/')
    );
    
    if (files.length > 0) {
      addFilesToPlaylist2(files);
    }
  };

  // 動画選択（プレイリスト1）
  const selectVideo1 = useCallback((index) => {
    setCurrentIndex1(index);
  }, []);

  // 動画選択（プレイリスト2）
  const selectVideo2 = useCallback((index) => {
    setCurrentIndex2(index);
  }, []);

  // プレイリスト1から削除
  const removeFromPlaylist1 = (index) => {
    const newPlaylist = playlist1.filter((_, i) => i !== index);
    setPlaylist1(newPlaylist);
    
    if (index === currentIndex1) {
      if (newPlaylist.length === 0) {
        setCurrentIndex1(0);
      } else if (index >= newPlaylist.length) {
        setCurrentIndex1(newPlaylist.length - 1);
      }
    } else if (index < currentIndex1) {
      setCurrentIndex1(currentIndex1 - 1);
    }
  };

  // プレイリスト2から削除
  const removeFromPlaylist2 = (index) => {
    const newPlaylist = playlist2.filter((_, i) => i !== index);
    setPlaylist2(newPlaylist);
    
    if (index === currentIndex2) {
      if (newPlaylist.length === 0) {
        setCurrentIndex2(0);
      } else if (index >= newPlaylist.length) {
        setCurrentIndex2(newPlaylist.length - 1);
      }
    } else if (index < currentIndex2) {
      setCurrentIndex2(currentIndex2 - 1);
    }
  };

  // プレイリスト1の制御関数
  const nextVideo1 = useCallback(() => {
    const currentPlaylist = playlist1Ref.current;
    const currentIdx = currentIndex1Ref.current;
    
    if (currentPlaylist.length > 0) {
      const newIndex = (currentIdx + 1) % currentPlaylist.length;
      setCurrentIndex1(newIndex);
    }
  }, []);

  const previousVideo1 = useCallback(() => {
    const currentPlaylist = playlist1Ref.current;
    const currentIdx = currentIndex1Ref.current;
    
    if (currentPlaylist.length > 0) {
      const newIndex = (currentIdx - 1 + currentPlaylist.length) % currentPlaylist.length;
      setCurrentIndex1(newIndex);
    }
  }, []);

  const togglePlay1 = useCallback(() => {
    const currentIsPlaying = isPlaying1Ref.current;
    
    if (videoRef1.current) {
      const isVideoPlaying = !videoRef1.current.paused;
      
      if (isVideoPlaying) {
        videoRef1.current.pause();
        setIsPlaying1(false);
      } else {
        videoRef1.current.play().then(() => {
          setIsPlaying1(true);
        }).catch((error) => {
          setIsPlaying1(false);
        });
      }
    } else {
      setIsPlaying1(!currentIsPlaying);
    }
  }, []);

  // プレイリスト2の制御関数
  const nextVideo2 = useCallback(() => {
    const currentPlaylist = playlist2Ref.current;
    const currentIdx = currentIndex2Ref.current;
    
    if (currentPlaylist.length > 0) {
      const newIndex = (currentIdx + 1) % currentPlaylist.length;
      setCurrentIndex2(newIndex);
    }
  }, []);

  const previousVideo2 = useCallback(() => {
    const currentPlaylist = playlist2Ref.current;
    const currentIdx = currentIndex2Ref.current;
    
    if (currentPlaylist.length > 0) {
      const newIndex = (currentIdx - 1 + currentPlaylist.length) % currentPlaylist.length;
      setCurrentIndex2(newIndex);
    }
  }, []);

  const togglePlay2 = useCallback(() => {
    const currentIsPlaying = isPlaying2Ref.current;
    
    if (videoRef2.current) {
      const isVideoPlaying = !videoRef2.current.paused;
      
      if (isVideoPlaying) {
        videoRef2.current.pause();
        setIsPlaying2(false);
      } else {
        videoRef2.current.play().then(() => {
          setIsPlaying2(true);
        }).catch((error) => {
          setIsPlaying2(false);
        });
      }
    } else {
      setIsPlaying2(!currentIsPlaying);
    }
  }, []);

  // プレイリスト1の動画スキップ機能
  const skipVideo1 = useCallback((seconds) => {
    if (videoRef1.current) {
      const currentTime = videoRef1.current.currentTime;
      const newTime = Math.max(0, Math.min(currentTime + seconds, videoRef1.current.duration || 0));
      videoRef1.current.currentTime = newTime;
    }
  }, []);

  // プレイリスト2の動画スキップ機能
  const skipVideo2 = useCallback((seconds) => {
    if (videoRef2.current) {
      const currentTime = videoRef2.current.currentTime;
      const newTime = Math.max(0, Math.min(currentTime + seconds, videoRef2.current.duration || 0));
      videoRef2.current.currentTime = newTime;
    }
  }, []);

  // シークバークリック（プレイリスト1）
  const handleSeekBarClick1 = (e) => {
    if (videoRef1.current && duration1 > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration1;
      videoRef1.current.currentTime = newTime;
    }
  };

  // シークバークリック（プレイリスト2）
  const handleSeekBarClick2 = (e) => {
    if (videoRef2.current && duration2 > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration2;
      videoRef2.current.currentTime = newTime;
    }
  };

  // 時間フォーマット
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 現在の動画を取得（プレイリスト1）
  const getCurrentVideoSrc1 = () => {
    if (!currentVideo1) return null;
    
    if (window.electronAPI && currentVideo1.path) {
      return `file://${currentVideo1.path}`;
    }
    
    if (currentVideo1.url) {
      return currentVideo1.url;
    }
    
    console.warn('⚠️ Video1 URL is invalid:', currentVideo1.url);
    return null;
  };

  // 現在の動画を取得（プレイリスト2）
  const getCurrentVideoSrc2 = () => {
    if (!currentVideo2) return null;
    
    if (window.electronAPI && currentVideo2.path) {
      return `file://${currentVideo2.path}`;
    }
    
    if (currentVideo2.url) {
      return currentVideo2.url;
    }
    
    console.warn('⚠️ Video2 URL is invalid:', currentVideo2.url);
    return null;
  };



  // キーボード操作
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          previousVideo();
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextVideo();
          break;
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [playlist2.length]);

  // 動画操作をリセットする関数
  const resetVideoActions = useCallback(() => {
    const control = midiControlRef.current;
    
    // 巻き戻し停止
    if (control.rewindInterval1) {
      clearInterval(control.rewindInterval1);
      control.rewindInterval1 = null;
    }
    if (control.rewindInterval2) {
      clearInterval(control.rewindInterval2);
      control.rewindInterval2 = null;
    }
    
    // 早送り停止
    if (control.fastForwardInterval1) {
      clearInterval(control.fastForwardInterval1);
      control.fastForwardInterval1 = null;
    }
    if (control.fastForwardInterval2) {
      clearInterval(control.fastForwardInterval2);
      control.fastForwardInterval2 = null;
    }
  }, []);

  // ブレンド操作をリセットする関数
  const resetBlendActions = useCallback(() => {
    const control = midiControlRef.current;
    
    // ブレンド操作停止
    if (control.blendInterval) {
      clearInterval(control.blendInterval);
      control.blendInterval = null;
    }
    control.blendIncreasing = false;
    control.blendDecreasing = false;
    control.blendDoubleSpeed = false;
  }, []);

  // 全ての連続操作を停止する関数
  const stopAllContinuousActions = useCallback(() => {
    resetVideoActions();
    resetBlendActions();
  }, [resetVideoActions, resetBlendActions]);

  // デュアルプレイリスト対応MIDIメッセージハンドラー
  const handleMIDIMessage = useCallback((message) => {
    const [status, data1, data2] = message.data;
    
    const midiData = {
      status: status,
      data1: data1,
      data2: data2,
      decimal: data1,
      buttonPressed: data2 > 0
    };

    // midi-log.txtとターミナルにログ出力
    if (window.electronAPI?.writeInputLog) {
      window.electronAPI.writeInputLog('midi-message', `MIDI message received: [${status}, ${data1}, ${data2}] - ${JSON.stringify(midiData)}`);
    }

    // Electron専用：MIDIログ出力
    window.electronAPI.logToConsole('midi-signal', 'MIDI signal received', midiData);

    // Status 176 (0xb0) のControl Changeメッセージのみ処理
    if (status === 176) {
      const ccNumber = parseInt(data1);
      const ccValue = parseInt(data2);
      const isPressed = ccValue === 127;
      const isReleased = ccValue === 0;
      
      // 連続操作ボタン以外が押された場合、全ての連続操作を停止
      if (![4, 6, 10, 11, 12].includes(ccNumber)) {
        stopAllContinuousActions();
      }
      
      window.electronAPI.logToConsole('midi-action', `CC${ccNumber}: ${ccValue} (pressed: ${isPressed}, released: ${isReleased})`);
      
      switch (ccNumber) {
        case 1: // 操作対象プレイリストの切り替え
          if (isReleased) {
            const newPlaylist = activePlaylistRef.current === 0 ? 1 : 0;
            setActivePlaylist(newPlaylist);
            window.electronAPI.logToConsole('midi-action', `Switch to playlist ${newPlaylist + 1}`);
          }
          break;
          
        case 2: // 前の動画へ
          if (isReleased) {
            const currentPlaylist = activePlaylistRef.current;
            if (currentPlaylist === 0) {
              previousVideo1();
            } else {
              previousVideo2();
            }
            window.electronAPI.logToConsole('midi-action', `Previous video playlist ${currentPlaylist + 1}`);
          }
          break;
          
        case 3: // 15秒前に
          if (isReleased) {
            const currentPlaylist = activePlaylistRef.current;
            const videoRef = currentPlaylist === 0 ? videoRef1 : videoRef2;
            if (videoRef.current) {
              videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 15);
            }
            window.electronAPI.logToConsole('midi-action', `Skip -15s playlist ${currentPlaylist + 1}`);
          }
          break;
          
        case 4: // 1秒巻き戻し
          if (isPressed) {
            const control = midiControlRef.current;
            const currentPlaylist = activePlaylistRef.current;
            const videoRef = currentPlaylist === 0 ? videoRef1 : videoRef2;
            const intervalRef = currentPlaylist === 0 ? 'rewindInterval1' : 'rewindInterval2';
            
            if (videoRef.current && !control[intervalRef]) {
              control[intervalRef] = setInterval(() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 1);
                }
              }, 100); // 100ms間隔で1秒戻す
            }
            window.electronAPI.logToConsole('midi-action', `Rewind 1s start playlist ${currentPlaylist + 1}`);
          } else if (isReleased) {
            const control = midiControlRef.current;
            const currentPlaylist = activePlaylistRef.current;
            const intervalRef = currentPlaylist === 0 ? 'rewindInterval1' : 'rewindInterval2';
            
            if (control[intervalRef]) {
              clearInterval(control[intervalRef]);
              control[intervalRef] = null;
            }
            window.electronAPI.logToConsole('midi-action', `Rewind 1s stop playlist ${currentPlaylist + 1}`);
          }
          break;
          
        case 5: // 再生/停止トグル
          if (isReleased) {
            const currentPlaylist = activePlaylistRef.current;
            if (currentPlaylist === 0) {
              togglePlay1();
            } else {
              togglePlay2();
            }
            window.electronAPI.logToConsole('midi-action', `Play/Stop toggle playlist ${currentPlaylist + 1}`);
          }
          break;
          
        case 6: // 3秒早送り
          if (isPressed) {
            const control = midiControlRef.current;
            const currentPlaylist = activePlaylistRef.current;
            const videoRef = currentPlaylist === 0 ? videoRef1 : videoRef2;
            const intervalRef = currentPlaylist === 0 ? 'fastForwardInterval1' : 'fastForwardInterval2';
            
            if (videoRef.current && !control[intervalRef]) {
              control[intervalRef] = setInterval(() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 3);
                }
              }, 100); // 100ms間隔で3秒進む
            }
            window.electronAPI.logToConsole('midi-action', `Fast forward 3s start playlist ${currentPlaylist + 1}`);
          } else if (isReleased) {
            const control = midiControlRef.current;
            const currentPlaylist = activePlaylistRef.current;
            const intervalRef = currentPlaylist === 0 ? 'fastForwardInterval1' : 'fastForwardInterval2';
            
            if (control[intervalRef]) {
              clearInterval(control[intervalRef]);
              control[intervalRef] = null;
            }
            window.electronAPI.logToConsole('midi-action', `Fast forward 3s stop playlist ${currentPlaylist + 1}`);
          }
          break;
          
        case 7: // 15秒後に
          if (isReleased) {
            const currentPlaylist = activePlaylistRef.current;
            const videoRef = currentPlaylist === 0 ? videoRef1 : videoRef2;
            if (videoRef.current) {
              videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 15);
            }
            window.electronAPI.logToConsole('midi-action', `Skip +15s playlist ${currentPlaylist + 1}`);
          }
          break;
          
        case 8: // 次の動画へ
          if (isReleased) {
            const currentPlaylist = activePlaylistRef.current;
            if (currentPlaylist === 0) {
              nextVideo1();
            } else {
              nextVideo2();
            }
            window.electronAPI.logToConsole('midi-action', `Next video playlist ${currentPlaylist + 1}`);
          }
          break;
          
        case 9: // ブレンド値を0に
          if (isReleased) {
            setBlendRatio(0);
            window.electronAPI.logToConsole('midi-action', 'Blend to 0');
          }
          break;
          
        case 10: // ブレンド値を左に
          if (isPressed) {
            const control = midiControlRef.current;
            control.blendDecreasing = true;
            
            if (!control.blendInterval) {
              const moveBlend = () => {
                const speed = control.blendDoubleSpeed ? 0.06 : 0.02; // 3倍速
                const currentBlend = blendRatioRef.current;
                if (control.blendDecreasing && currentBlend > 0) {
                  const newBlend = Math.max(0, currentBlend - speed);
                  setBlendRatio(newBlend);
                }
              };
              control.blendInterval = setInterval(moveBlend, 50);
            }
            window.electronAPI.logToConsole('midi-action', 'Blend left start');
          } else if (isReleased) {
            const control = midiControlRef.current;
            control.blendDecreasing = false;
            if (control.blendInterval && !control.blendIncreasing) {
              clearInterval(control.blendInterval);
              control.blendInterval = null;
            }
            window.electronAPI.logToConsole('midi-action', 'Blend left stop');
          }
          break;
          
        case 11: // ブレンド値移動量3倍モード
          if (isPressed) {
            midiControlRef.current.blendDoubleSpeed = true;
            window.electronAPI.logToConsole('midi-action', 'Blend triple speed on');
          } else if (isReleased) {
            midiControlRef.current.blendDoubleSpeed = false;
            window.electronAPI.logToConsole('midi-action', 'Blend triple speed off');
          }
          break;
          
        case 12: // ブレンド値を右に
          if (isPressed) {
            const control = midiControlRef.current;
            control.blendIncreasing = true;
            
            if (!control.blendInterval) {
              const moveBlend = () => {
                const speed = control.blendDoubleSpeed ? 0.06 : 0.02; // 3倍速
                const currentBlend = blendRatioRef.current;
                if (control.blendIncreasing && currentBlend < 1) {
                  const newBlend = Math.min(1, currentBlend + speed);
                  setBlendRatio(newBlend);
                }
              };
              control.blendInterval = setInterval(moveBlend, 50);
            }
            window.electronAPI.logToConsole('midi-action', 'Blend right start');
          } else if (isReleased) {
            const control = midiControlRef.current;
            control.blendIncreasing = false;
            if (control.blendInterval && !control.blendDecreasing) {
              clearInterval(control.blendInterval);
              control.blendInterval = null;
            }
            window.electronAPI.logToConsole('midi-action', 'Blend right stop');
          }
          break;
          
        case 13: // ブレンド値を100に
          if (isReleased) {
            setBlendRatio(1);
            window.electronAPI.logToConsole('midi-action', 'Blend to 100');
          }
          break;
          
        case 14: // 未割り当て
          if (isReleased) {
            window.electronAPI.logToConsole('midi-action', 'CC14: Unassigned button');
          }
          break;
          
        case 15: // Mix無効モード
          if (isReleased) {
            setMixDisabled(!mixDisabled);
            window.electronAPI.logToConsole('midi-action', `Mix disabled: ${!mixDisabled}`);
          }
          break;
          
        case 98: // 動画操作リセット
          if (isReleased) {
            resetVideoActions();
            window.electronAPI.logToConsole('midi-action', 'Video actions reset');
          }
          break;
          
        case 99: // ブレンド操作リセット
          if (isReleased) {
            resetBlendActions();
            window.electronAPI.logToConsole('midi-action', 'Blend actions reset');
          }
          break;
          
        default:
          window.electronAPI.logToConsole('midi-action', `Unhandled CC${ccNumber}: ${ccValue}`);
          break;
      }
      return;
    }

    // 他のStatusコードの処理（必要に応じて追加）
    window.electronAPI.logToConsole('midi-action', `Other MIDI message: Status=0x${status.toString(16)}, Data1=0x${data1.toString(16)}, Data2=${data2}`);
  }, [togglePlay1, togglePlay2, previousVideo1, previousVideo2, nextVideo1, nextVideo2, stopAllContinuousActions, resetVideoActions, resetBlendActions, mixDisabled]);

  // lovelive9キーボード MIDI対応（Electron対応強化）
  useEffect(() => {
    let midiAccess = null;

    const initMIDI = async () => {
      try {
        // 基本的なログ出力テスト
        if (window.electronAPI?.writeInputLog) {
          window.electronAPI.writeInputLog('midi-init', '=== MIDI INIT START ===');
        }
        
        window.electronAPI.logToConsole('midi-init', 'MIDI support check started', {
          navigatorExists: !!navigator,
          requestMIDIAccessExists: !!navigator.requestMIDIAccess,
          electronEnvironment: true
        });
        
        setMidiStatus('MIDI初期化中...');
        
        if (!navigator.requestMIDIAccess) {
          window.electronAPI.logToConsole('error', 'Web MIDI API not supported');
          if (window.electronAPI?.writeInputLog) {
            window.electronAPI.writeInputLog('midi-error', 'Web MIDI API not supported');
          }
          setMidiStatus('❌ MIDI未対応');
          return;
        }
        
        if (window.electronAPI?.writeInputLog) {
          window.electronAPI.writeInputLog('midi-init', 'Web MIDI API available, requesting access...');
        }

        window.electronAPI.logToConsole('midi-init', 'Requesting MIDI access...');
        setMidiStatus('MIDI接続中...');
        
        // MIDI共有オプション付きでアクセス要求
        midiAccess = await navigator.requestMIDIAccess({ 
          sysex: false,
          software: true  // ソフトウェアMIDI許可
        });
        
        window.electronAPI.logToConsole('midi-init', 'MIDI access acquired successfully', {
          inputCount: midiAccess.inputs.size
        });

        let connectedDevices = 0;
        let lovelive9Found = false;
        
        for (let input of midiAccess.inputs.values()) {
          const deviceInfo = {
            name: input.name,
            id: input.id,
            manufacturer: input.manufacturer,
            state: input.state,
            connection: input.connection
          };
          
          window.electronAPI.logToConsole('midi-init', 'MIDI input device found', deviceInfo);
          
          // DDJ400は明示的に無視
          const isDDJ400 = input.name && (
            input.name.toLowerCase().includes('ddj-400') ||
            input.name.toLowerCase().includes('ddj400') ||
            input.name.toLowerCase().includes('pioneer')
          );
          
          if (isDDJ400) {
            window.electronAPI.logToConsole('midi-init', `DDJ400 detected but ignored: ${input.name}`);
            continue; // DDJ400は接続しない
          }
          
          // lovelive9キーボードのみ接続
          const isLovelive9 = input.name && (
            input.name.toLowerCase().includes('lovelive') ||
            input.name.toLowerCase().includes('qmk') ||
            input.name.toLowerCase().includes('keyboard') ||
            input.name.toLowerCase().includes('midi')
          );
          
          if (isLovelive9) {
            lovelive9Found = true;
            input.onmidimessage = handleMIDIMessage;
            connectedDevices++;
            window.electronAPI.logToConsole('midi-init', `lovelive9 keyboard connected: ${input.name}`);
          } else {
            window.electronAPI.logToConsole('midi-init', `Other MIDI device ignored: ${input.name || 'Unknown Device'}`);
          }
        }

        if (connectedDevices === 0) {
          window.electronAPI.logToConsole('error', 'No lovelive9 keyboard found', {
            checkList: [
              'lovelive9 keyboard is connected via USB',
              'lovelive9 keyboard is powered on',
              'QMK firmware is properly configured'
            ]
          });
          setMidiStatus('❌ lovelive9キーボード未接続');
        } else if (lovelive9Found) {
          window.electronAPI.logToConsole('midi-init', `MIDI connection complete - lovelive9 keyboard found`);
          setMidiStatus(`✅ lovelive9キーボード接続済み`);
        } else {
          window.electronAPI.logToConsole('midi-init', `MIDI connection complete - connected to ${connectedDevices} device(s)`);
          setMidiStatus(`⚠️ MIDI接続済み (${connectedDevices}台) - lovelive9未検出`);
        }
      } catch (error) {
        window.electronAPI.logToConsole('error', 'MIDI initialization failed', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
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
  }, [handleMIDIMessage]);

  return (
    <AppContainer>
      {/* ブレンド画面（画面3） */}
      <VideoPanel active={true} isMain={true}>
        <VideoContainer>
          <canvas 
            ref={canvasRef}
            width={1920}
            height={1080}
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              background: '#000',
              aspectRatio: '16/9'
            }}
          />
          <TimeDisplay style={{ marginTop: '10px' }}>
            ブレンド率: {(blendRatio * 100).toFixed(1)}% | P1:{((1-blendRatio)*100).toFixed(1)}% P2:{(blendRatio*100).toFixed(1)}%
          </TimeDisplay>
        </VideoContainer>
      </VideoPanel>
      
      {/* プレイリスト1パネル */}
      <PlaylistPanel
        isActive={activePlaylist === 0}
        onDragOver={handleDragOver1}
        onDragLeave={handleDragLeave1}
        onDrop={handleDrop1}
      >
        <PlaylistTitle>プレイリスト1 (左デッキ)</PlaylistTitle>
        
        <DropZone isDragOver={isDragOver1}>
          {isDragOver1 ? (
            <div>ファイルをドロップしてください</div>
          ) : (
            <div>
              <div>動画・画像をドラッグ＆ドロップ</div>
              <div style={{ margin: '10px 0' }}>または</div>
              <AddButton onClick={addVideos1}>
                ファイルを選択
              </AddButton>
            </div>
          )}
        </DropZone>
        
        {/* 画面1プレビュー */}
        <div style={{ marginBottom: '8px', background: '#000', borderRadius: '4px', overflow: 'hidden' }}>
          {currentVideo1 && getCurrentVideoSrc1() ? (
            <div style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentVideo1.type === 'video' ? (
                <Video
                  ref={videoRef1}
                  key={currentVideo1.id}
                  src={getCurrentVideoSrc1()}
                  autoPlay={isPlaying1}
                  loop
                  muted
                  controls={false}
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              ) : (
                <Image
                  key={currentVideo1.id}
                  src={getCurrentVideoSrc1()}
                  alt={currentVideo1.name}
                  style={{ 
                    maxHeight: '80px', 
                    maxWidth: '100%', 
                    width: 'auto', 
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>
          ) : (
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px' }}>
              画面1
            </div>
          )}
          
          {/* シークバーと時間表示（高さを一定に保つため常に表示） */}
          <SeekBar onClick={currentVideo1?.type === 'video' ? handleSeekBarClick1 : undefined} style={{ visibility: currentVideo1?.type === 'video' ? 'visible' : 'hidden' }}>
            <SeekProgress progress={duration1 > 0 ? (currentTime1 / duration1) * 100 : 0} />
          </SeekBar>
          <TimeDisplay style={{ fontSize: '12px', textAlign: 'center', visibility: currentVideo1?.type === 'video' ? 'visible' : 'hidden' }}>
            {currentVideo1?.type === 'video' ? `${formatTime(currentTime1)} / ${formatTime(duration1)}` : '\u00A0'}
          </TimeDisplay>
        </div>
        
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {playlist1.map((video, index) => (
            <PlaylistItem
              key={video.id}
              active={index === currentIndex1}
            >
              <PlaylistItemName onClick={() => selectVideo1(index)}>
                {video.type === 'video' ? '🎬' : '📷'} {video.name}
              </PlaylistItemName>
              <DeleteButton 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromPlaylist1(index);
                }}
              >
                ×
              </DeleteButton>
            </PlaylistItem>
          ))}
        </div>
        
        <Controls>
          <ControlButton onClick={previousVideo1}>前</ControlButton>
          {currentVideo1?.type === 'video' ? (
            <ControlButton onClick={togglePlay1}>
              {isPlaying1 ? '停止' : '再生'}
            </ControlButton>
          ) : (
            <ControlButton disabled style={{ opacity: 0.5 }}>
              画像
            </ControlButton>
          )}
          <ControlButton onClick={nextVideo1}>次</ControlButton>
        </Controls>
      </PlaylistPanel>
      
      {/* プレイリスト2パネル */}
      <PlaylistPanel
        isActive={activePlaylist === 1}
        onDragOver={handleDragOver2}
        onDragLeave={handleDragLeave2}
        onDrop={handleDrop2}
      >
        <PlaylistTitle>プレイリスト2 (右デッキ)</PlaylistTitle>
        
        <DropZone isDragOver={isDragOver2}>
          {isDragOver2 ? (
            <div>ファイルをドロップしてください</div>
          ) : (
            <div>
              <div>動画・画像をドラッグ＆ドロップ</div>
              <div style={{ margin: '10px 0' }}>または</div>
              <AddButton onClick={addVideos2}>
                ファイルを選択
              </AddButton>
            </div>
          )}
        </DropZone>
        
        {/* 画面2プレビュー */}
        <div style={{ marginBottom: '8px', background: '#000', borderRadius: '4px', overflow: 'hidden' }}>
          {currentVideo2 && getCurrentVideoSrc2() ? (
            <div style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {currentVideo2.type === 'video' ? (
                <Video
                  ref={videoRef2}
                  key={currentVideo2.id}
                  src={getCurrentVideoSrc2()}
                  autoPlay={isPlaying2}
                  loop
                  muted
                  controls={false}
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              ) : (
                <Image
                  key={currentVideo2.id}
                  src={getCurrentVideoSrc2()}
                  alt={currentVideo2.name}
                  style={{ 
                    maxHeight: '80px', 
                    maxWidth: '100%', 
                    width: 'auto', 
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>
          ) : (
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px' }}>
              画面2
            </div>
          )}
          
          {/* シークバーと時間表示（高さを一定に保つため常に表示） */}
          <SeekBar onClick={currentVideo2?.type === 'video' ? handleSeekBarClick2 : undefined} style={{ visibility: currentVideo2?.type === 'video' ? 'visible' : 'hidden' }}>
            <SeekProgress progress={duration2 > 0 ? (currentTime2 / duration2) * 100 : 0} />
          </SeekBar>
          <TimeDisplay style={{ fontSize: '12px', textAlign: 'center', visibility: currentVideo2?.type === 'video' ? 'visible' : 'hidden' }}>
            {currentVideo2?.type === 'video' ? `${formatTime(currentTime2)} / ${formatTime(duration2)}` : '\u00A0'}
          </TimeDisplay>
        </div>
        
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {playlist2.map((video, index) => (
            <PlaylistItem
              key={video.id}
              active={index === currentIndex2}
            >
              <PlaylistItemName onClick={() => selectVideo2(index)}>
                {video.type === 'video' ? '🎬' : '📷'} {video.name}
              </PlaylistItemName>
              <DeleteButton 
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromPlaylist2(index);
                }}
              >
                ×
              </DeleteButton>
            </PlaylistItem>
          ))}
        </div>
        
        <Controls>
          <ControlButton onClick={previousVideo2}>前</ControlButton>
          {currentVideo2?.type === 'video' ? (
            <ControlButton onClick={togglePlay2}>
              {isPlaying2 ? '停止' : '再生'}
            </ControlButton>
          ) : (
            <ControlButton disabled style={{ opacity: 0.5 }}>
              画像
            </ControlButton>
          )}
          <ControlButton onClick={nextVideo2}>次</ControlButton>
        </Controls>
      </PlaylistPanel>
      
      {/* ブレンドコントロール */}
      <BlendPanel>
        <MidiStatus>{midiStatus}</MidiStatus>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
          <span>画面1</span>
          <BlendSlider
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={blendRatio}
            disabled={mixDisabled}
            onChange={(e) => {
              if (!mixDisabled) {
                const newValue = parseFloat(e.target.value);
                setBlendRatio(newValue);
              }
            }}
          />
          <span>画面2</span>
        </div>
        <div style={{ minWidth: '80px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: mixDisabled ? '#999' : 'white' }}>
          {mixDisabled ? 'MIX無効' : `${(blendRatio * 100).toFixed(1)}%`}
        </div>
        <div style={{ fontSize: '12px', color: '#888', marginLeft: '10px' }}>
          操作中: プレイリスト{activePlaylist + 1}
        </div>
      </BlendPanel>
    </AppContainer>
  );
}

export default App;