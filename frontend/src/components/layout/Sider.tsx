import React, { useState } from 'react';
import { Layout, Menu, Typography, Tooltip, theme } from 'antd';
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
  const { token } = theme.useToken();
  const [tooltipOpen, setTooltipOpen] = useState(false);

  // 处理点击折叠按钮
  const handleCollapseClick = () => {
    setTooltipOpen(false);
    onCollapse();
  }

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
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: `2px 0 8px -3px ${token.colorBorderSecondary}`,
        zIndex: 10,
      }}
    >
      {/* 侧边栏顶部标题和折叠按钮 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: '12px 16px',
          height: '60px',
        }}
      >
        {collapsed ? null : (
          <div style={{
            opacity: 1,
            width: 'auto',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: 'opacity 0.2s cubic-bezier(0.645, 0.045, 0.355, 1), width 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}>
            <Title level={5} style={{ margin: 0 }}>导航菜单</Title>
          </div>
        )}
        <Tooltip 
          placement="right" 
          title={collapsed ? '展开' : '折叠'}
          open={tooltipOpen}
          onOpenChange={setTooltipOpen}
          trigger="hover"
        >
          <div
            className="sider-collapse-button"
            onClick={handleCollapseClick}
            style={{
              cursor: 'pointer',
              fontSize: '16px',
              padding: '14px 18px',
              borderRadius: token.borderRadiusLG,
              transition: `background-color ${token.motionDurationMid}`,
            }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
        </Tooltip>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{
          height: 'calc(100% - 60px)',
          borderRight: 0,
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