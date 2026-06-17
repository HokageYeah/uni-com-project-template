<template>
  <xxt-layout tabbar="/pages/diary/diary">
    <view class="page-container">
      <view class="page-card">
        <view class="page-tag">Tab</view>
        <view class="page-title">中间 Tab</view>
        <view class="page-desc">{{ diaryDescription }}</view>
      </view>

      <view class="page-card tips-card">
        <view class="section-title">当前建议</view>
        <view class="section-text">
          这个页面默认允许游客访问，适合作为后续业务项目里的公开内容页、频道页或导航中转页。
        </view>
      </view>
    </view>
  </xxt-layout>
</template>

<script setup lang="ts">
import { DIARY_DESCRIPTION } from '@/uni-module-common/pages/page-helper';

const diaryDescription = DIARY_DESCRIPTION;
</script>

<style scoped lang="scss">
.page-container {
  min-height: 100vh;
  padding: 32rpx 28rpx 180rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, #fffef7 0%, #ffffff 46%, #f6f6f2 100%);
}

.page-card {
  padding: 32rpx 28rpx;
  border: 2rpx solid rgba(208, 177, 95, 0.14);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 16rpx 42rpx rgba(78, 62, 19, 0.08);
}

.tips-card {
  margin-top: 24rpx;
}

.page-tag {
  display: inline-flex;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(214, 179, 89, 0.16);
  color: #9d6f18;
  font-size: 22rpx;
  font-weight: 600;
}

.page-title {
  margin-top: 20rpx;
  color: #382b0a;
  font-size: 46rpx;
  font-weight: 700;
}

.page-desc,
.section-text {
  margin-top: 16rpx;
  color: #6b624d;
  font-size: 26rpx;
  line-height: 1.8;
}

.section-title {
  color: #49380d;
  font-size: 32rpx;
  font-weight: 700;
}
</style>
