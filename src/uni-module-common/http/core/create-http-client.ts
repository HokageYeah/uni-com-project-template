import ajax from 'uni-ajax';
import { ContentTypeEnum, RequestEnum } from '@/uni-module-common/http/enums';
import type { RequestCustom } from '@/uni-module-common/http/types';

export interface CreateHttpClientOptions {
  /** APP-PLUS 端透传的 Referer，保持旧请求头兼容。 */
  referer: string;
  /** APP-PLUS 端透传的 UA 前缀，保持旧埋点和后端识别兼容。 */
  userAgentPrefix: string;
  /** 旧 ajax custom 默认配置，必须由门面传入以冻结历史默认行为。 */
  custom: RequestCustom;
}

/**
 * 创建基础 HTTP 客户端。
 * core 层只负责 uni-ajax 实例基础配置，不读取用户态、不处理登录跳转，也不触碰上传实现。
 */
export function createHttpClient(options: CreateHttpClientOptions) {
  return ajax.create({
    baseURL: '',
    timeout: 10000,
    method: RequestEnum.GET,
    header: {
      // #ifdef APP-PLUS
      // 设置 UA。注：只能设置前缀，保持旧 APP-PLUS 请求头行为不变。
      Referer: options.referer,
      'User-Agent': options.userAgentPrefix,
      // #endif
      Accept: 'text/json,application/json',
      'Content-Type': ContentTypeEnum.JSON
    },
    // #ifdef APP-PLUS
    // 是否验证 ssl 证书，沿用旧配置，避免 APP-PLUS 环境请求行为变化。
    sslVerify: false,
    // #endif
    // #ifdef H5
    // H5 跨域请求是否携带凭证，保持旧 HBuilderX 平台兼容配置。
    withCredentials: true,
    // #endif
    custom: options.custom
  });
}
