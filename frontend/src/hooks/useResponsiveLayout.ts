import { useState, useRef, useEffect } from 'react';

// 常量定义
const gINITIAL_CARD_WIDTH = 280;  // 初始卡片宽度
const gMIN_CARD_WIDTH = 200;      // 最小卡片宽度
const gMAX_CARD_WIDTH = 600;      // 最大卡片宽度
const gMIN_SPACING = 10;          // 最小间距
const gSIDE_MARGIN = 10;          // 左右边距
const gEXTRA_MARGIN = 60;         // 额外安全距离

/**
 * 响应式布局Hook
 * 管理两个相邻卡片的宽度，并处理窗口大小变化时的响应式调整
 * 
 * @param contentRef - 内容容器的引用
 * @returns 包含卡片宽度、宽度调整函数等的对象
 */
export const useResponsiveLayout = (contentRef: React.RefObject<HTMLDivElement>) => {
  // 模块库和属性面板的宽度状态
  const [_moduleLibraryWidth, setModuleLibraryWidth] = useState(gINITIAL_CARD_WIDTH);
  const [_propertyPanelWidth, setPropertyPanelWidth] = useState(gINITIAL_CARD_WIDTH);
  
  // 存储卡片宽度比例（相对于两个卡片的总宽度）
  const [_widthRatio, setWidthRatio] = useState({
    moduleLibrary: 0.5, // 初始默认比例
    propertyPanel: 0.5,
  });
  
  // 存储两个卡片的初始总宽度
  const [_totalCardsWidth, setTotalCardsWidth] = useState(gINITIAL_CARD_WIDTH * 2);
  
  // 标记是否是首次渲染
  const [_isFirstRender, setIsFirstRender] = useState(true);
  
  // 内容区域的宽度状态
  const [_contentWidth, setContentWidth] = useState(0);
  
  // 上一次内容区域的宽度，用于计算变化率
  const _prevContentWidthRef = useRef(0);
  
  // 初始化宽度比例和标记首次渲染已完成
  useEffect(() => {
    if (_contentWidth > 0 && _isFirstRender) {
      // 设置初始宽度比例
      setWidthRatio({
        moduleLibrary: 0.5,
        propertyPanel: 0.5,
      });
      
      // 存储当前内容宽度作为参考
      _prevContentWidthRef.current = _contentWidth;
      
      // 标记首次渲染已完成
      setIsFirstRender(false);
    }
  }, [_contentWidth, _isFirstRender]);
  
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
        if (!_isFirstRender && _prevContentWidthRef.current > 0 && newWidth !== _prevContentWidthRef.current) {
          // 计算可用空间（考虑最小间距和左右边距）
          const totalMargin = gSIDE_MARGIN * 2 + gMIN_SPACING + gEXTRA_MARGIN;
          const availableSpace = Math.max(0, newWidth - totalMargin);
          
          // 如果窗口变小，可能需要调整卡片宽度
          if (newWidth < _prevContentWidthRef.current) {
            // 计算当前卡片总宽度
            const currentTotalWidth = _moduleLibraryWidth + _propertyPanelWidth;
            
            // 只有当当前卡片总宽度超过可用空间时，才需要缩小卡片
            if (currentTotalWidth > availableSpace) {
              // 计算需要缩减的总宽度
              const reductionNeeded = currentTotalWidth - availableSpace;
              
              // 按比例分配缩减量
              let newModuleLibraryWidth = _moduleLibraryWidth - (reductionNeeded * _widthRatio.moduleLibrary);
              let newPropertyPanelWidth = _propertyPanelWidth - (reductionNeeded * _widthRatio.propertyPanel);
              
              // 确保不会小于最小宽度
              newModuleLibraryWidth = Math.max(gMIN_CARD_WIDTH, newModuleLibraryWidth);
              newPropertyPanelWidth = Math.max(gMIN_CARD_WIDTH, newPropertyPanelWidth);
              
              // 检查调整后的总宽度是否仍然超过可用空间
              const adjustedTotalWidth = newModuleLibraryWidth + newPropertyPanelWidth;
              if (adjustedTotalWidth > availableSpace) {
                // 如果仍然超过，需要进一步调整
                // 优先保证一个卡片达到最小宽度，另一个卡片尽可能大
                if (availableSpace >= gMIN_CARD_WIDTH * 2) {
                  // 如果可用空间足够容纳两个最小宽度的卡片
                  // 计算可分配的额外空间
                  const extraSpace = availableSpace - gMIN_CARD_WIDTH * 2;
                  
                  // 按比例分配额外空间
                  newModuleLibraryWidth = gMIN_CARD_WIDTH + (extraSpace * _widthRatio.moduleLibrary);
                  newPropertyPanelWidth = gMIN_CARD_WIDTH + (extraSpace * _widthRatio.propertyPanel);
                } else {
                  // 如果可用空间不足以容纳两个最小宽度的卡片
                  // 保持最小宽度，不再缩小
                  newModuleLibraryWidth = gMIN_CARD_WIDTH;
                  newPropertyPanelWidth = gMIN_CARD_WIDTH;
                }
              }
              
              // 更新卡片宽度
              setModuleLibraryWidth(newModuleLibraryWidth);
              setPropertyPanelWidth(newPropertyPanelWidth);
            }
            // 如果当前卡片总宽度小于可用空间，则保持卡片宽度不变
          } else if (newWidth > _prevContentWidthRef.current) {
            // 如果窗口变大，可以选择按比例扩展卡片
            // 但我们只在总宽度小于原始总宽度时才扩展
            const currentTotalWidth = _moduleLibraryWidth + _propertyPanelWidth;
            
            if (currentTotalWidth < _totalCardsWidth && availableSpace > currentTotalWidth) {
              // 计算可扩展的最大宽度（不超过原始总宽度）
              const maxExpandWidth = Math.min(availableSpace, _totalCardsWidth);
              
              // 计算可以增加的总宽度
              const expansionPossible = maxExpandWidth - currentTotalWidth;
              
              // 按比例分配增加量
              let newModuleLibraryWidth = _moduleLibraryWidth + (expansionPossible * _widthRatio.moduleLibrary);
              let newPropertyPanelWidth = _propertyPanelWidth + (expansionPossible * _widthRatio.propertyPanel);
              
              // 应用最大宽度限制
              newModuleLibraryWidth = Math.min(newModuleLibraryWidth, gMAX_CARD_WIDTH);
              newPropertyPanelWidth = Math.min(newPropertyPanelWidth, gMAX_CARD_WIDTH);
              
              // 更新卡片宽度
              setModuleLibraryWidth(newModuleLibraryWidth);
              setPropertyPanelWidth(newPropertyPanelWidth);
            }
          }
        }
        
        // 更新上一次的内容宽度
        _prevContentWidthRef.current = newWidth;
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
  }, [_isFirstRender, _widthRatio, _totalCardsWidth, _moduleLibraryWidth, _propertyPanelWidth, contentRef]);
  
  // 处理模块库宽度调整
  const handleModuleLibraryResize = (newWidth: number) => {
    // 计算最大允许宽度，确保与属性面板之间的最小间距
    const totalMargin = gSIDE_MARGIN * 2 + gMIN_SPACING + gEXTRA_MARGIN;
    const maxAllowedWidth = Math.min(
      _contentWidth - _propertyPanelWidth - totalMargin,
      gMAX_CARD_WIDTH
    );
    
    // 限制宽度在允许范围内，确保不小于最小宽度
    const limitedWidth = Math.max(gMIN_CARD_WIDTH, Math.min(newWidth, maxAllowedWidth));
    
    // 更新宽度状态
    setModuleLibraryWidth(limitedWidth);
    
    // 更新总宽度和宽度比例
    const newTotalWidth = limitedWidth + _propertyPanelWidth;
    setTotalCardsWidth(newTotalWidth);
    
    // 更新宽度比例（相对于总宽度）
    setWidthRatio({
      moduleLibrary: limitedWidth / newTotalWidth,
      propertyPanel: _propertyPanelWidth / newTotalWidth,
    });
  };
  
  // 处理属性面板宽度调整
  const handlePropertyPanelResize = (newWidth: number) => {
    // 计算最大允许宽度，确保与模块库之间的最小间距
    const totalMargin = gSIDE_MARGIN * 2 + gMIN_SPACING + gEXTRA_MARGIN;
    const maxAllowedWidth = Math.min(
      _contentWidth - _moduleLibraryWidth - totalMargin,
      gMAX_CARD_WIDTH
    );
    
    // 限制宽度在允许范围内，确保不小于最小宽度
    const limitedWidth = Math.max(gMIN_CARD_WIDTH, Math.min(newWidth, maxAllowedWidth));
    
    // 更新宽度状态
    setPropertyPanelWidth(limitedWidth);
    
    // 更新总宽度和宽度比例
    const newTotalWidth = _moduleLibraryWidth + limitedWidth;
    setTotalCardsWidth(newTotalWidth);
    
    // 更新宽度比例（相对于总宽度）
    setWidthRatio({
      moduleLibrary: _moduleLibraryWidth / newTotalWidth,
      propertyPanel: limitedWidth / newTotalWidth,
    });
  };

  // 强制使用初始宽度
  useEffect(() => {
    // 确保初始宽度设置为INITIAL_CARD_WIDTH
    if (_isFirstRender) {
      setModuleLibraryWidth(gINITIAL_CARD_WIDTH);
      setPropertyPanelWidth(gINITIAL_CARD_WIDTH);
    }
  }, [_isFirstRender]);

  return {
    moduleLibraryWidth: _moduleLibraryWidth,
    propertyPanelWidth: _propertyPanelWidth,
    handleModuleLibraryResize,
    handlePropertyPanelResize,
    constants: {
      MIN_CARD_WIDTH: gMIN_CARD_WIDTH,
      MAX_CARD_WIDTH: gMAX_CARD_WIDTH,
      INITIAL_CARD_WIDTH: gINITIAL_CARD_WIDTH
    }
  };
};

export default useResponsiveLayout; 