import { createAuthRedirectError, getCurrentRedirectUrl } from '@/uni-module-common/auth';
import { httpAuthAdapter } from '@/uni-module-common/http/auth/http-auth-adapter';
import { isUnauthorizedResponseData } from '@/uni-module-common/http/auth/unauthorized-matcher';
import { setWXLoginCookie } from '@/uni-module-common/http/legacy/cookie-bridge';
import { apiUrlPrefix, uploadBaseUrl } from '@/uni-module-common/config/';
import {
  bindUploadTaskLifecycle,
  clearWxEmptyFile,
  referer,
  userAgentPrefix
} from '@/uni-module-common/http/upload/create-upload-task';
import type {
  UploadErrorContext,
  UploadSuccessContext
} from '@/uni-module-common/http/upload/upload-types';
import type { UploadResult } from '@/uni-module-common/http/types';
import { variableTypeDetection } from '@/uni-module-common/utils/verifyType';

/**
 * 根据附件类型编号生成旧上传链路的中文错误前缀。
 * 这里保留原协议，避免历史页面提示文案发生变化。
 */
export const errorStrFunc = (fileTypeNum: number) => {
  let errmsg = '图片';
  switch (fileTypeNum) {
    case 1:
      errmsg = '图片';
      break;
    case 2:
      errmsg = '语音';
      break;
    case 3:
      errmsg = '视频';
      break;
    case 4:
      errmsg = '文件';
      break;
    case 5:
      errmsg = '链接';
      break;
    default:
      break;
  }
  return errmsg;
};

/**
 * 旧兼容上传入口。
 * 历史页面和 fileUpload store 仍直接依赖这个签名，因此这里只迁移实现位置，不改变参数和返回结构。
 */
export const uploadFilePromise = (
  filePath: string,
  primiFilePath: string,
  fileTypeNum: number,
  retryCount: number,
  formData: any,
  urlApi: string,
  itemSeq?: number | null,
  ossManagerClass?: any
): Promise<UploadResult | string> => {
  const logFormData = {
    ...formData,
    singleFileIdentity: ossManagerClass?.singleFileIdentity,
    fileName: filePath,
    uploadType: 3
  };
  ossManagerClass?.saveOssUploadResultLog(logFormData, true);

  const localTime = new Date();
  let fileSize = 0;
  const token = uni.getStorageSync('token');
  const errorStr = errorStrFunc(fileTypeNum);
  const uploadFileAPI =
    urlApi.startsWith('http') || urlApi.startsWith('https')
      ? urlApi
      : `${uploadBaseUrl}${apiUrlPrefix}${urlApi}`;

  console.info('[公共上传] 使用兼容上传通道', {
    上传地址: uploadFileAPI,
    附件类型: fileTypeNum,
    表单项序号: itemSeq ?? null,
    是否携带旧凭证: Boolean(token)
  });

  let header: Record<string, any> = {
    Cookie: token,
    Referer: referer,
    'User-Agent': userAgentPrefix
  };
  if (variableTypeDetection.isObject(token)) {
    header = setWXLoginCookie(token, header);
  }

  retryCount = 0;
  return new Promise<UploadResult | string>((resolve, reject) => {
    const uploadTask = uni.uploadFile({
      url: uploadFileAPI,
      filePath,
      name: 'file',
      formData,
      // #ifdef MP-WEIXIN
      timeout: 6000000,
      // #endif
      header,
      success: (resData: any) => {
        let res: any;
        try {
          res = JSON.parse(resData.data || '{}');
        } catch (error) {
          res = {};
        }

        uploadFileCBSuccess({
          res,
          filePath,
          primiFilePath,
          fileTypeNum,
          retryCount,
          formData,
          urlApi,
          itemSeq,
          resolve,
          reject,
          logInfo: {
            localTime,
            fileSize,
            ossManagerClass,
            isOld: true
          }
        });
      },
      fail: (err) => {
        uploadFileCBError({
          err,
          filePath,
          primiFilePath,
          fileTypeNum,
          retryCount,
          formData,
          urlApi,
          itemSeq,
          resolve,
          reject,
          errorStr,
          logInfo: {
            localTime,
            fileSize,
            ossManagerClass,
            isOld: true
          }
        });

        if (retryCount === 0 && uploadTask?.abort) {
          uploadTask.abort();
        }
      }
    });

    bindUploadTaskLifecycle(uploadTask, '[公共上传] 兼容上传任务', (progressPayload) => {
      fileSize = progressPayload.totalBytesSent;
    });
  });
};

/**
 * 统一处理上传成功回调。
 * 普通上传和策略上传最终都会落到这里，保证未登录兜底、重试、fileId 兼容写法保持一致。
 */
export function uploadFileCBSuccess(obj: UploadSuccessContext) {
  let {
    res,
    filePath,
    primiFilePath,
    fileTypeNum,
    retryCount,
    formData,
    urlApi,
    itemSeq,
    resolve,
    reject,
    logInfo
  } = obj;

  console.info('[公共上传] 上传回调进入成功处理', {
    表单项序号: itemSeq ?? null,
    是否包含文件ID: Boolean(res && 'fileId' in res)
  });

  if (typeof res === 'object' && 'code' in res && 'status' in res) {
    if (retryCount > 0) {
      retryCount--;
      logInfo.ossManagerClass?.updateOssUploadResultLog(
        formData,
        logInfo.localTime,
        0,
        logInfo.fileSize,
        logInfo.isOld,
        logInfo.uploadFileSize,
        `上传失败，失败code:${res.code},失败message:${res.message}`,
        res.fileId
      );

      setTimeout(() => {
        uploadFilePromise(
          filePath,
          primiFilePath,
          fileTypeNum,
          retryCount,
          formData,
          urlApi,
          itemSeq,
          logInfo.ossManagerClass || undefined
        )
          .then(resolve)
          .catch(reject);
      }, 1000);
      return;
    }

    if (isUnauthorizedResponseData(urlApi, res)) {
      console.warn('[公共鉴权] 上传接口返回未登录状态，准备清空登录态并跳转登录页', {
        接口地址: urlApi,
        状态码: res.status,
        业务码: res.code
      });
      httpAuthAdapter.clearLoginState();
      void httpAuthAdapter.redirectToLogin(getCurrentRedirectUrl());
      reject(createAuthRedirectError('上传接口返回未登录状态'));
      return;
    }

    if (res.status === 400) {
      logInfo.ossManagerClass?.updateOssUploadResultLog(
        formData,
        logInfo.localTime,
        0,
        logInfo.fileSize,
        logInfo.isOld,
        logInfo.uploadFileSize,
        '参数异常',
        ''
      );
      uni.showToast({
        title: '参数异常',
        duration: 3000,
        icon: 'none',
        mask: false
      });
    } else {
      logInfo.ossManagerClass?.updateOssUploadResultLog(
        formData,
        logInfo.localTime,
        0,
        logInfo.fileSize,
        logInfo.isOld,
        logInfo.uploadFileSize,
        res.message || '请求接口时发生异常，请稍后再试',
        ''
      );
      uni.showToast({
        title: res.message || '请求接口时发生异常，请稍后再试',
        duration: 3000,
        icon: 'none',
        mask: false
      });
    }
    reject(res.message);
    return;
  }

  // #ifdef MP-WEIXIN
  fileTypeNum === 5 && clearWxEmptyFile(filePath);
  // #endif

  if (res && 'fileId' in res) {
    if (typeof res.fileId === 'number') {
      res.fileId = String(res.fileId);
    }
    logInfo.ossManagerClass?.updateOssUploadResultLog(
      formData,
      logInfo.localTime,
      1,
      logInfo.fileSize,
      logInfo.isOld,
      logInfo.uploadFileSize,
      '',
      res.fileId
    );
    resolve({
      ...res,
      fileId: res.fileId,
      filePath: primiFilePath,
      itemSeq
    });
    return;
  }

  logInfo.ossManagerClass?.updateOssUploadResultLog(
    formData,
    logInfo.localTime,
    1,
    logInfo.fileSize,
    logInfo.isOld,
    logInfo.uploadFileSize,
    '',
    JSON.stringify(res)
  );
  resolve(JSON.stringify(res) || '');
}

/**
 * 统一处理上传失败回调。
 * 这里继续保留旧重试协议和中文错误文案，避免历史页面的失败表现发生变化。
 */
export function uploadFileCBError(obj: UploadErrorContext) {
  let {
    filePath,
    primiFilePath,
    fileTypeNum,
    retryCount,
    formData,
    urlApi,
    itemSeq,
    resolve,
    reject,
    err,
    errorStr,
    logInfo
  } = obj;

  console.warn('[公共上传] 上传失败，准备记录失败结果', {
    表单项序号: itemSeq ?? null,
    错误信息: err?.errMsg || err?.message || err || ''
  });

  logInfo.ossManagerClass?.updateOssUploadResultLog(
    formData,
    logInfo.localTime,
    0,
    logInfo.fileSize,
    logInfo.isOld,
    logInfo.uploadFileSize,
    errorStr,
    ''
  );

  if (retryCount > 0) {
    retryCount--;
    setTimeout(() => {
      uploadFilePromise(
        filePath,
        primiFilePath,
        fileTypeNum,
        retryCount,
        formData,
        urlApi,
        itemSeq ?? null,
        logInfo.ossManagerClass || undefined
      )
        .then(resolve)
        .catch(reject);
    }, 1000);
    return;
  }

  // #ifdef MP-WEIXIN
  fileTypeNum === 5 && clearWxEmptyFile(filePath);
  // #endif
  reject(`${errorStr}附件上传失败`);
}
