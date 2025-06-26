import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import styled from 'styled-components';

const VideoContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #000;
  position: relative;
`;

const Video = styled.video`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const NoVideoMessage = styled.div`
  color: #666;
  font-size: 18px;
  text-align: center;
`;

const VideoInfo = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 5px;
  color: white;
  font-size: 14px;
`;

const SeekBar = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const SeekBarProgress = styled.div`
  height: 100%;
  background: #ff6b6b;
  border-radius: 3px;
  width: ${props => props.progress}%;
  transition: width 0.1s ease;
`;

const SeekBarBuffer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 3px;
  width: ${props => props.buffered}%;
`;

const TimeDisplay = styled.div`
  position: absolute;
  bottom: 30px;
  right: 20px;
  color: white;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 3px;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const VideoPlayer = forwardRef(({ 
  video, 
  isPlaying, 
  onPlayPause, 
  onSeekForward, 
  onSeekBackward, 
  onSeekToStart 
}, ref) => {
  const videoRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);

  useImperativeHandle(ref, () => ({
    seekForward: () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.min(
          videoRef.current.currentTime + 10,
          videoRef.current.duration
        );
      }
    },
    seekBackward: () => {
      if (videoRef.current) {
        videoRef.current.currentTime = Math.max(
          videoRef.current.currentTime - 10,
          0
        );
      }
    },
    seekToStart: () => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
      }
    }
  }));

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (videoRef.current && video) {
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [video]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const updateBuffered = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        setBuffered((bufferedEnd / video.duration) * 100);
      }
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('progress', updateBuffered);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('progress', updateBuffered);
    };
  }, [video]);

  const handleVideoClick = () => {
    onPlayPause();
  };

  const handleSeekBarClick = (e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const clickTime = (clickX / width) * duration;
    videoRef.current.currentTime = clickTime;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleKeyDown = (e) => {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        onPlayPause();
        break;
      case 'Home':
        e.preventDefault();
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
        }
        break;
      default:
        break;
    }
  };

  if (!video) {
    return (
      <VideoContainer>
        <NoVideoMessage>
          動画を選択してください
          <br />
          右側のプレイリストから動画を追加できます
        </NoVideoMessage>
      </VideoContainer>
    );
  }

  return (
    <VideoContainer 
      onClick={handleVideoClick} 
      tabIndex={0} 
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Video
        ref={videoRef}
        controls={false}
        loop
        muted
      >
        <source src={`file://${video.path}`} />
        お使いのブラウザは動画再生をサポートしていません。
      </Video>
      <SeekBar visible={isHovering} onClick={handleSeekBarClick}>
        <SeekBarBuffer buffered={buffered} />
        <SeekBarProgress progress={progress} />
      </SeekBar>
      <TimeDisplay visible={isHovering}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </TimeDisplay>
    </VideoContainer>
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;