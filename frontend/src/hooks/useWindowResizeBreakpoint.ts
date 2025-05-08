import { useEffect, useState } from 'react';

/**
 * 自定义Hook，用于监听窗口大小变化并返回当前窗口是否小于等于断点值
 * 
 * @param breakpoint - 断点宽度值（像素）
 * @returns 当前窗口宽度是否小于等于断点值
 */
export const useWindowResizeBreakpoint = (breakpoint: number): boolean => {
  // 保存当前窗口是否小于等于断点的状态
  const [_isSmallScreen, setIsSmallScreen] = useState<boolean>(
    typeof window !== 'undefined' && window.innerWidth <= breakpoint
  );
  
  useEffect(() => {
    // 检查是否处于浏览器环境
    if (typeof window === 'undefined') {
      return;
    }
    
    // 更新窗口大小状态
    const updateScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= breakpoint);
    };
    
    // 添加resize事件监听器
    window.addEventListener('resize', updateScreenSize);
    
    // 确保初始状态正确
    updateScreenSize();
    
    // 组件卸载时清理
    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, [breakpoint]); // 断点变化时重新设置effect
  
  return _isSmallScreen;
};

export default useWindowResizeBreakpoint; 