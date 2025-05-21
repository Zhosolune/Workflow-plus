/**
 * 模块定义文件
 * 包含模块类型、属性和分类的定义
 */

// 模块类型枚举
export enum ModuleType {
  SOURCE = 'source',
  PROCESSOR = 'processor',
  ANALYZER = 'analyzer',
  VISUALIZATION = 'viz',
  OUTPUT = 'output'
}

// 模块属性类型枚举
export enum PropertyType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  FILE = 'file',
  COLOR = 'color',
  TEXT = 'text'
}

// 新增：前端 PortDefinition 接口
export interface PortDefinitionFE {
  name: string;
  port_io_type: 'input' | 'output';
  data_type: string;
  description: string;
  is_optional: boolean;
  default_enabled: boolean;
  allow_multiple_connections: boolean;
}

// 新增：前端 VariantDefinition 接口
export interface VariantDefinitionFE {
  variant_id: string;
  variant_name: string;
  description: string;
  port_definitions: PortDefinitionFE[];
}

// 模块属性定义接口
export interface ModulePropertyDefinition {
  id: string;
  name: string;
  type: PropertyType;
  defaultValue?: any;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  min?: number;
  max?: number;
  description?: string;
}

// 模块定义接口
export interface ModuleDefinition {
  id: string;
  name: string;
  icon: string;
  type: ModuleType;
  description?: string;
  category: string;
  properties: ModulePropertyDefinition[];
  inputs?: number;
  outputs?: number;
  color?: string;
}

// 模块分类接口
export interface ModuleCategory {
  key: string;
  title: string;
}

// 模块分类列表
export const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    key: 'data-source',
    title: '数据源',
  },
  {
    key: 'data-processing',
    title: '数据处理',
  },
  {
    key: 'analysis-tools',
    title: '分析工具',
  },
  {
    key: 'visualization',
    title: '可视化',
  },
  {
    key: 'output',
    title: '输出',
  },
];

// 模块定义列表
export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  // 数据源
  {
    id: 'csv-file',
    name: 'CSV文件读取',
    icon: '📄',
    type: ModuleType.SOURCE,
    category: 'data-source',
    description: '读取CSV格式的数据文件',
    properties: [
      {
        id: 'path',
        name: '文件路径',
        type: PropertyType.FILE,
        required: true,
      },
      {
        id: 'delimiter',
        name: '分隔符',
        type: PropertyType.STRING,
        defaultValue: ',',
      },
      {
        id: 'hasHeader',
        name: '包含表头',
        type: PropertyType.BOOLEAN,
        defaultValue: true,
      }
    ],
    inputs: 0,
    outputs: 1,
    color: '#2196f3',
  },
  {
    id: 'database',
    name: '数据库连接',
    icon: '🗃️',
    type: ModuleType.SOURCE,
    category: 'data-source',
    description: '连接数据库并读取数据',
    properties: [
      {
        id: 'connectionString',
        name: '连接字符串',
        type: PropertyType.STRING,
        required: true,
      },
      {
        id: 'query',
        name: 'SQL查询',
        type: PropertyType.TEXT,
        required: true,
      }
    ],
    inputs: 0,
    outputs: 1,
    color: '#2196f3',
  },
  {
    id: 'input',
    name: '图像输入',
    icon: '🖼️',
    type: ModuleType.SOURCE,
    category: 'data-source',
    description: '读取图像文件',
    properties: [
      {
        id: 'path',
        name: '文件路径',
        type: PropertyType.FILE,
        required: true,
      },
      {
        id: 'format',
        name: '图像格式',
        type: PropertyType.SELECT,
        options: [
          { label: 'PNG', value: 'png' },
          { label: 'JPEG', value: 'jpeg' },
          { label: 'GIF', value: 'gif' }
        ],
        defaultValue: 'png',
      }
    ],
    inputs: 0,
    outputs: 1,
    color: '#2196f3',
  },

  // 数据处理
  {
    id: 'data-cut',
    name: '数据切片',
    icon: '✂️',
    type: ModuleType.PROCESSOR,
    category: 'data-processing',
    description: '提取数据的子集',
    properties: [
      {
        id: 'startIndex',
        name: '起始索引',
        type: PropertyType.NUMBER,
        defaultValue: 0,
        min: 0,
      },
      {
        id: 'endIndex',
        name: '结束索引',
        type: PropertyType.NUMBER,
        defaultValue: 100,
        min: 0,
      }
    ],
    inputs: 1,
    outputs: 1,
    color: '#ff9800',
  },
  {
    id: 'data-filter',
    name: '数据过滤',
    icon: '🔍',
    type: ModuleType.PROCESSOR,
    category: 'data-processing',
    description: '根据条件过滤数据',
    properties: [
      {
        id: 'condition',
        name: '过滤条件',
        type: PropertyType.STRING,
        required: true,
      }
    ],
    inputs: 1,
    outputs: 1,
    color: '#ff9800',
  },
  {
    id: 'data-transform',
    name: '数据转换',
    icon: '🔄',
    type: ModuleType.PROCESSOR,
    category: 'data-processing',
    description: '转换数据格式或结构',
    properties: [
      {
        id: 'transformation',
        name: '转换表达式',
        type: PropertyType.TEXT,
        required: true,
      }
    ],
    inputs: 1,
    outputs: 1,
    color: '#ff9800',
  },

  // 分析工具
  {
    id: 'kmeans',
    name: 'K-Means聚类',
    icon: '📊',
    type: ModuleType.ANALYZER,
    category: 'analysis-tools',
    description: '使用K-Means算法进行聚类分析',
    properties: [
      {
        id: 'clusters',
        name: '聚类数量',
        type: PropertyType.NUMBER,
        defaultValue: 3,
        min: 1,
        required: true,
      },
      {
        id: 'iterations',
        name: '最大迭代次数',
        type: PropertyType.NUMBER,
        defaultValue: 100,
        min: 1,
      }
    ],
    inputs: 1,
    outputs: 1,
    color: '#9c27b0',
  },
  {
    id: 'correlation',
    name: '相关分析',
    icon: '📈',
    type: ModuleType.ANALYZER,
    category: 'analysis-tools',
    description: '计算数据集中变量之间的相关性',
    properties: [
      {
        id: 'method',
        name: '相关系数类型',
        type: PropertyType.SELECT,
        options: [
          { label: 'Pearson', value: 'pearson' },
          { label: 'Spearman', value: 'spearman' }
        ],
        defaultValue: 'pearson',
      }
    ],
    inputs: 1,
    outputs: 1,
    color: '#9c27b0',
  },
  {
    id: 'pca',
    name: 'PCA降维',
    icon: '📉',
    type: ModuleType.ANALYZER,
    category: 'analysis-tools',
    description: '使用主成分分析进行降维',
    properties: [
      {
        id: 'components',
        name: '主成分数量',
        type: PropertyType.NUMBER,
        defaultValue: 2,
        min: 1,
        required: true,
      }
    ],
    inputs: 1,
    outputs: 1,
    color: '#9c27b0',
  },
  {
    id: 'dbscan-cluster',
    name: 'DBSCAN 聚类',
    icon: '🧩',
    type: ModuleType.ANALYZER,
    category: 'analysis-tools',
    description: '使用DBSCAN算法进行基于密度的空间聚类。',
    properties: [
      {
        id: 'eps',
        name: 'Epsilon (邻域半径)',
        type: PropertyType.NUMBER,
        defaultValue: 0.5,
        min: 0.001,
        required: true,
        description: '定义一个点的邻域半径大小。该值影响聚类的粒度。'
      },
      {
        id: 'min_samples',
        name: '最小样本数',
        type: PropertyType.NUMBER,
        defaultValue: 5,
        min: 1,
        required: true,
        description: '一个点成为核心点所需的最小邻域点数（包含自身）。'
      },
      {
        id: 'metric',
        name: '距离度量',
        type: PropertyType.SELECT,
        options: [
          { label: '欧氏距离 (Euclidean)', value: 'euclidean' },
          { label: '曼哈顿距离 (Manhattan)', value: 'manhattan' },
        ],
        defaultValue: 'euclidean',
        description: '用于计算样本间距离的度量方法。'
      }
    ],
    inputs: 1, 
    outputs: 1, 
    color: '#9c27b0', 
  },

  // 可视化
  {
    id: 'scatter-plot',
    name: '散点图',
    icon: '📍',
    type: ModuleType.VISUALIZATION,
    category: 'visualization',
    description: '创建散点图可视化',
    properties: [
      {
        id: 'xAxis',
        name: 'X轴字段',
        type: PropertyType.STRING,
        required: true,
      },
      {
        id: 'yAxis',
        name: 'Y轴字段',
        type: PropertyType.STRING,
        required: true,
      },
      {
        id: 'color',
        name: '点颜色',
        type: PropertyType.COLOR,
        defaultValue: '#1890ff',
      }
    ],
    inputs: 1,
    outputs: 0,
    color: '#4caf50',
  },
  {
    id: 'bar-chart',
    name: '柱状图',
    icon: '📊',
    type: ModuleType.VISUALIZATION,
    category: 'visualization',
    description: '创建柱状图可视化',
    properties: [
      {
        id: 'xAxis',
        name: 'X轴字段',
        type: PropertyType.STRING,
        required: true,
      },
      {
        id: 'yAxis',
        name: 'Y轴字段',
        type: PropertyType.STRING,
        required: true,
      },
      {
        id: 'color',
        name: '柱颜色',
        type: PropertyType.COLOR,
        defaultValue: '#1890ff',
      }
    ],
    inputs: 1,
    outputs: 0,
    color: '#4caf50',
  },
  {
    id: 'line-chart',
    name: '折线图',
    icon: '📈',
    type: ModuleType.VISUALIZATION,
    category: 'visualization',
    description: '创建折线图可视化',
    properties: [
      {
        id: 'xAxis',
        name: 'X轴字段',
        type: PropertyType.STRING,
        required: true,
      },
      {
        id: 'yAxis',
        name: 'Y轴字段',
        type: PropertyType.STRING,
        required: true,
      },
      {
        id: 'lineColor',
        name: '线条颜色',
        type: PropertyType.COLOR,
        defaultValue: '#1890ff',
      }
    ],
    inputs: 1,
    outputs: 0,
    color: '#4caf50',
  },

  // 输出
  {
    id: 'result-save',
    name: '结果保存',
    icon: '💾',
    type: ModuleType.OUTPUT,
    category: 'output',
    description: '将处理结果保存到文件',
    properties: [
      {
        id: 'path',
        name: '保存路径',
        type: PropertyType.STRING,
        required: true,
      },
      {
        id: 'format',
        name: '文件格式',
        type: PropertyType.SELECT,
        options: [
          { label: 'CSV', value: 'csv' },
          { label: 'JSON', value: 'json' },
          { label: 'Excel', value: 'xlsx' }
        ],
        defaultValue: 'csv',
      }
    ],
    inputs: 1,
    outputs: 0,
    color: '#f44336',
  },
  {
    id: 'report',
    name: '报告生成',
    icon: '📃',
    type: ModuleType.OUTPUT,
    category: 'output',
    description: '生成分析报告',
    properties: [
      {
        id: 'title',
        name: '报告标题',
        type: PropertyType.STRING,
        defaultValue: '数据分析报告',
      },
      {
        id: 'format',
        name: '报告格式',
        type: PropertyType.SELECT,
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'HTML', value: 'html' },
          { label: 'Word', value: 'docx' }
        ],
        defaultValue: 'pdf',
      }
    ],
    inputs: 1,
    outputs: 0,
    color: '#f44336',
  },
];

/**
 * 根据分类获取模块定义列表
 * @param categoryKey 分类键
 * @returns 模块定义列表
 */
export const getModulesByCategory = (categoryKey: string): ModuleDefinition[] => {
  return MODULE_DEFINITIONS.filter(module => module.category === categoryKey);
};

/**
 * 根据ID获取模块定义
 * @param id 模块ID
 * @returns 模块定义或undefined
 */
export const getModuleById = (id: string): ModuleDefinition | undefined => {
  return MODULE_DEFINITIONS.find(module => module.id === id);
};

/**
 * 获取所有模块分类
 * @returns 模块分类列表
 */
export const getAllCategories = (): ModuleCategory[] => {
  return MODULE_CATEGORIES;
};

/**
 * 根据模块类型获取默认颜色
 * @param type 模块类型
 * @returns 颜色代码
 */
export const getColorByModuleType = (type: ModuleType): string => {
  switch (type) {
    case ModuleType.SOURCE:
      return '#2196f3'; // 蓝色
    case ModuleType.PROCESSOR:
      return '#ff9800'; // 橙色
    case ModuleType.ANALYZER:
      return '#9c27b0'; // 紫色
    case ModuleType.VISUALIZATION:
      return '#4caf50'; // 绿色
    case ModuleType.OUTPUT:
      return '#f44336'; // 红色
    default:
      return '#607d8b'; // 默认灰色
  }
}; 