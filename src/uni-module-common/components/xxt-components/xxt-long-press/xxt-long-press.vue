<template>
  <!-- 长按操作菜单 -->
  <view
    v-if="showLongPressMenu"
    class="long-press-menu-mask"
    @click="closeLongPressMenu"
    @touchmove.stop.prevent
  >
    <view
      class="long-press-menu"
      :style="{ top: menuPosition.top, left: menuPosition.left, opacity: menuPosition.opacity }"
    >
      <slot></slot>
      <view class="menu-arrow"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    showLongPressMenu: boolean;
    menuPosition: { top: string; left: string; opacity: string };
  }>(),
  {
    showLongPressMenu: false,
    menuPosition: () => ({ top: '0px', left: '0px', opacity: '0' })
  }
);
const emit = defineEmits<{
  (e: 'update:showLongPressMenu', value: boolean): void;
  (e: 'closeLongPressMenu'): void;
}>();

const closeLongPressMenu = () => {
  emit('closeLongPressMenu');
};
</script>

<style scoped lang="scss">
/* 长按操作菜单 */
.long-press-menu-mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 9998;
  background-color: transparent;
}

.long-press-menu {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: opacity 0.2s ease;
  .menu-arrow {
    margin-top: -1rpx;
    border-left: 12rpx solid transparent;
    border-right: 12rpx solid transparent;
    border-top: 12rpx solid rgba(0, 0, 0, 0.9);
    width: 0;
    height: 0;
    filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.2));
  }
}

@keyframes menu-fade-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
