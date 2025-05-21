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

// 自定义节点的默认尺寸
const NODE_DEFAULT_WIDTH = 180;   // 与CustomNode.tsx中设置的宽度一致
const NODE_DEFAULT_HEIGHT = 100;  // 预估的节点高度

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
   * 更新鼠标位置的函数
   */
  const updateMousePosition = useCallback((clientX: number, clientY: number) => {
    if (dragStartRef.current) {
      dragStartRef.current.lastPosition = { x: clientX, y: clientY };
    }
  }, []);
  
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
        
        // 添加鼠标移动事件监听器
        const handleMouseMove = (e: MouseEvent) => {
          updateMousePosition(e.clientX, e.clientY);
        };
        
        const handleTouchMove = (e: TouchEvent) => {
          if (e.touches.length > 0) {
            updateMousePosition(e.touches[0].clientX, e.touches[0].clientY);
          }
        };
        
        // 添加事件监听器
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('touchmove', handleTouchMove);
        
        dragStartRef.current = {
          x: clientX,
          y: clientY,
          time: Date.now(),
          targetId: active.id.toString(), // 假设 active.id 可以转为 string
          lastPosition: { x: clientX, y: clientY }, // 初始位置与开始位置相同
          cleanupFunctions: [
            () => document.removeEventListener('mousemove', handleMouseMove),
            () => document.removeEventListener('touchmove', handleTouchMove)
          ]
        };
      }
    } else {
      setDraggedModule(null);
      dragStartRef.current = null;
    }
  }, [updateMousePosition]);
  
  /**
   * 处理拖拽取消事件
   */
  const handleDragCancel = useCallback(() => {
    // 移除所有事件监听器
    if (dragStartRef.current && dragStartRef.current.cleanupFunctions) {
      dragStartRef.current.cleanupFunctions.forEach(cleanup => cleanup());
    }
    
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
      const { active, over } = event;
      
      // 首先清理事件监听器
      if (dragStartRef.current && dragStartRef.current.cleanupFunctions) {
        dragStartRef.current.cleanupFunctions.forEach(cleanup => cleanup());
      }
      
      setDraggedModule(null);

      const dragStartData = dragStartRef.current;
      dragStartRef.current = null; // Reset for next drag

      if (!active || !active.data || !active.data.current || !dragStartData) {
        return;
      }

      // 判断是点击还是拖拽
      const now = Date.now();
      
      // 从dragStartData中获取最后的鼠标位置
      const lastPosition = dragStartData.lastPosition || { x: dragStartData.x, y: dragStartData.y };
      const clientX = lastPosition.x;
      const clientY = lastPosition.y;
      
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
        if (!canvasElement) return;

        // 使用最后记录的鼠标位置，而不是开始时的位置
        const pointerClientX = clientX;
        const pointerClientY = clientY;

        const canvasRect = canvasElement.getBoundingClientRect();
        
        // 计算节点位置，需要从鼠标位置减去节点一半的宽度和高度，以便使节点中心对齐鼠标位置
        const position = {
          x: (pointerClientX - canvasRect.left + canvasElement.scrollLeft) - (NODE_DEFAULT_WIDTH / 2),
          y: (pointerClientY - canvasRect.top + canvasElement.scrollTop) - (NODE_DEFAULT_HEIGHT / 2),
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