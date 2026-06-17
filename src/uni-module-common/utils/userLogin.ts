/**
 * 旧业务遗留登录工具。
 * 模板真实登录接入点已迁移到：
 * - `src/uni_modules/uni-module-public/login/login.vue`
 * - `src/uni-module-common/store/user.ts`
 * - `src/uni-module-common/http/index.ts`
 */
import { loginInfoDealGradeTerm, loginInfoDealSingUserInfo } from './login-info';
import { initReadAPPData } from './loginGetInfo';

/**
 * 保持登录凭证 Cookie 保存
 * @param {*} res
 */
const { resetUserData } = useStore('user');
export const dealLoginSuccessResponse = (res) => {
  const app = getApp();
  console.log(app.globalData);
  console.log(res);
  const saveCookie = {
    _SSO_STATE_TICKET: null,
    _SSO_SAVE_STATE: null
  };
  console.log('登录信息保存');
  console.log(res.cookies);
  res.cookies.forEach((cookie) => {
    const cookieText = `${cookie || ''}`.trim();
    if (cookieText.startsWith('_SSO_STATE_TICKET=') || cookieText.startsWith('_SSO_SAVE_STATE=')) {
      // 全局设置并持久保存 - 保持登录凭证 Cookie
      const sections = cookieText.split(';');
      if (sections.length > 0) {
        const firstEqualIndex = sections[0].indexOf('=');
        if (firstEqualIndex > 0) {
          const cookieName = sections[0].slice(0, firstEqualIndex).trim();
          const cookieValue = sections[0].slice(firstEqualIndex + 1).trim();
          const cookieDataState = {
            value: cookieValue,
            expires: new Date().getTime() + 10080 * 60 * 1000
          };
          saveCookie[cookieName] = cookieDataState;
        }
      }
    }
  });
  // dd
  initReadAPPData(res.cookies.join(';'), res.data.userInfo);
  app.globalData!.saveStateCookie = saveCookie;
  uni.setStorageSync('saveStateCookie', JSON.stringify(saveCookie));
  const data = res.data;

  // 处理全局变量
  app.globalData!.loginFlag = true;
  app.globalData!.userNowRoleInfo = loginInfoDealSingUserInfo(
    data.userInfo,
    data.userInfo.xinzxAccountId
  );
  app.globalData!.deafultGradeTerm = loginInfoDealGradeTerm(app.globalData!);
  uni.setStorageSync('userInfo', JSON.stringify(app.globalData!.userNowRoleInfo));
  uni.setStorageSync(
    'userOtherInfo',
    JSON.stringify({
      loginFlag: true
    })
  );
};
export const dealLoginOutToken = () => {
  resetUserData();
};
