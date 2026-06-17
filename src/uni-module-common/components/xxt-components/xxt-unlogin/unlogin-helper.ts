/**
 * 模板未登录占位组件的默认回跳地址。
 * 当页面没有传 `url` / `loginUrl` 时，统一回到模板首页。
 */
export const DEFAULT_UNLOGIN_REDIRECT_URL = '/pages/index/index';

/**
 * 统一解析未登录组件的目标回跳地址。
 * 规则：
 * - 优先使用组件显式传入的 `url`
 * - 其次使用外层容器传入的 `loginUrl`
 * - 都没有时回到模板首页
 */
export const resolveUnloginRedirectUrl = (url = '', loginUrl = '') => {
  return url || loginUrl || DEFAULT_UNLOGIN_REDIRECT_URL;
};
