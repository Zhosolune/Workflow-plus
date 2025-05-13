import React from 'react';
import { Layout } from 'antd';
import useThemeFooterColors from '../../hooks/useThemeFooterColors';

const { Footer } = Layout;

interface SubFooterProps {
  /**
   * 亮色主题下的背景色
   */
  bgColor?: string;
  
  /**
   * 亮色主题下的边框色
   */
  borderColor?: string;
  
  /**
   * 底部栏的高度
   */
  height?: string | number;
  
  /**
   * 底部栏的内边距
   */
  padding?: string;
  
  /**
   * 底部栏的样式
   */
  style?: React.CSSProperties;
  
  /**
   * 底部栏的内容
   */
  children?: React.ReactNode;
}

/**
 * 自适应主题的子界面Footer组件
 * 在亮色/暗色主题下自动切换颜色
 */
const SubFooter: React.FC<SubFooterProps> = ({
  bgColor = '#f0f2f5',
  borderColor = '#e8e8e8',
  height = '30px',
  padding = '0 16px',
  style = {},
  children,
}) => {
  // 使用自定义hook获取当前主题下的颜色
  const { footerBgColor, footerBorderColor } = useThemeFooterColors(bgColor, borderColor);

  return (
    <Footer
      style={{
        padding,
        height,
        lineHeight: typeof height === 'number' ? `${height}px` : height,
        background: footerBgColor,
        borderTop: `1px solid ${footerBorderColor}`,
        margin: 0,
        fontSize: '14px',
        flexShrink: 0,
        ...style
      }}
    >
      {children}
    </Footer>
  );
};

export default SubFooter; 