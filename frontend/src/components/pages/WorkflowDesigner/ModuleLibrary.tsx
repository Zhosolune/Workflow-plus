import React, { useState } from 'react';
import { Card, Input, Collapse, List, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useDraggable } from '@dnd-kit/core';
import ResizeHandle from './ResizeHandle';
import { 
  MODULE_CATEGORIES, 
  MODULE_DEFINITIONS, 
  getModulesByCategory,
  ModuleDefinition
} from '../../../models/moduleDefinitions';

const { Panel } = Collapse;
const { Search } = Input;

// 可拖拽模块组件
const DraggableModule = ({ module }: { module: ModuleDefinition }) => {
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

// 模块库组件属性接口
interface ModuleLibraryProps {
  width: number;                      // 卡片宽度
  onResize: (newWidth: number) => void; // 调整大小回调
}

/**
 * 模块库组件
 * 展示可拖拽的工作流模块
 */
const ModuleLibrary: React.FC<ModuleLibraryProps> = ({ width, onResize }) => {
  // 搜索关键词
  const [searchValue, setSearchValue] = useState('');
  
  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
  };
  
  // 过滤模块
  const getFilteredModules = (categoryKey: string) => {
    const modules = getModulesByCategory(categoryKey);
    if (!searchValue) return modules;
    return modules.filter(module => 
      module.name.toLowerCase().includes(searchValue.toLowerCase())
    );
  };

  // 为 Collapse 组件准备 items
  const collapseItems = MODULE_CATEGORIES.map((category) => {
    const filteredModules = getFilteredModules(category.key);

    // 如果搜索后没有匹配的模块，则不生成此分类的 item
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
      ),
    };
  }).filter(item => item !== null); // 过滤掉 null 项

  // 计算卡片位置和样式
  const cardStyle = {
    width: width,
    position: 'absolute' as const,
    left: 10,
    top: 10,
    bottom: 10,
    zIndex: 10,
    borderRadius: '4px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  };

  // 父容器样式，添加相同的尺寸和位置
  const containerStyle = {
    position: 'absolute' as const,
    left: 10,
    top: 10,
    bottom: 10,
    width: width,
    zIndex: 10,
  };

  return (
    <div style={containerStyle}>
      <Card
        title="模块库"
        style={cardStyle}
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
        
        {/* 使用新的API方式渲染Collapse组件 */}
        <Collapse 
          defaultActiveKey={['data-source']} 
          ghost 
          items={collapseItems}
        />
      </Card>
      
      {/* 添加拖拽手柄，位置调整到Card右侧边缘 */}
      <ResizeHandle
        position="right"
        width={width}
        onResize={onResize}
        minWidth={200}
        maxWidth={600}
      />
    </div>
  );
};

export default ModuleLibrary;