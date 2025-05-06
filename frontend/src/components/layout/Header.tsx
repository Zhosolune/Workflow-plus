import React from 'react';
import { Layout, Button, Flex, Space, Dropdown, theme, Avatar } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined,
  ProductOutlined,
} from '@ant-design/icons';

const { Header } = Layout;

interface HeaderProps {
  currentTheme: 'light' | 'dark';
  toggleTheme: () => void;
}

/**
 * 顶部栏组件
 * 包含全局图标按钮，如软件名，用户头像，主题切换，语言，通知，提示等
 */
const HeaderComponent: React.FC<HeaderProps> = ({ currentTheme, toggleTheme }) => {
  const { token } = theme.useToken();

  const iconStyle = { fontSize: '18px' };

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
        // boxShadow: `0 1px 0 0 ${token.colorBorderSecondary}`,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: '0 20px',
        height: '64px',
        lineHeight: '64px',
        flexShrink: 0
      }}
    >
      <Flex align='center' justify='space-between'>
        {/* 左侧logo和标题 */}
        <Space.Compact size={'large'}>
          <ProductOutlined style={{ fontSize: '30px', color: '#3F75FB', paddingRight: '10px'}}/>
          <h1 style={{ margin: 0, fontSize: '20px' }}>工作流平台</h1>
        </Space.Compact>

        {/* 右侧功能按钮 */}
        <Space size="large">
          {/* 主题切换 */}
          <Button
            type="text"
            icon={currentTheme === 'light' 
              ? <MoonOutlined style={iconStyle} /> 
              : <SunOutlined style={iconStyle} />
            }
            onClick={toggleTheme} // 点击时调用切换主题函数
          />

          {/* 语言切换 */}
          <Button type="text" icon={<GlobalOutlined style={iconStyle} />} />

          {/* 帮助 */}
          <Button type="text" icon={<QuestionCircleOutlined style={iconStyle} />} />

          {/* 通知 */}
          <Button type="text" icon={<BellOutlined style={iconStyle} />} />

          {/* 设置 */}
          <Button type="text" icon={<SettingOutlined style={iconStyle} />} />

          {/* 用户头像 */}
          <Dropdown menu={{ items: userMenuItems }}>
            <Avatar 
              icon={<UserOutlined style={iconStyle} />} 
              style={{ 
                cursor: 'pointer', 
                display: 'flex' }} />
          </Dropdown>
        </Space>

      </Flex>

    </Header>
  );
};

export default HeaderComponent; 