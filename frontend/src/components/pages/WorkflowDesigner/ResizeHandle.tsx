import React, { useRef, useEffect, useState } from 'react';

interface ResizeHandleProps {
  position: 'left' | 'right';        // 手柄位置
  width: number;                     // 当前宽度
  onResize: (newWidth: number) => void;  // 调整大小回调，直接传递新宽度
  minWidth?: number;                 // 最小宽度
  maxWidth?: number;                 // 最大宽度
}

/**
 * 拖拽手柄组件
 * 用于调整相邻卡片的宽度
 */
const ResizeHandle: React.FC<ResizeHandleProps> = ({ 
  position, 
  width, 
  onResize,
  minWidth = 200,
  maxWidth = 600
}) => {
  // 引用拖拽手柄DOM元素
  const handleRef = useRef<HTMLDivElement>(null);
  
  // 跟踪拖拽和悬停状态
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  // 记录拖拽状态
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startWidth: width
  });

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent) => {
    // 阻止事件传播和默认行为
    e.preventDefault();
    e.stopPropagation();
    
    // 记录起始位置和宽度
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startWidth: width
    };
    
    // 更新拖拽状态
    setIsDragging(true);
    
    // 添加全局事件处理
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // 设置鼠标样式
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // 防止拖拽时选中文本
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragRef.current.isDragging) return;
    
    // 计算总位移
    const totalDeltaX = e.clientX - dragRef.current.startX;
    
    // 根据手柄位置计算新宽度
    let newWidth;
    if (position === 'right') {
      // 右侧手柄：向右拖动增加宽度
      newWidth = dragRef.current.startWidth + totalDeltaX;
    } else {
      // 左侧手柄：向左拖动增加宽度
      newWidth = dragRef.current.startWidth - totalDeltaX;
    }
    
    // 限制宽度范围
    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    
    // 调用回调函数，直接传递新宽度
    onResize(newWidth);
  };

  // 处理鼠标释放事件
  const handleMouseUp = (e: MouseEvent) => {
    // 重置拖拽状态
    dragRef.current.isDragging = false;
    setIsDragging(false);
    
    // 同时重置悬停状态，避免颜色停留问题
    setIsHovering(false);
    
    // 移除全局事件处理
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // 恢复鼠标样式
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // 检查鼠标释放位置，如果在手柄上，重新设置悬停状态
    setTimeout(() => {
      // 使用setTimeout确保React状态更新完毕
      checkMousePosition(e);
    }, 0);
  };
  
  // 检查鼠标位置是否在手柄上
  const checkMousePosition = (e: MouseEvent) => {
    if (!handleRef.current) return;
    
    const rect = handleRef.current.getBoundingClientRect();
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
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // 根据状态确定手柄颜色
  const getBarColor = () => {
    if (isDragging) return '#3F75FB'; // 拖拽时为蓝色
    if (isHovering) return '#3F75FB'; // 悬停时为蓝色
    return '#bfbfbf';                 // 默认为灰色
  };

  // 创建样式，根据状态动态设置颜色
  const barStyle = {
    width: '4px',
    height: '30px',
    backgroundColor: getBarColor(),
    borderRadius: '2px',
    transition: isDragging ? 'none' : 'background-color 0.2s', // 拖拽时禁用过渡效果
  };

  // 处理鼠标进入事件
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  // 处理鼠标离开事件
  const handleMouseLeave = () => {
    if (!isDragging) {
      setIsHovering(false);
    }
  };

  // 计算手柄位置，确保它处于卡片外侧
  const positionOffset = position === 'right' ? { right: '-30px' } : { left: '-30px' };

  return (
    <div
      ref={handleRef}
      className={`resize-handle resize-handle-${position}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'absolute',
        ...positionOffset,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '24px', // 增加宽度以便更容易点击
        height: '60px', // 增加高度以便更容易点击
        cursor: 'col-resize',
        zIndex: 100, // 确保手柄在最上层
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.01)', // 几乎透明的背景
      }}
    >
      <div 
        className="resize-handle-bar"
        style={barStyle}
      />
    </div>
  );
};

export default ResizeHandle; 