/**
 * 上传完成事件名。
 * 旧页面、上传 loading 组件和 fileUpload store 都会监听这个固定事件名，不能修改名称。
 */
export const uploadFilesCallBack = 'uploadFilesCallBack';

/**
 * 上传进度同步事件。
 * fileUpload store 会通过它更新上传进度与体积显示，因此暂时继续保留原事件名。
 */
export const uploadProgressEvent = 'unloadOnProgressUpdate';

/**
 * 当前上传任务同步事件。
 * 旧上传面板会监听它拿到上传任务实例，用于中断或展示上传状态。
 */
export const uploadTaskEvent = 'unloadOnUploadFile';

/**
 * 取消上传事件。
 * 当前普通上传、策略上传和 OSS 上传都统一监听它，避免调用方维护多套中断协议。
 */
export const cancelUploadEvent = 'cancelUpload';
