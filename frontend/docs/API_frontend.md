# 前端API文档

本文档详细记录Workflow-plus系统前端模块已完成功能的接口部分，用于开发参考与查阅。

## 目录

- [整体架构](#整体架构)
- [布局组件](#布局组件)
  - [MainLayout](#mainlayout)
  - [Header](#header)
  - [Sider](#sider)
- [工作流设计器](#工作流设计器)
  - [WorkflowDesigner](#workflowdesigner)
  - [Canvas](#canvas)
  - [ModuleLibrary](#modulelibrary)
  - [PropertyPanel](#propertypanel)
  - [StatusBar](#statusbar)
- [数据类型](#数据类型)
- [工具函数](#工具函数)
- [命名规范](#命名规范)

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

**当前版本**: 0.1.1
**最近更新**: 2025-04-29 