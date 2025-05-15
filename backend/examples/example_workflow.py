import os
import sys
import json
from typing import Dict, Any

# 添加父目录到系统路径，以便导入核心模块
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 导入核心包以触发其 __init__.py 中的模块注册
import backend.workflow_modules 

from backend.core.base_module import BaseModule
from backend.core.workflow import Workflow
from backend.core.module_registry import ModuleRegistry, gmodule_registry
from backend.core.engine import WorkflowEngine, ProgressCallbackType
from backend.core.workflow import Connection

# 仅导入示例模块
from backend.examples.example_modules import (
    NumberGeneratorModule,
    MathOperationModule,
    TextProcessingModule,
    ConditionalModule,
    TimeDelayModule
)
# DBSCANModule 的导入和注册已移至 backend.workflow_modules.__init__.py

def print_callback(event_type: str, event_data: Dict[str, Any]) -> None:
    """打印工作流执行进度的回调函数"""
    if event_type == ProgressCallbackType.START:
        print(f"开始执行工作流: {event_data['workflow_name']}")
    elif event_type == ProgressCallbackType.MODULE_START:
        print(f"开始执行模块: {event_data['module_name']}")
    elif event_type == ProgressCallbackType.MODULE_COMPLETE:
        print(f"模块 {event_data['module_name']} 执行完成，输出: {event_data['outputs']}")
    elif event_type == ProgressCallbackType.MODULE_ERROR:
        print(f"模块 {event_data['module_name']} 执行错误: {event_data['error']}")
    elif event_type == ProgressCallbackType.PAUSE:
        print("工作流执行暂停")
    elif event_type == ProgressCallbackType.RESUME:
        print("工作流执行恢复")
    elif event_type == ProgressCallbackType.COMPLETE:
        print("工作流执行完成")
    elif event_type == ProgressCallbackType.ERROR:
        print(f"工作流执行错误: {event_data['error']}")


def create_example_workflow() -> Workflow:
    """创建示例工作流"""
    # 创建工作流
    workflow = Workflow("示例工作流", "这是一个演示工作流系统功能的示例")
    
    # 创建模块
    num_gen1 = NumberGeneratorModule("随机数生成器1")
    num_gen1.set_parameter("min_value", 1)
    num_gen1.set_parameter("max_value", 10)
    
    num_gen2 = NumberGeneratorModule("随机数生成器2")
    num_gen2.set_parameter("min_value", 5)
    num_gen2.set_parameter("max_value", 15)
    
    math_op = MathOperationModule("加法运算")
    math_op.set_parameter("operation", "add")
    
    # 创建一个固定阈值生成器
    threshold_gen = NumberGeneratorModule("阈值生成器")
    threshold_gen.set_parameter("min_value", 15)
    threshold_gen.set_parameter("max_value", 15)  # 固定值为15
    
    condition = ConditionalModule("条件判断")
    condition.set_parameter("condition", "greater")
    
    delay = TimeDelayModule("延迟模块")
    delay.set_parameter("delay_seconds", 0.5)
    
    text_proc = TextProcessingModule("文本处理")
    text_proc.set_parameter("operation", "uppercase")
    
    # 添加模块到工作流 - 注意顺序很重要
    # 确保条件判断模块先于文本处理模块添加，以保证正确的执行顺序
    workflow.add_module(num_gen1)
    workflow.add_module(num_gen2)
    workflow.add_module(threshold_gen)
    workflow.add_module(math_op)
    workflow.add_module(condition)
    workflow.add_module(delay)
    workflow.add_module(text_proc)  # 确保文本处理在条件判断之后
    
    # 设置模块位置（用于UI显示）
    num_gen1.position = (100, 100)
    num_gen2.position = (100, 250)
    math_op.position = (300, 175)
    threshold_gen.position = (300, 325)
    condition.position = (500, 175)
    delay.position = (700, 100)
    text_proc.position = (700, 250)
    
    # 重建所有连接，确保ID一致性
    # 输出所有模块端口的ID信息
    print("\n模块输入/输出端口信息:")
    
    print(f"随机数生成器1 输出端口:")
    for port_id, port in num_gen1.output_ports.items():
        print(f"  - {port.name}: {port_id}")
    
    print(f"随机数生成器2 输出端口:")
    for port_id, port in num_gen2.output_ports.items():
        print(f"  - {port.name}: {port_id}")
    
    print(f"加法运算 输入端口:")
    for port_id, port in math_op.input_ports.items():
        print(f"  - {port.name}: {port_id}")
    
    print(f"加法运算 输出端口:")
    for port_id, port in math_op.output_ports.items():
        print(f"  - {port.name}: {port_id}")
    
    print(f"条件判断 输入端口:")
    for port_id, port in condition.input_ports.items():
        print(f"  - {port.name}: {port_id}")
    
    print(f"条件判断 输出端口:")
    for port_id, port in condition.output_ports.items():
        print(f"  - {port.name}: {port_id}")
    
    print(f"文本处理 输入端口:")
    for port_id, port in text_proc.input_ports.items():
        print(f"  - {port.name}: {port_id}")
    
    print(f"延迟模块 输入端口:")
    for port_id, port in delay.input_ports.items():
        print(f"  - {port.name}: {port_id}")
    
    # 1. 将随机数生成器1连接到加法运算的第一个输入
    num1_out_port_id = None
    for port_id, port in num_gen1.output_ports.items():
        if port.name == "number":
            num1_out_port_id = port_id
            break
    
    math_in1_port_id = None
    for port_id, port in math_op.input_ports.items():
        if port.name == "number1":
            math_in1_port_id = port_id
            break
    
    workflow.connect(num_gen1.id, num1_out_port_id, math_op.id, math_in1_port_id)
    
    # 2. 将随机数生成器2连接到加法运算的第二个输入
    num2_out_port_id = None
    for port_id, port in num_gen2.output_ports.items():
        if port.name == "number":
            num2_out_port_id = port_id
            break
    
    math_in2_port_id = None
    for port_id, port in math_op.input_ports.items():
        if port.name == "number2":
            math_in2_port_id = port_id
            break
    
    workflow.connect(num_gen2.id, num2_out_port_id, math_op.id, math_in2_port_id)
    
    # 3. 将加法结果连接到条件判断的值输入
    math_out_port_id = None
    for port_id, port in math_op.output_ports.items():
        if port.name == "result":
            math_out_port_id = port_id
            break
    
    cond_val_port_id = None
    for port_id, port in condition.input_ports.items():
        if port.name == "value":
            cond_val_port_id = port_id
            break
    
    workflow.connect(math_op.id, math_out_port_id, condition.id, cond_val_port_id)
    
    # 4. 将阈值生成器连接到条件判断的阈值输入
    threshold_out_port_id = None
    for port_id, port in threshold_gen.output_ports.items():
        if port.name == "number":
            threshold_out_port_id = port_id
            break
    
    cond_threshold_port_id = None
    for port_id, port in condition.input_ports.items():
        if port.name == "threshold":
            cond_threshold_port_id = port_id
            break
    
    workflow.connect(threshold_gen.id, threshold_out_port_id, condition.id, cond_threshold_port_id)
    
    # 5. 将条件判断的true结果连接到延迟模块
    cond_true_port_id = None
    for port_id, port in condition.output_ports.items():
        if port.name == "true_result":
            cond_true_port_id = port_id
            break
    
    delay_in_port_id = None
    for port_id, port in delay.input_ports.items():
        if port.name == "input":
            delay_in_port_id = port_id
            break
    
    workflow.connect(condition.id, cond_true_port_id, delay.id, delay_in_port_id)
    
    # 6. 将条件判断的false结果连接到文本处理模块
    cond_false_port_id = None
    for port_id, port in condition.output_ports.items():
        if port.name == "false_result":
            cond_false_port_id = port_id
            break
    
    text_in_port_id = None
    for port_id, port in text_proc.input_ports.items():
        if port.name == "text":
            text_in_port_id = port_id
            break
    
    # 直接创建连接对象并添加到工作流中
    if cond_false_port_id and text_in_port_id:
        print(f"\n手动添加条件判断false_result到文本处理的连接:")
        print(f"  - 源模块: {condition.name}, 端口: false_result ({cond_false_port_id})")
        print(f"  - 目标模块: {text_proc.name}, 端口: text ({text_in_port_id})")
        
        # 创建一个新的连接对象
        connection = Connection(condition.id, cond_false_port_id, text_proc.id, text_in_port_id)
        
        # 手动添加到工作流中
        workflow._connections[connection.id] = connection
        
        # 更新端口连接信息
        source_port = condition.output_ports[cond_false_port_id]
        target_port = text_proc.input_ports[text_in_port_id]
        source_port.connect(target_port.id)
        target_port.connect(source_port.id)
        
        print(f"  - 手动添加连接成功: {connection.id}")
    
    # 检查所有连接
    print("\n当前工作流中的所有连接:")
    for conn_id, conn in workflow._connections.items():
        source_module = workflow._modules[conn.source_module_id]
        target_module = workflow._modules[conn.target_module_id]
        
        source_port_name = "未知"
        for port_id, port in source_module.output_ports.items():
            if port_id == conn.source_port_id:
                source_port_name = port.name
                
        target_port_name = "未知"
        for port_id, port in target_module.input_ports.items():
            if port_id == conn.target_port_id:
                target_port_name = port.name
                
        print(f"- 连接ID: {conn_id}")
        print(f"  {source_module.name}.{source_port_name} -> {target_module.name}.{target_port_name}")
        print(f"  源端口ID: {conn.source_port_id}")
        print(f"  目标端口ID: {conn.target_port_id}")
    
    # 打印连接详情以便调试
    print("\n详细连接信息:")
    for conn_id, conn in workflow._connections.items():
        source_module = workflow._modules[conn.source_module_id]
        target_module = workflow._modules[conn.target_module_id]
        source_port_name = "未知"
        target_port_name = "未知"
        
        # 获取源端口名称
        for port_id, port in source_module.output_ports.items():
            if port_id == conn.source_port_id:
                source_port_name = port.name
                
        # 获取目标端口名称
        for port_id, port in target_module.input_ports.items():
            if port_id == conn.target_port_id:
                target_port_name = port.name
                
        print(f"连接: {source_module.name}.{source_port_name} -> {target_module.name}.{target_port_name}")
        print(f"  源端口ID: {conn.source_port_id}")
        print(f"  目标端口ID: {conn.target_port_id}")
    
    # 7. 记录所有连接的信息，用于调试
    print("\n工作流连接信息:")
    for conn_id, conn in workflow._connections.items():
        source_module = workflow._modules[conn.source_module_id].name
        target_module = workflow._modules[conn.target_module_id].name
        print(f"连接: {source_module} -> {target_module}")
    
    return workflow


def main():
    """主函数"""
    print("开始注册模块...")
    
    # 注册核心模块 (通过导入 backend.workflow_modules)
    # 导入 backend.workflow_modules 会触发其 __init__.py, 
    # 进而调用 backend/workflow_modules/registry.py 中的 register_all_workflow_modules()
    # 确保这行 import backend.workflow_modules 在所有 gmodule_registry 操作之前或在顶部

    # 单独注册此示例文件特有的示例模块
    gmodule_registry.register(NumberGeneratorModule, "输入与生成")
    gmodule_registry.register(MathOperationModule, "数学运算")
    gmodule_registry.register(TextProcessingModule, "文本处理")
    gmodule_registry.register(ConditionalModule, "逻辑控制")
    gmodule_registry.register(TimeDelayModule, "辅助工具")
    
    print(f"已注册的模块类别: {gmodule_registry.get_categories()}")
    
    # 创建工作流引擎
    engine = WorkflowEngine(gmodule_registry)
    
    # 注册进度回调
    engine.register_progress_callback(print_callback)
    
    # 创建示例工作流
    workflow = create_example_workflow()
    
    print(f"\n创建的工作流: {workflow.name}")
    print(f"工作流中的模块数量: {len(workflow.modules)}")
    print(f"工作流中的连接数量: {len(workflow.connections)}")
    
    # 保存工作流到文件
    save_path = os.path.join(os.path.dirname(__file__), "example_workflow.json")
    workflow.save(save_path)
    print(f"工作流已保存到: {save_path}")
    
    # 执行工作流
    print("\n开始执行工作流...")
    engine._workflows[workflow.id] = workflow
    engine._current_workflow_id = workflow.id
    engine.execute(async_run=False)  # 同步执行，便于演示
    
    # 输出执行结果
    print("\n执行结果:")
    for module_id, outputs in engine.execution_results.items():
        module_name = engine.current_workflow.modules[module_id].name
        print(f"模块 '{module_name}' 的输出: {outputs}")


if __name__ == "__main__":
    main() 