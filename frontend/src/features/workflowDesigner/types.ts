/**
 * 工作流设计器特性相关的类型定义
 * 
 * 包含了工作流设计器专用的类型，扩展了现有的模型类型
 */

import { Node, Edge, OnConnect, OnNodesChange, OnEdgesChange, Connection, ReactFlowInstance } from '@xyflow/react';
import { CustomNodeData } from '../../components/pages/WorkflowDesigner/CustomNode';
import { ModuleDefinition } from '../../models/moduleDefinitions';

/**
 * 工作流状态接口
 */
export interface WorkflowStatus {
  saved: boolean;
  nodeCount: number;
  edgeCount: number;
}

/**
 * 拖拽开始信息接口
 */
export interface DragStartInfo {
  x: number;
  y: number;
  time: number;
  targetId: string | null;
  cleanupFunctions?: (() => void)[];  // 添加清理函数数组，用于清理事件监听器
  lastPosition?: { x: number, y: number }; // 最后记录的鼠标位置
  previewShown?: boolean; // 是否已经显示了模块预览
}

/**
 * 工作流管理器Hook返回值接口
 */
export interface WorkflowManagerHookResult {
  // 状态
  nodes: Node[];
  edges: Edge[];
  selectedNode: { data: CustomNodeData, id: string } | null;
  workflowStatus: WorkflowStatus;
  nodeIdCounter: number;
  
  // 节点和边的更改处理
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  // 节点选择和数据更改
  handleNodeSelect: (node: Node) => void;
  onNodeDataChange: (nodeId: string, newNodeData: Partial<CustomNodeData>) => void;
  
  // 工作流状态更新
  updateWorkflowStatus: (status: Partial<WorkflowStatus>) => void;
  
  // 工作流操作
  handleNew: () => void;
  handleOpen: () => void;
  handleSave: () => void;
  handleRun: () => void;
  
  // 内部 Hooks 调用检查
  isVariantOrPortChange: (newNodeData: Partial<CustomNodeData>) => boolean;
  
  // 状态设置器
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setNodeIdCounter: React.Dispatch<React.SetStateAction<number>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<{ data: CustomNodeData, id: string } | null>>;
}

/**
 * 工作流拖拽Hook参数接口
 */
export interface WorkflowDragAndDropParams {
  contentRef: React.RefObject<HTMLDivElement>;
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  nodeIdCounter: number;
  setNodeIdCounter: React.Dispatch<React.SetStateAction<number>>;
  updateWorkflowStatus: (status: Partial<{ saved: boolean; nodeCount: number; edgeCount: number; }>) => void;
  setSelectedNode: React.Dispatch<React.SetStateAction<{ data: CustomNodeData, id: string } | null>>;
  reactFlowInstance: ReactFlowInstance | null;
}

/**
 * 工作流拖拽Hook返回值接口
 */
export interface WorkflowDragAndDropHookResult {
  // 状态
  draggedModule: ModuleDefinition | null;
  
  // 事件处理
  handleDragStart: (event: any) => void;
  handleDragEnd: (event: any) => void;
  handleDragCancel: () => void;
  handleModulePreview: (moduleDefinition: ModuleDefinition) => void;
} 