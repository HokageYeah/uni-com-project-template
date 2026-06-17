import { isAuthRedirectError } from '@/uni-module-common/auth';
import { normalizeResponseMeta } from '@/uni-module-common/http/core/normalize-response';
import {
  createRequestError,
  getLegacyRequestErrorMessage
} from '@/uni-module-common/http/core/request-error';
import type { ApiResponse, RequestConfig, RequestError } from '@/uni-module-common/http/types';

/**
 * 已配置好的旧 ajax 实例调用函数。
 * request<T>() 通过工厂接收该函数，避免反向 import index.ts 造成循环依赖。
 */
interface AjaxRunner {
  (config: RequestConfig): Promise<unknown>;
}

interface RequestLogContext {
  接口地址: string;
  请求方法: string;
  状态码?: number;
  业务码?: number;
  错误摘要?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getSafeRequestContext(
  config: RequestConfig,
  raw?: unknown,
  error?: string
): RequestLogContext {
  const meta = normalizeResponseMeta(raw);

  return {
    接口地址: config.url,
    请求方法: config.method || 'GET',
    状态码: meta.status,
    业务码: meta.code,
    错误摘要: error
  };
}

function pickResponseData<T>(raw: unknown): T {
  if (isRecord(raw) && 'data' in raw) {
    return raw.data as T;
  }

  return raw as T;
}

function pickErrorMessage(raw: unknown, fallback: string) {
  if (!isRecord(raw)) {
    return fallback;
  }

  const message = raw.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  const msg = raw.msg;
  if (typeof msg === 'string' && msg.trim()) {
    return msg;
  }

  const errorMsg = raw.errorMsg;
  if (typeof errorMsg === 'string' && errorMsg.trim()) {
    return errorMsg;
  }

  return fallback;
}

function isBusinessFailure(raw: unknown) {
  if (!isRecord(raw)) {
    return false;
  }

  // 旧 ajax 为了兼容会把 error != 0 的响应 resolve；新入口必须重新收敛为失败结构。
  if ('error' in raw && raw.error !== 0 && raw.error !== null && raw.error !== undefined) {
    return true;
  }

  const meta = normalizeResponseMeta(raw);
  return meta.isObject && typeof meta.status === 'number' && meta.status >= 400;
}

function buildFailureResponse<T>(config: RequestConfig, error: RequestError): ApiResponse<T> {
  console.warn(
    '[请求] request<T> 请求失败，已返回统一失败结构',
    getSafeRequestContext(config, error.raw, error.message)
  );

  return {
    success: false,
    error: error.message,
    raw: error.raw
  };
}

/**
 * 创建推荐请求入口。
 * 这里不重新创建 HTTP client，也不复制鉴权、URL 分流、Cookie 保存等拦截逻辑；
 * 只把旧 ajax 实例的历史返回值收敛为新代码更稳定的 ApiResponse<T>。
 */
export function createRequestApi(ajaxRunner: AjaxRunner) {
  return async function request<T = unknown>(config: RequestConfig): Promise<ApiResponse<T>> {
    try {
      const raw = await ajaxRunner(config);

      // 旧 ajax 网络失败分支会 resolve false；新入口统一改成失败结构，避免继续扩散裸 false。
      if (raw === false) {
        const requestError = createRequestError({
          message: '网络请求出错',
          raw
        });
        return buildFailureResponse<T>(config, requestError);
      }

      if (isBusinessFailure(raw)) {
        const requestError = createRequestError({
          message: pickErrorMessage(raw, '请求失败'),
          code: isRecord(raw) && typeof raw.code === 'number' ? raw.code : undefined,
          raw
        });
        return buildFailureResponse<T>(config, requestError);
      }

      console.info('[请求] request<T> 请求成功', getSafeRequestContext(config, raw));

      return {
        success: true,
        data: pickResponseData<T>(raw),
        raw
      };
    } catch (error) {
      if (isAuthRedirectError(error)) {
        const requestError = createRequestError({
          message: '请先登录',
          raw: error
        });
        return buildFailureResponse<T>(config, requestError);
      }

      const fallbackMessage = getLegacyRequestErrorMessage(error, false);
      const requestError = createRequestError({
        message: pickErrorMessage(error, fallbackMessage || '请求失败'),
        statusCode:
          isRecord(error) && typeof error.statusCode === 'number' ? error.statusCode : undefined,
        code: isRecord(error) && typeof error.code === 'number' ? error.code : undefined,
        raw: error
      });

      return buildFailureResponse<T>(config, requestError);
    }
  };
}
