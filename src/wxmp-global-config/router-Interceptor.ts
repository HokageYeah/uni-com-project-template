import pagesJson from '@/pages.json';

const switchModules: Record<string, { default: Record<string, string> }> = import.meta.glob(
  './tabbar-subpack-map/**/*.json',
  {
    eager: true
  }
);

const registeredPagePathSet = new Set<string>([
  ...pagesJson.pages.map((page: any) => `/${page.path}`),
  ...pagesJson.subPackages.flatMap((item: any) => {
    return item.pages.map((subPage: any) => `/${item.root}/${subPage.path}`);
  })
]);

// 不需要重定向路由白名单
const notRedirectRoutes: string[] = [
  'login/login',
  'pages/index/index',
  'pages/diary/diary',
  'pages/mine/mine',
  'uni_modules/pages-home/home-main/home-main',
  'uni_modules/diary/pages/home/index',
  'uni_modules/pages-mine/mine-main/mine-main'
];

/**
 * 解析当前页面发起的相对路由。
 * 项目里仍可能存在 ../login/login 这类历史相对写法，这里统一转换成小程序可识别的绝对路径。
 */
const resolveRelativeRouteUrl = (url: string) => {
  if (!url) {
    return '';
  }

  if (!url.startsWith('./') && !url.startsWith('../')) {
    return url;
  }

  const queryIndex = url.indexOf('?');
  const routePath = queryIndex === -1 ? url : url.slice(0, queryIndex);
  const queryString = queryIndex === -1 ? '' : url.slice(queryIndex);
  const pages = getCurrentPages();
  const currentPage: any = pages[pages.length - 1];
  const currentRoute = currentPage?.route || currentPage?.__route__ || '';
  const baseRouteSegments = currentRoute.split('/').filter(Boolean);
  baseRouteSegments.pop();

  routePath.split('/').forEach((segment) => {
    if (!segment || segment === '.') {
      return;
    }

    if (segment === '..') {
      baseRouteSegments.pop();
      return;
    }

    baseRouteSegments.push(segment);
  });

  return `${baseRouteSegments.join('/')}${queryString}`;
};

/**
 * 统一标准化路由地址，避免业务侧传相对路径或缺少前导斜杠时触发错误路由。
 */
const normalizeRouteUrl = (url: string) => {
  const resolvedUrl = resolveRelativeRouteUrl(url);

  if (!resolvedUrl) {
    return '';
  }

  return resolvedUrl[0] !== '/' ? `/${resolvedUrl}` : resolvedUrl;
};

const isRegisteredPagePath = (url: string) => {
  const routePath = normalizeRouteUrl(url).split('?')[0];
  return registeredPagePathSet.has(routePath);
};

const initSwitchModules = (switchUrl: string) => {
  const switchUrlStr = normalizeRouteUrl(switchUrl);
  let isSwitch = true;

  Object.keys(switchModules).forEach((key: any) => {
    const moduleName = key.split('/').pop()?.replace('.json', '');
    const modObj = switchModules[key].default;
    const switchSourcePath = Object.keys(modObj).find((jsonItem: string) => {
      return switchUrlStr.includes(jsonItem);
    });

    if (!switchSourcePath || !moduleName) {
      return;
    }

    let jsonValue = modObj[switchSourcePath];
    jsonValue = jsonValue[0] !== '/' ? `/${jsonValue}` : jsonValue;
    const candidateRouteUrl = `/uni_modules/${moduleName}${jsonValue}`;

    if (!isRegisteredPagePath(candidateRouteUrl)) {
      return;
    }

    uni.reLaunch({
      url: candidateRouteUrl,
      animationType: 'none',
      animationDuration: 0
    });
    isSwitch = false;
  });

  return isSwitch;
};

const interceptorOptions = {
  invoke(args: any) {
    const { isLogin } = useStore('user');
    args.url = normalizeRouteUrl(args.url);

    if (!isLogin.value) {
      if (!notRedirectRoutes.some((item: string) => args.url.includes(item))) {
        const redictUrl = encodeURIComponent(args.url);
        args.url = `/uni_modules/uni-module-public/login/login?redictUrl=${redictUrl}`;
      }

      return args;
    }

    return args;
  },
  fail(err: any) {
    console.error('[模板路由] 页面跳转失败', err);
  }
};

const interceptorSwitchOptions = {
  invoke(args: any) {
    args.url = normalizeRouteUrl(args.url);
    return initSwitchModules(args.url);
  },
  fail(err: any) {
    console.error('[模板路由] 切换 Tab 页失败', err);
  }
};

export default function initRouterInterceptor() {
  uni.addInterceptor('navigateTo', interceptorOptions);
  uni.addInterceptor('redirectTo', interceptorOptions);
  uni.addInterceptor('reLaunch', interceptorOptions);
  uni.addInterceptor('switchTab', interceptorSwitchOptions);
}
