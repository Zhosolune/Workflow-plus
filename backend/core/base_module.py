from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Set, Tuple, Union, Literal
from uuid import uuid4
import dataclasses

# 新增 PortDefinition 数据类
@dataclasses.dataclass
class PortDefinition:
    name: str
    port_io_type: Literal['input', 'output']
    data_type: str
    description: str
    is_optional: bool
    default_enabled: bool
    allow_multiple_connections: bool

# 新增 VariantDefinition 数据类
@dataclasses.dataclass
class VariantDefinition:
    variant_id: str
    variant_name: str
    description: str
    port_definitions: List[PortDefinition]

class Port:
    """
    端口类，代表模块的输入或输出接口
    """
    def __init__(self, name: str, port_type: str, description: str = ""):
        self._id = str(uuid4())
        self._name = name
        self._type = port_type
        self._description = description
        self._connected_to: Set[str] = set()  # 存储连接到此端口的其他端口的 *名称*

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def type(self) -> str:
        return self._type
    
    @property
    def description(self) -> str:
        return self._description
    
    @property
    def connected_to(self) -> Set[str]: # 现在返回的是连接的端口名称集合
        return self._connected_to
    
    def connect(self, port_name: str) -> None: # 参数改为 port_name
        """将此端口连接到另一个端口 (通过名称)"""
        self._connected_to.add(port_name)
    
    def disconnect(self, port_name: str) -> None: # 参数改为 port_name
        """断开与指定端口的连接 (通过名称)"""
        if port_name in self._connected_to:
            self._connected_to.remove(port_name)
    
    def disconnect_all(self) -> None:
        """断开所有连接"""
        self._connected_to.clear()


class BaseModule(ABC):
    """
    工作流模块基类
    定义了工作流中每个模块必须实现的基本属性和方法
    """
    def __init__(self, name: str, description: str = "", initial_variant_id: Optional[str] = None, initial_ports_config: Optional[Dict[str, bool]] = None):
        self._id = str(uuid4())
        self._name = name
        self._description = description
        self._input_ports: Dict[str, Port] = {}  # 输入端口字典
        self._output_ports: Dict[str, Port] = {} # 输出端口字典
        self._parameters: Dict[str, Any] = {}    # 模块参数
        self._position: Tuple[float, float] = (0.0, 0.0)  # 模块在画布中的位置
        self._execution_status: str = "idle"  # 执行状态：idle, running, completed, error
        self._error_message: str = ""  # 错误信息

        # 新增：模块变体相关属性
        self._current_variant_id: Optional[str] = initial_variant_id
        self._current_ports_config: Dict[str, bool] = initial_ports_config if initial_ports_config is not None else {}

        # 在初始化结束时应用变体配置
        # 注意：如果模块在子类中定义了默认变体，这里可能需要进一步处理
        if self._current_variant_id:
            self._apply_active_variant_and_config()
        else:
            # 如果没有提供初始变体，尝试获取并应用默认变体
            variant_definitions = self._get_variant_definitions()
            if variant_definitions:
                # 假设第一个定义的变体或名为 'default' 的变体是默认的
                default_variant_id = next(iter(variant_definitions.keys()))
                if 'default' in variant_definitions:
                    default_variant_id = 'default'
                
                if default_variant_id:
                    self._current_variant_id = default_variant_id
                    # 对于默认变体，可选端口的初始状态由 PortDefinition 中的 default_enabled 决定
                    selected_variant_def = variant_definitions[self._current_variant_id]
                    self._current_ports_config = {
                        pd.name: pd.default_enabled 
                        for pd in selected_variant_def.port_definitions 
                        if pd.is_optional
                    }
                    self._apply_active_variant_and_config()


    @property
    def id(self) -> str:
        return self._id
    
    @property
    def name(self) -> str:
        return self._name
    
    @name.setter
    def name(self, value: str) -> None:
        self._name = value
    
    @property
    def description(self) -> str:
        return self._description
    
    @description.setter
    def description(self, value: str) -> None:
        self._description = value
    
    @property
    def input_ports(self) -> Dict[str, Port]:
        return self._input_ports
    
    @property
    def output_ports(self) -> Dict[str, Port]:
        return self._output_ports
    
    @property
    def parameters(self) -> Dict[str, Any]:
        return self._parameters
    
    @property
    def position(self) -> Tuple[float, float]:
        return self._position
    
    @position.setter
    def position(self, value: Tuple[float, float]) -> None:
        self._position = value
    
    @property
    def execution_status(self) -> str:
        return self._execution_status
    
    @property
    def error_message(self) -> str:
        return self._error_message
    
    def add_input_port(self, name: str, port_type: str, description: str = "") -> Port:
        """添加输入端口"""
        port = Port(name, port_type, description)
        self._input_ports[port.id] = port
        return port
    
    def add_output_port(self, name: str, port_type: str, description: str = "") -> Port:
        """添加输出端口"""
        port = Port(name, port_type, description)
        self._output_ports[port.id] = port
        return port
    
    def remove_port(self, port_id: str) -> bool:
        """移除指定ID的端口"""
        if port_id in self._input_ports:
            del self._input_ports[port_id]
            return True
        if port_id in self._output_ports:
            del self._output_ports[port_id]
            return True
        return False
    
    def set_parameter(self, key: str, value: Any) -> None:
        """设置模块参数"""
        self._parameters[key] = value
    
    def get_parameter(self, key: str, default: Any = None) -> Any:
        """获取模块参数"""
        return self._parameters.get(key, default)
    
    def reset(self) -> None:
        """重置模块状态"""
        self._execution_status = "idle"
        self._error_message = ""
    
    @abstractmethod
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行模块逻辑
        
        Args:
            inputs: 输入数据字典，键为端口ID，值为数据
            
        Returns:
            输出数据字典，键为端口ID，值为数据
        """
        pass
    
    @classmethod
    @abstractmethod
    def _get_variant_definitions(cls) -> Dict[str, VariantDefinition]:
        """
        获取模块支持的所有变体定义。
        子类必须实现此方法。
        """
        pass

    def _apply_active_variant_and_config(self) -> None:
        """
        根据当前激活的变体ID和端口配置来创建或更新模块的实际端口。
        """
        if not self._current_variant_id:
            # self._input_ports.clear() # 清理旧端口
            # self._output_ports.clear()
            # print(f"模块 {self.name} ({self.id}) 没有激活的变体ID，端口已清空。")
            return

        variant_definitions = self._get_variant_definitions()
        if self._current_variant_id not in variant_definitions:
            # print(f"模块 {self.name} ({self.id}) 的变体ID '{self._current_variant_id}' 未在定义中找到。")
            # self._input_ports.clear() # 清理旧端口
            # self._output_ports.clear()
            return

        active_variant_def = variant_definitions[self._current_variant_id]
        
        # 记录当前连接，以便在重建端口后尝试恢复
        # 注意：这里的连接信息是基于旧端口ID的，如果端口ID在变体切换后改变，恢复会复杂
        # 计划1.3.2中推荐使用端口名称进行连接，这里暂时保留基于ID的逻辑，后续需要与Workflow类协同修改
        existing_connections = {}
        for port_dict in [self._input_ports, self._output_ports]:
            for port_id, port_obj in port_dict.items():
                if port_obj.connected_to:
                    existing_connections[port_obj.name] = list(port_obj.connected_to) # 使用端口名作为键

        # 清理旧端口
        self._input_ports.clear()
        self._output_ports.clear()

        # print(f"模块 {self.name} ({self.id}) 应用变体: {active_variant_def.variant_name} ({self._current_variant_id})")
        # print(f"  当前端口配置: {self._current_ports_config}")

        for port_def in active_variant_def.port_definitions:
            is_enabled = True # 非可选端口默认启用
            if port_def.is_optional:
                is_enabled = self._current_ports_config.get(port_def.name, port_def.default_enabled)
            
            # print(f"  处理端口定义: {port_def.name}, 可选: {port_def.is_optional}, 配置启用: {self._current_ports_config.get(port_def.name)}, 默认启用: {port_def.default_enabled}, 最终启用: {is_enabled}")

            if is_enabled:
                new_port = Port(name=port_def.name, port_type=port_def.data_type, description=port_def.description)
                # 尝试恢复连接 (基于端口名称匹配旧连接)
                # 这部分逻辑比较复杂，且依赖 Workflow 侧的改动，暂时简化处理或后续完善
                # if new_port.name in existing_connections:
                #     for connected_old_port_id in existing_connections[new_port.name]:
                #         # 这里需要一种机制将旧的port_id映射到新的port_id或直接使用port_name
                #         # 简化：假设连接的是对端Port的ID，这里暂时无法直接恢复
                #         pass # new_port.connect(connected_old_port_id)


                if port_def.port_io_type == 'input':
                    self._input_ports[new_port.id] = new_port # 使用新端口的ID
                    # print(f"    添加输入端口: {new_port.name} (ID: {new_port.id})")
                elif port_def.port_io_type == 'output':
                    self._output_ports[new_port.id] = new_port # 使用新端口的ID
                    # print(f"    添加输出端口: {new_port.name} (ID: {new_port.id})")
        # print(f"  应用变体后，输入端口: {[p.name for p in self._input_ports.values()]}")
        # print(f"  应用变体后，输出端口: {[p.name for p in self._output_ports.values()]}")


    def set_variant(self, variant_id: str, optional_ports_override: Optional[Dict[str, bool]] = None) -> None:
        """
        设置模块的当前变体和可选端口配置。
        
        Args:
            variant_id: 要激活的变体ID。
            optional_ports_override: 可选端口的覆盖配置 (port_name -> is_enabled)。
                                     如果为None，则使用变体定义中的默认值或保持现有配置。
        """
        variant_definitions = self._get_variant_definitions()
        if variant_id not in variant_definitions:
            raise ValueError(f"模块 {self.name} 不支持变体ID: {variant_id}")

        # TODO: 根据 dev_plan.md 1.3.2，在切换变体导致端口移除时，需要处理连接断开。
        # 这部分逻辑需要 Workflow 实例的参与，暂时在此处留作TODO。
        # 可以在调用 _apply_active_variant_and_config 之前，
        # 比较新旧端口列表，识别被删除的端口，并通知 Workflow 断开相关连接。

        self._current_variant_id = variant_id
        
        # 更新可选端口配置
        active_variant_def = variant_definitions[variant_id]
        new_ports_config = {}
        for pd in active_variant_def.port_definitions:
            if pd.is_optional:
                if optional_ports_override is not None and pd.name in optional_ports_override:
                    new_ports_config[pd.name] = optional_ports_override[pd.name]
                else:
                    # 如果没有覆盖，则使用此变体定义中的默认启用状态
                    new_ports_config[pd.name] = pd.default_enabled
        
        self._current_ports_config = new_ports_config
        self._apply_active_variant_and_config()

    def to_dict(self) -> Dict[str, Any]:
        """将模块转换为字典，用于序列化"""
        return {
            "id": self._id,
            "name": self._name,
            "module_type": self.__class__.__name__, # 新增：模块的具体类名，用于反序列化
            "description": self._description,
            "input_ports": {port_id: { # 使用 port_id 作为 key
                "id": port.id,
                "name": port.name,
                "type": port.type,
                "description": port.description,
                "connected_to": list(port.connected_to)
            } for port_id, port in self._input_ports.items()},
            "output_ports": {port_id: { # 使用 port_id 作为 key
                "id": port.id,
                "name": port.name,
                "type": port.type,
                "description": port.description,
                "connected_to": list(port.connected_to)
            } for port_id, port in self._output_ports.items()},
            "parameters": self._parameters,
            "position": self._position,
            "execution_status": self._execution_status,
            # 新增：序列化变体状态
            "current_variant_id": self._current_variant_id,
            "current_ports_config": self._current_ports_config
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BaseModule':
        """
        从字典创建模块实例，用于反序列化。
        注意：这是一个基础实现，具体的模块子类应该重写此方法，
        以正确处理其特定的参数和状态。
        """
        # 实际的模块创建应由 ModuleRegistry 或 Workflow.load 结合 module_type 处理
        # 此处仅为基类提供一个通用结构，但不应直接调用 BaseModule.from_dict()
        # print(f"BaseModule.from_dict called for data: {data}")
        
        # 子类需要调用 super().__init__ 或直接创建实例
        # module_name = data.get('name', 'Unknown Module')
        # module_description = data.get('description', '')
        # instance = cls(name=module_name, description=module_description) # 这会调用子类的__init__
        
        # 这个方法在基类中是抽象的，或者说，它的具体实现依赖于子类。
        # 真正恢复模块实例的逻辑在 Workflow.load 方法中，它会根据 module_type 找到正确的类。
        # 因此，BaseModule 的 from_dict 更多的是一个接口定义。
        # 子类在实现自己的 from_dict 时，会先创建实例，然后恢复通用属性，
        # 再恢复特定于子类的属性。
        
        # 创建实例时，需要传递变体相关的初始参数
        instance = cls(
            name=data.get('name', 'Unnamed Module'), 
            description=data.get('description', ''),
            initial_variant_id=data.get('current_variant_id'),
            initial_ports_config=data.get('current_ports_config')
        )
        instance._id = data['id'] # ID 必须恢复
        
        # 恢复参数
        instance._parameters = data.get('parameters', {})
        
        # 恢复位置
        if 'position' in data:
            instance.position = tuple(data['position'])
            
        # 恢复端口连接信息 (这部分更适合在 Workflow.load 中处理，因为端口对象是动态创建的)
        # 但至少，模块需要知道它的变体和端口配置，以便 _apply_active_variant_and_config 能正确工作
        # _apply_active_variant_and_config 已经在 __init__ 中被调用（如果提供了initial_variant_id）
        
        # print(f"BaseModule from_dict: Restored {instance.name} with variant {instance._current_variant_id} and ports config {instance._current_ports_config}")
        # print(f"  Input ports after from_dict init: {[p.name for p in instance.input_ports.values()]}")
        # print(f"  Output ports after from_dict init: {[p.name for p in instance.output_ports.values()]}")

        return instance 