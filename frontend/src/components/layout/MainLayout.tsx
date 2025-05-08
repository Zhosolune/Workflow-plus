import React, { useState } from 'react';
import { Layout, ConfigProvider, theme, Flex } from 'antd';
import { Outlet } from 'react-router-dom';
import HeaderComponent from './Header';
import SiderComponent from './Sider';

const { Content } = Layout;
const { defaultAlgorithm, darkAlgorithm } = theme;

/**
 * 主布局组件
 * 包含顶部栏、侧边栏和内容区
 */
const MainLayout: React.FC = () => {
  // 侧边栏折叠状态
  const [_collapsed, setCollapsed] = useState(false);
  // 当前主题状态 ('light' 或 'dark')
  const [_currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // 切换侧边栏折叠状态
  const toggleCollapsed = () => {
    setCollapsed(prev => !prev);
  };

  // 切换主题
  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: _currentTheme === 'light' ? defaultAlgorithm : darkAlgorithm,
        // 可以在这里添加其他全局主题配置，例如主色调
        // token: {
        //   colorPrimary: '#somecolor',
        // },
      }}
    >
      <Layout style={{ 
        height: '100vh', 
        width: '100vw', 
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* 顶部栏，传递当前主题和切换函数 */}
        <HeaderComponent currentTheme={_currentTheme} toggleTheme={toggleTheme} />
        
        <Layout style={{
          flex: 1,
          overflow: 'hidden'
        }}>
          {/* 侧边栏 */}
          <SiderComponent collapsed={_collapsed} onCollapse={toggleCollapsed} />
          
          {/* 内容区 */}
          <Content style={{ 
            flex: 1,
            minHeight: 0 // 确保内容区可以正确滚动
          }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout; 