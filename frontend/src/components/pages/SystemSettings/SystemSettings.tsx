import React from 'react';
import { Tabs, Form, Input, Switch, Select, Button, Card, message } from 'antd';
import type { TabsProps } from 'antd';

const { Option } = Select;

/**
 * 系统设置页面
 * 管理系统各项设置
 */
const SystemSettings: React.FC = () => {
  // 保存基本设置
  const handleSaveBasicSettings = (values: any) => {
    console.log('基本设置:', values);
    message.success('基本设置保存成功');
  };

  // 保存安全设置
  const handleSaveSecuritySettings = (values: any) => {
    console.log('安全设置:', values);
    message.success('安全设置保存成功');
  };

  // 保存高级设置
  const handleSaveAdvancedSettings = (values: any) => {
    console.log('高级设置:', values);
    message.success('高级设置保存成功');
  };

  // 标签页配置
  const items: TabsProps['items'] = [
    {
      key: '1',
      label: '基本设置',
      children: (
        <Card variant="borderless">
          <Form layout="vertical" onFinish={handleSaveBasicSettings} initialValues={{
            systemName: '工作流平台',
            language: 'zh-CN',
            theme: 'light',
            autoSave: true,
          }}>
            <Form.Item label="系统名称" name="systemName" rules={[{ required: true }]}>
              <Input placeholder="请输入系统名称" />
            </Form.Item>
            <Form.Item label="默认语言" name="language">
              <Select>
                <Option value="zh-CN">简体中文</Option>
                <Option value="en-US">English</Option>
              </Select>
            </Form.Item>
            <Form.Item label="界面主题" name="theme">
              <Select>
                <Option value="light">浅色</Option>
                <Option value="dark">深色</Option>
                <Option value="system">跟随系统</Option>
              </Select>
            </Form.Item>
            <Form.Item label="自动保存" name="autoSave" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">保存设置</Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '2',
      label: '安全设置',
      children: (
        <Card variant="borderless">
          <Form layout="vertical" onFinish={handleSaveSecuritySettings} initialValues={{
            passwordExpiration: 30,
            twoFactorAuth: false,
          }}>
            <Form.Item label="密码过期时间(天)" name="passwordExpiration">
              <Select>
                <Option value={30}>30天</Option>
                <Option value={60}>60天</Option>
                <Option value={90}>90天</Option>
                <Option value={-1}>永不过期</Option>
              </Select>
            </Form.Item>
            <Form.Item label="双因素认证" name="twoFactorAuth" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">保存设置</Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '3',
      label: '高级设置',
      children: (
        <Card variant="borderless">
          <Form layout="vertical" onFinish={handleSaveAdvancedSettings} initialValues={{
            maxFileSize: 50,
            concurrentTasks: 5,
          }}>
            <Form.Item label="最大文件大小(MB)" name="maxFileSize">
              <Select>
                <Option value={10}>10MB</Option>
                <Option value={50}>50MB</Option>
                <Option value={100}>100MB</Option>
                <Option value={200}>200MB</Option>
              </Select>
            </Form.Item>
            <Form.Item label="并发任务数" name="concurrentTasks">
              <Select>
                <Option value={1}>1</Option>
                <Option value={3}>3</Option>
                <Option value={5}>5</Option>
                <Option value={10}>10</Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">保存设置</Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ];

  return (
    <div className="system-settings-page">
      <h2>系统设置</h2>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

export default SystemSettings; 