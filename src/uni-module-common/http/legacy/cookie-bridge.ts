/**
 * 旧登录 Cookie 兼容桥。
 * 这里只服务历史 Cookie 登录、扫码登录和旧上传链路的过渡兼容，新项目不应新增依赖。
 * 等旧引用清零后，可以连同 `requestCookies` / `saveStateCookie` 整体删除。
 */
import { variableTypeDetection } from '@/uni-module-common/utils/verifyType';

/**
 * 旧登录链路关心的 Cookie 名单。
 * 只有这些凭证会被写入历史 Cookie Map，避免把无关响应头塞进主会话。
 */
export const needDealCookieNames: Record<string, boolean> = {
  JSESSIONID: true,
  XXT_ID: true,
  XXT_TICKET: true,
  _XSID_: true,
  _LOGIN_MA_: true,
  _SSID_: true,
  _XXT_ID: true,
  _WUID_: true,
  mat: true
};

interface LegacyCookieValue {
  value: string;
  expires: number;
}

type LegacyCookieMap = Record<string, LegacyCookieValue>;

/**
 * 解析响应中的单条 Cookie。
 * 桌面端微信返回的 Cookie 字符串前面可能带空格，因此这里统一做 trim，
 * 同时只按第一个 = 分割，避免值中再出现 = 时解析失败。
 */
export const parseCookieItem = (cookie: string) => {
  const cookieText = `${cookie || ''}`.trim();
  const firstEqualIndex = cookieText.indexOf('=');
  if (firstEqualIndex <= 0) {
    return {
      name: '',
      value: ''
    };
  }

  return {
    name: cookieText.slice(0, firstEqualIndex).trim(),
    value: cookieText.slice(firstEqualIndex + 1).trim()
  };
};

/**
 * 旧微信登录链路会把“保持登录”凭证单独缓存在 `saveStateCookie`。
 * 这里统一读取并合并到旧 Cookie Map 头信息里，避免兼容调用方自己重复拼接。
 */
const getLegacySaveStateCookie = () => {
  const jsonData = uni.getStorageSync('saveStateCookie');
  if (!jsonData) {
    return {};
  }

  try {
    return JSON.parse(jsonData) as Record<string, string>;
  } catch (error) {
    console.warn('[旧 Cookie 兼容桥] 解析 saveStateCookie 失败，将忽略该缓存', {
      错误信息: (error as Error)?.message || ''
    });
    return {};
  }
};

/**
 * 给旧上传和旧请求链路拼装 Cookie 请求头。
 * 这里只做历史 Cookie Map 兼容，不参与最小 token 会话模型。
 */
export function setWXLoginCookie(
  token: Record<string, LegacyCookieValue>,
  configHeader: Record<string, any>
) {
  const cachedData = getLegacySaveStateCookie();
  const cookies = {
    ...(token || {})
  } as Record<string, any>;

  if (cachedData && cachedData._SSO_STATE_TICKET) {
    cookies._SSO_STATE_TICKET = cachedData._SSO_STATE_TICKET;
    cookies._SSO_SAVE_STATE = cachedData._SSO_SAVE_STATE;
  }

  const header = configHeader || {};
  let headerCookieData = configHeader.Cookie || '';
  const nowMills = Date.now();

  Object.keys(cookies).forEach((key) => {
    const cookie = cookies[key];
    if (cookie?.value && (cookie.expires === -1 || cookie.expires > nowMills)) {
      headerCookieData += `${(headerCookieData.length > 0 ? '; ' : '') + key}=${cookie.value}`;
    }
  });

  if (headerCookieData) {
    header.Cookie = headerCookieData;
  }

  return header;
}

/**
 * 保存响应头中的旧登录 Cookie。
 * 当前仍会被扫码登录、登录兼容工具和旧上传链路消费，因此只能迁移位置，不能改行为。
 */
export function saveCookies(cookies: string[]) {
  if (!cookies || cookies.length === 0) {
    return;
  }

  console.info('[旧 Cookie 兼容桥] 收到响应凭证，准备更新旧登录过渡会话', {
    凭证数量: cookies.length
  });

  const { setToken } = useStore('user');
  const storageToken = uni.getStorageSync('token');
  const cookieMap: LegacyCookieMap = variableTypeDetection.isObject(storageToken)
    ? { ...storageToken }
    : {};
  let cookieChanged = false;

  cookies.forEach((cookie: string) => {
    const sections = cookie.split(';');
    if (sections.length <= 0) {
      return;
    }

    const { name, value } = parseCookieItem(sections[0]);
    if (!name || !needDealCookieNames[name]) {
      return;
    }

    if (value) {
      cookieMap[name] = {
        value,
        // Cookie 有效期 100 分钟（注：需要小于 120 分钟）
        expires: Date.now() + 6000000
      };
    } else {
      delete cookieMap[name];
    }

    cookieChanged = true;
  });

  if (!cookieChanged) {
    return;
  }

  console.info('[旧 Cookie 兼容桥] 旧登录过渡会话凭证已更新', {
    凭证数量: Object.keys(cookieMap).length
  });
  setToken(cookieMap);
}

/**
 * 将登录响应里的原始 Cookie 数组暂存到 `requestCookies`。
 * 这是旧登录保持态链路的过渡缓存，桥函数内部只记录凭证数量，不输出明文。
 */
export function saveResponseCookiesForLegacyLogin(cookies: unknown) {
  if (!Array.isArray(cookies) || cookies.length <= 0) {
    return;
  }

  console.info('[旧 Cookie 兼容桥] 记录登录响应凭证，供旧登录过渡链路继续消费', {
    凭证数量: cookies.length
  });
  uni.setStorageSync('requestCookies', cookies);
}
