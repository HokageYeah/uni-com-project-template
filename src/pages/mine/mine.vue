<template>
  <xxt-layout tabbar="/pages/mine/mine">
    <view class="jump-page">
      <view class="jump-card">
        <view class="jump-title">我的主包跳板页</view>
        <view class="jump-desc">
          当前主包页仅用于承接 Tab 路由，真实“我的” UI 已迁移到我的子包。
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
  background: #f7fbff;
}

.jump-card {
  padding: 32rpx 28rpx;
  border-radius: 28rpx;
  background: #fff;
}

.jump-title {
  color: #18283c;
  font-size: 36rpx;
  font-weight: 700;
}

.jump-desc {
  margin-top: 16rpx;
  color: #60708a;
  font-size: 26rpx;
  line-height: 1.8;
}
</style>
