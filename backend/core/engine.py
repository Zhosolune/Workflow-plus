from typing import Dict, List, Any, Optional, Set, Tuple, Union, Callable
import time
import threading
import logging
from uuid import uuid4

from .workflow import Workflow
from .base_module import BaseModule
from .module_registry import ModuleRegistry

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
glogger = logging.getLogger('WorkflowEngine')

class ExecutionStatus:
    """工作流执行状态常量"""
    IDLE = "idle"  # 空闲状态
    RUNNING = "running"  # 运行中
    PAUSED = "paused"  # 暂停
    COMPLETED = "completed"  # 完成
    ERROR = "error"  # 错误


class ProgressCallbackType:
    """进度回调类型"""
    START = "start"  # 开始执行
    MODULE_START = "module_start"  # 模块开始执行
    MODULE_COMPLETE = "module_complete"  # 模块执行完成
    MODULE_ERROR = "module_error"  # 模块执行错误
    PAUSE = "pause"  # 暂停
    RESUME = "resume"  # 恢复
    COMPLETE = "complete"  # 完成
    ERROR = "error"  # 错误


class WorkflowEngine:
    """
    工作流引擎类，负责工作流的执行和控制
    """
    def __init__(self, module_registry: ModuleRegistry):
        self._module_registry = module_registry
        self._workflows: Dict[str, Workflow] = {}  # 已加载的工作流
        self._current_workflow_id: Optional[str] = None  # 当前活动工作流ID
        self._execution_thread: Optional[threading.Thread] = None  # 执行线程
        self._execution_status = ExecutionStatus.IDLE  # 执行状态
        self._pause_event = threading.Event()  # 暂停事件
        self._stop_event = threading.Event()  # 停止事件
        self._progress_callbacks: List[Callable[[str, Dict[str, Any]], None]] = []  # 进度回调
        self._execution_results: Dict[str, Dict[str, Any]] = {}  # 执行结果
        self._error_message: str = ""  # 错误信息
    
    @property
    def workflows(self) -> Dict[str, Workflow]:
        """获取所有已加载的工作流"""
        return self._workflows
    
    @property
    def current_workflow(self) -> Optional[Workflow]:
        """获取当前活动工作流"""
        if self._current_workflow_id is None:
            return None
        return self._workflows.get(self._current_workflow_id)
    
    @property
    def execution_status(self) -> str:
        """获取执行状态"""
        return self._execution_status
    
    @property
    def is_running(self) -> bool:
        """检查是否正在执行"""
        return self._execution_status == ExecutionStatus.RUNNING
    
    @property
    def is_paused(self) -> bool:
        """检查是否暂停中"""
        return self._execution_status == ExecutionStatus.PAUSED
    
    @property
    def execution_results(self) -> Dict[str, Dict[str, Any]]:
        """获取执行结果"""
        return self._execution_results
    
    @property
    def error_message(self) -> str:
        """获取错误信息"""
        return self._error_message
    
    def create_workflow(self, name: str, description: str = "") -> Workflow:
        """
        创建新工作流
        
        Args:
            name: 工作流名称
            description: 工作流描述
            
        Returns:
            新创建的工作流
        """
        workflow = Workflow(name, description)
        self._workflows[workflow.id] = workflow
        
        # 如果没有活动工作流，则设置为活动
        if self._current_workflow_id is None:
            self._current_workflow_id = workflow.id
        
        return workflow
    
    def load_workflow(self, filepath: str) -> Workflow:
        """
        从文件加载工作流
        
        Args:
            filepath: 文件路径
            
        Returns:
            加载的工作流
        """
        workflow = Workflow.load(filepath, self._module_registry.get_all())
        self._workflows[workflow.id] = workflow
        
        # 如果没有活动工作流，则设置为活动
        if self._current_workflow_id is None:
            self._current_workflow_id = workflow.id
        
        return workflow
    
    def close_workflow(self, workflow_id: str) -> bool:
        """
        关闭工作流
        
        Args:
            workflow_id: 工作流ID
            
        Returns:
            是否成功关闭
        """
        if workflow_id not in self._workflows:
            return False
        
        # 如果正在执行，不允许关闭
        if self._execution_status in [ExecutionStatus.RUNNING, ExecutionStatus.PAUSED] and workflow_id == self._current_workflow_id:
            return False
        
        # 从工作流集合中移除
        del self._workflows[workflow_id]
        
        # 如果是当前活动工作流，则需要设置新的活动工作流
        if workflow_id == self._current_workflow_id:
            if self._workflows:
                self._current_workflow_id = next(iter(self._workflows.keys()))
            else:
                self._current_workflow_id = None
        
        return True
    
    def set_current_workflow(self, workflow_id: str) -> bool:
        """
        设置当前活动工作流
        
        Args:
            workflow_id: 工作流ID
            
        Returns:
            是否成功设置
        """
        if workflow_id not in self._workflows:
            return False
        
        # 如果正在执行，不允许切换
        if self._execution_status in [ExecutionStatus.RUNNING, ExecutionStatus.PAUSED]:
            return False
        
        self._current_workflow_id = workflow_id
        return True
    
    def register_progress_callback(self, callback: Callable[[str, Dict[str, Any]], None]) -> None:
        """
        注册进度回调函数
        
        Args:
            callback: 回调函数，接收事件类型和事件数据
        """
        if callback not in self._progress_callbacks:
            self._progress_callbacks.append(callback)
    
    def unregister_progress_callback(self, callback: Callable[[str, Dict[str, Any]], None]) -> bool:
        """
        取消注册进度回调函数
        
        Args:
            callback: 回调函数
            
        Returns:
            是否成功取消注册
        """
        if callback in self._progress_callbacks:
            self._progress_callbacks.remove(callback)
            return True
        return False
    
    def _notify_progress(self, event_type: str, event_data: Dict[str, Any]) -> None:
        """
        通知进度回调
        
        Args:
            event_type: 事件类型
            event_data: 事件数据
        """
        for callback in self._progress_callbacks:
            try:
                callback(event_type, event_data)
            except Exception as e:
                glogger.error(f"回调函数执行错误: {str(e)}")
    
    def execute(self, workflow_id: Optional[str] = None, async_run: bool = True) -> bool:
        """
        执行工作流
        
        Args:
            workflow_id: 工作流ID，如果为None则使用当前活动工作流
            async_run: 是否异步执行，True为异步（启动新线程），False为同步（阻塞当前线程）
            
        Returns:
            是否成功启动执行
        """
        # 确定要执行的工作流
        if workflow_id is not None:
            if workflow_id not in self._workflows:
                return False
            self._current_workflow_id = workflow_id
        
        if self._current_workflow_id is None:
            return False
        
        # 检查是否已经在执行
        if self._execution_status in [ExecutionStatus.RUNNING, ExecutionStatus.PAUSED]:
            return False
        
        # 重置状态
        self._execution_status = ExecutionStatus.IDLE
        self._pause_event.set()  # 确保非暂停状态
        self._stop_event.clear()  # 确保非停止状态
        self._error_message = ""
        
        if async_run:
            # 异步执行
            self._execution_thread = threading.Thread(target=self._execute_workflow)
            self._execution_thread.daemon = True  # 设为守护线程，主线程结束时自动终止
            self._execution_thread.start()
            return True
        else:
            # 同步执行
            self._execute_workflow()
            return True
    
    def _get_source_data(self, workflow: Workflow, target_module_id: str, target_port_id: str) -> Any:
        """
        获取目标端口的数据源
        
        Args:
            workflow: 工作流实例
            target_module_id: 目标模块ID
            target_port_id: 目标端口ID
            
        Returns:
            数据源或None
        """
        # 获取模块和端口名称，用于日志记录
        target_module_name = workflow._modules[target_module_id].name if target_module_id in workflow._modules else "未知模块"
        target_port_name = "未知端口"
        for port_id, port in workflow._modules[target_module_id].input_ports.items():
            if port_id == target_port_id:
                target_port_name = port.name
                break
                
        glogger.info(f"获取连接数据 - 目标: {target_module_name}.{target_port_name} (ID: {target_port_id})")
        
        # 查找连接到此输入端口的所有连接
        found_connections = []
        for conn_id, conn in workflow._connections.items():
            if conn.target_module_id == target_module_id and conn.target_port_id == target_port_id:
                found_connections.append(conn)
                
        if not found_connections:
            glogger.info(f"  - 未找到连接到 {target_module_name}.{target_port_name} 的连接")
            return None
            
        # 遍历所有连接，查找数据
        for conn in found_connections:
            # 找到连接，获取源模块和源端口
            source_module_id = conn.source_module_id
            source_port_id = conn.source_port_id
            
            source_module_name = workflow._modules[source_module_id].name if source_module_id in workflow._modules else "未知模块"
            source_port_name = "未知端口"
            for port_id, port in workflow._modules[source_module_id].output_ports.items():
                if port_id == source_port_id:
                    source_port_name = port.name
                    break
                    
            glogger.info(f"  - 找到连接: {source_module_name}.{source_port_name} -> {target_module_name}.{target_port_name}")
            
            # 检查源模块是否已执行并有输出数据
            if source_module_id in self._execution_results:
                source_outputs = self._execution_results[source_module_id]
                glogger.info(f"  - 源模块 {source_module_name} 的输出数据: {source_outputs}")
                
                # 特殊处理条件判断模块的输出
                if "true_result" in source_outputs and "false_result" in source_outputs:
                    # 获取源模块的端口名称
                    if source_port_name == "true_result":
                        glogger.info(f"  - 获取条件判断true_result输出: {source_outputs['true_result']}")
                        return source_outputs['true_result']
                    elif source_port_name == "false_result":
                        glogger.info(f"  - 获取条件判断false_result输出: {source_outputs['false_result']}")
                        return source_outputs['false_result']
                    # 如果不是特定的端口名，返回整个条件判断输出
                    else:
                        glogger.info(f"  - 获取整个条件判断输出: {source_outputs}")
                        return source_outputs
                
                # 直接处理常规端口输出
                if source_port_id in source_outputs:
                    # 直接返回该端口的输出值
                    glogger.info(f"  - 获取端口特定输出: {source_outputs[source_port_id]}")
                    return source_outputs[source_port_id]
                
                # 处理字典中包含端口名称的情况
                if source_port_name in source_outputs:
                    glogger.info(f"  - 按端口名称获取输出: {source_outputs[source_port_name]}")
                    return source_outputs[source_port_name]
                
                # 如果只有一个输出，直接返回
                if isinstance(source_outputs, dict) and len(source_outputs) == 1:
                    output_value = next(iter(source_outputs.values()))
                    glogger.info(f"  - 单一输出值: {output_value}")
                    return output_value
                
                # 默认情况，返回整个输出数据
                glogger.info(f"  - 返回整个输出数据: {source_outputs}")
                return source_outputs
        
        glogger.info(f"  - 未找到有效的数据源")
        return None
    
    def _execute_workflow(self) -> None:
        """工作流执行逻辑"""
        if self._current_workflow_id is None:
            return
        
        workflow = self._workflows[self._current_workflow_id]
        
        # 更新状态
        self._execution_status = ExecutionStatus.RUNNING
        
        # 通知开始执行
        self._notify_progress(ProgressCallbackType.START, {
            "workflow_id": workflow.id,
            "workflow_name": workflow.name,
            "timestamp": time.time()
        })
        
        try:
            # 获取执行顺序
            execution_order = workflow._get_execution_order()
            
            # 重置执行数据
            self._execution_results = {}
            
            # 按顺序执行模块
            for module_id in execution_order:
                # 检查是否暂停
                if not self._pause_event.is_set():
                    self._execution_status = ExecutionStatus.PAUSED
                    
                    # 通知暂停
                    self._notify_progress(ProgressCallbackType.PAUSE, {
                        "workflow_id": workflow.id,
                        "timestamp": time.time()
                    })
                    
                    # 等待恢复或停止
                    while not (self._pause_event.is_set() or self._stop_event.is_set()):
                        time.sleep(0.1)
                    
                    # 恢复执行
                    if self._pause_event.is_set() and not self._stop_event.is_set():
                        self._execution_status = ExecutionStatus.RUNNING
                        
                        # 通知恢复
                        self._notify_progress(ProgressCallbackType.RESUME, {
                            "workflow_id": workflow.id,
                            "timestamp": time.time()
                        })
                
                # 检查是否停止
                if self._stop_event.is_set():
                    return
                
                module = workflow._modules[module_id]
                
                # 通知模块开始执行
                self._notify_progress(ProgressCallbackType.MODULE_START, {
                    "workflow_id": workflow.id,
                    "module_id": module_id,
                    "module_name": module.name,
                    "timestamp": time.time()
                })
                
                # 准备输入数据
                inputs = {}
                for port_id, port in module.input_ports.items():
                    # 查找连接的数据源
                    source_data = self._get_source_data(workflow, module_id, port_id)
                    if source_data is not None:
                        # 记录源数据到日志，帮助调试
                        glogger.info(f"为模块 '{module.name}' 的输入端口 '{port_id}' 找到数据: {source_data}")
                        inputs[port_id] = source_data
                
                # 记录输入数据日志
                glogger.info(f"模块 '{module.name}' 的输入数据: {inputs}")
                
                # 执行模块
                module._execution_status = "running"
                try:
                    outputs = module.execute(inputs)
                    module._execution_status = "completed"
                    
                    # 存储输出数据
                    self._execution_results[module_id] = outputs
                    
                    # 记录输出数据日志
                    glogger.info(f"模块 '{module.name}' 的输出数据: {outputs}")
                    
                    # 通知模块执行完成
                    self._notify_progress(ProgressCallbackType.MODULE_COMPLETE, {
                        "workflow_id": workflow.id,
                        "module_id": module_id,
                        "module_name": module.name,
                        "outputs": outputs,
                        "timestamp": time.time()
                    })
                except Exception as e:
                    module._execution_status = "error"
                    module._error_message = str(e)
                    
                    # 通知模块执行错误
                    self._notify_progress(ProgressCallbackType.MODULE_ERROR, {
                        "workflow_id": workflow.id,
                        "module_id": module_id,
                        "module_name": module.name,
                        "error": str(e),
                        "timestamp": time.time()
                    })
                    
                    glogger.error(f"模块 '{module.name}' (ID: {module_id}) 执行失败: {str(e)}")
                    self._execution_status = ExecutionStatus.ERROR
                    self._error_message = f"模块 '{module.name}' 执行失败: {str(e)}"
                    
                    # 通知工作流执行错误
                    self._notify_progress(ProgressCallbackType.ERROR, {
                        "workflow_id": workflow.id,
                        "error": self._error_message,
                        "timestamp": time.time()
                    })
                    
                    return
            
            # 更新状态
            self._execution_status = ExecutionStatus.COMPLETED
            
            # 通知执行完成
            self._notify_progress(ProgressCallbackType.COMPLETE, {
                "workflow_id": workflow.id,
                "timestamp": time.time()
            })
            
        except Exception as e:
            # 更新状态
            self._execution_status = ExecutionStatus.ERROR
            self._error_message = f"工作流执行失败: {str(e)}"
            
            # 通知执行错误
            self._notify_progress(ProgressCallbackType.ERROR, {
                "workflow_id": workflow.id,
                "error": self._error_message,
                "timestamp": time.time()
            })
            
            glogger.error(f"工作流 '{workflow.name}' (ID: {workflow.id}) 执行失败: {str(e)}")
    
    def pause(self) -> bool:
        """
        暂停工作流执行
        
        Returns:
            是否成功暂停
        """
        if self._execution_status != ExecutionStatus.RUNNING:
            return False
        
        self._pause_event.clear()
        return True
    
    def resume(self) -> bool:
        """
        恢复工作流执行
        
        Returns:
            是否成功恢复
        """
        if self._execution_status != ExecutionStatus.PAUSED:
            return False
        
        self._pause_event.set()
        return True
    
    def stop(self) -> bool:
        """
        停止工作流执行
        
        Returns:
            是否成功停止
        """
        if self._execution_status not in [ExecutionStatus.RUNNING, ExecutionStatus.PAUSED]:
            return False
        
        self._stop_event.set()
        self._pause_event.set()  # 确保如果暂停状态也能正常退出
        
        # 等待线程结束
        if self._execution_thread is not None and self._execution_thread.is_alive():
            self._execution_thread.join(timeout=2.0)
        
        self._execution_status = ExecutionStatus.IDLE
        return True 