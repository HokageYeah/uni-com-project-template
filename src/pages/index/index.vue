<template>
  <xxt-layout tabbar="/pages/index/index">
    <view class="jump-page">
      <view class="jump-card">
        <view class="jump-title">首页主包跳板页</view>
        <view class="jump-desc">
          当前主包页仅用于承接 Tab 路由，真实首页 UI 已迁移到首页子包。
        </view>
      </view>
    </view>
  </xxt-layout>
</template>

<script setup lang="ts">
const HOME_MAIN_PAGE_URL = '/uni_modules/pages-home/home-main/home-main';

/**
 * 主包首页只负责承接小程序 tabBar 冷启动。
 * 首次进入不会触发 switchTab 拦截器，所以这里必须主动跳到子包真实首页。
 */
onLoad(() => {
  console.info('[首页跳板页] 冷启动进入主包首页，准备跳转真实首页', {
    目标地址: HOME_MAIN_PAGE_URL
  });

  uni.reLaunch({
    url: HOME_MAIN_PAGE_URL,
    fail: (error) => {
      console.error('[首页跳板页] 跳转真实首页失败', {
        错误信息: error?.errMsg || ''
      });
    }
  });
});
</script>

<style scoped lang="scss">
.jump-page {
  min-height: 100vh;
  padding: 48rpx 32rpx 180rpx;
  box-sizing: border-box;
  background: #f6fff8;
}

.jump-card {
  padding: 32rpx 28rpx;
  border-radius: 28rpx;
  background: #fff;
}

.jump-title {
  color: #183121;
  font-size: 36rpx;
  font-weight: 700;
}

.jump-desc {
  margin-top: 16rpx;
  color: #5b6b61;
  font-size: 26rpx;
  line-height: 1.8;
}
</style>
