# 工作流系统开发状态

## 项目目标

### 总体目标

创建一个灵活、可扩展的工作流系统，使用户能够以可视化方式创建、配置和执行各种数据处理任务，无需编写复杂代码。该系统应当支持不同类型的数据处理需求，提供友好的用户界面，并且能够与现有系统无缝集成。

### 阶段性目标

1. **阶段一（当前）**: 
   - 完成核心框架实现 ✅
   - 开发基础模块集 ✅
   - 提供基本序列化/反序列化支持 ✅

2. **阶段二（进行中）**:
   - 开发Web界面 🔄
   - 实现更多专业模块 🔄
   - 支持工作流导入/导出 🔄

3. **阶段三（规划中）**:
   - 提供云部署支持 📅
   - 开发团队协作功能 📅
   - 实现工作流市场 📅

### 应用场景

- **数据分析流程**: 数据读取、清洗、转换、分析、可视化
- **自动化测试**: 测试用例生成、执行、结果分析
- **内容处理**: 文档处理、媒体转换、批量操作
- **系统集成**: 连接不同系统和服务，实现数据交换

### 用户需求

- 直观的可视化界面，降低使用门槛
- 丰富的预定义模块，满足常见需求
- 强大的自定义能力，支持特殊场景
- 稳定可靠的执行环境，保证工作流顺利运行
- 灵活的部署选项，满足不同规模需求

## 项目概况

**当前版本**: 0.1.0
**整体完成度**: 基础功能已完成，前端开发中
**最近更新日期**: 2025-04-25
**主要功能列表**:
- 模块化工作流系统框架
- 基础模块注册和管理
- 工作流执行引擎
- 示例模块和工作流
- 初步的前端结构设计

**技术栈概述**:
- 前端: React + React-flow + ECharts + Ant Design
- 后端: Python + FastAPI(可选)
- 桌面封装: Tauri(Rust)
- 通信: IPC + REST API

## 项目目录结构

### 当前实际目录结构

```
Workflow-plus/
├── backend/                 # 后端代码
│   ├── core/                # 核心组件实现
│   │   ├── base_module.py   # 模块基类及接口定义
│   │   ├── engine.py        # 工作流执行引擎实现
│   │   ├── module_registry.py # 模块注册表实现
│   │   ├── workflow.py      # 工作流类实现
│   │   └── __init__.py      # 包初始化和接口导出
│   ├── examples/            # 示例模块和工作流
│   │   ├── example_modules.py # 预定义模块实现
│   │   ├── example_workflow.py # 示例工作流
│   │   ├── example_workflow.json # 序列化后的工作流示例
│   │   └── __init__.py      # 包初始化
│   └── __init__.py          # 后端包初始化
├── frontend/                # 前端界面（正在开发）
│   ├── node_modules/        # npm依赖
│   ├── public/              # 静态资源
│   ├── src/                 # 源代码
│   │   ├── assets/          # 资源文件
│   │   ├── App.tsx          # 主应用组件
│   │   ├── main.tsx         # 应用入口
│   │   └── ...              # 其他前端文件
│   ├── src-tauri/           # Tauri桌面应用配置
│   ├── package.json         # npm包配置
│   ├── vite.config.ts       # Vite构建配置
│   └── ...                  # 其他配置文件
├── .gitignore               # Git忽略文件配置
├── README.md                # 项目说明文档
├── development.md           # 开发状态文档（本文件）
└── build_reference.md       # 构建参考文档
```

### 配置文件

- **.gitignore**: Git忽略规则配置
- **README.md**: 项目概述和使用说明
- **development.md**: 开发状态文档
- **build_reference.md**: 构建参考文档，包含技术栈配置指南

### 依赖关系

- **核心依赖**: backend.core 包含系统核心组件，不依赖其他内部模块
- **示例依赖**: backend.examples 依赖 backend.core 实现示例功能
- **前端依赖**: 依赖React生态组件，包括react-flow进行工作流可视化
- **外部依赖**: 
  - 后端目前仅依赖Python标准库，无第三方依赖
  - 前端依赖详见frontend/package.json

## 核心组件状态

### BaseModule

**状态**: 已完成 ✅
**版本**: 1.0
**文件位置**: `backend/core/base_module.py`

**已实现功能**:
- 基础模块抽象类定义
- 输入/输出端口管理
- 参数管理
- 基本序列化/反序列化功能

**待实现功能**:
- 高级参数验证机制
- 模块间依赖关系管理

**组件交互方式**:
- 通过ModuleRegistry注册和创建实例
- 被Workflow管理生命周期
- 由WorkflowEngine调用execute方法执行

### Workflow

**状态**: 已完成 ✅
**版本**: 1.0
**文件位置**: `backend/core/workflow.py`

**已实现功能**:
- 工作流创建和管理
- 模块添加和删除
- 模块连接管理
- 工作流验证
- 序列化/反序列化

**待实现功能**:
- 子工作流支持
- 工作流模板

**组件交互方式**:
- 持有并管理BaseModule实例
- 由WorkflowEngine创建和执行
- 支持连接的创建与验证

### ModuleRegistry

**状态**: 已完成 ✅
**版本**: 1.0
**文件位置**: `backend/core/module_registry.py`

**已实现功能**:
- 模块注册机制
- 模块分类管理
- 模块实例创建

**待实现功能**:
- 插件系统支持
- 动态加载模块

**组件交互方式**:
- 向外界提供模块类型信息
- 为WorkflowEngine提供模块创建服务
- 管理全局模块注册表

### WorkflowEngine

**状态**: 已完成 ✅
**版本**: 1.0
**文件位置**: `backend/core/engine.py`

**已实现功能**:
- 工作流执行逻辑
- 执行结果管理
- 异步执行支持
- 进度回调

**待实现功能**:
- 执行历史记录
- 工作流暂停/恢复
- 错误恢复机制

**组件交互方式**:
- 创建和管理Workflow实例
- 协调工作流执行过程
- 管理执行结果和状态
- 提供进度回调接口

## 模块开发状态

### 基础模块

#### NumberGeneratorModule

**状态**: 已完成 ✅
**版本**: 1.0
**文件位置**: `backend/examples/example_modules.py`

**功能描述**:
生成随机数或指定范围内的数值，可配置输出数值的类型和范围。

**接口**:
- 输入端口: 无
- 输出端口: "number" (number) - 生成的数值
- 参数:
  - "min": 最小值 (默认: 0)
  - "max": 最大值 (默认: 100)
  - "type": 数值类型 ("int" 或 "float", 默认: "int")

**使用示例**:
```python
num_gen = NumberGeneratorModule("随机数生成器")
num_gen.set_parameter("min", 10)
num_gen.set_parameter("max", 20)
num_gen.set_parameter("type", "int")
result = num_gen.execute({})  # 返回 {"number": 15} (随机值)
```

#### MathOperationModule

**状态**: 已完成 ✅
**版本**: 1.0
**文件位置**: `backend/examples/example_modules.py`

**功能描述**:
执行基本数学运算，支持加减乘除等操作。

**接口**:
- 输入端口:
  - "input1" (number) - 第一个数值
  - "input2" (number) - 第二个数值
- 输出端口:
  - "result" (number) - 运算结果
- 参数:
  - "operation": 运算类型 ("add", "subtract", "multiply", "divide", 默认: "add")

**使用示例**:
```python
math_op = MathOperationModule("加法运算")
math_op.set_parameter("operation", "add")
result = math_op.execute({"input1": 5, "input2": 3})  # 返回 {"result": 8}
```

### 数据处理模块

#### DataTransformModule

**状态**: 已完成 ✅
**版本**: 1.0
**文件位置**: `backend/examples/example_modules.py`

**功能描述**:
对输入数据进行转换处理，支持类型转换、格式化等操作。

**接口**:
- 输入端口:
  - "input" (any) - 输入数据
- 输出端口:
  - "output" (any) - 转换后的数据
- 参数:
  - "transform_type": 转换类型 ("to_string", "to_number", "format", 默认: "to_string")
  - "format_template": 格式化模板 (用于format转换类型, 默认: "{}")

**使用示例**:
```python
transform = DataTransformModule("数据转换")
transform.set_parameter("transform_type", "format")
transform.set_parameter("format_template", "值: {}")
result = transform.execute({"input": 42})  # 返回 {"output": "值: 42"}
```

#### FilterModule

**状态**: 已完成 ✅
**版本**: 1.0
**文件位置**: `backend/examples/example_modules.py`

**功能描述**:
根据条件过滤输入数据。

**接口**:
- 输入端口:
  - "input" (list) - 输入数据列表
- 输出端口:
  - "output" (list) - 过滤后的数据列表
- 参数:
  - "condition": 过滤条件 (字符串表达式, 默认: "True")

**使用示例**:
```python
filter_mod = FilterModule("过滤器")
filter_mod.set_parameter("condition", "x > 5")
result = filter_mod.execute({"input": [3, 7, 2, 9, 4]})  # 返回 {"output": [7, 9]}
```

### 文件操作模块

#### FileReaderModule

**状态**: 已完成 ✅
**版本**: 1.0
**文件位置**: `backend/examples/example_modules.py`

**功能描述**:
读取文件内容。

**接口**:
- 输入端口:
  - "file_path" (string) - 文件路径
- 输出端口:
  - "content" (string) - 文件内容
- 参数:
  - "encoding": 文件编码 (默认: "utf-8")

**使用示例**:
```python
reader = FileReaderModule("文件读取器")
reader.set_parameter("encoding", "utf-8")
result = reader.execute({"file_path": "data.txt"})  # 返回 {"content": "文件内容..."}
```

#### FileWriterModule

**状态**: 已完成 ✅
**版本**: 1.0
**文件位置**: `backend/examples/example_modules.py`

**功能描述**:
将内容写入文件。

**接口**:
- 输入端口:
  - "content" (string) - 要写入的内容
  - "file_path" (string) - 文件路径
- 输出端口:
  - "success" (boolean) - 写入是否成功
- 参数:
  - "mode": 写入模式 ("w", "a", 默认: "w")
  - "encoding": 文件编码 (默认: "utf-8")

**使用示例**:
```python
writer = FileWriterModule("文件写入器")
writer.set_parameter("mode", "w")
result = writer.execute({"content": "Hello World", "file_path": "output.txt"})  # 返回 {"success": True}
```

## 前端开发状态

### React应用

**状态**: 开发中 🔄
**版本**: 0.1.0
**文件位置**: `frontend/src/`

**已完成功能**:
- 基础应用框架搭建
- 项目依赖配置

**进行中功能**:
- 工作流编辑器界面
- 模块面板组件
- 连接管理逻辑

**待实现功能**:
- 工作流执行控制
- 结果可视化
- 工作流保存/加载

### Tauri桌面应用

**状态**: 配置中 🔄
**版本**: 0.1.0
**文件位置**: `frontend/src-tauri/`

**已完成功能**:
- 基础配置设置

**进行中功能**:
- Python后端通信集成

**待实现功能**:
- 应用打包配置
- 跨平台兼容性测试

## 最近更新记录

### 2023-06-25: 前端框架整合

**主要变更**:
- 添加React前端框架
- 配置Tauri桌面应用框架
- 设计前后端通信方案

**变更原因**:
开始实现用户界面，为工作流提供可视化支持。

**版本兼容性**:
需确保前端能正确调用后端API，与现有工作流引擎交互。

### 2023-06-20: 技术栈确定

**主要变更**:
- 确定前端技术栈: React + React-flow + ECharts + Ant Design
- 确定后端技术栈: Python + FastAPI(可选)
- 确定桌面封装方案: Tauri(Rust)
- 设计通信架构: 混合IPC和REST API模式

**变更原因**:
为项目确定合适的技术栈，平衡开发效率和运行性能。

**版本兼容性**:
技术栈选择不影响当前核心组件兼容性。

### 2023-06-15: 初始版本发布

**主要变更**:
- 完成核心组件实现
- 添加基本示例模块
- 创建示例工作流
- 添加序列化/反序列化支持

**变更原因**:
初始功能集实现完成，可以开始使用和测试。

**版本兼容性**:
初始版本，无兼容性问题。

## 技术栈详细说明

### 系统架构

项目采用前后端分离架构，结合桌面应用封装，提供灵活的部署和使用方式。

### 前端技术

- **核心框架**: React 18
- **工作流交互**: React-flow
- **数据可视化**: ECharts
- **UI组件库**: Ant Design
- **构建工具**: Vite

### 后端技术

- **核心语言**: Python 3.8+
- **API框架**: FastAPI（可选，用于Web服务）
- **桌面端封装**: Tauri（轻量级Rust框架）

### 通信方式

- **混合模式**:
  - **高频调用**: IPC（进程间通信）
    - 需要少量Rust胶水代码
    - 前端通过`std process Command`调用Python脚本
    - 性能更优
  - **复杂逻辑**: FastAPI
    - 不需要Rust代码
    - 需处理服务生命周期管理
    - 适合Web部署模式

### 调试工具

- **前端调试**: Chrome DevTools 
- **Rust调试**: VS Code + Rust Analyzer
- **Python调试**: PyCharm/VS Code 断点调试

### 部署模式

- **桌面应用**: 通过Tauri打包为独立应用程序
- **Web应用**: 可选部署为Web服务（需启用FastAPI后端）
- **混合部署**: 支持桌面应用连接远程服务器

## 计划开发功能

### 短期计划 (1-2个月)

- **前端工作流编辑器**:
  - 节点拖拽交互
  - 连接线管理
  - 参数配置界面
  - 优先级: 高
  - 技术风险: 中

- **更多预定义模块**:
  - 数据可视化模块
  - API请求模块
  - 数据库操作模块
  - 优先级: 高
  - 技术风险: 低

- **执行优化**:
  - 并行执行支持
  - 大数据处理优化
  - 优先级: 中
  - 技术风险: 中

### 中期计划 (3-6个月)

- **插件系统**:
  - 模块动态加载
  - 第三方插件支持
  - 优先级: 中
  - 技术风险: 高

- **版本控制**:
  - 工作流版本历史
  - 变更对比
  - 优先级: 低
  - 技术风险: 低

- **高级调度**:
  - 定时执行
  - 条件触发
  - 优先级: 低
  - 技术风险: 中

### 长期计划 (6个月以上)

- **协作功能**:
  - 多用户编辑
  - 权限管理
  - 工作流共享
  - 优先级: 低
  - 技术风险: 高

- **云部署支持**:
  - 远程执行
  - 资源管理
  - 横向扩展
  - 优先级: 低
  - 技术风险: 高

## 代码规范

### 通用规范

- **文件编码**: 统一使用UTF-8编码
- **行尾**: 使用LF (Unix风格) 换行符
- **缩进**: 使用4个空格（不使用制表符）
- **行长**: 限制每行最多88个字符
- **文件结构**: 每个文件应包含适当的文件头注释
- **TODO标记**: 使用 `# TODO: 说明` 格式标记待办事项

### Python代码规范

- **PEP8**: 遵循PEP8编码规范
- **类型提示**: 所有函数和方法都应使用类型提示 (PEP 484)
- **文档字符串**: 使用Google风格的docstring
- **导入顺序**: 标准库 > 第三方库 > 本地模块，按字母排序
- **命名约定**:
  - 类名: 使用CamelCase（如BaseModule）
  - 函数/方法名: 使用snake_case（如add_module）
  - 常量: 使用UPPER_CASE（如MAX_MODULES）
  - 模块成员变量: 使用_前缀（如self._id）
  - 全局变量: 使用g前缀（如gmodule_registry）

### JavaScript/TypeScript代码规范

- **格式化**: 使用Prettier，ESLint检查
- **组件**: 优先使用函数组件和Hooks
- **状态管理**: 使用React Context或Redux
- **类型**: 使用TypeScript进行类型定义
- **命名约定**:
  - 组件: 使用PascalCase（如WorkflowEditor）
  - 函数/变量: 使用camelCase（如connectModules）
  - 常量: 使用UPPER_CASE（如DEFAULT_SETTINGS）
  - 接口: 使用I前缀（如IModuleProps）
- **文件组织**: 每个组件一个文件，与组件同名

## 贡献指南

### 开发环境设置

1. **后端开发环境**:
   - Python 3.8+
   - 无需第三方依赖（目前）

2. **前端开发环境**:
   - Node.js 16+
   - npm 8+
   - 安装依赖：`cd frontend && npm install`

3. **Tauri开发环境**:
   - 按照[Tauri官方文档](https://tauri.app/v1/guides/getting-started/prerequisites)设置

### 开发流程

1. **分支管理**:
   - `main`: 稳定分支
   - `dev`: 开发分支
   - 功能分支: `feature/xxx`
   - 修复分支: `fix/xxx`

2. **提交规范**:
   - 使用语义化提交信息
   - 格式: `<type>: <description>`
   - 常用类型: feat, fix, docs, refactor, test

### 测试指南

- **后端测试**: 编写单元测试，确保核心组件稳定性
- **前端测试**: 组件测试 + 集成测试
- **E2E测试**: 待实现

## 最佳实践

### 架构设计原则

- **单一职责**: 每个模块和组件应专注于单一功能
- **依赖注入**: 避免硬编码依赖，使用注入方式
- **开闭原则**: 设计支持扩展而非修改
- **接口分离**: 定义精确的小接口而非大而全的接口
- **可测试性**: 设计便于单元测试的组件结构

### 模块开发指南

- **模块独立性**: 模块应尽可能独立，减少相互依赖
- **输入验证**: 始终验证模块输入的有效性
- **异常处理**: 合理处理异常，不允许异常传播到模块外部
- **执行幂等性**: 模块执行应尽可能设计为幂等操作
- **参数默认值**: 为参数提供合理的默认值，提高易用性

### 前端开发指南

- **组件设计**: 遵循组件化思想，合理拆分组件
- **状态管理**: 谨慎选择状态管理方式，避免不必要的复杂性
- **性能优化**: 注意大数据量下的渲染性能
- **响应式设计**: 支持不同屏幕尺寸
- **主题支持**: 考虑明暗主题切换

### 测试策略

- **单元测试**: 使用pytest框架，针对各组件和模块进行独立测试
- **集成测试**: 测试模块组合和工作流执行
- **测试覆盖率**: 核心代码应保持80%以上的测试覆盖率
- **测试数据**: 使用固定的测试数据集，确保测试结果一致性
- **模拟对象**: 使用mock对象隔离外部依赖

### 性能优化

- **延迟加载**: 按需加载模块和资源
- **缓存策略**: 合理缓存计算结果和资源
- **并行处理**: 支持模块并行执行优化性能
- **内存管理**: 注意大数据处理时的内存使用
- **性能分析**: 定期进行性能分析，识别瓶颈 