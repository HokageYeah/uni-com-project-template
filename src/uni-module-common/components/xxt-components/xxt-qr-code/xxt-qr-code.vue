<template>
  <view class="couponQrcodeRef">
    <canvas
      id="couponQrcode"
      :style="{ width: `${qrcodeW}px`, height: `${qrcodeH}px` }"
      canvas-id="couponQrcode"
    ></canvas>
  </view>
</template>

<script lang="ts" setup>
import qrCode from '@/uni-module-common/utils/weapp-qrcode';
const props = withDefaults(
  defineProps<{
    // 二维码宽度
    qrcodeW?: number;
    // 二维码高度
    qrcodeH?: number;
    // 二维码内容
    qrcodeContent: string;
    // 二维码颜色
    colorDark?: string;
    // 二维码背景颜色
    colorLight?: string;
  }>(),
  {
    qrcodeW: 180,
    qrcodeH: 180,
    qrcodeContent: '',
    colorDark: '#333333',
    colorLight: '#FFFFFF'
  }
);
const instance = getCurrentInstance();
let qrCodeInstance: any = null;
// 二维码生成工具
function couponQrCode(text: string) {
  console.log('couponQrCode', text, instance);
  setTimeout(() => {
    // eslint-disable-next-line no-new, new-cap
    qrCodeInstance = new qrCode('couponQrcode', {
      text,
      width: props.qrcodeW,
      height: props.qrcodeH,
      colorDark: props.colorDark,
      colorLight: props.colorLight,
      // qrcodeW: 180,
      // qrcodeH: 180,
      // qrcodeContent: '123',
      // colorDark: '#333333',
      // colorLight: '#FFFFFF',
      correctLevel: qrCode.CorrectLevel.H,
      // 在组件中，小程序生成canvas对象时，如果不穿入 this，小程序就会去页面的上下文中寻找canvas对象，这样就会导致canvas找不到，二维码显示不出来。所以一定传入this，让程序在组件内部寻找canvas对象。
      // https://blog.csdn.net/ITzhongzi/article/details/113992054
      canvasRef: instance
    });
  }, 60);
}
// 导出二维码为图片路径
function exportImage(callback: (filePath: string) => void) {
  if (!callback) {
    return;
  }
  console.log('exportImage 调用, qrcodeW:', props.qrcodeW, 'qrcodeH:', props.qrcodeH, 'content:', props.qrcodeContent);
  uni.canvasToTempFilePath(
    {
      x: 0,
      y: 0,
      width: props.qrcodeW,
      height: props.qrcodeH,
      destWidth: props.qrcodeW * 2, // 增加导出分辨率，使图片更清晰
      destHeight: props.qrcodeH * 2,
      canvasId: 'couponQrcode',
      fileType: 'png',
      quality: 1,
      success: (res) => {
        console.log('canvas转图片成功:', res.tempFilePath);
        callback(res.tempFilePath);
      },
      fail: (err) => {
        console.error('canvas转图片失败:', err);
        // 降级方案：尝试不带第二个参数调用
        uni.canvasToTempFilePath(
          {
            x: 0,
            y: 0,
            width: props.qrcodeW,
            height: props.qrcodeH,
            destWidth: props.qrcodeW * 2,
            destHeight: props.qrcodeH * 2,
            canvasId: 'couponQrcode',
            fileType: 'png',
            quality: 1,
            success: (res2) => {
              console.log('canvas转图片成功(降级):', res2.tempFilePath);
              callback(res2.tempFilePath);
            },
            fail: (err2) => {
              console.error('canvas转图片失败(降级):', err2);
            }
          }
        );
      }
    },
    instance.proxy
  );
}
watch(
  () => props.qrcodeContent,
  () => {
    console.log('onLoad---qrcode', props.qrcodeContent);
    couponQrCode(props.qrcodeContent);
  },
  {
    immediate: true
  }
);
defineExpose({
  couponQrCode,
  exportImage
});
</script>

<style></style>
