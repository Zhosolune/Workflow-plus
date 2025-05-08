import { useEffect, useRef } from 'react';
import useWindowResizeBreakpoint from './useWindowResizeBreakpoint';

/**
 * 自定义Hook，用于跟踪窗口大小变化，特别是从大于断点变为小于等于断点的变化
 * 
 * @param breakpoint - 断点宽度值（像素）
 * @returns 包含当前状态和相关处理函数的对象
 */
export const useWindowSizeTracker = (breakpoint: number) => {
  // 获取当前窗口是否小于等于断点值
  const isSmallScreen = useWindowResizeBreakpoint(breakpoint);
  
  // 跟踪窗口之前是否为大屏幕
  const _wasLargeScreenRef = useRef<boolean>(
    typeof window !== 'undefined' && window.innerWidth > breakpoint
  );
  
  // 跟踪是否应该折叠侧边栏（当窗口从大到小变化时）
  const _shouldCollapseRef = useRef<boolean>(false);
  
  // 监听窗口大小变化
  useEffect(() => {
    if (!isSmallScreen) {
      // 大屏幕：记录状态，重置折叠触发标志
      _wasLargeScreenRef.current = true;
      _shouldCollapseRef.current = false;
    } 
    else if (isSmallScreen && _wasLargeScreenRef.current) {
      // 小屏幕且之前是大屏幕：触发折叠
      _shouldCollapseRef.current = true;
      _wasLargeScreenRef.current = false;
    }
  }, [isSmallScreen]);
  
  // 检查是否需要折叠侧边栏，同时消费这个信号（使用后重置）
  const checkShouldCollapse = () => {
    if (_shouldCollapseRef.current) {
      _shouldCollapseRef.current = false;
      return true;
    }
    return false;
  };

  return {
    isSmallScreen,     // 当前窗口是否小于等于断点
    checkShouldCollapse, // 检查是否应该折叠侧边栏
  };
};

export default useWindowSizeTracker; 