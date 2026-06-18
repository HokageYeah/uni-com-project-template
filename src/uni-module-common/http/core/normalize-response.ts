export interface NormalizedResponseMeta {
  /** 响应体是否为可读取字段的普通对象。 */
  isObject: boolean;
  /** 后端业务状态字段，旧接口通常用 status 表示业务状态。 */
  status?: number;
  /** 后端业务码字段，旧接口通常用 code 表示细分业务码。 */
  code?: number;
  /** 后端消息字段，兼容 message 与 msg 两种历史命名。 */
  message?: string;
  /** 后端 ret 原始数组，兼容新版统一响应协议。 */
  ret?: string[];
  /** ret 中解析出的首个前缀类型，如 SUCCESS / ERROR。 */
  retType?: string;
  /** ret 中解析出的首条可展示文案，已移除 SUCCESS:: / ERROR:: 前缀。 */
  retMessage?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function pickNumber(value: unknown) {
  return typeof value === 'number' ? value : undefined;
}

function pickString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

/**
 * 兼容旧响应里的 message / msg 字段。
 * 注意：在当前工程里，这些字段只作为 ret 缺失时的兜底来源。
 */
function pickLegacyMessage(responseData: Record<string, unknown>) {
  const message = responseData.message;
  if (typeof message === 'string') {
    return message;
  }

  const msg = responseData.msg;
  return typeof msg === 'string' ? msg : undefined;
}

/**
 * 新版后端统一协议里，ret 是字符串数组：
 * - SUCCESS::登录成功
 * - ERROR::微信小程序配置缺失
 * 这里只做最小清洗，过滤掉空值，保持原数组顺序。
 */
function pickRet(responseData: Record<string, unknown>) {
  const ret = responseData.ret;
  if (!Array.isArray(ret)) {
    return undefined;
  }

  const normalizedRet = ret.filter(
    (item): item is string => typeof item === 'string' && item.trim()
  );
  return normalizedRet.length ? normalizedRet : undefined;
}

/**
 * 解析 ret 第一条记录，把协议前缀和用户可见文案拆开。
 * 例如：
 * - ERROR::微信小程序配置缺失 => { type: 'ERROR', message: '微信小程序配置缺失' }
 * - SUCCESS::登录成功 => { type: 'SUCCESS', message: '登录成功' }
 */
function parseRetEntry(entry?: string) {
  if (!entry) {
    return {
      type: undefined,
      message: undefined
    };
  }

  const matched = entry.match(/^([A-Z_]+)::([\s\S]+)$/);
  if (!matched) {
    return {
      type: undefined,
      message: pickString(entry)
    };
  }

  return {
    type: matched[1],
    message: pickString(matched[2])
  };
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

  // 新版后端统一响应优先从 ret 中提取业务结果和展示文案。
  const ret = pickRet(responseData);
  const firstRet = parseRetEntry(ret?.[0]);

  // 新版异常响应会把 HTTP 状态码放在 data.status_code 中，这里一并兼容。
  const nestedData =
    responseData.data !== null &&
    typeof responseData.data === 'object' &&
    !Array.isArray(responseData.data)
      ? (responseData.data as Record<string, unknown>)
      : undefined;

  return {
    isObject: true,
    // 旧协议优先读顶层 status；新版统一异常协议回退到 data.status_code。
    status: pickNumber(responseData.status) ?? pickNumber(nestedData?.status_code),
    code: pickNumber(responseData.code),
    // 文案优先级统一固定为：
    // 1. ret 第一条里 SUCCESS:: / ERROR:: 后面的真实业务文案
    // 2. 旧协议 message / msg
    // 这样不管成功还是失败，请求层、toast 层、页面层都会优先显示 ret 里的内容。
    message: firstRet.message ?? pickLegacyMessage(responseData),
    ret,
    retType: firstRet.type,
    retMessage: firstRet.message
  };
}
