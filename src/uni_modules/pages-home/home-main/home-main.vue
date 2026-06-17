<template>
  <xxt-layout tabbar="/pages/index/index">
    <view class="page-container">
      <view class="page-card hero-card">
        <view class="page-tag">Home</view>
        <view class="page-title">首页</view>
        <view class="page-desc">{{ homeDescription }}</view>
      </view>

      <xxt-common-unlogin :login-url="loginUrl">
        <view class="page-card">
          <view class="section-title">登录后内容区</view>
          <view class="section-text">
            当前区域由 `xxt-common-unlogin` 统一包裹，后续业务项目可以在这里接入真实首页模块。
          </view>
          <view class="profile-list">
            <view class="list-row">
              <text class="list-label">当前状态</text>
              <text class="list-value">已登录</text>
            </view>
            <view class="list-row">
              <text class="list-label">昵称</text>
              <text class="list-value">{{ userInfo.nickname || '未命名用户' }}</text>
            </view>
            <view class="list-row">
              <text class="list-label">用户 ID</text>
              <text class="list-value">{{ userInfo.id || '-' }}</text>
            </view>
          </view>
        </view>
      </xxt-common-unlogin>
    </view>
  </xxt-layout>
</template>

<script setup lang="ts">
import { HOME_DESCRIPTION } from '@/uni-module-common/pages/page-helper';

const loginUrl = `/pages/index/index`;
const homeDescription = HOME_DESCRIPTION;
const { userInfo } = useStore('user');
</script>

<style scoped lang="scss">
.page-container {
  min-height: 100vh;
  padding: 32rpx 28rpx 180rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f6fff8 0%, #ffffff 42%, #f3f6f4 100%);
}

.page-card {
  padding: 32rpx 28rpx;
  border: 2rpx solid rgba(74, 217, 117, 0.12);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18rpx 48rpx rgba(35, 66, 44, 0.08);
}

.hero-card {
  margin-bottom: 24rpx;
}

.page-tag {
  display: inline-flex;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(74, 217, 117, 0.16);
  color: #278f49;
  font-size: 22rpx;
  font-weight: 600;
}

.page-title {
  margin-top: 20rpx;
  color: #183121;
  font-size: 46rpx;
  font-weight: 700;
}

.page-desc,
.section-text {
  margin-top: 16rpx;
  color: #5b6b61;
  font-size: 26rpx;
  line-height: 1.8;
}

.section-title {
  color: #1e3727;
  font-size: 32rpx;
  font-weight: 700;
}

.profile-list {
  margin-top: 24rpx;
  border-radius: 24rpx;
  background: #f6faf7;
  overflow: hidden;
}

.list-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  padding: 24rpx 22rpx;
  border-bottom: 2rpx solid rgba(32, 74, 43, 0.06);
}

.list-row:last-child {
  border-bottom: 0;
}

.list-label {
  color: #587062;
  font-size: 24rpx;
}

.list-value {
  color: #1f3527;
  font-size: 24rpx;
  font-weight: 600;
  text-align: right;
  word-break: break-all;
}
</style>
