import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../components/pages/Dashboard/Dashboard';
import WorkflowDesigner from '../components/pages/WorkflowDesigner/WorkflowDesigner';
import FileManagement from '../components/pages/FileManagement/FileManagement';
import SystemSettings from '../components/pages/SystemSettings/SystemSettings';
import UserCenter from '../components/pages/UserCenter/UserCenter';

/**
 * 应用路由配置
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* 默认重定向到仪表盘 */}
        <Route index element={<Dashboard />} />
        
        {/* 仪表盘 */}
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* 工作流设计 */}
        <Route path="workflow" element={<WorkflowDesigner />} />
        
        {/* 文件管理 */}
        <Route path="files" element={<FileManagement />} />
        
        {/* 系统设置 */}
        <Route path="settings" element={<SystemSettings />} />
        
        {/* 个人中心 */}
        <Route path="user" element={<UserCenter />} />
        
        {/* 未匹配路由重定向到仪表盘 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes; 