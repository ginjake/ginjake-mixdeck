import React from 'react';
import styled from 'styled-components';

const PlaylistContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const PlaylistHeader = styled.div`
  height: 60px;
  background: #333;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  border-bottom: 1px solid #444;
`;

const PlaylistTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  color: #fff;
`;

const AddButton = styled.button`
  background: #007acc;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background: #005a9e;
  }
`;

const PlaylistContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const VideoItem = styled.div`
  padding: 12px 20px;
  border-bottom: 1px solid #444;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.isActive ? '#007acc' : 'transparent'};
  
  &:hover {
    background: ${props => props.isActive ? '#007acc' : '#3a3a3a'};
  }
`;

const VideoInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const VideoName = styled.div`
  font-size: 14px;
  font-weight: ${props => props.isActive ? 'bold' : 'normal'};
  color: ${props => props.isActive ? '#fff' : '#ddd'};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const VideoIndex = styled.div`
  font-size: 12px;
  color: ${props => props.isActive ? '#ccc' : '#888'};
  margin-top: 4px;
`;

const RemoveButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  margin-left: 10px;
  
  &:hover {
    background: #c82333;
  }
`;

const EmptyPlaylist = styled.div`
  padding: 40px 20px;
  text-align: center;
  color: #666;
  font-size: 14px;
`;

const PlaylistStats = styled.div`
  padding: 10px 20px;
  background: #1a1a1a;
  border-top: 1px solid #444;
  font-size: 12px;
  color: #888;
`;

const Playlist = ({ 
  videos, 
  currentVideoIndex, 
  onSelectVideo, 
  onRemoveVideo, 
  onAddVideos 
}) => {
  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectVideo(index);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      onRemoveVideo(videos[index].id);
    }
  };

  return (
    <PlaylistContainer>
      <PlaylistHeader>
        <PlaylistTitle>プレイリスト</PlaylistTitle>
        <AddButton onClick={onAddVideos}>
          + 動画追加
        </AddButton>
      </PlaylistHeader>
      
      <PlaylistContent>
        {videos.length === 0 ? (
          <EmptyPlaylist>
            動画が追加されていません
            <br />
            「+ 動画追加」ボタンをクリックして
            <br />
            動画ファイルを選択してください
          </EmptyPlaylist>
        ) : (
          videos.map((video, index) => (
            <VideoItem
              key={video.id}
              isActive={index === currentVideoIndex}
              onClick={() => onSelectVideo(index)}
              tabIndex={0}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <VideoInfo>
                <VideoName isActive={index === currentVideoIndex}>
                  {video.name}
                </VideoName>
                <VideoIndex isActive={index === currentVideoIndex}>
                  #{index + 1}
                </VideoIndex>
              </VideoInfo>
              <RemoveButton
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveVideo(video.id);
                }}
              >
                削除
              </RemoveButton>
            </VideoItem>
          ))
        )}
      </PlaylistContent>
      
      {videos.length > 0 && (
        <PlaylistStats>
          合計: {videos.length} 個の動画
          {currentVideoIndex >= 0 && currentVideoIndex < videos.length && (
            <span> | 現在: #{currentVideoIndex + 1}</span>
          )}
        </PlaylistStats>
      )}
    </PlaylistContainer>
  );
};

export default Playlist;