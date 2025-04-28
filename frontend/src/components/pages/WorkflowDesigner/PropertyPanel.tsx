import React from 'react';
import { Card, Form, Input, InputNumber, Select, Switch, Typography, Empty } from 'antd';

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
  // 处理表单值变更
  const handleValueChange = (changedValues: any) => {
    console.log('属性变更:', changedValues);
    // 在实际应用中，这里会更新节点属性
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

  return (
    <Card
      title="属性面板"
      style={{
        width: 280,
        position: 'absolute',
        right: 10,
        top: 10,
        bottom: 10,
        zIndex: 10,
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      bodyStyle={{ padding: '12px', overflow: 'auto', height: 'calc(100% - 57px)' }}
    >
      {renderPropertyForm()}
    </Card>
  );
};

export default PropertyPanel; 