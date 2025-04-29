import React, { useState } from 'react';
import { Card, Form, Input, InputNumber, Select, Switch, Typography, Empty } from 'antd';
import ResizeHandle from './ResizeHandle';

const { Option } = Select;

// 属性面板Props接口
interface PropertyPanelProps {
  selectedNode: any | null;
}

/**
 * 属性面板组件
 * 根据选中的节点类型，显示不同的属性配置选项
 */
const PropertyPanel: React.FC<PropertyPanelProps> = ({ selectedNode }) => {
  // 卡片宽度和位置状态
  const [width, setWidth] = useState(280);
  const [rightPosition, setRightPosition] = useState(10);
  
  // 处理表单值变更
  const handleValueChange = (changedValues: any) => {
    console.log('属性变更:', changedValues);
    // 在实际应用中，这里会更新节点属性
  };
  
  // 处理拖拽调整大小 - 直接设置新宽度
  const handleResize = (newWidth: number) => {
    setWidth(newWidth);
    // 保持右侧位置不变
    setRightPosition(10);
  };
  
  // 根据节点类型渲染不同的属性表单
  const renderPropertyForm = () => {
    if (!selectedNode) {
      return (
        <Empty 
          description="选择一个节点查看属性" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
        />
      );
    }
    
    // 根据节点类型显示不同的属性表单
    switch (selectedNode.type) {
      case 'analyzer':
        if (selectedNode.id === 'kmeans') {
          return renderKMeansForm();
        }
        return renderGenericForm();
      case 'source':
      case 'processor':
      case 'viz':
      case 'output':
      default:
        return renderGenericForm();
    }
  };
  
  // 渲染K-Means模块的属性表单
  const renderKMeansForm = () => {
    return (
      <Form
        layout="vertical"
        initialValues={{
          k: 3,
          maxIterations: 100,
          seed: 42,
          initMethod: 'kmeans++',
          preprocessing: 'standardization',
          distanceFunction: 'euclidean',
        }}
        onValuesChange={handleValueChange}
      >
        <Typography.Title level={5}>聚类参数</Typography.Title>
        
        <Form.Item label="聚类数量(k值)" name="k">
          <InputNumber min={1} max={100} />
        </Form.Item>
        
        <Form.Item label="最大迭代次数" name="maxIterations">
          <InputNumber min={10} max={1000} />
        </Form.Item>
        
        <Form.Item label="随机种子" name="seed">
          <InputNumber />
        </Form.Item>
        
        <Form.Item label="初始化方法" name="initMethod">
          <Select>
            <Option value="kmeans++">K-means++</Option>
            <Option value="random">随机初始化</Option>
          </Select>
        </Form.Item>
        
        <Form.Item label="预处理方式" name="preprocessing">
          <Select>
            <Option value="standardization">标准化</Option>
            <Option value="normalization">归一化</Option>
            <Option value="none">无</Option>
          </Select>
        </Form.Item>
        
        <Form.Item label="距离函数" name="distanceFunction">
          <Select>
            <Option value="euclidean">欧氏距离</Option>
            <Option value="manhattan">曼哈顿距离</Option>
            <Option value="cosine">余弦距离</Option>
          </Select>
        </Form.Item>
      </Form>
    );
  };
  
  // 渲染通用属性表单
  const renderGenericForm = () => {
    return (
      <Form
        layout="vertical"
        initialValues={{
          name: selectedNode?.name || '',
          description: '',
          enabled: true,
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
        
        <Form.Item label="启用" name="enabled" valuePropName="checked">
          <Switch />
        </Form.Item>
        
        {/* 根据节点类型动态添加更多属性 */}
        {selectedNode && selectedNode.type === 'source' && (
          <>
            <Typography.Title level={5}>数据源配置</Typography.Title>
            <Form.Item label="路径" name="path">
              <Input />
            </Form.Item>
          </>
        )}
        
        {selectedNode && selectedNode.type === 'processor' && (
          <>
            <Typography.Title level={5}>处理参数</Typography.Title>
            <Form.Item label="批处理大小" name="batchSize">
              <InputNumber min={1} />
            </Form.Item>
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
      
      {/* 添加拖拽手柄，调整位置到Card左侧边缘 */}
      <ResizeHandle 
        position="left" 
        width={width}
        onResize={handleResize}
        minWidth={200}
        maxWidth={600}
      />
    </div>
  );
};

export default PropertyPanel; 