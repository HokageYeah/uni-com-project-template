<template>
  <xxt-layout tabbar="/pages/mine/mine">
    <view class="page-container">
      <view class="page-card profile-card">
        <view class="page-tag">Mine</view>
        <view class="page-title">我的</view>
        <view v-if="isLogin" class="page-desc">
          当前页面展示当前用户信息，后续业务项目可以在这里继续补充订单、设置或账户能力。
        </view>
        <view v-else class="page-desc">
          {{ mineVisitorTitle }}。这里展示的是游客态，点击按钮后会统一进入登录页。
        </view>
      </view>

      <view v-if="isLogin" class="page-card">
        <view class="profile-head">
          <image v-if="userInfo.avatar" :src="userInfo.avatar" class="avatar"></image>
          <view v-else class="avatar avatar-fallback">
            {{ (userInfo.nickname || 'U').slice(0, 1) }}
          </view>
          <view class="profile-meta">
            <view class="nickname">{{ userInfo.nickname || '未命名用户' }}</view>
            <view class="status-text">当前为登录态</view>
          </view>
        </view>

        <view class="profile-list">
          <view v-for="item in profileRows" :key="item.label" class="list-row">
            <text class="list-label">{{ item.label }}</text>
            <text class="list-value">{{ item.value }}</text>
          </view>
        </view>

        <view class="request-example">
          <view class="section-title">用户信息接口</view>
          <view class="section-text">
            这里使用 request&lt;T&gt; 调用当前用户信息接口，并通过 custom.auth 显式声明登录要求。
          </view>
          <view class="request-result">{{ currentUserSummary }}</view>
          <view v-if="errorText" class="request-error">{{ errorText }}</view>
          <tui-form-button
            radius="999px"
            plain
            background="#3967b4"
            color="#3967b4"
            :disabled="profileRequestLoading"
            @click="loadCurrentUserInfo"
          >
            {{ profileRequestLoading ? '刷新中...' : '刷新用户信息' }}
          </tui-form-button>
        </view>

        <view class="action-wrap">
          <tui-form-button
            radius="999px"
            plain
            background="#4ad975"
            color="#4ad975"
            :disabled="logoutSubmitting"
            @click="handleLogout"
          >
            {{ logoutSubmitting ? '退出中...' : '退出登录' }}
          </tui-form-button>
        </view>
      </view>

      <view v-else class="page-card">
        <view class="section-title">游客态</view>
        <view class="section-text">
          系统默认允许未登录进入“我的”页，用于支持游客态与登录态的切换关系。
        </view>
        <tui-form-button radius="999px" background="#4ad975" height="88rpx" @click="handleGoLogin">
          进入登录页
        </tui-form-button>
      </view>
    </view>
  </xxt-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMineProfileRequest } from './hooks/use-mine-profile-request';
import { logoutUser, redirectToLoginPage } from '@/uni-module-common/auth';

const MINE_VISITOR_TITLE = '当前处于游客模式';

const { isLogin, userInfo } = useStore('user');

const mineVisitorTitle = MINE_VISITOR_TITLE;
const profileRows = computed(() => [
  {
    label: '用户 ID',
    value: `${userInfo.value.id ?? ''}` || '-'
  },
  {
    label: '昵称',
    value: userInfo.value.nickname || '-'
  },
  {
    label: '头像',
    value: userInfo.value.avatar || '-'
  },
  {
    label: '手机号',
    value: userInfo.value.mobile || '-'
  }
]);
const logoutSubmitting = ref(false);
const {
  loading: profileRequestLoading,
  currentUserSummary,
  errorText,
  loadCurrentUserInfo
} = useMineProfileRequest();

const handleGoLogin = async () => {
  console.log('[我的页] 游客点击登录按钮，准备跳转登录页');
  await redirectToLoginPage('/pages/mine/mine');
};

const confirmLogout = () => {
  return new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '退出登录',
      content: '确认退出当前登录状态吗？',
      confirmColor: '#4ad975',
      success: (result) => {
        resolve(Boolean(result.confirm));
      },
      fail: () => {
        resolve(false);
      }
    });
  });
};

const handleLogout = async () => {
  if (logoutSubmitting.value) {
    return;
  }

  const shouldLogout = await confirmLogout();
  if (!shouldLogout) {
    return;
  }

  logoutSubmitting.value = true;

  try {
    await logoutUser();
    logoutSubmitting.value = false;
    uni.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  } catch (error) {
    logoutSubmitting.value = false;
    console.warn('[我的页] 退出登录流程执行失败', {
      错误摘要: error instanceof Error ? error.message : '未知错误'
    });
  }
};
</script>

<style scoped lang="scss">
.page-container {
  min-height: 100vh;
  padding: 32rpx 28rpx 180rpx;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f7fbff 0%, #ffffff 48%, #f4f5f9 100%);
}

.page-card {
  padding: 32rpx 28rpx;
  border: 2rpx solid rgba(76, 129, 203, 0.12);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18rpx 44rpx rgba(44, 61, 89, 0.08);
}

.profile-card {
  margin-bottom: 24rpx;
}

.page-tag {
  display: inline-flex;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(89, 130, 214, 0.14);
  color: #3967b4;
  font-size: 22rpx;
  font-weight: 600;
}

.page-title {
  margin-top: 20rpx;
  color: #18283c;
  font-size: 46rpx;
  font-weight: 700;
}

.page-desc,
.section-text {
  margin-top: 16rpx;
  color: #60708a;
  font-size: 26rpx;
  line-height: 1.8;
}

.section-title,
.nickname {
  color: #20324c;
  font-size: 32rpx;
  font-weight: 700;
}

.profile-head {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #6b9cff 0%, #4ad975 100%);
  color: #fff;
  font-size: 40rpx;
  font-weight: 700;
}

.status-text {
  margin-top: 8rpx;
  color: #6a7890;
  font-size: 24rpx;
}

.profile-list {
  margin-top: 24rpx;
  border-radius: 24rpx;
  background: #f5f8fc;
  overflow: hidden;
}

.request-example {
  margin-top: 28rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f8fbff;
}

.request-result {
  margin: 18rpx 0;
  color: #20324c;
  font-size: 24rpx;
  line-height: 1.7;
}

.request-error {
  margin-bottom: 18rpx;
  color: #d94a4a;
  font-size: 24rpx;
  line-height: 1.7;
}

.action-wrap {
  margin-top: 28rpx;
}

.list-row {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  padding: 24rpx 22rpx;
  border-bottom: 2rpx solid rgba(40, 66, 109, 0.06);
}

.list-row:last-child {
  border-bottom: 0;
}

.list-label {
  color: #63738d;
  font-size: 24rpx;
}

.list-value {
  color: #20324c;
  font-size: 24rpx;
  font-weight: 600;
  text-align: right;
  word-break: break-all;
}
</style>
