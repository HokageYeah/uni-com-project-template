import type { RequestConfig } from '@/uni-module-common/http/types';

/**
 * `request<T>()` 与旧 ajax 门面之间的桥接标记。
 * 新入口通过这个标记告诉旧门面：
 * 如果请求失败，不要只返回裸 `false`，而是把结构化错误继续透传回来。
 */
export const REQUEST_API_MARKER = '__xxtUseNormalizedApiResponse';
export const REQUEST_API_ERROR_MARKER = '__xxtRequestApiError';

export interface LegacyResolvedErrorPayload {
  __xxtRequestApiError: true;
  message: string;
  statusCode?: number;
  code?: number;
  raw?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 给 `request<T>()` 发出的配置打标记。
 * 旧门面只在识别到这个标记时，才返回结构化失败结果，避免影响历史页面。
 */
export function markRequestConfig(config: RequestConfig) {
  (config as RequestConfig & Record<string, unknown>)[REQUEST_API_MARKER] = true;
}

/**
 * 判断旧门面是否已经把失败结果按结构化对象透传回来了。
 */
export function isLegacyResolvedErrorPayload(raw: unknown): raw is LegacyResolvedErrorPayload {
  return (
    isRecord(raw) &&
    raw[REQUEST_API_ERROR_MARKER] === true &&
    typeof raw.message === 'string' &&
    raw.message.trim().length > 0
  );
}
