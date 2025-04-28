from typing import Dict, List, Any, Set, Tuple, Optional, Union
from uuid import uuid4
import json
import os
from collections import deque

from .base_module import BaseModule, Port

class Connection:
    """
    连接类，表示两个端口之间的连接
    """
    def __init__(self, source_module_id: str, source_port_id: str, 
                 target_module_id: str, target_port_id: str):
        self._id = str(uuid4())
        self._source_module_id = source_module_id
        self._source_port_id = source_port_id
        self._target_module_id = target_module_id
        self._target_port_id = target_port_id
    
    @property
    def id(self) -> str:
        return self._id
    
    @property
    def source_module_id(self) -> str:
        return self._source_module_id
    
    @property
    def source_port_id(self) -> str:
        return self._source_port_id
    
    @property
    def target_module_id(self) -> str:
        return self._target_module_id
    
    @property
    def target_port_id(self) -> str:
        return self._target_port_id
    
    def to_dict(self) -> Dict[str, Any]:
        """将连接转换为字典"""
        return {
            "id": self._id,
            "source_module_id": self._source_module_id,
            "source_port_id": self._source_port_id,
            "target_module_id": self._target_module_id,
            "target_port_id": self._target_port_id
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
        self._execution_data: Dict[str, Dict[str, Any]] = {}  # 存储执行过程中的数据
        
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
    
    def connect(self, source_module_id: str, source_port_id: str, 
                target_module_id: str, target_port_id: str) -> Optional[str]:
        """
        创建模块间的连接
        
        Args:
            source_module_id: 源模块ID
            source_port_id: 源模块输出端口ID
            target_module_id: 目标模块ID
            target_port_id: 目标模块输入端口ID
            
        Returns:
            连接ID或None（如果连接失败）
        """
        # 验证模块存在
        if source_module_id not in self._modules or target_module_id not in self._modules:
            return None
        
        source_module = self._modules[source_module_id]
        target_module = self._modules[target_module_id]
        
        # 验证端口存在
        if source_port_id not in source_module.output_ports:
            return None
        if target_port_id not in target_module.input_ports:
            return None
        
        # 验证端口类型兼容
        source_port = source_module.output_ports[source_port_id]
        target_port = target_module.input_ports[target_port_id]
        if source_port.type != target_port.type:
            return None
        
        # 创建连接
        connection = Connection(source_module_id, source_port_id, target_module_id, target_port_id)
        self._connections[connection.id] = connection
        
        # 更新端口连接信息
        source_port.connect(target_port.id)
        target_port.connect(source_port.id)
        
        return connection.id
    
    def remove_connection(self, connection_id: str) -> bool:
        """移除连接"""
        if connection_id in self._connections:
            conn = self._connections[connection_id]
            
            # 更新端口连接信息
            if conn.source_module_id in self._modules and conn.source_port_id in self._modules[conn.source_module_id].output_ports:
                source_port = self._modules[conn.source_module_id].output_ports[conn.source_port_id]
                source_port.disconnect(conn.target_port_id)
            
            if conn.target_module_id in self._modules and conn.target_port_id in self._modules[conn.target_module_id].input_ports:
                target_port = self._modules[conn.target_module_id].input_ports[conn.target_port_id]
                target_port.disconnect(conn.source_port_id)
            
            # 移除连接
            del self._connections[connection_id]
            return True
        return False
    
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
        # 构建依赖图
        graph = {module_id: set() for module_id in self._modules}
        for conn in self._connections.values():
            if conn.source_module_id in graph and conn.target_module_id in graph:
                graph[conn.target_module_id].add(conn.source_module_id)
        
        # 计算入度
        in_degree = {module_id: 0 for module_id in self._modules}
        for module_id, dependencies in graph.items():
            for dep in dependencies:
                in_degree[module_id] += 1
        
        # 拓扑排序
        queue = deque([module_id for module_id, degree in in_degree.items() if degree == 0])
        result = []
        
        while queue:
            current = queue.popleft()
            result.append(current)
            
            # 更新依赖此模块的模块入度
            dependent_modules = self.get_dependent_modules(current)
            for dep_module in dependent_modules:
                in_degree[dep_module] -= 1
                if in_degree[dep_module] == 0:
                    queue.append(dep_module)
        
        # 检查是否有环
        if len(result) != len(self._modules):
            raise ValueError("工作流中存在循环依赖")
            
        return result
    
    def execute(self) -> Dict[str, Any]:
        """
        执行整个工作流
        
        Returns:
            执行结果，包含每个模块的输出
        """
        # 重置执行数据
        self._execution_data = {}
        
        try:
            # 获取执行顺序
            execution_order = self._get_execution_order()
            
            # 按顺序执行模块
            for module_id in execution_order:
                module = self._modules[module_id]
                
                # 准备输入数据
                inputs = {}
                for port_id, port in module.input_ports.items():
                    for source_port_id in port.connected_to:
                        # 查找连接到此输入端口的输出端口
                        for conn in self._connections.values():
                            if conn.target_port_id == port_id and conn.source_port_id == source_port_id:
                                # 获取源模块的输出数据
                                source_module_id = conn.source_module_id
                                if source_module_id in self._execution_data and source_port_id in self._execution_data[source_module_id]:
                                    inputs[port_id] = self._execution_data[source_module_id][source_port_id]
                
                # 执行模块
                module._execution_status = "running"
                try:
                    outputs = module.execute(inputs)
                    module._execution_status = "completed"
                    
                    # 存储输出数据
                    self._execution_data[module_id] = outputs
                except Exception as e:
                    module._execution_status = "error"
                    module._error_message = str(e)
                    raise RuntimeError(f"模块 '{module.name}' (ID: {module_id}) 执行失败: {str(e)}")
            
            return self._execution_data
        except Exception as e:
            raise RuntimeError(f"工作流执行失败: {str(e)}")
    
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
    def load(cls, filepath: str, module_registry: Dict[str, type]) -> 'Workflow':
        """
        从文件加载工作流
        
        Args:
            filepath: 文件路径
            module_registry: 模块注册表，键为模块类型名称，值为模块类
            
        Returns:
            工作流实例
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 创建工作流
        workflow = cls(data['name'], data.get('description', ''))
        workflow._id = data['id']
        
        # 创建模块
        for module_id, module_data in data['modules'].items():
            module_type = module_data.get('type', 'BaseModule')
            if module_type not in module_registry:
                raise ValueError(f"未知的模块类型: {module_type}")
            
            module_class = module_registry[module_type]
            module = module_class.from_dict(module_data)
            workflow._modules[module_id] = module
        
        # 创建连接
        for conn_id, conn_data in data['connections'].items():
            connection = Connection(
                conn_data['source_module_id'],
                conn_data['source_port_id'],
                conn_data['target_module_id'],
                conn_data['target_port_id']
            )
            workflow._connections[conn_id] = connection
            
            # 更新端口连接信息
            if (conn_data['source_module_id'] in workflow._modules and 
                conn_data['source_port_id'] in workflow._modules[conn_data['source_module_id']].output_ports):
                source_port = workflow._modules[conn_data['source_module_id']].output_ports[conn_data['source_port_id']]
                source_port.connect(conn_data['target_port_id'])
            
            if (conn_data['target_module_id'] in workflow._modules and 
                conn_data['target_port_id'] in workflow._modules[conn_data['target_module_id']].input_ports):
                target_port = workflow._modules[conn_data['target_module_id']].input_ports[conn_data['target_port_id']]
                target_port.connect(conn_data['source_port_id'])
        
        return workflow 