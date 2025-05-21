/**
 * 工作流设计器相关的工具函数
 */

/**
 * 判断两个端口类型是否兼容
 * @param sourceType 源端口类型
 * @param targetType 目标端口类型
 * @returns 是否兼容
 */
export function areTypesCompatible(sourceType: string, targetType: string): boolean {
  if (sourceType === 'any' || targetType === 'any') return true;
  if (sourceType === targetType) return true;
  // 可扩展更多兼容规则，如 number <-> string 等
  return false;
}

/**
 * 验证节点是否有所有必需的属性
 * @param node 要验证的节点
 * @returns 是否有效
 */
export function validateNodeProperties(node: any): boolean {
  // 这是一个示例函数，可以根据实际需求实现验证逻辑
  if (!node || !node.data) return false;
  return true;
}

/**
 * 生成唯一的节点ID
 * @param counter 当前计数器值
 * @param prefix 可选前缀
 * @returns 新的节点ID
 */
export function generateNodeId(counter: number, prefix: string = 'node-'): string {
  return `${prefix}${counter}`;
} 