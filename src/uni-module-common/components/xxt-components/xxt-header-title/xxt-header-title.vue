<template>
  <view class="root">
    <view class="root-content">
      <image :src="imageUrl" class="mark" />
      <view class="title-text">{{ title }}</view>
      <slot name="right"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string; // 标题
    imageUrl?: string; // 图片地址
  }>(),
  {
    title: '',
    imageUrl: ''
  }
);
</script>

<style lang="scss" scoped>
.root {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40rpx;
  .root-content {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .mark {
    width: 16rpx;
    height: 32rpx;
  }
  .title-text {
    margin-left: 16rpx;
    font-weight: bold;
    font-size: 36rpx;
    color: #222;
  }
}
</style>
