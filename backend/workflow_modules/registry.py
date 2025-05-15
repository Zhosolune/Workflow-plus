from backend.core.module_registry import gmodule_registry
from backend.workflow_modules.analysis.dbscan_module import DBSCANModule
# 在此导入其他核心模块类别及其模块（随着开发进行）
# 例如:
# from .data_sources import YourCoreDataSourceModule
# from .data_processing import YourCoreDataProcessingModule

def register_all_workflow_modules():
    """
    将所有可用的核心工作流模块注册到全局模块注册表。
    示例模块在其各自的示例文件中单独注册。
    """
    # 注册分析模块
    gmodule_registry.register(DBSCANModule, "聚类分析")

    # 注册其他核心类别模块的示例 (在添加模块后取消注释并调整)
    # gmodule_registry.register(YourCoreDataSourceModule, "数据源")
    # gmodule_registry.register(YourCoreDataProcessingModule, "数据处理")

    # print("核心工作流模块已注册。") # 除非调试，否则保持静默

# 获取已注册模块信息的功能可以保留，用于调试或其他目的
def get_registered_module_info():
    return gmodule_registry.get_all()

def get_registered_categories_info():
    return gmodule_registry.get_categories()

if __name__ == '__main__':
    # 这部分用于在直接运行此文件时测试注册功能
    register_all_workflow_modules()
    print("\n已注册的核心模块 (来自 registry.py 直接运行):")
    for name, cls in get_registered_module_info().items():
        # 尝试从模块类本身获取类别（如果已定义），否则使用默认值
        category = "未知类别"
        # 此处假设模块类可能直接拥有 category 属性，
        # 或者注册表以可通过类访问的方式存储它。
        # 目前，我们只打印名称，因为类别信息可能不直接在 cls 上。
        print(f"- {name}") 
    
    print("\n已注册的类别 (来自 registry.py 直接运行):")
    for category, modules in get_registered_categories_info().items():
        print(f"- {category}: {', '.join(modules)}") 