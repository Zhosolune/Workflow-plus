from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional, Set, Tuple, Union
from uuid import uuid4

class Port:
    """
    端口类，代表模块的输入或输出接口
    """
    def __init__(self, name: str, port_type: str, description: str = ""):
        self._id = str(uuid4())
        self._name = name
        self._type = port_type
        self._description = description
        self._connected_to: Set[str] = set()  # 存储连接到此端口的其他端口ID

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
    def connected_to(self) -> Set[str]:
        return self._connected_to
    
    def connect(self, port_id: str) -> None:
        """将此端口连接到另一个端口"""
        self._connected_to.add(port_id)
    
    def disconnect(self, port_id: str) -> None:
        """断开与指定端口的连接"""
        if port_id in self._connected_to:
            self._connected_to.remove(port_id)
    
    def disconnect_all(self) -> None:
        """断开所有连接"""
        self._connected_to.clear()


class BaseModule(ABC):
    """
    工作流模块基类
    定义了工作流中每个模块必须实现的基本属性和方法
    """
    def __init__(self, name: str, description: str = ""):
        self._id = str(uuid4())
        self._name = name
        self._description = description
        self._input_ports: Dict[str, Port] = {}  # 输入端口字典
        self._output_ports: Dict[str, Port] = {} # 输出端口字典
        self._parameters: Dict[str, Any] = {}    # 模块参数
        self._position: Tuple[float, float] = (0.0, 0.0)  # 模块在画布中的位置
        self._execution_status: str = "idle"  # 执行状态：idle, running, completed, error
        self._error_message: str = ""  # 错误信息
    
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
    
    def to_dict(self) -> Dict[str, Any]:
        """将模块转换为字典，用于序列化"""
        return {
            "id": self._id,
            "name": self._name,
            "description": self._description,
            "input_ports": {port_id: {
                "id": port.id,
                "name": port.name,
                "type": port.type,
                "description": port.description,
                "connected_to": list(port.connected_to)
            } for port_id, port in self._input_ports.items()},
            "output_ports": {port_id: {
                "id": port.id,
                "name": port.name,
                "type": port.type,
                "description": port.description,
                "connected_to": list(port.connected_to)
            } for port_id, port in self._output_ports.items()},
            "parameters": self._parameters,
            "position": self._position,
            "execution_status": self._execution_status
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'BaseModule':
        """从字典创建模块实例，用于反序列化"""
        raise NotImplementedError("子类必须实现此方法") 