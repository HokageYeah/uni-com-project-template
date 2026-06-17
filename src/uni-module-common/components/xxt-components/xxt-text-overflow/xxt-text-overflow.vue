<template>
  <view v-if="props.text" class="xxt-text-overflow">
    <!-- 注: 此处展示文本内容 -->
    <tui-overflow-hidden
      id="hiddenView"
      ref="hiddenView"
      :type="showAllText ? 0 : 1"
      size="28"
      :line-clamp="props.clamp"
      style="line-height: 26px; white-space: pre-line"
    >
      <slot name="firstSlot"></slot>
      <text>{{ props.text }}</text>
    </tui-overflow-hidden>
    <!-- 此处用于展示超出文本省略的样式，用于获取高度判断是否展示「收起/展开」按钮 -->
    <tui-overflow-hidden
      v-if="showHiddenExample"
      id="hiddenExampleView"
      ref="hiddenExampleView"
      :type="0"
      size="28"
      style="visibility: hidden; line-height: 26px; white-space: pre-line"
    >
      <slot name="firstSlot"></slot>
      <text>{{ props.text }}</text>
    </tui-overflow-hidden>
    <slot
      name="default"
      :show-all-text="showAllText"
      :click-switch="clickHiddenBtn"
      :overflow-hidden-flag="overflowHiddenFlag"
    ></slot>
    <!-- 是否是收起、展开按钮 -->
    <view
      v-if="!props.showHiddenBtn && overflowHiddenFlag && props.showExpandBtn"
      :class="showAllText ? 'collapse-btn' : 'expand-btn'"
      :style="{
        background: `linear-gradient(to right,rgba(${props.expandBackgroundColor}, 0.4) 0%,rgba(${props.expandBackgroundColor}, 0.6) 15%,rgba(${props.expandBackgroundColor}, 0.8) 30%,rgba(${props.expandBackgroundColor}, 1) 45%,rgba(${props.expandBackgroundColor}, 1) 100%)`
      }"
      @click="clickHiddenBtn"
    >
      <tui-text :text="showAllText ? '收起' : '展开'" type="success" size="28"></tui-text>
    </view>
    <!-- 是否是收起详情、展开详情按钮 -->
    <view
      v-if="props.showHiddenBtn && overflowHiddenFlag && !props.showExpandBtn"
      style="text-align: center"
      @click="clickHiddenBtn"
    >
      <tui-text :text="showAllText ? '收起详情' : '展开详情'" type="success" size="28"></tui-text>
      <tui-icon :name="showAllText ? 'arrowup' : 'arrowdown'" color="#4ad975" size="16"></tui-icon>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const props = defineProps({
  // 文本数据
  text: {
    type: String,
    default: ''
  },
  // 是否有收起/展示按钮
  showHiddenBtn: {
    type: Boolean,
    default: false
  },
  // 超过几行隐藏数据
  clamp: {
    type: Number,
    default: 1
  },
  // 是否默认隐藏
  defaultHide: {
    type: Boolean,
    default: false
  },
  // 是否有插槽
  hasSlot: {
    type: Boolean,
    default: false
  },
  // 是否是收起、展开按钮、当showHiddenBtn为false时，showExpandBtn为true时，显示展开、收起（两个字的按钮）按钮
  showExpandBtn: {
    type: Boolean,
    default: false
  },
  // 背景颜色采用 rgb的方式，传入数字，如：255,244,229
  expandBackgroundColor: {
    type: String,
    default: '255, 244, 229'
  }
});
const showAllText = ref(false);
const hiddenView = ref();
const overflowHiddenFlag = ref(false);
const hiddenExampleView = ref();
const showHiddenExample = ref(false);
const instance = getCurrentInstance();

const handleDefaultShow = () => {
  nextTick(() => {
    const query = uni.createSelectorQuery().in(instance);
    query.select('#hiddenView').boundingClientRect();
    query.select('#hiddenExampleView').boundingClientRect();
    query.exec((res) => {
      const height = (res as any)?.[0]?.height || 0;
      const hiddenHeight = (res as any)?.[1]?.height || 0;
      overflowHiddenFlag.value = height < hiddenHeight;
      console.log('overflowHiddenFlag---', overflowHiddenFlag.value);
      if (props.defaultHide) {
        showAllText.value = true;
      }
      showHiddenExample.value = false;
    });
  });
};

watch(
  () => props.text,
  (newV) => {
    if (newV) {
      if ((props.showHiddenBtn || props.hasSlot || props.showExpandBtn) && !showAllText.value) {
        showHiddenExample.value = true;
        handleDefaultShow();
      }
    }
  },
  { immediate: true }
);

const clickHiddenBtn = () => {
  showAllText.value = !showAllText.value;
};
</script>

<style scoped lang="scss">
$num: 3;
.text-overflow-#{$num} {
  display: -webkit-box;
  overflow: hidden; //超出隐藏
  -webkit-line-clamp: $num; //文字行数
  text-overflow: ellipsis; //文字超出省略号
  -webkit-box-orient: vertical;
}
.xxt-text-overflow {
  position: relative;
}
.expand-btn {
  position: absolute;
  /* background-color: transparent; */
  right: 4px;
  bottom: 0;
  margin-top: -10px;
  padding-left: 26px;
  cursor: pointer;
  text-align: right;
}
.collapse-btn {
  margin-top: 0;
  text-align: left;
}
</style>
