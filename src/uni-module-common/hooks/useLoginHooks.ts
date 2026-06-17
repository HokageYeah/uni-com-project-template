import { redirectToLoginPage } from '@/uni-module-common/auth/redirect';
import { clearLogoutState } from '@/uni-module-common/auth/logout';

/**
 * 脚手架通用登录兼容桥。
 *
 * 这个文件只保留“清理本地登录态”和“跳转登录页”两类基础能力，
 * 不再内置任何具体项目的登录接口、用户资料协议或角色装配流程。
 * 真实业务登录成功后应在业务模块中调用 setLoginState() 写入登录态，
 * 请求级鉴权统一通过 http custom.auth === true 触发。
 */

/**
 * 清理脚手架登录相关本地状态。
 * 这里只移除登录凭证、最小用户信息和兼容期登录缓存，避免误删其它业务缓存。
 */
export function clearLoginStorageInfo() {
  console.info('[登录] 开始清理脚手架登录态');
  clearLogoutState();
  console.info('[登录] 脚手架登录态清理完成');
}

/**
 * 历史兼容别名。
 * 部分旧组件仍通过这个函数名触发“切换账号 / token 失效后清理登录态”，
 * 当前统一收口到脚手架最小登录态清理能力。
 */
export function dealLoginOutToken() {
  console.info('[登录] 兼容清理入口 dealLoginOutToken 被调用');
  clearLoginStorageInfo();
}

/**
 * 跳转统一登录页。
 * 调用方可以传入登录成功后的回跳地址；为空时由鉴权模块读取当前页面作为回跳。
 */
export function go2Login(url = '') {
  console.info('[登录] 准备跳转统一登录页', { 回跳地址: url || '当前页面' });
  return redirectToLoginPage(url);
}
