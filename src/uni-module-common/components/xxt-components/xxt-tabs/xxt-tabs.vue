<template>
  <view>
    <!-- 顶部导航栏 tabs -->
    <scroll-view
      class="scroll-view-h"
      scroll-x
      :scroll-into-view="`id-${navIndex - 1}`"
      :style="tabsStyle"
      @scroll="scroll"
    >
      <slot name="tabs">
        <view class="tabs-default">
          <view
            v-for="(tab, index) in tabs"
            :id="`id-${index}`"
            :key="tab.id"
            class="scroll-view-item-h"
            :class="navIndex === index ? 'activite' : ''"
            :style="getTabItemStyle(index)"
            @tap="checkIndex(index)"
          >
            {{ tab.name }}
          </view>
          <view class="tab-tip tab-tip--moving" :style="tabIndicatorStyle"></view>
        </view>
      </slot>
    </scroll-view>

    <!-- 内容 tab -->
    <swiper v-if="slidingSwitchFlag" :current="navIndex" class="tab-content" @change="tabChange">
      <swiper-item v-for="(tab, index) in tabs" :key="tab.id" class="swiper-item">
        <slot name="tab">{{ `${index} - ${tab.name}` }}</slot>
      </swiper-item>
    </swiper>
    <view v-else>
      <slot name="tab"><view class="empty-view">暂无数据</view></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue';

interface tabListItem {
  id: string | number;
  name: string;
}

const props = withDefaults(
  defineProps<{
    /** tabs 数据 */
    tabList?: tabListItem[];
    /** 选中 tab 索引 */
    idx?: number;
    /** 是否开启左右滑动切换 tab */
    slidingSwitchFlag?: boolean;
    /** tabs 容器样式 */
    tabsStyle?: Record<string, any>;
    /** 未选中字体颜色 */
    color?: string;
    /** 选中字体颜色 */
    activeColor?: string;
    /** 未选中字体大小 */
    fontSize?: string;
    /** 选中字体大小 */
    activeFontSize?: string;
    /** 未选中字体粗细 */
    fontWeight?: string | number;
    /** 选中字体粗细 */
    activeFontWeight?: string | number;
    /** tab 项宽度 */
    itemWidth?: string;
    /** tab 项内边距 */
    itemPadding?: string;
    /** 选中下划线颜色 */
    tipColor?: string;
    /** 选中下划线宽度 */
    tipWidth?: string;
  }>(),
  {
    tabList: () => [],
    idx: 0,
    slidingSwitchFlag: false,
    tabsStyle: () => ({}),
    color: '#333',
    activeColor: '#4ad975',
    fontSize: '32rpx',
    activeFontSize: '32rpx',
    fontWeight: '400',
    activeFontWeight: '400',
    itemWidth: '20%',
    itemPadding: '16px 0',
    tipColor: '#4ad975',
    tipWidth: '20px'
  }
);
// 定义 更新idx事件
const emits = defineEmits(['update:idx']);
const instance = getCurrentInstance();

const scrollTop = ref(0);
// 滑块中心点相对 tabs 容器的 left 值，通过真实节点测量得到，避免不同宽度场景下偏移异常。
const tabTipCenterLeft = ref(0);
const navIndex = computed({
  // getter
  get() {
    return props.idx;
  },
  // setter
  set(newV) {
    // 更新父组件 idx 值
    emits('update:idx', newV);
  }
});
const tabs = ref<tabListItem[]>([]);

watch(
  () => props.tabList,
  (newV) => {
    tabs.value = newV;
    nextTick(() => {
      updateTabTipPosition();
    });
  },
  { immediate: true }
);

watch(
  () => props.idx,
  () => {
    nextTick(() => {
      updateTabTipPosition();
    });
  }
);

const checkIndex = (index: number) => {
  navIndex.value = index;
};

/**
 * 获取 tab 文本样式。
 * 通过可配置项兼容不同页面对字号、颜色和字重的定制需求，默认值保持原组件行为不变。
 */
const getTabItemStyle = (index: number) => {
  const isActive = navIndex.value === index;
  return {
    width: props.itemWidth,
    padding: props.itemPadding,
    color: isActive ? props.activeColor : props.color,
    fontSize: isActive ? props.activeFontSize : props.fontSize,
    fontWeight: isActive ? props.activeFontWeight : props.fontWeight
  };
};

/**
 * 计算滑块指示条的位置。
 * 通过单个 tab-tip 在不同 tab 底部平滑移动，形成点击切换的跟随动画。
 */
const tabIndicatorStyle = computed(() => {
  return {
    left: `${tabTipCenterLeft.value}px`,
    width: props.tipWidth,
    backgroundColor: props.tipColor,
    transform: 'translateX(-50%)'
  };
});

/**
 * 更新滑块位置。
 * 基于当前选中 tab 的真实宽度和位置计算中心点，让 tab-tip 始终平滑移动到正确位置。
 */
const updateTabTipPosition = () => {
  if (!instance?.proxy || tabs.value.length === 0) {
    return;
  }

  const query = uni.createSelectorQuery().in(instance.proxy);
  query.select('.tabs-default').boundingClientRect();
  query.select(`#id-${navIndex.value}`).boundingClientRect();
  query.exec((res: any[]) => {
    const containerRect = res?.[0];
    const currentTabRect = res?.[1];

    if (!containerRect || !currentTabRect) {
      return;
    }

    tabTipCenterLeft.value = currentTabRect.left - containerRect.left + currentTabRect.width / 2;
  });
};

const scroll = (e: any) => {
  scrollTop.value = e.detail.scrollTop;
};
// 滑动切换swiper
const tabChange = (e: any) => {
  const navIdx = e.detail.current;
  navIndex.value = navIdx;
};

onMounted(() => {
  nextTick(() => {
    updateTabTipPosition();
  });
});
</script>

<style scoped lang="scss">
.activite {
  color: #4ad975;
}
.tab-content {
  color: #333;
}
.scroll-view-h {
  width: 100%;
  color: #333;
  white-space: nowrap;
}
.tabs-default {
  position: relative;
  min-width: 100%;
}
.scroll-view-item-h {
  display: inline-block;
  height: 50rpx;
  line-height: 55rpx;
  text-align: center;
  transition:
    color 0.2s ease,
    font-size 0.2s ease,
    font-weight 0.2s ease,
    transform 0.2s ease;
  transform: translateY(0);
}
.activite {
  transform: translateY(-2rpx);
}
.tab-tip {
  border-radius: 5px;
  height: 4px;
}
.tab-tip--moving {
  position: absolute;
  bottom: 5px;
  transition:
    left 0.25s ease,
    transform 0.25s ease,
    background-color 0.2s ease;
}
.empty-view {
  padding-top: 40px;
  text-align: center;
  font-size: 12px;
  color: #999;
}
</style>
