# 此文件使 Python 将 'workflow_modules' 目录视为一个包。

# 从新的注册表文件导入注册函数
from .registry import register_all_workflow_modules

# 当此包被导入时调用注册函数
register_all_workflow_modules()

# 可选：如果需要，您仍然可以直接公开特定的模块或子包
# 例如，如果应用程序的其他部分需要直接导入 DBSCANModule 
# 而不通过注册表（尽管通常首选使用注册表）。
# from .analysis import DBSCANModule

# 如果未来有更多模块类别，可以像下面这样组织：
# from .data_sources import register_data_source_modules
# from .data_processing import register_data_processing_modules
# 
# def register_all_core_modules():
#     register_data_source_modules(gmodule_registry)
#     register_data_processing_modules(gmodule_registry)
#     # ... etc.
# 
# 调用注册函数 (如果采用函数方式)
# register_all_core_modules() 