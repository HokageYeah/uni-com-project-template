<template>
  <xxt-layout tabbar="/pages/diary/diary">
    <view class="jump-page">
      <view class="jump-card">
        <view class="jump-title">日记主包跳板页</view>
        <view class="jump-desc">
          当前主包页仅用于承接 Tab 路由，真实日记 UI 已迁移到日记子包。
        </view>
      </view>
    </view>
  </xxt-layout>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.jump-page {
  min-height: 100vh;
  padding: 48rpx 32rpx 180rpx;
  box-sizing: border-box;
  background: #fffef7;
}

.jump-card {
  padding: 32rpx 28rpx;
  border-radius: 28rpx;
  background: #fff;
}

.jump-title {
  color: #382b0a;
  font-size: 36rpx;
  font-weight: 700;
}

.jump-desc {
  margin-top: 16rpx;
  color: #6b624d;
  font-size: 26rpx;
  line-height: 1.8;
}
</style>
