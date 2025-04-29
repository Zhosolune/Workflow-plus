import React from 'react';
import { Layout, Menu, Typography } from 'antd';
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
const { Title } = Typography;

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
      trigger={null}
      theme="light"
      width={250}
      collapsedWidth={60}
      style={{
        boxShadow: '2px 0 8px -3px rgba(29,35,41,0.15)',
        zIndex: 10,
      }}
    >
      {/* 侧边栏顶部标题和折叠按钮 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: '12px 16px',
        height: '60px',
      }}>
        <div style={{
          opacity: collapsed ? 0 : 1,
          width: collapsed ? 0 : 'auto',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          transition: 'opacity 0.2s cubic-bezier(0.645, 0.045, 0.355, 1), width 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)',
        }}>
          <Title level={5} style={{ margin: 0 }}>导航菜单</Title>
        </div>
        <div 
          className="sider-collapse-button"
          onClick={onCollapse}
          style={{ 
            cursor: 'pointer',
            fontSize: '20px',
            padding: '12px 16px',
            borderRadius: '10px',
            transition: 'background-color 0.2s',
          }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </div>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
        style={{ 
          height: 'calc(100% - 60px)', 
          borderRight: 0,
          fontSize: '15px',
          transition: 'all 0.2s',
        }}
      />

      {/* 调整菜单项高度和图标大小 */}
      <style>
        {`
          /* 让菜单文字和图标的过渡与侧边栏宽度变化同步 */
          .ant-menu-item, .ant-menu-item-icon, .ant-menu-title-content {
            transition: width 0.2s cubic-bezier(0.645, 0.045, 0.355, 1) !important;
          }

          /* 调整菜单项高度和图标大小 */
          .ant-menu-item {
            height: 50px !important;
            line-height: 50px !important;
          }
          
          .ant-menu-item .anticon {
            font-size: 16px !important;
          }

          /* 为折叠按钮添加 hover 和active 效果 */
          .sider-collapse-button:hover {
            background-color: #efefef!important;
          }

          .sider-collapse-button:active {
            background-color: #efefef!important;
            color: #3F75FB!important;

          }
          
        `}
      </style>
    </Sider>
  );
};

export default SiderComponent; 