import React from 'react';
import { Layout, Button, Space, Dropdown, theme, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
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
        borderBottom: '1px solid #f0f0f0',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        /*boxShadow: '0 1px 4px rgba(0,21,41,.08)',*/
      }}
    >
      {/* 左侧logo和标题 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>工作流平台</h1>
      </div>

      {/* 右侧功能按钮 */}
      <Space size="large">
        {/* 主题切换 */}
        <Button type="text" icon={<SunOutlined style={{ fontSize: '18px' }} />} style={{ fontSize: '18px' }}  onClick={() => {
          
        }}/>

        {/* 语言切换 */}
        <Button type="text" icon={<GlobalOutlined style={{ fontSize: '18px' }} />} style={{ fontSize: '18px' }} />
        
        {/* 帮助 */}
        <Button type="text" icon={<QuestionCircleOutlined style={{ fontSize: '18px' }} />} style={{ fontSize: '18px' }} />
        
        {/* 通知 */}
        <Button type="text" icon={<BellOutlined style={{ fontSize: '18px' }} />} style={{ fontSize: '18px' }} />
        
        {/* 设置 */}
        <Button type="text" icon={<SettingOutlined style={{ fontSize: '18px' }} />} style={{ fontSize: '18px' }} />
        
        {/* 用户头像 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Avatar icon={<UserOutlined style={{ fontSize: '18px' }} />} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
        </Dropdown>
      </Space>
    </Header>
  );
};

export default HeaderComponent; 