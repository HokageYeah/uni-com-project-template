import store from '@/uni-module-common/store';
import userStore from '@/uni-module-common/store/user';

/**
 * 登录页固定路径。
 * 后续页面级登录拦截、请求级登录拦截都统一跳到这里，
 * 这样接入真实登录流程时，只需要维护一个入口。
 */
export const LOGIN_PAGE_PATH = '/uni_modules/uni-module-public/login/login';

/**
 * 统一的鉴权中断错误码。
 * 请求层在“未登录直接阻断”时会抛出这个错误，避免后续又被当成普通网络异常重复提示。
 */
export const AUTH_REDIRECT_ERROR_CODE = 'AUTH_REDIRECT_REQUIRED';

const DEFAULT_REDIRECT_URL = '/pages/index/index';

/**
 * 登录跳转中的并发锁。
 * 多个受保护请求同时命中未登录时，只允许首个请求发起跳转，避免连续压栈多个登录页。
 */
let redirectingToLogin = false;

const normalizePagePath = (url = '') => {
  if (!url) {
    return '';
  }

  return url.startsWith('/') ? url : `/${url}`;
};

/**
 * 从当前页面栈中读取“当前页 + query”的完整回跳地址。
 * 这里不再依赖旧授权页的专用判断，而是把当前访问位置直接收口成统一回跳协议。
 */
const getCurrentPageFullPath = () => {
  try {
    const pages = getCurrentPages();
    if (!Array.isArray(pages) || pages.length === 0) {
      return '';
    }

    const currentPage: any = pages[pages.length - 1];
    const route = currentPage?.$page?.fullPath || currentPage?.route || '';
    if (!route) {
      return '';
    }

    if (route.includes('?')) {
      return normalizePagePath(route);
    }

    const options = currentPage?.options || {};
    const queryString = Object.keys(options)
      .map((key) => `${key}=${encodeURIComponent(options[key])}`)
      .join('&');

    return normalizePagePath(queryString ? `${route}?${queryString}` : route);
  } catch (error) {
    console.warn('[鉴权] 读取当前页面回跳地址失败，将回退到默认首页', error);
    return '';
  }
};

/**
 * 获取当前应该记录的回跳地址。
 * 请求级与页面级登录跳转都走这里，保证回跳协议一致。
 */
export const getCurrentRedirectUrl = (fallbackUrl = DEFAULT_REDIRECT_URL) => {
  const currentPageUrl = getCurrentPageFullPath();
  const normalizedFallbackUrl = normalizePagePath(fallbackUrl) || DEFAULT_REDIRECT_URL;
  const redirectUrl = currentPageUrl || normalizedFallbackUrl;

  console.log('[鉴权] 生成当前回跳地址', redirectUrl);
  return redirectUrl;
};

/**
 * 统一解析最终回跳地址。
 * 如果调用方已经显式传入回跳页，就优先尊重调用方；否则再退回当前页。
 */
const resolveRedirectUrl = (redirectUrl = '', fallbackUrl = DEFAULT_REDIRECT_URL) => {
  const normalizedRedirectUrl = normalizePagePath(redirectUrl);
  if (normalizedRedirectUrl) {
    return normalizedRedirectUrl;
  }

  return getCurrentRedirectUrl(fallbackUrl);
};

/**
 * 拼接登录页地址。
 * 继续沿用 `redictUrl` 参数，避免后续页面路由协议被反复修改。
 */
export const buildLoginPageUrl = (redirectUrl = '') => {
  const finalRedirectUrl = resolveRedirectUrl(redirectUrl);
  const loginPageUrl = `${LOGIN_PAGE_PATH}?redictUrl=${encodeURIComponent(finalRedirectUrl)}`;

  console.log('[鉴权] 生成登录页跳转地址', loginPageUrl);
  return loginPageUrl;
};

/**
 * 判断某个地址是不是登录页。
 * 用于避免已经在登录页时再次重复跳转。
 */
export const isLoginPage = (url = '') => {
  return normalizePagePath(url).includes(LOGIN_PAGE_PATH);
};

/**
 * 判断当前页面是否已经是登录页。
 */
const isCurrentLoginPage = () => {
  const currentPageUrl = getCurrentPageFullPath();
  return isLoginPage(currentPageUrl);
};

/**
 * 构造统一的鉴权中断错误对象。
 */
export const createAuthRedirectError = (message = '当前请求需要登录') => {
  const authError = new Error(message) as Error & {
    code: string;
    isAuthRedirect: boolean;
  };

  authError.code = AUTH_REDIRECT_ERROR_CODE;
  authError.isAuthRedirect = true;
  return authError;
};

/**
 * 判断错误是否是“为了跳登录而主动中断请求”。
 */
export const isAuthRedirectError = (error: any) => {
  return (
    error?.code === AUTH_REDIRECT_ERROR_CODE ||
    error?.isAuthRedirect === true ||
    error?.message === AUTH_REDIRECT_ERROR_CODE
  );
};

/**
 * 统一跳转到登录页。
 * 这里会顺手把回跳地址写入 user store，并通过并发锁避免重复跳转。
 */
export const redirectToLoginPage = (redirectUrl = '') => {
  const finalRedirectUrl = resolveRedirectUrl(redirectUrl, DEFAULT_REDIRECT_URL);
  const userStateStore = userStore(store);

  userStateStore.setLoginRedirectUrl(finalRedirectUrl);

  if (redirectingToLogin) {
    console.log('[鉴权] 登录跳转已在进行中，忽略重复跳转');
    return Promise.resolve(false);
  }

  if (isCurrentLoginPage()) {
    console.log('[鉴权] 当前已经在登录页，忽略重复跳转');
    return Promise.resolve(false);
  }

  const loginPageUrl = buildLoginPageUrl(finalRedirectUrl);
  redirectingToLogin = true;

  console.log('[鉴权] 准备统一跳转登录页', {
    登录页地址: loginPageUrl,
    回跳地址: finalRedirectUrl
  });

  return new Promise<boolean>((resolve) => {
    uni.navigateTo({
      url: loginPageUrl,
      success: () => resolve(true),
      fail: (error) => {
        console.warn('[鉴权] 跳转登录页失败', error);
        resolve(false);
      },
      complete: () => {
        setTimeout(() => {
          redirectingToLogin = false;
        }, 300);
      }
    });
  });
};

/**
 * 对外暴露统一的“需要登录”入口。
 * 页面层和请求层只需要调用它，不再各自维护跳登录协议。
 */
export const requireLoginPage = (redirectUrl = '') => {
  const finalRedirectUrl = resolveRedirectUrl(redirectUrl, DEFAULT_REDIRECT_URL);
  const userStateStore = userStore(store);
  const needLogin = userStateStore.requireLogin(finalRedirectUrl);

  if (needLogin) {
    void redirectToLoginPage(finalRedirectUrl);
  }

  return needLogin;
};
