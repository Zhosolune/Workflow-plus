import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import HeaderComponent from './Header';
import SiderComponent from './Sider';

const { Content } = Layout;

/**
 * 主布局组件
 * 包含顶部栏、侧边栏和内容区
 */
const MainLayout: React.FC = () => {
  // 侧边栏折叠状态
  const [collapsed, setCollapsed] = useState(false);

  // 切换侧边栏折叠状态
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Layout style={{ height: '100vh' }}>
      {/* 顶部栏 */}
      <HeaderComponent />
      
      <Layout>
        {/* 侧边栏 */}
        <SiderComponent collapsed={collapsed} onCollapse={toggleCollapsed} />
        
        {/* 内容区 */}
        <Content style={{ padding: '0px', overflow: 'hidden' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 