import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ModuleType, getColorByModuleType, PortDefinitionFE, VariantDefinitionFE, ModuleDefinition } from '../../../models/moduleDefinitions';

// 自定义节点数据接口
export interface CustomNodeData {
  id: string; // 模块的唯一ID (通常是 moduleDefinition.id)
  instanceId: string; // 节点实例的唯一ID (React Flow 使用的ID)
  name: string; // 模块定义中的 name
  icon: string;
  type: string; // ModuleType
  label?: string; // 节点上显示的标签，可以由用户修改，或者等于 name
  description?: string;
  // inputs 和 outputs 数量将由变体动态决定，不再直接存储在这里
  // inputs?: number;
  // outputs?: number;
  color?: string;
  properties?: Record<string, any>; // 存储模块的具体参数值

  // 新增：变体相关属性
  currentVariantId?: string; // 当前激活的变体ID
  activePortsConfig?: { [portName: string]: boolean }; // 可选端口的启用状态
  availableVariants?: VariantDefinitionFE[]; // 该模块类型所有可用变体定义
  // 后端返回的原始模块定义，可能包含变体信息
  moduleDef?: ModuleDefinition; 
  [key: string]: unknown; // 兼容 React Flow Node.data 类型要求
}

// 端口数据类型到颜色的映射，用于端口可视化
const dataTypeToColor: Record<string, string> = {
  number: '#1890ff',    // 蓝色
  string: '#52c41a',    // 绿色
  boolean: '#faad14',   // 黄色
  any: '#bfbfbf',       // 灰色
  dataframe: '#722ed1', // 紫色
  object: '#13c2c2',    // 青色
  // 可根据需要扩展更多类型
};

// 端口数据类型到形状的映射，用于端口可视化
const dataTypeToShape: Record<string, React.CSSProperties> = {
  number: { borderRadius: '50%' }, // 圆形
  string: { borderRadius: '20%' }, // 方形
  boolean: { transform: 'rotate(45deg)', borderRadius: '10%' }, // 菱形
  any: { borderRadius: '50%', opacity: 0.7 }, // 半透明圆形
  dataframe: { borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }, // 椭圆/特殊形状
  object: { borderRadius: '10%' }, // 轻微圆角方形
  // 可根据需要扩展更多类型
};

// 自定义节点组件
const CustomNode = ({ data, selected }: NodeProps) => {
  // 使用更安全的类型断言
  const nodeData = data as unknown as CustomNodeData;
  
  // 根据模块类型获取颜色
  const getNodeColor = () => {
    if (nodeData.color) {
      return nodeData.color;
    }
    // ModuleType 现在在 moduleDefinitions.ts 中定义，确保 getColorByModuleType 使用它或有自己的逻辑
    // 假设 getColorByModuleType 仍然有效，或者 nodeData.type 是一个 ModuleType 枚举兼容的字符串
    return getColorByModuleType(nodeData.type as ModuleType); 
  };

  // 动态计算输入输出端口数量和定义
  const activeVariant = nodeData.availableVariants?.find(v => v.variant_id === nodeData.currentVariantId);
  const displayablePorts = activeVariant?.port_definitions.filter(pd => {
    if (!pd.is_optional) return true;
    return nodeData.activePortsConfig?.[pd.name] ?? pd.default_enabled;
  }) || [];

  const inputPorts = displayablePorts.filter(p => p.port_io_type === 'input');
  const outputPorts = displayablePorts.filter(p => p.port_io_type === 'output');

  const inputCount = inputPorts.length;
  const outputCount = outputPorts.length;

  // 节点颜色
  const nodeColor = getNodeColor();
  
  // 渲染输入端口
  const renderInputHandles = () => {
    const handles = [];
    for (let i = 0; i < inputCount; i++) {
      const portDef = inputPorts[i];
      const position = inputCount > 1 
        ? { top: `${25 + (i * 50 / (inputCount - 1))}%` } // 保持原有百分比定位逻辑
        : { top: '50%' };
      // 根据端口数据类型设置颜色和形状
      const portColor = dataTypeToColor[portDef.data_type] || '#bfbfbf';
      const portShape = dataTypeToShape[portDef.data_type] || { borderRadius: '50%' };
      handles.push(
        <Handle
          key={`input-${portDef.name}`}
          type="target"
          position={Position.Left}
          id={portDef.name} // 使用端口名称作为 Handle ID
          style={{
            ...position,
            background: portColor, // 根据端口类型设置颜色
            width: 16,
            height: 16,
            border: '2px solid #fff',
            boxShadow: '0 0 2px #888',
            ...portShape, // 根据端口类型设置形状
          }}
          title={`类型: ${portDef.data_type}${portDef.description ? ' | ' + portDef.description : ''}`}
        />
      );
    }
    return handles;
  };
  
  // 渲染输出端口
  const renderOutputHandles = () => {
    const handles = [];
    for (let i = 0; i < outputCount; i++) {
      const portDef = outputPorts[i];
      const position = outputCount > 1 
        ? { top: `${25 + (i * 50 / (outputCount - 1))}%` }
        : { top: '50%' };
      // 根据端口数据类型设置颜色和形状
      const portColor = dataTypeToColor[portDef.data_type] || '#bfbfbf';
      const portShape = dataTypeToShape[portDef.data_type] || { borderRadius: '50%' };
      handles.push(
        <Handle
          key={`output-${portDef.name}`}
          type="source"
          position={Position.Right}
          id={portDef.name} // 使用端口名称作为 Handle ID
          style={{
            ...position,
            background: portColor, // 根据端口类型设置颜色
            width: 16,
            height: 16,
            border: '2px solid #fff',
            boxShadow: '0 0 2px #888',
            ...portShape, // 根据端口类型设置形状
          }}
          title={`类型: ${portDef.data_type}${portDef.description ? ' | ' + portDef.description : ''}`}
          isConnectable={true}
        />
      );
    }
    return handles;
  };

  return (
    <div
      className="custom-node"
      style={{
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: selected ? '#555' : nodeColor,
        borderRadius: 8,
        padding: 10,
        width: 180,
        backgroundColor: '#fff',
        boxShadow: selected ? '0 0 0 2px #555' : '0 2px 5px rgba(0,0,0,0.1)',
      }}
    >
      {/* 输入端口 */}
      {renderInputHandles()}
      
      {/* 节点内容 */}
      <div
        className="custom-node-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 8,
          padding: '5px 8px',
          backgroundColor: nodeColor,
          color: '#fff',
          borderRadius: 4,
        }}
      >
        <span style={{ marginRight: 8, fontSize: 20 }}>{nodeData.icon}</span>
        <div style={{ fontWeight: 'bold', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {nodeData.label || nodeData.name}
        </div>
      </div>
      
      {/* 节点描述 */}
      {nodeData.description && (
        <div
          className="custom-node-description"
          style={{
            fontSize: 12,
            color: '#666',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {nodeData.description}
        </div>
      )}
      
      {/* 输出端口 */}
      {renderOutputHandles()}
    </div>
  );
};

// 使用memo优化性能
export default memo(CustomNode); 