import { versionCode } from '@/uni-module-common/config/';
import eventBus from '@/uni-module-common/utils/eventBus';
import {
  cancelUploadEvent,
  uploadProgressEvent,
  uploadTaskEvent
} from '@/uni-module-common/http/upload/upload-events';
import type {
  UploadProgressPayload,
  UploadTaskPayload
} from '@/uni-module-common/http/upload/upload-types';

/**
 * 上传链路统一的 UA 前缀。
 * 旧普通上传和旧策略上传都会复用它，避免后续多个模块再各自硬编码。
 */
export const userAgentPrefix = `task-center-${versionCode}`;

/**
 * 上传链路统一的 Referer。
 * 这里只迁移常量位置，不改变原有请求头协议。
 */
export const referer = `${userAgentPrefix}.xxt.cn`;

/**
 * 绑定上传任务与公共事件总线。
 * 普通上传、策略上传和 OSS 上传都通过这里同步任务实例、进度与取消行为，避免散落重复绑定代码。
 */
export const bindUploadTaskLifecycle = (
  uploadTask: any,
  logPrefix: string,
  onProgressUpdate?: (payload: UploadProgressPayload) => void
) => {
  const taskPayload: UploadTaskPayload = {
    uploadTask
  };
  eventBus.emit(uploadTaskEvent, taskPayload);

  if (uploadTask?.onProgressUpdate) {
    uploadTask.onProgressUpdate((payload: UploadProgressPayload) => {
      onProgressUpdate?.(payload);
      eventBus.emit(uploadProgressEvent, payload);
    });
  }

  eventBus.on(cancelUploadEvent, () => {
    console.info(`${logPrefix} 收到取消上传事件，准备终止当前上传任务`);
    if (uploadTask && typeof uploadTask.abort === 'function') {
      try {
        uploadTask.abort();
      } catch (error) {
        console.error(`${logPrefix} 终止上传任务时发生错误`, error);
      }
    }
  });
};

/**
 * 清理微信小程序创建的临时空文件。
 * 链接附件会先生成一个空文件参与上传，上传结束后必须回收，避免临时目录堆积。
 */
export const clearWxEmptyFile = (filePath: string) => {
  // #ifdef MP-WEIXIN
  const fs = uni.getFileSystemManager();
  try {
    fs.unlinkSync(filePath);
    console.info('[公共上传] 微信小程序临时空文件已清理');
  } catch (error) {
    console.error('[公共上传] 微信小程序临时空文件清理失败', error);
  }
  // #endif
};
