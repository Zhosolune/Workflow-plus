import React, { useState, useRef } from 'react';
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
import useResponsiveLayout from '../../../hooks/useResponsiveLayout';
import SubFooter from '../../layout/SubFooter';
import SubHeader from '../../layout/SubHeader';

const { Content } = Layout;

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

  // 内容区域的引用，用于获取其宽度
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 使用自定义hook处理响应式布局
  const {
    moduleLibraryWidth,
    propertyPanelWidth,
    handleModuleLibraryResize,
    handlePropertyPanelResize
  } = useResponsiveLayout(contentRef);

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

  // 定义顶部操作按钮
  const headerActions = (
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
  );

  return (
    <Layout className="workflow-designer" style={{ height: '100%' }}>
      {/* 顶部操作栏 - 使用SubHeader组件 */}
      <SubHeader
        title="模块化工作流设计器"
        actions={headerActions}
        height="60px"
      />

      {/* 主内容区 */}
      <Content 
        ref={contentRef}
        style={{ 
          position: 'relative', 
          flex: 1,
        }}>
        {/* 画布 */}
        <Canvas
          onNodeSelect={handleNodeSelect}
          updateWorkflowStatus={updateWorkflowStatus}
          moduleLibraryWidth={moduleLibraryWidth} // 新增
          propertyPanelWidth={propertyPanelWidth} // 新增
        />

        {/* 模块库 */}
        <ModuleLibrary 
          width={moduleLibraryWidth}
          onResize={handleModuleLibraryResize}
        />

        {/* 属性面板 */}
        <PropertyPanel 
          selectedNode={selectedNode} 
          width={propertyPanelWidth}
          onResize={handlePropertyPanelResize}
        />
      </Content>

      {/* 底部状态栏 - 使用SubFooter组件 */}
      <SubFooter>
        <StatusBar status={workflowStatus} />
      </SubFooter>
    </Layout>
  );
};

export default WorkflowDesigner;