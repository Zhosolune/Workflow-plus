import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ApiOutlined,
  FolderOutlined,
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;

// 侧边栏菜单项配置
const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/workflow',
    icon: <ApiOutlined />,
    label: '工作流设计',
  },
  {
    key: '/files',
    icon: <FolderOutlined />,
    label: '文件管理',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
  {
    key: '/user',
    icon: <UserOutlined />,
    label: '个人中心',
  },
];

interface SiderProps {
  collapsed: boolean;
  onCollapse: () => void;
}

/**
 * 侧边栏组件
 * 负责导航到不同子页面
 */
const SiderComponent: React.FC<SiderProps> = ({ collapsed, onCollapse }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 处理菜单项点击，导航到对应路由
  const handleMenuClick = (key: string) => {
    navigate(key);
  };
  
  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      trigger={
        collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />
      }
      theme="light"
      width={220}
      style={{
        boxShadow: '2px 0 8px 0 rgba(29,35,41,0.05)',
        zIndex: 10,
      }}
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  );
};

export default SiderComponent; 