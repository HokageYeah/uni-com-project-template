<template>
  <view
    class="textarea-mask"
    :class="{ 'textarea-mask-show': popupShow }"
    :style="{ bottom: `${keyboardHeight === 0 ? '-100%' : keyboardHeight}px` }"
  >
    <view class="textarea-container">
      <view class="textarea-wrapper">
        <tui-textarea
          :value="linkText"
          height="150rpx"
          min-height="150rpx"
          :placeholder="placeholder"
          :maxlength="maxlength"
          border-color="#e5e5e5"
          :textarea-border="true"
          padding="10rpx 10rpx"
          radius="6"
          :focus="focus"
          @input="callBackInput"
          @focus="callBackFocus"
          @blur="callBackBlur"
          @keyboardheightchange="keyboardheightchange"
        ></tui-textarea>
      </view>
      <tui-form-button
        class="submit-button"
        background="#4bd975"
        size="26"
        type="warning"
        width="80rpx"
        height="60rpx"
        @click="linkSure"
        >确定</tui-form-button
      >
    </view>
    <view v-if="popupShow" class="mask" @click="hiddenPopup"></view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    placeholder?: string;
    isCommon?: boolean;
    maxlength?: number;
  }>(),
  {
    placeholder: '请输入内容',
    isCommon: false,
    maxlength: 120
  }
);

const emits = defineEmits<{
  (e: 'linkSure', linkText: string): void;
  (e: 'linkCancel'): void;
  (e: 'inputChange', linkText: string): void;
}>();

const popupShow = ref(false);
const focus = ref(false);
const clear = false;
const linkText = ref('');
const keyboardHeight = ref(0);
const platform = ref('');
const isAndroid = ref(false);
onMounted(() => {
  platform.value = uni.getSystemInfoSync().platform;
  isAndroid.value = platform.value === 'android';
  console.log('当前平台:', platform.value);
});

// 显示输入框
const showPopup = () => {
  popupShow.value = true;
  nextTick(() => {
    focus.value = true;
  });
};

// 隐藏输入框
const hiddenPopup = () => {
  popupShow.value = false;
  focus.value = false;
  keyboardHeight.value = 0;
  emits('linkCancel');
};

// 输入框获取焦点
const callBackFocus = (e: any) => {
  console.log('输入框获取焦点', e);
};

// 输入框失去焦点
const callBackBlur = (e: any) => {
  console.log('输入框失去焦点', e);
};

// 键盘高度变化
const keyboardheightchange = (e: any) => {
  console.log('键盘高度变化', e);
  const originalHeight = e.height || 0;

  // 安卓平台特殊处理
  if (isAndroid.value && originalHeight > 0) {
    // #ifdef MP-WEIXIN
    // 微信小程序安卓端，键盘高度可能需要调整
    keyboardHeight.value = 44; // 增加一些高度补偿
    // #endif

    // #ifdef H5
    keyboardHeight.value = originalHeight;
    // #endif

    // #ifdef APP-PLUS
    keyboardHeight.value = originalHeight - 10;
    // #endif
  } else {
    keyboardHeight.value = originalHeight;
  }

  // 如果键盘收起，且不是主动清空操作
  if (e.height <= 0 && !clear) {
    // 延迟隐藏，避免闪烁
    setTimeout(() => {
      hiddenPopup();
    }, 100);
  }
};

// 输入内容变化
const callBackInput = (e: any) => {
  linkText.value = e;
  emits('inputChange', e);
};

// 确认输入
const linkSure = () => {
  if (props.isCommon) {
    emits('linkSure', linkText.value);
    linkText.value = '';
    hiddenPopup();
    return;
  }

  const regex = /^((http|https):\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,}){1,}(\S*)$/;
  if (regex.test(linkText.value)) {
    emits('linkSure', linkText.value);
    linkText.value = '';
    hiddenPopup();
  } else {
    uni.showToast({
      title: `您输入的链接地址不正确，请检查后重新输入`,
      mask: true,
      duration: 2000,
      icon: 'none',
      fail: () => {
        uni.hideToast();
      }
    });
  }
};

// 暴露方法
defineExpose({ showPopup, hiddenPopup });
</script>

<style scoped lang="scss">
.textarea-mask {
  position: fixed;
  left: 0;
  right: 0;
  bottom: -100%;
  z-index: 1001;
  transition: bottom 0.3s;

  &-show {
    bottom: 0;
  }

  .mask {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
}

.textarea-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px 20px;
  background-color: #fff;
  border-top: 1px solid #e5e5e5;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);

  .textarea-wrapper {
    flex: 1;
    margin-right: 10px;
  }

  .submit-button {
    flex-shrink: 0;
  }
}
</style>
