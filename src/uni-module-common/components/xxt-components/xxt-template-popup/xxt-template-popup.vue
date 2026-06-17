<template>
  <tui-bottom-popup
    :show="showMessageTemplatePopup"
    background-color="#FFFFFF"
    :z-index="1002"
    :mask-z-index="1001"
    @close="emits('update:showMessageTemplatePopup', false)"
  >
    <view class="container" :style="{ height: `${height}px` }">
      <view class="container-header">
        <!-- 空的view -->
        <view class="container-header-empty"></view>
        <tui-text size="32" color="#666666" :text="title" font-weight="400" />
        <!-- 关闭按钮 -->
        <view
          class="container-header-close"
          @click="emits('update:showMessageTemplatePopup', false)"
        >
          <tui-icon name="shut" size="24" color="#666666" />
        </view>
      </view>
      <view class="container-content">
        <!-- 可以滑动的内容 -->
        <view class="book-list-bg">
          <scroll-view
            scroll-y
            style="height: 100%"
            :show-scrollbar="false"
            :refresher-enabled="isRefresherEnabled"
            :refresher-triggered="trigger"
            @refresherrefresh="refresherrefreshDebounce"
            @scrolltolower="onLoadMoreDynamicThrottle"
            @touchmove.stop
          >
            <block v-for="item in templateList" :key="item.id">
              <slot name="content" :item="item"></slot>
            </block>
          </scroll-view>
        </view>
      </view>
      <view class="container-footer">
        <!-- 确定按钮 -->
        <tui-form-button
          style="width: 100%"
          radius="116rpx"
          background="#4AD975"
          @click="bottomButtonClick"
        >
          <view class="footer-content thorui-align__center">
            <text>{{ bottomButtonText }}</text>
          </view>
        </tui-form-button>
      </view>
    </view>
  </tui-bottom-popup>
</template>

<script setup lang="ts">
import { useDebounceFn, useThrottleFn } from '@vueuse/core';

const props = withDefaults(
  defineProps<{
    showMessageTemplatePopup: boolean; // 弹窗是否显示
    title: string; // 标题
    templateList: any[]; // 模版列表
    height?: number; // 弹窗高度， 默认400px
    bottomButtonText?: string; // 确定按钮文本
    trigger?: boolean; // 下拉刷新是否触发
    isRefresherEnabled?: boolean; // 是否开启下拉刷新
  }>(),
  {
    showMessageTemplatePopup: false,
    title: '',
    height: 400,
    templateList: () => [],
    bottomButtonText: '确定',
    trigger: false,
    isRefresherEnabled: false
  }
);
const emits = defineEmits<{
  // 更新弹窗是否显示
  (e: 'update:showMessageTemplatePopup', value: boolean): void;
  // 确定按钮点击
  (e: 'bottomButtonClick'): void;
  // 下拉刷新
  (e: 'refresherrefresh'): void;
  // 加载更多
  (e: 'onLoadMore'): void;
}>();
const bottomButtonClick = () => {
  emits('bottomButtonClick');
};

const refresherrefreshDebounce = useDebounceFn(() => emits('refresherrefresh'), 500);
const onLoadMoreDynamicThrottle = useThrottleFn(() => emits('onLoadMore'), 1000);
</script>

<style scoped lang="scss">
.container {
  background-color: #fff;
}

/* 头部 */
.container-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 50px;
  padding: 16px;
  box-sizing: border-box;
  /* background-color: blue; */
  &-empty {
    width: 24px;
  }
  &-close {
    width: 24px;
    height: 24px;
  }
}

.container-content {
  /* flex: 1; */
  @include normalFlex(column, flex-start, center);
  /* background: red; */
  padding: 0 16px;
  height: calc(100% - 58px - 50px);
  box-sizing: border-box;
}
.book-list-bg {
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  /* background-color: yellow; */
}
.container-footer {
  @include normalFlex(column, center, center);
  height: 58px;
  padding: 0px 16px;
  /* background-color: orange; */
  box-sizing: border-box;
}
</style>
