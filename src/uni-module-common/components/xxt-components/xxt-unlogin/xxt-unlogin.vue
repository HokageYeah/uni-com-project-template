<template>
  <view class="xxt-unlogin">
    <view class="tip">{{ props.tip }}</view>
    <view v-if="props.showBtn" class="btn-wrap">
      <tui-form-button
        :background="btnBackground"
        width="304rpx"
        radius="50rpx"
        style="margin: 0 auto; width: 304rpx; display: inline-block"
        @click="go2Login"
      >
        {{ props.btnDesc }}
      </tui-form-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { resolveUnloginRedirectUrl } from './unlogin-helper';
import { redirectToLoginPage } from '@/uni-module-common/auth';

const props = defineProps({
  /**
   * 未登录占位提示文案。
   */
  tip: {
    type: String,
    default: '您尚未登录，请先登录'
  },
  /**
   * 是否显示按钮，保留原组件对外接口。
   */
  showBtn: {
    type: Boolean,
    default: true
  },
  /**
   * 按钮文案，默认仍显示“登录”。
   */
  btnDesc: {
    type: String,
    default: '登录'
  },
  /**
   * 兼容旧接口保留，但组件内部不再根据该字段切换桥接登录逻辑。
   */
  toLogin: {
    type: Boolean,
    default: true
  },
  /**
   * 直接指定登录后的回跳地址。
   */
  url: {
    type: String,
    required: false,
    default: ''
  },
  /**
   * 兼容上层容器透传的登录回跳地址。
   */
  loginUrl: {
    type: String,
    required: false,
    default: ''
  }
});

const emits = defineEmits(['clickBtn']);

const btnBackground = 'linear-gradient(90deg, rgb(82, 239, 129), rgb(74, 217, 117))';

/**
 * `xxt-unlogin` 是统一的未登录占位与登录入口组件。
 * 组件不再内置原生 bridge、朗读小程序特判等旧工程逻辑，
 * 点击按钮后统一进入登录页。
 */
const go2Login = async () => {
  const redirectUrl = resolveUnloginRedirectUrl(props.url, props.loginUrl);
  console.log('[未登录占位] 点击登录按钮，准备进入登录页', {
    url: props.url,
    loginUrl: props.loginUrl,
    redirectUrl
  });
  emits('clickBtn');
  await redirectToLoginPage(redirectUrl);
};
</script>

<style scoped lang="scss">
.xxt-unlogin {
  min-height: 55vh;
  padding-top: 45%;
  background-color: #fff;
  text-align: center;
}

.tip {
  color: #666;
  font-size: 28rpx;
  font-weight: bold;
}

.btn-wrap {
  margin-top: 52rpx;
}
</style>
