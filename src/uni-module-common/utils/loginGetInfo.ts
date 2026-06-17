import {
  consumeNativeLaunchPayload,
  consumeReadAppLogin
} from '@/uni-module-common/auth/app-launch-runtime';

/**
 * 旧业务遗留文件，主链路默认不再直接引用。
 * 当前仅保留为历史兼容入口，并统一转发到启动辅助模块。
 */
const initAPPData = (_options: any) => {
  const { setToken, setUserAgent, setClientInfo } = useStore('user');
  consumeNativeLaunchPayload(
    _options,
    {
      setToken,
      setUserAgent,
      setClientInfo
    },
    'legacy-login-get-info'
  );
};

/**
 * 旧业务遗留兼容入口。
 * 当前登录接入点已迁移到：
 * - `src/uni_modules/uni-module-public/login/login.vue`
 * - `src/uni-module-common/store/user.ts`
 * - `src/uni-module-common/http/index.ts`
 */
const initReadAPPData = (cookieStr: string, userInfo: any) => {
  const { setToken, setUserAgent } = useStore('user');
  consumeReadAppLogin(cookieStr, userInfo, {
    setToken,
    setUserAgent
  });
};

export { initAPPData, initReadAPPData };
