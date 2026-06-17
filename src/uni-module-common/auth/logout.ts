import store from '@/uni-module-common/store';
import userStore from '@/uni-module-common/store/user';

/**
 * 退出登录请求函数。
 * 这里保留一个统一入口，后续业务项目只需要在这里替换成自己的后端接口即可。
 */
export type LogoutRequest = (payload?: Record<string, any>) => Promise<any>;

const defaultLogoutRequest: LogoutRequest = async () => {
  return true;
};

let logoutRequest: LogoutRequest = defaultLogoutRequest;

export const setLogoutRequest = (request: LogoutRequest) => {
  logoutRequest = request;
};

export const postLogoutAPI = (payload: Record<string, any> = {}) => {
  return logoutRequest(payload);
};

/**
 * 清理登录态。
 * 这里只处理前端需要的最小状态，并顺手清掉兼容期保留的登录缓存。
 */
export const clearLogoutState = () => {
  const userStateStore = userStore(store);

  userStateStore.clearLoginState();
  uni.removeStorageSync('requestCookies');
  uni.removeStorageSync('saveStateCookie');
  uni.removeStorageSync('isTempLogin');
};

/**
 * 统一退出登录能力。
 * - 先预留接口调用位置
 * - 最终统一清理本地最小登录态，确保前端表现一致
 */
export const logoutUser = async (payload: Record<string, any> = {}) => {
  try {
    await postLogoutAPI(payload);
  } catch (error) {
    console.warn('[鉴权] 退出登录请求执行失败，继续执行本地登录态清理', error);
  } finally {
    clearLogoutState();
  }
};
