import pagesJson from '@/pages.json';

/**
 * 脚手架登录页最小用户信息。
 * 这里故意在 helper 内自包含声明，避免独立契约校验被整个 store 类型环境耦合。
 */
export interface ScaffoldLoginUser {
  id: string | number;
  nickname: string;
  avatar: string;
  mobile?: string;
}

/**
 * 脚手架登录页写入的最小登录态参数。
 * 与 user store 的 `setLoginState` 入参协议保持一致，但不直接依赖 store 文件。
 */
export interface ScaffoldLoginStatePayload {
  token?: string;
  userInfo?: ScaffoldLoginUser | null;
}

/**
 * 脚手架登录页默认回跳地址。
 * 当外部没有显式传入 `redictUrl` 时，统一回到工程首页。
 */
export const DEFAULT_LOGIN_REDIRECT_URL = '/pages/index/index';

const normalizeScaffoldPagePath = (url = '') => {
  if (!url) {
    return '';
  }

  const routePath = url.split('?')[0] || '';
  return routePath.startsWith('/') ? routePath : `/${routePath}`;
};

const TAB_BAR_PAGE_PATH_SET = new Set(
  (pagesJson.tabBar?.list || []).map((item: { pagePath: string }) => {
    return normalizeScaffoldPagePath(item.pagePath);
  })
);

/**
 * 判断登录回跳地址是否为小程序 tabBar 页面。
 * 微信小程序不允许使用 redirectTo 跳转 tabBar 页面，需要提前切到 switchTab。
 */
export const isScaffoldTabBarRedirectUrl = (redirectUrl = '') => {
  return TAB_BAR_PAGE_PATH_SET.has(normalizeScaffoldPagePath(redirectUrl));
};

/**
 * 提取用于 switchTab 的纯页面路径。
 * switchTab 不承接 query，因此 tabBar 回跳只保留页面路径。
 */
export const getScaffoldRedirectPath = normalizeScaffoldPagePath;

/**
 * 脚手架占位登录页使用的示例用户。
 * 真实业务项目后续只需要替换这一套最小用户写入逻辑即可。
 */
export const SCAFFOLD_LOGIN_USER: ScaffoldLoginUser = {
  id: 'scaffold-user-001',
  nickname: '默认用户',
  avatar: '',
  mobile: ''
};

/**
 * 安全解析外部传入的回跳地址。
 * `redictUrl` 来自路由参数，可能出现不完整的 URI 编码，不能让异常冒泡导致登录页白屏。
 */
const safelyDecodeRedirectUrl = (redirectUrl = '') => {
  if (!redirectUrl) {
    return '';
  }

  try {
    return decodeURIComponent(redirectUrl);
  } catch (error) {
    console.warn('[脚手架登录页] 回跳地址解码失败，已回退到默认地址', {
      错误信息: (error as Error)?.message || ''
    });
    return '';
  }
};

/**
 * 解析登录页收到的回跳地址。
 * - 优先使用路由参数 `redictUrl`
 * - 没传或解码失败时退回到 store 中记录的回跳地址
 * - 再没有则退回工程首页
 */
export const resolveScaffoldLoginRedirectUrl = (
  routeRedirectUrl = '',
  storedRedirectUrl = DEFAULT_LOGIN_REDIRECT_URL
) => {
  const decodedRouteRedirectUrl = safelyDecodeRedirectUrl(routeRedirectUrl);
  return decodedRouteRedirectUrl || storedRedirectUrl || DEFAULT_LOGIN_REDIRECT_URL;
};

/**
 * 根据真实登录结果构建最小登录态。
 * 脚手架不提供固定 token，避免生产包里出现可绕过鉴权的假登录入口。
 */
export const buildScaffoldLoginStatePayload = (
  token: string,
  userInfo: ScaffoldLoginUser | null = null
): ScaffoldLoginStatePayload => {
  return {
    token,
    userInfo
  };
};
