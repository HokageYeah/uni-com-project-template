import { createHttpClient } from '@/uni-module-common/http/core/create-http-client';
import { normalizeResponseMeta } from '@/uni-module-common/http/core/normalize-response';
import {
  REQUEST_API_ERROR_MARKER,
  REQUEST_API_MARKER
} from '@/uni-module-common/http/core/request-api-bridge';
import {
  getHttpFallbackErrorMessage,
  getResponseDisplayMessage,
  isBusinessErrorResponse,
  isBusinessSuccessResponse
} from '@/uni-module-common/http/core/response-feedback';
import { createRequestApi } from '@/uni-module-common/http/request';
import { resolveRequestUrl } from '@/uni-module-common/http/core/resolve-request-url';
import { saveResponseCookiesForLegacyLogin } from '@/uni-module-common/http/legacy/cookie-bridge';
import {
  errorStrFunc,
  uploadFileCBError,
  uploadFileCBSuccess,
  uploadFilePromise
} from '@/uni-module-common/http/legacy/legacy-upload';
import { referer, userAgentPrefix } from '@/uni-module-common/http/upload/create-upload-task';
import { httpAuthAdapter } from '@/uni-module-common/http/auth/http-auth-adapter';
import { isUnauthorizedResponseData } from '@/uni-module-common/http/auth/unauthorized-matcher';
import { uploadFilesCallBack } from '@/uni-module-common/http/upload/upload-events';
import type { RequestCustom } from '@/uni-module-common/http/types';
import {
  createAuthRedirectError,
  getCurrentRedirectUrl,
  isAuthRedirectError
} from '@/uni-module-common/auth';
import { apiBaseUrl, apiUrlPrefix, noLoginApiWhiteList } from '@/uni-module-common/config/';
export {
  needDealCookieNames,
  parseCookieItem,
  saveCookies,
  saveResponseCookiesForLegacyLogin,
  setWXLoginCookie
} from '@/uni-module-common/http/legacy/cookie-bridge';

const options = {
  // 显示操作成功消息 默认不显示
  showSuccess: false,
  // 成功提醒 默认使用后端返回值
  successMsg: '',
  // 显示失败消息 默认显示
  showError: true,
  // 失败提醒 默认使用后端返回信息
  errorMsg: '',
  // 显示请求时loading模态框 默认显示
  showLoading: false,
  // loading提醒文字
  loadingMsg: '加载中',
  // 需要授权才能请求 默认放开
  auth: false,
  // 是否在请求时取消隐藏toast 默认不取消 （在log请求的时候需要取消隐藏toast，避免影响其他toast的显示）
  isCancelHideToast: false,
  // 是否在请求时取消隐藏loading 默认不取消 （在log请求的时候需要取消隐藏loading，避免影响其他loading的显示）
  isCancelHideLoading: false
  // ...
};
type Optional<T> = {
  [k in keyof T]?: T[k];
};
type optionsType = Optional<RequestCustom>;

/**
 * 冻结旧 ajax 的 custom 配置契约。
 * 这里只补充类型边界，不改变 `options` 默认值和拦截器运行行为，避免影响旧页面请求。
 */
declare module 'uni-ajax' {
  interface CustomConfig {
    custom?: optionsType;
  }
}

// Loading全局实例
const LoadingInstance = {
  target: null,
  count: 0
};
/**
 * 关闭loading
 */
function closeLoading() {
  if (LoadingInstance.count > 0) LoadingInstance.count--;
  // if (LoadingInstance.count === 0) uni.hideLoading();
  uni.hideLoading();
}

/**
 * 统一把最小 token 挂到请求头。
 * 请求层只认最小 `token` 字段，不再在请求层继续拼装旧 Cookie Map。
 */
const appendTokenHeader = (configHeader: any, rawToken: any) => {
  const nextHeader = {
    ...(configHeader || {})
  };

  if (typeof rawToken === 'string' && rawToken.trim()) {
    nextHeader.Authorization = rawToken.trim();
    nextHeader.token = rawToken.trim();
  }

  return nextHeader;
};

const getSafeRequestLogContext = (
  url?: string,
  method?: string,
  status?: number,
  code?: number
) => ({
  接口地址: url || '',
  请求方法: method || '',
  状态码: status,
  业务码: code
});
// 创建请求实例：基础配置已下沉到 core，门面继续负责注册鉴权、Cookie、toast 等兼容拦截器。
const instance = createHttpClient({
  referer,
  userAgentPrefix,
  custom: options
});

// 推荐请求入口复用同一个已配置实例，只新增响应归一化能力，不另起一套 HTTP 栈。
const request = createRequestApi(instance);

// 添加请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 在发送请求前做些什么
    /**
     * `custom.auth` 是请求层唯一的“此请求需要登录”开关。
     * 在请求发出前就阻断，可以避免无效网络请求，也能保证页面和请求走同一套登录入口。
     */
    if (config?.custom?.auth && !httpAuthAdapter.isLoggedIn()) {
      uni.showToast({
        title: '未登录',
        duration: 3000,
        icon: 'none',
        mask: false
      });

      httpAuthAdapter.requireLogin(getCurrentRedirectUrl());
      return Promise.reject(createAuthRedirectError());
    }
    !config.custom?.isCancelHideToast && uni.hideToast();
    !config.custom?.isCancelHideLoading && uni.hideLoading();
    if (config.custom?.showLoading) {
      // LoadingInstance.count++;
      // LoadingInstance.count === 1 &&
      uni.showLoading({
        title: config.custom.loadingMsg,
        mask: false,
        fail: () => {
          uni.hideLoading();
        }
      });
    }

    // URL 分流只做路径解析，不处理鉴权或 token，避免核心能力继续和用户态耦合。
    config.url = resolveRequestUrl(config.url);
    config.header = appendTokenHeader(config.header, httpAuthAdapter.getToken());

    // #ifdef MP-WEIXIN
    config.header = {
      ...config.header,
      'source-client': 'miniapp'
    };
    // #endif

    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 添加响应拦截器
instance.interceptors.response.use(
  async (response) => {
    // 对响应数据做些什么

    // 自动设置登录令牌
    // if (response.header.authorization || response.header.Authorization) {
    //   uni.setStorageSync('token', response.header.authorization || response.header.Authorization);
    //   $store('user').setToken(response.header.authorization || response.header.Authorization);
    // }
    response.config?.custom?.showLoading && closeLoading();
    console.info('[公共请求] 收到响应', {
      接口地址: response.config?.url || '',
      请求方法: response.config?.method || '',
      HTTP状态码: response.statusCode
    });

    if (response.data?.error != null && response.data.error !== 0) {
      console.warn('[公共请求] 命中旧协议业务异常分支：error != 0', {
        接口地址: response.config?.url || '',
        错误码: response.data?.error
      });
      if (response.config.custom?.showError) {
        uni.showToast({
          title: getResponseDisplayMessage(response.data, '服务器开小差啦,请稍后再试~'),
          duration: 3000,
          icon: 'none',
          mask: false
        });
        return Promise.resolve(response.data);
      }
    }
    const res = response.data;
    const repliceUrl = `${apiBaseUrl}${apiUrlPrefix}/`;
    const url = response.config.url?.includes(repliceUrl)
      ? response.config.url.replace(repliceUrl, '')
      : response.config.url;
    // 获取接口：白名单接口不触发统一未登录跳转，避免登录页和公开接口被错误拦截。
    const isAPIWhiteList = noLoginApiWhiteList.some((item: string) => item.includes(url as string));
    const responseMeta = normalizeResponseMeta(res);
    console.info('[公共请求] 响应归一化结果', {
      接口地址: `${url || ''}`,
      请求方法: response.config.method,
      状态码: responseMeta.status,
      业务码: responseMeta.code,
      ret类型: responseMeta.retType,
      文案: responseMeta.message
    });

    if (isBusinessErrorResponse(res) && !isAPIWhiteList) {
      if (isUnauthorizedResponseData(`${url || ''}`, res)) {
        /**
         * 接口已经明确返回“未登录”时，请求层统一清空最小会话并跳登录页。
         * 这样页面和请求的未登录兜底都会走同一条链路。
         */
        console.warn(
          '[公共鉴权] 接口返回未登录状态，准备清空登录态并跳转登录页',
          getSafeRequestLogContext(
            `${url || ''}`,
            response.config.method,
            responseMeta.status,
            responseMeta.code
          )
        );
        httpAuthAdapter.clearLoginState();
        await httpAuthAdapter.redirectToLogin(getCurrentRedirectUrl());
        return Promise.reject(createAuthRedirectError('接口返回未登录状态'));
      }

      if (responseMeta.status === 400) {
        uni.showToast({
          title: getResponseDisplayMessage(res, '参数异常'),
          duration: 3000,
          icon: 'none',
          mask: false
        });
      } else {
        uni.showToast({
          title: getResponseDisplayMessage(res, '请求接口时发生异常，请稍后再试'),
          duration: 3000,
          icon: 'none',
          mask: false
        });
      }

      console.warn(
        '[公共请求] 按统一协议处理业务异常响应',
        getSafeRequestLogContext(
          `${url || ''}`,
          response.config.method,
          responseMeta.status,
          responseMeta.code
        )
      );
      return Promise.reject(res);
    }

    if (
      responseMeta.isObject &&
      responseMeta.code !== undefined &&
      responseMeta.status !== undefined &&
      !isAPIWhiteList
    ) {
      if (isUnauthorizedResponseData(`${url || ''}`, res)) {
        /**
         * 接口已经明确返回“未登录”时，请求层统一清空最小会话并跳登录页。
         * 这样页面和请求的未登录兜底都会走同一条链路。
         */
        console.warn(
          '[公共鉴权] 接口返回未登录状态，准备清空登录态并跳转登录页',
          getSafeRequestLogContext(`${url || ''}`, response.config.method, res.status, res.code)
        );
        httpAuthAdapter.clearLoginState();
        await httpAuthAdapter.redirectToLogin(getCurrentRedirectUrl());
        return Promise.reject(createAuthRedirectError('接口返回未登录状态'));
      } else if (responseMeta.status === 400) {
        uni.showToast({
          title: '参数异常',
          duration: 3000,
          icon: 'none',
          mask: false
        });
      } else {
        uni.showToast({
          title: getResponseDisplayMessage(res, '请求接口时发生异常，请稍后再试'),
          duration: 3000,
          icon: 'none',
          mask: false
        });
      }
      console.warn(
        '[公共请求] 接口返回业务异常',
        getSafeRequestLogContext(`${url || ''}`, response.config.method, res.status, res.code)
      );
      return Promise.reject(res);
    }
    if (
      isBusinessSuccessResponse(response.data) &&
      getResponseDisplayMessage(response.data, '') !== '' &&
      response.config.custom?.showSuccess
    ) {
      console.info('[公共请求] 命中成功提示展示分支', {
        接口地址: `${url || ''}`,
        展示文案: response.config.custom.successMsg || getResponseDisplayMessage(response.data, '')
      });
      uni.showToast({
        title: response.config.custom.successMsg || getResponseDisplayMessage(response.data, ''),
        duration: 3000,
        icon: 'none',
        mask: false
      });
    }
    saveResponseCookiesForLegacyLogin(response.cookies);
    return Promise.resolve(response.data);
  },
  (error) => {
    console.warn('[公共请求] 网络请求失败，准备进入统一错误处理', {
      状态码: error?.statusCode,
      错误信息: error?.errMsg || error?.message || ''
    });
    if (isAuthRedirectError(error)) {
      error?.config?.custom?.showLoading && closeLoading();
      return Promise.reject(error);
    }

    // 对响应错误做些什么
    // 登录信息鉴权处理
    // const userStore = $store('user');
    // const isLogin = userStore.isLogin;
    const errorMessage = getHttpFallbackErrorMessage(error, httpAuthAdapter.isLoggedIn());
    if (error?.statusCode === 401) {
      httpAuthAdapter.clearLoginState();
      void httpAuthAdapter.redirectToLogin(getCurrentRedirectUrl());
    }
    if (error && error.config) {
      error.config.custom.showLoading && closeLoading();
      error.config.custom?.showError &&
        uni.showToast({
          title: getResponseDisplayMessage(error?.data ?? error, errorMessage),
          duration: 3000,
          icon: 'none',
          mask: false
        });
    }
    console.warn('[公共请求] 网络请求失败处理完成', {
      状态码: error?.statusCode,
      错误提示: errorMessage
    });

    if (error?.config?.[REQUEST_API_MARKER]) {
      const normalizedMeta = normalizeResponseMeta(error?.data ?? error);
      const normalizedErrorPayload = {
        [REQUEST_API_ERROR_MARKER]: true,
        message: getResponseDisplayMessage(error?.data ?? error, errorMessage),
        statusCode: error?.statusCode ?? normalizedMeta.status,
        code: normalizedMeta.code,
        raw: error?.data ?? error
      };

      console.warn('[公共请求] 识别到 request<T>() 专用标记，返回结构化失败结果', {
        状态码: normalizedErrorPayload.statusCode,
        业务码: normalizedErrorPayload.code,
        错误文案: normalizedErrorPayload.message
      });

      return Promise.resolve(normalizedErrorPayload);
    }

    // {"code":1,"message":"任务不存在或已删除","status":500}
    // return Promise.reject(new Error(errorMessage));
    return false;
  }
);

/**
 * HTTP 旧入口冻结说明。
 * 默认导出 ajax 实例与下列命名导出仍被历史页面、上传 store、登录兼容链路引用；后续拆分时只能迁移实现，不能改名或删除。
 */
export default instance;
export {
  request,
  uploadFilePromise,
  uploadFilesCallBack,
  errorStrFunc,
  referer,
  userAgentPrefix,
  uploadFileCBSuccess,
  uploadFileCBError
};
export type {
  FrozenHttpContractName,
  ApiResponse,
  RequestConfig,
  RequestCustom,
  RequestError,
  UploadResult
} from './types';
