import React, { useState, useCallback, useEffect, useMemo } from 'react'; //确保 useState 和 useEffect 已导入
import {
  ReactFlow,
  BackgroundVariant,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
  OnConnect,
  ConnectionLineType,
  Position,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { DndContext } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';

// 默认节点数据
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

// 自定义节点类型 - 移到组件外部
const nodeTypesProp: NodeTypes = {};

// 画布属性接口
interface CanvasProps {
  onNodeSelect: (node: any) => void;
  updateWorkflowStatus: (status: any) => void;
  moduleLibraryWidth: number; 
  propertyPanelWidth: number; 
  contentWidth: number; // 新增：接收 contentWidth
}

/**
 * 工作流画布组件
 * 使用React Flow实现节点拖拽和连接
 */
const Canvas: React.FC<CanvasProps> = ({ 
  onNodeSelect, 
  updateWorkflowStatus,
  moduleLibraryWidth,    
  propertyPanelWidth,    
  contentWidth          // 新增
}) => {
  // 节点和连线状态管理
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // 节点计数器（用于生成唯一ID）
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  
  // 新增：控制 Controls 和 MiniMap 的显示状态
  const [showUiElements, setShowUiElements] = useState(true);

  // 使用useMemo缓存nodeTypes
  const nodeTypes = useMemo(() => nodeTypesProp, []);
  
  // 处理节点连接
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // 创建新连线
      setEdges((eds: Edge[]) => addEdge({
        ...connection,
        type: 'smoothstep',
        animated: true,
      }, eds));
      
      // 更新状态
      updateWorkflowStatus({ saved: false });
    },
    [setEdges, updateWorkflowStatus]
  );
  
  // 处理节点选择
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node.data);
    },
    [onNodeSelect]
  );
  
  // 监听节点和连线数量变化，更新状态
  // 修复：仅在节点或连线数量变化时更新状态，避免无限循环
  useEffect(() => {
    // 只有当节点或连线数量大于0时才更新状态
    if (nodes.length > 0 || edges.length > 0) {
      updateWorkflowStatus({
        nodeCount: nodes.length,
        edgeCount: edges.length,
        saved: false,
      });
    }
  }, [nodes.length, edges.length, updateWorkflowStatus]);

  // 新增：根据可用空间判断是否显示 Controls 和 MiniMap
  useEffect(() => {
    if (contentWidth > 0 && moduleLibraryWidth > 0 && propertyPanelWidth > 0) {
      // 计算 Controls 和 MiniMap 左侧和右侧的可用空间
      // Controls 左侧需要 moduleLibraryWidth + 20px
      // MiniMap 右侧需要 propertyPanelWidth + 20px
      // 它们自身也需要宽度：Controls ~54px, MiniMap ~200px
      // 还需要它们之间有一定的间隙，例如 50px
      const reservedSpaceForPanelsAndOffsets = moduleLibraryWidth + propertyPanelWidth;
      const minSpaceForControlsAndMinimap = 54 + 200 + 40 + 50; // ControlsWidth + MiniMapWidth + Offsets (20*2) + MinGap
      
      const availableCentralSpace = contentWidth - reservedSpaceForPanelsAndOffsets;
      
      // 阈值可以根据实际视觉效果调整
      const HIDE_UI_THRESHOLD = minSpaceForControlsAndMinimap; 
      
      setShowUiElements(availableCentralSpace >= HIDE_UI_THRESHOLD);
    } else if (contentWidth === 0) {
      // 初始加载时 contentWidth 可能为0，默认显示
      setShowUiElements(true);
    }
  }, [contentWidth, moduleLibraryWidth, propertyPanelWidth]);

  // 拖拽放置处理
  const { setNodeRef } = useDroppable({
    id: 'canvas-drop-area',
  });
  
  // 处理拖拽放置
  const handleDrop = useCallback((event: any) => {
    const { active } = event;
    if (!active || !active.data || !active.data.current) return;
    
    const moduleData = active.data.current;
    
    // 获取画布元素位置
    const canvasElement = document.querySelector('.react-flow');
    if (!canvasElement) return;
    const rect = canvasElement.getBoundingClientRect();
    
    // 计算放置坐标
    const position = {
      x: event.delta.x - rect.left + window.scrollX,
      y: event.delta.y - rect.top + window.scrollY,
    };
    
    // 创建新节点
    const newNode: Node = {
      id: `node-${nodeIdCounter}`,
      position,
      data: { 
        ...moduleData,
        label: moduleData.name,
      },
      style: { 
        width: 180, 
        padding: 10,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    
    // 添加新节点
    setNodes((nds: Node[]) => [...nds, newNode]);
    setNodeIdCounter((prev) => prev + 1);
    
    // 更新状态在useEffect中处理，避免这里重复调用
  }, [nodeIdCounter, setNodes]);
  
  return (
    <DndContext onDragEnd={handleDrop}>
      <div
        ref={setNodeRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f5f5f5',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          snapToGrid={true}
          snapGrid={[15, 15]}
          fitView
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={12} 
            size={1} 
            color="#888" 
          />
          {/* 根据 showUiElements 状态条件渲染 Controls */}
          {showUiElements && (
            <Controls 
              position="bottom-left" 
              style={{ left: moduleLibraryWidth + 20, bottom: 20 }} 
            />
          )}
          {/* 根据 showUiElements 状态条件渲染 MiniMap */}
          {showUiElements && (
            <MiniMap 
              position="bottom-right"
              style={{ right: propertyPanelWidth + 20, bottom: 20 }} 
              zoomable
              pannable
            />
          )}
        </ReactFlow>
      </div>
    </DndContext>
  );
};

export default Canvas;