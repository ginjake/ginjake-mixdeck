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
  border: 1px solid #444;
  overflow-y: auto;
  font-size: 11px;
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
  background: linear-gradient(to right, #ff6b6b, #4CAF50);
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
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
  


  // デバッグ：アプリ起動時の状態確認
  useEffect(() => {
    window.electronAPI.logToConsole('debug', 'STARTUP_DEBUG: App started');
    window.electronAPI.logToConsole('debug', 'STARTUP_DEBUG: electronAPI exists: true');
    window.electronAPI.logToConsole('debug', 'STARTUP_DEBUG: writeInputLog exists: ' + !!window.electronAPI?.writeInputLog);
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
        
        // ブレンド率をrefから取得（リアルタイム反映）
        const currentBlendRatio = blendRatioRef.current;
        
        // 画面1を描画（アルファ値でブレンド）
        if (currentVideo1) {
          try {
            if (currentVideo1.type === 'video' && video1 && !video1.paused && video1.readyState >= 2) {
              ctx.globalAlpha = 1 - currentBlendRatio;
              ctx.drawImage(video1, 0, 0, canvas.width, canvas.height);
            } else if (currentVideo1.type === 'image' && imageCache1.current) {
              ctx.globalAlpha = 1 - currentBlendRatio;
              ctx.drawImage(imageCache1.current, 0, 0, canvas.width, canvas.height);
            }
          } catch (error) {
            console.warn('Video1 draw error:', error);
          }
        }
        
        // 画面2を描画（アルファ値でブレンド）
        if (currentVideo2) {
          try {
            if (currentVideo2.type === 'video' && video2 && !video2.paused && video2.readyState >= 2) {
              ctx.globalAlpha = currentBlendRatio;
              ctx.drawImage(video2, 0, 0, canvas.width, canvas.height);
            } else if (currentVideo2.type === 'image' && imageCache2.current) {
              ctx.globalAlpha = currentBlendRatio;
              ctx.drawImage(imageCache2.current, 0, 0, canvas.width, canvas.height);
            }
          } catch (error) {
            console.warn('Video2 draw error:', error);
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
  }, [currentVideo1, currentVideo2]);

  // 画像1のキャッシュ更新
  useEffect(() => {
    if (currentVideo1 && currentVideo1.type === 'image') {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageCache1.current = img;
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
      img.onload = () => {
        imageCache2.current = img;
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

    // Electron専用：MIDIログ出力
    window.electronAPI.logToConsole('midi-signal', 'MIDI signal received', midiData);

    // クロスフェーダー制御 (Status=0xb6 Data1=0x1f のみ)
    if ((status === 0xb6 || status === '0xb6' || parseInt(status) === 182 || status === 182)) {
      if ((data1 === 0x1f || data1 === '0x1f' || parseInt(data1) === 31 || data1 === 31)) {
        // 更新頻度制限（16ms = 60FPS）
        const now = Date.now();
        if (now - lastMidiUpdateRef.current < 16) {
          return;
        }
        lastMidiUpdateRef.current = now;
        
        // Data2 (0-127) を ブレンド比率 (0-1) に変換
        const normalizedValue = data2 / 127;
        const preciseValue = Math.round(normalizedValue * 1000) / 1000;
        
        setBlendRatio(preciseValue);
        return;
      } else {
        // 他のクロスフェーダー信号はブロック
        window.electronAPI.logToConsole('midi-action', `Other crossfader blocked: Status=${status} Data1=${data1} Data2=${data2} - NO BLEND CONTROL`);
        return;
      }
    }

    // ボタンが押された時のみ処理（data2 > 0）
    if (data2 === 0) {
      window.electronAPI.logToConsole('midi-action', 'Button released - ignoring');
      return;
    }

    window.electronAPI.logToConsole('midi-action', `Processing MIDI control: 0x${data1.toString(16)} (Status: 0x${status.toString(16)})`);

    // StatusとData1の組み合わせでデッキを判定
    const isLeftDeck = status === 0x97;  // Status 0x97 = 左デッキ (プレイリスト1)
    const isRightDeck = status === 0x99; // Status 0x99 = 右デッキ (プレイリスト2)

    if (isLeftDeck) {
      // プレイリスト1（左デッキ 0x97）のコントロール
      switch(data1) {
        case 0x30:
          window.electronAPI.logToConsole('midi-action', 'Left deck: Playlist1 play/pause');
          togglePlay1();
          break;
        case 0x31:
          window.electronAPI.logToConsole('midi-action', 'Left deck: Playlist1 skip +3s');
          skipVideo1(3);
          break;
        case 0x32:
          window.electronAPI.logToConsole('midi-action', 'Left deck: Playlist1 skip +30s');
          skipVideo1(30);
          break;
        case 0x33:
          window.electronAPI.logToConsole('midi-action', 'Left deck: Playlist1 previous video');
          previousVideo1();
          break;
        case 0x35:
          window.electronAPI.logToConsole('midi-action', 'Left deck: Playlist1 skip -3s');
          skipVideo1(-3);
          break;
        case 0x36:
          window.electronAPI.logToConsole('midi-action', 'Left deck: Playlist1 skip -30s');
          skipVideo1(-30);
          break;
        case 0x37:
          window.electronAPI.logToConsole('midi-action', 'Left deck: Playlist1 next video');
          nextVideo1();
          break;
        default:
          window.electronAPI.logToConsole('midi-action', `Left deck unhandled: 0x${data1.toString(16)}`);
          break;
      }
    } else if (isRightDeck) {
      // プレイリスト2（右デッキ 0x99）のコントロール
      switch(data1) {
        case 0x30:
          window.electronAPI.logToConsole('midi-action', 'Right deck: Playlist2 play/pause');
          togglePlay2();
          break;
        case 0x31:
          window.electronAPI.logToConsole('midi-action', 'Right deck: Playlist2 skip +3s');
          skipVideo2(3);
          break;
        case 0x32:
          window.electronAPI.logToConsole('midi-action', 'Right deck: Playlist2 skip +30s');
          skipVideo2(30);
          break;
        case 0x33:
          window.electronAPI.logToConsole('midi-action', 'Right deck: Playlist2 previous video');
          previousVideo2();
          break;
        case 0x35:
          window.electronAPI.logToConsole('midi-action', 'Right deck: Playlist2 skip -3s');
          skipVideo2(-3);
          break;
        case 0x36:
          window.electronAPI.logToConsole('midi-action', 'Right deck: Playlist2 skip -30s');
          skipVideo2(-30);
          break;
        case 0x37:
          window.electronAPI.logToConsole('midi-action', 'Right deck: Playlist2 next video');
          nextVideo2();
          break;
        default:
          window.electronAPI.logToConsole('midi-action', `Right deck unhandled: 0x${data1.toString(16)}`);
          break;
      }
    } else {
      // その他のStatus（クロスフェーダーなど）
      window.electronAPI.logToConsole('midi-action', `Other status: 0x${status.toString(16)}, data1: 0x${data1.toString(16)} (decimal: ${data1})`);
    }
  }, [togglePlay1, skipVideo1, nextVideo1, previousVideo1, togglePlay2, skipVideo2, nextVideo2, previousVideo2]);

  // DDJ400 MIDI対応（Electron対応強化）
  useEffect(() => {
    let midiAccess = null;

    const initMIDI = async () => {
      try {
        window.electronAPI.logToConsole('midi-init', 'MIDI support check started', {
          navigatorExists: !!navigator,
          requestMIDIAccessExists: !!navigator.requestMIDIAccess,
          electronEnvironment: true
        });
        
        setMidiStatus('MIDI初期化中...');
        
        if (!navigator.requestMIDIAccess) {
          window.electronAPI.logToConsole('error', 'Web MIDI API not supported');
          setMidiStatus('❌ MIDI未対応');
          return;
        }

        window.electronAPI.logToConsole('midi-init', 'Requesting MIDI access...');
        setMidiStatus('MIDI接続中...');
        
        midiAccess = await navigator.requestMIDIAccess();
        
        window.electronAPI.logToConsole('midi-init', 'MIDI access acquired successfully', {
          inputCount: midiAccess.inputs.size
        });

        let connectedDevices = 0;
        
        for (let input of midiAccess.inputs.values()) {
          const deviceInfo = {
            name: input.name,
            id: input.id,
            manufacturer: input.manufacturer,
            state: input.state,
            connection: input.connection
          };
          
          window.electronAPI.logToConsole('midi-init', 'MIDI input device found', deviceInfo);
          
          // すべてのMIDI入力デバイスに接続（DDJ400を見逃さないため）
          input.onmidimessage = handleMIDIMessage;
          connectedDevices++;
          
          window.electronAPI.logToConsole('midi-init', `Connected to MIDI device: ${input.name || 'Unknown Device'}`);
        }

        if (connectedDevices === 0) {
          window.electronAPI.logToConsole('error', 'No MIDI devices found', {
            checkList: [
              'DDJ400 is connected via USB',
              'DDJ400 drivers are installed',
              'DDJ400 is powered on'
            ]
          });
          setMidiStatus('❌ MIDIデバイス未接続');
        } else {
          window.electronAPI.logToConsole('midi-init', `MIDI connection complete - connected to ${connectedDevices} device(s)`);
          setMidiStatus(`✅ MIDI接続済み (${connectedDevices}台)`);
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
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              )}
            </div>
          ) : (
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px' }}>
              画面1
            </div>
          )}
          
          {currentVideo1?.type === 'video' && (
            <>
              <SeekBar onClick={handleSeekBarClick1}>
                <SeekProgress progress={duration1 > 0 ? (currentTime1 / duration1) * 100 : 0} />
              </SeekBar>
              <TimeDisplay style={{ fontSize: '12px', textAlign: 'center' }}>
                {formatTime(currentTime1)} / {formatTime(duration1)}
              </TimeDisplay>
            </>
          )}
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
              画像表示中
            </ControlButton>
          )}
          <ControlButton onClick={nextVideo1}>次</ControlButton>
        </Controls>
      </PlaylistPanel>
      
      {/* プレイリスト2パネル */}
      <PlaylistPanel
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
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              )}
            </div>
          ) : (
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '12px' }}>
              画面2
            </div>
          )}
          
          {currentVideo2?.type === 'video' && (
            <>
              <SeekBar onClick={handleSeekBarClick2}>
                <SeekProgress progress={duration2 > 0 ? (currentTime2 / duration2) * 100 : 0} />
              </SeekBar>
              <TimeDisplay style={{ fontSize: '12px', textAlign: 'center' }}>
                {formatTime(currentTime2)} / {formatTime(duration2)}
              </TimeDisplay>
            </>
          )}
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
              画像表示中
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
            onChange={(e) => {
              const newValue = parseFloat(e.target.value);
              setBlendRatio(newValue);
            }}
          />
          <span>画面2</span>
        </div>
        <div style={{ minWidth: '80px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
          {(blendRatio * 100).toFixed(1)}%
        </div>
      </BlendPanel>
    </AppContainer>
  );
}

export default App;