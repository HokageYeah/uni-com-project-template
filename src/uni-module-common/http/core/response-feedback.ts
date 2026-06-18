import { normalizeResponseMeta } from '@/uni-module-common/http/core/normalize-response';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 统一生成用户可见文案。
 * 优先级固定为：
 * 1. ret 第一条里的 SUCCESS:: / ERROR:: 文案
 * 2. 历史 errorMsg
 * 3. 调用方传入的兜底文案
 */
export function getResponseDisplayMessage(responseData: unknown, fallback: string) {
  const meta = normalizeResponseMeta(responseData);
  if (meta.message) {
    console.info('[公共请求] 命中统一展示文案', {
      状态码: meta.status,
      业务码: meta.code,
      ret类型: meta.retType,
      展示文案: meta.message
    });
    return meta.message;
  }

  if (isRecord(responseData)) {
    const errorMsg = responseData.errorMsg;
    if (typeof errorMsg === 'string' && errorMsg.trim()) {
      return errorMsg;
    }
  }

  console.info('[公共请求] 展示文案回退到兜底文案', {
    兜底文案: fallback
  });
  return fallback;
}

/**
 * 判断当前响应是否属于“成功响应”。
 * 新协议优先认 retType=SUCCESS，旧协议再回退到 error===0。
 */
export function isBusinessSuccessResponse(responseData: unknown) {
  const meta = normalizeResponseMeta(responseData);
  if (meta.retType === 'SUCCESS') {
    return true;
  }

  if (isRecord(responseData)) {
    return responseData.error === 0;
  }

  return false;
}

/**
 * 判断当前响应是否属于“业务失败响应”。
 * 新协议优先认 retType=ERROR，同时兼容 data.status_code / status >= 400。
 */
export function isBusinessErrorResponse(responseData: unknown) {
  const meta = normalizeResponseMeta(responseData);
  const matched = Boolean(
    meta.retType === 'ERROR' || (meta.status !== undefined && meta.status >= 400)
  );

  if (matched) {
    console.warn('[公共请求] 命中统一业务失败响应判断', {
      状态码: meta.status,
      业务码: meta.code,
      ret类型: meta.retType,
      错误文案: meta.message
    });
  }

  return matched;
}

/**
 * 网络失败或非标准失败结构时的兜底文案。
 * 这里仍然优先尝试读统一响应里的 ret 文案；只有拿不到时才回退到状态码映射。
 */
export function getHttpFallbackErrorMessage(error: any, isLoggedIn: boolean) {
  let errorMessage = '网络请求出错';

  const normalizedMeta = normalizeResponseMeta(error?.data ?? error);
  if (normalizedMeta.message) {
    console.info('[公共请求] 命中新版统一错误文案', {
      状态码: normalizedMeta.status,
      业务码: normalizedMeta.code,
      ret类型: normalizedMeta.retType,
      错误文案: normalizedMeta.message
    });
    return normalizedMeta.message;
  }

  switch (error?.statusCode) {
    case 400:
      errorMessage = '请求错误';
      break;
    case 401:
      errorMessage = isLoggedIn ? '您的登录已过期' : '请先登录';
      break;
    case 403:
      errorMessage = '拒绝访问';
      break;
    case 404:
      errorMessage = '请求出错';
      break;
    case 408:
      errorMessage = '请求超时';
      break;
    case 429:
      errorMessage = '请求频繁, 请稍后再访问';
      break;
    case 500:
      errorMessage = '服务器开小差啦,请稍后再试~';
      break;
    case 501:
      errorMessage = '服务未实现';
      break;
    case 502:
      errorMessage = '网络错误';
      break;
    case 503:
      errorMessage = '服务不可用';
      break;
    case 504:
      errorMessage = '网络超时';
      break;
    case 505:
      errorMessage = 'HTTP版本不受支持';
      break;
    default:
      break;
  }

  if (typeof error?.errMsg === 'string' && error.errMsg.includes('timeout')) {
    errorMessage = '请求超时';
  }

  // #ifdef H5
  if (typeof error?.errMsg === 'string' && error.errMsg.includes('Network')) {
    errorMessage = window.navigator.onLine ? '服务器异常' : '请检查您的网络连接';
  }
  // #endif

  console.info('[公共请求] 使用 HTTP 兜底错误文案', {
    状态码: error?.statusCode,
    错误文案: errorMessage
  });
  return errorMessage;
}
