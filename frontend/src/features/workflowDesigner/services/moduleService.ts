/**
 * 工作流设计器模块服务
 * 处理与模块定义和变体相关的API请求和数据处理
 */

import { VariantDefinitionFE } from '../../../models/moduleDefinitions';

/**
 * 获取模块的变体定义
 * 模拟API调用获取模块变体定义
 * 
 * @param moduleTypeOrId 模块类型或ID
 * @returns 模块变体定义列表或null
 */
export const fetchModuleVariantDefinitions = async (moduleTypeOrId: string): Promise<VariantDefinitionFE[] | null> => {
  // 基于 moduleTypeOrId 返回模拟数据
  // 在实际应用中，这里会是一个真实的API请求
  
  // 例如，如果 moduleTypeOrId 是 'ConditionalModule' (假设这是其唯一ID或类型名)
  if (moduleTypeOrId === 'conditional') { // 假设模块库中 'conditional' 模块的 id 是 'conditional'
    return [
      {
        variant_id: "default",
        variant_name: "数字比较 (模拟)",
        description: "比较两个数值，根据结果从不同端口输出原始值。",
        port_definitions: [
          { name: "value", port_io_type: "input", data_type: "number", description: "要判断的值", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "threshold", port_io_type: "input", data_type: "number", description: "阈值", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "true_result", port_io_type: "output", data_type: "any", description: "条件为真时输出原始'value'", is_optional: false, default_enabled: true, allow_multiple_connections: true },
          { name: "false_result", port_io_type: "output", data_type: "any", description: "条件为假时输出原始'value'", is_optional: false, default_enabled: true, allow_multiple_connections: true }
        ]
      },
      {
        variant_id: "string_compare",
        variant_name: "字符串比较 (模拟)",
        description: "比较两个字符串是否相等。",
        port_definitions: [
          { name: "string1", port_io_type: "input", data_type: "string", description: "第一个字符串", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "string2", port_io_type: "input", data_type: "string", description: "第二个字符串", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "match_output", port_io_type: "output", data_type: "boolean", description: "比较结果", is_optional: false, default_enabled: true, allow_multiple_connections: true },
          { name: "detail_output", port_io_type: "output", data_type: "string", description: "详细比较描述 (可选)", is_optional: true, default_enabled: false, allow_multiple_connections: true }
        ]
      }
    ];
  }
  // 新增DBSCAN变体定义
  else if (moduleTypeOrId === 'dbscan-cluster') {
    return [
      {
        variant_id: "default",
        variant_name: "核心点输出 (模拟)",
        description: "仅输出DBSCAN聚类的核心点数据。",
        port_definitions: [
          { name: "data_input", port_io_type: "input", data_type: "any", description: "待聚类的数据", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "clustered_data", port_io_type: "output", data_type: "any", description: "聚类后的核心点数据", is_optional: false, default_enabled: true, allow_multiple_connections: true }
        ]
      },
      {
        variant_id: "detailed_output",
        variant_name: "核心点与噪声输出 (模拟)",
        description: "分别输出DBSCAN聚类的核心点数据和噪声点数据。",
        port_definitions: [
          { name: "data_input", port_io_type: "input", data_type: "any", description: "待聚类的数据", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "clustered_data", port_io_type: "output", data_type: "any", description: "聚类后的核心点数据", is_optional: false, default_enabled: true, allow_multiple_connections: true },
          { name: "noise_data", port_io_type: "output", data_type: "any", description: "聚类后的噪声点数据", is_optional: false, default_enabled: true, allow_multiple_connections: true }
        ]
      }
    ];
  }
  // 为其他模块类型返回一个通用的默认变体或空数组
  return [
      {
        variant_id: "default",
        variant_name: "默认变体 (模拟)",
        description: "这是一个模拟的默认变体。",
        port_definitions: [
          { name: "input1", port_io_type: "input", data_type: "any", description: "输入1", is_optional: false, default_enabled: true, allow_multiple_connections: false },
          { name: "output1", port_io_type: "output", data_type: "any", description: "输出1", is_optional: false, default_enabled: true, allow_multiple_connections: true }
        ]
      }
  ];
  // return null; // 或者在获取失败时返回 null
}; 