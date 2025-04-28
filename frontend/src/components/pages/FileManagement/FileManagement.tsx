import React from 'react';
import { Table, Button, Space, Upload, Input, message } from 'antd';
import { 
  UploadOutlined, 
  FileAddOutlined,
  SearchOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

// 定义文件数据接口
interface FileData {
  key: string;
  name: string;
  size: string;
  type: string;
  lastModified: string;
}

// 示例文件数据
const fileData: FileData[] = [
  {
    key: '1',
    name: '示例工作流1.json',
    size: '23KB',
    type: 'JSON',
    lastModified: '2023-07-15 12:30',
  },
  {
    key: '2',
    name: '数据集1.csv',
    size: '1.5MB',
    type: 'CSV',
    lastModified: '2023-07-14 09:45',
  },
  {
    key: '3',
    name: '分析结果.xlsx',
    size: '890KB',
    type: 'XLSX',
    lastModified: '2023-07-10 15:20',
  },
];

/**
 * 文件管理页面
 * 管理系统文件
 */
const FileManagement: React.FC = () => {
  // 表格列定义
  const columns: ColumnsType<FileData> = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'JSON', value: 'JSON' },
        { text: 'CSV', value: 'CSV' },
        { text: 'XLSX', value: 'XLSX' },
      ],
      onFilter: (value, record) => record.type.indexOf(value as string) === 0,
    },
    {
      title: '修改时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      sorter: (a, b) => a.lastModified.localeCompare(b.lastModified),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" size="small">下载</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ];

  // 文件上传成功处理
  const handleUploadSuccess = () => {
    message.success('文件上传成功');
  };

  return (
    <div className="file-management-page">
      <h2>文件管理</h2>
      
      {/* 操作栏 */}
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<FileAddOutlined />}>新建文件夹</Button>
        <Upload 
          name="file" 
          action="/api/upload" 
          showUploadList={false}
          onChange={handleUploadSuccess}
        >
          <Button icon={<UploadOutlined />}>上传文件</Button>
        </Upload>
        <Input 
          placeholder="搜索文件" 
          prefix={<SearchOutlined />} 
          style={{ width: 200 }} 
        />
      </Space>
      
      {/* 文件表格 */}
      <Table 
        columns={columns} 
        dataSource={fileData} 
        pagination={{ pageSize: 10 }}
        rowSelection={{
          type: 'checkbox',
        }}
      />
    </div>
  );
};

export default FileManagement; 