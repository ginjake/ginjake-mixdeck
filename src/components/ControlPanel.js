import React from 'react';
import styled from 'styled-components';

const ControlContainer = styled.div`
  height: 80px;
  background: #2a2a2a;
  border-top: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 0 20px;
`;

const ControlButton = styled.button`
  background: ${props => props.active ? '#007acc' : '#555'};
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.active ? '#005a9e' : '#666'};
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const SecondaryButton = styled.button`
  background: #666;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #777;
  }
`;

const ControlSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Divider = styled.div`
  width: 1px;
  height: 40px;
  background: #444;
  margin: 0 10px;
`;

const StatusText = styled.div`
  font-size: 12px;
  color: #aaa;
  text-align: center;
  min-width: 80px;
`;

const ControlPanel = ({ 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious, 
  onAddVideos 
}) => {
  return (
    <ControlContainer>
      <ControlSection>
        <SecondaryButton onClick={onAddVideos}>
          ファイル追加
        </SecondaryButton>
      </ControlSection>
      
      <Divider />
      
      <ControlSection>
        <ControlButton onClick={onPrevious} title="前の動画 (↑)">
          ⏮
        </ControlButton>
        
        <ControlButton 
          onClick={onPlayPause} 
          active={isPlaying}
          title="再生/一時停止 (スペース)"
        >
          {isPlaying ? '⏸' : '▶'}
        </ControlButton>
        
        <ControlButton onClick={onNext} title="次の動画 (↓)">
          ⏭
        </ControlButton>
      </ControlSection>
      
      <Divider />
      
      <ControlSection>
        <StatusText>
          {isPlaying ? '再生中' : '一時停止'}
          <br />
          <small>矢印キー/DDJ400対応</small>
        </StatusText>
      </ControlSection>
    </ControlContainer>
  );
};

export default ControlPanel;