/**
 * 工作流管理器Hook
 * 
 * 管理工作流状态、节点和连线的操作，以及与属性面板的交互
 */

import { useState, useCallback } from 'react';
import { Modal } from 'antd';
import { 
  Node, 
  Edge, 
  OnConnect, 
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import { CustomNodeData } from '../../../components/pages/WorkflowDesigner/CustomNode';
import { WorkflowStatus, WorkflowManagerHookResult } from '../types';
import { areTypesCompatible } from '../utils/workflowUtils';

// 默认节点和边数据
const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

/**
 * 工作流管理器Hook
 * 
 * @returns 工作流状态和操作方法
 */
export const useWorkflowManager = (): WorkflowManagerHookResult => {
  // 节点和连线状态
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  
  // 选中节点状态
  const [selectedNode, setSelectedNode] = useState<{ data: CustomNodeData, id: string } | null>(null);
  
  // 工作流状态
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>({
    saved: true,
    nodeCount: 0,
    edgeCount: 0,
  });
  
  /**
   * 更新工作流状态
   * @param status 部分工作流状态
   */
  const updateWorkflowStatus = useCallback((status: Partial<WorkflowStatus>) => {
    setWorkflowStatus(prevStatus => ({ ...prevStatus, ...status }));
  }, []);
  
  /**
   * 处理节点选择
   * @param node 被选中的节点数据
   */
  const handleNodeSelect = useCallback((node: Node) => {
    console.log('WorkflowDesigner: handleNodeSelect triggered. Node:', node);
    if (node && node.data) {
      console.log('WorkflowDesigner: node.data:', node.data);
      setSelectedNode({ data: node.data as CustomNodeData, id: node.id });
    } else {
      console.warn('WorkflowDesigner: handleNodeSelect called with invalid node or node.data. Node:', node);
      // 可以选择不更新 selectedNode 或设置为 null，以避免下游错误
      // setSelectedNode(null); 
    }
  }, []);
  
  /**
   * 处理画布上的节点连接（增加类型兼容性检查）
   * @param connection 连接对象
   */
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // 1. 查找 source/target 节点和端口定义
      const sourceNode = nodes.find(n => n.id === connection.source);
      const targetNode = nodes.find(n => n.id === connection.target);
      let sourceType = 'any';
      let targetType = 'any';
      if (sourceNode && targetNode) {
        // 查找 source 输出端口类型
        const sourceData = sourceNode.data as CustomNodeData;
        const sourceVariant = sourceData.availableVariants?.find(v => v.variant_id === sourceData.currentVariantId);
        const sourcePort = sourceVariant?.port_definitions.find(pd => pd.name === connection.sourceHandle && pd.port_io_type === 'output');
        if (sourcePort) sourceType = sourcePort.data_type;
        // 查找 target 输入端口类型
        const targetData = targetNode.data as CustomNodeData;
        const targetVariant = targetData.availableVariants?.find(v => v.variant_id === targetData.currentVariantId);
        const targetPort = targetVariant?.port_definitions.find(pd => pd.name === connection.targetHandle && pd.port_io_type === 'input');
        if (targetPort) targetType = targetPort.data_type;
      }
      // 2. 类型兼容性检查
      if (!areTypesCompatible(sourceType, targetType)) {
        Modal.warning({
          title: '端口类型不兼容',
          content: `无法连接：输出端口类型为 ${sourceType}，输入端口类型为 ${targetType}`,
        });
        return; // 阻止连接
      }
      // 3. 类型兼容，正常添加边
      setEdges((eds) => {
        const newEdges = addEdge({ ...connection, type: 'smoothstep', animated: true }, eds);
        updateWorkflowStatus({ edgeCount: newEdges.length, saved: false });
        return newEdges;
      });
    },
    [nodes, setEdges, updateWorkflowStatus]
  );
  
  /**
   * 属性面板回调：当节点数据在属性面板中更改时调用
   * @param nodeId 发生更改的节点ID
   * @param newNodeData 更新的部分节点数据
   */
  const onNodeDataChange = useCallback((nodeId: string, newNodeData: Partial<CustomNodeData>) => {
    console.log(`WorkflowDesigner: onNodeDataChange called for nodeId: ${nodeId}`, newNodeData);
    
    // 检查是否是变体或端口配置变更
    const isVariantOrPortChange = 
      newNodeData.currentVariantId !== undefined || 
      newNodeData.activePortsConfig !== undefined;
    
    setNodes((nds) => {
      // 检查是否为变体切换或端口配置变更
      const node = nds.find(n => n.id === nodeId);
      if (!node) return nds;
      const oldData = node.data as CustomNodeData;
      const oldVariant = oldData.availableVariants?.find(v => v.variant_id === oldData.currentVariantId);
      const oldActivePortsConfig = oldData.activePortsConfig || {};
      // 计算旧端口名集合
      const oldPorts = (oldVariant?.port_definitions || []).filter(pd => {
        if (!pd.is_optional) return true;
        return oldActivePortsConfig[pd.name] ?? pd.default_enabled;
      });
      const oldPortNames = oldPorts.map(pd => pd.name);
      // 计算新端口名集合
      let newVariantId = newNodeData.currentVariantId ?? oldData.currentVariantId;
      let newActivePortsConfig = newNodeData.activePortsConfig ?? oldActivePortsConfig;
      const newVariant = oldData.availableVariants?.find(v => v.variant_id === newVariantId);
      const newPorts = (newVariant?.port_definitions || []).filter(pd => {
        if (!pd.is_optional) return true;
        return newActivePortsConfig[pd.name] ?? pd.default_enabled;
      });
      const newPortNames = newPorts.map(pd => pd.name);
      // 找出将被移除的端口
      const removedPortNames = oldPortNames.filter(name => !newPortNames.includes(name));
      // 检查受影响的边
      const affectedEdges = edges.filter(e =>
        (e.source === nodeId && removedPortNames.includes(e.sourceHandle || '')) ||
        (e.target === nodeId && removedPortNames.includes(e.targetHandle || ''))
      );
      if (removedPortNames.length > 0 && affectedEdges.length > 0) {
        // 弹窗提示用户
        Modal.confirm({
          title: '变体切换将断开连接',
          content: `切换变体/端口配置将断开 ${affectedEdges.length} 条连接，是否继续？`,
          okText: '继续',
          cancelText: '取消',
          onOk: () => {
            // 移除受影响的边并更新节点数据
            setEdges((eds) => eds.filter(e => !affectedEdges.includes(e)));
            setNodes((nds2) => nds2.map((n) => {
              if (n.id === nodeId) {
                const updatedData = { ...n.data, ...newNodeData } as CustomNodeData;
                delete updatedData.inputs; // 清理旧属性
                delete updatedData.outputs; // 清理旧属性
                return { ...n, data: updatedData };
              }
              return n;
            }));
            updateWorkflowStatus({ saved: false });
            setSelectedNode((prevSelNode) => {
              if (prevSelNode && prevSelNode.id === nodeId) {
                const updatedSelectedData = { ...prevSelNode.data, ...newNodeData } as CustomNodeData;
                delete updatedSelectedData.inputs;
                delete updatedSelectedData.outputs;
                return { ...prevSelNode, data: updatedSelectedData };
              }
              return prevSelNode;
            });
          },
          onCancel: () => {
            // 取消变体切换，不做任何更改
          },
        });
        return nds; // 暂不更新节点，等待用户确认
      }
      
      // 无需弹窗，直接更新节点数据
      return nds.map((nodeToUpdate) => {
        if (nodeToUpdate.id === nodeId) {
          // 创建一个新的 data 对象，合并旧数据和新数据
          const baseData = { ...nodeToUpdate.data, ...newNodeData } as CustomNodeData;
          
          // 清理旧的、可能与新变体冲突的顶层端口数量属性
          delete baseData.inputs;
          delete baseData.outputs;
          
          return {
            ...nodeToUpdate,
            data: baseData,
          };
        }
        return nodeToUpdate;
      });
    });
    
    updateWorkflowStatus({ saved: false }); // 标记工作流为未保存
    
    setSelectedNode((prevSelNode) => {
      if (prevSelNode && prevSelNode.id === nodeId) {
        const updatedSelectedData = { ...prevSelNode.data, ...newNodeData } as CustomNodeData;
        delete updatedSelectedData.inputs; // 清理旧属性
        delete updatedSelectedData.outputs; // 清理旧属性
        return { ...prevSelNode, data: updatedSelectedData };
      }
      return prevSelNode;
    });
  }, [edges, setEdges, setNodes, updateWorkflowStatus]);
  
  /**
   * 检查新节点数据是否包含变体或端口配置变更
   * @param newNodeData 节点数据
   * @returns 是否包含变体或端口配置变更
   */
  const isVariantOrPortChange = useCallback((newNodeData: Partial<CustomNodeData>): boolean => {
    return newNodeData.currentVariantId !== undefined || newNodeData.activePortsConfig !== undefined;
  }, []);
  
  /**
   * 处理新建工作流
   */
  const handleNew = useCallback(() => {
    setNodes(initialNodes); // 清空节点
    setEdges(initialEdges); // 清空边
    setNodeIdCounter(1);    // 重置ID计数器
    setWorkflowStatus({
      saved: true,
      nodeCount: 0,
      edgeCount: 0,
    });
    setSelectedNode(null);
  }, [setNodes, setEdges]);
  
  /**
   * 处理打开工作流
   */
  const handleOpen = useCallback(() => {
    console.log('打开工作流');
  }, []);
  
  /**
   * 处理保存工作流
   */
  const handleSave = useCallback(() => {
    console.log('保存工作流');
    setWorkflowStatus(prev => ({
      ...prev,
      saved: true,
    }));
  }, []);
  
  /**
   * 处理运行工作流
   */
  const handleRun = useCallback(() => {
    console.log('运行工作流');
  }, []);
  
  return {
    // 状态
    nodes,
    edges,
    selectedNode,
    workflowStatus,
    nodeIdCounter,
    
    // 节点和边的更改处理
    onNodesChange,
    onEdgesChange,
    onConnect,
    
    // 节点选择和数据更改
    handleNodeSelect,
    onNodeDataChange,
    
    // 工作流状态更新
    updateWorkflowStatus,
    
    // 工作流操作
    handleNew,
    handleOpen,
    handleSave,
    handleRun,
    
    // 内部 Hooks 调用检查
    isVariantOrPortChange,
    
    // 状态设置器，供拖拽Hook使用
    setNodes,
    setNodeIdCounter,
    setSelectedNode,
  };
}; 