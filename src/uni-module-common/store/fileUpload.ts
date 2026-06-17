import { v4 as uuidv4 } from 'uuid';
import { natToUniFilesUpload, uniToNatFilesUpload } from '../utils/uniToNavProtocol';
import { uploadFilePromise, uploadFilesCallBack } from '../http';
import utils from '../utils';
import {
  canvasCompress,
  getFileInfoSync,
  getScalePercentage,
  isUniXFileCompress
} from '../utils/imageTools';
import { isIosMoreVersion } from '../utils/util';
import { videoCompress } from '../utils/videoTools';
import type {
  allHttpRequestFilesType,
  audioType,
  fileType,
  imageObjType,
  videoType
} from '@/uni-module-common/components/xxt-components/xxt-file-submit/xxtFileType';
import bridge from '@/uni-module-common/utils/uniToNativeBridge';
import { wxuuid } from '@/uni-module-common/utils/wxUuid';
import eventBus from '@/uni-module-common/utils/eventBus';
import OssManagerClass from '@/uni-module-common/hooks/oss-upload/ossManagerClass';
import type OssManagerClassType from '@/uni-module-common/hooks/oss-upload/ossManagerClass';
import { newUploadFilePromise } from '@/uni-module-common/http/ossUpload';
interface fileUpdateType {
  imageAry?: imageObjType[]; // 图片类型
  videoAry?: videoType[]; // 视频类型
  fileAry?: fileType[]; // 文件类型
  audioAry?: audioType[]; // 音频类型
  allHttpRequestFiles?: allHttpRequestFilesType;
  // 记录本地删除附件列表
  localDeleteFileList?: allHttpRequestFilesType;
  // 必须传递的附件 //  附件类型：1图片；2语音；3视频；4文件；5链接
  mustFilesType?: number[];
  currentIndex: number;
  shrinkRef: any; // 缩略图
  uploadUrlApi: string;
  uploadIndex: number; // 当前上传的文件索引
  uploadTask: any; // 上传任务
  progress: number; // 上传进度
  totalMBSent: string; // 上传mb
  totalMBExpectedToSend: string; // 总需要上传mb
  isNewUploadFile: boolean; // 是否走新的上传逻辑，默认走老的
  moduleCode: string; // 功能模块编码code
  ossManagerClass: OssManagerClassType | null; // oss上传管理类
  isStrategyStop: boolean; // 是否走阿里云策略上传
}
interface uploadResType {
  code: number;
  msg: string;
  fileIdentify: string;
}
type uploadFileType = imageObjType[] | videoType[] | audioType[] | fileType[];
type pathKeyType = 'fileAddress' | 'audioPath' | 'videoPath' | 'path';
interface fileProType {
  fileId: string;
  filePath: string;
  itemSeq?: number; // 兼容填表打卡，区分是第几项表单项
}
const fileUploadStore = defineStore({
  id: 'fileUpload',
  state: (): fileUpdateType => ({
    imageAry: [],
    videoAry: [],
    fileAry: [],
    audioAry: [],
    mustFilesType: [],
    currentIndex: 0,
    shrinkRef: null,
    allHttpRequestFiles: {},
    localDeleteFileList: {
      imageHttpAry: [], // 图片类型
      videoHttpAry: [], // 视频类型
      fileHttpAry: [], // 文件类型
      audioHttpAry: [] // 音频类型
    },
    // 需要支持多模块的上传地址不一样，这里传入地址，默认是任务中心的上传地址，这样任务中心可以不用改。
    uploadUrlApi: '',
    // 正在进行第几个附件上传
    uploadIndex: 0,
    // 当前上传的任务
    uploadTask: null,
    // 上传进度，用于上传中
    progress: 0,
    // 已经上传的文件大小 mb
    totalMBSent: '0MB',
    // 一共需要上传的文件大小 0MB
    totalMBExpectedToSend: '0MB',
    isNewUploadFile: false,
    moduleCode: '',
    ossManagerClass: null,
    isStrategyStop: false
  }),
  // 附件上传只需要上传本地附件、网络附件需要过滤掉。
  getters: {
    localImageAry(): imageObjType[] {
      console.log('updateUploadUrlApi-----localImageAry----', this.imageAry);
      return this.imageAry!.filter((item: imageObjType) => !item.isNetwork);
    },
    localVideoAry(): videoType[] {
      return this.videoAry!.filter((item: videoType) => !item.isNetwork);
    },
    localFileAry(): fileType[] {
      return this.fileAry!.filter((item: fileType) => !item.isNetwork);
    },
    localAudioAry(): audioType[] {
      return this.audioAry!.filter((item: audioType) => !item.isNetwork);
    }
  },
  actions: {
    updateShrinkRef(ref: any) {
      this.shrinkRef = ref;
      console.log('updateShrinkRef-----', this.shrinkRef);
    },
    updateImgAry(data: imageObjType[]) {
      this.imageAry = data;
    },
    updateVideoAry(data: videoType[]) {
      this.videoAry = data;
    },
    updateFileAry(data: fileType[]) {
      this.fileAry = data;
    },
    updateAudioAry(data: audioType[]) {
      this.audioAry = data;
    },
    updateAllHttpRequestFiles(data: allHttpRequestFilesType) {
      this.allHttpRequestFiles = data;
    },
    updateLocalDeleteFileList(data: allHttpRequestFilesType) {
      this.localDeleteFileList = data;
    },
    updateUploadUrlApi(url: string) {
      this.uploadUrlApi = url;
      this.updateIsNewUploadFile(false);
      console.log('updateUploadUrlApi-----123---', this.uploadUrlApi);
    },
    updateIsNewUploadFile(data: boolean) {
      this.isNewUploadFile = data;
    },
    updateModuleCode(data: string) {
      this.moduleCode = data;
    },
    updateIsStrategyStop(data: boolean) {
      this.isStrategyStop = data;
    },
    updateMustFilesType(data: number[]) {
      this.mustFilesType = data;
    },
    clearAllFilesCache() {
      this.imageAry = [];
      this.videoAry = [];
      this.fileAry = [];
      this.audioAry = [];
      this.allHttpRequestFiles = {};
      this.localDeleteFileList = {
        imageHttpAry: [], // 图片类型
        videoHttpAry: [], // 视频类型
        fileHttpAry: [], // 文件类型
        audioHttpAry: [] // 音频类型
      };
    },
    clearOtherData() {
      // 默认改回任务中心的上传地址
      this.uploadUrlApi = '';
      this.mustFilesType = [];
      console.log('updateUploadUrlApi-----clearAllFilesCache---', this.uploadUrlApi);
    },
    uploadAllFilesApp() {
      const imageAry = this.imageAry?.map((item) => item.path);
      const videoAry = this.videoAry?.map((item) => item.videoPath);
      const fileAry = this.fileAry?.map((item) => item.fileAddress);
      if (imageAry?.length || videoAry?.length || fileAry?.length) {
        bridge
          .sendNativeEvent(uniToNatFilesUpload, { imageAry, videoAry, fileAry })
          .then((res: any) => {
            const restype = res as uploadResType;
            if (restype.code === 1) {
              this.clearAllFilesCache();
            }
            uni.$emit(natToUniFilesUpload, restype);
          });
      }
    },
    async aiCompressImage(fileObjAry: uploadFileType) {
      console.log('updateShrinkRef--fileObjAry-compressImage--', fileObjAry);

      // 工具函数：将字节转换为MB（保留两位小数）
      const bytesToMB = (bytes: number): number => {
        return parseFloat((bytes / (1024 * 1024)).toFixed(2));
      };

      const imgary: any[] | PromiseLike<any[]> = [];
      // uni自带的压缩api uni.compressImage(OBJECT)
      const uniCompressImage = async (imagePath: string) => {
        // 将百分比转换为字符串并输出
        const percentageString = await getScalePercentage(imagePath);
        console.log('updateShrinkRef--percentageString--', percentageString);
        return new Promise<string>((resolve, reject) => {
          uni.compressImage({
            src: imagePath,
            quality: 50,
            width: percentageString,
            height: percentageString,
            success: (res) => {
              console.log('updateShrinkRef--uniCompressImage--', res.tempFilePath);
              resolve(res.tempFilePath);
            },
            fail: (res) => {
              resolve(imagePath);
              console.log('updateShrinkRef--uniCompressImage--fail--', res);
            }
          });
        });
      };

      for (const item of fileObjAry) {
        const imgItem = item as imageObjType;
        console.log('updateShrinkRef--item.imgPath--', imgItem.path);
        try {
          console.log('updateShrinkRef--进入了---');
          // 获取图片大小（单位：字节）
          const fileSize = imgItem.size || 0;
          const fileSizeMB = bytesToMB(fileSize);
          console.log(`图片大小: ${fileSizeMB}MB`);

          // 判断是否大于1.5M
          if (fileSizeMB > 1.5) {
            console.log('图片大于1.5M，调用this.compressImage处理');
            try {
              console.log('updateShrinkRef--进入了---');
              imgItem.path = await uniCompressImage(imgItem.path);
              // #ifdef MP-WEIXIN
              imgItem.path = await this.isCompressMoreThan300kb(imgItem.path);
              // #endif
            } catch (error) {
              console.log('updateShrinkRef--error---', error);
              utils.toast({ title: '图片压缩失败' });
            }
          } else {
            // 小于等于1.5M时不压缩，保留原始路径
            console.log('图片小于等于1.5M，不进行压缩');
          }
        } catch (error) {
          console.log('updateShrinkRef--error---', error);
          utils.toast({ title: '图片处理失败' });
          // 出错时仍保留原始图片
          imgary.push(imgItem);
        }
        console.log('updateShrinkRef--item.imgPath-after--', imgItem.path);
        imgary.push(imgItem);
        console.log('图片压缩保存12--imgary---', imgary);
      }

      return imgary;
    },
    // 图片压缩
    async compressImage(fileObjAry: uploadFileType) {
      console.log('updateShrinkRef--fileObjAry-compressImage--', fileObjAry);
      // 使用l-shrink这个压缩插件进行压缩
      // const imgary = [];
      // for (const item of fileObjAry) {
      //   const imgItem = item as imageObjType;
      //   console.log('updateShrinkRef--item.imgPath--', imgItem.path);
      //   console.log('updateShrinkRef--this.shrinkRef.value--', this.shrinkRef.value);
      //   console.log('updateShrinkRef--this.shrinkRef--', this.shrinkRef);
      //   console.log(
      //     'updateShrinkRef--this.shrinkRef.compressImage--',
      //     this.shrinkRef.compressImage
      //   );
      //   try {
      //     imgItem.path = await this.shrinkRef.compressImage(imgItem.path, {
      //       quality: 75
      //     });
      //     uni.saveImageToPhotosAlbum({
      //       filePath: imgItem.path,
      //       success() {
      //         utils.toast({ title: '图片保存成功' });
      //         console.log('updateShrinkRef--compressImage----图片保存成');
      //       },
      //       fail() {
      //         utils.toast({ title: '图片保存失败' });
      //         console.log('updateShrinkRef--compressImage----图片保存失败');
      //       }
      //     });
      //   } catch (error) {
      //     console.log('updateShrinkRef--error---', error);
      //   }
      //   console.log('updateShrinkRef--item.imgPath-after--', imgItem.path);

      //   imgary.push(imgItem);
      // }
      // console.log('updateShrinkRef--imgary--', imgary);
      // return imgary;

      // 自己写的压缩进行压缩
      // console.log('updateShrinkRef--fileObjAry--', fileObjAry);
      // const imgary = [];
      // for (const item of fileObjAry) {
      //   const imgItem = item as imageObjType;
      //   console.log('updateShrinkRef--item.imgPath--', imgItem.path);
      //   console.log('updateShrinkRef--this.shrinkRef.value--', this.shrinkRef.value);
      //   console.log('updateShrinkRef--this.shrinkRef--', this.shrinkRef);
      //   console.log(
      //     'updateShrinkRef--this.shrinkRef.compressImage--',
      //     this.shrinkRef.compressImage
      //   );
      //   const fileExtension = imgItem.path.split('.').pop();
      //   console.log('updateShrinkRef--this.shrinkRef-fileExtension--', fileExtension);
      //   try {
      //     console.log('updateShrinkRef--进入了---');
      //     imgItem.path = await this.shrinkRef.start(imgItem.path, {
      //       pixels: 4000000, // 最大分辨率，默认二百万
      //       quality: 0.6, // 压缩质量，默认0.8
      //       type: fileExtension, // 图片类型，默认jpg
      //       base64: false, // 是否返回base64，默认false，非H5有效
      //       width: 1080,
      //       height: 1440
      //     });
      //     uni.saveImageToPhotosAlbum({
      //       filePath: imgItem.path,
      //       success() {
      //         utils.toast({ title: '图片保存成' });
      //         console.log('updateShrinkRef-----图片保存成');
      //       }
      //     });
      //   } catch (error) {
      //     console.log('updateShrinkRef--error---', error);
      //     utils.toast({ title: '图片压缩失败' });
      //   }
      //   console.log('updateShrinkRef--item.imgPath-after--', imgItem.path);

      //   imgary.push(imgItem);
      // }
      // return imgary;

      // uni自带的压缩api uni.compressImage(OBJECT)
      const uniCompressImage = async (imagePath: string, size: number) => {
        // 将百分比转换为字符串并输出
        const percentageString = await getScalePercentage(imagePath);
        const isCompress = await isUniXFileCompress(imagePath, size);
        console.log('updateShrinkRef--percentageString--', percentageString);
        return new Promise<string>((resolve, reject) => {
          if (isCompress) {
            uni.compressImage({
              src: imagePath,
              quality: 80,
              width: percentageString,
              height: percentageString,
              success: (res) => {
                console.log('updateShrinkRef--uniCompressImage--', res.tempFilePath);
                resolve(res.tempFilePath);
              },
              fail: (res) => {
                resolve(imagePath);
                console.log('updateShrinkRef--uniCompressImage--fail--', res);
              }
            });
          } else {
            resolve(imagePath);
          }
        });
      };
      console.log('updateShrinkRef--fileObjAry--', fileObjAry);
      const imgary = [];
      for (const item of fileObjAry) {
        const imgItem = item as imageObjType;
        console.log('updateShrinkRef--item.imgPath--', imgItem.path);
        // console.log('updateShrinkRef--this.shrinkRef.value--', this.shrinkRef.value);
        // console.log('updateShrinkRef--this.shrinkRef--', this.shrinkRef);
        // console.log(
        //   'updateShrinkRef--this.shrinkRef.compressImage--',
        //   this.shrinkRef.compressImage
        // );
        console.log('updateShrinkRef--uniCompressImage--');
        const fileExtension = imgItem.path.split('.').pop();
        console.log('updateShrinkRef--this.shrinkRef-fileExtension--', fileExtension);
        try {
          console.log('updateShrinkRef--进入了---');
          imgItem.path = await uniCompressImage(imgItem.path, imgItem.size || 0);

          // 如果是微信小程序，则图片压缩还需要走下面的流程
          // #ifdef MP-WEIXIN
          imgItem.path = await this.isCompressMoreThan300kb(imgItem.path);
          // #endif

          // uni.saveImageToPhotosAlbum({
          //   filePath: imgItem.path,
          //   success() {
          //     utils.toast({ title: '图片保存成' });
          //     console.log('updateShrinkRef-----图片保存成');
          //   }
          // });
        } catch (error) {
          console.log('updateShrinkRef--error---', error);
          utils.toast({ title: '图片压缩失败' });
        }
        console.log('updateShrinkRef--item.imgPath-after--', imgItem.path);

        imgary.push(imgItem);
      }
      return imgary;
    },
    // #ifdef MP-WEIXIN
    // 判断压缩后是否大于300kb
    async isCompressMoreThan300kb(imagePath: string) {
      try {
        const fileInfo = await getFileInfoSync(imagePath);
        const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2); // 转换为 MB
        console.log('updateShrinkRef--sizeMB--', sizeMB);
        let image = null;
        // 300kb 以下不压缩
        if (Number(sizeMB) > 0.3) {
          image = await canvasCompress(fileInfo.imagePath, 'myCanvas');
        }
        if (image && image.status) {
          // 第二步压缩成功后获取文件信息, 主要拿文件大小, 服务端需要
          const fileInfo = await getFileInfoSync(image.imagePath);
          // 后续日志需要方开下面注释
          // const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2); // 转换为 MB
          // // 文件名字
          // const position = fileInfo.imagePath.lastIndexOf(
          //   '/',
          //   fileInfo.imagePath.lastIndexOf('/') - 1
          // );
          // const fileName = fileInfo.imagePath.substring(position + 1, fileInfo.imagePath.length);
          return fileInfo.imagePath;
        } else {
          return imagePath;
        }
      } catch (error) {
        console.log('updateShrinkRef--error---', error);
        return imagePath;
      }
    },
    // #endif
    // 视频压缩
    async compressVideo(fileObjAry: uploadFileType) {
      const videoAry = [];
      for (const item of fileObjAry) {
        const videoItem = item as videoType;
        try {
          console.log('updateShrinkRef--进入了---');
          const videoFileInfo = await videoCompress(videoItem.videoPath, 80);
          videoItem.videoSize = videoFileInfo.videoSize;
          videoItem.videoPath = videoFileInfo.videoPath;
        } catch (error) {
          console.log('updateShrinkRef--error---', error);
          utils.toast({ title: '视频压缩失败' });
        }
        videoAry.push(videoItem);
      }
      return videoAry;
    },
    async checkFilesSize(fileObjAry: (imageObjType | videoType | audioType | fileType)[]) {
      const fileSizePromise = [];
      for (let i = 0; i < fileObjAry.length; i++) {
        const el = fileObjAry[i];
        const fileType = el?.fileType;
        console.log('updateShrinkRef--fileType--', fileType);
        // filetype: 0 是链接。 1 是docx、pdf、ppt、txt
        if (fileType !== 'undefined' && fileType === 0) {
          // 证明是一个链接，不需要考虑他的大小，跳过本次循环
          continue;
        }
        fileSizePromise.push(
          new Promise<number>((resolve, reject) => {
            const tmpFilePath = el?.path || el?.videoPath || el?.audioPath || el?.fileAddress;
            uni.getFileInfo({
              filePath: tmpFilePath,
              success: (res) => {
                resolve(res.size);
              },
              fail: (err) => {
                console.log('updateShrinkRef--err--', err);
                reject(err);
              }
            });
          })
        );
      }
      return await Promise.all(fileSizePromise).then((res) => {
        console.log('updateShrinkRef--res--', res);
        let emptyFileFlag = false;
        res.forEach((e) => {
          if (e < 500) {
            // 小于 500b 的文件认为是空壳文件（无文件体）
            emptyFileFlag = true;
          }
        });
        return !emptyFileFlag;
      });
    },
    // 下面的代码是并发上传请求逻辑
    // async uploadDiffFiles(
    //   fileTypeNum: number,
    //   fileObjAry: uploadFileType,
    //   uuid: string,
    //   arryIndex: number
    // ) {
    //   // 深拷贝
    //   const newfileObjAryDeepCopy = JSON.parse(JSON.stringify(fileObjAry));
    //   // 如果fileTypeNum 是1 ，则是图片，先对图片进行压缩。
    //   // 已经使用imagetools工具压缩过图片了不需要在压缩
    //   if (fileTypeNum === 1 && isIosMoreVersion(316)) {
    //     // 首先压缩图片
    //     const fileObjAryDeepCopy: imageObjType[] = JSON.parse(JSON.stringify(fileObjAry));
    //     console.log('updateShrinkRef--fileObjAryDeepCopy--', fileObjAryDeepCopy);
    //     const imageUploadAry = await this.compressImage(fileObjAryDeepCopy);
    //     console.log('updateShrinkRef--imageUploadAry--', imageUploadAry);
    //     fileObjAry = imageUploadAry;
    //   }
    //   // #ifdef MP-WEIXIN
    //   // 如果是微信小程序择需要对视频进行压缩上传。app自带压缩
    //   if (fileTypeNum === 3) {
    //     const fileObjAryDeepCopy: videoType[] = JSON.parse(JSON.stringify(fileObjAry));
    //     const videoUploadAry = await this.compressVideo(fileObjAryDeepCopy);
    //     fileObjAry = videoUploadAry;
    //   }
    //   // #endif
    //   // 视频大小如果超过100M则不上传，给出提示
    //   if (fileTypeNum === 3) {
    //     const arryIndex = (fileObjAry as videoType[]).findIndex((item) => {
    //       console.log(
    //         'updateShrinkRef--item.videoSize--fileTypeNum---',
    //         item.videoSize && item.videoSize / 1024 / 1024
    //       );
    //       return item.videoSize && item.videoSize / 1024 / 1024 > 100;
    //     });
    //     console.log('updateShrinkRef--arryIndex--fileTypeNum---', arryIndex);
    //     console.log('updateShrinkRef--fileObjAry--fileTypeNum---', fileObjAry);
    //     if (arryIndex !== -1) {
    //       // utils.toast({ title: `所选第${arryIndex + 1}个视频大小超过100M，请重新选择视频` });
    //       return new Promise((resolve, reject) => {
    //         const err = new Error(`所选的第${arryIndex + 1}个视频大小超过100M，请重新选择`);
    //         reject(err);
    //       });
    //     }
    //   }
    //   console.log('updateShrinkRef--开始上传了', fileObjAry);
    //   const promises = fileObjAry.map((item, index) => {
    //     const defultFormData = {
    //       fileIdentity: uuid,
    //       fileType: fileTypeNum,
    //       fileSeq: index + 1 + arryIndex
    //     };
    //     const deepCloneItem = newfileObjAryDeepCopy[index];
    //     let formData = {};
    //     let filePaths = '';
    //     let primiFilePath = '';
    //     // 附件类型：1图片；2语音；3视频；4文件；5链接
    //     switch (fileTypeNum) {
    //       case 1:
    //         formData = { ...defultFormData };
    //         filePaths = (<imageObjType>item).path;
    //         primiFilePath = (<imageObjType>deepCloneItem).path;
    //         break;
    //       case 2:
    //         formData = { ...defultFormData, fileParam: (<audioType>item).audioTimeNum };
    //         filePaths = (<audioType>item).audioPath;
    //         primiFilePath = (<audioType>deepCloneItem).audioPath;
    //         break;
    //       case 3:
    //         formData = {
    //           ...defultFormData,
    //           fileParam: (<videoType>item).videoDuration,
    //           'Content-Type': 'video/mp4'
    //         };
    //         filePaths = (<videoType>item).videoPath;
    //         primiFilePath = (<videoType>deepCloneItem).videoPath;
    //         break;
    //       case 4:
    //         // 如果fileName为空则不上传, 有的话则linkName有值
    //         formData = { ...defultFormData, linkName: (<fileType>item).fileName };
    //         filePaths = (<fileType>item).fileAddress;
    //         primiFilePath = (<fileType>deepCloneItem).fileAddress;
    //         break;
    //       case 5:
    //         formData = {
    //           ...defultFormData,
    //           linkUrl: (<fileType>item).fileAddress,
    //           linkName: (<fileType>item).fileName
    //         };
    //         filePaths = '';
    //         // 创建一个空文件 避免filePaths 为空在小程序端传不上去
    //         // #ifdef MP-WEIXIN
    //         filePaths = createEmptyFile();
    //         // #endif
    //         primiFilePath = (<fileType>item).fileAddress;
    //         break;

    //       default:
    //         break;
    //     }
    //     console.log('updateUploadUrlApi-----uploadDiffFiles----', this.uploadUrlApi);
    //     // 取消3次失败重试
    //     return uploadFilePromise(
    //       filePaths,
    //       primiFilePath,
    //       fileTypeNum,
    //       1,
    //       formData,
    //       this.uploadUrlApi,
    //       item.itemSeq
    //     );
    //   });
    //   return Promise.race([
    //     Promise.all(promises),
    //     // 超时处理
    //     new Promise((resolve, reject) => {
    //       const id = setTimeout(() => {
    //         clearTimeout(id);
    //         reject(new Error('附件上传请求超时'));
    //       }, 60000);
    //     })
    //   ]);
    // },
    async uploadDiffFiles(
      fileTypeNum: number,
      fileObjAry: uploadFileType,
      uuid: string,
      arryIndex: number,
      compressImageType = true
    ) {
      console.log('updateShrinkRef--fileObjAry--', fileObjAry);
      console.log('走到这uploadDiffFiles', compressImageType);
      // 附件类型：1图片；2语音；3视频；4文件；5链接
      const loadingStr: any = {
        1: '图片压缩中...',
        2: '语音压缩中...',
        3: '视频压缩中...',
        4: '文件压缩中...',
        5: '附件压缩中...'
      };
      uni.showLoading({ title: loadingStr[fileTypeNum] });
      // 深拷贝
      const newfileObjAryDeepCopy = JSON.parse(JSON.stringify(fileObjAry));
      // 如果fileTypeNum 是1 ，则是图片，先对图片进行压缩。
      // 已经使用imagetools工具压缩过图片了不需要在压缩
      if (fileTypeNum === 1 && isIosMoreVersion(316)) {
        // 首先压缩图片
        const fileObjAryDeepCopy: imageObjType[] = JSON.parse(JSON.stringify(fileObjAry));
        console.log('updateShrinkRef--fileObjAryDeepCopy--', fileObjAryDeepCopy);
        // const imageUploadAry = await this.compressImage(fileObjAryDeepCopy);
        // const imageUploadAry = fileObjAryDeepCopy;
        console.log('走了这走在了');
        if (compressImageType) {
          const imageUploadAry = await this.compressImage(fileObjAryDeepCopy);
          console.log('updateShrinkRef--imageUploadAry--', imageUploadAry);
          fileObjAry = imageUploadAry;
        } else {
          console.log('AI上传图片压缩新逻辑');
          const imageUploadAry = await this.aiCompressImage(fileObjAryDeepCopy);
          console.log('updateShrinkRef--imageUploadAry--', imageUploadAry);
          fileObjAry = imageUploadAry;
        }
      }
      // #ifdef MP-WEIXIN
      // 如果是微信小程序择需要对视频进行压缩上传。app自带压缩
      if (fileTypeNum === 3) {
        const fileObjAryDeepCopy: videoType[] = JSON.parse(JSON.stringify(fileObjAry));
        const videoUploadAry = await this.compressVideo(fileObjAryDeepCopy);
        fileObjAry = videoUploadAry;
        console.log('updateShrinkRef--videoUploadAry--', videoUploadAry[0]);
      }
      // #endif
      // 视频大小如果超过100M则不上传，给出提示
      if (fileTypeNum === 3) {
        const arryIndex = (fileObjAry as videoType[]).findIndex((item) => {
          console.log(
            'updateShrinkRef--item.videoSize--fileTypeNum---',
            item.videoSize && item.videoSize / 1024 / 1024
          );
          return item.videoSize && item.videoSize / 1024 / 1024 > 100;
        });
        console.log('updateShrinkRef--arryIndex--fileTypeNum---', arryIndex);
        console.log('updateShrinkRef--fileObjAry--fileTypeNum---', fileObjAry);
        if (arryIndex !== -1) {
          // utils.toast({ title: `所选第${arryIndex + 1}个视频大小超过100M，请重新选择视频` });
          return new Promise((resolve, reject) => {
            const err = new Error(`所选的第${arryIndex + 1}个视频大小超过100M，请重新选择`);
            reject(err);
          });
        }
      }
      console.log('updateShrinkRef--开始上传了', fileObjAry);
      const promiseAry: any[] = [];
      for (let index = 0; index < fileObjAry.length; index++) {
        // 每个上传的文件生成一个唯一标识, 上传日志需要使用
        this.ossManagerClass?.setSingleFileIdentity(index);
        const item = fileObjAry[index];
        console.log('updateShrinkRef--item--', item);
        const defultFormData = {
          fileIdentity: uuid,
          fileType: fileTypeNum,
          fileSeq: index + 1 + arryIndex,
          moduleCode: this.moduleCode, // 新增oss上传的时候要用的moduleCode
          singleFileIdentity: this.ossManagerClass?.singleFileIdentity // 单个文件的唯一标识，上传日志需要使用
        };
        const deepCloneItem = newfileObjAryDeepCopy[index];
        let formData = {};
        let filePaths = '';
        let primiFilePath = '';
        // 附件类型：1图片；2语音；3视频；4文件；5链接
        switch (fileTypeNum) {
          case 1:
            formData = { ...defultFormData };
            filePaths = (<imageObjType>item).path;
            primiFilePath = (<imageObjType>deepCloneItem).path;
            break;
          case 2:
            formData = { ...defultFormData, fileParam: (<audioType>item).audioTimeNum };
            filePaths = (<audioType>item).audioPath;
            primiFilePath = (<audioType>deepCloneItem).audioPath;
            break;
          case 3:
            formData = {
              ...defultFormData,
              fileParam: (<videoType>item).videoDuration,
              'Content-Type': 'video/mp4'
            };
            filePaths = (<videoType>item).videoPath;
            primiFilePath = (<videoType>deepCloneItem).videoPath;
            break;
          case 4:
            // 如果fileName为空则不上传, 有的话则linkName有值
            formData = { ...defultFormData, linkName: (<fileType>item).fileName };
            filePaths = (<fileType>item).fileAddress;
            primiFilePath = (<fileType>deepCloneItem).fileAddress;
            break;
          case 5:
            formData = {
              ...defultFormData,
              linkUrl: (<fileType>item).fileAddress,
              linkName: (<fileType>item).fileName
            };
            filePaths = '';
            // 创建一个空文件 避免filePaths 为空在小程序端传不上去
            // #ifdef MP-WEIXIN
            filePaths = createEmptyFile();
            // #endif
            primiFilePath = (<fileType>item).fileAddress;
            break;

          default:
            break;
        }
        // 隐藏压缩中loading
        uni.hideLoading();
        // 取消3次失败重试，改为串行请求
        try {
          console.log('updateUploadUrlApi-----uploadDiffFiles----uploadUrlApi', this.uploadUrlApi);
          eventBus.on('unloadOnProgressUpdate', (data: any) => {
            console.log(`onProgressUpdate---上传进度---data${data.progress}%`);
            // 此处代码是为了防止上传任务中断，导致上传进度还在更新
            if (this.uploadTask == null) {
              return;
            }
            const { progress, totalBytesSent, totalBytesExpectedToSend } = data;
            this.progress = progress;
            // 转换成mb 保留两位小数
            this.totalMBSent = this.formatBytes(totalBytesSent);
            this.totalMBExpectedToSend = this.formatBytes(totalBytesExpectedToSend);
            console.log(
              `onProgressUpdate---已经上传的数据长度totalBytesSent---${this.totalMBSent}`
            );
            console.log(
              `onProgressUpdate---预期需要上传的数据总长度totalBytesExpectedToSend---${this.totalMBExpectedToSend}`
            );
          });
          eventBus.on('unloadOnUploadFile', (data: any) => {
            console.log('unloadOnUploadFile----fileupload--data--', data);
            this.uploadTask = data.uploadTask;
          });
          this.uploadIndex += 1;
          // 走老的上传处理逻辑
          console.log(
            'updateUploadUrlApi-----uploadDiffFiles----this.ossManagerClass----',
            this.ossManagerClass
          );
          console.log(
            'updateUploadUrlApi-----uploadDiffFiles----this.ossManagerClass.ossUploadConfig.canChangeFlag----',
            this.ossManagerClass?.ossUploadConfig.canChangeFlag
          );
          // debugger;
          console.log(
            'updateUploadUrlApi-----uploadDiffFiles----this.ossManagerClass.isNewUploadFile----',
            this.ossManagerClass?.isNewUploadFile
          );
          // 新老上传策略都需要日志上传
          if (this.moduleCode) {
            let cleanUrl = this.uploadUrlApi;
            // 1. 清除已有 m 参数（格式：?m=xxx 或 &m=xxx）
            cleanUrl = cleanUrl.replace(/([?&])m=[^&]*&?/, (match, p1) => {
              return match.endsWith('&') ? p1 : ''; // 若末尾有 &，保留连接符；否则清空
            });
            // 2. 清除已有 f 参数
            cleanUrl = cleanUrl.replace(/([?&])f=[^&]*&?/, (match, p1) => {
              return match.endsWith('&') ? p1 : '';
            });
            // 3. 清除可能残留的末尾 &（如 URL 最后是 &m=xxx）
            cleanUrl = cleanUrl.replace(/&$/, '');
            // 4. 拼接新的 m 和 f 参数
            this.uploadUrlApi = cleanUrl.includes('?')
              ? `${cleanUrl}&m=${this.moduleCode}&f=${fileTypeNum}`
              : `${cleanUrl}?m=${this.moduleCode}&f=${fileTypeNum}`;
          }
          if (
            !this.ossManagerClass?.ossUploadConfig.canChangeFlag ||
            !this.ossManagerClass.isNewUploadFile
          ) {
            const raceRes = await Promise.race([
              uploadFilePromise(
                filePaths,
                primiFilePath,
                fileTypeNum,
                0,
                formData,
                this.uploadUrlApi,
                item.itemSeq,
                this.ossManagerClass as unknown as OssManagerClassType
              ),
              // 超时处理
              new Promise((resolve, reject) => {
                const id = setTimeout(() => {
                  clearTimeout(id);
                  reject(new Error('附件上传请求超时'));
                }, 600000);
              })
            ]);
            this.resetProgress();
            promiseAry.push(raceRes);
            console.log('updateUploadUrlApi-----uploadDiffFiles----resolve---raceRes---', raceRes);
            console.log(
              'updateUploadUrlApi-----uploadDiffFiles----resolve---uploadIndex---',
              this.uploadIndex
            );
          } else {
            // 走新的上传处理逻辑
            const raceRes = await Promise.race([
              newUploadFilePromise(
                filePaths,
                primiFilePath,
                fileTypeNum,
                0,
                formData,
                this.uploadUrlApi,
                item.itemSeq,
                this.ossManagerClass
              ),
              // 超时处理
              new Promise((resolve, reject) => {
                const id = setTimeout(() => {
                  clearTimeout(id);
                  reject(new Error('附件上传请求超时'));
                }, 600000);
              })
            ]);
            this.resetProgress();
            promiseAry.push(raceRes);
            console.log(
              'updateUploadUrlApi-----uploadDiffFiles----resolve---raceRes---newUploadFilePromiseewUploadFilePromise',
              raceRes
            );
            console.log(
              'updateUploadUrlApi-----uploadDiffFiles----resolve---uploadIndex---newUploadFilePromise',
              this.uploadIndex
            );
          }
          // 如果最后一个上传成功则返回 正确的primise
          if (index === fileObjAry.length - 1) {
            console.log(
              'updateUploadUrlApi-----uploadDiffFiles----resolve---promiseAry---',
              promiseAry
            );
            return Promise.resolve(promiseAry);
          }
        } catch (error) {
          this.resetProgress();
          console.log('updateUploadUrlApi-----uploadDiffFiles----error---', error);
          return Promise.reject(error);
        }
      }
    },
    // 一个文件上传完成后，重制进度、总大小等等
    resetProgress() {
      console.log('updateUploadUrlApi-----uploadFileAPI------resetProgress----', this.uploadTask);
      // #ifdef APP-PLUS || APP
      if (this.uploadTask) {
        this.uploadTask.abort();
        this.uploadTask = null;
      }
      // #endif
      this.progress = 0;
      this.totalMBSent = '0MB';
      this.totalMBExpectedToSend = '0MB';
      console.log(
        'updateUploadUrlApi-----resetProgress---',
        this.uploadTask,
        this.totalMBSent,
        this.totalMBExpectedToSend
      );
    },
    checkMustFilesType(fileType: number) {
      let showStr = '';
      let isMust = false;
      if (fileType === 1 && this.imageAry!.length === 0) {
        showStr = '请上传图片';
        isMust = true;
      } else if (fileType === 2 && this.audioAry!.length === 0) {
        showStr = '请上传语音';
        isMust = true;
      } else if (fileType === 3 && this.videoAry!.length === 0) {
        showStr = '请上传视频';
        isMust = true;
      } else if (fileType === 4) {
        const filessAry = this.fileAry?.filter((item) => item.fileType !== 0);
        if (!filessAry || filessAry.length === 0) {
          showStr = '请上传文件';
          isMust = true;
        }
      } else if (fileType === 5) {
        const linkAry = this.fileAry?.filter((item) => item.fileType === 0);
        if (!linkAry || linkAry.length === 0) {
          showStr = '请上传链接';
          isMust = true;
        }
      }
      if (isMust) {
        uni.showToast({
          title: showStr,
          icon: 'none',
          duration: 2000
        });
      }
      return isMust;
    },
    async uploadAllFilesUni(fileIdentity = '', compressImageType = true) {
      console.log('阿里上传策略压缩状态传递', compressImageType);
      // 重置阿里云策略上传
      this.updateIsStrategyStop(false);
      console.log('uploadAllFilesUni--this.isNewUploadFile--', this.isNewUploadFile);
      // 如果是新的上传策略 则走新的上传逻辑
      // 创建oss上传管理类，并且将moduleCode、fileIdentity、isNewUploadFile传入管理类进行管理
      await this.newUploadProcessing(fileIdentity);
      console.log('uploadAllFilesUni--this.ossManagerClass--', this.ossManagerClass);
      // 上传逻辑
      this.uploadProcessing(fileIdentity, compressImageType);
    },
    // 新的上传逻辑
    async newUploadProcessing(fileIdentity = '') {
      // 创建oss上传管理类
      this.ossManagerClass = new OssManagerClass(
        this.moduleCode,
        fileIdentity,
        this.isNewUploadFile
      ) as unknown as OssManagerClassType;
      // 初始化后的时候获取上传配置
      await this.ossManagerClass.getOssUploadConfig();
    },
    // 上传业务处理逻辑
    async uploadProcessing(fileIdentity = '', compressImageType = true) {
      console.log(
        'updateUploadUrlApi-----uploadDiffFiles----uploadAllFilesUni---',
        this.uploadUrlApi
      );
      console.log('走到这uploadProcessing ', compressImageType);
      this.uploadIndex = 0;
      // 设置一个附件类型对象
      // 附件类型：1图片；2语音；3视频；4文件；5链接
      const fileObj: { [key: number]: fileProType[] } = {
        1: [],
        2: [],
        3: [],
        4: [],
        5: []
      };
      const ismustFilesType: any = this.mustFilesType?.some((item) => {
        return this.checkMustFilesType(item);
      });
      // 上传前必须教研是否有必传项， 且必传项不能为空
      if (ismustFilesType) {
        return;
      }
      console.log('fileupload--localImageAry--', this.localImageAry, this.localImageAry.length);
      if (
        this.localImageAry?.length ||
        this.localVideoAry?.length ||
        this.localFileAry?.length ||
        this.localAudioAry?.length
      ) {
        console.log('fileupload--开始上传了--', this.localImageAry, this.localVideoAry);
        const checkFileSizePass = await this.checkFilesSize([
          ...this.localImageAry,
          ...this.localVideoAry,
          ...this.localFileAry,
          ...this.localAudioAry
        ]);
        console.log('updateShrinkRef--checkFileSize--', checkFileSizePass);
        console.log('updateShrinkRef--checkFileSize--localImageAry--', this.localImageAry);
        if (!checkFileSizePass) {
          // uni.hideLoading();
          uni.showToast({
            title: `所选文件中含有空文件，请重新选择`,
            icon: 'none',
            duration: 3000
          });
          return;
        }
        let randomUUID: string;
        console.log('fileupload--fileIdentity--', fileIdentity);
        if (fileIdentity.length > 0) {
          randomUUID = fileIdentity;
        } else {
          // #ifdef MP-WEIXIN
          randomUUID = wxuuid();
          // #endif
          // #ifndef MP-WEIXIN
          randomUUID = uuidv4();
          //  #endif
        }
        console.log('fileupload--randomUUID--', randomUUID);
        console.log('fileupload--localImageAry--', this.localImageAry);

        // 附件类型：1图片；2语音；3视频；4文件；5链接
        this.uploadDiffFiles(
          1,
          this.localImageAry as imageObjType[],
          randomUUID,
          0,
          compressImageType
        )
          .then((res) => {
            if (typeof res === 'object') {
              console.log('mapFileIds--', res);
              fileObj[1] = res as fileProType[];
              this.mapFileIds(this.imageAry, fileObj[1], 'path', 'fileId');
              // this.imageAry?.forEach((item) => {
              //   const fileItem = fileObj[1].find((i) => i.filePath === item.path);
              //   if (fileItem) {
              //     item.fileId = fileItem.fileId;
              //   }
              // });
            }
            return this.uploadDiffFiles(
              3,
              this.localVideoAry as videoType[],
              randomUUID,
              this.localImageAry!.length,
              compressImageType
            );
          })
          .then((res) => {
            if (typeof res === 'object') {
              fileObj[3] = res as fileProType[];
              this.mapFileIds(this.videoAry, fileObj[3], 'videoPath', 'videoId');
              // this.videoAry?.forEach((item) => {
              //   const fileItem = fileObj[3].find((i) => i.filePath === item.videoPath);
              //   if (fileItem) {
              //     item.videoId = fileItem.fileId;
              //   }
              // });
            }
            return this.uploadDiffFiles(
              2,
              this.localAudioAry as audioType[],
              randomUUID,
              this.localImageAry!.length + this.localVideoAry!.length,
              compressImageType
            );
          })
          .then((res) => {
            if (typeof res === 'object') {
              fileObj[2] = res as fileProType[];
              this.mapFileIds(this.audioAry, fileObj[2], 'audioPath', 'audioId');
              // this.audioAry?.forEach((item) => {
              //   const fileItem = fileObj[2].find((i) => i.filePath === item.audioPath);
              //   if (fileItem) {
              //     item.audioId = fileItem.fileId;
              //   }
              // });
            }
            const linkAry = this.localFileAry?.filter((item) => item.fileType === 0);
            return this.uploadDiffFiles(
              5,
              linkAry as fileType[],
              randomUUID,
              this.localImageAry!.length + this.localVideoAry!.length + this.localAudioAry!.length,
              compressImageType
            );
          })
          .then((res) => {
            if (typeof res === 'object') {
              fileObj[5] = res as fileProType[];
              this.mapFileIds(this.fileAry, fileObj[5], 'fileAddress', 'fileID');
              // this.fileAry?.forEach((item) => {
              //   const fileItem = fileObj[5].find((i) => i.filePath === item.fileAddress);
              //   if (fileItem) {
              //     item.fileID = fileItem.fileId;
              //   }
              // });
            }
            const linkAry = this.localFileAry?.filter((item) => item.fileType === 0);
            const filessAry = this.localFileAry?.filter((item) => item.fileType !== 0);
            return this.uploadDiffFiles(
              4,
              filessAry as fileType[],
              randomUUID,
              this.localImageAry!.length +
                this.localVideoAry!.length +
                this.localAudioAry!.length +
                linkAry!.length,
              compressImageType
            );
          })
          .then(async (res) => {
            if (typeof res === 'object') {
              fileObj[4] = res as fileProType[];
              this.mapFileIds(this.fileAry, fileObj[4], 'fileAddress', 'fileID');
              // this.fileAry?.forEach((item) => {
              //   const fileItem = fileObj[4].find((i) => i.filePath === item.fileAddress);
              //   if (fileItem) {
              //     item.fileID = fileItem.fileId;
              //   }
              // });
            }
            this.uploadIndex = 0;
            // uni.hideLoading();
            uni.showToast({
              title: '所有文件上传完成',
              icon: 'success',
              mask: false,
              duration: 500
            });
            // this.clearAllFilesCache();
            uni.$emit(uploadFilesCallBack, { code: 1, fileIdentity: randomUUID, fileObj });
            // isIosMoreVersion(316) && (await clearImageCacheMB('_doc/'));
          })
          .catch((error) => {
            this.uploadIndex = 0;
            // uni.hideLoading();
            const errorMessage = error.message || error;
            uni.$emit(uploadFilesCallBack, { code: 2, fileIdentity: randomUUID, fileObj });
            console.log('uploadFiles--catch--', errorMessage);
            utils.toast({ title: errorMessage });
          });
      } else {
        this.uploadIndex = 0;
        // uni.hideLoading();
        uni.$emit(uploadFilesCallBack, { code: 3, fileIdentity: null, fileObj });
      }
    },
    // 处理上传后的fileProType[]对象，将fileId写入到 对应的fileObj中
    mapFileIds(array: any, fileArray: fileProType[], pathKey: string, idKey: string) {
      array?.forEach((item: any) => {
        const filePath = item[pathKey];
        // const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
        // console.log('mapFileIds--fileName--', fileName);
        // const fileItem = fileArray.find((i) => i.filePath.includes(fileName));
        const fileItem = fileArray.find((i) => i.filePath === filePath);
        console.log('mapFileIds--fileItem--', fileItem);
        if (fileItem) {
          item[idKey] = fileItem.fileId;
        }
      });
      console.log('mapFileIds-hellow---', array);
      console.log('mapFileIds--fileArray--', fileArray);
      console.log('mapFileIds--pathKey--', pathKey);
      console.log('mapFileIds--idKey--', idKey);
      console.log('mapFileIds----image', this.imageAry);
    },
    formatBytes(bytes: number) {
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0.00 Bytes'; // 特殊情况处理
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`; // 保留两位小数
    }
  }
});
// 同步创建一个空文件 仅在微信可用
function createEmptyFile() {
  // #ifdef MP-WEIXIN
  const fs = wx.getFileSystemManager();
  // 微信小程序设置存储路径
  const filePath = `${wx.env.USER_DATA_PATH}/emptyFile.txt`;
  // 同步接口
  try {
    fs.accessSync(filePath);
    console.log('createEmptyFile----文件存在----', filePath);
  } catch (e) {
    console.error('createEmptyFile----文件不存在----', e);
    // 同步接口
    try {
      fs.writeFileSync(filePath, '1');
      console.log('createEmptyFile----文件创建成功----', filePath);
    } catch (e) {
      console.error('createEmptyFile----文件创建失败----', e);
    }
  }
  return filePath;
  // #endif
}

export default fileUploadStore;
