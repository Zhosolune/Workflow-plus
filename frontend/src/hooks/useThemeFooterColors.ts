import { useMemo } from 'react';
import { theme } from 'antd';

/**
 * 自定义Hook，用于根据当前主题计算Footer的背景色和边框色
 * @param footerBgLightMode 亮色主题下的背景色
 * @param footerBorderLightMode 亮色主题下的边框色
 * @returns 计算后的Footer颜色对象
 */
const useThemeFooterColors = (
  footerBgLightMode = '#f0f2f5',
  footerBorderLightMode = '#e8e8e8'
) => {
  const { token } = theme.useToken();

  // 判断当前是否为暗色主题
  const isDarkMode = useMemo(() => {
    // 通过token中的颜色判断当前主题模式
    return token.colorBgBase !== '#fff';
  }, [token.colorBgBase]);

  // 根据当前主题计算footer的背景色
  const footerBgColor = useMemo(() => {
    return isDarkMode 
      ? '#1d1d1d'  // 暗色主题下的颜色
      : footerBgLightMode; // 亮色主题下使用指定的颜色
  }, [isDarkMode, footerBgLightMode]);

  // 根据当前主题计算footer的边框色
  const footerBorderColor = useMemo(() => {
    return isDarkMode 
      ? '#303030'  // 暗色主题下的颜色
      : footerBorderLightMode; // 亮色主题下使用指定的颜色
  }, [isDarkMode, footerBorderLightMode]);

  return {
    footerBgColor,
    footerBorderColor,
    isDarkMode
  };
};

export default useThemeFooterColors; 