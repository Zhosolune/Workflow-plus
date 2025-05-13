import React from 'react';
import { Layout, theme, Space } from 'antd';

const { Header } = Layout;

interface SubHeaderProps {
  /**
   * 头部栏的高度
   */
  height?: string | number;
  
  /**
   * 头部栏的内边距
   */
  padding?: string;
  
  /**
   * 头部栏的标题
   */
  title?: React.ReactNode;
  
  /**
   * 头部栏右侧的操作区域
   */
  actions?: React.ReactNode;
  
  /**
   * 头部栏的样式
   */
  style?: React.CSSProperties;
}

/**
 * 自适应主题的子界面Header组件
 * 在亮色/暗色主题下自动使用对应的颜色
 */
const SubHeader: React.FC<SubHeaderProps> = ({
  height = '60px',
  padding = '0 20px',
  title,
  actions,
  style = {},
}) => {
  const { token } = theme.useToken();

  return (
    <Header
      style={{
        background: token.colorBgContainer,
        padding,
        boxShadow: `0 2px 8px -3px ${token.colorBorderSecondary}`,
        height,
        lineHeight: typeof height === 'number' ? `${height}px` : height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: 0,
        flexShrink: 0,
        ...style
      }}
    >
      <div style={{ fontSize: '18px' }}>
        {title}
      </div>
      {actions && (
        <Space>
          {actions}
        </Space>
      )}
    </Header>
  );
};

export default SubHeader; 