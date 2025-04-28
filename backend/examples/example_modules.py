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

from core.base_module import BaseModule

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
    def __init__(self, name: str = "数字生成器", description: str = "生成随机数"):
        super().__init__(name, description)
        
        # 添加输出端口
        self.add_output_port("number", "number", "生成的随机数")
        
        # 初始化参数
        self.set_parameter("min_value", 0)
        self.set_parameter("max_value", 100)
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """执行模块逻辑，生成随机数"""
        min_value = self.get_parameter("min_value")
        max_value = self.get_parameter("max_value")
        
        # 生成随机数
        random_number = random.uniform(min_value, max_value)
        
        # 返回结果
        return {"number": random_number}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'NumberGeneratorModule':
        """从字典创建模块实例"""
        module = cls(data.get('name', '数字生成器'), data.get('description', '生成随机数'))
        
        # 恢复ID
        module._id = data['id']
        
        # 恢复参数
        for key, value in data.get('parameters', {}).items():
            module.set_parameter(key, value)
        
        # 恢复位置
        if 'position' in data:
            module.position = tuple(data['position'])
        
        return module


class MathOperationModule(BaseModule):
    """
    数学运算模块，对输入的数字进行指定运算
    """
    def __init__(self, name: str = "数学运算", description: str = "执行数学运算"):
        super().__init__(name, description)
        
        # 添加输入端口
        self.add_input_port("number1", "number", "第一个数字")
        self.add_input_port("number2", "number", "第二个数字")
        
        # 添加输出端口
        self.add_output_port("result", "number", "运算结果")
        
        # 初始化参数
        self.set_parameter("operation", "add")  # add, subtract, multiply, divide
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """执行模块逻辑，进行数学运算"""
        # 获取输入端口ID
        input_port_ids = list(self.input_ports.keys())
        
        # 记录输入数据用于调试
        glogger.info(f"数学运算模块收到的输入数据: {inputs}")
        
        # 查找输入数据
        number1 = None
        number2 = None
        
        # 获取第一个数字
        if input_port_ids[0] in inputs:
            number1_data = inputs[input_port_ids[0]]
            if isinstance(number1_data, dict) and "number" in number1_data:
                number1 = number1_data["number"]
            else:
                number1 = number1_data
        
        # 获取第二个数字
        if input_port_ids[1] in inputs:
            number2_data = inputs[input_port_ids[1]]
            if isinstance(number2_data, dict) and "number" in number2_data:
                number2 = number2_data["number"]
            else:
                number2 = number2_data
        
        # 默认值
        if number1 is None:
            number1 = 0
        if number2 is None:
            number2 = 0
            
        # 确保是数值类型
        try:
            number1 = float(number1)
            number2 = float(number2)
        except (TypeError, ValueError):
            glogger.error(f"无法将输入转换为数值: number1={number1}, number2={number2}")
            number1 = 0
            number2 = 0
            
        glogger.info(f"数学运算使用的值: number1={number1}, number2={number2}")
        
        # 获取运算类型
        operation = self.get_parameter("operation")
        
        # 执行运算
        result = 0
        if operation == "add":
            result = number1 + number2
        elif operation == "subtract":
            result = number1 - number2
        elif operation == "multiply":
            result = number1 * number2
        elif operation == "divide":
            if number2 == 0:
                raise ValueError("除数不能为零")
            result = number1 / number2
        else:
            raise ValueError(f"不支持的运算类型: {operation}")
        
        # 返回结果
        return {"result": result}
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MathOperationModule':
        """从字典创建模块实例"""
        module = cls(data.get('name', '数学运算'), data.get('description', '执行数学运算'))
        
        # 恢复ID
        module._id = data['id']
        
        # 恢复参数
        for key, value in data.get('parameters', {}).items():
            module.set_parameter(key, value)
        
        # 恢复位置
        if 'position' in data:
            module.position = tuple(data['position'])
        
        return module


class TextProcessingModule(BaseModule):
    """
    文本处理模块，对输入的文本进行处理
    """
    def __init__(self, name: str = "文本处理", description: str = "处理文本"):
        super().__init__(name, description)
        
        # 添加输入端口
        self.add_input_port("text", "string", "输入文本")
        
        # 添加输出端口
        self.add_output_port("result", "string", "处理结果")
        
        # 初始化参数
        self.set_parameter("operation", "uppercase")  # uppercase, lowercase, reverse, count
    
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
        """从字典创建模块实例"""
        module = cls(data.get('name', '文本处理'), data.get('description', '处理文本'))
        
        # 恢复ID
        module._id = data['id']
        
        # 恢复参数
        for key, value in data.get('parameters', {}).items():
            module.set_parameter(key, value)
        
        # 恢复位置
        if 'position' in data:
            module.position = tuple(data['position'])
        
        return module


class ConditionalModule(BaseModule):
    """
    条件分支模块，根据条件选择不同的输出
    """
    def __init__(self, name: str = "条件分支", description: str = "条件判断"):
        super().__init__(name, description)
        
        # 添加输入端口
        self.add_input_port("value", "number", "要判断的值")
        self.add_input_port("threshold", "number", "阈值")
        
        # 添加输出端口
        self.add_output_port("true_result", "any", "条件为真时的结果")
        self.add_output_port("false_result", "any", "条件为假时的结果")
        
        # 初始化参数
        self.set_parameter("condition", "greater")  # greater, less, equal, not_equal
    
    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """执行模块逻辑，条件判断"""
        glogger.info(f"条件判断模块收到的输入数据: {inputs}")
        
        # 获取输入
        value_port_id = list(self.input_ports.keys())[0]
        threshold_port_id = list(self.input_ports.keys())[1]
        
        value = inputs.get(value_port_id, 0)
        threshold = inputs.get(threshold_port_id, 0)
        
        # 处理字典输入
        if isinstance(value, dict) and "result" in value:
            value = value["result"]
        if isinstance(value, dict) and "number" in value:
            value = value["number"]
            
        if isinstance(threshold, dict) and "result" in threshold:
            threshold = threshold["result"]
        if isinstance(threshold, dict) and "number" in threshold:
            threshold = threshold["number"]
        
        # 处理空输入
        if value is None:
            value = 0
        if threshold is None:
            threshold = 0
            
        # 确保数值类型
        try:
            value = float(value)
            threshold = float(threshold)
        except (TypeError, ValueError):
            # 非数值类型时的处理
            if isinstance(value, str):
                # 对于字符串，尝试比较长度
                value = len(value)
            else:
                value = 0
                
            if isinstance(threshold, str):
                threshold = len(threshold)
            else:
                threshold = 0
        
        glogger.info(f"条件判断使用的值: value={value}, threshold={threshold}")
        
        # 获取条件类型
        condition = self.get_parameter("condition")
        
        # 执行条件判断
        result = False
        if condition == "greater":
            result = value > threshold
        elif condition == "less":
            result = value < threshold
        elif condition == "equal":
            result = value == threshold
        elif condition == "not_equal":
            result = value != threshold
        else:
            raise ValueError(f"不支持的条件类型: {condition}")
        
        glogger.info(f"条件判断结果: {result}")
        
        # 返回结果
        return {
            "true_result": value if result else None,
            "false_result": None if result else value
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConditionalModule':
        """从字典创建模块实例"""
        module = cls(data.get('name', '条件分支'), data.get('description', '条件判断'))
        
        # 恢复ID
        module._id = data['id']
        
        # 恢复参数
        for key, value in data.get('parameters', {}).items():
            module.set_parameter(key, value)
        
        # 恢复位置
        if 'position' in data:
            module.position = tuple(data['position'])
        
        return module


class TimeDelayModule(BaseModule):
    """
    时间延迟模块，延迟指定时间后将输入传递到输出
    """
    def __init__(self, name: str = "时间延迟", description: str = "延迟指定时间"):
        super().__init__(name, description)
        
        # 添加输入端口
        self.add_input_port("input", "any", "任意输入")
        
        # 添加输出端口
        self.add_output_port("output", "any", "延迟后的输出")
        
        # 初始化参数
        self.set_parameter("delay_seconds", 1.0)
    
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
        """从字典创建模块实例"""
        module = cls(data.get('name', '时间延迟'), data.get('description', '延迟指定时间'))
        
        # 恢复ID
        module._id = data['id']
        
        # 恢复参数
        for key, value in data.get('parameters', {}).items():
            module.set_parameter(key, value)
        
        # 恢复位置
        if 'position' in data:
            module.position = tuple(data['position'])
        
        return module 