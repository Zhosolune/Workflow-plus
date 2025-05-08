import React, { useState, useRef, useEffect } from 'react';
import { Layout, Button, Space, theme } from 'antd';
import {
  PlusOutlined,
  FolderOpenOutlined,
  SaveOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import ModuleLibrary from './ModuleLibrary';
import Canvas from './Canvas';
import PropertyPanel from './PropertyPanel';
import StatusBar from './StatusBar';

const { Header, Footer, Content } = Layout;

// 初始卡片宽度
const INITIAL_CARD_WIDTH = 280;
// 最小卡片宽度
const MIN_CARD_WIDTH = 200;
// 最大卡片宽度
const MAX_CARD_WIDTH = 600;
// 最小间距
const MIN_SPACING = 10;
// 左右边距
const SIDE_MARGIN = 10;
// 额外安全距离
const EXTRA_MARGIN = 60;

/**
 * 工作流设计器页面
 * 包含顶部操作栏、模块库、画布和属性面板
 */
const WorkflowDesigner: React.FC = () => {
  const { token } = theme.useToken();
  // 当前选中的节点
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  // 工作流状态
  const [workflowStatus, setWorkflowStatus] = useState({
    saved: true,
    nodeCount: 0,
    edgeCount: 0,
  });

  // 模块库和属性面板的宽度状态
  const [moduleLibraryWidth, setModuleLibraryWidth] = useState(INITIAL_CARD_WIDTH);
  const [propertyPanelWidth, setPropertyPanelWidth] = useState(INITIAL_CARD_WIDTH);
  
  // 存储卡片宽度比例（相对于两个卡片的总宽度）
  const [widthRatio, setWidthRatio] = useState({
    moduleLibrary: 0.5, // 初始默认比例
    propertyPanel: 0.5,
  });
  
  // 存储两个卡片的初始总宽度
  const [totalCardsWidth, setTotalCardsWidth] = useState(INITIAL_CARD_WIDTH * 2);
  
  // 标记是否是首次渲染
  const [isFirstRender, setIsFirstRender] = useState(true);
  
  // 内容区域的引用，用于获取其宽度
  const contentRef = useRef<HTMLDivElement>(null);
  // 内容区域的宽度状态
  const [contentWidth, setContentWidth] = useState(0);
  // 上一次内容区域的宽度，用于计算变化率
  const prevContentWidthRef = useRef(0);
  
  // 初始化宽度比例和标记首次渲染已完成
  useEffect(() => {
    if (contentWidth > 0 && isFirstRender) {
      // 设置初始宽度比例
      setWidthRatio({
        moduleLibrary: 0.5,
        propertyPanel: 0.5,
      });
      
      // 存储当前内容宽度作为参考
      prevContentWidthRef.current = contentWidth;
      
      // 标记首次渲染已完成
      setIsFirstRender(false);
    }
  }, [contentWidth, isFirstRender]);
  
  // 监听内容区域的大小变化
  useEffect(() => {
    if (!contentRef.current) return;
    
    // 初始化内容区域宽度
    setContentWidth(contentRef.current.clientWidth);
    
    // 创建ResizeObserver监听内容区域大小变化
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        setContentWidth(newWidth);
        
        // 只有在非首次渲染时才执行调整逻辑
        if (!isFirstRender && prevContentWidthRef.current > 0 && newWidth !== prevContentWidthRef.current) {
          // 计算可用空间（考虑最小间距和左右边距）
          const totalMargin = SIDE_MARGIN * 2 + MIN_SPACING + EXTRA_MARGIN;
          const availableSpace = Math.max(0, newWidth - totalMargin);
          
          // 如果窗口变小，可能需要调整卡片宽度
          if (newWidth < prevContentWidthRef.current) {
            // 计算当前卡片总宽度
            const currentTotalWidth = moduleLibraryWidth + propertyPanelWidth;
            
            // 只有当当前卡片总宽度超过可用空间时，才需要缩小卡片
            if (currentTotalWidth > availableSpace) {
              // 计算需要缩减的总宽度
              const reductionNeeded = currentTotalWidth - availableSpace;
              
              // 按比例分配缩减量
              let newModuleLibraryWidth = moduleLibraryWidth - (reductionNeeded * widthRatio.moduleLibrary);
              let newPropertyPanelWidth = propertyPanelWidth - (reductionNeeded * widthRatio.propertyPanel);
              
              // 确保不会小于最小宽度
              newModuleLibraryWidth = Math.max(MIN_CARD_WIDTH, newModuleLibraryWidth);
              newPropertyPanelWidth = Math.max(MIN_CARD_WIDTH, newPropertyPanelWidth);
              
              // 检查调整后的总宽度是否仍然超过可用空间
              const adjustedTotalWidth = newModuleLibraryWidth + newPropertyPanelWidth;
              if (adjustedTotalWidth > availableSpace) {
                // 如果仍然超过，需要进一步调整
                // 优先保证一个卡片达到最小宽度，另一个卡片尽可能大
                if (availableSpace >= MIN_CARD_WIDTH * 2) {
                  // 如果可用空间足够容纳两个最小宽度的卡片
                  // 计算可分配的额外空间
                  const extraSpace = availableSpace - MIN_CARD_WIDTH * 2;
                  
                  // 按比例分配额外空间
                  newModuleLibraryWidth = MIN_CARD_WIDTH + (extraSpace * widthRatio.moduleLibrary);
                  newPropertyPanelWidth = MIN_CARD_WIDTH + (extraSpace * widthRatio.propertyPanel);
                } else {
                  // 如果可用空间不足以容纳两个最小宽度的卡片
                  // 保持最小宽度，不再缩小
                  newModuleLibraryWidth = MIN_CARD_WIDTH;
                  newPropertyPanelWidth = MIN_CARD_WIDTH;
                }
              }
              
              // 更新卡片宽度
              setModuleLibraryWidth(newModuleLibraryWidth);
              setPropertyPanelWidth(newPropertyPanelWidth);
            }
            // 如果当前卡片总宽度小于可用空间，则保持卡片宽度不变
          } else if (newWidth > prevContentWidthRef.current) {
            // 如果窗口变大，可以选择按比例扩展卡片
            // 但我们只在总宽度小于原始总宽度时才扩展
            const currentTotalWidth = moduleLibraryWidth + propertyPanelWidth;
            
            if (currentTotalWidth < totalCardsWidth && availableSpace > currentTotalWidth) {
              // 计算可扩展的最大宽度（不超过原始总宽度）
              const maxExpandWidth = Math.min(availableSpace, totalCardsWidth);
              
              // 计算可以增加的总宽度
              const expansionPossible = maxExpandWidth - currentTotalWidth;
              
              // 按比例分配增加量
              let newModuleLibraryWidth = moduleLibraryWidth + (expansionPossible * widthRatio.moduleLibrary);
              let newPropertyPanelWidth = propertyPanelWidth + (expansionPossible * widthRatio.propertyPanel);
              
              // 应用最大宽度限制
              newModuleLibraryWidth = Math.min(newModuleLibraryWidth, MAX_CARD_WIDTH);
              newPropertyPanelWidth = Math.min(newPropertyPanelWidth, MAX_CARD_WIDTH);
              
              // 更新卡片宽度
              setModuleLibraryWidth(newModuleLibraryWidth);
              setPropertyPanelWidth(newPropertyPanelWidth);
            }
          }
        }
        
        // 更新上一次的内容宽度
        prevContentWidthRef.current = newWidth;
      }
    });
    
    resizeObserver.observe(contentRef.current);
    
    // 清理函数
    return () => {
      if (contentRef.current) {
        resizeObserver.unobserve(contentRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [isFirstRender, widthRatio, totalCardsWidth, moduleLibraryWidth, propertyPanelWidth]);
  
  // 处理模块库宽度调整
  const handleModuleLibraryResize = (newWidth: number) => {
    // 计算最大允许宽度，确保与属性面板之间的最小间距为10px
    const totalMargin = SIDE_MARGIN * 2 + MIN_SPACING + EXTRA_MARGIN;
    const maxAllowedWidth = Math.min(
      contentWidth - propertyPanelWidth - totalMargin,
      MAX_CARD_WIDTH
    );
    
    // 限制宽度在允许范围内，确保不小于最小宽度
    const limitedWidth = Math.max(MIN_CARD_WIDTH, Math.min(newWidth, maxAllowedWidth));
    
    // 更新宽度状态
    setModuleLibraryWidth(limitedWidth);
    
    // 更新总宽度和宽度比例
    const newTotalWidth = limitedWidth + propertyPanelWidth;
    setTotalCardsWidth(newTotalWidth);
    
    // 更新宽度比例（相对于总宽度）
    setWidthRatio({
      moduleLibrary: limitedWidth / newTotalWidth,
      propertyPanel: propertyPanelWidth / newTotalWidth,
    });
  };
  
  // 处理属性面板宽度调整
  const handlePropertyPanelResize = (newWidth: number) => {
    // 计算最大允许宽度，确保与模块库之间的最小间距为10px
    const totalMargin = SIDE_MARGIN * 2 + MIN_SPACING + EXTRA_MARGIN;
    const maxAllowedWidth = Math.min(
      contentWidth - moduleLibraryWidth - totalMargin,
      MAX_CARD_WIDTH
    );
    
    // 限制宽度在允许范围内，确保不小于最小宽度
    const limitedWidth = Math.max(MIN_CARD_WIDTH, Math.min(newWidth, maxAllowedWidth));
    
    // 更新宽度状态
    setPropertyPanelWidth(limitedWidth);
    
    // 更新总宽度和宽度比例
    const newTotalWidth = moduleLibraryWidth + limitedWidth;
    setTotalCardsWidth(newTotalWidth);
    
    // 更新宽度比例（相对于总宽度）
    setWidthRatio({
      moduleLibrary: moduleLibraryWidth / newTotalWidth,
      propertyPanel: limitedWidth / newTotalWidth,
    });
  };

  // 处理节点选择
  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
  };

  // 处理新建工作流
  const handleNew = () => {
    // 清空当前画布
    setWorkflowStatus({
      saved: true,
      nodeCount: 0,
      edgeCount: 0,
    });
    setSelectedNode(null);
  };

  // 处理打开工作流
  const handleOpen = () => {
    // 模拟打开工作流
    console.log('打开工作流');
  };

  // 处理保存工作流
  const handleSave = () => {
    // 模拟保存工作流
    console.log('保存工作流');
    setWorkflowStatus({
      ...workflowStatus,
      saved: true,
    });
  };

  // 处理运行工作流
  const handleRun = () => {
    // 模拟运行工作流
    console.log('运行工作流');
  };

  // 更新工作流状态
  const updateWorkflowStatus = (status: Partial<typeof workflowStatus>) => {
    setWorkflowStatus({ ...workflowStatus, ...status });
  };

  // 强制使用初始宽度
  useEffect(() => {
    // 确保初始宽度设置为INITIAL_CARD_WIDTH
    if (isFirstRender) {
      setModuleLibraryWidth(INITIAL_CARD_WIDTH);
      setPropertyPanelWidth(INITIAL_CARD_WIDTH);
    }
  }, [isFirstRender]);

  return (
    <Layout className="workflow-designer" style={{ height: '100%' }}>
      {/* 顶部操作栏 */}
      <Header
        style={{
          background: '#fff',
          padding: '0 20px',
          boxShadow: `0 2px 8px -3px ${token.colorBorderSecondary}`,
          height: '60px',
          lineHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: 0,
          flexShrink: 0,  //防止 Header 被压缩
        }}
      >
        <div 
          style={{ 
            paddingTop: '0px',
            fontSize: '18px', 
            color: '#000',
          }}
        >
          <span>模块化工作流设计器</span>
        </div>
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
      </Header>

      {/* 主内容区 */}
      <Content 
        ref={contentRef}
        style={{ 
          position: 'relative', 
          flex: 1,
        }}>
        {/* 画布 */}
        <Canvas
          onNodeSelect={handleNodeSelect}
          updateWorkflowStatus={updateWorkflowStatus}
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
        />
      </Content>

      {/* 底部状态栏 */}
      <Footer 
        style={{ 
          padding: '0 16px', 
          height: '30px', 
          lineHeight: '30px', 
          background: '#f0f2f5', 
          margin: 0,
          fontSize: '14px',
          borderTop: '1px solid #e8e8e8',
          flexShrink: 0
        }}
      >
        <StatusBar status={workflowStatus} />
      </Footer>
    </Layout>
  );
};

export default WorkflowDesigner; 