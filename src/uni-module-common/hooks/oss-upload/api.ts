import ajax from '@/uni-module-common/http';

/**
 *  获取文件上传的配置
 */
export function getOssUploadConfig(data: any) {
  return ajax({
    url: '/oss/file-config/get-upload-config',
    method: 'POST',
    data
  });
}
/**
 *  获取文件上传的预签名地址
 */
export function getOssUploadPreSignedUrl(data: any) {
  return ajax({
    url: '/oss/file-upload/get-presigned-url',
    method: 'POST',
    data
  });
}

/**
 *  获取文件上传的预签名地址
 */
export function saveOssUploadPresignedFile(data: any) {
  return ajax({
    url: '/oss/file-upload/save-presigned-file',
    method: 'POST',
    data
  });
}

/**
 *  获取批次上传的文件(各模块的业务逻辑)
 */
export function getOssssFileListByBatch(data: any) {
  return ajax({
    url: '/oss/file-upload/get-file-list-by-batch',
    method: 'POST',
    data
  });
}

// ------------------- 上传记录日志 -------------------
/**
 *  保存上传记录日志(上传前调用)
 */
export function saveOssUploadResultLogAPI(data: any) {
  return ajax({
    url: '/oss/file-upload/save-upload-result-log',
    method: 'POST',
    data
  });
}

/**
 *  更新上传记录日志(上传后调用)
 */
export function updateOssUploadResultLogAPI(data: any) {
  return ajax({
    url: '/oss/file-upload/update-upload-result-log',
    method: 'POST',
    data
  });
}
