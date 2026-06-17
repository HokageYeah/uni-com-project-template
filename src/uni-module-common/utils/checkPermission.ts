import eventBus from '@/uni-module-common/utils/eventBus';

// #ifdef APP-PLUS
import permision from '@/uni-module-common/utils/permission';
import { uniToNatApplyPermission } from '@/uni-module-common/utils/uniToNavProtocol';
import bridge from '@/uni-module-common/utils/uniToNativeBridge';

export const checkPermission = async () => {
  let status = permision.isIOS
    ? await permision.requestIOS('record')
    : await permision.requestAndroid('android.permission.RECORD_AUDIO');
  if (status === null || status === 1) {
    status = 1;
  } else if (status === 2) {
    uni.showModal({
      content: '系统麦克风已关闭',
      confirmText: '确定',
      showCancel: false,
      success(_res) {}
    });
  } else {
    uni.showModal({
      content: '需要麦克风权限',
      confirmText: '设置',
      success(res) {
        if (res.confirm) {
          permision.gotoAppSetting();
        }
      }
    });
  }
  return status;
};

export const appCheckPermission = () => {
  return new Promise((resolve, reject) => {
    bridge
      .sendNativeEvent(uniToNatApplyPermission, {
        permission: 'android.permission.RECORD_AUDIO',
        content: '需要获取您的录音权限，才能录制语音消息和朗读诗词',
        permissionName: '录音',
        functionName: '无法使用录制语音消息和朗读诗词功能'
      })
      .then((res: any) => {
        switch (res.result) {
          case 'granted':
            resolve(1);
            break;
          default:
            resolve(2);
            break;
        }
        // uni.$emit('uniToNatLogin', '我是登录成功后的回调到音频权限');
        eventBus.emit('uniToNatLogin', '我是登录成功后的回调到音频权限');
      });
  });
};
// #endif

// #ifdef MP-WEIXIN
export const getWeixinPermission = () => {
  return new Promise<boolean>((resolve, reject) => {
    uni.authorize({
      scope: 'scope.record',
      success() {
        // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
        resolve(true);
      },
      fail(e) {
        console.log('getPermission----error---', e);
        // 打开授权页面
        uni.showModal({
          content: '麦克风权限未打开，是否去打开？',
          confirmText: '确认',
          cancelText: '取消',
          success(res) {
            console.log('getPermission----success---', res);
            if (res.confirm) {
              uni.openSetting({
                success(res) {
                  console.log(res.authSetting);
                  if (!res.authSetting['scope.record']) {
                    uni.showToast({
                      title: '麦克风权限打开失败，请重新授权',
                      icon: 'none',
                      duration: 2000
                    });
                    resolve(false);
                  } else {
                    resolve(true);
                  }
                },
                fail(e) {
                  console.log('getPermission----fail---', e);
                  uni.showToast({
                    title: `${e.errMsg},麦克风权限打开失败，请重新授权`,
                    icon: 'none',
                    duration: 2000
                  });
                  reject(e);
                }
              });
            }
          }
        });
      }
    });
  });
};
// #endif
