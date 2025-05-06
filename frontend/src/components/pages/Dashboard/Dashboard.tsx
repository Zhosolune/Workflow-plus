import React from 'react';
import { Card, Row, Col, Layout, Statistic, Space, theme } from 'antd';
import {
  AppstoreOutlined,
  FileOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';

const { Header, Footer, Content } = Layout;

/**
 * 仪表盘页面
 * 显示系统概览信息
 */
const Dashboard: React.FC = () => {
  const { token } = theme.useToken();
  return (
    <Layout className="dashboard-page" style={{ height: '100%' }}>
      {/* 顶部操作栏 */}
      <Header
        style={{
          background: '#fff',
          padding: '0 20px',
          boxShadow: `0 2px 8px -3px ${token.colorBorderSecondary}`,
          height: '60px',
          lineHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: 0,
          flexShrink: 0,  //防止 Header 被压缩
        }}
      >
        <div style={{ fontSize: '18px' }}>
          <span>仪表盘</span>
        </div>
      </Header>

      <Content 
        style={{ 
          padding: '20px', 
          flex: 1,
          overflow: 'auto',
        }}>
        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic
                title="工作流总数"
                value={12}
                prefix={<AppstoreOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic
                title="文件总数"
                value={56}
                prefix={<FileOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic
                title="已完成任务"
                value={28}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card variant="borderless">
              <Statistic
                title="运行中任务"
                value={5}
                prefix={<SyncOutlined spin />}
              />
            </Card>
          </Col>
        </Row>

        {/* 最近活动 */}
        <Row style={{ marginTop: 20, }}>
          <Col span={24}>
            <Card title="最近活动" variant="borderless">
              <p>暂无活动记录</p>
            </Card>
          </Col>
        </Row>
      </Content>

      {/* 底部状态栏 */}
      <Footer 
        style={{ 
          padding: '0 16px', 
          height: '30px', 
          lineHeight: '30px', 
          background: '#f0f2f5', 
          margin: 0,
          fontSize: '14px',
          borderTop: '1px solid #e8e8e8',
          flexShrink: 0
        }}
      >
        {/* 添加一些状态栏内容 */}
        <div style={{ textAlign: 'center' }}>底部状态栏示例</div>
      </Footer>

    </Layout>
  );
};

export default Dashboard;