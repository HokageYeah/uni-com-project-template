import {
  natToUniASRResult,
  natToUniEditedImg,
  natToUniOnChoosedWxFile,
  natToUniSyncLoginInfo,
  uniToNatBridgeToUni,
  uniToNatLogin,
  uniToNatToPage
} from '@/uni-module-common/utils/uniToNavProtocol';
import type { EventBus } from '@/uni-module-common/utils/eventBus';
function sendNativeEvent(event: string, msg: string | Object) {
  return new Promise((resolve) => {
    // 向宿主App发送事件
    uni.sendNativeEvent(event, msg, (ret: any) => {
      // this.nativeMsg = `宿主App回传的数据：${ret}`;
      resolve(ret);
    });
  });
}

function receiveNativeEvent(eventName: string) {
  return new Promise((resolve) => {
    uni.onNativeEventReceive((event: string, data: any) => {
      console.log('receiveNativeEvent---event---', event, data, eventName);
      if (event === eventName) {
        console.log('receiveNativeEvent---eventName---', eventName);
        resolve(data);
      }
    });
  });
}
let eventBusAll: EventBus;
function receiveNewNativeEvent(eventBus: EventBus) {
  console.log('receiveNewNativeEvent---eventstart---');
  eventBusAll = eventBus;
  uni.onNativeEventReceive((event: string, data: any) => {
    console.log('receiveNewNativeEvent---event---', event, data);
    if (event === natToUniOnChoosedWxFile) {
      eventBus.emit(natToUniOnChoosedWxFile, data);
      // uni.$emit(natToUniOnChoosedWxFile, data);
      console.log('receiveNewNativeEvent---eventName---', data);
    } else if (event === natToUniSyncLoginInfo) {
      // uni.$emit(natToUniSyncLoginInfo, data);
      eventBus.emit(natToUniSyncLoginInfo, data);
    } else if (event === natToUniEditedImg) {
      // uni.$emit(natToUniEditedImg, data);
      eventBus.emit(natToUniEditedImg, data);
    } else if (event === natToUniASRResult) {
      // uni.$emit(natToUniEditedImg, data);
      eventBus.emit(natToUniASRResult, data);
    }
  });
}

function login(url: string) {
  sendNativeEvent(uniToNatLogin, url).then((res: any) => {
    console.log('app启动信息传递---referrerInfo---eventBusAll-', eventBusAll);
    console.log('app启动信息传递---referrerInfo---eventBusAll-all-', eventBusAll.emit);
    eventBusAll.emit('uniToNatLogin', res);
  });
}
// 跳转到原声页面公用方法（分iOS和安卓端）
function jumpNativePage(params: { androidParams: any; iosParams: any }) {
  // 只在新平台上
  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync();
  let objvalue: any = {};
  switch (systemInfo.platform) {
    case 'android':
      objvalue = params.androidParams;
      console.log('运行Android上');
      break;
    case 'ios':
      objvalue = params.iosParams;
      console.log('运行iOS上');
      break;
    default:
      console.log('运行在开发者工具上');
      break;
  }
  sendNativeEvent(uniToNatToPage, objvalue);
}

// 打开其他 wgt 包（跨模块跳转）
function openUnimp(params: {
  hostId: string; // 主机 ID
  appId: string; // 目标 wgt 包的 appId
  path?: string; // 可选：跳转路径
  params?: Record<string, any>; // 可选：传递参数
}) {
  // 构建 entrance 链接：unimp://hostId:appId 或 unimp://hostId:appId:path
  const pathSegment = params.path ? `:${params.path}` : '';
  const entrance = `unimp://${params.hostId}:${params.appId}${pathSegment}`;
  const data = {
    entrance,
    params: params.params || {}
  };
  console.log('打开 wgt 包，entrance:', entrance, 'params:', data);
  return sendNativeEvent(uniToNatBridgeToUni, data);
}

export default {
  sendNativeEvent,
  receiveNativeEvent,
  login,
  receiveNewNativeEvent,
  jumpNativePage,
  openUnimp
};
