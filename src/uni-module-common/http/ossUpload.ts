/**
 * OSS 上传兼容出口。
 * 旧 fileUpload store 仍从这里导入 `newUploadFilePromise`，task-05 只把实现迁到 upload 层，不改原导入路径。
 */
export { newUploadFilePromise } from '@/uni-module-common/http/upload/strategy-upload';
