import { buildNativeLaunchLoginPayloadSummary, resolveNativeLaunchPayload } from './app-launch';

interface LaunchRuntimeHandlers {
  setClientInfo?: (clientInfo: Record<string, any>) => void;
  setToken?: (token: string, userInfo: Record<string, any>) => void;
  setUserAgent?: (userAgent: string) => void;
}

/**
 * 将 entry 写回到 app globalData，兼容仍从 `getApp().globalData.entry` 读取的历史模块。
 * 主链路本身不再依赖旧 `global.ts`。
 */
export const syncAppEntryToGlobal = (entry: string) => {
  const app = typeof getApp === 'function' ? getApp() : undefined;

  if (!app) {
    console.warn('[启动] 当前阶段无法获取 app 实例，已跳过 entry 写入 globalData', {
      entry
    });
    return;
  }

  app.globalData = {
    ...(app.globalData || {}),
    entry
  };
};

/**
 * 将启动参数写回 app globalData，兼容仍从 `H5ToUniParams` 读取的历史模块。
 */
export const syncLaunchParamsToGlobal = (launchParams: Record<string, any>) => {
  uni.$emit('h5PushToUni', launchParams);
  const app = typeof getApp === 'function' ? getApp() : undefined;

  if (!app) {
    console.warn('[启动] 当前阶段无法获取 app 实例，已跳过启动参数写入 globalData', {
      launchParams
    });
    return;
  }

  app.globalData = {
    ...(app.globalData || {}),
    H5ToUniParams: launchParams
  };
};

/**
 * 启动阶段日志只打印摘要，避免把 cookieStr、用户资料原样打到控制台里。
 */
export const logNativeLaunchSummary = (options: any, source = 'native-launch') => {
  const summary = buildNativeLaunchLoginPayloadSummary(options);
  console.log('[启动] 收到原生登录摘要', {
    source,
    hasCookieStr: summary.hasCookieStr,
    hasUserInfo: summary.hasUserInfo,
    userAgent: summary.userAgent,
    clientInfoKeys: summary.clientInfoKeys,
    launchParams: summary.launchParams
  });
  return summary;
};

/**
 * 统一消费原生启动透传的登录信息。
 * 运行时只通过回调和外部协作，不再直接依赖 store，从而降低公共工具层的耦合。
 */
export const consumeNativeLaunchPayload = (
  options: any,
  handlers: LaunchRuntimeHandlers = {},
  source = 'native-launch'
) => {
  const payload = resolveNativeLaunchPayload(options);
  logNativeLaunchSummary(options, source);

  if (payload.launchParams.from || payload.launchParams.taskSubType !== -1) {
    syncLaunchParamsToGlobal(payload.launchParams);
  }

  if (payload.cookieStr) {
    handlers.setUserAgent?.(payload.userAgent);
    handlers.setClientInfo?.(payload.clientInfo);
    handlers.setToken?.(payload.cookieStr, payload.userInfo);
  }

  return payload;
};

/**
 * 阅读器等旧容器还会直接透传 cookieStr + userInfo。
 * 保留一个最小兼容入口，避免主链路再次引用旧登录工具文件。
 */
export const consumeReadAppLogin = (
  cookieStr: string,
  userInfo: any,
  handlers: LaunchRuntimeHandlers = {}
) => {
  if (!cookieStr) {
    return;
  }

  const defaultUserAgent = 'weixin-read;hostId:101;appversion:1.0.0;appversioncode:100';
  handlers.setUserAgent?.(defaultUserAgent);
  handlers.setToken?.(cookieStr, { ...userInfo, phaseCode: 211 });
};
