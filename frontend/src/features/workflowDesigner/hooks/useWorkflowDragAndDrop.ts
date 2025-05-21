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
import { Node, ReactFlowInstance } from '@xyflow/react';
import { ModuleDefinition } from '../../../models/moduleDefinitions';
import { DragStartInfo, WorkflowDragAndDropHookResult, WorkflowDragAndDropParams } from '../types';
import { fetchModuleVariantDefinitions } from '../services/moduleService';
import { generateNodeId } from '../utils/workflowUtils';
import { CustomNodeData } from '../../../components/pages/WorkflowDesigner/CustomNode';

// 自定义节点的默认尺寸
const NODE_DEFAULT_WIDTH = 180;   // 与CustomNode.tsx中设置的宽度一致
const NODE_DEFAULT_HEIGHT = 100;  // 预估的节点高度

/**
 * 工作流拖拽Hook
 * 
 * @param params Hook参数对象，包含内容区域引用、节点操作函数等
 * @returns 拖拽状态和处理函数
 */
export const useWorkflowDragAndDrop = (
  params: WorkflowDragAndDropParams
): WorkflowDragAndDropHookResult => {
  const { 
    contentRef, 
    setNodes, 
    nodeIdCounter, 
    setNodeIdCounter, 
    updateWorkflowStatus, 
    setSelectedNode,
    reactFlowInstance 
  } = params;

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
   * 处理模块库模块点击预览
   * @param moduleDefinition 模块定义
   */
  const handleModulePreview = useCallback(async (moduleDefinition: ModuleDefinition) => {

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
   * 处理拖拽开始事件
   * @param event 拖拽开始事件
   */
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active, activatorEvent } = event;
    if (active && active.data && active.data.current && 'id' in active.data.current && 'name' in active.data.current) {
      const moduleData = active.data.current as ModuleDefinition;
      setDraggedModule(moduleData);
      
      // 新增：在开始拖拽时预览模块
      handleModulePreview(moduleData);
      
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
          ],
          previewShown: true // 记录已经显示了预览
        };
      }
    } else {
      setDraggedModule(null);
      dragStartRef.current = null;
    }
  }, [updateMousePosition, handleModulePreview]);
  
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
   * 将屏幕坐标转换为流图坐标
   * @param screenX 屏幕X坐标
   * @param screenY 屏幕Y坐标
   * @returns 流图坐标
   */
  const screenToFlowPosition = useCallback((screenX: number, screenY: number) => {
    if (!reactFlowInstance) {
      // 如果没有实例，回退到旧的计算方法
      const canvasElement = contentRef.current?.querySelector('.react-flow');
      if (!canvasElement) return { x: 0, y: 0 };
      
      const canvasRect = canvasElement.getBoundingClientRect();
      return {
        x: (screenX - canvasRect.left + canvasElement.scrollLeft) - (NODE_DEFAULT_WIDTH / 2),
        y: (screenY - canvasRect.top + canvasElement.scrollTop) - (NODE_DEFAULT_HEIGHT / 2),
      };
    }

    // 使用ReactFlow的screenToFlowPosition方法将屏幕坐标转换为流图坐标
    // 这会考虑当前的平移和缩放状态
    const position = reactFlowInstance.screenToFlowPosition({
      x: screenX,
      y: screenY,
    });

    // 调整位置，使节点中心对齐鼠标位置
    return {
      x: position.x - NODE_DEFAULT_WIDTH / 2,
      y: position.y - NODE_DEFAULT_HEIGHT / 2,
    };
  }, [reactFlowInstance, contentRef]);
  
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
        // 如果在拖拽开始时已经显示了预览，则不需要再次调用
        if (!dragStartData.previewShown) {
          handleModulePreview(moduleDataFromDrag);
        }
        return; // 点击后不添加到画布
      }

      // 如果不是点击，或者点击的不是模块库项，则继续拖拽到画布的逻辑
      if (over && over.id === 'canvas-drop-area') {
        const moduleData = active.data.current as any; // Re-alias for clarity

        // 使用最后记录的鼠标位置
        const pointerClientX = clientX;
        const pointerClientY = clientY;

        // 计算节点位置，考虑画布的变换（平移和缩放）
        const position = screenToFlowPosition(pointerClientX, pointerClientY);

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
          selected: true, // 添加selected属性，使新节点自动处于选中状态
        };

        // 先取消所有现有节点的选中状态
        setNodes((nds) => {
          return nds.map(node => ({
            ...node,
            selected: false
          }));
        });

        // 然后添加新节点
        setNodes((nds) => {
          const newNodes = [...nds, newNode];
          updateWorkflowStatus({ nodeCount: newNodes.length, saved: false });
          return newNodes;
        });
        setNodeIdCounter((prev) => prev + 1);
        
        // 新增：选中新添加的节点
        setSelectedNode({ data: newNodeData as CustomNodeData, id: newNodeId });
      }
    },
    [nodeIdCounter, setNodes, setNodeIdCounter, updateWorkflowStatus, screenToFlowPosition, handleModulePreview, setSelectedNode]
  );
  
  return {
    draggedModule,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    handleModulePreview,
  };
}; 