import type OssManagerClassType from '@/uni-module-common/hooks/oss-upload/ossManagerClass';
import type { UploadResult } from '@/uni-module-common/http/types';

/**
 * 上传链路的基础日志上下文。
 * 这里集中声明旧上传链路会透传的调测信息，避免多个模块各自写 `any`。
 */
export interface UploadLogInfo {
  /** 上传开始时间，用于计算策略切换耗时与日志打点。 */
  localTime: Date;
  /** 当前已记录的文件体积。普通上传记录已发送体积，OSS 上传记录总文件体积。 */
  fileSize: number;
  /** 兼容旧上传链路区分“旧主通道 / 新策略通道”的标记。 */
  isOld: boolean;
  /** OSS/策略上传场景下记录已上传体积，普通上传可不传。 */
  uploadFileSize?: number;
  /** 当前文件对应的 OSS 管理类实例，旧日志与策略判断仍会消费。 */
  ossManagerClass?: OssManagerClassType | null;
}

/**
 * 旧上传入口的固定入参。
 * 历史页面和 fileUpload store 都按这组签名调用，task-05 只迁移实现，不改对外接口。
 */
export interface LegacyUploadParams {
  filePath: string;
  primiFilePath: string;
  fileTypeNum: number;
  retryCount: number;
  formData: any;
  urlApi: string;
  itemSeq?: number | null;
  ossManagerClass?: OssManagerClassType;
}

/**
 * 上传成功处理上下文。
 * 普通上传和 OSS 上传最终都会落到统一成功回调，因此需要共享这份上下文定义。
 */
export interface UploadSuccessContext extends LegacyUploadParams {
  res: any;
  resolve: (value: UploadResult | string) => void;
  reject: (reason?: any) => void;
  logInfo: UploadLogInfo;
}

/**
 * 上传失败处理上下文。
 * 旧上传链路会根据这里的重试次数、错误文案和日志上下文决定后续处理。
 */
export interface UploadErrorContext extends LegacyUploadParams {
  err: any;
  errorStr: string;
  resolve: (value: UploadResult | string) => void;
  reject: (reason?: any) => void;
  logInfo: UploadLogInfo;
}

/**
 * 上传进度事件载荷。
 * fileUpload store 会用它更新进度条和文件体积展示。
 */
export interface UploadProgressPayload {
  progress: number;
  totalBytesSent: number;
  totalBytesExpectedToSend: number;
}

/**
 * 上传任务事件载荷。
 * 旧调用方只关心拿到上传任务实例，因此这里保留最小结构。
 */
export interface UploadTaskPayload {
  uploadTask: any;
}
