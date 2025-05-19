/**
 * 工作流拖拽Hook
 * 
 * 处理元素的拖拽操作，包括从模块库到画布的拖拽、点击模块库项目的处理等
 */

import { useState, useRef, useCallback } from 'react';
import { 
  DragStartEvent, 
  DragEndEvent,
} from '@dnd-kit/core';
import { Node } from '@xyflow/react';
import { ModuleDefinition } from '../../../models/moduleDefinitions';
import { DragStartInfo, WorkflowDragAndDropHookResult } from '../types';
import { fetchModuleVariantDefinitions } from '../services/moduleService';
import { generateNodeId } from '../utils/workflowUtils';
import { CustomNodeData } from '../../../components/pages/WorkflowDesigner/CustomNode';

/**
 * 工作流拖拽Hook
 * 
 * @param contentRef 内容区域引用
 * @param setNodes 设置节点的函数
 * @param nodeIdCounter 节点ID计数器
 * @param setNodeIdCounter 设置节点ID计数器的函数
 * @param updateWorkflowStatus 更新工作流状态的函数
 * @param setSelectedNode 设置选中节点的函数
 * @returns 拖拽状态和处理函数
 */
export const useWorkflowDragAndDrop = (
  contentRef: React.RefObject<HTMLDivElement>,
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  nodeIdCounter: number,
  setNodeIdCounter: React.Dispatch<React.SetStateAction<number>>,
  updateWorkflowStatus: (status: Partial<{ saved: boolean; nodeCount: number; edgeCount: number; }>) => void,
  setSelectedNode: React.Dispatch<React.SetStateAction<{ data: CustomNodeData, id: string } | null>>
): WorkflowDragAndDropHookResult => {
  // 当前拖拽的模块
  const [draggedModule, setDraggedModule] = useState<ModuleDefinition | null>(null);
  
  // 拖拽起始信息引用
  const dragStartRef = useRef<DragStartInfo | null>(null);
  
  /**
   * 处理拖拽开始事件
   * @param event 拖拽开始事件
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active, activatorEvent } = event;
    if (active && active.data && active.data.current && 'id' in active.data.current && 'name' in active.data.current) {
      setDraggedModule(active.data.current as ModuleDefinition);
      // 记录拖拽起始信息
      if (activatorEvent instanceof MouseEvent || activatorEvent instanceof TouchEvent) {
        const clientX = activatorEvent instanceof MouseEvent ? activatorEvent.clientX : activatorEvent.touches[0].clientX;
        const clientY = activatorEvent instanceof MouseEvent ? activatorEvent.clientY : activatorEvent.touches[0].clientY;
        dragStartRef.current = {
          x: clientX,
          y: clientY,
          time: Date.now(),
          targetId: active.id.toString(), // 假设 active.id 可以转为 string
        };
      }
    } else {
      setDraggedModule(null);
      dragStartRef.current = null;
    }
  }, []);
  
  /**
   * 处理拖拽取消事件
   */
  const handleDragCancel = useCallback(() => {
    setDraggedModule(null);
    dragStartRef.current = null;
  }, []);
  
  /**
   * 处理模块库模块点击预览
   * @param moduleDefinition 模块定义
   */
  const handleModulePreview = useCallback(async (moduleDefinition: ModuleDefinition) => {
    console.log('Previewing module:', moduleDefinition.name);

    // 1. 获取变体定义
    const availableVariants = await fetchModuleVariantDefinitions(moduleDefinition.id);
    let defaultVariantId = '';
    let initialActivePortsConfig: { [portName: string]: boolean } = {};

    if (availableVariants && availableVariants.length > 0) {
      const defaultVariant = availableVariants.find(v => v.variant_id === 'default') || availableVariants[0];
      defaultVariantId = defaultVariant.variant_id;
      defaultVariant.port_definitions.forEach(pd => {
        if (pd.is_optional) {
          initialActivePortsConfig[pd.name] = pd.default_enabled;
        }
      });
    } else {
      console.warn(`No variant definitions found for module type during preview: ${moduleDefinition.id}`);
    }

    // 2. 构建一个符合 CustomNodeData 部分期望的结构给 PropertyPanel
    const previewNodeData: CustomNodeData = {
      id: `preview_${moduleDefinition.id}`, // 特殊ID表示预览
      instanceId: `preview_instance_${moduleDefinition.id}`, // 确保CustomNodeData接口满足
      name: moduleDefinition.name,
      description: moduleDefinition.description || '',
      icon: moduleDefinition.icon,
      type: 'customNode',
      properties: {}, // 初始属性值为空，让用户在属性面板中填写或查看默认值
      moduleDef: moduleDefinition, // 传递完整的模块定义
      availableVariants: availableVariants || [],
      currentVariantId: defaultVariantId,
      activePortsConfig: initialActivePortsConfig,
    };

    // 3. 更新 selectedNode 状态
    setSelectedNode({ data: previewNodeData, id: previewNodeData.id });
  }, [setSelectedNode]);
  
  /**
   * 处理从模块库拖拽到画布的操作
   * @param event 拖拽结束事件
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over, activatorEvent } = event;
      setDraggedModule(null);

      const dragStartData = dragStartRef.current;
      dragStartRef.current = null; // Reset for next drag

      if (!active || !active.data || !active.data.current || !dragStartData) {
        return;
      }

      // 判断是点击还是拖拽
      const now = Date.now();
      const clientX = activatorEvent instanceof MouseEvent ? activatorEvent.clientX : (activatorEvent as TouchEvent).changedTouches[0].clientX;
      const clientY = activatorEvent instanceof MouseEvent ? activatorEvent.clientY : (activatorEvent as TouchEvent).changedTouches[0].clientY;
      
      const deltaX = Math.abs(clientX - dragStartData.x);
      const deltaY = Math.abs(clientY - dragStartData.y);
      const deltaTime = now - dragStartData.time;

      const CLICK_THRESHOLD_DISTANCE = 5; // 像素
      const CLICK_THRESHOLD_TIME = 300; // 毫秒

      const moduleDataFromDrag = active.data.current as ModuleDefinition;

      // 条件1: 拖拽的是模块库中的项 
      const isDragFromModuleLibrary = active.id === dragStartData.targetId;

      if (
        isDragFromModuleLibrary &&
        deltaX < CLICK_THRESHOLD_DISTANCE &&
        deltaY < CLICK_THRESHOLD_DISTANCE &&
        deltaTime < CLICK_THRESHOLD_TIME
      ) {
        // 判断为点击模块库中的模块
        console.log('Detected click on module library item:', moduleDataFromDrag.name);
        handleModulePreview(moduleDataFromDrag);
        return; // 点击后不添加到画布
      }

      // 如果不是点击，或者点击的不是模块库项，则继续拖拽到画布的逻辑
      if (over && over.id === 'canvas-drop-area') {
        const moduleData = active.data.current as any; // Re-alias for clarity

        const canvasElement = contentRef.current?.querySelector('.react-flow');
        // activatorEvent 应该存在，因为我们已经检查了 dragStartData
        if (!canvasElement || !(activatorEvent instanceof MouseEvent || activatorEvent instanceof TouchEvent)) return;

        // 使用 activatorEvent (指针事件) 的 clientX/clientY 进行精确放置
        const pointerClientX = activatorEvent instanceof MouseEvent ? activatorEvent.clientX : activatorEvent.changedTouches[0].clientX;
        const pointerClientY = activatorEvent instanceof MouseEvent ? activatorEvent.clientY : activatorEvent.changedTouches[0].clientY;

        const canvasRect = canvasElement.getBoundingClientRect();
        
        const position = {
          x: pointerClientX - canvasRect.left + canvasElement.scrollLeft,
          y: pointerClientY - canvasRect.top + canvasElement.scrollTop,
        };

        // 获取变体定义
        const availableVariants = await fetchModuleVariantDefinitions(moduleData.id);
        let defaultVariantId = '';
        let initialActivePortsConfig: { [portName: string]: boolean } = {};

        if (availableVariants && availableVariants.length > 0) {
          const defaultVariant = availableVariants.find(v => v.variant_id === 'default') || availableVariants[0];
          defaultVariantId = defaultVariant.variant_id;
          
          defaultVariant.port_definitions.forEach(pd => {
            if (pd.is_optional) {
              initialActivePortsConfig[pd.name] = pd.default_enabled;
            }
          });
        } else {
          console.warn(`No variant definitions found for module type: ${moduleData.id}`);
        }

        const newNodeId = generateNodeId(nodeIdCounter);
        const newNodeData = {
          ...moduleData,
          instanceId: newNodeId, // 添加 instanceId 以确保与 CustomNodeData 接口一致
          label: moduleData.name,
          availableVariants: availableVariants || [],
          currentVariantId: defaultVariantId,
          activePortsConfig: initialActivePortsConfig,
        };
        
        const newNode: Node = {
          id: newNodeId,
          type: 'customNode',
          position,
          data: newNodeData,
        };

        setNodes((nds) => {
          const newNodes = [...nds, newNode];
          updateWorkflowStatus({ nodeCount: newNodes.length, saved: false });
          return newNodes;
        });
        setNodeIdCounter((prev) => prev + 1);
      }
    },
    [nodeIdCounter, setNodes, setNodeIdCounter, updateWorkflowStatus, contentRef, handleModulePreview, setSelectedNode]
  );
  
  return {
    draggedModule,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    handleModulePreview,
  };
}; 