import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
}

/**
 * 工作流画布组件
 * 使用React Flow实现节点拖拽和连接
 */
const Canvas: React.FC<CanvasProps> = ({ onNodeSelect, updateWorkflowStatus }) => {
  // 节点和连线状态管理
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // 节点计数器（用于生成唯一ID）
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  
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
          width: '100%',
          height: '100%',
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
          <Controls />
        </ReactFlow>
      </div>
    </DndContext>
  );
};

export default Canvas;