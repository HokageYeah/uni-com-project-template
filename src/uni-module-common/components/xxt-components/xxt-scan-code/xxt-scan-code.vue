<template>
  <view class="container">
    <camera
      v-if="scanFlag"
      class="camera"
      device-position="back"
      mode="scanCode"
      @scancode="scancode"
      @error="error"
    >
      <cover-view class="content"> </cover-view>
      <cover-view class="content-title">
        <cover-view>{{ title }}</cover-view>
        <cover-view class="scan-block">
          <!-- <cover-view class="scan-line"></cover-view> -->
        </cover-view>
        <cover-view v-if="showSubTitle" class="scan-bottom" @click="gotoBarCodeInput">{{
          subTitle
        }}</cover-view>
      </cover-view>
    </camera>
    <!-- <cover-view class="content"> </cover-view>
    <cover-view class="content-title">
      <view>扫描书籍的 ISBN 条码</view>
      <view class="scan-block">
        <view class="scan-line"></view>
      </view>
      <view class="scan-bottom">扫不出来？试试手动输入</view>
    </cover-view> -->
  </view>
</template>

<script setup lang="ts">
import { getAuthorize } from '@/uni-module-common/utils/util';
const props = withDefaults(
  defineProps<{
    title: string; // 主标题
    subTitle: string; // 副标题
    showSubTitle: boolean; // 是否显示副标题
    otherPageParams: any; // 需要跳转到其他页面参数
    scanType: string; // 扫描类型，用来区分扫码业务
  }>(),
  {
    title: '',
    subTitle: '',
    showSubTitle: true,
    otherPageParams: {},
    scanType: '1'
  }
);
const emits = defineEmits<{
  (e: 'barCodeSuccess', data: { scanType: string; code: string; successType: string }): void;
  // 1、error type：1是未授权失败、 2是扫描失败、 3是其他错误
  (e: 'barCodeError', data: { errorType: string; scanType: string }): void;
  (e: 'barCodeOtherPage', data: { otherPageParams: any; scanType: string }): void;
}>();
const scanFlag = ref(false);
const error = (e: any) => {
  console.log(e.detail);
};
const barCodeError = (type: string) => {
  uni.navigateBack({
    success() {
      emits('barCodeError', { errorType: type, scanType: props.scanType });
    }
  });
};
const scancode = async (res: any) => {
  console.log('scancode---', res);
  const { result } = res.detail;
  if (result) {
    emits('barCodeSuccess', {
      scanType: props.scanType,
      code: result,
      successType: res.detail.type
    });
  } else {
    // uniShowToast('扫描失败,请重新扫描');
    console.log('扫描失败,请重新扫描');
    barCodeError('2');
  }
};
onMounted(async () => {
  try {
    // 相机授权
    await getAuthorize(
      'scope.camera',
      '相机权限申请',
      '需要获取您的相机权限，请在设置中打开相机权限',
      '去设置',
      true
    );
    scanFlag.value = true;
  } catch {
    barCodeError('1');
  }
});
const gotoBarCodeInput = () => {
  emits('barCodeOtherPage', { otherPageParams: props.otherPageParams, scanType: props.scanType });
};
</script>

<style scoped lang="scss">
.container {
  @include normalContainer();
  background-color: rgba(0, 0, 0);
}
.camera {
  position: relative;
  width: 100vw;
  height: 100vh;
}
.content {
  /* background-color: #222222; */
  /* 透明遮罩层 */
  /* opacity: 0.4; */
  position: absolute;
  width: 100vw;
  height: 100vh;
}
.content-title {
  position: absolute;
  left: 50%;
  top: 50%;
  font-size: 16px;
  color: #fff;
  transform: translate(-50%, -50%);
  @include normalFlex(column, flex-start, center);
}
.scan-block {
  position: relative;
  margin-top: 20px;
  border: 1px solid #fff;
  border-radius: 16px;
  width: 215px;
  height: 215px;
  /* opacity: 0.2; */
  background-color: transparent;
}
@keyframes move {
  0% {
    transform: translate(-50%, -100%);
  }
  100% {
    transform: translate(-50%, 100%);
  }
}
.scan-line {
  position: absolute;
  left: 50%;
  top: 0;
  border-radius: 2px;
  width: 80%;
  height: 4px;
  background: #4ad975;
  box-shadow: 0 0 10px rgba(74, 217, 117, 1); /* 模糊效果 */
  transform: translate(-50%, 0);
  animation: move 8s linear infinite;
}
/* 实现动画从上倒下 */
.scan-bottom {
  margin-top: 20px;
  padding: 8px 16px;
  border-radius: 8px;
  background-color: #222;
  opacity: 0.8;
}
</style>
