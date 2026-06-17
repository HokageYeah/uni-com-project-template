<template>
  <!-- 撒花特效容器 -->
  <view class="confetti-container">
    <view
      v-for="(item, index) in confettiItems"
      :key="index"
      class="confetti"
      :class="item.type"
      :style="item.style"
    ></view>
  </view>
</template>

<script setup lang="ts">
const confettiItems = ref<Array<{ type: string; style: Record<string, string | number> }>>([]);
// 创建撒花效果 - 使用UniApp兼容的方式
function createConfetti() {
  // 清空现有撒花
  confettiItems.value = [];

  const confettiTypes = ['circle', 'rect', 'triangle'];
  const colors = ['#6c5ce7', '#00b894', '#fd79a8', '#fdcb6e', '#0984e3', '#e17055'];

  // 获取页面宽度
  const pageWidth = uni.getSystemInfoSync().windowWidth;

  // 创建多个彩花元素数据
  const items: Array<{ type: string; style: Record<string, string | number> }> = [];
  for (let i = 0; i < 60; i++) {
    // 随机属性
    const size = Math.random() * 10 + 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * pageWidth;
    const animationDuration = Math.random() * 2 + 1.5;
    const delay = Math.random() * 1.5;
    const type = confettiTypes[Math.floor(Math.random() * confettiTypes.length)];

    let style: Record<string, string | number> = {
      left: `${left}px`,
      animationDuration: `${animationDuration}s`,
      animationDelay: `${delay}s`
    };

    // 根据形状设置不同样式
    switch (type) {
      case 'circle':
        style = {
          ...style,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          backgroundColor: color
        };
        break;
      case 'rect':
        style = {
          ...style,
          width: `${size}px`,
          height: `${size}px`,
          transform: `rotate(${Math.random() * 360}deg)`,
          backgroundColor: color
        };
        break;
      case 'triangle':
        style = {
          ...style,
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${color}`
        };
        break;
    }

    // 添加到数组
    items.push({
      type,
      style
    });
  }

  // 更新状态，触发视图更新
  confettiItems.value = items;

  // 一段时间后清除撒花
  setTimeout(() => {
    confettiItems.value = [];
  }, 8000);
}
defineExpose({
  createConfetti
});
</script>

<style scoped lang="scss">
/* 撒花效果样式 */
.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 不阻挡点击事件 */
  z-index: 1000;
}

.confetti {
  position: absolute;
  top: -20px; /* 从顶部开始 */
  z-index: 1000;
  animation: fall-rotate 3s ease-in forwards;
}

@keyframes fall-rotate {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}
</style>
