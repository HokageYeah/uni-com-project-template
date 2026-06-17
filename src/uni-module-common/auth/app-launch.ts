export interface LaunchParams {
  from: string;
  taskSubType: number;
  [key: string]: any;
}

export interface NativeLaunchPayload {
  cookieStr: string;
  userAgent: string;
  clientInfo: Record<string, any>;
  userInfo: Record<string, any>;
  launchParams: LaunchParams;
}

export const LOGIN_ENTRY_POINTS = [
  'src/uni_modules/uni-module-public/login/login.vue',
  'src/uni-module-common/store/user.ts',
  'src/uni-module-common/http/index.ts'
];

const DEFAULT_LAUNCH_PARAMS: LaunchParams = {
  from: '',
  taskSubType: -1
};

const DEFAULT_USER_AGENT = 'android-jxq;hostId:1;appversion:7.0.2;appversioncode:702';

/**
 * 统一解析原生启动透传的 params。
 * 这里只做纯数据收口，便于 `App.vue`、原生 bridge 和契约测试共享同一套协议。
 */
export const parseLaunchParams = (params: unknown): LaunchParams => {
  if (!params) {
    return { ...DEFAULT_LAUNCH_PARAMS };
  }

  if (typeof params === 'string') {
    try {
      return {
        ...DEFAULT_LAUNCH_PARAMS,
        ...JSON.parse(params)
      };
    } catch (error) {
      console.warn('[启动] 解析原生透传 params 失败，已回退默认值', error);
      return { ...DEFAULT_LAUNCH_PARAMS };
    }
  }

  if (typeof params === 'object') {
    return {
      ...DEFAULT_LAUNCH_PARAMS,
      ...(params as Record<string, any>)
    };
  }

  return { ...DEFAULT_LAUNCH_PARAMS };
};

/**
 * 统一解析原生登录透传数据。
 * 说明：
 * - 旧 `loginGetInfo.ts` 里的登录桥接逻辑已经迁移到认证层
 * - 后续业务如果要接 App 原生登录，只需要从这里接入自己的凭证格式即可
 */
export const resolveNativeLaunchPayload = (options: any): NativeLaunchPayload => {
  const referrerInfo = options?.referrerInfo?.extraData || {};

  return {
    cookieStr: `${referrerInfo.cookieStr || ''}`,
    userAgent: referrerInfo.userAgent || DEFAULT_USER_AGENT,
    clientInfo: referrerInfo.clientInfo || {},
    userInfo: referrerInfo.userInfo || {},
    launchParams: parseLaunchParams(referrerInfo.params)
  };
};

export const buildNativeLaunchLoginPayloadSummary = (options: any) => {
  const payload = resolveNativeLaunchPayload(options);

  return {
    hasCookieStr: payload.cookieStr.length > 0,
    hasUserInfo: Object.keys(payload.userInfo || {}).length > 0,
    userAgent: payload.userAgent,
    clientInfoKeys: Object.keys(payload.clientInfo || {}),
    launchParams: payload.launchParams
  };
};
