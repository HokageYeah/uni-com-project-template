<template>
  <view class="root-view">
    <tui-modal :show="showModal" custom padding="32rpx" width="79%">
      <view class="tui-modal-custom">
        <tui-text
          padding="0 0 32rpx 0"
          :font-weight="900"
          :font-size="modalTitleFontSize"
          :color="modalTitleColor"
          align="center"
          block
          :text="modalTitle"
        ></tui-text>
        <slot name="modalContent" />
        <template v-if="isCustomeFooter">
          <slot name="modalFooter"></slot>
        </template>
        <template v-else>
          <view
            class="thorui-flex__between"
            :style="oneButtonStyle"
            style="gap: 0 38rpx; margin-top: 32rpx"
          >
            <tui-form-button
              v-if="isShowCancelBtn"
              radius="50px"
              :color="cancelButtonTextColor"
              :width="btnWidth"
              :height="btnHeight"
              :background="cancelButtonBgColor"
              :border-color="cancelButtonBorderColor"
              bold
              @click="closeClick"
              >{{ cancelText }}</tui-form-button
            >
            <tui-form-button
              v-if="isShowConfirmBtn"
              radius="50px"
              :color="confirmButtonTextColor"
              :width="btnWidth"
              :height="btnHeight"
              :background="confirmButtonBgColor"
              :border-color="confirmButtonBorderColor"
              bold
              @click="confirmClick"
              >{{ confirmText }}</tui-form-button
            >
          </view>
        </template>
      </view>
    </tui-modal>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    showModal: boolean;
    modalTitle?: string; // 弹窗标题
    modalTitleFontSize?: string; // 弹窗标题字体大小
    modalTitleColor?: string; // 弹窗标题颜色
    isCustomeFooter?: boolean; // 是否自定义底部
    cancelText?: string; // 取消按钮文本
    confirmText?: string; // 确认按钮文本
    isShowCancelBtn?: boolean; // 是否显示取消按钮
    isShowConfirmBtn?: boolean; // 是否显示确认按钮
    btnWidth?: string; // 按钮宽度
    btnHeight?: string;
    btnBgColor?: string; // 兼容旧版本：确认按钮背景色
    cancelBtnBgColor?: string; // 取消按钮背景色
    cancelBtnBorderColor?: string; // 取消按钮边框色
    cancelBtnTextColor?: string; // 取消按钮文字色
    confirmBtnBgColor?: string; // 确认按钮背景色
    confirmBtnBorderColor?: string; // 确认按钮边框色
    confirmBtnTextColor?: string; // 确认按钮文字色
  }>(),
  {
    showModal: false,
    modalTitle: '',
    isCustomeFooter: false,
    cancelText: '取消',
    confirmText: '确定',
    isShowCancelBtn: true,
    isShowConfirmBtn: true,
    btnWidth: '246rpx',
    btnHeight: '72rpx',
    modalTitleFontSize: '32rpx',
    modalTitleColor: '#222222',
    btnBgColor: '#4AD975',
    cancelBtnBgColor: '#FFFFFF',
    cancelBtnBorderColor: '#4AD975',
    cancelBtnTextColor: '#4AD975',
    confirmBtnBgColor: '',
    confirmBtnBorderColor: '',
    confirmBtnTextColor: '#FFFFFF'
  }
);
const emits = defineEmits<{ (e: 'closeClick'): void; (e: 'confirmClick'): void }>();

/**
 * 取消按钮背景色
 * 默认保持旧版白底按钮效果
 */
const cancelButtonBgColor = computed(() => {
  return props.cancelBtnBgColor;
});

/**
 * 取消按钮边框色
 * 默认保持旧版绿色描边效果
 */
const cancelButtonBorderColor = computed(() => {
  return props.cancelBtnBorderColor;
});

/**
 * 取消按钮文字色
 * 默认保持旧版绿色文案效果
 */
const cancelButtonTextColor = computed(() => {
  return props.cancelBtnTextColor;
});

/**
 * 确认按钮背景色
 * confirmBtnBgColor 优先，未传时兼容旧版 btnBgColor
 */
const confirmButtonBgColor = computed(() => {
  return props.confirmBtnBgColor || props.btnBgColor;
});

/**
 * 确认按钮边框色
 * 未单独传入时与确认按钮背景色保持一致
 */
const confirmButtonBorderColor = computed(() => {
  return props.confirmBtnBorderColor || confirmButtonBgColor.value;
});

/**
 * 确认按钮文字色
 * 默认保持旧版白字效果
 */
const confirmButtonTextColor = computed(() => {
  return props.confirmBtnTextColor;
});

const oneButtonStyle = computed(() => {
  if (!props.isShowCancelBtn || !props.isShowConfirmBtn) {
    return {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    };
  } else {
    return {};
  }
});
const closeClick = () => {
  emits('closeClick');
};
const confirmClick = () => {
  emits('confirmClick');
};
</script>

<style scoped></style>
