/**
 * HTTP 模块冻结契约名称。
 * 这些名称对应当前旧调用方已经依赖的公共出口，后续拆分 core/auth/legacy/upload 时必须继续兼容。
 */
export type FrozenHttpContractName =
  | 'ajax默认导出'
  | 'custom.showLoading'
  | 'custom.showError'
  | 'custom.auth'
  | 'saveCookies'
  | 'needDealCookieNames'
  | 'uploadFilePromise'
  | 'newUploadFilePromise'
  | 'uploadFilesCallBack';

/**
 * 请求自定义配置。
 * 当前仅用于固化旧 ajax custom 契约，task-01 不改变运行时默认值和拦截器行为。
 */
export interface RequestCustom {
  /** 是否展示操作成功提示；默认 false，成功文案优先使用 successMsg，其次使用后端返回文案。 */
  showSuccess?: boolean;
  /** 自定义成功提示文案；为空时沿用后端返回的成功提示。 */
  successMsg?: string;
  /** 是否展示失败提示；默认 true，由公共请求层统一展示业务失败或网络失败文案。 */
  showError?: boolean;
  /** 自定义失败提示文案；为空时沿用后端返回文案或请求层兜底文案。 */
  errorMsg?: string;
  /** 是否展示 loading；默认 false，适合提交类或需要阻塞交互的请求显式开启。 */
  showLoading?: boolean;
  /** loading 展示文案；默认“加载中”，仅在 showLoading 为 true 时生效。 */
  loadingMsg?: string;
  /** 是否要求登录后才能请求；默认 false，true 时会在请求前触发登录拦截。 */
  auth?: boolean;
  /** 是否取消请求前自动隐藏 toast；默认 false，日志等特殊请求可开启以避免打断现有提示。 */
  isCancelHideToast?: boolean;
  /** 是否取消请求前自动隐藏 loading；默认 false，特殊链路可开启以保留外部 loading。 */
  isCancelHideLoading?: boolean;
}

/**
 * 推荐请求配置。
 * 新增 request<T>() 使用该结构描述请求入参，旧 ajax 仍可继续使用历史配置对象。
 */
export interface RequestConfig {
  /** 接口路径或完整 URL；路径会继续复用旧 ajax 拦截器中的 URL 分流逻辑。 */
  url: string;
  /** 请求方法；推荐显式传入 GET 或 POST，特殊旧接口可继续透传其它 uni.request 方法。 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'CONNECT' | 'HEAD' | 'OPTIONS' | 'TRACE';
  /** 请求业务参数；GET 与 POST 均通过 data 透传给 uni-ajax，保持项目既有写法。 */
  data?: string | Record<string, unknown> | ArrayBuffer;
  /** 兼容部分调用方使用 query 传参；公共层不主动打印该字段，避免泄露敏感参数。 */
  query?: Record<string, unknown>;
  /** 兼容部分历史调用方使用 params 传参；新代码优先使用 data。 */
  params?: Record<string, unknown>;
  /** 请求头覆盖项；日志禁止展开 header，避免泄露 token、Cookie 等敏感信息。 */
  header?: Record<string, unknown>;
  /** 请求自定义配置；需要登录的接口必须显式设置 custom.auth: true。 */
  custom?: RequestCustom;
  /** 兼容 uni-ajax 其它历史配置，后续迁移时再逐步收敛。 */
  [key: string]: unknown;
}

/**
 * 推荐响应模型。
 * request<T>() 会返回该结构；旧 ajax 仍保持历史返回结构，避免破坏现有调用方。
 */
export interface ApiResponse<T = unknown> {
  /** 请求是否按推荐协议成功归一化。 */
  success: boolean;
  /** 成功时返回的业务数据，具体结构由调用方通过泛型指定。 */
  data?: T;
  /** 失败时的错误摘要，只放可展示或可定位的信息，不承载完整响应体。 */
  error?: string;
  /** 原始响应数据，用于兼容旧接口和后续渐进迁移，不应直接打印到日志。 */
  raw: unknown;
}

/**
 * 请求错误对象。
 * 后续 core/request-error.ts 会基于该类型收敛错误信息，避免各处重复拼装错误结构。
 */
export interface RequestError {
  /** 面向调用方和日志的错误摘要，禁止放入 token、Cookie、完整 header 等敏感信息。 */
  message: string;
  /** HTTP 或 uni.request 层状态码；无状态码的本地错误可不传。 */
  statusCode?: number;
  /** 后端业务码；仅记录数字码，具体文案由 message 或后端 message 承载。 */
  code?: number;
  /** 原始错误对象，用于兼容旧逻辑；公共日志中不能直接展开打印。 */
  raw?: unknown;
}

/**
 * 上传结果最小公共结构。
 * 旧上传入口必须继续保留 fileId/filePath/itemSeq，其他历史字段通过索引签名兼容。
 */
export interface UploadResult {
  /** 后端返回的文件 ID；历史逻辑中可能由数字转换为字符串。 */
  fileId?: string;
  /** 上传成功后回填给业务的文件路径，通常是原始本地文件路径或兼容路径。 */
  filePath?: string;
  /** 表单附件序号；旧填表打卡链路依赖该字段区分同一表单内的附件。 */
  itemSeq?: number | null;
  /** 兼容旧上传接口返回的额外字段，后续迁移时再逐步收敛。 */
  [key: string]: unknown;
}
