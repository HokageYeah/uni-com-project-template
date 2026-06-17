import type { appConfigType } from './projectType';
const defalutAppConfig: appConfigType = {
  template: {
    basic: {
      tabBar: {
        selectedColor: '#4AD975',
        color: '#999999',
        list: [
          {
            pagePath: '/pages/index/index',
            text: '首页',
            iconPath: 'tabbar_app_home_unselect.png',
            selectedIconPath: 'tabbar_app_home_select.png',
          },
          {
            pagePath: '/pages/diary/diary',
            text: '中间 Tab',
            iconPath: 'tabbar_app_family_study_unselect.png',
            selectedIconPath: 'tabbar_app_family_study_select.png',
          },
          {
            pagePath: '/pages/mine/mine',
            text: '我的',
            iconPath: 'tabbar_app_my_unselect.png',
            selectedIconPath: 'tabbar_app_my_select.png',
          },
        ],
      },
      homeTeacherModule: [],
      homeStudentModule: [],
      administratorModule: [],
    },
  },
};
const projectConfig = {
  // 微信订阅模板id
  wxSubscribeTemplIds: {
    // 数智慧家校微信订阅老师模板id
    teacherSubscribeTemplIds: ['nEEz30E2jlVOw9H_2dO6hRnCqW-eRXUWnigyvoYjqng'],
    // 数智慧家校微信订阅学生模板id
    studentSubscribeTemplIds: ['nEEz30E2jlVOw9H_2dO6hRnCqW-eRXUWnigyvoYjqng'],
  },
  // store中appConfig的默认配置，每个小程序的tabbar不一样所以单独配置
  defalutAppConfig,
  entry: 'couple-diary-template',
  // 模板工程默认留空，业务项目接入时按需覆盖
  wxPublicEntry: '',
  // 模板工程默认留空，业务项目接入时按需覆盖
  WXMPOriginalID: '',
  // 公共分包模块的配置路径
  publicSubPackgePath: `/uni_modules/uni-module-public`,
  // 主包路径
  subPackagesRoot: 'uni_modules/uni-com-project-template',
  // 报名称
  subPackagesName: 'coupleDiaryTemplate',
  // 模板占位默认不内置短信登录
  loginPhoneCode: 0,
  // 模板占位默认不内置绑定手机号
  bindPhoneCode: 0,
  loginConfigKey: 'couple-diary',
  hostId: 1,
  // 模板默认不内置旧项目接口白名单
  noLoginApiWhiteList: [],
};

export default projectConfig;
