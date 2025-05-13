import React from 'react';
import { Tabs, Form, Input, Button, Upload, Avatar, Card, Descriptions, message, Layout } from 'antd';
import { UserOutlined, UploadOutlined, LockOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';
import SubHeader from '../../layout/SubHeader';
import SubFooter from '../../layout/SubFooter';

const { Content } = Layout;

/**
 * 个人中心页面
 * 用户个人资料和账号设置
 */
const UserCenter: React.FC = () => {
  // 更新个人资料
  const handleUpdateProfile = (values: any) => {
    console.log('个人资料:', values);
    message.success('个人资料更新成功');
  };

  // 修改密码
  const handleChangePassword = (values: any) => {
    console.log('密码修改:', values);
    message.success('密码修改成功');
  };

  // 标签页配置
  const items: TabsProps['items'] = [
    {
      key: '1',
      label: '基本资料',
      children: (
        <Card variant="borderless">
          <div style={{ display: 'flex', marginBottom: 20 }}>
            <Avatar size={64} icon={<UserOutlined />} />
            <div style={{ marginLeft: 20 }}>
              <h3>管理员</h3>
              <p>admin@example.com</p>
              <Upload showUploadList={false}>
                <Button icon={<UploadOutlined />}>更换头像</Button>
              </Upload>
            </div>
          </div>
          
          <Form layout="vertical" onFinish={handleUpdateProfile} initialValues={{
            name: '管理员',
            email: 'admin@example.com',
            phone: '13800138000',
            department: '技术部',
          }}>
            <Form.Item label="姓名" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="邮箱" name="email" rules={[
              { required: true },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}>
              <Input />
            </Form.Item>
            <Form.Item label="手机号" name="phone">
              <Input />
            </Form.Item>
            <Form.Item label="部门" name="department">
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">保存修改</Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '2',
      label: '账号安全',
      children: (
        <Card variant="borderless">
          <Form layout="vertical" onFinish={handleChangePassword}>
            <Form.Item
              label="当前密码"
              name="currentPassword"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 8, message: '密码长度不能少于8个字符' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">修改密码</Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '3',
      label: '账号信息',
      children: (
        <Card variant="borderless">
          <Descriptions title="账号详情" bordered>
            <Descriptions.Item label="账号ID">admin001</Descriptions.Item>
            <Descriptions.Item label="注册时间">2023-01-01</Descriptions.Item>
            <Descriptions.Item label="最后登录">2023-07-15 13:30:45</Descriptions.Item>
            <Descriptions.Item label="账号级别">管理员</Descriptions.Item>
            <Descriptions.Item label="授权应用" span={2}>工作流平台</Descriptions.Item>
            <Descriptions.Item label="账号状态">正常</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
  ];

  return (
    <Layout className="user-center-page" style={{ height: '100%' }}>

      <SubHeader title="个人中心"></SubHeader>

      <Content 
        style={{ 
          padding: '20px', 
          flex: 1,
          overflow: 'auto',
        }}>
        <Tabs defaultActiveKey="1" items={items} />
      </Content>
      
      <SubFooter>
        {/* 添加一些状态栏内容 */}
        <div style={{ textAlign: 'center' }}>底部状态栏示例</div>
      </SubFooter>
    </Layout>
  );
};

export default UserCenter; 