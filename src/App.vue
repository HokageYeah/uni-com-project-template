<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app';
import {
  consumeNativeLaunchPayload,
  syncAppEntryToGlobal
} from './uni-module-common/auth/app-launch-runtime';
import { uniToNatLifeCycle } from '@/uni-module-common/utils/uniToNavProtocol';
import bridge from '@/uni-module-common/utils/uniToNativeBridge';
import { appModuleConfig } from '@/uni-module-common/config';
import routerInterceptor from '@/wxmp-global-config/router-Interceptor';
const { setToken, setClientInfo, setUserAgent } = useStore('user');
let isAppLogin = false;
const instance = getCurrentInstance();
const eventBus = instance!.appContext.config.globalProperties.$eventBus;

const applyNativeLaunchLogin = (options: any, source = 'app-on-show') => {
  consumeNativeLaunchPayload(
    options,
    {
      setToken,
      setUserAgent,
      setClientInfo
    },
    source
  );
};

// 当 uni-app 初始化完成时触发（全局只触发一次），参数为应用启动参数，同 uni.getLaunchOptionsSync 的返回值
onLaunch((_options) => {
  // 默认使用自定义 TabBar。
  // uni.hideTabBar();
  // #ifdef MP-WEIXIN
  // 微信端补一份最小运行时标识，便于后续真实业务接入时继续复用。
  const userAgent4Dev = `${appModuleConfig.entry};hostId:${appModuleConfig.hostId};appversion:1.0.0;appversioncode:100`;
  const clientInfo4Dev = {
    cv: '',
    chv: '',
    ch: '',
    jv: ''
  };
  setUserAgent(userAgent4Dev);
  setClientInfo(clientInfo4Dev);
  // #endif
  // #ifdef APP-PLUS || APP
  eventBus.on('uniToNatLogin', (payload: any) => {
    console.log('uniToNatLogin----eventbus---');
    isAppLogin = true;
    payload && applyNativeLaunchLogin({ referrerInfo: { extraData: payload } }, 'app-bridge-login');
  });
  // 添加监听 app端主动通信的协议
  bridge.receiveNewNativeEvent(eventBus);
  bridge.sendNativeEvent(uniToNatLifeCycle, {
    lifeCycle: 'onLaunch'
  });
  // #endif
  // 在你的 main.js 文件或入口文件中添加以下代码
  // 下面代码是进行路由拦截的，可以在这里对路由进行拦截，统一添加子模块前缀
  routerInterceptor();
  syncAppEntryToGlobal(appModuleConfig.entry);
});

// 当 uni-app 启动，或从后台进入前台显示时触发，参数为应用启动参数，同 uni.getLaunchOptionsSync 的返回值
onShow((_options) => {
  try {
    isAppLogin || applyNativeLaunchLogin(_options, 'app-on-show');
  } catch (e) {
    console.error('onShow声明周期报错----', e);
  }
  // 这个地方先去掉， 解决：从通知模块去登录，登录成功后在选择图片后返回app，依旧显示未登录的问题。
  // 下次进入onshow的时候initAPPData 不让它在执行，因为app传入的_options为空
  // isAppLogin = false;
  // #ifdef APP-PLUS
  uni.onNativeEventReceive((event: string, data: any) => {
    uni.$emit(event, data);
  });
  bridge.sendNativeEvent(uniToNatLifeCycle, {
    lifeCycle: 'onShow'
  });
  // #endif
});

// 当 uni-app 从前台进入后台时触发
onHide(() => {
  // #ifdef APP-PLUS
  bridge.sendNativeEvent(uniToNatLifeCycle, {
    lifeCycle: 'onHide'
  });
  // #endif
});
</script>

<!-- 必须配置，配置一些全局的信息 登录所用的entry需要从这个里面获取 -->
<script lang="ts">
export default {
  // 每个app或者小程序内独有的配置
  globalData: {
    // entry: 'wxmp_szjx',
    // // 微信小程序账号的原始ID
    // WXMPOriginalID: 'gh_9a830fd9843f',
    // // 公共分包模块的配置路径
    // publicSubPackgePath: '/uni_modules/uni-module-public'
  }
};
</script>

<style lang="scss">
/* #ifndef MP-WEIXIN */
@import url('@/style/thorui-extend.css');
@import url('@/static/css/xxt-fonts/iconfont.css');
/* #endif */
/* #ifdef MP-WEIXIN */
@import url('@/style/thorui-extend.wxss');
@import url('@/static/css/xxt-fonts/iconfont.wxss');
/* #endif */
/* @import './static/css/xxt-fonts/iconfont.css'; */
/* @import './static/style/thorui-extend.css'; */
</style>
