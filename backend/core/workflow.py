from typing import Dict, List, Any, Set, Tuple, Optional, Union
from uuid import uuid4
import json
import os
from collections import deque

from .base_module import BaseModule, Port

class Connection:
    """
    连接类，表示两个模块的端口之间的连接
    """
    def __init__(self, source_module_id: str, source_port_name: str,
                 target_module_id: str, target_port_name: str):
        self._id = str(uuid4())
        self._source_module_id = source_module_id
        self._source_port_name = source_port_name
        self._target_module_id = target_module_id
        self._target_port_name = target_port_name
    
    @property
    def id(self) -> str:
        return self._id
    
    @property
    def source_module_id(self) -> str:
        return self._source_module_id
    
    @property
    def source_port_name(self) -> str:
        return self._source_port_name
    
    @property
    def target_module_id(self) -> str:
        return self._target_module_id
    
    @property
    def target_port_name(self) -> str:
        return self._target_port_name
    
    def to_dict(self) -> Dict[str, Any]:
        """将连接转换为字典"""
        return {
            "id": self._id,
            "source_module_id": self._source_module_id,
            "source_port_name": self._source_port_name,
            "target_module_id": self._target_module_id,
            "target_port_name": self._target_port_name
        }


class Workflow:
    """
    工作流类，管理模块和连接
    """
    def __init__(self, name: str, description: str = ""):
        self._id = str(uuid4())
        self._name = name
        self._description = description
        self._modules: Dict[str, BaseModule] = {}
        self._connections: Dict[str, Connection] = {}
        
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
    def modules(self) -> Dict[str, BaseModule]:
        return self._modules
    
    @property
    def connections(self) -> Dict[str, Connection]:
        return self._connections
    
    def add_module(self, module: BaseModule) -> str:
        """添加模块到工作流中"""
        self._modules[module.id] = module
        return module.id
    
    def remove_module(self, module_id: str) -> bool:
        """从工作流中移除模块"""
        if module_id in self._modules:
            # 移除相关连接
            connections_to_remove = []
            for conn_id, conn in self._connections.items():
                if conn.source_module_id == module_id or conn.target_module_id == module_id:
                    connections_to_remove.append(conn_id)
            
            for conn_id in connections_to_remove:
                self.remove_connection(conn_id)
            
            # 移除模块
            del self._modules[module_id]
            return True
        return False
    
    def _find_port_by_name(self, module: BaseModule, port_name: str, port_io_type: str) -> Optional[Port]:
        """辅助函数：根据名称和类型查找端口对象"""
        ports_dict = module.output_ports if port_io_type == 'output' else module.input_ports
        for port in ports_dict.values(): # 遍历 Port 对象
            if port.name == port_name:
                return port
        return None

    def connect(self, source_module_id: str, source_port_name: str, 
                target_module_id: str, target_port_name: str) -> Optional[str]:
        """
        创建模块间的连接 (基于端口名称)
        
        Args:
            source_module_id: 源模块ID
            source_port_name: 源模块输出端口名称
            target_module_id: 目标模块ID
            target_port_name: 目标模块输入端口名称
            
        Returns:
            连接ID或None（如果连接失败）
        """
        if source_module_id not in self._modules or target_module_id not in self._modules:
            return None
        
        source_module = self._modules[source_module_id]
        target_module = self._modules[target_module_id]
        
        # 根据端口名称查找实际的 Port 对象
        source_port = self._find_port_by_name(source_module, source_port_name, 'output')
        target_port = self._find_port_by_name(target_module, target_port_name, 'input')

        if not source_port:
            return None
        if not target_port:
            return None
        
        # 类型兼容性检查 (dev_plan.md 1.3.2)
        # 简单实现：精确匹配。未来可以扩展为更灵活的兼容性规则。
        if source_port.type != target_port.type and source_port.type != 'any' and target_port.type != 'any':
            return None

        connection = Connection(source_module_id, source_port_name, target_module_id, target_port_name)
        self._connections[connection.id] = connection
        
        # 更新 Port 对象的连接状态 (现在使用 port_name)
        source_port.connect(target_port.name) # 连接到目标端口的名称
        target_port.connect(source_port.name) # 连接到源端口的名称
        
        return connection.id
    
    def remove_connection(self, connection_id: str) -> bool:
        """移除连接 (基于连接ID)"""
        if connection_id not in self._connections:
            return False
            
        conn = self._connections[connection_id]
        
        source_module = self._modules.get(conn.source_module_id)
        target_module = self._modules.get(conn.target_module_id)
        
        if source_module:
            source_port = self._find_port_by_name(source_module, conn.source_port_name, 'output')
            if source_port:
                source_port.disconnect(conn.target_port_name) # 断开与目标端口名称的连接
        
        if target_module:
            target_port = self._find_port_by_name(target_module, conn.target_port_name, 'input')
            if target_port:
                target_port.disconnect(conn.source_port_name) # 断开与源端口名称的连接
            
        del self._connections[connection_id]
        return True

    def handle_module_variant_change(self, module_id: str, old_ports: Dict[str, Set[str]], new_ports: Dict[str, Set[str]]):
        """
        处理模块变体更改导致的端口变化，移除失效的连接。
        old_ports/new_ports: {'input': {port_name1, port_name2}, 'output': {port_name3}}
        """
        removed_input_ports = old_ports.get('input', set()) - new_ports.get('input', set())
        removed_output_ports = old_ports.get('output', set()) - new_ports.get('output', set())
        
        connections_to_remove = []
        for conn_id, conn in self._connections.items():
            if conn.source_module_id == module_id and conn.source_port_name in removed_output_ports:
                connections_to_remove.append(conn_id)
            elif conn.target_module_id == module_id and conn.target_port_name in removed_input_ports:
                connections_to_remove.append(conn_id)
        
        for conn_id in connections_to_remove:
            self.remove_connection(conn_id)

    def get_dependent_modules(self, module_id: str) -> Set[str]:
        """获取依赖指定模块的所有模块ID"""
        dependent_modules = set()
        for conn in self._connections.values():
            if conn.source_module_id == module_id:
                dependent_modules.add(conn.target_module_id)
        return dependent_modules
    
    def get_dependency_modules(self, module_id: str) -> Set[str]:
        """获取指定模块依赖的所有模块ID"""
        dependency_modules = set()
        for conn in self._connections.values():
            if conn.target_module_id == module_id:
                dependency_modules.add(conn.source_module_id)
        return dependency_modules
    
    def _get_execution_order(self) -> List[str]:
        """
        计算模块执行顺序（拓扑排序）
        返回模块ID列表，按执行顺序排列
        """
        adj: Dict[str, List[str]] = {module_id: [] for module_id in self._modules}
        in_degree: Dict[str, int] = {module_id: 0 for module_id in self._modules}

        for conn in self._connections.values():
            # 确保模块存在于 adj 和 in_degree 中 (理论上应该存在，因为它们来自 self._modules)
            if conn.source_module_id in adj and conn.target_module_id in adj:
                adj[conn.source_module_id].append(conn.target_module_id)
                in_degree[conn.target_module_id] += 1

        queue = deque([module_id for module_id in self._modules if in_degree[module_id] == 0])
        result_order: List[str] = []
        
        while queue:
            u = queue.popleft()
            result_order.append(u)
            
            for v in adj.get(u, []): # 使用 adj.get(u, []) 避免因模块移除等边缘情况导致的KeyError
                if v in in_degree: # 确保 v 存在于 in_degree
                    in_degree[v] -= 1
                    if in_degree[v] == 0:
                        queue.append(v)
        
        if len(result_order) != len(self._modules):
            raise ValueError("工作流中存在循环依赖，无法确定执行顺序。")
            
        return result_order
    
    def to_dict(self) -> Dict[str, Any]:
        """将工作流转换为字典，用于序列化"""
        return {
            "id": self._id,
            "name": self._name,
            "description": self._description,
            "modules": {module_id: module.to_dict() for module_id, module in self._modules.items()},
            "connections": {conn_id: conn.to_dict() for conn_id, conn in self._connections.items()}
        }
    
    def save(self, filepath: str) -> None:
        """保存工作流到文件"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, indent=2, ensure_ascii=False)
    
    @classmethod
    def load(cls, filepath: str, module_registry_instance) -> 'Workflow':
        """
        从文件加载工作流
        
        Args:
            filepath: 文件路径
            module_registry_instance: 模块注册表实例
            
        Returns:
            工作流实例
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        workflow = cls(data['name'], data.get('description', ''))
        workflow._id = data.get('id', str(uuid4()))
        
        # 创建模块
        for module_id, module_data in data.get('modules', {}).items():
            module_type_name = module_data.get('module_type')
            if not module_type_name:
                module_type_name = module_data.get('name')

            if not module_type_name or not module_registry_instance.get(module_type_name):
                raise ValueError(f"加载失败：未知的模块类型 '{module_type_name}' 或模块未在注册表中注册。模块数据: {module_data}")
            
            module_instance = module_registry_instance.create_instance(
                module_type_name,
                name=module_data.get('name'),
                description=module_data.get('description'),
                initial_variant_id=module_data.get('current_variant_id'),
                initial_ports_config=module_data.get('current_ports_config')
            )
            
            if not module_instance:
                raise ValueError(f"无法为类型 '{module_type_name}' 创建模块实例。")

            module_instance._id = module_data.get('id', module_id)
            module_instance._parameters = module_data.get('parameters', {})
            module_instance.position = tuple(module_data.get('position', (0.0, 0.0)))

            workflow._modules[module_instance.id] = module_instance
        
        # 创建连接 (在所有模块都已创建并应用变体后)
        for conn_id, conn_data in data.get('connections', {}).items():
            source_module_id = conn_data['source_module_id']
            target_module_id = conn_data['target_module_id']
            source_port_name = conn_data['source_port_name']
            target_port_name = conn_data['target_port_name']

            conn_result_id = workflow.connect(
                source_module_id, 
                source_port_name, 
                target_module_id, 
                target_port_name
            )
            if conn_result_id:
                pass
        
        return workflow 