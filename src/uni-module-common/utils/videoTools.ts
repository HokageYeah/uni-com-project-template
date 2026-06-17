export function getFileInfoSync(imagePath: string) {
  return new Promise<any>((resolve, reject) => {
    uni.getFileSystemManager().getFileInfo({
      filePath: imagePath,
      success: (res) => {
        console.log(`getFileInfo--success`, res.size, imagePath);
        resolve({ status: true, imagePath, size: res.size });
      },
      fail: (res) => {
        console.log(`getFileInfo--error`, imagePath);
        reject(res);
      }
    });
  });
}

interface VideoObjType {
  width: number;
  height: number;
  path: string;
  orientation: string;
  type: string;
}

// 获取视频的基本信息
const getVideoInfo = (filePath: string) => {
  return new Promise<VideoObjType>((resolve, reject) => {
    uni.getVideoInfo({
      src: filePath,
      success: (res: any) => {
        resolve(res as VideoObjType);
      },
      fail: (res: any) => {
        uni.hideLoading();
        uni.showToast({
          title: `视频压缩失败，请重新选择视频！`
        });
        console.log('视频压缩compressVideo--getVideoInfo--error--', res);
        reject(res);
      }
    });
  });
};

// 获取压缩图片的百分比
async function getVideoScalePercentage(videoPath: string) {
  const videoInfo = await getVideoInfo(videoPath);
  const largerDimension = videoInfo.width >= videoInfo.height ? 'width' : 'height';
  // 计算缩小的比例
  const scalePercentage = 1920 / videoInfo[largerDimension];
  // 将百分比转换为字符串并输出
  const percentage = scalePercentage.toFixed(2);
  return parseFloat(percentage) >= 1 ? 1 : parseFloat(percentage);
}

// 视频异步压缩 compress 2是压缩中等, 1压缩高清
export async function compressVideoSync(imagePath: string, compress: number) {
  const percentageString = await getVideoScalePercentage(imagePath);
  return new Promise<any>((resolve, reject) => {
    uni.compressVideo({
      src: imagePath,
      bitrate: 3000,
      fps: 30,
      resolution: percentageString,
      success: (res: any) => {
        console.log('compressVideoSync--success--', res.tempFilePath, res);
        resolve({ status: true, imagePath: res.tempFilePath });
      },
      fail: (res: any) => {
        console.log('compressVideoSync--fail--', res.tempFilePath, res);
        reject(res);
      }
    });
  });
}
// export function compressVideoSync(imagePath: string, inputMonile: number) {
//   const num = inputMonile;
//   return new Promise<any>((resolve, reject) => {
//     uni.compressVideo({
//       src: imagePath,
//       quality: num === 100 ? 'high' : 'medium',
//       success: (res) => {
//         console.log('compressVideoSync--success--', res.tempFilePath, res);
//         resolve({ status: true, imagePath: res.tempFilePath });
//       },
//       fail: (res) => {
//         console.log('compressVideoSync--fail--', res.tempFilePath, res);
//         reject(res);
//       }
//     });
//   });
// }
export async function videoCompress(videoPath: string, inputMonile: number) {
  const fileInfo = await getFileInfoSync(videoPath);
  if (fileInfo.status) {
    const video = await compressVideoSync(videoPath, inputMonile);
    if (video.status) {
      // 第二步压缩成功后获取文件信息, 主要拿文件大小, 服务端需要
      const file = await getFileInfoSync(video.imagePath);
      if (file.status) {
        // 第三步获取文件信息成功赋值后返回file对象
        fileInfo.videoSize = file.size;
        fileInfo.videoPath = file.imagePath;
      }
    }
  }
  return fileInfo;
}
