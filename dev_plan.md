这是一个详细的开发计划，旨在逐步实现模块多种输入输出形态的功能。我们将分阶段进行，确保每个环节都得到充分考虑。

**开发计划：模块动态输入/输出形态**

**第一部分：后端核心机制增强**

*   **目标**：修改后端核心类以支持模块变体、动态端口配置及相应的持久化。

*   **阶段 1.1: 基础数据结构定义与 `Port` 类增强**
    *   **任务 1.1.1**: 定义核心数据结构 (Python TypedDict 或 dataclass)。
        *   `PortDefinition`: 用于描述一个端口的静态定义。
            *   `name: str`
            *   `port_io_type: Literal['input', 'output']` (明确是输入还是输出)
            *   `data_type: str` (如 'number', 'string', 'dataframe', 'any')
            *   `description: str`
            *   `is_optional: bool` (此端口是否为可选端口)
            *   `default_enabled: bool` (如果可选，是否默认启用)
            *   `allow_multiple_connections: bool` (通常输入为False，输出为True)
        *   `VariantDefinition`: 用于描述一个模块变体的静态定义。
            *   `variant_id: str` (唯一标识变体，如 'default', 'detailed_output')
            *   `variant_name: str` (用户友好的变体名称，如 "基础模式", "详细输出模式")
            *   `description: str`
            *   `port_definitions: List[PortDefinition]` (此变体包含的端口定义列表)
    *   **任务 1.1.2**: 增强 `Port` 类 (`backend/core/base_module.py`)。
        *   **关键点**:
            *   确保 `_type` 属性使用的是一套预定义的、规范的数据类型常量/枚举。
            *   可以考虑为 `Port` 实例添加 `is_dynamically_added: bool` 属性，以区分是变体固有端口还是用户后续动态添加的（如果支持更自由的动态添加）。但初期可以先聚焦于预设变体。

*   **阶段 1.2: `BaseModule` 类重构**
    *   **任务 1.2.1**: 在 `BaseModule` 中引入变体和动态端口管理机制。
        *   **关键点**:
            *   **变体定义**: 添加一个抽象类方法 `_get_variant_definitions(cls) -> Dict[str, VariantDefinition]`。每个具体的模块子类（如 `DBSCANModule`）将重写此方法，返回其支持的所有变体定义。
            *   **当前状态**:
                *   添加实例属性 `_current_variant_id: Optional[str]`，存储当前激活的变体ID。
                *   添加实例属性 `_current_ports_config: Dict[str, bool]`，用于存储可选端口的启用/禁用状态 (键为 `PortDefinition` 中的 `name`)。
            *   **核心逻辑**: 实现私有方法 `_apply_active_variant_and_config(self)`:
                1.  获取 `self._current_variant_id` 对应的 `VariantDefinition`。
                2.  清空当前的 `self._input_ports` 和 `self._output_ports`。
                3.  遍历 `VariantDefinition.port_definitions`：
                    *   对于非可选端口，或可选但 `_current_ports_config` 中标记为启用的端口，使用 `self.add_input_port()` 或 `self.add_output_port()` 创建实际的 `Port` 对象并添加到相应的字典中。
            *   **公共接口**:
                *   提供 `set_variant(self, variant_id: str, optional_ports_override: Optional[Dict[str, bool]] = None)` 方法。此方法会：
                    1.  更新 `self._current_variant_id` 和 `self._current_ports_config`。
                    2.  调用 `_apply_active_variant_and_config()` 来重建端口。
                    3.  **重要**: 需要处理切换变体时，现有连接如何处置的问题（见阶段1.3.2）。
            *   **初始化**: 修改 `__init__` 方法，接受 `initial_variant_id` 和 `initial_ports_config`，并在初始化结束时调用 `_apply_active_variant_and_config()`。如果未提供，则使用模块定义的默认变体。
    *   **任务 1.2.2**: 更新 `BaseModule` 的序列化与反序列化。
        *   `to_dict()`: 需保存 `_current_variant_id` 和 `_current_ports_config`。
        *   `from_dict()` (在各子类中实现): 需恢复这些状态，并在模块对象完全构建后调用 `_apply_active_variant_and_config()` 来确保端口根据保存的状态正确重建。

*   **阶段 1.3: `ModuleRegistry` 和 `Workflow` 适应性修改**
    *   **任务 1.3.1**: 增强 `ModuleRegistry` (`backend/core/module_registry.py`)。
        *   **关键点**:
            *   `create_instance()`: 应能接受 `initial_variant_id` 和 `initial_ports_config` 参数，并将它们传递给模块的构造函数。
            *   需要提供一种方式让前端能够查询到某个模块类型支持的所有变体定义 (`VariantDefinition`) 及其端口定义 (`PortDefinition`)，以便在属性面板中展示。这可能需要一个新的方法，如 `get_module_variant_details(module_name: str) -> Dict[str, VariantDefinition]`。
    *   **任务 1.3.2**: 增强 `Workflow` 类 (`backend/core/workflow.py`)。
        *   **连接验证 (`connect` 方法)**:
            *   **类型兼容性**: 实现一个更灵活的类型兼容性检查逻辑。可以定义一个兼容性映射表或函数 `are_types_compatible(source_type: str, target_type: str) -> bool`。
            *   **端口存在性**: 在尝试连接之前，务必确认源模块的输出端口和目标模块的输入端口在它们当前的变体配置下确实存在。
        *   **端口ID稳定性**: 由于端口现在是动态生成的，端口的 `_id` (UUID) 会在每次 `_apply_active_variant_and_config` 调用时改变。这对 `Workflow` 保存和加载连接是个挑战。
            *   **方案A (推荐)**: 连接时不直接存储 `Port._id`，而是存储端口的稳定名称 (`Port._name`)。在 `connect` 和加载时，根据 `module_id` 和 `port_name` 查找实际的 `Port` 对象。这意味着模块内同为输入或同为输出的端口名称必须唯一。
            *   **方案B**: `Port._id` 在变体切换时尽量保持不变（如果端口定义在不同变体间是“同一个”逻辑端口的话），但这会增加 `_apply_active_variant_and_config` 的复杂性。
        *   **处理连接断开**: 当模块通过 `set_variant` 改变形态导致某些已连接的端口被移除时：
            *   `set_variant` 方法在调用 `_apply_active_variant_and_config` *之前*，应检查哪些现有端口会被删除。
            *   对于每个将被删除的端口，遍历其 `_connected_to`，找到相关的 `Connection` 对象，并从 `Workflow._connections` 中移除它们。同时更新对端 `Port` 的 `_connected_to`。
            *   这需要 `BaseModule` 能访问其所属的 `Workflow` 对象，或者 `Workflow` 提供一个接口来处理这种变体变更事件。
        *   **序列化 (`save`, `load`)**:
            *   如果采用方案A (使用端口名称连接)，`Connection.to_dict()` 保存的是 `source_port_name` 和 `target_port_name`。`Workflow.load()` 时，在模块及其变体被加载和应用后，根据模块ID和端口名称重新建立连接。

*   **阶段 1.4: `WorkflowEngine` 适应性修改**
    *   **任务 1.4.1**: 确保引擎使用正确的端口数据。
        *   `_get_source_data()`: 如果连接是基于端口名称的，此方法需要根据模块ID和端口名称从 `module.output_ports` (或 `module.input_ports`) 查找正确的 `Port` 对象，然后获取其数据。
        *   模块的 `execute()` 方法 (在各具体模块子类中):
            *   需要能感知当前的 `self._current_variant_id`。
            *   根据当前变体，从 `inputs` 字典中按端口名称（或ID，取决于连接策略）获取数据。
            *   根据当前变体，将结果放入 `outputs` 字典，键也应是当前变体下存在的输出端口名称（或ID）。

*   **阶段 1.5: 更新或创建示例模块**
    *   **任务 1.5.1**: 选择一个模块 (如 `ConditionalModule` 或创建一个模拟的 `DBSCANModule`)。
        *   实现 `_get_variant_definitions()`，定义至少两种有意义的变体 (例如，DBSCAN的“仅核心点输出”和“核心点+噪声输出”)。
        *   更新其 `__init__`, `execute`, `to_dict`, `from_dict` 以支持新的变体机制和基于名称的端口访问。

**第二部分：前端用户界面与交互**

*   **目标**：实现用户在界面上选择模块变体、配置可选端口，并确保画布和属性面板的动态响应和视觉效果。

*   **阶段 2.1: 数据结构与状态管理 (`WorkflowDesigner.tsx` 及相关)**
    *   **任务 2.1.1**: 定义前端数据接口。
        *   创建与后端 `VariantDefinition`, `PortDefinition` 对应的 TypeScript 接口。
    *   **任务 2.1.2**: 扩展节点状态。
        *   在 `Node` (来自 `@xyflow/react`) 的 `data` 属性中添加：
            *   `currentVariantId: string`
            *   `activePortsConfig: { [portName: string]: boolean }`
            *   `availableVariants: VariantDefinition[]` (从后端获取的该模块类型所有可用变体)
    *   **任务 2.1.3**: API 调用。
        *   实现从后端获取模块类型可用变体定义的API调用。

*   **阶段 2.2: 画布节点 (`Canvas` 和自定义节点组件) 更新**
    *   **任务 2.2.1**: 动态端口渲染。
        *   自定义节点组件 (当前是 `customNode`) 需要重构：
            *   接收节点的 `data.currentVariantId` 和 `data.activePortsConfig`。
            *   根据这些信息和 `data.availableVariants` 中的定义，动态计算并渲染输入和输出端口 (`Handle` 组件)。 Handle 的 `id` 应设置为端口的稳定名称。
    *   **任务 2.2.2**: 实现画布内变体切换交互 (可选高级功能)。
        *   如之前讨论的，在节点上悬停显示切换箭头，点击循环切换 `currentVariantId`。这会触发更新节点数据，进而重渲染。

*   **阶段 2.3: `PropertyPanel` 重构**
    *   **任务 2.3.1**: 动态属性显示。
        *   当 `selectedNode` 改变时，`PropertyPanel` 从 `selectedNode.data.availableVariants` 获取变体信息。
        *   显示一个选择器 (如 AntD `Select` 或 `Segmented` control) 让用户切换 `selectedNode.data.currentVariantId`。
        *   根据当前选中的变体定义，如果存在 `is_optional: true` 的端口，显示复选框让用户控制其在 `selectedNode.data.activePortsConfig` 中的状态。
    *   **任务 2.3.2**: 双向数据绑定。
        *   属性面板中对变体或可选端口的更改，需要更新 `WorkflowDesigner` 中的 `nodes` 状态 (特别是对应节点的 `data`)。
        *   这会通过 React 的状态管理机制自动触发画布节点的重渲染。

*   **阶段 2.4: 连接逻辑与视觉反馈 (`onConnect`, `Canvas`)**
    *   **任务 2.4.1**: 前端连接验证。
        *   在 `onConnect` 处理函数中，在调用后端API之前，可以进行初步的客户端类型兼容性检查（基于 `availableVariants` 中的端口类型信息）。
        *   根据验证结果提供即时视觉反馈（如连接线颜色）。
    *   **任务 2.4.2**: 处理因变体切换导致的连接变化。
        *   当用户在属性面板或画布上更改模块变体，如果导致已连接的端口消失：
            *   前端应能检测到这种情况。
            *   可以弹窗提示用户：“切换变体将断开 X 条连接，是否继续？”
            *   如果用户确认，则前端负责更新状态以移除这些连接线，并通知后端更新工作流数据。
    *   **任务 2.4.3**: 端口可视化。
        *   为不同 `data_type` 的端口 `Handle` 应用不同的样式（颜色、形状）。

**第三部分：测试与迭代**

*   **任务 3.1**: 单元测试。
    *   后端：测试 `BaseModule` 的变体应用逻辑、端口重建、序列化/反序列化。测试 `Workflow` 的连接（基于名称）、加载/保存含变体的工作流。
*   **任务 3.2**: 集成测试。
    *   测试从前端选择变体 -> 后端模块状态更新 -> 前端画布节点更新 的完整流程。
    *   测试加载保存复杂工作流，包含多种变体配置的模块。
*   **任务 3.3**: 用户体验 (UX) 测试。
    *   邀请用户（或团队成员）实际操作，收集反馈，优化交互流程和视觉提示。

**第四部分：文档更新**

*   **任务 4.1**: 更新 `development.md`。
    *   详细记录新的模块变体系统、数据结构、核心类的改动。
*   **任务 4.2**: 更新 `API_frontend.md` (如果前端API有变动)。
    *   记录与模块变体相关的新的前端组件Props或状态结构。
*   **任务 4.3**: (可选) 用户文档。
    *   为最终用户编写如何使用模块变体和配置端口的指南。

**关键原则：**

*   **迭代开发**：先完成后端核心逻辑，再逐步构建前端交互。每个阶段都可以进一步细分为小任务。
*   **后端优先**：确保后端数据模型和逻辑的正确性是首要任务。
*   **清晰的API契约**：前后端之间关于模块定义、变体信息、状态更新的通信需要有明确的API。
*   **用户体验**：在前端实现时，始终考虑操作的直观性和反馈的清晰性。

