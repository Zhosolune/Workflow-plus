import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  AppstoreOutlined,
  FileOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';

/**
 * 仪表盘页面
 * 显示系统概览信息
 */
const Dashboard: React.FC = () => {
  return (
    <div className="dashboard-page">
      <h2>仪表盘</h2>
      
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
      <Row style={{ marginTop: 20 }}>
        <Col span={24}>
          <Card title="最近活动" variant="borderless">
            <p>暂无活动记录</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;