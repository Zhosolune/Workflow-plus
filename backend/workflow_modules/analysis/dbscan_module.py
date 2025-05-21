from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from sklearn.cluster import DBSCAN

from backend.core.base_module import BaseModule, PortDefinition, VariantDefinition

class DBSCANModule(BaseModule):
    """
    DBSCAN 聚类模块
    使用DBSCAN算法对输入数据进行基于密度的空间聚类。
    """
    def __init__(self, name: str = "DBSCAN 聚类", 
                 description: str = "使用DBSCAN算法进行聚类分析",
                 initial_variant_id: Optional[str] = None, 
                 initial_ports_config: Optional[Dict[str, bool]] = None):
        super().__init__(name, description, initial_variant_id, initial_ports_config)
        
        self._parameters['eps'] = 0.5
        self._parameters['min_samples'] = 5
        self._parameters['metric'] = 'euclidean'

    @classmethod
    def _get_variant_definitions(cls) -> Dict[str, VariantDefinition]:
        return {
            "default": VariantDefinition(
                variant_id="default",
                variant_name="核心点输出",
                description="仅输出DBSCAN聚类的核心点（包含所属簇标签），过滤掉噪声点。",
                port_definitions=[
                    PortDefinition(name="data_input", port_io_type="input", data_type="dataframe", description="待聚类的数据集 (Pandas DataFrame)", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="clustered_data", port_io_type="output", data_type="dataframe", description="聚类后的核心点数据，并带有簇标签列 'cluster_label'", is_optional=False, default_enabled=True, allow_multiple_connections=True)
                ]
            ),
            "detailed_output": VariantDefinition(
                variant_id="detailed_output",
                variant_name="核心点与噪声输出",
                description="分别输出DBSCAN聚类的核心点数据（带簇标签）和噪声点数据。",
                port_definitions=[
                    PortDefinition(name="data_input", port_io_type="input", data_type="dataframe", description="待聚类的数据集 (Pandas DataFrame)", is_optional=False, default_enabled=True, allow_multiple_connections=False),
                    PortDefinition(name="clustered_data", port_io_type="output", data_type="dataframe", description="聚类后的核心点数据，并带有簇标签列 'cluster_label'", is_optional=False, default_enabled=True, allow_multiple_connections=True),
                    PortDefinition(name="noise_data", port_io_type="output", data_type="dataframe", description="被识别为噪声的点数据", is_optional=False, default_enabled=True, allow_multiple_connections=True)
                ]
            )
        }

    def execute(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        input_df = inputs.get("data_input")
        if input_df is None:
            raise ValueError("输入端口 'data_input' 未提供数据或数据为None")
        if not isinstance(input_df, pd.DataFrame):
            raise TypeError(f"输入数据 'data_input' 必须是 Pandas DataFrame，但收到了 {type(input_df)}")

        eps = self.get_parameter('eps', 0.5)
        min_samples = self.get_parameter('min_samples', 5)
        metric = self.get_parameter('metric', 'euclidean')

        if not isinstance(eps, (int, float)) or eps <= 0:
            raise ValueError(f"参数 'eps' 必须是正数，但收到了 {eps}")
        if not isinstance(min_samples, int) or min_samples <= 0:
            raise ValueError(f"参数 'min_samples' 必须是正整数，但收到了 {min_samples}")

        try:
            data_to_cluster = input_df.copy()
            
            db = DBSCAN(eps=eps, min_samples=min_samples, metric=metric).fit(data_to_cluster)
            labels = db.labels_
            
            core_samples_mask = np.zeros_like(labels, dtype=bool)
            if hasattr(db, 'core_sample_indices_') and db.core_sample_indices_ is not None and len(db.core_sample_indices_) > 0 :
                 core_samples_mask[db.core_sample_indices_] = True

            outputs = {}

            clustered_points_mask = (labels != -1)
            clustered_data_df = input_df[clustered_points_mask].copy() 
            clustered_data_df['cluster_label'] = labels[clustered_points_mask]
            outputs["clustered_data"] = clustered_data_df

            if self._current_variant_id == "detailed_output":
                noise_points_mask = (labels == -1)
                noise_data_df = input_df[noise_points_mask].copy()
                outputs["noise_data"] = noise_data_df
            
            return outputs

        except Exception as e:
            print(f"DBSCANModule execute error: {e}")
            raise 

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'DBSCANModule':
        instance = super().from_dict(data)
        return instance 