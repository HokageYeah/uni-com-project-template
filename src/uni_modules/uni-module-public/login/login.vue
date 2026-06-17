<template>
  <view class="scaffold-login-page">
    <view class="scaffold-login-card">
      <view class="scaffold-login-badge">Scaffold Login</view>
      <view class="scaffold-login-title">脚手架登录页</view>
      <view class="scaffold-login-desc">
        当前页面是通用脚手架占位登录页，真实登录流程、接口和视觉样式需要由后续业务项目自行补充。
      </view>

      <view class="scaffold-login-panel">
        <view class="scaffold-login-label">当前回跳地址</view>
        <view class="scaffold-login-redirect">{{ redirectUrl }}</view>
      </view>

      <view class="scaffold-login-panel">
        <view class="scaffold-login-label">当前说明</view>
        <view class="scaffold-login-note">
          当前按钮会写入脚手架假登录数据并按历史兼容参数 `redictUrl`
          回跳；后续业务项目必须替换为真实登录接口。
        </view>
      </view>

      <view class="scaffold-login-actions">
        <tui-form-button
          radius="999px"
          background="#4ad975"
          :disabled="submitting"
          @click="handleScaffoldLogin"
        >
          {{ submitting ? '登录处理中...' : '脚手架假登录' }}
        </tui-form-button>
        <tui-form-button
          radius="999px"
          plain
          background="#4ad975"
          color="#4ad975"
          :disabled="submitting"
          @click="handleSkipLogin"
        >
          暂不登录
        </tui-form-button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import {
  DEFAULT_LOGIN_REDIRECT_URL,
  SCAFFOLD_LOGIN_USER,
  buildScaffoldLoginStatePayload,
  getScaffoldRedirectPath,
  isScaffoldTabBarRedirectUrl,
  resolveScaffoldLoginRedirectUrl
} from './scaffold-login';

/**
 * 这是脚手架占位登录页的核心状态：
 * - `redirectUrl` 统一承接登录后的回跳地址
 * - `submitting` 用于避免重复点击登录接入位
 */
const redirectUrl = ref(DEFAULT_LOGIN_REDIRECT_URL);
const submitting = ref(false);

/**
 * 解析并记录最终回跳地址。
 * 这里优先使用路由 `redictUrl`，其次消费 store 中已经记录的地址，
 * 保证“页面主动跳登录”和“请求拦截跳登录”都能回到同一个目标页。
 */
onLoad((options) => {
  const { consumeLoginRedirect, setLoginRedirectUrl } = useStore('user');
  const storedRedirectUrl = consumeLoginRedirect();
  const nextRedirectUrl = resolveScaffoldLoginRedirectUrl(
    `${options?.redictUrl || ''}`,
    storedRedirectUrl
  );

  console.info('[脚手架登录页] 初始化回跳地址', {
    路由参数回跳地址: options?.redictUrl || '',
    store回跳地址: storedRedirectUrl,
    最终回跳地址: nextRedirectUrl
  });

  redirectUrl.value = nextRedirectUrl;
  setLoginRedirectUrl(nextRedirectUrl);
});

/**
 * 若目标页已存在于页面栈中，则直接返回原页面，避免登录后又重复打开一层相同页面。
 */
const parseRouteQuery = (queryString = '') => {
  const query: Record<string, string> = {};

  queryString
    .split('&')
    .filter(Boolean)
    .forEach((item) => {
      const [rawKey = '', ...rawValueParts] = item.split('=');
      const key = decodeURIComponent(rawKey);
      const value = decodeURIComponent(rawValueParts.join('='));

      if (key) {
        query[key] = value;
      }
    });

  return query;
};

const navigateBackToExistingPage = (targetUrl: string) => {
  const [targetPath = '', targetQueryString = ''] = targetUrl.split('?');
  const targetQuery = parseRouteQuery(targetQueryString);
  const pages = getCurrentPages();

  for (let index = pages.length - 2; index >= 0; index--) {
    const page: any = pages[index];
    const pagePath = `/${page.route || page.__route__ || ''}`;
    const pageOptions = page.options || {};
    const isSamePath = pagePath === targetPath;
    const isSameQuery = Object.keys(targetQuery).every((key) => {
      const value = targetQuery[key];
      return `${pageOptions[key] ?? ''}` === value;
    });

    if (isSamePath && isSameQuery) {
      uni.navigateBack({
        delta: pages.length - 1 - index
      });
      return true;
    }
  }

  return false;
};

/**
 * 统一处理登录后的回跳。
 * - 优先回退已有页面，避免页面栈里出现两个相同业务页
 * - 普通页先走 `redirectTo`
 * - tabBar 页或 redirect 失败时，退回 `switchTab` / `reLaunch`
 */
const navigateToRedirectUrl = (targetUrl: string) => {
  if (navigateBackToExistingPage(targetUrl)) {
    return;
  }

  if (isScaffoldTabBarRedirectUrl(targetUrl)) {
    uni.switchTab({
      url: getScaffoldRedirectPath(targetUrl),
      fail: () => {
        uni.reLaunch({
          url: targetUrl
        });
      }
    });
    return;
  }

  uni.redirectTo({
    url: targetUrl,
    fail: () => {
      const tabCandidatePath = targetUrl.split('?')[0];
      uni.switchTab({
        url: tabCandidatePath,
        fail: () => {
          uni.reLaunch({
            url: targetUrl
          });
        }
      });
    }
  });
};

/**
 * 脚手架假登录：
 * 这里故意写入一份假的最小登录态，让脚手架工程可以直接跑通“未登录 -> 登录 -> 回跳”。
 * 后续业务项目必须把这段替换为真实登录接口，并使用后端返回的 token 与用户信息写入 `setLoginState`。
 */
const handleScaffoldLogin = async () => {
  if (submitting.value) {
    return;
  }

  submitting.value = true;
  const { setLoginState, setLoginRedirectUrl } = useStore('user');

  try {
    const loginStatePayload = buildScaffoldLoginStatePayload(
      'fake-scaffold-login-token',
      SCAFFOLD_LOGIN_USER
    );
    console.info('[脚手架登录页] 执行脚手架假登录，后续业务项目必须替换真实接口', {
      回跳地址: redirectUrl.value,
      用户ID: SCAFFOLD_LOGIN_USER.id
    });
    setLoginState(loginStatePayload);
    setLoginRedirectUrl('');
    navigateToRedirectUrl(redirectUrl.value);
  } finally {
    submitting.value = false;
  }
};

/**
 * 暂不登录时直接回退当前页；如果当前页无法返回，则回到默认回跳页。
 */
const handleSkipLogin = () => {
  console.info('[脚手架登录页] 用户选择暂不登录', redirectUrl.value);
  uni.navigateBack({
    delta: 1,
    fail: () => {
      navigateToRedirectUrl(redirectUrl.value || DEFAULT_LOGIN_REDIRECT_URL);
    }
  });
};
</script>

<style scoped lang="scss">
.scaffold-login-page {
  min-height: 100vh;
  padding: 48rpx 32rpx;
  box-sizing: border-box;
  background: radial-gradient(circle at top left, rgba(74, 217, 117, 0.22), transparent 42%),
    linear-gradient(180deg, #f5fff7 0%, #ffffff 48%, #f3f8f4 100%);
}

.scaffold-login-card {
  margin-top: 96rpx;
  padding: 48rpx 40rpx;
  border: 2rpx solid rgba(74, 217, 117, 0.14);
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 20rpx 60rpx rgba(34, 56, 43, 0.08);
}

.scaffold-login-badge {
  display: inline-flex;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(74, 217, 117, 0.14);
  color: #27984c;
  font-size: 22rpx;
  font-weight: 600;
}

.scaffold-login-title {
  margin-top: 24rpx;
  color: #1b2b1f;
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1.3;
}

.scaffold-login-desc {
  margin-top: 20rpx;
  color: #5b6d60;
  font-size: 28rpx;
  line-height: 1.8;
}

.scaffold-login-panel {
  margin-top: 28rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #f6faf6;
}

.scaffold-login-label {
  color: #2b8a46;
  font-size: 24rpx;
  font-weight: 600;
}

.scaffold-login-redirect,
.scaffold-login-note {
  margin-top: 12rpx;
  color: #33443a;
  font-size: 26rpx;
  line-height: 1.8;
  word-break: break-all;
}

.scaffold-login-actions {
  margin-top: 36rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
</style>
