import ajax from '@/uni-module-common/http';

/**
 * 获取留言记录（分页）（默认是智慧阅读项目-家校留言模块）
 */
export function getLeaveMessageList(url: string, data: any) {
  return ajax({
    url,
    method: 'POST',
    data,
    custom: {
      showLoading: false
    }
  });
}

/**
 * 发送留言（默认是智慧阅读项目-家校留言模块）
 */
export function sendLeaveMessage(url: string, data: any) {
  return ajax({
    url,
    method: 'POST',
    data,
    custom: {
      showLoading: false
    }
  });
}
