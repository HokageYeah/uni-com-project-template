import {
  aiBaseUrl,
  aiUrlPrefix,
  apiBaseUrl,
  apiUrlPrefix,
  clickBaseUrl,
  clickUrlPrefix
} from '@/uni-module-common/config/';

/**
 * 判断是否为完整网络地址。
 * 完整地址必须直通，避免二次拼接 baseURL 导致第三方或上传接口地址异常。
 */
function isFullNetworkUrl(url: string) {
  return url.startsWith('http') || url.startsWith('https');
}

/**
 * 解析公共请求地址。
 *
 * 说明：原 index.ts 中 click / AI 前缀在 H5 下不拼接远程 baseURL，依赖 H5 自身代理或部署环境处理；
 * 非 H5 平台才会拼接对应 baseURL。这里保持同样的条件编译语义，确保 task-02 不改变历史 URL 结果。
 */
export function resolveRequestUrl(url?: string) {
  const requestUrl = `${url || ''}`;

  if (!requestUrl) {
    return requestUrl;
  }

  if (requestUrl.startsWith(clickUrlPrefix)) {
    // #ifndef H5
    return clickBaseUrl + requestUrl.replace(clickUrlPrefix, '');
    // #endif
    // #ifdef H5
    return requestUrl;
    // #endif
  }

  if (requestUrl.startsWith(aiUrlPrefix)) {
    // #ifndef H5
    return aiBaseUrl + requestUrl.replace(aiUrlPrefix, '');
    // #endif
    // #ifdef H5
    return requestUrl;
    // #endif
  }

  if (!isFullNetworkUrl(requestUrl)) {
    return (
      apiBaseUrl +
      (requestUrl[0] !== '/' ? `${apiUrlPrefix}/${requestUrl}` : `${apiUrlPrefix}${requestUrl}`)
    );
  }

  return requestUrl;
}
