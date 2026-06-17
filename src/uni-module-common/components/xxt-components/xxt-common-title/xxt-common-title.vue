<template>
  <view class="root">
    <view class="root-content">
      <image v-if="isShowMark" :src="`${$cdn}${markSrc}`" class="mark" />
      <view
        v-if="title.length > 0"
        class="title-text"
        :style="{ fontSize: `${titleFontSize}px`, color: titleColor }"
        >{{ title }}</view
      >
      <view v-if="slots['left-extra']" class="title-extra">
        <slot name="left-extra"></slot>
      </view>
    </view>
    <slot name="right"></slot>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    title: string; // 标题
    markSrc?: string; // 标记图片
    isShowMark?: boolean; // 是否显示标记
    // 标题字体大小 默认18px
    titleFontSize?: number;
    // 标题字体颜色 默认#222
    titleColor?: string;
  }>(),
  {
    title: '',
    markSrc: '/nb/m/uni-zhyd/img/class_study_title_guidance.png',
    isShowMark: true,
    titleFontSize: 18,
    titleColor: '#222'
  }
);

const slots = useSlots();
</script>

<style lang="scss" scoped>
.root {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  .root-content {
    display: flex;
    justify-content: flex-start;
    align-items: center;
  }
  .mark {
    width: 8px;
    height: 16px;
  }
  .title-text {
    margin-left: 8px;
    font-weight: bold;
    font-size: 18px;
    color: #222;
  }
  .title-extra {
    display: flex;
    align-items: center;
    margin-left: 8px;
  }
}
</style>
