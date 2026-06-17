<template>
  <!-- 状态栏占位 -->
  <view :style="{ height: `${statusBarHeight}px` }"></view>

  <!-- 导航栏主体 - 左中右三部分布局 -->
  <view class="nav-bar" :style="{ height: `${navBarHeight}px` }">
    <!-- 左侧区域 -->
    <view v-if="backIcon" class="left-area">
      <view @click="goBack">
        <image :src="`${$cdn}${backIcon}`" style="width: 18px; height: 18px" />
      </view>
      <slot name="left"></slot>
    </view>

    <!-- 中间标题区域 -->
    <view class="center-area">
      <view v-if="title" style="display: flex; align-items: center">
        <view :style="titleStyle"> {{ title }}</view>
      </view>
      <slot name="center"></slot>
    </view>

    <!-- 右侧区域 -->
    <view class="right-area">
      <slot name="right"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

// 导航栏默认高度
const props = withDefaults(
  defineProps<{
    title?: string;
    titleStyle?: string;
    backIcon?: string;
    backFn?: (() => void) | null;
  }>(),
  {
    title: '',
    titleStyle: '',
    backIcon: '',
    backFn: null
  }
);
const router = useRouter();
const goBack = () => {
  // 如果emit有goBack事件，则调用goBack事件
  console.log('props.backFn---1-', props.backFn);
  if (props.backFn) {
    props.backFn();
  } else {
    // 否则调用router.back()
    router.back();
  }
};
// 状态变量
const statusBarHeight = ref(20);
const navBarHeight = ref(44);
onMounted(() => {
  try {
    // 获取系统信息，主要用于状态栏高度
    const info = uni.getSystemInfoSync();
    statusBarHeight.value = info.statusBarHeight || 20;

    // 非小程序环境下使用固定导航栏高度
    navBarHeight.value = 44;
  } catch (e) {
    console.error('获取系统信息失败', e);
  }
});
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  /* 可根据需要设置背景色 */
  /* background-color: #ffffff; */
}
/* 左侧区域 - 占1/3宽度 */
.left-area {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  box-sizing: border-box;
  padding-left: 12px;
  width: 23.333%;
}
/* 中间区域 - 占1/3宽度 */
.center-area {
  display: flex;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  width: 53.334%;
}
/* 右侧区域 - 占1/3宽度 */
.right-area {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  box-sizing: border-box;
  padding-right: 12px;
  width: 23.333%;
  gap: 15px; /* 右侧图标之间的间距 */
}
</style>
