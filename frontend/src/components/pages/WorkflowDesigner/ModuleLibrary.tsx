import React, { useState } from 'react';
import { Card, Input, Collapse, List, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useDraggable } from '@dnd-kit/core';

const { Panel } = Collapse;
const { Search } = Input;

// 模块分类和模块数据
const moduleCategories = [
  {
    key: 'data-source',
    title: '数据源',
    modules: [
      { id: 'csv-file', name: 'CSV文件读取', icon: '📄', type: 'source' },
      { id: 'database', name: '数据库连接', icon: '🗃️', type: 'source' },
      { id: 'input', name: '图像输入', icon: '🖼️', type: 'source' },
    ],
  },
  {
    key: 'data-processing',
    title: '数据处理',
    modules: [
      { id: 'data-cut', name: '数据切片', icon: '✂️', type: 'processor' },
      { id: 'data-filter', name: '数据过滤', icon: '🔍', type: 'processor' },
      { id: 'data-transform', name: '数据转换', icon: '🔄', type: 'processor' },
    ],
  },
  {
    key: 'analysis-tools',
    title: '分析工具',
    modules: [
      { id: 'kmeans', name: 'K-Means聚类', icon: '📊', type: 'analyzer' },
      { id: 'correlation', name: '相关分析', icon: '📈', type: 'analyzer' },
      { id: 'pca', name: 'PCA降维', icon: '📉', type: 'analyzer' },
    ],
  },
  {
    key: 'visualization',
    title: '可视化',
    modules: [
      { id: 'scatter-plot', name: '散点图', icon: '📍', type: 'viz' },
      { id: 'bar-chart', name: '柱状图', icon: '📊', type: 'viz' },
      { id: 'line-chart', name: '折线图', icon: '📈', type: 'viz' },
    ],
  },
  {
    key: 'output',
    title: '输出',
    modules: [
      { id: 'result-save', name: '结果保存', icon: '💾', type: 'output' },
      { id: 'report', name: '报告生成', icon: '📃', type: 'output' },
    ],
  },
];

// 可拖拽模块组件
const DraggableModule = ({ module }: { module: any }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: module.id,
    data: module,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="draggable-module"
      style={{
        padding: '8px',
        margin: '4px 0',
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: '4px',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <span style={{ marginRight: '8px', fontSize: '20px' }}>{module.icon}</span>
      <Typography.Text>{module.name}</Typography.Text>
    </div>
  );
};

/**
 * 模块库组件
 * 展示可拖拽的工作流模块
 */
const ModuleLibrary: React.FC = () => {
  // 搜索关键词
  const [searchValue, setSearchValue] = useState('');
  
  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
  };
  
  // 过滤模块
  const getFilteredModules = (modules: any[]) => {
    if (!searchValue) return modules;
    return modules.filter(module => 
      module.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  return (
    <Card
      title="模块库"
      style={{
        width: 280,
        position: 'absolute',
        left: 10,
        top: 10,
        bottom: 10,
        zIndex: 10,
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}
      styles={{ body: { padding: '8px', overflow: 'auto', height: 'calc(100% - 57px)' } }}
    >
      {/* 搜索框 */}
      <Search
        placeholder="搜索模块..."
        onSearch={handleSearch}
        onChange={(e) => handleSearch(e.target.value)}
        style={{ marginBottom: 8 }}
        prefix={<SearchOutlined />}
      />
      
      {/* 模块分类 */}
      <Collapse defaultActiveKey={['data-source']} ghost items={
        moduleCategories.map((category) => {
          const filteredModules = getFilteredModules(category.modules);
          
          // 如果搜索后没有匹配的模块，则不显示此分类
          if (searchValue && filteredModules.length === 0) {
            return null;
          }
          
          return {
            key: category.key,
            label: category.title,
            children: (
              <List
                dataSource={filteredModules}
                renderItem={(module) => (
                  <List.Item style={{ padding: 0 }}>
                    <DraggableModule module={module} />
                  </List.Item>
                )}
              />
            )
          };
        }).filter(Boolean)
      } />
    </Card>
  );
};

export default ModuleLibrary;