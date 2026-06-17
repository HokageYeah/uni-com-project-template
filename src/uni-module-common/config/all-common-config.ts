// import { WxAppConfig } from '@/uni-module-common/config/';
// const { loginConfigKey } = WxAppConfig;
// console.log('WxAppConfig----', WxAppConfig.loginConfigKey);
// const appCommonConfigFun = async () => {
//   const funTest = await import(`./${loginConfigKey}-config.ts`);
//   return funTest;
// };
// let appCommonConfig;
// // #ifdef H5
// appCommonConfig = await import(`./${loginConfigKey}-config.ts`);
// // #endif
// // #ifndef H5
// appCommonConfig = require(`./${loginConfigKey}-config.js`);
// appCommonConfig = appCommonConfigFun();
// // #endif
// console.log('appCommonConfig----', appCommonConfig);
// export { appCommonConfig, appCommonConfigFun };
import type { appConfigType } from './project-modules-config/projectType';
type appCommonConfigType = 'couple-diary' | 'xzx-reading' | 'szjx' | 'xxt-income' | 'xxt';
interface projectItemConfigType {
  wxSubscribeTemplIds: {
    teacherSubscribeTemplIds: string[];
    studentSubscribeTemplIds: string[];
  };
  defalutAppConfig: appConfigType;
  // 请求的entry
  entry: string;
  // 微信小程序账号的原始ID
  WXMPOriginalID: string;
  // 公共分包模块的配置路径
  publicSubPackgePath: string;
  // 主包路径
  subPackagesRoot: string;
  // 报名称
  subPackagesName: string;
  // 登录验证码
  loginPhoneCode: number;
  // 绑定验证码
  bindPhoneCode: number;
  // 项目id
  loginConfigKey: appCommonConfigType;
  // hostId
  hostId: number;
  // 在接口返回未登录的时候，不跳转登录页面接口白名单
  noLoginApiWhiteList: string[];
  // 新增WX公众号的entry
  wxPublicEntry?: string;
}
type projectModuleConfigType = {
  [key in appCommonConfigType]?: projectItemConfigType;
};
const modules: Record<string, { default: projectItemConfigType }> = import.meta.glob(
  './project-modules-config/*-config.ts',
  {
    eager: true
  }
);
const projectModuleConfig: projectModuleConfigType = {};
Object.keys(modules).forEach((key) => {
  const match = key.match(/\/([^/]+)-config\.ts$/);
  const configKey = match?.[1] as appCommonConfigType | undefined;

  if (configKey) {
    projectModuleConfig[configKey] = modules[key].default;
  }
});

export { projectModuleConfig, appCommonConfigType, projectItemConfigType, projectModuleConfigType };
