import React from 'react';
import { Layout, Button, Space, Dropdown, theme, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
  SettingOutlined,
} from '@ant-design/icons';

const { Header } = Layout;

/**
 * 顶部栏组件
 * 包含全局图标按钮，如软件名，用户头像，主题切换，语言，通知，提示等
 */
const HeaderComponent: React.FC = () => {
  const { token } = theme.useToken();

  // 用户下拉菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人中心',
    },
    {
      key: 'settings',
      label: '账户设置',
    },
    {
      key: 'logout',
      label: '退出登录',
    },
  ];

  return (
    <Header
      style={{
        background: token.colorBgContainer,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
      }}
    >
      {/* 左侧logo和标题 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '18px' }}>工作流平台</h1>
      </div>

      {/* 右侧功能按钮 */}
      <Space size="middle">
        {/* 语言切换 */}
        <Button type="text" icon={<GlobalOutlined />} />
        
        {/* 帮助 */}
        <Button type="text" icon={<QuestionCircleOutlined />} />
        
        {/* 通知 */}
        <Button type="text" icon={<BellOutlined />} />
        
        {/* 设置 */}
        <Button type="text" icon={<SettingOutlined />} />
        
        {/* 用户头像 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Avatar icon={<UserOutlined />} style={{ cursor: 'pointer' }} />
        </Dropdown>
      </Space>
    </Header>
  );
};

export default HeaderComponent; 