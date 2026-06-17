<template>
  <tui-loading v-if="isShow" :text="loadingtext" :is-mask="true"></tui-loading>
</template>

<script setup lang="ts">
import { uploadFilesCallBack } from '@/uni-module-common/http';
const isUploadCallback = ref(false);
const {
  localImageAry,
  localVideoAry,
  localFileAry,
  localAudioAry,
  uploadIndex,
  progress,
  totalMBSent,
  totalMBExpectedToSend
}: any = useStore('fileUpload');
const isShow = computed(() => {
  const allLength =
    localImageAry.value.length +
    localVideoAry.value.length +
    localFileAry.value.length +
    localAudioAry.value.length;
  console.log(
    'loading---isShow',
    localImageAry.value.length,
    localVideoAry.value.length,
    localFileAry.value.length,
    localAudioAry.value.length
  );
  console.log('loading---iallLength', allLength);
  console.log('loading---uploadIndex', uploadIndex.value);
  console.log('loading---progress', progress.value);
  console.log('loading---isUploadCallback', isUploadCallback.value);
  const isnoShow =
    (uploadIndex.value === 0 && progress.value === 0) ||
    (uploadIndex.value === allLength && progress.value === 100 && isUploadCallback.value);
  return !isnoShow;
});
const loadingtext = computed(() => {
  const allLength =
    localImageAry.value.length +
    localVideoAry.value.length +
    localFileAry.value.length +
    localAudioAry.value.length;
  const str = `上传中${totalMBSent.value}/${totalMBExpectedToSend.value} 进度:${progress.value}% \n${uploadIndex.value}/${allLength}`;
  console.log('loading---totalMBSent', totalMBSent.value);
  console.log('loading---totalMBExpectedToSend', totalMBExpectedToSend.value);
  return str;
});
/**
 * 监听上传回调事件
 */
uni.$on(uploadFilesCallBack, (data: { code: number; fileIdentity: string }) => {
  isUploadCallback.value = true;
  if (data.code === 1 || data.code === 3) {
    // 附件上传成功
    console.log('监听上传回调事件----uploadFilesCallBack---loading', data);
  } else if (data.code === 2) {
    // 附件上传失败
    uni.showToast({ title: '附件上传失败，请稍候重试', icon: 'none' });
  }
});
</script>

<style scoped lang="scss"></style>
