import React, { useRef, useState } from 'react';
import { Layout, Button, Space } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  DragOverlay,
} from '@dnd-kit/core';
import {
  ReactFlowProvider,
  useUpdateNodeInternals, // 导入 useUpdateNodeInternals 钩子
  ReactFlowInstance, // 添加 ReactFlowInstance 类型
} from '@xyflow/react'; 

// 从自定义Hook导入工作流管理和拖拽功能
import { useWorkflowManager } from '../../../features/workflowDesigner/hooks/useWorkflowManager';
import { useWorkflowDragAndDrop } from '../../../features/workflowDesigner/hooks/useWorkflowDragAndDrop';

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
  // 内容区域的引用，用于获取其宽度
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 添加 ReactFlow 实例状态
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // 使用自定义hook处理响应式布局
  const {
    moduleLibraryWidth,
    propertyPanelWidth,
    contentWidth,
    handleModuleLibraryResize,
    handlePropertyPanelResize
  } = useResponsiveLayout(contentRef);
  
  // 使用工作流管理器Hook
  const {
    nodes,
    edges,
    selectedNode,
    workflowStatus,
    nodeIdCounter,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleNodeSelect,
    onNodeDataChange,
    updateWorkflowStatus,
    handleNew,
    handleOpen,
    handleSave,
    handleRun,
    isVariantOrPortChange,
    setNodes,
    setNodeIdCounter,
    setSelectedNode
  } = useWorkflowManager();
  
  // 使用工作流拖拽Hook
  const {
    draggedModule,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    handleModulePreview
  } = useWorkflowDragAndDrop({
    contentRef,
    setNodes,
    nodeIdCounter,
    setNodeIdCounter,
    updateWorkflowStatus,
    setSelectedNode,
    reactFlowInstance // 传递 ReactFlow 实例
  });
  
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

  // 处理 ReactFlow 实例变更
  const handleReactFlowInstanceChange = (instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  };

  return (
    <ReactFlowProvider>
      {/* 创建一个内部组件来处理需要在ReactFlowProvider内部使用的Hooks */}
      <InnerWorkflowDesigner 
        nodes={nodes} 
        selectedNode={selectedNode} 
        isVariantOrPortChange={isVariantOrPortChange}
      />
      <Layout className="workflow-designer" style={{ height: '100%' }}>
        {/* 顶部操作栏 - 使用SubHeader组件 */}
        <SubHeader
          title="模块化工作流设计器"
          actions={headerActions}
          height="60px"
        />

        {/* 主内容区 - 包裹在DndContext中 */}
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <Content 
            ref={contentRef}
            style={{ 
              position: 'relative', 
              flex: 1,
            }}
          >
            {/* 画布 - 传递提升后的状态和回调 */}
            <Canvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeSelect={handleNodeSelect}
              updateWorkflowStatus={updateWorkflowStatus}
              moduleLibraryWidth={moduleLibraryWidth} 
              propertyPanelWidth={propertyPanelWidth} 
              contentWidth={contentWidth}
              onReactFlowInstanceChange={handleReactFlowInstanceChange}
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
              onNodeDataChange={onNodeDataChange}
            />
          </Content>
          {/* 拖拽预览层 */}
          <DragOverlay dropAnimation={null}>
            {draggedModule ? (
              <div
                style={{
                  padding: '8px',
                  margin: '4px 0',
                  background: '#fff',
                  border: '1px solid #e8e8e8',
                  borderRadius: '4px',
                  cursor: 'grabbing',
                  opacity: 0.75,
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  width: 'fit-content',
                }}
              >
                <span style={{ marginRight: '8px', fontSize: '20px' }}>{draggedModule.icon}</span>
                <span>{draggedModule.name}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* 底部状态栏 - 使用SubFooter组件 */}
        <SubFooter>
          <StatusBar status={workflowStatus} />
        </SubFooter>
      </Layout>
    </ReactFlowProvider>
  );
};

/**
 * 内部组件，用于处理需要在ReactFlowProvider内部使用的Hooks
 */
interface InnerWorkflowDesignerProps {
  nodes: Node[];
  selectedNode: { data: CustomNodeData, id: string } | null;
  isVariantOrPortChange: (newNodeData: Partial<CustomNodeData>) => boolean;
}

const InnerWorkflowDesigner: React.FC<InnerWorkflowDesignerProps> = ({ 
  nodes, 
  selectedNode,
  isVariantOrPortChange
}) => {
  // 在ReactFlowProvider内部使用updateNodeInternals钩子
  const updateNodeInternals = useUpdateNodeInternals();
  
  // 监听节点变化，特别是当变体或端口配置变化时
  React.useEffect(() => {
    if (selectedNode) {
      const currentNode = nodes.find(n => n.id === selectedNode.id);
      if (currentNode) {
        const nodeData = currentNode.data as CustomNodeData;
        if (nodeData && isVariantOrPortChange(nodeData)) {
          // 使用setTimeout确保节点数据已更新
          setTimeout(() => updateNodeInternals(selectedNode.id), 0);
        }
      }
    }
  }, [nodes, selectedNode, updateNodeInternals, isVariantOrPortChange]);
  
  // 这个组件不需要渲染任何内容
  return null;
};

// 添加缺少的导入
import { Node } from '@xyflow/react';
import { CustomNodeData } from './CustomNode';

export default WorkflowDesigner;