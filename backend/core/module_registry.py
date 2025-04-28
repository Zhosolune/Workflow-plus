from typing import Dict, Type, List, Any, Optional
from .base_module import BaseModule

class ModuleRegistry:
    """
    模块注册表类，负责管理工作流中可用的模块类型
    """
    def __init__(self):
        self._registry: Dict[str, Type[BaseModule]] = {}
        self._categories: Dict[str, List[str]] = {}  # 按类别组织模块
    
    def register(self, module_class: Type[BaseModule], category: str = "默认") -> None:
        """
        注册模块类
        
        Args:
            module_class: 模块类，必须是BaseModule的子类
            category: 模块类别，用于UI中的分组显示
        """
        if not issubclass(module_class, BaseModule):
            raise TypeError(f"模块类 {module_class.__name__} 必须是BaseModule的子类")
        
        module_name = module_class.__name__
        
        # 注册到主注册表
        self._registry[module_name] = module_class
        
        # 添加到类别
        if category not in self._categories:
            self._categories[category] = []
        
        if module_name not in self._categories[category]:
            self._categories[category].append(module_name)
    
    def unregister(self, module_name: str) -> bool:
        """
        取消注册模块类
        
        Args:
            module_name: 模块类名称
            
        Returns:
            是否成功取消注册
        """
        if module_name not in self._registry:
            return False
        
        # 从主注册表中移除
        del self._registry[module_name]
        
        # 从所有类别中移除
        for category, modules in self._categories.items():
            if module_name in modules:
                modules.remove(module_name)
        
        return True
    
    def get(self, module_name: str) -> Optional[Type[BaseModule]]:
        """
        获取指定名称的模块类
        
        Args:
            module_name: 模块类名称
            
        Returns:
            模块类或None（如果不存在）
        """
        return self._registry.get(module_name)
    
    def get_all(self) -> Dict[str, Type[BaseModule]]:
        """
        获取所有注册的模块类
        
        Returns:
            模块类字典，键为模块名称，值为模块类
        """
        return self._registry.copy()
    
    def get_categories(self) -> Dict[str, List[str]]:
        """
        获取所有模块类别及其包含的模块
        
        Returns:
            类别字典，键为类别名称，值为该类别下的模块名称列表
        """
        return self._categories.copy()
    
    def get_modules_by_category(self, category: str) -> List[str]:
        """
        获取指定类别下的所有模块名称
        
        Args:
            category: 类别名称
            
        Returns:
            模块名称列表
        """
        return self._categories.get(category, []).copy()
    
    def create_instance(self, module_name: str, *args: Any, **kwargs: Any) -> Optional[BaseModule]:
        """
        创建指定模块类的实例
        
        Args:
            module_name: 模块类名称
            *args: 传递给模块构造函数的位置参数
            **kwargs: 传递给模块构造函数的关键字参数
            
        Returns:
            模块实例或None（如果模块类不存在）
        """
        module_class = self.get(module_name)
        if module_class is None:
            return None
        
        return module_class(*args, **kwargs)


# 创建全局模块注册表实例
gmodule_registry = ModuleRegistry() 