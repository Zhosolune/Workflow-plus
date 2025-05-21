# 前端API文档

本文档详细记录Workflow-plus系统前端模块已完成功能的接口部分，用于开发参考与查阅。

## 目录

- [整体架构](#整体架构)
- [布局组件](#布局组件)
  - [MainLayout](#mainlayout)
  - [Header](#header)
  - [Sider](#sider)
  - [SubHeader](#subheader)
  - [SubFooter](#subfooter)
- [工作流设计器](#工作流设计器)
  - [WorkflowDesigner](#workflowdesigner)
  - [Canvas](#canvas)
  - [ModuleLibrary](#modulelibrary)
  - [PropertyPanel](#propertypanel)
  - [StatusBar](#statusbar)
  - [ResizeHandle](#resizehandle)
- [功能组件](#功能组件)
- [自定义Hooks](#自定义Hooks)
  - [useResize](#useresize)
  - [useResponsiveLayout](#useresponsivelayout)
  - [useWindowResizeBreakpoint](#usewindowresizebreakpoint)
  - [useWindowSizeTracker](#usewindowsizetracker)
  - [useThemeFooterColors](#usethemefootercolors)
  - [useWorkflowManager](#useworkflowmanager)
  - [useWorkflowDragAndDrop](#useworkflowdraganddrop)
- [数据类型](#数据类型)
- [工具函数](#工具函数)
- [命名规范](#命名规范)
- [版本记录](#版本记录)

## 整体架构

前端采用React + TypeScript技术栈，主要依赖如下：

- **React 18**: 核心框架
- **React-flow**: 工作流交互库
- **Ant Design**: UI组件库
- **ECharts**: 数据可视化
- **Vite**: 构建工具

项目使用组件化设计，严格遵循TypeScript类型定义，确保代码质量和可维护性。

## 布局组件

### MainLayout

**文件位置**: `frontend/src/components/layout/MainLayout.tsx`  
**功能**: 应用的主要布局框架，集成顶部导航、侧边菜单和内容区域

#### Props接口

```typescript
// 无需外部传入props
```

#### 状态管理

```typescript
const [collapsed, setCollapsed] = useState<boolean>(false);
const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
```

#### 主要方法

```typescript
// 切换侧边栏折叠状态
const toggleCollapsed = () => {
  setCollapsed(!collapsed);
};

// 切换明暗主题
const toggleTheme = () => {
  setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
};
```

#### 使用示例

```tsx
// 在路由中使用
<Route element={<MainLayout />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/workflow" element={<WorkflowDesigner />} />
  {/* 其他子路由 */}
</Route>
```

### Header

**文件位置**: `frontend/src/components/layout/Header.tsx`  
**功能**: 应用顶部导航栏，提供全局操作和状态显示

#### Props接口

```typescript
interface HeaderProps {
  currentTheme: 'light' | 'dark';  // 当前主题状态
  toggleTheme: () => void;         // 切换主题的回调函数
}
```

#### 状态管理

通过Ant Design的theme hook获取当前主题配置：
```typescript
const { token } = theme.useToken();
```

#### 主要功能按钮

Header组件包含以下功能按钮：
- 主题切换: 在明暗主题间切换 (MoonOutlined/SunOutlined)
- 语言切换: 多语言支持 (GlobalOutlined)
- 帮助: 显示帮助信息 (QuestionCircleOutlined)
- 通知: 显示系统通知 (BellOutlined)
- 设置: 系统设置 (SettingOutlined)
- 用户头像: 用户相关操作 (UserOutlined)

#### 用户菜单项

用户头像下拉菜单包含以下选项：
- 个人中心
- 账户设置
- 退出登录

#### 使用示例

```tsx
<HeaderComponent 
  currentTheme={currentTheme} 
  toggleTheme={toggleTheme} 
/>
```

### Sider

**文件位置**: `frontend/src/components/layout/Sider.tsx`  
**功能**: 应用侧边菜单，提供主要功能导航

#### Props接口

```typescript
interface SiderProps {
  collapsed: boolean;      // 侧边栏折叠状态
  onCollapse: () => void;  // 折叠状态切换回调
}
```

#### 菜单项配置

```typescript
const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '仪表盘',
  },
  {
    key: '/workflow',
    icon: <ApiOutlined />,
    label: '工作流设计',
  },
  {
    key: '/files',
    icon: <FolderOutlined />,
    label: '文件管理',
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: '系统设置',
  },
  {
    key: '/user',
    icon: <UserOutlined />,
    label: '个人中心',
  },
];
```

#### 主要方法

```typescript
// 处理菜单项点击，导航到对应路由
const handleMenuClick = (key: string) => {
  navigate(key);
};
```

#### 样式特性

- 可折叠侧边栏，折叠时宽度为60px，展开时为250px
- 浅色主题(theme="light")
- 侧边栏顶部有标题和折叠按钮
- 定制化菜单项样式
- 悬停反馈和点击反馈效果
- 折叠按钮有tooltip提示

#### 使用示例

```tsx
<SiderComponent 
  collapsed={collapsed} 
  onCollapse={toggleCollapsed} 
/>
```

### SubHeader

**文件位置**: `frontend/src/components/layout/SubHeader.tsx`  
**功能**: 自适应主题的子界面Header组件，在亮色/暗色主题下自动使用对应的颜色

#### Props接口

```typescript
interface SubHeaderProps {
  height?: string | number;      // 头部栏的高度，默认为'60px'
  padding?: string;              // 头部栏的内边距，默认为'0 20px'
  title?: React.ReactNode;       // 头部栏的标题
  actions?: React.ReactNode;     // 头部栏右侧的操作区域
  style?: React.CSSProperties;   // 头部栏的自定义样式
}
```

#### 状态管理

通过Ant Design的theme hook获取当前主题配置：
```typescript
const { token } = theme.useToken();
```

#### 主要特性

- 自动适应当前主题，使用恰当的背景色和阴影效果
- 响应式布局，自动分隔标题和操作区
- 可自定义高度、内边距和样式
- 支持复杂的标题和操作区内容

#### 使用示例

```tsx
<SubHeader
  title="模块化工作流设计器"
  actions={
    <Space>
      <Button type="primary" icon={<PlusOutlined />}>新建</Button>
      <Button icon={<SaveOutlined />}>保存</Button>
    </Space>
  }
  height="60px"
/>
```

### SubFooter

**文件位置**: `frontend/src/components/layout/SubFooter.tsx`  
**功能**: 自适应主题的子界面Footer组件，在亮色/暗色主题下自动切换颜色

#### Props接口

```typescript
interface SubFooterProps {
  bgColor?: string;              // 亮色主题下的背景色，默认为'#f0f2f5'
  borderColor?: string;          // 亮色主题下的边框色，默认为'#e8e8e8'
  height?: string | number;      // 底部栏的高度，默认为'30px'
  padding?: string;              // 底部栏的内边距，默认为'0 16px'
  style?: React.CSSProperties;   // 底部栏的自定义样式
  children?: React.ReactNode;    // 底部栏的内容
}
```

#### 状态管理

通过自定义的useThemeFooterColors hook管理在不同主题下的颜色：
```typescript
const { footerBgColor, footerBorderColor } = useThemeFooterColors(bgColor, borderColor);
```

#### 主要特性

- 自动根据当前主题调整背景色和边框色
- 可定制高度和内边距
- 支持添加任意内容的子元素
- 响应式设计，适应不同屏幕尺寸

#### 使用示例

```tsx
<SubFooter height="30px">
  <StatusBar status={workflowStatus} />
</SubFooter>
```

## 工作流设计器

### WorkflowDesigner

**文件位置**: `frontend/src/components/pages/WorkflowDesigner/WorkflowDesigner.tsx`  
**功能**: 工作流设计器的主组件，整合模块库、画布和属性面板

#### Props接口

```typescript
// 无需外部传入props
```

#### 状态管理

```typescript
// 当前选中的节点
const [selectedNode, setSelectedNode] = useState<any>(null);

// 工作流状态
const [workflowStatus, setWorkflowStatus] = useState({
  saved: true,
  nodeCount: 0,
  edgeCount: 0,
});
```

#### 主要方法

```typescript
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
  // 实现打开工作流逻辑
};

// 处理保存工作流
const handleSave = () => {
  // 实现保存工作流逻辑
  setWorkflowStatus({
    ...workflowStatus,
    saved: true,
  });
};

// 处理运行工作流
const handleRun = () => {
  // 实现运行工作流逻辑
};

// 更新工作流状态
const updateWorkflowStatus = (status: Partial<typeof workflowStatus>) => {
  setWorkflowStatus({ ...workflowStatus, ...status });
};
```

#### 使用示例

```tsx
// 在路由中使用
<Route path="/workflow" element={<WorkflowDesigner />} />
```

### Canvas

**文件位置**: `frontend/src/components/pages/WorkflowDesigner/Canvas.tsx`  
**功能**: 工作流的可视化编辑区域，支持节点拖放、连线创建和编辑操作

#### Props接口

```typescript
interface CanvasProps {
  onNodeSelect: (node: any) => void;             // 节点选择回调
  updateWorkflowStatus: (status: any) => void;   // 更新工作流状态的回调
}
```

#### 状态管理

```typescript
// 节点和连线状态管理
const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

// 节点计数器（用于生成唯一ID）
const [nodeIdCounter, setNodeIdCounter] = useState(1);
```

#### 主要方法

```typescript
// 处理节点连接
const onConnect: OnConnect = useCallback(
  (connection: Connection) => {
    setEdges((eds: Edge[]) => addEdge({
      ...connection,
      type: 'smoothstep',
      animated: true,
    }, eds));
    
    updateWorkflowStatus({ saved: false });
  },
  [setEdges, updateWorkflowStatus]
);

// 处理节点选择
const onNodeClick = useCallback(
  (_: React.MouseEvent, node: Node) => {
    onNodeSelect(node.data);
  },
  [onNodeSelect]
);

// 处理模块拖放
const handleDrop = useCallback(
  (event: any) => {
    // 实现节点创建逻辑
    const module = event.active?.data?.current;
    if (module) {
      const position = {
        x: event.x - 150,
        y: event.y - 50
      };
      createNode(module, position);
    }
  },
  [createNode]
);

// 创建新节点
const createNode = useCallback(
  (module: any, position: { x: number, y: number }) => {
    const newNode = {
      id: `node-${nodeIdCounter}`,
      type: 'default',
      position,
      data: {
        ...module,
        label: module.name
      }
    };
    
    setNodes(nds => [...nds, newNode]);
    setNodeIdCounter(prev => prev + 1);
    updateWorkflowStatus({ saved: false });
  },
  [nodeIdCounter, setNodes, updateWorkflowStatus]
);
```

#### 使用示例

```tsx
<Canvas
  onNodeSelect={handleNodeSelect}
  updateWorkflowStatus={updateWorkflowStatus}
/>
```

### ModuleLibrary

**文件位置**: `frontend/src/components/pages/WorkflowDesigner/ModuleLibrary.tsx`  
**功能**: 显示可用模块的库，支持分类查看和搜索，允许将模块拖拽到画布中

#### Props接口

```typescript
// 无需外部传入props
```

#### 状态管理

```typescript
// 搜索关键词
const [searchValue, setSearchValue] = useState<string>('');
```

#### 主要方法

```typescript
// 处理搜索
const handleSearch = (value: string) => {
  setSearchValue(value);
};

// 过滤模块
const getFilteredModules = (modules: any[]) => {
  if (!searchValue) return modules;
  return modules.filter(module => 
    module.name.toLowerCase().includes(searchValue.toLowerCase())
  );
};
```

#### 模块数据结构

```typescript
interface Module {
  id: string;      // 模块唯一标识
  name: string;    // 模块显示名称
  icon: string;    // 模块图标（使用emoji字符）
  type: string;    // 模块类型（source/processor/analyzer/viz/output）
}
```

#### 子组件

**DraggableModule** 组件:
```typescript
interface DraggableModuleProps {
  module: {
    id: string;
    name: string;
    icon: string;
    type: string;
  }
}
```

#### 使用示例

```tsx
<ModuleLibrary />
```

### PropertyPanel

**文件位置**: `frontend/src/components/pages/WorkflowDesigner/PropertyPanel.tsx`  
**功能**: 属性面板组件，用于显示并编辑选中节点的属性

#### Props接口

```typescript
interface PropertyPanelProps {
  selectedNode: any | null;  // 当前选中的节点对象，为null时显示空状态
}
```

#### 主要方法

```typescript
// 处理表单值变更
const handleValueChange = (changedValues: any) => {
  // 实现节点属性更新逻辑
};

// 根据节点类型渲染不同的属性表单
const renderPropertyForm = () => {
  if (!selectedNode) {
    return <Empty description="选择一个节点查看属性" image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }
  
  // 根据节点类型显示不同的属性表单
  switch (selectedNode.type) {
    case 'analyzer':
      if (selectedNode.id === 'kmeans') {
        return renderKMeansForm();
      }
      return renderGenericForm();
    case 'source':
    case 'processor':
    case 'viz':
    case 'output':
    default:
      return renderGenericForm();
  }
};

// 渲染K-Means模块的专用表单
const renderKMeansForm = () => {
  // 实现K-Means专用表单
};

// 渲染通用属性表单
const renderGenericForm = () => {
  // 实现通用属性表单
};
```

#### 表单属性

**基本属性**（所有节点通用）:
- 名称(name): 文本输入
- 描述(description): 多行文本输入
- 启用(enabled): 开关控件

**特定类型属性**:
- 数据源(source)类型: 额外显示"数据源配置"部分
- 处理器(processor)类型: 额外显示"处理参数"部分
- 分析器(analyzer)类型: 根据具体模块(如K-Means)显示特定参数

**K-Means表单参数**:
- 聚类数量(k值): 数字输入(1-100)
- 最大迭代次数: 数字输入(10-1000)
- 随机种子: 数字输入
- 初始化方法: 选择框(K-means++/随机初始化)
- 预处理方式: 选择框(标准化/归一化/无)
- 距离函数: 选择框(欧氏距离/曼哈顿距离/余弦距离)

#### 使用示例

```tsx
<PropertyPanel selectedNode={selectedNode} />
```

### StatusBar

**文件位置**: `frontend/src/components/pages/WorkflowDesigner/StatusBar.tsx`  
**功能**: 显示工作流状态信息，如节点数量、连线数量和保存状态

#### Props接口

```typescript
interface StatusBarProps {
  status: {
    saved: boolean;      // 工作流保存状态
    nodeCount: number;   // 节点数量
    edgeCount: number;   // 连线数量
  };
}
```

#### 使用示例

```tsx
<StatusBar status={workflowStatus} />
```

### ResizeHandle

**文件位置**: `frontend/src/components/pages/WorkflowDesigner/ResizeHandle.tsx`  
**功能**: 拖拽手柄组件，用于调整相邻卡片的宽度

#### Props接口

```typescript
interface ResizeHandleProps {
  position: 'left' | 'right';        // 手柄位置
  width: number;                     // 当前宽度
  onResize: (newWidth: number) => void;  // 调整大小回调，直接传递新宽度
  minWidth?: number;                 // 最小宽度
  maxWidth?: number;                 // 最大宽度
}
```

#### 状态管理

通过自定义的useResize hook处理拖拽逻辑:

```typescript
const {
  isDragging,
  isHovering,
  handleMouseDown,
  handleMouseEnter,
  handleMouseLeave,
} = useResize(width, onResize, minWidth, maxWidth);
```

#### 视觉反馈

根据状态动态设置手柄颜色:
- 拖拽时为蓝色 (#3F75FB)
- 悬停时为蓝色 (#3F75FB)
- 默认为灰色 (#bfbfbf)

#### 主要方法

```typescript
// 根据状态确定手柄颜色
const getBarColor = () => {
  if (isDragging) return '#3F75FB'; // 拖拽时为蓝色
  if (isHovering) return '#3F75FB'; // 悬停时为蓝色
  return '#bfbfbf';                 // 默认为灰色
};
```

#### 使用示例

```tsx
<ResizeHandle 
  position="right" 
  width={moduleLibraryWidth} 
  onResize={handleModuleLibraryResize} 
  minWidth={200}
  maxWidth={400}
/>
```

## 功能组件

## 自定义Hooks

### useResize

**文件位置**: `frontend/src/hooks/useResize.ts`  
**功能**: 处理元素大小调整的逻辑，支持拖拽调整大小

#### 接口定义

```typescript
function useResize(
  initialWidth: number,
  onResizeCallback: (newWidth: number) => void,
  minWidth?: number,
  maxWidth?: number
): {
  isDragging: boolean;
  isHovering: boolean;
  handleMouseDown: (e: React.MouseEvent, position: 'left' | 'right') => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  checkMousePosition: (e: MouseEvent, element: HTMLElement | null) => void;
}
```

#### 参数说明

- `initialWidth`: 初始宽度
- `onResizeCallback`: 调整大小时的回调函数
- `minWidth`: 最小宽度限制，默认值为200
- `maxWidth`: 最大宽度限制，默认值为600

#### 返回值

- `isDragging`: 是否处于拖拽状态
- `isHovering`: 是否处于悬停状态
- `handleMouseDown`: 鼠标按下事件处理函数
- `handleMouseEnter`: 鼠标进入事件处理函数
- `handleMouseLeave`: 鼠标离开事件处理函数
- `checkMousePosition`: 检查鼠标是否位于元素上的函数

#### 使用示例

```tsx
import useResize from '../../../hooks/useResize';

const MyComponent = () => {
  const { 
    isDragging, 
    isHovering, 
    handleMouseDown,
    handleMouseEnter,
    handleMouseLeave 
  } = useResize(
    300,                         // 初始宽度
    (newWidth) => setWidth(newWidth),  // 宽度变化回调
    200,                         // 最小宽度
    600                          // 最大宽度
  );
  
  return (
    <div
      onMouseDown={(e) => handleMouseDown(e, 'right')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      拖拽手柄
    </div>
  );
};
```

### useResponsiveLayout

**文件位置**: `frontend/src/hooks/useResponsiveLayout.ts`  
**功能**: 管理响应式布局，处理两个相邻卡片的宽度和窗口大小变化

#### 接口定义

```typescript
function useResponsiveLayout(
  contentRef: React.RefObject<HTMLDivElement>
): {
  moduleLibraryWidth: number;
  propertyPanelWidth: number;
  handleModuleLibraryResize: (newWidth: number) => void;
  handlePropertyPanelResize: (newWidth: number) => void;
  constants: {
    MIN_CARD_WIDTH: number;
    MAX_CARD_WIDTH: number;
    INITIAL_CARD_WIDTH: number;
  };
}
```

#### 参数说明

- `contentRef`: 内容容器的React引用，用于获取容器宽度

#### 返回值

- `moduleLibraryWidth`: 模块库当前宽度
- `propertyPanelWidth`: 属性面板当前宽度
- `handleModuleLibraryResize`: 调整模块库宽度的处理函数
- `handlePropertyPanelResize`: 调整属性面板宽度的处理函数
- `constants`: 包含卡片宽度相关常量的对象

#### 使用示例

```tsx
import useResponsiveLayout from '../../../hooks/useResponsiveLayout';

const MyComponent = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  const {
    moduleLibraryWidth,
    propertyPanelWidth,
    handleModuleLibraryResize,
    handlePropertyPanelResize
  } = useResponsiveLayout(contentRef);
  
  return (
    <div ref={contentRef}>
      <ModuleLibrary 
        width={moduleLibraryWidth}
        onResize={handleModuleLibraryResize}
      />
      <PropertyPanel 
        width={propertyPanelWidth}
        onResize={handlePropertyPanelResize}
      />
    </div>
  );
};
```

### useWindowResizeBreakpoint

**文件位置**: `frontend/src/hooks/useWindowResizeBreakpoint.ts`  
**功能**: 监听窗口大小变化，返回当前窗口宽度是否小于等于指定断点值

#### 接口定义

```typescript
function useWindowResizeBreakpoint(breakpoint: number): boolean
```

#### 参数说明

- `breakpoint`: 断点宽度值（像素）

#### 返回值

- `boolean`: 当前窗口宽度是否小于等于断点值

#### 特点

- 简单直接，仅提供窗口大小与断点的比较结果
- 实时反映窗口大小变化
- 自动处理浏览器环境检查和事件监听清理

#### 使用示例

```tsx
import useWindowResizeBreakpoint from '../../../hooks/useWindowResizeBreakpoint';

const MyComponent = () => {
  // 获取当前窗口是否小于等于断点值
  const isSmallScreen = useWindowResizeBreakpoint(940);
  
  return (
    <div>
      <p>当前窗口是{isSmallScreen ? '小' : '大'}屏幕</p>
    </div>
  );
};
```

### useWindowSizeTracker

**文件位置**: `frontend/src/hooks/useWindowSizeTracker.ts`  
**功能**: 跟踪窗口大小变化，特别是从大于断点变为小于等于断点的变化

#### 接口定义

```typescript
function useWindowSizeTracker(breakpoint: number): {
  isSmallScreen: boolean;
  checkShouldCollapse: () => boolean;
}
```

#### 参数说明

- `breakpoint`: 断点宽度值（像素）

#### 返回值

- `isSmallScreen`: 当前窗口宽度是否小于等于断点值
- `checkShouldCollapse`: 检查是否应该触发折叠操作的函数，返回true表示窗口刚刚从大变小

#### 特点

- 将基础的尺寸检测与变化逻辑分开，实现关注点分离
- 能够检测窗口从大于断点变为小于等于断点的变化
- 提供"一次性"的变化信号（调用checkShouldCollapse后会重置状态）
- 自动处理内部状态跟踪，外部组件无需维护额外状态

#### 原理

内部使用两个ref跟踪窗口变化状态：
- `_wasLargeScreenRef`: 记录窗口之前是否大于断点
- `_shouldCollapseRef`: 标记是否应该触发折叠操作

#### 使用示例

```tsx
import useWindowSizeTracker from '../../../hooks/useWindowSizeTracker';
import { useEffect } from 'react';

const MyComponent = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { isSmallScreen, checkShouldCollapse } = useWindowSizeTracker(940);
  
  // 响应窗口大小变化
  useEffect(() => {
    // 只有当窗口从大变小时才折叠侧边栏
    if (checkShouldCollapse()) {
      setCollapsed(true);
    }
  }, [isSmallScreen]); // 依赖isSmallScreen，确保在其变化时执行检查
  
  return (
    <div>
      <Sidebar collapsed={collapsed} />
      <Content />
    </div>
  );
};
```

### useThemeFooterColors

**文件位置**: `frontend/src/hooks/useThemeFooterColors.ts`  
**功能**: 根据当前主题计算Footer的背景色和边框色，支持SubFooter组件的主题适配功能

#### 接口定义

```typescript
function useThemeFooterColors(
  footerBgLightMode?: string,
  footerBorderLightMode?: string
): {
  footerBgColor: string;
  footerBorderColor: string;
  isDarkMode: boolean;
}
```

#### 参数说明

- `footerBgLightMode`: 亮色主题下的背景色，默认值为'#f0f2f5'
- `footerBorderLightMode`: 亮色主题下的边框色，默认值为'#e8e8e8'

#### 返回值

- `footerBgColor`: 当前主题下的背景色
- `footerBorderColor`: 当前主题下的边框色
- `isDarkMode`: 当前是否为暗色主题

#### 实现原理

使用Ant Design的theme.useToken()获取当前主题的token，通过分析colorBgBase来判断当前是亮色还是暗色主题：

```typescript
const isDarkMode = useMemo(() => {
  // 通过token中的颜色判断当前主题模式
  return token.colorBgBase !== '#fff';
}, [token.colorBgBase]);
```

然后根据主题类型返回对应的颜色：

```typescript
// 根据当前主题计算footer的背景色
const footerBgColor = useMemo(() => {
  return isDarkMode 
    ? '#1d1d1d'  // 暗色主题下的颜色
    : footerBgLightMode; // 亮色主题下使用指定的颜色
}, [isDarkMode, footerBgLightMode]);
```

#### 使用示例

```tsx
import useThemeFooterColors from '../../../hooks/useThemeFooterColors';

const MyFooter = () => {
  // 使用默认颜色
  const { footerBgColor, footerBorderColor, isDarkMode } = useThemeFooterColors();
  
  // 或者指定亮色主题下的颜色
  // const { footerBgColor, footerBorderColor } = useThemeFooterColors('#f5f5f5', '#e0e0e0');
  
  return (
    <div
      style={{
        background: footerBgColor,
        borderTop: `1px solid ${footerBorderColor}`,
      }}
    >
      页脚内容
    </div>
  );
};
```

### useWorkflowManager

**文件位置**: `frontend/src/features/workflowDesigner/hooks/useWorkflowManager.ts`  
**功能**: 管理工作流状态、节点和连线的操作，以及与属性面板的交互

#### 接口定义

```typescript
export const useWorkflowManager = (): WorkflowManagerHookResult => {
  // 实现...
}

interface WorkflowManagerHookResult {
  // 状态
  nodes: Node[];
  edges: Edge[];
  selectedNode: { data: CustomNodeData, id: string } | null;
  workflowStatus: WorkflowStatus;
  nodeIdCounter: number;
  
  // 节点和边的更改处理
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  // 节点选择和数据更改
  handleNodeSelect: (node: Node) => void;
  onNodeDataChange: (nodeId: string, newNodeData: Partial<CustomNodeData>) => void;
  
  // 工作流状态更新
  updateWorkflowStatus: (status: Partial<WorkflowStatus>) => void;
  
  // 工作流操作
  handleNew: () => void;
  handleOpen: () => void;
  handleSave: () => void;
  handleRun: () => void;
  
  // 内部 Hooks 调用检查
  isVariantOrPortChange: (newNodeData: Partial<CustomNodeData>) => boolean;
  
  // 状态设置器
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setNodeIdCounter: React.Dispatch<React.SetStateAction<number>>;
  setSelectedNode: React.Dispatch<React.SetStateAction<{ data: CustomNodeData, id: string } | null>>;
}
```

#### 主要功能

- **状态管理**：管理节点、边、选中节点和工作流状态
- **节点连接验证**：在连接节点时验证端口类型兼容性
- **变体处理**：处理节点变体切换和端口配置变更，包括处理受影响的连接
- **工作流操作**：新建、打开、保存和运行工作流
- **属性面板交互**：处理节点属性的更改

#### 使用示例

```tsx
import { useWorkflowManager } from '../../../features/workflowDesigner/hooks/useWorkflowManager';

const WorkflowDesigner = () => {
  const {
    nodes,
    edges,
    selectedNode,
    workflowStatus,
    nodeIdCounter,
    onNodesChange,
    onEdgesChange,
    onConnect,
    handleNodeSelect,
    onNodeDataChange,
    updateWorkflowStatus,
    handleNew,
    handleOpen,
    handleSave,
    handleRun
  } = useWorkflowManager();
  
  return (
    // 使用这些状态和函数渲染组件
  );
};
```

### useWorkflowDragAndDrop

**文件位置**: `frontend/src/features/workflowDesigner/hooks/useWorkflowDragAndDrop.ts`  
**功能**: 处理拖拽相关功能，包括从模块库到画布的拖拽和模块预览

#### 接口定义

```typescript
export const useWorkflowDragAndDrop = (
  contentRef: React.RefObject<HTMLDivElement>,
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
  nodeIdCounter: number,
  setNodeIdCounter: React.Dispatch<React.SetStateAction<number>>,
  updateWorkflowStatus: (status: Partial<{ saved: boolean; nodeCount: number; edgeCount: number; }>) => void,
  setSelectedNode: React.Dispatch<React.SetStateAction<{ data: CustomNodeData, id: string } | null>>
): WorkflowDragAndDropHookResult => {
  // 实现...
}

interface WorkflowDragAndDropHookResult {
  // 状态
  draggedModule: ModuleDefinition | null;
  
  // 事件处理
  handleDragStart: (event: any) => void;
  handleDragEnd: (event: any) => void;
  handleDragCancel: () => void;
  handleModulePreview: (moduleDefinition: ModuleDefinition) => void;
}
```

#### 主要功能

- **拖拽状态管理**：处理拖拽过程中的状态
- **区分点击和拖拽**：根据鼠标移动的距离和时间区分点击和拖拽操作
- **模块预览**：点击模块时显示预览，加载模块变体定义
- **拖拽到画布**：处理将模块从库拖拽到画布的逻辑，创建新节点
- **精确定位**：根据鼠标位置精确定位新创建的节点

#### 使用示例

```tsx
import { useWorkflowDragAndDrop } from '../../../features/workflowDesigner/hooks/useWorkflowDragAndDrop';

const WorkflowDesigner = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 从 useWorkflowManager 获取
  const { setNodes, nodeIdCounter, setNodeIdCounter, updateWorkflowStatus, setSelectedNode } = useWorkflowManager();
  
  const {
    draggedModule,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
    handleModulePreview
  } = useWorkflowDragAndDrop(
    contentRef,
    setNodes,
    nodeIdCounter,
    setNodeIdCounter,
    updateWorkflowStatus,
    setSelectedNode
  );
  
  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {/* 组件内容 */}
    </DndContext>
  );
};
```

## 数据类型

### 工作流相关数据类型

```typescript
// 工作流状态
interface WorkflowStatus {
  saved: boolean;      // 保存状态
  nodeCount: number;   // 节点数量
  edgeCount: number;   // 连线数量
}

// 模块数据
interface Module {
  id: string;        // 模块唯一标识
  name: string;      // 模块显示名称
  icon: string;      // 模块图标
  type: string;      // 模块类型
  description?: string;  // 模块描述(可选)
  inputs?: PortDefinition[];  // 输入端口(可选)
  outputs?: PortDefinition[];  // 输出端口(可选)
  parameters?: ParameterDefinition[];  // 参数定义(可选)
}

// 端口定义
interface PortDefinition {
  id: string;        // 端口ID
  name: string;      // 端口名称
  dataType: string;  // 数据类型
  required?: boolean;  // 是否必须(可选)
  description?: string;  // 描述(可选)
}

// 参数定义
interface ParameterDefinition {
  id: string;        // 参数ID
  name: string;      // 参数名称
  type: string;      // 参数类型(string, number, boolean, enum)
  defaultValue?: any;  // 默认值(可选)
  required?: boolean;  // 是否必须(可选)
  description?: string;  // 描述(可选)
  options?: any[];  // 枚举类型的选项(可选)
  min?: number;  // 数值类型的最小值(可选)
  max?: number;  // 数值类型的最大值(可选)
}
```

## 工具函数

### 工作流相关工具函数

```typescript
// 检查连接兼容性
const isConnectionValid = (source: PortDefinition, target: PortDefinition): boolean => {
  // 检查数据类型兼容性
  return source.dataType === target.dataType || 
         target.dataType === 'any' || 
         source.dataType === 'any';
};

// 生成唯一ID
const generateUniqueId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// 序列化工作流
const serializeWorkflow = (nodes: Node[], edges: Edge[]): string => {
  return JSON.stringify({ nodes, edges });
};

// 反序列化工作流
const deserializeWorkflow = (json: string): { nodes: Node[], edges: Edge[] } => {
  return JSON.parse(json);
};
```

## 命名规范

1. **组件命名**: 使用PascalCase（如WorkflowEditor）
2. **函数/变量命名**: 使用camelCase（如connectModules）
3. **常量命名**: 使用UPPER_CASE（如DEFAULT_SETTINGS）
4. **接口命名**: 使用PascalCase，以I开头（如IModuleProps）
5. **文件命名**: 组件文件与组件同名，使用PascalCase

## 版本记录

**当前版本**: 0.1.4
**最近更新**: 2025-05-21 