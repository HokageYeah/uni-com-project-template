import type { RequestError } from '@/uni-module-common/http/types';

/**
 * 生成请求错误对象。
 * 这里只收敛可安全记录的摘要字段，原始错误仅挂在 raw 上，调用方不得直接展开到日志。
 */
export function createRequestError(error: RequestError): RequestError {
  return {
    message: error.message,
    statusCode: error.statusCode,
    code: error.code,
    raw: error.raw
  };
}

/**
 * 保留旧请求层的用户可见错误文案。
 * task-02 只抽出文案生成逻辑，不改变 showToast、清登录态和跳登录等副作用发生位置。
 */
export function getLegacyRequestErrorMessage(error: any, isLoggedIn: boolean) {
  let errorMessage = '网络请求出错';

  if (error !== undefined && error !== null) {
    switch (error.statusCode) {
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

    if (typeof error.errMsg === 'string' && error.errMsg.includes('timeout')) {
      errorMessage = '请求超时';
    }

    // #ifdef H5
    if (typeof error.errMsg === 'string' && error.errMsg.includes('Network')) {
      errorMessage = window.navigator.onLine ? '服务器异常' : '请检查您的网络连接';
    }
    // #endif
  }

  return errorMessage;
}
