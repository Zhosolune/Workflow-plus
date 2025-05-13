import { useRef, useState, useEffect } from 'react';

/**
 * 用于处理元素大小调整的Hook
 * 
 * @param initialWidth - 初始宽度
 * @param onResizeCallback - 调整大小时的回调函数
 * @param minWidth - 最小宽度限制
 * @param maxWidth - 最大宽度限制
 * @returns 包含拖拽状态和事件处理函数的对象
 */
export const useResize = (
  initialWidth: number,
  onResizeCallback: (newWidth: number) => void,
  minWidth: number = 200,
  maxWidth: number = 600
) => {
  // 跟踪拖拽和悬停状态
  const [_isDragging, setIsDragging] = useState(false);
  const [_isHovering, setIsHovering] = useState(false);
  
  // 记录拖拽状态
  const _dragRef = useRef({
    isDragging: false,
    startX: 0,
    startWidth: initialWidth
  });

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent, position: 'left' | 'right') => {
    // 阻止事件传播和默认行为
    e.preventDefault();
    e.stopPropagation();
    
    // 记录起始位置和宽度
    _dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startWidth: initialWidth
    };
    
    // 更新拖拽状态
    setIsDragging(true);
    
    // 添加全局事件处理
    document.addEventListener('mousemove', (e) => handleMouseMove(e, position));
    document.addEventListener('mouseup', handleMouseUp);
    
    // 设置鼠标样式
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // 防止拖拽时选中文本
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: MouseEvent, position: 'left' | 'right') => {
    if (!_dragRef.current.isDragging) return;
    
    // 计算总位移
    const totalDeltaX = e.clientX - _dragRef.current.startX;
    
    // 根据手柄位置计算新宽度
    let newWidth;
    if (position === 'right') {
      // 右侧手柄：向右拖动增加宽度
      newWidth = _dragRef.current.startWidth + totalDeltaX;
    } else {
      // 左侧手柄：向左拖动增加宽度
      newWidth = _dragRef.current.startWidth - totalDeltaX;
    }
    
    // 限制宽度范围
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    // 调用回调函数，直接传递新宽度
    onResizeCallback(newWidth);
  };

  // 处理鼠标释放事件
  const handleMouseUp = (e: MouseEvent) => {
    // 重置拖拽状态
    _dragRef.current.isDragging = false;
    setIsDragging(false);
    
    // 同时重置悬停状态，避免颜色停留问题
    setIsHovering(false);
    
    // 移除全局事件处理
    document.removeEventListener('mousemove', handleMouseMove as any);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // 恢复鼠标样式
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };
  
  // 处理鼠标进入事件
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  // 处理鼠标离开事件
  const handleMouseLeave = () => {
    if (!_isDragging) {
      setIsHovering(false);
    }
  };
  
  // 检查鼠标位置是否在元素上
  const checkMousePosition = (e: MouseEvent, element: HTMLElement | null) => {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const isInside = 
      e.clientX >= rect.left && 
      e.clientX <= rect.right && 
      e.clientY >= rect.top && 
      e.clientY <= rect.bottom;
    
    if (isInside) {
      setIsHovering(true);
    }
  };

  // 组件卸载时清理事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // 返回状态和处理函数
  return {
    isDragging: _isDragging,
    isHovering: _isHovering,
    handleMouseDown,
    handleMouseEnter,
    handleMouseLeave,
    checkMousePosition
  };
};

export default useResize; 