import {
  getCurrentRedirectUrl,
  redirectToLoginPage,
  requireLoginPage
} from '@/uni-module-common/auth';
import type { HttpAuthAdapter } from '@/uni-module-common/http/auth/auth-adapter';

/**
 * 统一解析鉴权链路要使用的回跳地址。
 * 请求层如果没有显式传参，就退回到当前页面地址，保证页面级和请求级跳登录协议一致。
 */
const resolveRedirectUrl = (redirectUrl = '') => {
  return redirectUrl || getCurrentRedirectUrl();
};

/**
 * 创建默认 HTTP 鉴权适配器。
 * 这里允许依赖当前项目的 user store 和 auth 公共层，但这些依赖不会再散落回 HTTP 核心文件。
 */
export const createHttpAuthAdapter = (): HttpAuthAdapter => ({
  isLoggedIn() {
    const { isLogin } = useStore('user');
    return Boolean(isLogin.value);
  },
  getToken() {
    const { token } = useStore('user');
    return typeof token.value === 'string' ? token.value.trim() : '';
  },
  requireLogin(redirectUrl = '') {
    const finalRedirectUrl = resolveRedirectUrl(redirectUrl);
    console.log('[鉴权适配器] 检测到受保护请求未登录，准备触发统一登录流程', {
      回跳地址: finalRedirectUrl
    });
    requireLoginPage(finalRedirectUrl);
  },
  clearLoginState() {
    const { clearLoginState } = useStore('user');
    console.log('[鉴权适配器] 准备清空当前登录态');
    clearLoginState();
  },
  async redirectToLogin(redirectUrl: string) {
    const finalRedirectUrl = resolveRedirectUrl(redirectUrl);
    console.log('[鉴权适配器] 准备跳转登录页', {
      回跳地址: finalRedirectUrl
    });
    await redirectToLoginPage(finalRedirectUrl);
  }
});

/**
 * 默认鉴权适配器单例。
 * 当前 HTTP 门面默认复用它；后续如果业务项目需要替换实现，可以在同一协议下继续扩展。
 */
export const httpAuthAdapter = createHttpAuthAdapter();
