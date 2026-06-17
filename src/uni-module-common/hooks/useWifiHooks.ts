/**
 * WiFi 相关功能 Hook
 * 用于获取 WiFi 信息（SSID和密码）
 */
import type { Ref } from 'vue';

export interface WifiInfo {
  SSID: string; // WiFi 名称
  password: string; // WiFi 密码（需要用户输入）
}

export interface UseWifiHooksReturn {
  wifiInfo: Ref<WifiInfo | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  getWifiInfo: () => Promise<WifiInfo | null>;
  setWifiPassword: (password: string) => void;
  reset: () => void;
}

/**
 * WiFi 功能 Hook
 * @returns WiFi 相关方法和状态
 */
export function useWifiHooks(): UseWifiHooksReturn {
  const wifiInfo = ref<WifiInfo | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 获取当前连接的 WiFi SSID
   * 注意：微信小程序无法直接获取 WiFi 密码，需要用户手动输入
   */
  const getWifiInfo = async (): Promise<WifiInfo | null> => {
    isLoading.value = true;
    error.value = null;

    try {
      // #ifdef MP-WEIXIN
      // 1. 先初始化 WiFi 模块
      await new Promise<void>((resolve, reject) => {
        uni.startWifi({
          success: () => {
            console.log('startWifi success');
            resolve();
          },
          fail: (err) => {
            console.log('startWifi fail', err);
            // startWifi 失败不一定是致命错误，可能已经初始化过了
            // 继续尝试获取WiFi信息
            resolve();
          }
        });
      });

      // 2. 获取当前连接的 WiFi 信息
      const res = await new Promise<UniApp.GetConnectedWifiRes>((resolve, reject) => {
        uni.getConnectedWifi({
          success: resolve,
          fail: reject
        });
      });

      console.log('getWifiInfo-res', res);

      if (res.wifi) {
        wifiInfo.value = {
          SSID: res.wifi.SSID || '',
          password: ''
        };
        return wifiInfo.value;
      } else {
        throw new Error('未获取到 WiFi 信息');
      }
      // #endif

      // #ifndef MP-WEIXIN
      // 非微信小程序环境，返回模拟数据或提示
      uni.showToast({
        title: '当前环境不支持获取 WiFi 信息',
        icon: 'none'
      });
      return null;
      // #endif
    } catch (err: any) {
      const errorMsg = err.errMsg || err.message || '获取 WiFi 信息失败';
      error.value = errorMsg;
      console.log('getWifiInfo-error', errorMsg);

      // 处理常见错误
      if (errorMsg.includes('getConnectedWifi:fail')) {
        if (errorMsg.includes('not connected')) {
          error.value = '当前未连接 WiFi，请先连接 WiFi 后重试';
        } else if (errorMsg.includes('system not support')) {
          error.value = '当前系统不支持获取 WiFi 信息';
        } else if (errorMsg.includes('not invoke startWifi')) {
          error.value = 'WiFi 模块初始化失败，请重试';
        } else {
          error.value = '获取 WiFi 信息失败，请检查网络连接';
        }
      }

      uni.showToast({
        title: error.value || '获取 WiFi 信息失败',
        icon: 'none',
        duration: 2000
      });

      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 设置 WiFi 密码（用户手动输入）
   */
  const setWifiPassword = (password: string) => {
    if (wifiInfo.value) {
      wifiInfo.value.password = password;
    }
  };

  /**
   * 重置状态
   */
  const reset = () => {
    wifiInfo.value = null;
    isLoading.value = false;
    error.value = null;

    // #ifdef MP-WEIXIN
    // 停止 WiFi 模块
    uni.stopWifi({
      success: () => {
        console.log('stopWifi success');
      },
      fail: (err) => {
        console.log('stopWifi fail', err);
      }
    });
    // #endif
  };

  return {
    wifiInfo,
    isLoading,
    error,
    getWifiInfo,
    setWifiPassword,
    reset
  };
}
