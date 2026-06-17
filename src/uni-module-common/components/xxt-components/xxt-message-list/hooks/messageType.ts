export interface MessageType {
  messageId: number;
  messageType: number; // 1 表示文本消息，2 表示语音消息
  messageContent: string; // 文本消息的内容，语音消息为空字符串
  voiceUrl?: string; // 语音消息的 URL 地址，文本消息为空字符串
  duration?: number; // 语音消息的时长，文本消息为 0
  userId?: number;
  userType?: number;
  userName?: string; // 用户名
  selfFlag?: boolean; // 消息是否是自己发送的
  sendDate?: number; // 发送时间戳
}

export interface RoomMessageStoreType {
  roomId: number;
  messageList: MessageType[];
}

export interface MessageResponseType {
  resultList: MessageType[]; // 消息列表
  totalRow: number; // 总行数
  startRow: number; // 起始行数
  pageSize: number; // 每页行数
  totalPage: number; // 总页数
  startPage: number; // 起始页数
  pageCurrent: number; // 当前页数
}
