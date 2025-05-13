import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ModuleType, getColorByModuleType } from '../../../models/moduleDefinitions';

// 自定义节点数据接口
interface CustomNodeData {
  id: string;
  name: string;
  icon: string;
  type: string;
  label?: string;
  description?: string;
  inputs?: number;
  outputs?: number;
  color?: string;
}

// 自定义节点组件
const CustomNode = ({ data, selected }: NodeProps) => {
  // 使用更安全的类型断言
  const nodeData = data as unknown as CustomNodeData;
  
  // 根据模块类型获取颜色
  const getNodeColor = () => {
    if (nodeData.color) {
      return nodeData.color;
    }
    
    switch (nodeData.type) {
      case ModuleType.SOURCE:
        return '#2196f3'; // 蓝色
      case ModuleType.PROCESSOR:
        return '#ff9800'; // 橙色
      case ModuleType.ANALYZER:
        return '#9c27b0'; // 紫色
      case ModuleType.VISUALIZATION:
        return '#4caf50'; // 绿色
      case ModuleType.OUTPUT:
        return '#f44336'; // 红色
      default:
        return '#607d8b'; // 默认灰色
    }
  };

  // 计算输入输出端口数量
  const inputCount = nodeData.inputs !== undefined ? nodeData.inputs : (nodeData.type === ModuleType.SOURCE ? 0 : 1);
  const outputCount = nodeData.outputs !== undefined ? nodeData.outputs : (nodeData.type === ModuleType.OUTPUT || nodeData.type === ModuleType.VISUALIZATION ? 0 : 1);

  // 节点颜色
  const nodeColor = getNodeColor();
  
  // 渲染输入端口
  const renderInputHandles = () => {
    const handles = [];
    for (let i = 0; i < inputCount; i++) {
      const position = inputCount > 1 
        ? { top: `${25 + (i * 50 / (inputCount - 1))}%` }
        : { top: '50%' };
      
      handles.push(
        <Handle
          key={`input-${i}`}
          type="target"
          position={Position.Left}
          id={`input-${i}`}
          style={{
            ...position,
            background: nodeColor,
          }}
        />
      );
    }
    return handles;
  };
  
  // 渲染输出端口
  const renderOutputHandles = () => {
    const handles = [];
    for (let i = 0; i < outputCount; i++) {
      const position = outputCount > 1 
        ? { top: `${25 + (i * 50 / (outputCount - 1))}%` }
        : { top: '50%' };
      
      handles.push(
        <Handle
          key={`output-${i}`}
          type="source"
          position={Position.Right}
          id={`output-${i}`}
          style={{
            ...position,
            background: nodeColor,
          }}
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