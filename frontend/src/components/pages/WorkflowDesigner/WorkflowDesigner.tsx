import React, { useState, useRef, useCallback } from 'react'; // Added useCallback
import { Layout, Button, Space } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { DndContext, DragEndEvent } from '@dnd-kit/core'; // Added
import {
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  Position,
  OnConnect,
} from '@xyflow/react'; // Added for types and hooks

import ModuleLibrary from './ModuleLibrary';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import StatusBar from './StatusBar';
import useResponsiveLayout from '../../../hooks/useResponsiveLayout';
import SubFooter from '../../layout/SubFooter';
import SubHeader from '../../layout/SubHeader';

const { Content } = Layout;

// 默认节点和边数据 (如果之前在Canvas中，现在移到这里或保持全局)
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

/**
 * 工作流设计器页面
 * 包含顶部操作栏、模块库、画布和属性面板
 */
const WorkflowDesigner: React.FC = () => {
  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  // 工作流状态 (已存在)
  const [workflowStatus, setWorkflowStatus] = useState({
    saved: true,
    nodeCount: 0,
    edgeCount: 0,
  });

  // 内容区域的引用，用于获取其宽度 (已存在)
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 使用自定义hook处理响应式布局 (已存在)
  const {
    moduleLibraryWidth,
    propertyPanelWidth,
    contentWidth,
    handleModuleLibraryResize,
    handlePropertyPanelResize
  } = useResponsiveLayout(contentRef);

  // --- State lifted from Canvas.tsx ---
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  // --- End of lifted state ---

  /**
   * 处理节点选择
   * @param node - 被选中的节点数据
   */
  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
  };

  /**
   * 更新工作流状态
   * @param status - 部分工作流状态
   */
  const updateWorkflowStatus = useCallback((status: Partial<typeof workflowStatus>) => {
    setWorkflowStatus(prevStatus => ({ ...prevStatus, ...status }));
  }, []);


  /**
   * 处理画布上的节点连接
   * @param connection - 连接对象
   */
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge({ ...connection, type: 'smoothstep', animated: true }, eds);
        updateWorkflowStatus({ edgeCount: newEdges.length, saved: false });
        return newEdges;
      });
    },
    [setEdges, updateWorkflowStatus]
  );

  /**
   * 处理从模块库拖拽到画布的操作
   * @param event - 拖拽结束事件对象
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && over.id === 'canvas-drop-area') {
        if (!active || !active.data || !active.data.current) return;

        const moduleData = active.data.current as any; // 类型断言，根据实际模块数据类型调整

        const canvasElement = contentRef.current?.querySelector('.react-flow');
        const translatedRect = active.rect.current.translated;

        if (!canvasElement || !translatedRect) return;

        const canvasRect = canvasElement.getBoundingClientRect();
        
        // 计算节点在画布中的位置
        // 使用拖拽结束时活动元素转换后的坐标，并相对于画布进行调整
        const position = {
          x: translatedRect.left - canvasRect.left + (canvasElement.scrollLeft || 0),
          y: translatedRect.top - canvasRect.top + (canvasElement.scrollTop || 0),
        };

        // 创建新节点，使用自定义节点类型
        const newNode: Node = {
          id: `node-${nodeIdCounter}`,
          type: 'customNode', // 使用自定义节点类型
          position,
          data: {
            ...moduleData,
            label: moduleData.name,
          },
        };

        setNodes((nds) => {
          const newNodes = [...nds, newNode];
          updateWorkflowStatus({ nodeCount: newNodes.length, saved: false });
          return newNodes;
        });
        setNodeIdCounter((prev) => prev + 1);
      }
    },
    [nodeIdCounter, setNodes, setNodeIdCounter, updateWorkflowStatus, contentRef]
  );

  // 处理新建工作流 (已存在)
  const handleNew = () => {
    setNodes(initialNodes); // 清空节点
    setEdges(initialEdges); // 清空边
    setNodeIdCounter(1);    // 重置ID计数器
    setWorkflowStatus({
      saved: true,
      nodeCount: 0,
      edgeCount: 0,
    });
    setSelectedNode(null);
  };

  // 处理打开工作流 (已存在)
  const handleOpen = () => {
    console.log('打开工作流');
  };

  // 处理保存工作流 (已存在)
  const handleSave = () => {
    console.log('保存工作流');
    setWorkflowStatus(prev => ({
      ...prev,
      saved: true,
    }));
  };

  // 处理运行工作流 (已存在)
  const handleRun = () => {
    console.log('运行工作流');
  };
  
  // 定义顶部操作按钮 (已存在)
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

      {/* 主内容区 - 包裹在DndContext中 */}
      <DndContext onDragEnd={handleDragEnd}>
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
      </DndContext>

      {/* 底部状态栏 - 使用SubFooter组件 */}
      <SubFooter>
        <StatusBar status={workflowStatus} />
      </SubFooter>
    </Layout>
  );
};

export default WorkflowDesigner;