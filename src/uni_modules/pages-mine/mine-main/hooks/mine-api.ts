import { request } from '@/uni-module-common/http';
import type { ApiResponse } from '@/uni-module-common/http';

/**
 * 我的页接口返回的最小用户信息。
 * 字段用于约束 request<T>() 的返回结构，不重新引入旧工程的学校、班级、多身份模型。
 */
export interface CurrentUserInfo {
  /** 用户唯一标识，后端可能返回数字或字符串，页面展示时统一转成字符串。 */
  id?: string | number;
  /** 用户昵称；接口缺省时页面会继续展示本地登录态昵称。 */
  nickname?: string;
  /** 用户头像地址；接口缺省时页面会继续展示本地登录态头像。 */
  avatar?: string;
  /** 用户手机号；仅展示脱敏摘要，不在日志中输出。 */
  mobile?: string;
  /** 兼容旧接口可能返回的其它字段，页面不直接展开展示。 */
  [key: string]: unknown;
}

/**
 * 获取当前登录用户信息。
 * 该接口显式开启 custom.auth，用来固定“受保护接口必须声明登录要求”的推荐写法。
 */
export function getCurrentUserInfoApi(): Promise<ApiResponse<CurrentUserInfo>> {
  return request<CurrentUserInfo>({
    url: '/user-data-v2/user/get-user-info-by-login',
    method: 'GET',
    custom: {
      auth: true,
      showLoading: false
    }
  });
}
