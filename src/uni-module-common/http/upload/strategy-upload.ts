import { setWXLoginCookie } from '@/uni-module-common/http/legacy/cookie-bridge';
import {
  errorStrFunc,
  uploadFileCBError,
  uploadFileCBSuccess
} from '@/uni-module-common/http/legacy/legacy-upload';
import { apiUrlPrefix, uploadBaseUrl } from '@/uni-module-common/config/';
import type OssManagerClassType from '@/uni-module-common/hooks/oss-upload/ossManagerClass';
import {
  bindUploadTaskLifecycle,
  referer,
  userAgentPrefix
} from '@/uni-module-common/http/upload/create-upload-task';
import type {
  UploadErrorContext,
  UploadSuccessContext
} from '@/uni-module-common/http/upload/upload-types';
import { variableTypeDetection } from '@/uni-module-common/utils/verifyType';

const bytesToKb = (bytes: number) => Number((bytes / 1024).toFixed(2));

/**
 * 策略上传兼容入口。
 * 旧 fileUpload store 仍然从 `http/ossUpload.ts` 引用它，因此 task-05 只迁移实现，不改签名。
 */
export const newUploadFilePromise = (
  filePath: string,
  primiFilePath: string,
  fileTypeNum: number,
  retryCount: number,
  formData: any,
  urlApi: string,
  itemSeq?: number | null,
  ossManagerClass?: OssManagerClassType
): Promise<any> => {
  const { isStrategyStop }: any = useStore('fileUpload');
  const logFormData = {
    ...formData,
    singleFileIdentity: ossManagerClass?.singleFileIdentity,
    fileName: filePath,
    uploadType: 3
  };
  !isStrategyStop.value && ossManagerClass?.saveOssUploadResultLog(logFormData, false);

  const token = uni.getStorageSync('token');
  const errorStr = errorStrFunc(fileTypeNum);
  const uploadFileAPI =
    urlApi.startsWith('http') || urlApi.startsWith('https')
      ? urlApi
      : `${uploadBaseUrl}${apiUrlPrefix}${urlApi}`;

  console.info('[公共上传] 使用策略上传通道', {
    上传地址: uploadFileAPI,
    附件类型: fileTypeNum,
    表单项序号: itemSeq ?? null,
    是否已命中切换策略: isStrategyStop.value,
    是否携带旧凭证: Boolean(token),
    上传标识: ossManagerClass?.singleFileIdentity ?? ''
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
  const localTime = new Date();
  let recordStartTime = new Date();
  let isStrategyUploadExecuted = false;
  let fileSize = 0;
  const uploadFileSize = 0;

  return new Promise((resolve, reject) => {
    if (isStrategyStop.value) {
      console.info('[公共上传] 已命中上传策略，直接切换 OSS 通道', {
        附件类型: fileTypeNum,
        表单项序号: itemSeq ?? null
      });
      isStrategyUploadExecuted = true;
      strategyUpload(
        filePath,
        primiFilePath,
        fileTypeNum,
        retryCount,
        formData,
        urlApi,
        resolve,
        reject,
        false,
        {
          localTime: recordStartTime,
          fileSize,
          ossManagerClass,
          isOld: false,
          uploadFileSize
        },
        itemSeq ?? undefined,
        ossManagerClass,
        errorStr
      );
      return;
    }

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
            localTime: recordStartTime,
            fileSize,
            ossManagerClass,
            isOld: false,
            uploadFileSize
          }
        } as UploadSuccessContext);
      },
      fail: (err) => {
        console.warn('[公共上传] 策略上传主通道失败', {
          附件类型: fileTypeNum,
          表单项序号: itemSeq ?? null,
          是否已命中切换策略: isStrategyStop.value,
          错误信息: err?.errMsg || err?.message || ''
        });

        const errorContext = {
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
            localTime: recordStartTime,
            fileSize,
            ossManagerClass,
            isOld: false,
            uploadFileSize
          }
        } as UploadErrorContext;

        !isStrategyStop.value && uploadFileCBError(errorContext);
        if (retryCount === 0 && !isStrategyStop.value && uploadTask?.abort) {
          uploadTask.abort();
        }

        if (isStrategyStop.value) {
          console.info('[公共上传] 主通道中断后切换 OSS 通道', {
            附件类型: fileTypeNum,
            表单项序号: itemSeq ?? null
          });
          ossManagerClass?.updateOssUploadResultLog(
            formData,
            recordStartTime,
            0,
            fileSize,
            false,
            uploadFileSize,
            errorStr,
            ''
          );
          if (!isStrategyUploadExecuted) {
            isStrategyUploadExecuted = true;
            strategyUpload(
              filePath,
              primiFilePath,
              fileTypeNum,
              retryCount,
              formData,
              urlApi,
              resolve,
              reject,
              true,
              {
                localTime: recordStartTime,
                fileSize,
                ossManagerClass,
                isOld: false,
                uploadFileSize
              },
              itemSeq ?? undefined,
              ossManagerClass,
              errorStr
            );
          }
        }
      }
    });

    bindUploadTaskLifecycle(uploadTask, '[公共上传] 策略上传任务', (res) => {
      const lastBytesSent = (uploadTask as any)._lastBytesSent || 0;
      const now = Date.now();
      const startTime = res.totalBytesSent === 0 ? now : (uploadTask as any)._startTime || now;
      (uploadTask as any)._startTime = startTime;
      (uploadTask as any)._lastBytesSent = res.totalBytesSent;
      const timeDiff = (now - startTime) / 1000 || 1;
      const uploadSpeed = bytesToKb(res.totalBytesSent - lastBytesSent) / timeDiff;

      const localTimeAfter = new Date();
      const timeDifference = (localTimeAfter.getTime() - localTime.getTime()) / 1000;
      recordStartTime = localTime;
      fileSize = res.totalBytesExpectedToSend;

      if (
        timeDifference >= (ossManagerClass?.ossUploadConfig.uploadTimeScope ?? 0) &&
        res.progress < (ossManagerClass?.ossUploadConfig.uploadProgress ?? 0) &&
        !isStrategyStop.value &&
        uploadSpeed <= (ossManagerClass?.ossUploadConfig.uploadSpeed ?? 0)
      ) {
        console.info('[公共上传] 上传速度低于策略阈值，准备切换 OSS 通道', {
          上传进度: res.progress,
          已传字节: res.totalBytesSent,
          总字节: res.totalBytesExpectedToSend,
          已耗时秒: timeDifference
        });
        const { updateIsStrategyStop } = useStore('fileUpload');
        updateIsStrategyStop(true);
        if (uploadTask?.abort) uploadTask.abort();
        if (!isStrategyUploadExecuted) {
          isStrategyUploadExecuted = true;
          strategyUpload(
            filePath,
            primiFilePath,
            fileTypeNum,
            retryCount,
            formData,
            urlApi,
            resolve,
            reject,
            false,
            {
              localTime: recordStartTime,
              fileSize,
              ossManagerClass,
              isOld: false,
              uploadFileSize
            },
            itemSeq ?? undefined,
            ossManagerClass,
            errorStr
          );
        }
      }
    });
  });
};

/**
 * 切换到 OSS 策略上传。
 * 预签名字段完全透传后端返回结果，公共层不改字段名，只负责通道切换、日志和统一成功/失败回调。
 */
async function strategyUpload(
  filePath: string,
  primiFilePath: string,
  fileTypeNum: number,
  retryCount: number,
  formData: any,
  urlApi: string,
  resolve: any,
  reject: any,
  isfirst: boolean,
  logInfo: any,
  itemSeq?: number,
  ossManagerClass?: OssManagerClassType,
  errorStr?: string
) {
  console.info('[公共上传] 准备获取 OSS 预签名地址', {
    是否首次切换: isfirst,
    上传标识: ossManagerClass?.singleFileIdentity ?? ''
  });
  const lastSingleFileIdentity = ossManagerClass?.singleFileIdentity;
  ossManagerClass?.setSingleFileIdentity(0);
  const logFormData = {
    ...formData,
    singleFileIdentity: ossManagerClass?.singleFileIdentity,
    fileName: filePath,
    uploadType: 2,
    changeUploadData: {
      changeReasonCode: isfirst ? 1 : 2,
      changeParentSingleFileIdentity: lastSingleFileIdentity
    }
  };
  ossManagerClass?.saveOssUploadResultLog(logFormData, false);

  const ossUploadPreSignedObj: any = await ossManagerClass?.getOssUploadPreSignedUrl({
    ...formData,
    fileName: filePath
  });

  if (ossUploadPreSignedObj && ossUploadPreSignedObj.postUrl) {
    console.info('[公共上传] 已获取 OSS 预签名地址，开始上传文件', {
      fileId: ossUploadPreSignedObj.fileId || '',
      表单项序号: itemSeq ?? null
    });
    ossUploadPromise(
      filePath,
      primiFilePath,
      fileTypeNum,
      retryCount,
      {
        ...formData,
        fileId: ossUploadPreSignedObj.fileId
      },
      ossUploadPreSignedObj.postUrl,
      ossUploadPreSignedObj.postData,
      itemSeq,
      ossManagerClass,
      errorStr,
      resolve,
      reject
    );
    return;
  }

  let res: any;
  try {
    res = JSON.parse(ossUploadPreSignedObj.data || '{}');
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
    logInfo
  } as UploadSuccessContext);
}

/**
 * 阿里云 OSS 上传主链路。
 * 上传成功后仍通过旧回调协议回填 `fileId` / `filePath`，保证历史调用方无感知。
 */
function ossUploadPromise(
  filePath: string,
  primiFilePath: string,
  fileTypeNum: number,
  retryCount: number,
  formData: any,
  urlApi: string,
  ossFormData: any,
  itemSeq?: number,
  ossManagerClass?: OssManagerClassType,
  errorStr?: string,
  resolve?: any,
  reject?: any
) {
  const uploadFileAPI = urlApi;
  const localTime = new Date();
  let fileSize = 0;
  let uploadFileSize = 0;
  const errorObj = {
    err: '阿里云上传失败',
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
      isOld: false,
      uploadFileSize
    }
  } as UploadErrorContext;

  console.info('[公共上传] OSS 上传任务已创建', {
    上传地址: uploadFileAPI,
    附件类型: fileTypeNum,
    表单项序号: itemSeq ?? null,
    fileId: formData.fileId || ''
  });

  const uploadTask = uni.uploadFile({
    url: uploadFileAPI,
    filePath,
    name: 'file',
    formData: ossFormData,
    // #ifdef MP-WEIXIN
    timeout: 6000000,
    // #endif
    success: async (resData: any) => {
      if (resData.statusCode !== 200) {
        console.warn('[公共上传] OSS 上传返回非成功状态', {
          状态码: resData.statusCode,
          附件类型: fileTypeNum,
          表单项序号: itemSeq ?? null
        });
        uploadFileCBError(errorObj);
        return;
      }

      console.info('[公共上传] OSS 文件上传成功，准备轮询服务端同步结果', {
        附件类型: fileTypeNum,
        表单项序号: itemSeq ?? null,
        fileId: formData.fileId || ''
      });
      const res = await ossManagerClass?.loopSaveOssUploadPresignedFile({
        fileId: formData.fileId,
        fileSize
      });
      console.info('[公共上传] OSS 文件同步轮询完成', {
        同步结果: res,
        fileId: formData.fileId || ''
      });
      if (res === 1) {
        uploadFileCBSuccess({
          res: {
            fileId: formData.fileId
          },
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
            isOld: false,
            uploadFileSize
          }
        } as UploadSuccessContext);
      }
    },
    fail: (err) => {
      console.warn('[公共上传] OSS 上传请求失败', {
        附件类型: fileTypeNum,
        表单项序号: itemSeq ?? null,
        错误信息: err?.errMsg || ''
      });
      uploadFileCBError(errorObj);
    }
  });

  bindUploadTaskLifecycle(uploadTask, '[公共上传] OSS 上传任务', (res) => {
    fileSize = res.totalBytesExpectedToSend;
    uploadFileSize = res.totalBytesSent;
    errorObj.logInfo.fileSize = fileSize;
  });
}
