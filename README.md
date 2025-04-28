# 可拖拽工作流系统

这是一个用Python实现的灵活可扩展的工作流系统，支持创建、编辑和执行模块化工作流。系统设计注重扩展性和可用性，适合集成到各类数据处理、自动化工具和可视化应用中。

## 主要特性

- **模块化设计**：每个模块具有明确的输入输出接口
- **数据流转**：支持任意类型的数据在模块间流转
- **可视化友好**：设计支持与前端框架(如react-flow)集成
- **可序列化**：支持保存和加载工作流
- **可扩展**：提供基类和接口，支持自定义模块开发
- **异步执行**：支持工作流的异步执行和进度回调

## 系统架构

系统由以下核心组件构成：

1. **BaseModule**：模块基类，定义了模块的基本属性和方法
2. **Workflow**：工作流类，管理模块和连接
3. **ModuleRegistry**：模块注册表，负责管理模块类型
4. **WorkflowEngine**：工作流引擎，负责工作流的执行和控制

## 快速开始

### 安装

将项目克隆到本地：

```bash
git clone https://github.com/yourusername/workflow.git
cd workflow
```

### 基本使用

```python
from workflow import WorkflowEngine, BaseModule, Workflow, gmodule_registry
from workflow.examples.example_modules import NumberGeneratorModule, MathOperationModule

# 注册模块
gmodule_registry.register(NumberGeneratorModule, "基础")
gmodule_registry.register(MathOperationModule, "基础")

# 创建工作流引擎
engine = WorkflowEngine(gmodule_registry)

# 创建工作流
workflow = engine.create_workflow("我的工作流")

# 创建模块
num_gen1 = NumberGeneratorModule("随机数生成器1")
num_gen2 = NumberGeneratorModule("随机数生成器2")
math_op = MathOperationModule("加法运算")
math_op.set_parameter("operation", "add")

# 添加模块到工作流
workflow.add_module(num_gen1)
workflow.add_module(num_gen2)
workflow.add_module(math_op)

# 连接模块
workflow.connect(
    num_gen1.id, list(num_gen1.output_ports.keys())[0],
    math_op.id, list(math_op.input_ports.keys())[0]
)
workflow.connect(
    num_gen2.id, list(num_gen2.output_ports.keys())[0],
    math_op.id, list(math_op.input_ports.keys())[1]
)

# 执行工作流
engine.execute()

# 获取结果
for module_id, outputs in engine.execution_results.items():
    module_name = engine.current_workflow.modules[module_id].name
    print(f"模块 '{module_name}' 的输出: {outputs}")
```

### 运行示例

系统附带了一些示例模块和示例工作流：

```bash
python -m workflow.examples.example_workflow
```

### 创建自定义模块

创建自定义模块只需继承BaseModule并实现必要的方法：

```python
from workflow import BaseModule
from typing import Dict, Any

class MyCustomModule(BaseModule):
    def __init__(self, name: str = "自定义模块", description: str = ""):
        super().__init__(name, description)
        
        # 添加输入输出端口
        self.add_input_port("input", "any", "输入数据")
        self.add_output_port("output", "any", "输出数据")
        
        # 添加参数
        self.set_parameter("param1", "默认值")
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        # 获取输入
        input_data = inputs.get(list(self.input_ports.keys())[0])
        
        # 获取参数
        param1 = self.get_parameter("param1")
        
        # 处理逻辑
        output_data = f"{input_data} - {param1}"
        
        # 返回结果
        return {list(self.output_ports.keys())[0]: output_data}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MyCustomModule':
        module = cls(data.get('name', '自定义模块'), data.get('description', ''))
        module._id = data['id']
        
        for key, value in data.get('parameters', {}).items():
            module.set_parameter(key, value)
            
        if 'position' in data:
            module.position = tuple(data['position'])
        
        return module
```

## 与前端集成

工作流系统设计时考虑了与前端框架的集成。模块和连接的序列化/反序列化能力使其能够与诸如react-flow等可视化框架无缝协作。

## 许可证

MIT 