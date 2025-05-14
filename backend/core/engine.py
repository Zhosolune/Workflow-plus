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
    
    def _get_source_data(self, workflow: Workflow, target_module_id: str, target_port_name: str) -> Any:
        """
        获取目标端口的数据源 (基于端口名称)
        
        Args:
            workflow: 工作流实例
            target_module_id: 目标模块ID
            target_port_name: 目标端口的名称
            
        Returns:
            数据源或None
        """
        target_module = workflow.modules.get(target_module_id)
        if not target_module:
            glogger.warning(f"获取连接数据失败：未找到目标模块ID {target_module_id}")
            return None

        # glogger.info(f"获取连接数据 - 目标: {target_module.name}.{target_port_name}")
        
        found_connections = []
        for conn in workflow.connections.values():
            if conn.target_module_id == target_module_id and conn.target_port_name == target_port_name:
                found_connections.append(conn)
                
        if not found_connections:
            # glogger.info(f"  - 未找到连接到 {target_module.name}.{target_port_name} 的连接")
            return None # 或者根据端口是否可选返回默认值
            
        # 通常输入端口只应该有一个连接（除非允许多重连接，这里简化处理，取第一个有效连接）
        # TODO: 如果 target_port 允许多重连接，这里的逻辑需要调整为收集所有源数据
        for conn in found_connections:
            source_module_id = conn.source_module_id
            source_port_name = conn.source_port_name # 使用端口名称
            
            source_module = workflow.modules.get(source_module_id)
            if not source_module:
                glogger.warning(f"  - 连接中指定的源模块ID {source_module_id} 未在工作流中找到。")
                continue
            
            # glogger.info(f"  - 找到连接: {source_module.name}.{source_port_name} -> {target_module.name}.{target_port_name}")
            
            if source_module_id in self._execution_results:
                source_module_outputs = self._execution_results[source_module_id]
                # glogger.info(f"  - 源模块 '{source_module.name}' 的原始输出数据: {source_module_outputs}")
                
                # 检查源模块的实际输出端口中是否存在名为 source_port_name 的端口
                actual_source_port_exists = any(p.name == source_port_name for p in source_module.output_ports.values())
                if not actual_source_port_exists:
                    # glogger.warning(f"  - 源模块 '{source_module.name}' 当前变体下不存在名为 '{source_port_name}' 的输出端口。")
                    continue # 跳过此连接，尝试其他可能的连接（如果有）

                # 直接按端口名称从执行结果中获取数据
                if isinstance(source_module_outputs, dict) and source_port_name in source_module_outputs:
                    data = source_module_outputs[source_port_name]
                    # glogger.info(f"  - 从 '{source_module.name}' 的输出端口 '{source_port_name}' 获取数据: {data}")
                    return data
                # elif not isinstance(source_module_outputs, dict) and actual_source_port_exists:
                    # 如果输出不是字典，但端口确实存在（例如，模块直接返回单个值且只有一个输出端口）
                    # 这种情况比较模糊，需要约定模块如何返回单输出值。为安全起见，要求输出是包含端口名的字典。
                    # glogger.warning(f"  - 源模块 '{source_module.name}' 的输出不是字典，但期望端口 '{source_port_name}' 存在。输出: {source_module_outputs}. 无法按名称提取。"))
                    # 如果只有一个输出端口，且名称匹配，可以考虑直接返回值。但需谨慎。
                    # if len(source_module.output_ports) == 1 and list(source_module.output_ports.values())[0].name == source_port_name:
                    #     return source_module_outputs
                # else:
                    # glogger.info(f"  - 在源模块 '{source_module.name}' 的输出中未直接找到名为 '{source_port_name}' 的键。Outputs: {source_module_outputs}")
            # else:
                # glogger.info(f"  - 源模块 '{source_module.name}' (ID: {source_module_id}) 尚未执行或无结果。")
        
        # glogger.info(f"  - 未找到有效的数据源或源模块 '{source_module.name if 'source_module' in locals() else '未知'}' 的输出中不包含端口 '{source_port_name if 'source_port_name' in locals() else '未知'}'。")
        return None # 如果遍历完所有连接都没有找到数据
    
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
                for port_id, port_obj in module.input_ports.items(): # 使用 port_obj 获取名称
                    # 查找连接的数据源 (现在传递 port_obj.name)
                    source_data = self._get_source_data(workflow, module_id, port_obj.name)
                    if source_data is not None:
                        # glogger.info(f"为模块 '{module.name}' 的输入端口 '{port_obj.name}' (ID: {port_id}) 找到数据: {source_data}")
                        inputs[port_obj.name] = source_data # 使用端口名称作为键存储输入
                    # else:
                        # glogger.info(f"为模块 '{module.name}' 的输入端口 '{port_obj.name}' (ID: {port_id}) 未找到数据源或数据为None。")
                
                # 记录输入数据日志
                # glogger.info(f"模块 '{module.name}' (ID: {module_id}) 的输入数据 (按名称): {inputs}")
                
                # 执行模块
                module._execution_status = "running"
                try:
                    outputs = module.execute(inputs)
                    module._execution_status = "completed"
                    
                    # 存储输出数据 (模块的 execute 应返回以端口名为键的字典)
                    self._execution_results[module_id] = outputs
                    
                    # 记录输出数据日志
                    # glogger.info(f"模块 '{module.name}' (ID: {module_id}) 的输出数据: {outputs}")
                    
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