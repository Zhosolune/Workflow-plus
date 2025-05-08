import React, { useRef } from 'react';
import useResize from '../../../hooks/useResize';

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
  
  // 使用自定义的resize hook处理拖拽逻辑
  const {
    isDragging,
    isHovering,
    handleMouseDown,
    handleMouseEnter,
    handleMouseLeave,
  } = useResize(width, onResize, minWidth, maxWidth);

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

  // 计算手柄位置，确保它处于卡片外侧
  const positionOffset = position === 'right' ? { right: '-30px' } : { left: '-30px' };

  return (
    <div
      ref={handleRef}
      className={`resize-handle resize-handle-${position}`}
      onMouseDown={(e) => handleMouseDown(e, position)}
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