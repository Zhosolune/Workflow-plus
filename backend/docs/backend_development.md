# 后端开发文档 (backend_development.md)

本文档详细介绍了工作流系统后端的核心组件、技术细节以及开发流程，旨在为后端开发人员提供参考和维护指南。

## 1. 概述

- **项目目标**: 创建一个灵活、可扩展的工作流系统，使用户能够以可视化方式创建、配置和执行各种数据处理任务。
- **后端架构概览**: 后端核心主要由以下组件构成，它们位于 `backend/core` 目录下：
    - `BaseModule`: 所有模块的基类，定义了模块的基本接口和行为。
    - `ModuleRegistry`: 负责模块类型的注册和实例化。
    - `Workflow`: 管理工作流中的模块及其连接。
    - `WorkflowEngine`: 负责工作流的执行、控制和状态管理。
- **API接口**: 后端通过 `API_backend_interaction.md` 中定义的API与前端进行交互。

## 2. 模块 (Module) 开发

模块是工作流的基本执行单元。

### 2.1. 模块定义 (`BaseModule` - `backend/core/base_module.py`)

所有自定义模块都必须继承自 `BaseModule`。

- **核心属性**:
    - `_id (str)`: 模块实例的唯一ID (自动生成)。
    - `_name (str)`: 模块实例的名称。
    - `_description (str)`: 模块实例的描述。
    - `_input_ports (Dict[str, Port])`: 输入端口字典，键为端口ID，值为 `Port` 对象。
    - `_output_ports (Dict[str, Port])`: 输出端口字典，键为端口ID，值为 `Port` 对象。
    - `_parameters (Dict[str, Any])`: 模块自定义参数。
    - `_position (Tuple[float, float])`: 模块在UI画布上的位置。
    - `_execution_status (str)`: 模块当前的执行状态 ("idle", "running", "completed", "error")。
    - `_error_message (str)`: 模块执行出错时的错误信息。

- **模块变体 (Variants)**:
    模块可以定义不同的"变体"，每种变体可以有不同的端口配置。
    - `VariantDefinition (dataclass)`: 定义一个变体的元数据。
        - `variant_id (str)`: 变体的唯一标识。
        - `variant_name (str)`: 变体的显示名称。
        - `description (str)`: 变体的描述。
        - `port_definitions (List[PortDefinition])`: 该变体包含的端口定义列表。
    - `PortDefinition (dataclass)`: 定义一个端口的元数据。
        - `name (str)`: 端口的名称 (在模块内应唯一)。
        - `port_io_type (Literal['input', 'output'])`: 端口是输入还是输出。
        - `data_type (str)`: 端口期望/产生的数据类型 (如 "string", "number", "dataframe", "any")。
        - `description (str)`: 端口的描述。
        - `is_optional (bool)`: 该端口是否为可选端口。
        - `default_enabled (bool)`: 如果是可选端口，默认是否启用。
        - `allow_multiple_connections (bool)`: 是否允许该端口有多条连接 (当前主要在定义层面，执行层面简化为单连接)。
    - **实现 `_get_variant_definitions(cls) -> Dict[str, VariantDefinition]`**:
        这是一个**类方法**，子模块必须实现此方法，返回一个字典，键为变体ID，值为 `VariantDefinition` 对象。
    - `_current_variant_id (Optional[str])`: 当前模块实例激活的变体ID。
    - `_current_ports_config (Dict[str, bool])`: 当前激活变体下，可选端口的启用状态 (键为端口名，值为布尔值)。
    - `_apply_active_variant_and_config()`: 内部方法，根据 `_current_variant_id` 和 `_current_ports_config` 创建或更新模块的实际 `_input_ports` 和 `_output_ports`。它会清除旧端口并根据变体定义和配置重建它们。
    - `set_variant(variant_id: str, optional_ports_override: Optional[Dict[str, bool]] = None)`: 用于切换模块的当前变体。可以覆盖可选端口的启用状态。调用此方法会触发 `_apply_active_variant_and_config()`。

- **端口 (`Port` - `backend/core/base_module.py`)**:
    代表模块的输入或输出点。
    - 属性:
        - `_id (str)`: 端口对象的唯一ID (自动生成)。
        - `_name (str)`: 端口的名称 (与 `PortDefinition` 中的 `name` 对应)。
        - `_type (str)`: 端口的数据类型 (与 `PortDefinition` 中的 `data_type` 对应)。
        - `_description (str)`: 端口的描述。
        - `_connected_to (Set[str])`: **存储连接到此端口的对端端口的名称集合**。
    - 方法:
        - `connect(port_name: str)`: 将此端口标记为已连接到指定名称的对端端口。
        - `disconnect(port_name: str)`: 断开与指定名称对端端口的连接。
        - `disconnect_all()`: 断开所有连接。

- **参数**:
    - `set_parameter(key: str, value: Any)`: 设置模块参数。
    - `get_parameter(key: str, default: Any = None)`: 获取模块参数。

### 2.2. 模块功能实现

每个模块的核心逻辑在其 `execute` 方法中实现。

- **实现 `execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]`**:
    这是一个抽象方法，子模块必须实现。
    - `inputs (Dict[str, Any])`: 一个字典，**键是输入端口的名称**，值是来自上游模块的输入数据。
    - 返回值 `(Dict[str, Any])`: 一个字典，**键是输出端口的名称**，值是要传递给下游模块的输出数据。
    - 在执行前后，模块的 `_execution_status` 和 `_error_message` 会被引擎更新。

### 2.3. 模块注册 (`ModuleRegistry` - `backend/core/module_registry.py`)

`ModuleRegistry` 负责管理系统中所有可用的 `BaseModule` 子类。

- **全局注册表实例**: `gmodule_registry = ModuleRegistry()` (在 `module_registry.py`末尾创建)。
- **注册模块**:
    - `register(module_class: Type[BaseModule], category: str = "默认")`:
        将一个 `BaseModule` 子类注册到系统中。
        - `module_class`: 要注册的模块类。
        - `category`: 模块所属的类别，用于UI组织。
- **创建模块实例**:
    - `create_instance(module_name: str, *args: Any, **kwargs: Any) -> Optional[BaseModule]`:
        根据已注册的模块类名创建模块实例。
        - `module_name`: 模块的类名 (如 "MyCustomModule")。
        - `**kwargs` 可以包括 `id` (实例ID,来自前端节点的instanceId), `name` (实例名), `description`, `initial_variant_id`, `initial_ports_config`, `properties` (模块特定参数) 等传递给 `BaseModule` 构造函数的参数。
- **获取模块变体详情**:
    - `get_module_variant_details(module_name: str) -> Optional[Dict[str, VariantDefinition]]`:
        获取指定模块类型支持的所有变体定义及其端口定义。调用模块类的 `_get_variant_definitions()` 方法。

## 3. 工作流 (Workflow) 管理 (`Workflow` - `backend/core/workflow.py`)

`Workflow` 类代表一个包含模块和它们之间连接的图。

### 3.1. 工作流定义

- **核心属性**:
    - `_id (str)`: 工作流的唯一ID (自动生成)。
    - `_name (str)`: 工作流的名称。
    - `_description (str)`: 工作流的描述。
    - `_modules (Dict[str, BaseModule])`: 工作流中包含的模块实例字典，键为模块ID。
    - `_connections (Dict[str, Connection])`: 工作流中的连接字典，键为连接ID。

- **模块管理**:
    - `add_module(module: BaseModule) -> str`: 将模块实例添加到工作流，返回模块ID。
    - `remove_module(module_id: str) -> bool`: 从工作流移除模块及其相关连接。

- **连接管理 (`Connection` - `backend/core/workflow.py`)**:
    `Connection` 类表示两个模块端口之间的连接。
    - `Connection` 属性:
        - `_id (str)`: 连接的唯一ID (自动生成)。
        - `_source_module_id (str)`: 源模块的ID。
        - `_source_port_name (str)`: 源模块的输出端口名称。
        - `_target_module_id (str)`: 目标模块的ID。
        - `_target_port_name (str)`: 目标模块的输入端口名称。
    - **创建连接**:
        - `connect(source_module_id: str, source_port_name: str, target_module_id: str, target_port_name: str) -> Optional[str]`:
            基于模块ID和**端口名称**创建连接。
            - 内部使用 `_find_port_by_name(module, port_name, port_io_type)` 辅助函数查找实际的 `Port` 对象。
            - 进行简单的类型兼容性检查：如果源端口类型和目标端口类型不匹配，并且两者都不是 'any' 类型，则连接失败。
            - 成功连接后，会更新源 `Port` 和目标 `Port` 对象的 `_connected_to` 属性（互相记录对端端口名称）。
            - 返回连接ID或 `None`。
    - **移除连接**:
        - `remove_connection(connection_id: str) -> bool`: 根据连接ID移除连接，并更新相关 `Port` 对象的连接状态。
    - **处理模块变体变更**:
        - `handle_module_variant_change(module_id: str, old_ports: Dict[str, Set[str]], new_ports: Dict[str, Set[str]])`:
            当模块的变体发生变化导致其端口集发生改变时调用。
            - `old_ports`/`new_ports` 结构: `{'input': {port_name1, ...}, 'output': {port_name3, ...}}`。
            - 该方法会移除所有连接到已不复存在的端口的连接。

- **依赖关系查询**:
    - `get_dependent_modules(module_id: str) -> Set[str]`: 获取直接依赖于指定模块的所有下游模块ID。
    - `get_dependency_modules(module_id: str) -> Set[str]`: 获取指定模块直接依赖的所有上游模块ID。

### 3.2. 工作流序列化与反序列化

工作流可以保存到JSON文件并在之后加载回来。

- `to_dict() -> Dict[str, Any]`: 将整个工作流（包括模块和连接）转换为字典结构。
    - 模块通过其 `to_dict()` 方法序列化，其中包含 `module_type` (类名), `id` (实例ID), `name` (实例名), `description`, `current_variant_id`, `current_ports_config`, `properties` (模块参数), `position`。
- `save(filepath: str) -> None`: 将 `to_dict()` 的结果保存为JSON文件。
- `load(cls, filepath: str, module_registry_instance: ModuleRegistry) -> 'Workflow'`:
    从JSON文件加载工作流。
    - 需要一个 `ModuleRegistry` 实例用于根据模块的 `module_type` (类名) 和其他保存的属性 (如 `id` (实例ID), `name`, `description`, `initial_variant_id`, `initial_ports_config`, `properties`, `position`) 来重新创建模块实例。
    - 加载模块后，再根据保存的连接信息调用 `workflow.connect()` 方法重建连接。

## 4. 工作流执行引擎 (`WorkflowEngine` - `backend/core/engine.py`)

`WorkflowEngine` 负责管理和执行工作流。

### 4.1. 引擎概述

- **核心属性**:
    - `_module_registry (ModuleRegistry)`: 模块注册表实例。
    - `_workflows (Dict[str, Workflow])`: 已加载到引擎的工作流字典，键为工作流ID。
    - `_current_workflow_id (Optional[str])`: 当前选定的活动工作流ID。
    - `_execution_status (str)`: 当前引擎的执行状态 (使用 `ExecutionStatus` 常量)。
    - `_execution_results (Dict[str, Dict[str, Any]])`: 存储最近一次执行中，每个模块的输出结果。键为模块ID，值为该模块 `execute` 方法返回的输出字典 (以端口名为键)。
    - `_error_message (str)`: 工作流执行过程中的全局错误信息。

- **执行状态 (`ExecutionStatus`)**:
    - `IDLE`: 空闲。
    - `RUNNING`: 运行中。
    - `PAUSED`: 已暂停。
    - `COMPLETED`: 执行完成。
    - `ERROR`: 执行出错。

### 4.2. 工作流生命周期管理

- `create_workflow(name: str, description: str = "") -> Workflow`: 创建一个新的空工作流并加载到引擎。
- `load_workflow_from_file(filepath: str) -> Workflow`: (重命名或区分) 从文件加载工作流到引擎。
- `load_workflow_from_data(workflow_data: Dict[str, Any]) -> Workflow`: (新增) 从前端提供的字典数据动态构建并加载工作流到引擎。
- `close_workflow(workflow_id: str) -> bool`: 从引擎中关闭（移除）一个工作流。如果工作流正在执行，则不允许关闭。
- `set_current_workflow(workflow_id: str) -> bool`: 设置当前活动工作流。如果引擎正在执行，不允许切换。

### 4.3. 执行流程

- **启动执行**:
    - `execute(workflow_id: Optional[str] = None, async_run: bool = True) -> bool`:
        执行指定的工作流 (如果 `workflow_id` 为 `None`，则执行当前活动工作流)。
        - `async_run`: 如果为 `True`，则在新的守护线程 (daemon thread) 中异步执行工作流。如果为 `False`，则同步执行（阻塞当前线程）。

- **核心执行逻辑 (`_execute_workflow()`)**:
    1.  **获取执行顺序**:
        - 调用 `workflow._get_execution_order() -> List[str]`。此方法通过拓扑排序算法计算模块的执行顺序。如果检测到循环依赖，会抛出 `ValueError`。
    2.  **重置执行数据**: 清空 `self._execution_results`。
    3.  **按序执行模块**:
        - 遍历执行顺序列表中的每个 `module_id`。
        - **暂停/停止检查**: 在执行每个模块前，检查 `_pause_event` 和 `_stop_event`。
        - **准备输入数据**:
            - 对于当前模块的每个输入端口 (通过 `module.input_ports.values()` 遍历 `Port` 对象):
                - 调用 `_get_source_data(workflow, current_module_id, input_port_obj.name)` 获取该输入端口的数据。
            - `_get_source_data(workflow, target_module_id, target_port_name) -> Any`:
                - 遍历工作流中的所有连接 (`workflow.connections.values()`)。
                - 找到连接到 `target_module_id` 的 `target_port_name` 的连接。
                - 从连接中获取源模块ID (`source_module_id`) 和源端口名称 (`source_port_name`)。
                - 从 `self._execution_results[source_module_id]` (即源模块的输出) 中，使用 `source_port_name` 作为键来查找数据。
                - **重要**: 模块的 `execute` 方法返回的字典应使用**端口名称**作为键。
            - 收集到的输入数据以**输入端口名称为键**组织成字典，传递给模块的 `execute` 方法。
        - **执行模块**:
            - 调用 `module.execute(inputs)`。
            - 模块的 `_execution_status` 更新为 "running"。
        - **存储输出数据**:
            - `module.execute()` 的返回值 (一个以输出端口名为键的字典) 被存储在 `self._execution_results[module_id]` 中。
            - 模块的 `_execution_status` 更新为 "completed" (或 "error" 如果发生异常)。
        - **错误处理**: 如果模块执行中发生异常，会更新模块和引擎的 `_error_message` 和 `_execution_status`，并停止整个工作流的执行。

### 4.4. 执行控制

- `pause() -> bool`: 如果工作流正在运行 (`RUNNING`)，设置 `self._pause_event.clear()`，使执行循环在下一个模块开始前暂停。
- `resume() -> bool`: 如果工作流已暂停 (`PAUSED`)，设置 `self._pause_event.set()`，恢复执行。
- `stop() -> bool`: 如果工作流正在运行或暂停，设置 `self._stop_event.set()` (并确保 `_pause_event` 也被set以允许线程退出暂停等待)，尝试 `join` 执行线程。将状态设为 `IDLE`。

### 4.5. 进度与通知

引擎支持通过回调函数通知外部关于执行进度的事件。

- `register_progress_callback(callback: Callable[[str, Dict[str, Any]], None])`: 注册一个回调函数。
- `_notify_progress(event_type: str, event_data: Dict[str, Any])`: 当特定事件发生时，调用所有已注册的回调函数。
- **`ProgressCallbackType` (常量类)**: 定义了不同的事件类型字符串，如:
    - `START`: 工作流开始执行。
    - `MODULE_START`: 某个模块开始执行。
    - `MODULE_COMPLETE`: 某个模块成功完成。
    - `MODULE_ERROR`: 某个模块执行出错。
    - `PAUSE`: 工作流暂停。
    - `RESUME`: 工作流恢复。
    - `COMPLETE`: 工作流成功完成。
    - `ERROR`: 工作流执行中发生全局错误。
- `event_data` 是一个包含事件相关信息的字典 (如 `workflow_id`, `module_id`, `module_name`, `outputs`, `error`, `timestamp`)。

## 5. 整体开发与执行流程梳理

1.  **定义模块类**:
    *   创建一个新类，继承自 `backend.core.base_module.BaseModule`。
    *   实现 `_get_variant_definitions(cls)` 类方法，定义模块的变体和端口 (`PortDefinition`)。
    *   实现 `execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]` 方法，编写模块的核心处理逻辑。输入和输出字典均使用**端口名称**作为键。

2.  **注册模块类**:
    *   获取全局模块注册表实例: `from backend.core.module_registry import gmodule_registry`。
    *   调用 `gmodule_registry.register(MyNewModuleClass, category="MyCategory")`。

3.  **创建/加载工作流实例 (通过API)**:
    *   前端通过调用 `/api/workflow/save` (传递节点和边数据) 或 `/api/workflow/load/{workflow_id}` 与后端交互。
    *   后端API端点内部会使用 `WorkflowEngine` 和 `Workflow` 类的方法来创建、加载、保存工作流。
    *   例如，`/api/workflow/save` 接口的后端逻辑会:
        *   接收前端JSON数据。
        *   创建一个 `Workflow` 实例。
        *   遍历节点数据，使用 `gmodule_registry.create_instance(module_type, id=node_instance_id, name=node_name, initial_variant_id=..., initial_ports_config=..., properties=...)` 创建模块。
        *   将模块添加到工作流中。
        *   遍历边数据，使用 `workflow.connect(source_module_id, source_port_name, target_module_id, target_port_name)` 连接模块。
        *   调用 `workflow.save()`。

4.  **搭建工作流图 (主要由前端完成，后端通过API接收)**:
    *   前端用户在UI上拖拽模块、配置参数和变体、连接端口。
    *   这些操作在前端会更新 `nodes` 和 `edges` 状态。
    *   当用户点击"保存"时，前端将这些状态数据发送到后端的 `/api/workflow/save`。

5.  **执行工作流 (通过API)**:
    *   前端用户点击"运行"按钮。
    *   前端调用 `/api/workflow/execute`，可以传递已保存工作流的ID，或者直接传递当前画布的工作流数据。
    *   后端API端点将请求转发给 `WorkflowEngine.execute()`。
    *   前端通过轮询 `/api/workflow/status/{execution_id}` 或 WebSocket 接收执行状态和结果。

6.  **控制执行** (主要用于异步执行, 未来可能通过API暴露):
    *   `engine.pause()`
    *   `engine.resume()`
    *   `engine.stop()`

## 6. 注意事项和最佳实践

- **端口名称**: 在模块的 `execute` 方法、工作流连接 (`workflow.connect`) 以及引擎的数据传递 (`_get_source_data`) 中，都强依赖于**端口名称**。确保端口名称在模块变体定义中准确无误，并在 `execute` 方法中正确使用。
- **模块变体管理**: 当模块的变体被切换时 (`module.set_variant()`)，`_apply_active_variant_and_config()` 会重建端口。`Workflow.handle_module_variant_change()` 会负责移除因端口不再存在而失效的连接。
- **序列化**: 模块的 `module_type` (类名), `id` (实例ID), `name` (实例名), `description`, `current_variant_id`, `current_ports_config`, `properties` (参数), `position` 都会被序列化，确保模块在加载时能够正确恢复其配置。
- **错误处理**: 引擎和模块都有自己的错误状态和信息。模块执行中的异常会被捕获并传播到引擎层面。API层面也应有统一的错误处理。
- **线程安全**: 异步执行在单独线程中运行。如果模块本身或回调函数访问共享资源，需要考虑线程安全问题。
- **日志**: `WorkflowEngine` 使用 `glogger` (标准 `logging` 模块的实例) 进行日志记录。
- **`BaseModule._get_variant_definitions`**: 此方法是**类方法**。子类必须实现它以定义其支持的变体。
- **`any` 数据类型**: 端口类型可以定义为 "any"，这在 `Workflow.connect` 进行类型兼容性检查时会被特殊处理，允许连接到任何其他类型的端口。

## 7. API 服务封装 (示例, e.g., using FastAPI)

```python
# main.py (FastAPI 示例)
from fastapi import FastAPI, HTTPException, Path, Body
from typing import Dict, Any, List
from backend.core.engine import WorkflowEngine
from backend.core.module_registry import gmodule_registry # 假设全局注册表
from backend.core.workflow import Workflow

app = FastAPI()
engine = WorkflowEngine(gmodule_registry)

# --- 辅助函数 (简单示例) ---
def _workflow_to_frontend_dict(wf: Workflow) -> Dict[str, Any]:
    # 将 Workflow 对象转换为前端期望的加载格式
    # 注意: 这只是一个示意，实际转换逻辑会更复杂
    # 需要确保节点数据包含 currentVariantId, activePortsConfig, properties, position 等
    # 边数据包含 sourceHandle, targetHandle
    wf_dict = wf.to_dict() # 假设 wf.to_dict() 返回了大部分所需信息
    # 可能需要进一步处理 wf_dict["modules"] 和 wf_dict["connections"]
    # 以完全匹配前端API_backend_interaction.md中定义的加载响应格式
    return {
        "id": wf.id,
        "name": wf.name,
        "description": wf.description,
        "nodes": [m.to_dict() for m in wf.modules.values()], # 需要确保模块to_dict()符合前端期望
        "edges": [c.to_dict() for c in wf.connections.values()] # 需要确保连接to_dict()符合前端期望
    }

# --- API 端点 --- 

@app.post("/api/workflow/save")
async def save_workflow_endpoint(payload: Dict[str, Any] = Body(...)):
    try:
        workflow_name = payload.get("name", "Untitled Workflow")
        workflow_description = payload.get("description", "")
        nodes_data = payload.get("nodes", [])
        edges_data = payload.get("edges", [])

        wf = Workflow(name=workflow_name, description=workflow_description)

        for node_payload in nodes_data:
            module_type = node_payload.get("type")
            instance_id = node_payload.get("id")
            position = node_payload.get("position")
            node_inner_data = node_payload.get("data", {})
            
            module_instance = gmodule_registry.create_instance(
                module_type,
                id=instance_id, # 传递实例ID
                name=node_inner_data.get("name"),
                description=node_inner_data.get("description"),
                initial_variant_id=node_inner_data.get("currentVariantId"),
                initial_ports_config=node_inner_data.get("activePortsConfig"),
                properties=node_inner_data.get("properties", {}),
                position=(position.get("x"), position.get("y")) if position else (0,0)
            )
            if not module_instance:
                raise HTTPException(status_code=400, detail=f"无法创建模块: {module_type}")
            wf.add_module(module_instance)

        for edge_payload in edges_data:
            wf.connect(
                source_module_id=edge_payload.get("source"),
                source_port_name=edge_payload.get("sourceHandle"),
                target_module_id=edge_payload.get("target"),
                target_port_name=edge_payload.get("targetHandle")
            )
        
        # 假设保存到文件，文件名用工作流ID
        save_path = f"./{wf.id}.json" 
        wf.save(save_path)
        return {"message": "工作流保存成功", "workflowId": wf.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/workflow/load/{workflow_id}")
async def load_workflow_endpoint(workflow_id: str = Path(...)):
    try:
        # 假设从文件加载
        load_path = f"./{workflow_id}.json"
        wf = Workflow.load(load_path, gmodule_registry)
        engine.load_workflow_from_object(wf) # 将加载的工作流对象加入引擎管理
        return _workflow_to_frontend_dict(wf)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"工作流 {workflow_id} 未找到")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/modules/definitions")
async def get_module_definitions_endpoint():
    defs = []
    for name, data in gmodule_registry.get_registered_modules().items():
        # 假设模块类有静态属性或方法来提供这些信息
        module_class = data["class"]
        defs.append({
            "id": name, # 使用类名作为ID
            "name": getattr(module_class, "display_name", name), # 尝试获取 display_name
            "icon": getattr(module_class, "icon", "❓"),
            "type": data["category"].lower(), # 使用小写分类作为 type
            "description": module_class.__doc__.splitlines()[0] if module_class.__doc__ else "",
            "category": data["category"]
        })
    return defs

@app.get("/api/modules/{module_type_id}/variants")
async def get_module_variants_endpoint(module_type_id: str = Path(...)):
    variants = gmodule_registry.get_module_variant_details(module_type_id)
    if not variants:
        raise HTTPException(status_code=404, detail=f"模块类型 {module_type_id} 的变体未找到或未定义")
    # VariantDefinition 和 PortDefinition 已经是 dataclass，可以直接序列化为JSON
    # 需要确保其字段名与前端 API_backend_interaction.md 中定义的响应格式一致
    return list(variants.values()) 

@app.post("/api/workflow/execute")
async def execute_workflow_endpoint(payload: Dict[str, Any] = Body(...)):
    workflow_id = payload.get("workflowId")
    workflow_data = payload.get("workflowData")
    async_run = payload.get("asyncRun", True)
    
    current_wf = None
    if workflow_id:
        current_wf = engine.get_workflow(workflow_id) # 假设 engine 有 get_workflow 方法
        if not current_wf:
             # 尝试从文件加载并放入引擎
            try:
                load_path = f"./{workflow_id}.json"
                current_wf = Workflow.load(load_path, gmodule_registry)
                engine.load_workflow_from_object(current_wf) 
            except FileNotFoundError:
                raise HTTPException(status_code=404, detail=f"工作流 {workflow_id} 未找到")
    elif workflow_data:
        # 此处逻辑类似 /api/workflow/save 中的构建逻辑，但不保存文件
        # 而是动态创建一个 Workflow 对象并加载到引擎
        try:
            wf_name = workflow_data.get("name", "Dynamic Workflow")
            wf_desc = workflow_data.get("description", "")
            nodes_data = workflow_data.get("nodes", [])
            edges_data = workflow_data.get("edges", [])

            current_wf = Workflow(name=wf_name, description=wf_desc)
            for node_payload in nodes_data:
                # ... (省略与save接口中类似的模块创建逻辑) ...
                module_type = node_payload.get("type")
                instance_id = node_payload.get("id")
                position = node_payload.get("position")
                node_inner_data = node_payload.get("data", {})
                module_instance = gmodule_registry.create_instance(module_type, id=instance_id, name=node_inner_data.get("name"), initial_variant_id=node_inner_data.get("currentVariantId"), initial_ports_config=node_inner_data.get("activePortsConfig"), properties=node_inner_data.get("properties", {}), position=(position.get("x"), position.get("y")) if position else (0,0))
                if not module_instance: raise HTTPException(status_code=400, detail=f"无法创建模块: {module_type}")
                current_wf.add_module(module_instance)
            for edge_payload in edges_data:
                current_wf.connect(source_module_id=edge_payload.get("source"), source_port_name=edge_payload.get("sourceHandle"), target_module_id=edge_payload.get("target"), target_port_name=edge_payload.get("targetHandle"))
            
            engine.load_workflow_from_object(current_wf) # 加载到引擎
            workflow_id = current_wf.id # 使用动态生成的ID
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"构建动态工作流失败: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="必须提供 workflowId 或 workflowData")

    if not current_wf:
         raise HTTPException(status_code=404, detail="无法确定要执行的工作流")

    success = engine.execute(current_wf.id, async_run=async_run)
    if not success:
        raise HTTPException(status_code=500, detail=f"工作流 {current_wf.id} 执行失败: {engine.error_message}")

    response_data = {
        "message": f"工作流 {current_wf.id} {'异步' if async_run else '同步'}执行已启动" if success else "执行失败",
        "executionId": current_wf.id if async_run else None, # 简单起见，异步执行ID用工作流ID
        "status": engine.execution_status
    }
    if not async_run and engine.execution_status == engine.ExecutionStatus.COMPLETED:
        response_data["results"] = engine.execution_results
    
    return response_data

@app.get("/api/workflow/status/{execution_id}")
async def get_workflow_status_endpoint(execution_id: str = Path(...)):
    # 简单示例，实际中 execution_id 可能需要更复杂的管理
    wf = engine.get_workflow(execution_id)
    if not wf:
        raise HTTPException(status_code=404, detail=f"执行ID {execution_id} 未找到或不对应任何活动工作流")

    # 获取模块状态的逻辑需要从WorkflowEngine中细化
    # 以下为伪代码，具体实现依赖 WorkflowEngine 的设计
    module_statuses = []
    if wf.id in engine.execution_results: # 假设 execution_results 存储了最后一次执行的信息
        for module_id, module_instance in wf.modules.items():
            module_outputs = engine.execution_results.get(wf.id, {}).get(module_id, {})
            module_statuses.append({
                "moduleId": module_id,
                "moduleName": module_instance.name,
                "status": module_instance.execution_status, # 假设BaseModule有此属性
                "outputs": module_outputs # 或部分预览
            })
    
    return {
        "executionId": execution_id,
        "workflowId": wf.id,
        "status": engine.execution_status, # 引擎的整体状态
        "modulesStatus": module_statuses
    }

# 注意: 注册模块的示例代码应该在后端项目初始化时执行
# from backend.core.example_modules import FileReaderModule, DataProcessorModule # 假设有这些模块
# gmodule_registry.register(FileReaderModule, category="数据源")
# gmodule_registry.register(DataProcessorModule, category="数据处理")

# 要运行此示例: uvicorn main:app --reload
```

**最近更新**: 2025-05-21 