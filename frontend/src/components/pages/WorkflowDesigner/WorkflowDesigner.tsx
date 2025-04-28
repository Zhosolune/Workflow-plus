import React, { useState } from 'react';
import { Layout, Button, Space } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import ModuleLibrary from './ModuleLibrary';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import StatusBar from './StatusBar';

const { Header, Footer, Content } = Layout;

/**
 * 工作流设计器页面
 * 包含顶部操作栏、模块库、画布和属性面板
 */
const WorkflowDesigner: React.FC = () => {
  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  // 工作流状态
  const [workflowStatus, setWorkflowStatus] = useState({
    saved: true,
    nodeCount: 0,
    edgeCount: 0,
  });

  // 处理节点选择
  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
  };

  // 处理新建工作流
  const handleNew = () => {
    // 清空当前画布
    setWorkflowStatus({
      saved: true,
      nodeCount: 0,
      edgeCount: 0,
    });
    setSelectedNode(null);
  };

  // 处理打开工作流
  const handleOpen = () => {
    // 模拟打开工作流
    console.log('打开工作流');
  };

  // 处理保存工作流
  const handleSave = () => {
    // 模拟保存工作流
    console.log('保存工作流');
    setWorkflowStatus({
      ...workflowStatus,
      saved: true,
    });
  };

  // 处理运行工作流
  const handleRun = () => {
    // 模拟运行工作流
    console.log('运行工作流');
  };

  // 更新工作流状态
  const updateWorkflowStatus = (status: Partial<typeof workflowStatus>) => {
    setWorkflowStatus({ ...workflowStatus, ...status });
  };

  return (
    <Layout className="workflow-designer" style={{ height: '100%' }}>
      {/* 顶部操作栏 */}
      <Header
        style={{
          background: '#fff',
          padding: '0 16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: '48px',
          lineHeight: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: 0,
        }}
      >
        <div>
          <h2>模块化工作流设计器</h2>
        </div>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleNew}
          >
            新建
          </Button>
          <Button icon={<FolderOpenOutlined />} onClick={handleOpen}>
            打开
          </Button>
          <Button icon={<SaveOutlined />} onClick={handleSave}>
            保存
          </Button>
          <Button 
            type="primary" 
            icon={<PlayCircleOutlined />} 
            onClick={handleRun}
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
          >
            运行
          </Button>
        </Space>
      </Header>

      {/* 主内容区 */}
      <Content style={{ position: 'relative', height: 'calc(100% - 48px - 30px)' }}>
        {/* 画布 */}
        <Canvas
          onNodeSelect={handleNodeSelect}
          updateWorkflowStatus={updateWorkflowStatus}
        />

        {/* 模块库 */}
        <ModuleLibrary />

        {/* 属性面板 */}
        <PropertyPanel selectedNode={selectedNode} />
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
          borderTop: '1px solid #e8e8e8'
        }}
      >
        <StatusBar status={workflowStatus} />
      </Footer>
    </Layout>
  );
};

export default WorkflowDesigner; 