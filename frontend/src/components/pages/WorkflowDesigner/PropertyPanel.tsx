import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, InputNumber, Select, Switch, Typography, Empty, ColorPicker, Checkbox } from 'antd';
import ResizeHandle from './ResizeHandle';
import { getModuleById, PropertyType, ModulePropertyDefinition, VariantDefinitionFE, PortDefinitionFE } from '../../../models/moduleDefinitions';
import { CustomNodeData } from './CustomNode';

const { Option } = Select;

// 属性面板Props接口
interface PropertyPanelProps {
  selectedNode: { data: CustomNodeData, id: string } | null;
  width: number;                      
  onResize: (newWidth: number) => void; 
  onNodeDataChange: (nodeId: string, newNodeData: Partial<CustomNodeData>) => void;
}

/**
 * 属性面板组件
 * 根据选中的节点类型，显示不同的属性配置选项
 */
const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedNode, width, onResize, onNodeDataChange }) => {
  // 卡片位置状态
  const [rightPosition] = useState(10);
  // 表单实例
  const [form] = Form.useForm();
  
  // 当选中节点变化时，重置表单
  useEffect(() => {
    if (selectedNode && selectedNode.data) {
      form.resetFields();
      // 关键改动：如果 selectedNode.data.moduleDef 存在，则表示是预览模式
      // 否则是实际画布节点
      const moduleDefinitionToUse = selectedNode.data.moduleDef || getModuleById(selectedNode.data.id);
      
      // 确保我们有一个有效的模块定义来填充表单
      // 对于预览，moduleDefinitionToUse 应该是 moduleDef
      // 对于实际节点，它应该是从 getModuleById 获取的，或者也可能已经存在于 selectedNode.data.moduleDef (如果创建节点时填充了)
      if (moduleDefinitionToUse) {
        form.setFieldsValue({
          name: selectedNode.data.name || moduleDefinitionToUse.name || '', // 优先使用节点实例的 name
          description: selectedNode.data.description || moduleDefinitionToUse.description || '', // 优先使用节点实例的 description
          currentVariantId: selectedNode.data.currentVariantId, // 这个应该总是来自 selectedNode.data
          ...selectedNode.data.properties, // 属性值来自节点实例
          ...(selectedNode.data.activePortsConfig || {}) // 端口配置来自节点实例
        });
      } else if (selectedNode.data.id?.startsWith('preview_')) {
        // 如果是预览模式但 moduleDef 丢失，至少填充基础信息
        // 但理想情况下，moduleDef 应该总是存在于预览数据中
        form.setFieldsValue({
          name: selectedNode.data.name || '',
          description: selectedNode.data.description || '',
          currentVariantId: selectedNode.data.currentVariantId,
          ...selectedNode.data.properties,
          ...(selectedNode.data.activePortsConfig || {})
        });
        console.warn("PropertyPanel: Preview mode, but moduleDef is missing in selectedNode.data. Falling back to basic info.");
      } else {
        // 对于非预览节点，如果 getModuleById 找不到，则是个问题
        console.warn(`PropertyPanel: Could not find module definition for ID: ${selectedNode.data.id}. Form might be incomplete.`);
        // 仍然尝试设置基础字段，以防万一
        form.setFieldsValue({
          name: selectedNode.data.name || '',
          description: selectedNode.data.description || '',
          // currentVariantId: selectedNode.data.currentVariantId, // 可能不存在
          ...selectedNode.data.properties,
          // ...(selectedNode.data.activePortsConfig || {}) // 可能不存在
        });
      }
    } else if (!selectedNode) {
      // 当没有选中节点时，Form 组件未渲染，不应调用 form.resetFields()
      // form.resetFields(); // Removed this line
    }
  }, [selectedNode, form]); // 保持 form 在依赖项中，因为 setFieldsValue 依赖它
  
  // 处理表单值变更（包括变体选择和端口启用/禁用）
  const handleValuesChange = useCallback((changedValues: any, allValues: any) => {
    if (!selectedNode) return;

    let newVariantId = selectedNode.data.currentVariantId;
    let newActivePortsConfig = { ...(selectedNode.data.activePortsConfig || {}) };
    let nodeDataChanged = false;

    // 检查是否是变体选择变化
    if ('currentVariantId' in changedValues) {
      newVariantId = changedValues.currentVariantId;
      // 当变体改变时，可能需要重置/更新 activePortsConfig
      const selectedVariant = selectedNode.data.availableVariants?.find(v => v.variant_id === newVariantId);
      if (selectedVariant) {
        const updatedConfig: { [key: string]: boolean } = {};
        selectedVariant.port_definitions.forEach(pd => {
          if (pd.is_optional) {
            // 保留现有的用户选择，如果端口仍然存在；否则使用新变体的默认值
            updatedConfig[pd.name] = newActivePortsConfig[pd.name] !== undefined 
                                      ? newActivePortsConfig[pd.name] 
                                      : pd.default_enabled;
          }
        });
        newActivePortsConfig = updatedConfig;
         // 更新表单以反映新的可选端口配置
        form.setFieldsValue(newActivePortsConfig);
      }
      nodeDataChanged = true;
    }

    // 检查是否是可选端口的启用状态变化
    // 可选端口的表单项名称就是端口名
    const currentSelectedVariant = selectedNode.data.availableVariants?.find(v => v.variant_id === newVariantId);
    currentSelectedVariant?.port_definitions.forEach(pd => {
      if (pd.is_optional && pd.name in changedValues) {
        newActivePortsConfig[pd.name] = changedValues[pd.name];
        nodeDataChanged = true;
      }
    });
    
    // 更新通用属性如 name, description 和自定义参数
    const newProperties = { ...selectedNode.data.properties };
    let propertiesChanged = false;
    for (const key in changedValues) {
        if (key !== 'currentVariantId' && !currentSelectedVariant?.port_definitions.some(pd => pd.is_optional && pd.name === key)) {
            // @ts-ignore
            newProperties[key] = changedValues[key];
            propertiesChanged = true;
        }
    }

    if (nodeDataChanged || propertiesChanged ) {
      onNodeDataChange(selectedNode.id, {
        name: allValues.name, // 从 allValues 获取最新值
        description: allValues.description, // 从 allValues 获取最新值
        properties: newProperties,
        currentVariantId: newVariantId,
        activePortsConfig: newActivePortsConfig,
      });
    }
  }, [selectedNode, onNodeDataChange, form]);
  
  // 根据属性类型渲染表单项
  const renderFormItem = (property: ModulePropertyDefinition) => {
    switch (property.type) {
      case PropertyType.STRING:
        return <Input placeholder={`请输入${property.name}`} />;
      
      case PropertyType.NUMBER:
        return (
          <InputNumber 
            min={property.min} 
            max={property.max} 
            placeholder={`请输入${property.name}`} 
            style={{ width: '100%' }}
          />
        );
      
      case PropertyType.BOOLEAN:
        return <Switch />;
      
      case PropertyType.SELECT:
        return (
          <Select placeholder={`请选择${property.name}`}>
            {property.options?.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
      
      case PropertyType.FILE:
        return <Input placeholder="请选择文件路径" />;
      
      case PropertyType.COLOR:
        return <ColorPicker />;
      
      case PropertyType.TEXT:
        return <Input.TextArea rows={4} placeholder={`请输入${property.name}`} />;
      
      default:
        return <Input placeholder={`请输入${property.name}`} />;
    }
  };
  
  // 渲染属性表单
  const renderPropertyForm = () => {
    if (!selectedNode || !selectedNode.data) {
      return (
        <Empty 
          description="选择一个节点查看属性" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }
    
    // nodeData from selectedNode.data
    const nodeData = selectedNode.data;

    // 获取模块定义
    // 关键改动：优先使用 nodeData.moduleDef (来自预览或已加载的节点数据)
    // 否则回退到 getModuleById (主要用于已存在于画布但未预加载 moduleDef 的旧节点，或者如果这种场景仍然需要支持)
    const moduleDefinition = nodeData.moduleDef || getModuleById(nodeData.id);
    
    const currentSelectedVariant = nodeData.availableVariants?.find((variant: VariantDefinitionFE) => variant.variant_id === nodeData.currentVariantId);

    if (!moduleDefinition) {
      return (
        <Empty 
          description="未找到模块定义" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }
    
    return (
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Typography.Title level={5}>基本属性</Typography.Title>
        
        <Form.Item label="名称" name="name">
          <Input />
        </Form.Item>
        
        <Form.Item label="描述" name="description">
          <Input.TextArea rows={2} />
        </Form.Item>
        
        {/* 变体选择器和配置 */}
        {nodeData.availableVariants && nodeData.availableVariants.length > 0 && (
          <>
            <Typography.Title level={5}>变体配置</Typography.Title>
            <Form.Item label="选择变体" name="currentVariantId">
              <Select placeholder="选择一个模块变体">
                {nodeData.availableVariants.map((variant: VariantDefinitionFE) => (
                  <Option key={variant.variant_id} value={variant.variant_id}>
                    {variant.variant_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {/* 可选端口配置 */}
            {currentSelectedVariant && currentSelectedVariant.port_definitions.filter(pd => pd.is_optional).length > 0 && (
              <Form.Item label="可选端口">
                {currentSelectedVariant.port_definitions
                  .filter((pd: PortDefinitionFE) => pd.is_optional)
                  .map((pd: PortDefinitionFE) => (
                    <Form.Item key={pd.name} name={pd.name} valuePropName="checked" noStyle>
                       <Checkbox>{pd.description || pd.name}</Checkbox>
                    </Form.Item>
                  ))}
              </Form.Item>
            )}
          </>
        )}
        
        {/* 模块属性 */}
        {moduleDefinition && moduleDefinition.properties.length > 0 && (
          <>
            <Typography.Title level={5}>模块属性</Typography.Title>
            
            {moduleDefinition.properties.map(property => (
              <Form.Item 
                key={property.id} 
                label={property.name} 
                name={property.id}
                rules={[{ required: property.required, message: `请${property.type === PropertyType.SELECT ? '选择' : '输入'}${property.name}` }]}
                tooltip={property.description}
              >
                {renderFormItem(property)}
              </Form.Item>
            ))}
          </>
        )}
      </Form>
    );
  };

  // 计算卡片样式
  const cardStyle = {
    width: width,
    position: 'absolute' as const,
    right: rightPosition,
    top: 10,
    bottom: 10,
    zIndex: 10,
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  };

  // 计算父容器样式，确保与卡片大小相同
  const containerStyle = {
    position: 'absolute' as const,
    right: rightPosition,
    top: 10,
    bottom: 10,
    width: width,
    zIndex: 10,
  };

  return (
    <div style={containerStyle}>
      <Card
        title="属性面板"
        style={cardStyle}
        styles={{ body: { padding: '12px', overflow: 'auto', height: 'calc(100% - 57px)' } }}
      >
        {renderPropertyForm()}
      </Card>
      
      {/* 添加拖拽手柄，位置调整到Card左侧边缘 */}
      <ResizeHandle
        position="left"
        width={width}
        onResize={onResize}
        minWidth={250}
        maxWidth={600}
      />
    </div>
  );
};

export default PropertyPanel; 