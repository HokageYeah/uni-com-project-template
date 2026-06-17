<template>
  <view class="xxt-swiper">
    <swiper
      class="tui-banner__height"
      circular
      :indicator-dots="false"
      autoplay
      :interval="4000"
      :duration="150"
      @change="bannerChange"
    >
      <block v-for="(item, index) in swiperList" :key="index">
        <swiper-item>
          <slot name="content" :item="item"></slot>
        </swiper-item>
      </block>
    </swiper>
    <view v-if="indicatorDots" class="tui-swiper-dots">
      <tui-swiper-dot
        :type="1"
        :count="dotCount"
        :current="currentIndex"
        width="16rpx"
        height="8rpx"
        radius="82rpx"
        background-color="#eaeaea"
        active-bg-color="#4ad975"
      ></tui-swiper-dot>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    // 轮播图列表
    swiperList: any[];
    // 是否显示指示器
    indicatorDots: boolean;
    // 轮播图高度
    height: number;
  }>(),
  {
    swiperList: () => [],
    indicatorDots: true,
    height: 188
  }
);
const dotCount = computed(() => props.swiperList.length);
const currentIndex = ref(0);
const bannerChange = (e: any) => {
  currentIndex.value = e.detail.current;
};
</script>

<style scoped lang="scss">
.xxt-swiper {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  /* background-color: yellow; */
}
.tui-banner__height {
  height: 100%;
}
.tui-swiper-dots {
  position: absolute;
  /* position: relative; */
  /* background: red; */
  height: 20px;
  width: 100%;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
}
</style>
