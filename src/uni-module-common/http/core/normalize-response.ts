export interface NormalizedResponseMeta {
  /** 响应体是否为可读取字段的普通对象。 */
  isObject: boolean;
  /** 后端业务状态字段，旧接口通常用 status 表示业务状态。 */
  status?: number;
  /** 后端业务码字段，旧接口通常用 code 表示细分业务码。 */
  code?: number;
  /** 后端消息字段，兼容 message 与 msg 两种历史命名。 */
  message?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function pickNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

function pickMessage(responseData: Record<string, unknown>) {
  const message = responseData.message;
  if (typeof message === 'string') {
    return message;
  }

  const msg = responseData.msg;
  return typeof msg === 'string' ? msg : undefined;
}

/**
 * 提取响应元信息。
 * 本函数只做纯数据读取，不决定 toast、跳登录或 Promise 行为，避免 core 层耦合业务副作用。
 */
export function normalizeResponseMeta(responseData: unknown): NormalizedResponseMeta {
  if (!isRecord(responseData)) {
    return {
      isObject: false
    };
  }

  return {
    isObject: true,
    status: pickNumber(responseData.status),
    code: pickNumber(responseData.code),
    message: pickMessage(responseData)
  };
}
