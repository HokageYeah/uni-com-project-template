import ajax from '@/uni-module-common/http';

/**
 * 多平台小程序登录授权
 * 支持：微信、抖音、快手
 */

interface LoginResult {
  openid: string;
  code?: string;
  [key: string]: any;
}

// 平台类型
export type PlatformType = 'weixin' | 'toutiao' | 'kuaishou' | 'xhs';

// 平台配置
const platformConfig: Record<PlatformType, { provider: string; name: string }> = {
  weixin: { provider: 'weixin', name: '微信' },
  toutiao: { provider: 'toutiao', name: '抖音' },
  kuaishou: { provider: 'kuaishou', name: '快手' },
  xhs: { provider: 'xhs', name: '小红书' }
};

/**
 * 获取当前平台类型
 */
export const getCurrentPlatform = (): PlatformType => {
  // #ifdef MP-WEIXIN
  return 'weixin';
  // #endif

  // #ifdef MP-TOUTIAO
  return 'toutiao';
  // #endif

  // #ifdef MP-KUAISHOU
  return 'kuaishou';
  // #endif

  // #ifdef MP-XHS
  return 'xhs';
  // #endif

  // 默认返回微信
  return 'weixin';
};

/**
 * 获取当前平台名称
 */
export const getCurrentPlatformName = (): string => {
  const platform = getCurrentPlatform();
  return platformConfig[platform].name;
};

/**
 * 判断是否支持当前平台登录
 */
export const isPlatformSupported = (): boolean => {
  // #ifdef MP-WEIXIN || MP-TOUTIAO || MP-KUAISHOU
  return true;
  // #endif

  // #ifndef MP-WEIXIN && !MP-TOUTIAO && !MP-KUAISHOU
  return false;
  // #endif
};

/**
 * 小程序登录授权
 * @param url 后端接口地址
 * @param method 请求方法
 * @param entry 入口标识
 * @param platform 平台类型（可选，默认自动识别当前平台）
 */
export const miniProgramLogin = (
  url: string,
  method: any,
  entry: string,
  platform?: PlatformType
): Promise<LoginResult> => {
  // 如果未指定平台，自动识别当前平台
  const currentPlatform = platform || getCurrentPlatform();
  const config = platformConfig[currentPlatform];

  return new Promise((resolve, reject) => {
    uni.login({
      provider: config.provider as any,
      timeout: 10000,
      success: async (res) => {
        console.log(`${config.name}登录成功:`, res);
        try {
          // 统一组装请求参数
          const requestData: Record<string, any> = {
            code: res.code,
            entry
          };

          // type 微信默认是1，抖音（头条系）登录需要携带 anonymousCode，小红书登录需要携带 anonymousCode

          // 抖音（头条系）登录需要携带 anonymousCode
          if (currentPlatform === 'toutiao' && (res as any).anonymousCode) {
            requestData.anonymousCode = (res as any).anonymousCode;
            requestData.type = 2; // 2: 抖音（头条系）登录
          }
          // 小红书
          if (currentPlatform === 'xhs' && (res as any).anonymousCode) {
            requestData.type = 3; // 3: 小红书登录
          }

          const result: any = await ajax({
            url,
            method,
            data: requestData
          });
          resolve({ ...result, code: res.code });
        } catch (error) {
          reject(error);
        }
      },
      fail: (err) => {
        console.log(`${config.name}登录失败:`, err);
        reject(err);
      }
    });
  });
};

/**
 * 微信登录授权（兼容旧接口）
 */
export const wxAuthorizLogin = {
  wxGetUserInfo: (
    desc: string,
    successCallback?: (res: any) => void,
    failCallback?: (err: any) => void
  ) => {
    uni.showModal({
      title: '提醒',
      content: '请授权您的昵称、头像',
      success: (res) => {
        if (res.confirm) {
          console.log('用户点击确定');
          return new Promise((resolve, reject) => {
            uni.getUserProfile({
              desc,
              success: (res) => {
                console.log('wxGetUserInfo-success-', res);
                resolve(res);
                successCallback && successCallback(res);
              },
              fail: (err) => {
                console.log('wxGetUserInfo-fail-', err);
                reject(err);
                failCallback && failCallback(err);
              }
            });
          });
        }
      },
      fail(e) {
        console.log(e);
        uni.showToast({
          title: '请授权用户头像',
          icon: 'none'
        });
        failCallback && failCallback(e);
      }
    });
  },

  wxLogin: (url: string, method: any, entry: string) => {
    return miniProgramLogin(url, method, entry, 'weixin');
  },

  wxCheckSession: () => {
    return new Promise((resolve, reject) => {
      uni.checkSession({
        success: (res) => {
          console.log('wxCheckSession-success-', res);
          resolve(res);
        },
        fail: (err) => {
          console.log('wxCheckSession-fail-', err);
          reject(err);
        }
      });
    });
  }
};
