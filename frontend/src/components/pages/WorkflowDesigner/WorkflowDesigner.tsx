import React, { useState, useRef, useCallback } from 'react'; // Added useCallback
import { Layout, Button, Space, Modal } from 'antd';
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

// 从 moduleDefinitions 导入 VariantDefinitionFE 和 PortDefinitionFE
import { VariantDefinitionFE, PortDefinitionFE } from '../../../models/moduleDefinitions';
// 导入 CustomNodeData 类型
import { CustomNodeData } from './CustomNode';

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

// 模拟API调用获取模块变体定义
const fetchModuleVariantDefinitions = async (moduleTypeOrId: string): Promise<VariantDefinitionFE[] | null> => {
  console.log(`Fetching variant definitions for module type/ID: ${moduleTypeOrId}`);
  // 模拟API延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 基于 moduleTypeOrId 返回模拟数据
  // 在实际应用中，这里会是一个真实的API请求
  // 例如，如果 moduleTypeOrId 是 'ConditionalModule' (假设这是其唯一ID或类型名)
  if (moduleTypeOrId === 'conditional') { // 假设模块库中 'conditional' 模块的 id 是 'conditional'
    return [
      {
        variant_id: "default",
        variant_name: "数字比较 (模拟)",
        description: "比较两个数值，根据结果从不同端口输出原始值。",
        port_definitions: [
          { name: "value", port_io_type: "input", data_type: "number", description: "要判断的值", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "threshold", port_io_type: "input", data_type: "number", description: "阈值", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "true_result", port_io_type: "output", data_type: "any", description: "条件为真时输出原始'value'", is_optional: false, default_enabled: true, allow_multiple_connections: true },
          { name: "false_result", port_io_type: "output", data_type: "any", description: "条件为假时输出原始'value'", is_optional: false, default_enabled: true, allow_multiple_connections: true }
        ]
      },
      {
        variant_id: "string_compare",
        variant_name: "字符串比较 (模拟)",
        description: "比较两个字符串是否相等。",
        port_definitions: [
          { name: "string1", port_io_type: "input", data_type: "string", description: "第一个字符串", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "string2", port_io_type: "input", data_type: "string", description: "第二个字符串", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "match_output", port_io_type: "output", data_type: "boolean", description: "比较结果", is_optional: false, default_enabled: true, allow_multiple_connections: true },
          { name: "detail_output", port_io_type: "output", data_type: "string", description: "详细比较描述 (可选)", is_optional: true, default_enabled: false, allow_multiple_connections: true }
        ]
      }
    ];
  }
  // 为其他模块类型返回一个通用的默认变体或空数组
  return [
      {
        variant_id: "default",
        variant_name: "默认变体 (模拟)",
        description: "这是一个模拟的默认变体。",
        port_definitions: [
          { name: "input1", port_io_type: "input", data_type: "any", description: "输入1", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "output1", port_io_type: "output", data_type: "any", description: "输出1", is_optional: false, default_enabled: true, allow_multiple_connections: true }
        ]
      }
  ];
  // return null; // 或者在获取失败时返回 null
};

/**
 * 工作流设计器页面
 * 包含顶部操作栏、模块库、画布和属性面板
 */
const WorkflowDesigner: React.FC = () => {
  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<{ data: CustomNodeData, id: string } | null>(null);
  
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
  const handleNodeSelect = (node: Node) => {
    console.log('WorkflowDesigner: handleNodeSelect triggered. Node:', node);
    if (node && node.data) {
      console.log('WorkflowDesigner: node.data:', node.data);
      setSelectedNode({ data: node.data as CustomNodeData, id: node.id });
    } else {
      console.warn('WorkflowDesigner: handleNodeSelect called with invalid node or node.data. Node:', node);
      // 可以选择不更新 selectedNode 或设置为 null，以避免下游错误
      // setSelectedNode(null); 
    }
  };

  /**
   * 更新工作流状态
   * @param status - 部分工作流状态
   */
  const updateWorkflowStatus = useCallback((status: Partial<typeof workflowStatus>) => {
    setWorkflowStatus(prevStatus => ({ ...prevStatus, ...status }));
  }, []);

  /**
   * 属性面板回调：当节点数据在属性面板中更改时调用
   * @param nodeId 发生更改的节点ID
   * @param newNodeData 更新的部分节点数据
   */
  const onNodeDataChange = useCallback((nodeId: string, newNodeData: Partial<CustomNodeData>) => {
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
                return { ...n, data: updatedData };
              }
              return n;
            }));
            updateWorkflowStatus({ saved: false });
            setSelectedNode((prevSelNode: { data: CustomNodeData, id: string } | null) => {
              if (prevSelNode && prevSelNode.id === nodeId) {
                return { ...prevSelNode, data: { ...prevSelNode.data, ...newNodeData } as CustomNodeData };
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
      return nds.map((node) => {
        if (node.id === nodeId) {
          // 创建一个新的 data 对象，合并旧数据和新数据
          const updatedData = { ...node.data, ...newNodeData } as CustomNodeData; // 明确类型
          return {
            ...node,
            data: updatedData,
          };
        }
        return node;
      });
    });
    updateWorkflowStatus({ saved: false }); // 标记工作流为未保存
    // 如果选中的节点就是当前更改的节点，也更新selectedNode状态以确保属性面板自身也能响应某些联动变化（如果需要）
    // 但通常属性面板的Form会通过allValues自行管理其当前显示，这里的selectedNode更新更多是为了其他可能的副作用
    setSelectedNode((prevSelNode: { data: CustomNodeData, id: string } | null) => { // 添加类型
      if (prevSelNode && prevSelNode.id === nodeId) {
        return { ...prevSelNode, data: { ...prevSelNode.data, ...newNodeData } as CustomNodeData };
      }
      return prevSelNode;
    });
  }, [setNodes, updateWorkflowStatus, edges]);

  /**
   * 判断两个端口类型是否兼容
   * @param sourceType 源端口类型
   * @param targetType 目标端口类型
   */
  function areTypesCompatible(sourceType: string, targetType: string): boolean {
    if (sourceType === 'any' || targetType === 'any') return true;
    if (sourceType === targetType) return true;
    // 可扩展更多兼容规则，如 number <-> string 等
    return false;
  }

  /**
   * 处理画布上的节点连接（增加类型兼容性检查）
   * @param connection - 连接对象
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
    [setEdges, updateWorkflowStatus, nodes]
  );

  /**
   * 处理从模块库拖拽到画布的操作
   * @param event - 拖拽结束事件对象
   */
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => { // 将函数声明为 async
      const { active, over } = event;

      if (over && over.id === 'canvas-drop-area') {
        if (!active || !active.data || !active.data.current) return;

        const moduleData = active.data.current as any; 

        const canvasElement = contentRef.current?.querySelector('.react-flow');
        const translatedRect = active.rect.current.translated;

        if (!canvasElement || !translatedRect) return;

        const canvasRect = canvasElement.getBoundingClientRect();
        
        const position = {
          x: translatedRect.left - canvasRect.left + (canvasElement.scrollLeft || 0),
          y: translatedRect.top - canvasRect.top + (canvasElement.scrollTop || 0),
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
          // 可以设置一个空的默认值或基础结构，以避免 CustomNode 出错
        }

        const newNodeData = {
          ...moduleData,
          instanceId: `node-${nodeIdCounter}`, // 添加 instanceId 以确保与 CustomNodeData 接口一致
          label: moduleData.name,
          availableVariants: availableVariants || [],
          currentVariantId: defaultVariantId,
          activePortsConfig: initialActivePortsConfig,
          // moduleDef: moduleData, // 如果 moduleData 就是完整的 ModuleDefinition，可以这样传递
        };
        
        const newNode: Node = {
          id: `node-${nodeIdCounter}`,
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
            onNodeDataChange={onNodeDataChange}
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