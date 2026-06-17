// 处理下载的文件
function handleDownloadedFile(tempFilePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.io.resolveLocalFileSystemURL(
      tempFilePath,
      (entry: any) => {
        // 获取到真实的文件对象
        entry.file(
          (file: any) => {
            console.log('文件信息:', file.size, file.name);
            // 返回可用的文件路径
            resolve(tempFilePath);
          },
          (error: any) => {
            console.error('获取文件信息失败:', error);
            reject(error);
          }
        );
      },
      (error: any) => {
        console.error('解析文件路径失败:', error);
        reject(error);
      }
    );
    // #endif

    // #ifndef APP-PLUS
    // 非App平台直接返回路径
    resolve(tempFilePath);
    // #endif
  });
}

// 下载文件
const downloadFile = (fileUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    uni.downloadFile({
      url: fileUrl,
      success: (res) => {
        console.log('downloadFile---res---success', res);
        const tempFilePath = res.tempFilePath;
        if (tempFilePath) {
          console.log('下载成功');
          // resolve(tempFilePath);
          handleDownloadedFile(tempFilePath).then((newTempFilePath) => {
            resolve(newTempFilePath);
          });
        } else {
          reject(new Error('音频下载失败'));
        }
      },
      fail: (err) => {
        console.log('downloadFile---res---err', err);
        reject(new Error('音频下载失败'));
      },
      complete: () => {
        console.log('downloadFile---res---complete');
      }
    });
  });
};

export { downloadFile, handleDownloadedFile };
