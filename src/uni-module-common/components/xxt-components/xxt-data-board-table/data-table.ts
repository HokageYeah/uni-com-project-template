export interface ButtonConfig {
  text: string;
  type: 'primary' | 'warning' | 'danger' | 'success';
  action: string;
}

// 表格列配置
export interface DataTableColumn {
  // 列key
  key: string;
  // 列标题
  title: string;
  // 列宽
  width: number;
  type?: 'buttons' | 'text';
  // 操作按钮
  buttons?: ButtonConfig[];
}

export interface DataTableData {
  // 数据id
  dataId: string;
  // 是否是当前用户
  isMe: boolean;
  // 其他数据 必须有跟DataTableColumn的key对应的值
  [key: string]: any;
}
