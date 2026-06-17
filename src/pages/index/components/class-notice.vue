<template>
  <view class="class-notice thorui-flex__between" :style="{ backgroundColor: bgColor }">
    <view class="left thorui-align__center" style="flex-shrink: 0">
      <image
        :src="`${$cdn}/nb/m/uni-zhyd/img/class_notice_icon.png`"
        class="icon"
        mode="scaleToFill"
      />
      <tui-text :size="24" color="#222222" text="开启班级通知，及时接收消息"></tui-text>
    </view>
    <view class="right">
      <tui-form-button
        background="#4AD975"
        radius="80rpx"
        color="#FFFFFF"
        height="50rpx"
        width="104rpx"
        :size="24"
        @click="toOpenClassNotice"
        >去关注</tui-form-button
      >
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ bgColor?: string }>(), { bgColor: '#ffffff' });
const emits = defineEmits<{
  (e: 'clickToWebH5'): void;
}>();
const router = useRouter();
// 跳转webview页
const toOpenClassNotice = () => {
  // const webViewUrl = 'https://mp.weixin.qq.com/s/upy4Qco2C-CSAWHPAneBew';
  const webViewUrl = 'https://mp.weixin.qq.com/s/gpDu-EepTPoghWsFoZyz9A';
  // #ifdef MP-WEIXIN
  router.push({
    path: 'uni_modules/uni-module-public/web-to-h5/web-to-h5',
    query: {
      url: encodeURIComponent(webViewUrl)
    }
  });
  // #endif
  // #ifdef H5
  window.location.href = webViewUrl;
  // #endif
  emits('clickToWebH5');
};
</script>

<style scoped lang="scss">
.class-notice {
  box-sizing: border-box;
  padding: 16px;
  border-radius: 16px;
  height: 48px;
  .icon {
    position: relative;
    top: 1px;
    flex-shrink: 0;
    margin-right: 4px;
    width: 16px;
    height: 16px;
  }
}
</style>
