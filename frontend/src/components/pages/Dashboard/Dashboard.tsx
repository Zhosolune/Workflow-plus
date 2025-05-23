import React from 'react';
import { Card, Row, Col, Layout, Statistic, theme } from 'antd';
import {
  AppstoreOutlined,
  FileOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import SubHeader from '../../layout/SubHeader';
import SubFooter from '../../layout/SubFooter';

const {  Content } = Layout;

/**
 * 仪表盘页面
 * 显示系统概览信息
 */
const Dashboard: React.FC = () => {
  return (
    <Layout className="dashboard-page" style={{ height: '100%' }}>
      {/* 顶部操作栏 */}
      <SubHeader title="仪表盘">
      </SubHeader>

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
            <Card title="最近活动" variant="borderless" style={{ marginBottom: 20 }}>
              <p>暂无活动记录</p>
            </Card>
            <Card title="最近活动" variant="borderless" style={{ marginBottom: 20 }}>
              <p>暂无活动记录</p>
            </Card>
            <Card title="最近活动" variant="borderless" style={{ marginBottom: 20 }}>
              <p>暂无活动记录</p>
            </Card>
            <Card title="最近活动" variant="borderless" style={{ marginBottom: 20 }}>
              <p>暂无活动记录</p>
            </Card>
            <Card title="最近活动" variant="borderless" style={{ marginBottom: 20 }}>
              <p>暂无活动记录</p>
            </Card>
            <Card title="最近活动" variant="borderless" style={{ marginBottom: 20 }}>
              <p>暂无活动记录</p>
            </Card>
            <Card title="最近活动" variant="borderless" style={{ marginBottom: 20 }}>
              <p>暂无活动记录</p>
            </Card>
            <Card title="最近活动" variant="borderless" style={{ marginBottom: 20 }}>
              <p>暂无活动记录</p>
            </Card>
            <Card title="最近活动" variant="borderless" style={{ marginBottom: 20 }}>
              <p>暂无活动记录</p>
            </Card>
            <Card title="最近活动" variant="borderless" style={{ marginBottom: 20 }}>
              <p>暂无活动记录</p>
            </Card>
          </Col>
        </Row>
      </Content>

      {/* 底部状态栏 */}
      <SubFooter>
        {/* 添加一些状态栏内容 */}
        <div style={{ textAlign: 'center' }}>底部状态栏示例</div>
      </SubFooter>

    </Layout>
  );
};

export default Dashboard;