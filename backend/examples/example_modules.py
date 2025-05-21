from typing import Dict, Any, List, Optional, Union, Tuple
import random
import time
import math
from datetime import datetime
import logging

import sys
import os
# 添加父目录到系统路径，以便导入核心模块
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.base_module import BaseModule, PortDefinition, VariantDefinition, Port

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
glogger = logging.getLogger('ExampleModules')

class NumberGeneratorModule(BaseModule):
    """
    数字生成器模块，生成指定范围内的随机数
    """
    def __init__(self, name: str = "数字生成器", description: str = "生成随机数", 
                 initial_variant_id: Optional[str] = None, 
                 initial_ports_config: Optional[Dict[str, bool]] = None):
        super().__init__(name, description, initial_variant_id, initial_ports_config)
        
        # 如果没有通过 initial_variant_id 应用端口，则手动添加默认端口（或者依赖基类初始化逻辑）
        # 对于像 NumberGeneratorModule 这样只有一个固定变体的模块，其 _get_variant_definitions 
        # 将返回包含这些端口的单个变体定义。
        # BaseModule 的 __init__ 会处理默认变体的应用。
        # self.add_output_port("number", "number", "生成的随机数") # 此行可以移除，由变体机制处理
        
        self.set_parameter("min_value", 0)
        self.set_parameter("max_value", 100)
    
    @classmethod
    def _get_variant_definitions(cls) -> Dict[str, VariantDefinition]:
        return {
            "default": VariantDefinition(
                variant_id="default",
                variant_name="默认",
                description="生成一个随机数",
                port_definitions=[
                    PortDefinition(name="number", port_io_type="output", data_type="number", description="生成的随机数", is_optional=False, default_enabled=True, allow_multiple_connections=True)
                ]
            )
        }

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        min_value = self.get_parameter("min_value")
        max_value = self.get_parameter("max_value")
        random_number = random.uniform(min_value, max_value)
        # 输出字典的键应为当前活动变体的输出端口名
        return {"number": random_number} # 假设 "default" 变体的输出端口名为 "number"
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'NumberGeneratorModule':
        # 使用基类的 from_dict 来处理通用属性和变体相关的初始化
        instance = super().from_dict(data)
        # NumberGeneratorModule 没有额外的特定状态需要恢复，
        # 参数已由 super().from_dict() 中的 instance._parameters = data.get('parameters', {}) 处理
        # 端口会由 _apply_active_variant_and_config 在基类 __init__ 中创建
        return instance


class MathOperationModule(BaseModule):
    """
    数学运算模块，对输入的数字进行指定运算
    """
    def __init__(self, name: str = "数学运算", description: str = "执行数学运算",
                 initial_variant_id: Optional[str] = None, 
                 initial_ports_config: Optional[Dict[str, bool]] = None):
        super().__init__(name, description, initial_variant_id, initial_ports_config)
        self.set_parameter("operation", "add")

    @classmethod
    def _get_variant_definitions(cls) -> Dict[str, VariantDefinition]:
        return {
            "default": VariantDefinition(
                variant_id="default",
                variant_name="标准双数运算",
                description="对两个输入数字执行数学运算。",
                port_definitions=[
                    PortDefinition(name="number1", port_io_type="input", data_type="number", description="第一个数字", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="number2", port_io_type="input", data_type="number", description="第二个数字", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="result", port_io_type="output", data_type="number", description="运算结果", is_optional=False, default_enabled=True, allow_multiple_connections=True)
                ]
            ),
            "unary_op": VariantDefinition(
                variant_id="unary_op",
                variant_name="单数运算(求平方根)",
                description="对单个输入数字执行开方运算。",
                port_definitions=[
                    PortDefinition(name="input_val", port_io_type="input", data_type="number", description="输入数字", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="sqrt_result", port_io_type="output", data_type="number", description="平方根结果", is_optional=False, default_enabled=True, allow_multiple_connections=True),
                    PortDefinition(name="original_val_passthrough", port_io_type="output", data_type="number", description="原始输入值（可选输出）", is_optional=True, default_enabled=False, allow_multiple_connections=True)
                ]
            )
        }

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        operation = self.get_parameter("operation") # 用于旧变体
        outputs = {}

        if self._current_variant_id == "unary_op":
            input_val = float(inputs.get("input_val", 0))
            if input_val < 0:
                raise ValueError("单数运算（求平方根）的输入不能为负数。")
            outputs["sqrt_result"] = math.sqrt(input_val)
            if self._current_ports_config.get("original_val_passthrough", False): # 检查可选端口是否启用
                 outputs["original_val_passthrough"] = input_val
        elif self._current_variant_id == "default" or not self._current_variant_id:
            # 默认或未指定变体ID时的行为 (兼容旧逻辑)
            number1_val = inputs.get("number1", 0)
            number2_val = inputs.get("number2", 0)

            try:
                number1 = float(number1_val)
                number2 = float(number2_val)
            except (TypeError, ValueError):
                glogger.error(f"数学运算模块无法转换输入为数值: n1={number1_val}, n2={number2_val}")
                number1, number2 = 0, 0
            
            op_type = self.get_parameter("operation", "add")
            if op_type == "add": result = number1 + number2
            elif op_type == "subtract": result = number1 - number2
            elif op_type == "multiply": result = number1 * number2
            elif op_type == "divide":
                if number2 == 0: raise ValueError("除数不能为零")
                result = number1 / number2
            else: raise ValueError(f"不支持的运算类型: {op_type}")
            outputs["result"] = result
        else:
            raise ValueError(f"未知的变体ID: {self._current_variant_id} 在数学运算模块中。")
            
        return outputs
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MathOperationModule':
        instance = super().from_dict(data)
        return instance

class TextProcessingModule(BaseModule):
    """
    文本处理模块，对输入的文本进行处理
    """
    def __init__(self, name: str = "文本处理", description: str = "处理文本",
                 initial_variant_id: Optional[str] = None, 
                 initial_ports_config: Optional[Dict[str, bool]] = None):
        super().__init__(name, description, initial_variant_id, initial_ports_config)
        
        # 添加输入端口
        self.add_input_port("text", "string", "输入文本")
        
        # 添加输出端口
        self.add_output_port("result", "string", "处理结果")
        
        # 初始化参数
        self.set_parameter("operation", "uppercase")  # uppercase, lowercase, reverse, count
    
    @classmethod
    def _get_variant_definitions(cls) -> Dict[str, VariantDefinition]:
        return {
            "default": VariantDefinition(
                variant_id="default",
                variant_name="默认",
                description="处理文本",
                port_definitions=[
                    PortDefinition(name="text", port_io_type="input", data_type="string", description="输入文本", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="result", port_io_type="output", data_type="string", description="处理结果", is_optional=False, default_enabled=True, allow_multiple_connections=True)
                ]
            )
        }

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """执行模块逻辑，处理文本"""
        # 记录输入数据用于调试
        glogger.info(f"文本处理模块收到的输入数据: {inputs}")
        
        # 获取输入端口ID和名称
        input_port_id = list(self.input_ports.keys())[0]
        input_port_name = self.input_ports[input_port_id].name
        glogger.info(f"文本处理模块的输入端口: {input_port_name} (ID: {input_port_id})")
        
        # 获取输入
        text = inputs.get(input_port_id)
        glogger.info(f"文本处理模块从输入端口获取到数据: {text}")
        
        # 处理数据类型
        if text is None:
            glogger.warning("文本处理模块收到的输入为None，使用空字符串")
            text = ""
        
        # 特殊处理条件判断输出
        if isinstance(text, dict):
            glogger.info(f"文本处理模块收到字典类型输入，尝试提取文本内容: {text}")
            
            # 检查是否直接收到条件模块的完整输出
            if "true_result" in text and "false_result" in text:
                # 优先使用false_result（假设条件模块的false分支连接到此）
                if text["false_result"] is not None:
                    glogger.info(f"提取条件判断的false_result: {text['false_result']}")
                    text = text["false_result"]
                # 如果false_result为None，尝试使用true_result
                elif text["true_result"] is not None:
                    glogger.info(f"提取条件判断的true_result: {text['true_result']}")
                    text = text["true_result"]
                else:
                    glogger.warning("条件判断的true_result和false_result都为None")
                    text = ""
            # 从条件判断的false_result中获取数据
            elif "false_result" in text:
                glogger.info(f"提取false_result: {text['false_result']}")
                text = text["false_result"]
            # 从条件判断的true_result中获取数据
            elif "true_result" in text:
                glogger.info(f"提取true_result: {text['true_result']}")
                text = text["true_result"]
            # 尝试从number字段获取数据
            elif "number" in text:
                glogger.info(f"提取number: {text['number']}")
                text = text["number"]
            # 尝试从result字段获取数据
            elif "result" in text:
                glogger.info(f"提取result: {text['result']}")
                text = text["result"]
            # 尝试从output字段获取数据
            elif "output" in text:
                glogger.info(f"提取output: {text['output']}")
                text = text["output"]
            else:
                glogger.warning(f"无法从字典中提取有用数据: {text}")
                text = str(text)
        
        # 处理复杂类型
        if not isinstance(text, (str, int, float)):
            glogger.info(f"转换复杂类型为字符串: {text}")
            text = str(text)
        
        glogger.info(f"文本处理使用的值: text={text}")
        
        # 获取操作类型
        operation = self.get_parameter("operation")
        
        # 执行操作
        result = ""
        if operation == "uppercase":
            result = str(text).upper()
        elif operation == "lowercase":
            result = str(text).lower()
        elif operation == "reverse":
            result = str(text)[::-1]
        elif operation == "count":
            result = str(len(str(text)))
        else:
            raise ValueError(f"不支持的操作类型: {operation}")
        
        glogger.info(f"文本处理结果: {result}")
        
        # 返回结果
        return {"result": result}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TextProcessingModule':
        module = cls(data.get('name', '文本处理'), data.get('description', '处理文本'),
                     initial_variant_id=data.get('current_variant_id'), 
                     initial_ports_config=data.get('current_ports_config'))
        module._id = data['id']
        for key, value in data.get('parameters', {}).items():
            module.set_parameter(key, value)
        if 'position' in data:
            module.position = tuple(data['position'])
        return module


class ConditionalModule(BaseModule):
    """
    条件分支模块，根据条件选择不同的输出
    """
    def __init__(self, name: str = "条件分支", description: str = "条件判断",
                 initial_variant_id: Optional[str] = None, 
                 initial_ports_config: Optional[Dict[str, bool]] = None):
        super().__init__(name, description, initial_variant_id, initial_ports_config)
        self.set_parameter("condition", "greater")  # For 'default' variant
        self.set_parameter("str_compare_mode", "equal_case_sensitive") # For 'string_compare' variant

    @classmethod
    def _get_variant_definitions(cls) -> Dict[str, VariantDefinition]:
        return {
            "default": VariantDefinition(
                variant_id="default",
                variant_name="数字比较",
                description="比较两个数值，根据结果从不同端口输出原始值。",
                port_definitions=[
                    PortDefinition(name="value", port_io_type="input", data_type="number", description="要判断的值", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="threshold", port_io_type="input", data_type="number", description="阈值", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="true_result", port_io_type="output", data_type="any", description="条件为真时输出原始'value'", is_optional=False, default_enabled=True, allow_multiple_connections=True),
                    PortDefinition(name="false_result", port_io_type="output", data_type="any", description="条件为假时输出原始'value'", is_optional=False, default_enabled=True, allow_multiple_connections=True)
                ]
            ),
            "string_compare": VariantDefinition(
                variant_id="string_compare",
                variant_name="字符串比较",
                description="比较两个字符串是否相等。",
                port_definitions=[
                    PortDefinition(name="string1", port_io_type="input", data_type="string", description="第一个字符串", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="string2", port_io_type="input", data_type="string", description="第二个字符串", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="match_output", port_io_type="output", data_type="boolean", description="比较结果 (True表示匹配, False表示不匹配)", is_optional=False, default_enabled=True, allow_multiple_connections=True),
                    PortDefinition(name="detail_output", port_io_type="output", data_type="string", description="详细比较描述 (可选)", is_optional=True, default_enabled=False, allow_multiple_connections=True)
                ]
            )
        }

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        outputs = {}
        active_variant = self._current_variant_id
        # glogger.info(f"ConditionalModule '{self.name}' executing with variant '{active_variant}'. Inputs: {inputs}")

        if active_variant == "default" or not active_variant:
            value_in = inputs.get("value", 0)
            threshold_in = inputs.get("threshold", 0)
            
            try: value = float(value_in)
            except (TypeError, ValueError): value = len(str(value_in)) if isinstance(value_in, str) else 0
            try: threshold = float(threshold_in)
            except (TypeError, ValueError): threshold = len(str(threshold_in)) if isinstance(threshold_in, str) else 0
            
            condition_param = self.get_parameter("condition", "greater")
            condition_met = False
            if condition_param == "greater": condition_met = value > threshold
            elif condition_param == "less": condition_met = value < threshold
            elif condition_param == "equal": condition_met = value == threshold
            elif condition_param == "not_equal": condition_met = value != threshold
            else: raise ValueError(f"Unsupported condition: {condition_param}")
            
            outputs["true_result"] = value_in if condition_met else None
            outputs["false_result"] = None if condition_met else value_in
            # glogger.info(f"  Default variant: value={value}, threshold={threshold}, condition_met={condition_met}, outputs={outputs}")

        elif active_variant == "string_compare":
            str1 = str(inputs.get("string1", ""))
            str2 = str(inputs.get("string2", ""))
            compare_mode = self.get_parameter("str_compare_mode", "equal_case_sensitive")
            
            match = False
            detail_msg = ""
            if compare_mode == "equal_case_sensitive":
                match = str1 == str2
                detail_msg = f"'{str1}' == '{str2}' -> {match}"
            elif compare_mode == "equal_case_insensitive":
                match = str1.lower() == str2.lower()
                detail_msg = f"'{str1}'.lower() == '{str2}'.lower() -> {match}"
            else: raise ValueError(f"Unsupported string compare mode: {compare_mode}")
            
            outputs["match_output"] = match
            if self._current_ports_config.get("detail_output", False): # Check if optional port is enabled
                outputs["detail_output"] = detail_msg
            # glogger.info(f"  String_compare variant: str1='{str1}', str2='{str2}', match={match}, detail='{outputs.get("detail_output")}'")
        
        else:
            raise ValueError(f"Unknown variant ID '{active_variant}' in ConditionalModule.")
            
        return outputs
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConditionalModule':
        instance = super().from_dict(data)
        # Parameters specific to ConditionalModule (like 'condition', 'str_compare_mode')
        # are already handled by BaseModule.from_dict() if they are in data['parameters'].
        return instance


class TimeDelayModule(BaseModule):
    """
    时间延迟模块，延迟指定时间后将输入传递到输出
    """
    def __init__(self, name: str = "时间延迟", description: str = "延迟指定时间",
                 initial_variant_id: Optional[str] = None, 
                 initial_ports_config: Optional[Dict[str, bool]] = None):
        super().__init__(name, description, initial_variant_id, initial_ports_config)
        
        # 添加输入端口
        self.add_input_port("input", "any", "任意输入")
        
        # 添加输出端口
        self.add_output_port("output", "any", "延迟后的输出")
        
        # 初始化参数
        self.set_parameter("delay_seconds", 1.0)
    
    @classmethod
    def _get_variant_definitions(cls) -> Dict[str, VariantDefinition]:
        return {
            "default": VariantDefinition(
                variant_id="default",
                variant_name="默认",
                description="延迟指定时间",
                port_definitions=[
                    PortDefinition(name="input", port_io_type="input", data_type="any", description="任意输入", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="output", port_io_type="output", data_type="any", description="延迟后的输出", is_optional=False, default_enabled=True, allow_multiple_connections=False)
                ]
            )
        }

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """执行模块逻辑，延迟指定时间"""
        # 记录输入数据用于调试
        glogger.info(f"延迟模块收到的输入数据: {inputs}")
        
        # 获取输入
        input_port_id = list(self.input_ports.keys())[0]
        input_value = inputs.get(input_port_id)
        
        # 特殊处理条件判断输出
        if isinstance(input_value, dict):
            # 检查是否直接收到条件模块的完整输出
            if "true_result" in input_value and "false_result" in input_value:
                # 优先使用true_result（假设条件模块的true分支连接到此）
                if input_value["true_result"] is not None:
                    input_value = input_value["true_result"]
                # 如果true_result为None，尝试使用false_result
                elif input_value["false_result"] is not None:
                    input_value = input_value["false_result"]
            # 从条件判断的true_result中获取数据
            elif "true_result" in input_value:
                input_value = input_value["true_result"]
            # 从条件判断的false_result中获取数据
            elif "false_result" in input_value:
                input_value = input_value["false_result"]
            # 尝试从其他常见字段获取数据
            elif "number" in input_value:
                input_value = input_value["number"]
            elif "result" in input_value:
                input_value = input_value["result"]
            elif "output" in input_value:
                input_value = input_value["output"]
        
        # 获取延迟时间
        delay_seconds = self.get_parameter("delay_seconds")
        
        glogger.info(f"延迟模块执行延迟: {delay_seconds}秒，值: {input_value}")
        
        # 执行延迟
        time.sleep(delay_seconds)
        
        # 返回结果
        return {"output": input_value}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'TimeDelayModule':
        module = cls(data.get('name', '时间延迟'), data.get('description', '延迟指定时间'),
                     initial_variant_id=data.get('current_variant_id'), 
                     initial_ports_config=data.get('current_ports_config'))
        module._id = data['id']
        for key, value in data.get('parameters', {}).items():
            module.set_parameter(key, value)
        if 'position' in data:
            module.position = tuple(data['position'])
        return module 