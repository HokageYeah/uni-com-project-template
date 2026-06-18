import { isAuthRedirectError } from '@/uni-module-common/auth';
import { normalizeResponseMeta } from '@/uni-module-common/http/core/normalize-response';
import {
  isLegacyResolvedErrorPayload,
  markRequestConfig
} from '@/uni-module-common/http/core/request-api-bridge';
import { getHttpFallbackErrorMessage } from '@/uni-module-common/http/core/response-feedback';
import { createRequestError } from '@/uni-module-common/http/core/request-error';
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

/**
 * 从请求异常对象中提取真正的后端响应体。
 * `uni-ajax` / `uni.request` 在失败分支里通常会把后端响应挂在 `error.data` 上，
 * 如果这里不先解包，后续就只能读到外层错误对象，拿不到 `ret: ["ERROR::..."]` 里的真实文案。
 */
function unwrapErrorPayload(error: unknown) {
  if (isRecord(error) && 'data' in error) {
    return error.data;
  }

  return error;
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

/**
 * 统一提取错误提示文案。
 * 优先级：
 * 1. normalizeResponseMeta 识别出的统一文案（已兼容 ret）
 * 2. 历史 message / msg / errorMsg
 * 3. 调用方传入的兜底文案
 */
function pickErrorMessage(raw: unknown, fallback: string) {
  const payload = unwrapErrorPayload(raw);
  const meta = normalizeResponseMeta(payload);
  if (meta.message) {
    console.info('[请求] 命中统一错误文案解析', {
      状态码: meta.status,
      业务码: meta.code,
      ret类型: meta.retType,
      错误文案: meta.message
    });
    return meta.message;
  }

  if (!isRecord(payload)) {
    return fallback;
  }

  const message = payload.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  const msg = payload.msg;
  if (typeof msg === 'string' && msg.trim()) {
    return msg;
  }

  const errorMsg = payload.errorMsg;
  if (typeof errorMsg === 'string' && errorMsg.trim()) {
    return errorMsg;
  }

  console.info('[请求] 未命中明确错误文案，使用兜底提示', {
    兜底文案: fallback
  });
  return fallback;
}

/**
 * 判断当前响应是否应视为“业务失败”。
 * 这里兼容三套历史/现有协议：
 * 1. 旧协议：error != 0
 * 2. 新统一协议：ret 第一条是 ERROR::
 * 3. 旧公共层约定：status >= 400
 */
function isBusinessFailure(raw: unknown) {
  if (!isRecord(raw)) {
    return false;
  }

  // 旧 ajax 为了兼容会把 error != 0 的响应 resolve；新入口必须重新收敛为失败结构。
  if ('error' in raw && raw.error !== 0 && raw.error !== null && raw.error !== undefined) {
    console.warn('[请求] 命中旧协议业务失败判断：error != 0');
    return true;
  }

  const meta = normalizeResponseMeta(raw);
  if (meta.retType === 'ERROR') {
    console.warn('[请求] 命中新版统一协议业务失败判断：retType=ERROR', {
      状态码: meta.status,
      错误文案: meta.retMessage
    });
    return true;
  }

  const isStatusFailure = meta.isObject && typeof meta.status === 'number' && meta.status >= 400;
  if (isStatusFailure) {
    console.warn('[请求] 命中状态码业务失败判断：status >= 400', {
      状态码: meta.status,
      业务码: meta.code
    });
  }

  return isStatusFailure;
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
      markRequestConfig(config);

      console.info('[请求] request<T> 开始请求', {
        接口地址: config.url,
        请求方法: config.method || 'GET'
      });

      const raw = await ajaxRunner(config);

      // 旧 ajax 在失败时如果识别到 request<T>() 标记，会返回一个结构化失败对象；
      // 新入口在这里优先把它还原成统一失败结构，确保页面能拿到后端真实错误文案。
      if (isLegacyResolvedErrorPayload(raw)) {
        console.warn('[请求] 收到旧门面透传的结构化失败结果', {
          接口地址: config.url,
          请求方法: config.method || 'GET',
          状态码: raw.statusCode,
          业务码: raw.code,
          错误文案: raw.message
        });

        const requestError = createRequestError({
          message: raw.message,
          statusCode: raw.statusCode,
          code: raw.code,
          raw: raw.raw
        });
        return buildFailureResponse<T>(config, requestError);
      }

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
      console.warn('[请求] request<T> 捕获到异常，准备进入统一失败结构', {
        接口地址: config.url,
        请求方法: config.method || 'GET'
      });

      if (isAuthRedirectError(error)) {
        const requestError = createRequestError({
          message: '请先登录',
          raw: error
        });
        return buildFailureResponse<T>(config, requestError);
      }

      const errorPayload = unwrapErrorPayload(error);
      const errorMeta = normalizeResponseMeta(errorPayload);
      const fallbackMessage = getHttpFallbackErrorMessage(error, false);
      const requestError = createRequestError({
        // 失败时优先使用后端 ret 里的 ERROR 文案；没有时再退回历史默认提示。
        message: pickErrorMessage(errorPayload, fallbackMessage || '请求失败'),
        statusCode:
          isRecord(error) && typeof error.statusCode === 'number'
            ? error.statusCode
            : errorMeta.status,
        code: isRecord(error) && typeof error.code === 'number' ? error.code : errorMeta.code,
        raw: errorPayload
      });

      return buildFailureResponse<T>(config, requestError);
    }
  };
}
