import utils from '@/uni-module-common/utils';

function getLocalFilePath(path: any) {
  if (
    path.indexOf('_www') === 0 ||
    path.indexOf('_doc') === 0 ||
    path.indexOf('_documents') === 0 ||
    path.indexOf('_downloads') === 0
  ) {
    return path;
  }
  if (path.indexOf('file://') === 0) {
    return path;
  }
  if (path.indexOf('/storage/emulated/0/') === 0) {
    return path;
  }
  if (path.indexOf('/') === 0) {
    const localFilePath = plus.io.convertAbsoluteFileSystem(path);
    if (localFilePath !== path) {
      return localFilePath;
    } else {
      path = path.substr(1);
    }
  }
  return `_www/${path}`;
}
// base64转地址
function dataUrlToBase64(str: any) {
  const array = str.split(',');
  return array[array.length - 1];
}

let index = 0;
function getNewFileId() {
  return Date.now() + String(index++);
}

function biggerThan(v1: any, v2: any) {
  const v1Array = v1.split('.');
  const v2Array = v2.split('.');
  let update = false;
  for (let index = 0; index < v2Array.length; index++) {
    const diff = v1Array[index] - v2Array[index];
    if (diff !== 0) {
      update = diff > 0;
      break;
    }
  }
  return update;
}
// 地址转base64
function pathToBase64(path: any) {
  return new Promise(function (resolve, reject) {
    if (typeof window === 'object' && 'document' in window) {
      if (typeof FileReader === 'function') {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.responseType = 'blob';
        xhr.onload = function () {
          if (this.status === 200) {
            const fileReader = new FileReader();
            fileReader.onload = function (e: any) {
              resolve(e.target.result);
            };
            fileReader.onerror = reject;
            fileReader.readAsDataURL(this.response);
          }
        };
        xhr.onerror = reject;
        xhr.send();
        return;
      }
      const canvas = document.createElement('canvas');
      const c2x: any = canvas.getContext('2d');
      const img = new Image();
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        c2x.drawImage(img, 0, 0);
        resolve(canvas.toDataURL());
        canvas.height = canvas.width = 0;
      };
      img.onerror = reject;
      img.src = path;
      return;
    }
    if (typeof plus === 'object') {
      plus.io.resolveLocalFileSystemURL(
        getLocalFilePath(path),
        function (entry: any) {
          entry.file(
            function (file: any) {
              const fileReader = new plus.io.FileReader();
              fileReader.onload = function (data: any) {
                resolve(data.target.result);
              };
              fileReader.onerror = function (error) {
                reject(error);
              };
              fileReader.readAsDataURL(file);
            },
            function (error: any) {
              reject(error);
            }
          );
        },
        function (error) {
          reject(error);
        }
      );
      return;
    }
    if (typeof wx === 'object' && wx.canIUse('getFileSystemManager')) {
      wx.getFileSystemManager().readFile({
        filePath: path,
        encoding: 'base64',
        success(res: any) {
          resolve(`data:image/png;base64,${res.data}`);
        },
        fail(error: any) {
          reject(error);
        }
      });
      return;
    }
    reject(new Error('not support'));
  });
}

function base64ToPath(base64: any) {
  return new Promise(function (resolve, reject) {
    if (typeof window === 'object' && 'document' in window) {
      base64 = base64.split(',');
      const type = base64[0].match(/:(.*?);/)[1];
      const str = atob(base64[1]);
      let n = str.length;
      const array = new Uint8Array(n);
      while (n--) {
        array[n] = str.charCodeAt(n);
      }
      return resolve((window.URL || window.webkitURL).createObjectURL(new Blob([array], { type })));
    }
    let extName = base64.split(',')[0].match(/data\:\S+\/(\S+);/);
    if (extName) {
      extName = extName[1];
    } else {
      reject(new Error('base64 error'));
    }
    const fileName = `${getNewFileId()}.${extName}`;
    if (typeof plus === 'object') {
      const basePath = '_doc';
      const dirPath = 'uniapp_temp';
      const filePath = `${basePath}/${dirPath}/${fileName}`;
      if (
        !biggerThan(
          plus.os.name === 'Android' ? '1.9.9.80627' : '1.9.9.80472',
          plus.runtime.innerVersion
        )
      ) {
        plus.io.resolveLocalFileSystemURL(
          basePath,
          function (entry) {
            entry.getDirectory(
              dirPath,
              {
                create: true,
                exclusive: false
              },
              function (entry) {
                entry.getFile(
                  fileName,
                  {
                    create: true,
                    exclusive: false
                  },
                  function (entry) {
                    entry.createWriter(function (writer) {
                      writer.onwrite = function () {
                        resolve(filePath);
                      };
                      writer.onerror = reject;
                      writer.seek(0);
                      writer.writeAsBinary(dataUrlToBase64(base64));
                    }, reject);
                  },
                  reject
                );
              },
              reject
            );
          },
          reject
        );
        return;
      }
      const bitmap = new plus.nativeObj.Bitmap(fileName);
      bitmap.loadBase64Data(
        base64,
        function () {
          bitmap.save(
            filePath,
            {},
            function () {
              bitmap.clear();
              resolve(filePath);
            },
            function (error) {
              bitmap.clear();
              reject(error);
            }
          );
        },
        function (error) {
          bitmap.clear();
          reject(error);
        }
      );
      return;
    }
    if (typeof wx === 'object' && wx.canIUse('getFileSystemManager')) {
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
      wx.getFileSystemManager().writeFile({
        filePath,
        data: dataUrlToBase64(base64),
        encoding: 'base64',
        success() {
          resolve(filePath);
        },
        fail(error: any) {
          reject(error);
        }
      });
      return;
    }
    reject(new Error('not support'));
  });
}

interface imageObjType {
  width: number;
  height: number;
  path: string;
  orientation: string;
  type: string;
}
// 获取图片的基本信息
const getImageInfo = (filePath: string) => {
  return new Promise<imageObjType>((resolve) => {
    uni.getImageInfo({
      src: filePath,
      success: (res) => {
        console.log('图片压缩compressImage--getImageInfo--success--', res);
        resolve(res as imageObjType);
      },
      fail: (res) => {
        uni.hideLoading();
        utils.toast({
          title: `图片压缩失败，请重新选择图片！`
        });
        console.log('图片压缩compressImage--getImageInfo--error--', res);
      }
    });
  });
};
// 获取压缩图片的百分比
const getScalePercentage = async (imagePath: string) => {
  console.log('图片压缩compressImage--imagePath--', imagePath);
  const imageInfo = await getImageInfo(imagePath);
  console.log('图片压缩compressImage--imageInfo--', JSON.stringify(imageInfo));
  const largerDimension = imageInfo.width >= imageInfo.height ? 'width' : 'height';
  // 计算缩小的比例
  const scalePercentage = 1024 / imageInfo[largerDimension];
  console.log('图片压缩compressImage--scalePercentage--', scalePercentage);
  // 将百分比转换为字符串并输出
  const percentageString = `${(scalePercentage * 100).toFixed(0)}%`;
  console.log('图片压缩compressImage--percentageString--', percentageString);
  return percentageString;
};

const unique = (n = 6) => {
  let rnd = '';
  for (let i = 0; i < n; i++) rnd += Math.floor(Math.random() * 10);
  return `xxt_${new Date().getTime()}${rnd}`;
};
const getUniXFileInfo = async (
  filePath: string,
  size: number
): Promise<{ size: number; isSuccess: boolean; fileType: string }> => {
  const paramsSizeInMB = (size / (1024 * 1024)).toFixed(2); // 转换为 MB
  return new Promise((resolve) => {
    // #ifdef APP-PLUS || APP
    plus.io.resolveLocalFileSystemURL(
      filePath,
      (entry) => {
        console.log(
          '图片压缩compressImage--getUniXFileInfo---resolveLocalFileSystemURL--success--',
          entry
        );
        // 获取文件类型
        const fileType = entry?.name?.split('.').pop() || '';
        console.log('图片压缩compressImage--getUniXFileInfo---fileType--', fileType);
        entry.getMetadata(
          (metadata) => {
            console.log(
              '图片压缩compressImage--getUniXFileInfo---getMetadata--success--',
              metadata
            );
            // 获取文件的大小，单位是字节
            const fileSizeInBytes = metadata.size || 0;
            const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2); // 转换为 MB
            // const fileSizeInKB = (fileSizeInBytes / 1024).toFixed(2); // 转换为 KB
            resolve({
              size: Number(fileSizeInMB),
              isSuccess: true,
              fileType
            });
          },
          (e) => {
            console.log('图片压缩compressImage--getUniXFileInfo---getMetadata--error--', e);
            resolve({
              size: Number(paramsSizeInMB),
              isSuccess: false,
              fileType
            });
          }
        );
      },
      (e) => {
        console.log(
          '图片压缩compressImage--getUniXFileInfo---resolveLocalFileSystemURL--error--',
          e
        );
        resolve({
          size: Number(paramsSizeInMB),
          isSuccess: false,
          fileType: ''
        });
      }
    );
    // #endif
    // #ifndef APP-PLUS || APP
    console.log(
      '图片压缩compressImage--getUniXFileInfo---resolveLocalFileSystemURL--weixin--',
      Number(paramsSizeInMB)
    );
    resolve({
      size: Number(paramsSizeInMB),
      isSuccess: true,
      fileType: 'jpg'
    });
    // #endif
  });
};
const isUniXFileCompress = async (filePath: string, size = 0) => {
  // return true; // 测试
  // app中获取 获取原始图片的基本信息
  try {
    const imageInfo = await getUniXFileInfo(filePath, size);
    console.log('图片压缩compressImage--imageInfo--', imageInfo);
    console.log('图片压缩compressImage--size--', size);
    if (imageInfo.size <= 0.3 && imageInfo.isSuccess && imageInfo.fileType.includes('jpg')) {
      console.log('图片压缩compressImage---不压缩');
      return false;
    }
    return true;
  } catch (error) {
    console.log('图片压缩compressImage--isUniXFileCompress--error--', error);
    return true;
  }
};
// 图片压缩方法啊、 此方法应该只用于app端，如果其他平台调用，则返回原图地址
const compressImage = async (filePath: string) => {
  // _www/a.jpg"、"_doc/b.jpg"、"_documents/c.jpg"、"_downloads/d.jpg"
  const f_dst = `_doc/${unique()}.jpg`;
  console.log('图片压缩compressImage--进入_doc--', f_dst);
  console.log('图片压缩compressImage--filePath--', filePath);
  // const percentageString = await getScalePercentage(filePath);
  // 取值范围为1-100，1表示使用最低的图片质量（转换后的图片文件最小）、100表示使用最高的图片质量（转换后的图片文件最大）； 默认值为50
  const quality = 80;
  // 如果图片小于300kb，则不进行压缩
  // 此方法app端调用， 传size为0 ，size都从方法中获取
  const isCompress = await isUniXFileCompress(filePath);
  return new Promise((resolve) => {
    // #ifdef APP-PLUS || APP
    if (isCompress) {
      plus.zip.compressImage(
        {
          src: filePath,
          dst: f_dst,
          overwrite: true,
          format: 'jpg',
          quality
        },
        (i) => {
          console.log('图片压缩compressImage--success--', i);
          resolve(i.target);
        },
        (e) => {
          console.log('图片压缩compressImage--error--', e);
          resolve(filePath);
          utils.toast({
            title: `上传图片压缩失败，将用原图上传`
          });
        }
      );
    } else {
      resolve(filePath);
    }
    // #endif
    // #ifndef APP-PLUS || APP
    resolve(filePath);
    // #endif
  });
};

const getFileSize = (entries: any, isfile: boolean) => {
  return new Promise<number>((resolve) => {
    if (isfile) {
      entries.file(
        function (file: any) {
          const fileSize = file.size * 0.0009766;
          resolve(fileSize);
          console.log('showImageCacheMB---.file.size---', fileSize);
        },
        function (e: any) {
          console.log('showImageCacheMB---.file---', e.message);
        }
      );
    } else {
      entries.getMetadata(
        function (metadata: any) {
          const fileSize = metadata.size * 0.0009766;
          resolve(fileSize); // 1字节=0.0009766kb
          console.log('showImageCacheMB---.metadata.size---', fileSize);
        },
        function (e: any) {
          console.log('showImageCacheMB---getMetadata---', e.message);
        }
      );
    }
  });
};

// 获取指定地址的uni缓存大小（通常是图片地址）
const showImageCacheMB = (filePath: string) => {
  console.log('showImageCacheMB---进入了----');
  return new Promise<string>((resolve, reject) => {
    // #ifdef APP-PLUS  || APP
    // 只有在app端才会清楚压缩后的缓存文件在_doc中
    plus.io.resolveLocalFileSystemURL(
      filePath,
      function (entry: any) {
        // 通过URL参数获取目录对象或文件对象
        let fileSize = 0;
        // 创建目录读取对象
        const directoryReader = entry.createReader();
        directoryReader.readEntries(
          async function (entries: any) {
            // 获取当前目录中的所有文件和子目录
            for (let i = 0; i < entries.length; i++) {
              if (entries[i].isFile) {
                fileSize += await getFileSize(entries[i], true);
              } else {
                fileSize += await getFileSize(entries[i], false);
              }
            }
            const fileSizeMb = (fileSize / 1024).toFixed(2);
            resolve(fileSizeMb);
            console.log('showImageCacheMB---fileSize---', fileSizeMb);
            console.log('showImageCacheMB---fileSize---mb', `${fileSizeMb}mb`);
          },
          function (e: any) {
            console.log('showImageCacheMB---文件读取失败', e);
            reject(e);
          }
        );
      },
      function (e) {
        console.log('showImageCacheMB---文件路径读取失败---', e);
        reject(e);
      }
    );
    // #endif
    // #ifndef APP-PLUS  || APP
    resolve('');
    // #endif
  });
};
// 清除指定地址的uni缓存（通常是图片地址）
const clearImageCacheMB = (filePath: string) => {
  return new Promise<boolean>((resolve, reject) => {
    // #ifdef APP-PLUS  || APP
    // 只有在app端才会清楚压缩后的缓存文件在_doc中
    plus.io.resolveLocalFileSystemURL(
      filePath,
      function (entry: any) {
        // 递归删除目录
        entry.removeRecursively(
          function (rmEntry: any) {
            console.log('clearImageCache---缓存清理完成--', rmEntry);
            resolve(true);
          },
          function (e: any) {
            console.log('clearImageCache---缓存清理失败--', e);
            reject(e);
          }
        );
      },
      function (e) {
        console.log('clearImageCache---文件路径读取失败---', e);
        reject(e);
      }
    );
    // #endif
    // #ifndef APP-PLUS  || APP
    resolve(true);
    // #endif
  });
};

// 获取文件信息 异步
const getFileInfoSync = (imagePath: string) => {
  return new Promise<any>((resolve, reject) => {
    uni.getFileSystemManager().getFileInfo({
      filePath: imagePath,
      success: (res) => {
        console.log(`getFileInfo--success-`, res.size, imagePath);
        resolve({ status: true, imagePath, size: res.size });
      },
      fail: (res) => {
        console.log(`getFileInfo--error-`, imagePath);
        reject(res);
      }
    });
  });
};

// 获取压缩图片的百分比
const getScaleHeicPercentage = async (imagePath: string) => {
  console.log('图片压缩compressImage--imagePath--', imagePath);
  const imageInfo = await getImageInfo(imagePath);
  console.log('图片压缩compressImage--imageInfo--', JSON.stringify(imageInfo));
  const largerDimension = imageInfo.width >= imageInfo.height ? 'width' : 'height';
  // 计算缩小的比例
  const scalePercentage = 4096 / imageInfo[largerDimension];
  console.log('图片压缩compressImage--scalePercentage--', scalePercentage);
  // 将百分比转换为字符串并输出
  const percentageString = `${(scalePercentage * 100).toFixed(0)}%`;
  console.log('图片压缩compressImage--percentageString--', percentageString);
  const percentage = scalePercentage.toFixed(2);
  if (imageInfo.width > 4096 || imageInfo.height > 4096) {
    return [imageInfo.width * parseFloat(percentage), imageInfo.height * parseFloat(percentage)];
  } else {
    return [imageInfo.width, imageInfo.height];
  }
};

// canvas压缩
const canvasCompress = async (imagePath: string, id: string) => {
  const imageInfo = await getImageInfo(imagePath);
  console.log('获取的宽高', imageInfo);
  console.log('图片压缩compressImage--imagePath--', imagePath);
  const percentageString = await getScaleHeicPercentage(imagePath);
  console.log('图片压缩compressImage--percentageString--', percentageString);

  return new Promise<any>((resolve, reject) => {
    try {
      // 创建离屏画布
      const canvas = wx.createOffscreenCanvas({
        type: '2d'
      });
      const ctx = canvas.getContext('2d');
      // 初始化画布大小
      const dpr = 1;
      if (percentageString && percentageString.length > 2) {
        canvas.width = percentageString[0];
        canvas.height = percentageString[1];
      } else {
        canvas.width = imageInfo.width;
        canvas.height = imageInfo.height;
      }
      ctx.scale(dpr, dpr);

      // 创建图片对象
      const image = canvas.createImage();
      image.src = imagePath;
      // 图片加载完成回调
      image.onload = () => {
        try {
          // 将图片绘制到 canvas 上
          ctx.drawImage(image, 0, 0, percentageString[0], percentageString[1]);
          // 导出 canvas 为图片
          wx.canvasToTempFilePath({
            canvas,
            fileType: 'jpg',
            quality: 0.5,
            success: async (res: any) => {
              console.log('转格式成功:', res);
              // 查看压缩后的图片 信息
              const fileInfo = await getFileInfoSync(res.tempFilePath);
              const sizeMB = (fileInfo.size / (1024 * 1024)).toFixed(2); // 转换为 MB
              console.log('压缩后的图片信息----0.5sizeMB', sizeMB);
              console.log('压缩后的图片信息----0.5imageInfo', imageInfo);
              resolve({ status: true, imagePath: res.tempFilePath });
            },
            fail(err: any) {
              console.error('转格式失败:', err);
              reject(err);
            }
          });
        } catch (error) {
          console.error('image绘制失败:', error);
          reject(error);
        }
      };

      // 添加图片加载错误处理
      image.onerror = (err) => {
        console.error('图片加载失败:', err);
        reject(err);
      };
    } catch (error) {
      console.error('canvas创建失败:', error);
      reject(error);
    }
  });
};

export {
  compressImage,
  pathToBase64,
  base64ToPath,
  getImageInfo,
  getScalePercentage,
  showImageCacheMB,
  clearImageCacheMB,
  isUniXFileCompress,
  getUniXFileInfo,
  getFileInfoSync,
  canvasCompress,
  getScaleHeicPercentage
};
