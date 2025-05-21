import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  BackgroundVariant,
  Controls,
  Background,
  Edge,
  Node,
  NodeTypes,
  OnConnect,
  ConnectionLineType,
  MiniMap,
  OnNodesChange, // Added for prop type
  OnEdgesChange, // Added for prop type
  OnSelectionChangeFunc, // 添加选择变化事件类型
  ReactFlowInstance, // 添加ReactFlowInstance类型
  useReactFlow, // 添加useReactFlow钩子
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useDroppable } from '@dnd-kit/core';
import CustomNode from './CustomNode';

// 默认节点数据 - 如果父组件管理，这里可以移除
// const initialNodes: Node[] = [];
// const initialEdges: Edge[] = [];

// 自定义节点类型 - 移到组件外部 (保持不变)
const nodeTypesProp: NodeTypes = {
  customNode: CustomNode,
};

// 画布属性接口 - 更新以接收新的props
interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  onNodeSelect: (nodeData: any) => void; // nodeData type can be more specific
  updateWorkflowStatus: (status: Partial<{ saved: boolean; nodeCount: number; edgeCount: number; }>) => void;
  moduleLibraryWidth: number; 
  propertyPanelWidth: number; 
  contentWidth: number;
  // 添加React Flow实例回调
  onReactFlowInstanceChange?: (instance: ReactFlowInstance) => void;
}

/**
 * 工作流画布组件
 * 使用React Flow实现节点拖拽和连接
 */
const Canvas: React.FC<CanvasProps> = ({ 
  nodes, // New prop
  edges, // New prop
  onNodesChange, // New prop
  onEdgesChange, // New prop
  onConnect, // New prop
  onNodeSelect, 
  updateWorkflowStatus, // Still used for node click selection if needed, or by parent
  moduleLibraryWidth,    
  propertyPanelWidth,    
  contentWidth,
  onReactFlowInstanceChange // 添加React Flow实例回调
}) => {  
  // 控制 Controls 和 MiniMap 的显示状态
  const [showUiElements, setShowUiElements] = useState(true);

  // 使用useMemo缓存nodeTypes (保持不变)
  const nodeTypes = useMemo(() => nodeTypesProp, []);
  
  // 处理节点选择 - 为了保持兼容性
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      onNodeSelect(node); // 保留原来的节点选择逻辑，以保持兼容性
    },
    [onNodeSelect]
  );
  
  // 处理选择变化事件
  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes }) => {
      // 当有节点被选中时，触发 onNodeSelect 回调
      if (nodes && nodes.length === 1) {
        onNodeSelect(nodes[0]);
      }
    },
    [onNodeSelect]
  );

  // 处理实例加载
  const onInit = useCallback(
    (instance: ReactFlowInstance) => {
      if (onReactFlowInstanceChange) {
        onReactFlowInstanceChange(instance);
      }
    },
    [onReactFlowInstanceChange]
  );

  // 根据可用空间判断是否显示 Controls 和 MiniMap
  useEffect(() => {
    if (contentWidth > 0 && moduleLibraryWidth > 0 && propertyPanelWidth > 0) {
      const reservedSpaceForPanelsAndOffsets = moduleLibraryWidth + propertyPanelWidth;
      const minSpaceForControlsAndMinimap = 54 + 200 + 40 + 50; 
      const availableCentralSpace = contentWidth - reservedSpaceForPanelsAndOffsets;
      const HIDE_UI_THRESHOLD = minSpaceForControlsAndMinimap; 
      setShowUiElements(availableCentralSpace >= HIDE_UI_THRESHOLD);
    } else if (contentWidth === 0) {
      setShowUiElements(true);
    }
  }, [contentWidth, moduleLibraryWidth, propertyPanelWidth]);

  // 拖拽放置处理 - useDroppable 保持不变
  const { setNodeRef } = useDroppable({
    id: 'canvas-drop-area', // This ID is used by the parent's onDragEnd handler
  });
  
  return (
    // <DndContext onDragEnd={handleDrop}> // REMOVED DndContext wrapper
      <div
        ref={setNodeRef} // This ref is for useDroppable
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
          nodes={nodes} // Use prop
          edges={edges} // Use prop
          onNodesChange={onNodesChange} // Use prop
          onEdgesChange={onEdgesChange} // Use prop
          onConnect={onConnect} // Use prop
          onNodeClick={onNodeClick}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          connectionLineType={ConnectionLineType.SmoothStep}
          snapToGrid={true}
          snapGrid={[15, 15]}
          onInit={onInit} // 添加onInit回调
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={12} 
            size={1} 
            color="#888" 
          />
          {showUiElements && (
            <Controls 
              position="bottom-left" 
              style={{ left: moduleLibraryWidth + 20, bottom: 20 }} 
            />
          )}
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
    // </DndContext> // REMOVED DndContext wrapper
  );
};

export default Canvas;