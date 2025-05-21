# 前后端交互 API 文档 (API_backend_interaction.md)

本文档定义了 Workflow-plus 系统前端与后端之间进行交互的API接口。

**最近更新**: 2025-05-21

## 1. 概述

API旨在实现以下核心功能：
- 工作流的创建、保存和加载。
- 模块定义及其变体信息的获取。
- 工作流的执行与状态监控。

所有API请求和响应体均使用JSON格式。

## 2. API端点

### 2.1. 工作流管理

#### 2.1.1. 保存工作流

- **Endpoint**: `POST /api/workflow/save`
- **功能**: 保存当前工作流的设计。
- **请求体**:
  ```json
  {
    "name": "string (工作流名称)",
    "description": "string (可选, 工作流描述)",
    "nodes": [
      {
        "id": "string (节点实例ID, e.g., 'node-1')",
        "type": "string (模块类型/定义ID, e.g., 'FileReaderModule')",
        "position": { "x": "number", "y": "number" },
        "data": {
          "name": "string (节点显示名称)",
          "description": "string (可选, 节点描述)",
          "currentVariantId": "string (当前激活的变体ID)",
          "activePortsConfig": { 
            "portName1": "boolean (可选端口1是否启用)",
            "portName2": "boolean (可选端口2是否启用)" 
          },
          "properties": {
            "param1": "any (模块参数1的值)",
            "param2": "any (模块参数2的值)"
          }
          // ... 其他 CustomNodeData 中的相关字段
        }
      }
    ],
    "edges": [
      {
        "id": "string (连接ID, e.g., 'edge-1')",
        "source": "string (源节点实例ID)",
        "target": "string (目标节点实例ID)",
        "sourceHandle": "string (源端口名称)",
        "targetHandle": "string (目标端口名称)"
      }
    ]
  }
  ```
- **响应**:
  - **成功 (200 OK)**:
    ```json
    {
      "message": "工作流保存成功",
      "workflowId": "string (保存后的工作流唯一ID)"
    }
    ```
  - **失败 (4xx/5xx)**:
    ```json
    {
      "error": "string (错误信息)"
    }
    ```

#### 2.1.2. 加载工作流

- **Endpoint**: `GET /api/workflow/load/{workflow_id}`
- **功能**: 根据工作流ID加载已保存的工作流。
- **路径参数**:
  - `workflow_id (string)`: 要加载的工作流的唯一ID。
- **响应**:
  - **成功 (200 OK)**: 返回与保存工作流时请求体结构类似的JSON对象。
    ```json
    {
      "id": "string (工作流ID)",
      "name": "string (工作流名称)",
      "description": "string (可选, 工作流描述)",
      "nodes": [ /* ... 节点列表，结构同保存请求 ... */ ],
      "edges": [ /* ... 连接列表，结构同保存请求 ... */ ]
    }
    ```
  - **失败 (404 Not Found / 5xx)**:
    ```json
    {
      "error": "string (错误信息)"
    }
    ```

### 2.2. 模块定义

#### 2.2.1. 获取所有模块定义

- **Endpoint**: `GET /api/modules/definitions`
- **功能**: 获取系统中所有已注册模块的基本定义列表。
- **响应**:
  - **成功 (200 OK)**:
    ```json
    [
      {
        "id": "string (模块类型/定义ID, e.g., 'FileReaderModule')",
        "name": "string (模块显示名称)",
        "icon": "string (模块图标, e.g., emoji或图片URL)",
        "type": "string (模块分类, e.g., 'source', 'processor')",
        "description": "string (可选, 模块描述)",
        "category": "string (模块所属类别)" 
      }
      // ...更多模块定义
    ]
    ```
  - **失败 (5xx)**:
    ```json
    {
      "error": "string (错误信息)"
    }
    ```

#### 2.2.2. 获取特定模块的变体信息

- **Endpoint**: `GET /api/modules/{module_type_id}/variants`
- **功能**: 获取指定模块类型的所有可用变体及其端口定义。
- **路径参数**:
  - `module_type_id (string)`: 模块的类型/定义ID。
- **响应**:
  - **成功 (200 OK)**:
    ```json
    [
      {
        "variant_id": "string (变体唯一ID, e.g., 'default')",
        "variant_name": "string (变体显示名称)",
        "description": "string (可选, 变体描述)",
        "port_definitions": [
          {
            "name": "string (端口名称, 在模块内唯一)",
            "port_io_type": "string ('input' 或 'output')",
            "data_type": "string (数据类型, e.g., 'number', 'string', 'any')",
            "description": "string (可选, 端口描述)",
            "is_optional": "boolean (是否为可选端口)",
            "default_enabled": "boolean (如果可选, 默认是否启用)",
            "allow_multiple_connections": "boolean (是否允许一个端口有多条连接)"
          }
          // ...更多端口定义
        ]
      }
      // ...更多变体定义
    ]
    ```
  - **失败 (404 Not Found / 5xx)**:
    ```json
    {
      "error": "string (错误信息)"
    }
    ```

### 2.3. 工作流执行

#### 2.3.1. 执行工作流

- **Endpoint**: `POST /api/workflow/execute`
- **功能**: 执行一个工作流。可以传递已保存工作流的ID，或直接传递完整的工作流数据。
- **请求体**:
  - **选项1: 通过工作流ID执行**
    ```json
    {
      "workflowId": "string (已保存的工作流ID)",
      "asyncRun": "boolean (可选, 是否异步执行, 默认为true)"
    }
    ```
  - **选项2: 直接传递工作流数据执行**
    ```json
    {
      "workflowData": { /* ... 与保存工作流时请求体结构相同的JSON对象 ... */ },
      "asyncRun": "boolean (可选, 是否异步执行, 默认为true)"
    }
    ```
- **响应**:
  - **成功 (200 OK / 202 Accepted for async)**:
    ```json
    {
      "message": "string (执行已启动/完成信息)",
      "executionId": "string (可选, 异步执行时的执行ID)",
      "status": "string (当前状态, e.g., 'RUNNING', 'COMPLETED', 'ERROR')",
      "results": "object (可选, 同步执行时的结果)"
    }
    ```
  - **失败 (4xx/5xx)**:
    ```json
    {
      "error": "string (错误信息)"
    }
    ```

#### 2.3.2. 获取工作流执行状态 (用于异步执行)

- **Endpoint**: `GET /api/workflow/status/{execution_id}`
- **功能**: 查询异步执行的工作流的当前状态。
- **路径参数**:
  - `execution_id (string)`: `/api/workflow/execute` 返回的执行ID。
- **响应**:
  - **成功 (200 OK)**:
    ```json
    {
      "executionId": "string",
      "workflowId": "string (关联的工作流ID)",
      "status": "string (整体执行状态: 'RUNNING', 'PAUSED', 'COMPLETED', 'ERROR')",
      "startTime": "datetime_string (ISO 8601)",
      "endTime": "datetime_string (ISO 8601, 可选)",
      "errorMessage": "string (可选, 整体错误信息)",
      "modulesStatus": [
        {
          "moduleId": "string (节点实例ID)",
          "moduleName": "string (节点显示名称)",
          "status": "string ('idle', 'running', 'completed', 'error')",
          "startTime": "datetime_string (ISO 8601, 可选)",
          "endTime": "datetime_string (ISO 8601, 可选)",
          "errorMessage": "string (可选, 模块特定错误信息)",
          "outputs": "object (可选, 模块输出预览)" 
        }
        // ...更多模块状态
      ]
    }
    ```
  - **失败 (404 Not Found / 5xx)**:
    ```json
    {
      "error": "string (错误信息)"
    }
    ```

#### 2.3.3. (可选) WebSocket 端点

- **Endpoint**: `ws://localhost:PORT/api/workflow/progress`
- **功能**: 实时推送工作流执行进度和状态更新。
- **消息格式 (Server -> Client)**:
  ```json
  {
    "eventType": "string (e.g., 'WORKFLOW_START', 'MODULE_START', 'MODULE_COMPLETE', 'MODULE_ERROR', 'WORKFLOW_COMPLETE', 'WORKFLOW_ERROR')",
    "data": {
      "executionId": "string",
      "workflowId": "string",
      "moduleId": "string (可选, 事件相关的模块ID)",
      "moduleName": "string (可选)",
      "status": "string (可选, 事件相关的状态)",
      "timestamp": "datetime_string (ISO 8601)",
      "details": "object (可选, 事件特定详情)"
    }
  }
  ```

## 3. 数据结构说明

### 3.1. NodeData (前端 `CustomNodeData` 对应后端的核心部分)

```typescript
// 参考前端 CustomNodeData 定义
interface BackendNodeData {
  name: string;                         // 节点显示名称 (来自用户编辑或模块定义)
  description?: string;                  // 节点描述 (来自用户编辑或模块定义)
  currentVariantId: string;             // 当前激活的变体ID
  activePortsConfig: { [portName: string]: boolean }; // 可选端口的启用/禁用状态
  properties: { [paramId: string]: any }; // 模块的具体参数值,键为参数ID
}
```
- 后端在处理节点时，会结合 `module_type` (模块类名) 和这些 `data` 来实例化和配置模块。

### 3.2. VariantDefinition 和 PortDefinition

- 参见 `GET /api/modules/{module_type_id}/variants` 的响应结构。后端模块的 `_get_variant_definitions` 方法返回的数据将转换为此格式。

## 4. 注意事项

- **认证与授权**: 本文档未涉及认证与授权机制，实际部署时需要考虑。
- **错误处理**: API应提供统一的错误响应格式。
- **版本控制**: API将来可能会演进，考虑引入版本控制机制。 