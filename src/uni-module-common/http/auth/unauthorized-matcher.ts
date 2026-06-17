import { noLoginApiWhiteList } from '@/uni-module-common/config/';

/**
 * 历史登录链路的未登录响应特例。
 * 这些路径不是标准协议，只是为了兼容旧登录接口在过渡期的返回形态。
 */
const LEGACY_UNAUTHORIZED_API_KEYWORDS = ['login-v2/login/user-select-login'];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const pickNumber = (value: unknown) => {
  return typeof value === 'number' ? value : undefined;
};

/**
 * 判断当前接口是否属于“未登录跳转白名单”。
 * 白名单接口即使返回类似未登录的业务结构，也不应由公共请求层统一拉起登录页。
 */
export const isWhiteListUnauthorizedApi = (url = '') => {
  return noLoginApiWhiteList.some((item: string) => item.includes(url));
};

/**
 * 判断当前接口是否属于历史登录特例接口。
 * 这类接口仍保留旧的 `500 + 41` 未登录协议，后续彻底移除旧登录链路后可删除。
 */
export const isLegacyUnauthorizedApi = (url = '') => {
  return LEGACY_UNAUTHORIZED_API_KEYWORDS.some((item) => url.includes(item));
};

/**
 * 统一判断接口响应是否属于“未登录”。
 * 标准协议是 `status === 401 && code === 2`；
 * 旧 `login-v2/login/user-select-login` 接口暂时兼容 `status === 500 && code === 41`。
 */
export const isUnauthorizedResponseData = (url: string, responseData: unknown) => {
  if (isWhiteListUnauthorizedApi(url) || !isRecord(responseData)) {
    return false;
  }

  const status = pickNumber(responseData.status);
  const code = pickNumber(responseData.code);
  if (status === undefined || code === undefined) {
    return false;
  }

  if (isLegacyUnauthorizedApi(url)) {
    return status === 500 && code === 41;
  }

  return status === 401 && code === 2;
};
