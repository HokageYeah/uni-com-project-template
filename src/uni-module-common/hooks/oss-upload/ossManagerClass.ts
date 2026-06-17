import { v4 as uuidv4 } from 'uuid';
import {
  getOssUploadConfig,
  getOssUploadPreSignedUrl,
  getOssssFileListByBatch,
  saveOssUploadPresignedFile,
  saveOssUploadResultLogAPI,
  updateOssUploadResultLogAPI
} from './api';
import type { uploadConfigType } from './ossUploadType';
import { wxuuid } from '@/uni-module-common/utils/wxUuid';
class OssManagerClass {
  ossUploadConfig: uploadConfigType;
  moduleCode: string;
  fileUpload: any;
  fileIdentity: string;
  isNewUploadFile: boolean;
  singleFileIdentity: string; // 单个文件的唯一标识
  constructor(moduleCode: string, fileIdentity: string, isNewUploadFile: boolean) {
    this.ossUploadConfig = {} as uploadConfigType;
    this.moduleCode = moduleCode;
    this.fileIdentity = fileIdentity;
    this.fileUpload = useStore('fileUpload');
    this.isNewUploadFile = isNewUploadFile;
    this.singleFileIdentity = '';
  }

  // 设置单个文件的唯一标识
  setSingleFileIdentity(index: number) {
    // #ifdef MP-WEIXIN
    this.singleFileIdentity = wxuuid() + index;
    // #endif
    // #ifndef MP-WEIXIN
    this.singleFileIdentity = uuidv4() + index;
    //  #endif
  }

  // 获取上传配置
  async getOssUploadConfig() {
    try {
      if (this.isNewUploadFile) {
        const ossUploadConfig: any = await getOssUploadConfig({
          moduleCode: this.moduleCode
        });
        this.ossUploadConfig = ossUploadConfig;
      } else {
        this.ossUploadConfig = {
          moduleCode: this.moduleCode,
          uploadSpeed: 0,
          uploadTimeScope: 0,
          uploadProgress: 0,
          canChangeFlag: false
        };
      }
    } catch (error) {
      console.log('getOssUploadConfig--error--', error);
    }
  }

  // 获取oss文件上传的预签名地址
  async getOssUploadPreSignedUrl(data: any) {
    try {
      const ossUploadPreSignedUrl: any = await getOssUploadPreSignedUrl({
        moduleCode: this.moduleCode,
        ...data
      });
      return ossUploadPreSignedUrl;
    } catch (error) {
      console.log('getOssUploadPreSignedUrl--error--', error);
    }
  }

  // 轮训调用 保存经过预签名的文件数据接口， 查看服务端同步阿里云文件的进度
  loopSaveOssUploadPresignedFile(data: any) {
    return new Promise((resolve, reject) => {
      // 异步操作移到外部函数中
      const attemptUpload = async () => {
        try {
          const ossUploadPreSignedUrl: any = await saveOssUploadPresignedFile(data);
          // 状态  1 成功 2 生成中
          if (ossUploadPreSignedUrl.fileStatus === 1) {
            resolve(ossUploadPreSignedUrl.fileStatus);
          } else {
            // 状态不是1，递归调用继续尝试
            let intervalId: any = setTimeout(() => {
              clearTimeout(intervalId);
              intervalId = null;
              attemptUpload();
            }, 1000);
          }
        } catch (error) {
          resolve(1);
        }
      };
      attemptUpload();
    });
  }

  // 获取批次上传的文件(各模块的业务逻辑)
  async getOssssFileListByBatch(data: any) {
    const ossssssFileListByBatch: any = await getOssssFileListByBatch({
      ...data,
      moduleCode: this.moduleCode
    });
    return ossssssFileListByBatch;
  }

  // 保存上传记录日志(上传前调用)
  saveOssUploadResultLog(data: any, isold: boolean) {
    // 判断moduleCode 是否有值，isNewUploadFile是否为true 如果有值如果有则是新上传逻辑，需要日志记录，否则是老上传逻辑
    if (this.moduleCode && this.isNewUploadFile) {
      saveOssUploadResultLogAPI(data);
      if (isold) {
        console.log(
          '--------------------------------这是新的上传逻辑（非策略模式）日志保存--------------------------------'
        );
      } else {
        console.log(
          '--------------------------------这是新的上传逻辑（策略模式）日志保存--------------------------------'
        );
      }
    }
  }

  // 单位 Bytes转换为kb 1 KB = 1024 Bytes
  bytesToKb(bytes: number) {
    // 返回也是number
    return Number((bytes / 1024).toFixed(2));
  }

  // 更新上传记录日志(上传后调用)
  async updateOssUploadResultLog(
    formData: any,
    localTime: Date,
    uploadStatus: number, // 上传状态，1成功0失败2上传中
    fileSize: number,
    isold: boolean,
    // 上传的文件大小
    uploadFileSize: number,
    uploadErrorInfo?: string,
    fileId?: string
  ) {
    // 判断moduleCode 是否有值，isNewUploadFile是否为true 如果有值如果有则是新上传逻辑，需要日志记录，否则是老上传逻辑
    if (this.moduleCode && this.isNewUploadFile) {
      // 上传回掉后本地时间
      const localTimeAfter = new Date();
      // 计算这段时间 转换成秒
      const timeDifference = (localTimeAfter.getTime() - localTime.getTime()) / 1000;
      // 计算上传速度 按照字节来算
      const uploadSpeed = uploadFileSize / timeDifference;
      const uploadSpeedKb = this.bytesToKb(uploadFileSize) / timeDifference;
      console.log('updateOssUploadResultLog----uploadSpeed---', uploadSpeed);
      console.log('updateOssUploadResultLog----uploadSpeedKb---', uploadSpeedKb);
      console.log('updateOssUploadResultLog----uploadFileSize---', uploadFileSize);
      console.log('updateOssUploadResultLog----timeDifference---', timeDifference);
      console.log('updateOssUploadResultLog----localTimeAfter---', localTimeAfter);
      console.log('updateOssUploadResultLog----localTime---', localTime);
      // 上传日志
      const logFormData = {
        ...formData,
        singleFileIdentity: this.singleFileIdentity,
        uploadStatus,
        useTime: timeDifference * 1000,
        speed: uploadSpeed,
        uploadErrorInfo,
        fileId,
        fileSize
      };
      updateOssUploadResultLogAPI(logFormData);
      if (isold) {
        console.log(
          '--------------------------------这是新的上传逻辑（非策略模式）日志更新--------------------------------'
        );
      } else {
        console.log(
          '--------------------------------这是新的上传逻辑（策略模式）日志更新--------------------------------'
        );
      }
    }
  }
}

export default OssManagerClass;
