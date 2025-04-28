import React from 'react';
import { Space, Badge } from 'antd';

interface StatusBarProps {
  status: {
    saved: boolean;
    nodeCount: number;
    edgeCount: number;
  };
}

/**
 * 状态栏组件
 * 显示工作流的当前状态信息
 */
const StatusBar: React.FC<StatusBarProps> = ({ status }) => {
  const { saved, nodeCount, edgeCount } = status;

  return (
    <div className="status-bar" style={{ 
      display: 'flex', 
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%'
    }}>
      {/* 左侧保存状态 */}
      <Space>
        <Badge 
          status={saved ? 'success' : 'processing'} 
          text={saved ? '已保存' : '未保存'} 
        />
      </Space>
      
      {/* 中间部分留空 */}
      <div></div>
      
      {/* 右侧节点和连线信息 */}
      <Space>
        <span>节点: {nodeCount}</span>
        <span style={{ margin: '0 6px' }}>|</span>
        <span>连线: {edgeCount}</span>
      </Space>
    </div>
  );
};

export default StatusBar; 