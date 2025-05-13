import React, { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Select, Switch, Typography, Empty, ColorPicker } from 'antd';
import ResizeHandle from './ResizeHandle';
import { getModuleById, PropertyType, ModulePropertyDefinition } from '../../../models/moduleDefinitions';

const { Option } = Select;

// 属性面板Props接口
interface PropertyPanelProps {
  selectedNode: any | null;
  width: number;                      // 卡片宽度
  onResize: (newWidth: number) => void; // 调整大小回调
}

/**
 * 属性面板组件
 * 根据选中的节点类型，显示不同的属性配置选项
 */
const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedNode, width, onResize }) => {
  // 卡片位置状态
  const [rightPosition] = useState(10);
  // 表单实例
  const [form] = Form.useForm();
  
  // 当选中节点变化时，重置表单
  useEffect(() => {
    if (selectedNode) {
      form.resetFields();
      form.setFieldsValue({
        name: selectedNode.name || '',
        description: selectedNode.description || '',
        ...selectedNode.properties,
      });
    }
  }, [selectedNode, form]);
  
  // 处理表单值变更
  const handleValueChange = (changedValues: any) => {
    console.log('属性变更:', changedValues);
    // 在实际应用中，这里会更新节点属性
  };
  
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
    if (!selectedNode) {
      return (
        <Empty 
          description="选择一个节点查看属性" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }
    
    // 获取模块定义
    const moduleDefinition = getModuleById(selectedNode.id);
    
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
        initialValues={{
          name: selectedNode.name || '',
          description: selectedNode.description || '',
        }}
        onValuesChange={handleValueChange}
      >
        <Typography.Title level={5}>基本属性</Typography.Title>
        
        <Form.Item label="名称" name="name">
          <Input />
        </Form.Item>
        
        <Form.Item label="描述" name="description">
          <Input.TextArea rows={2} />
        </Form.Item>
        
        {moduleDefinition.properties.length > 0 && (
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