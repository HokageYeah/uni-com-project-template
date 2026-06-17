<template>
  <view
    class="message-self-cell-voice-file"
    :class="{ 'is-not-t-self': !isSelf }"
    :style="{ width: `${calculateVoiceWidth}px` }"
    @click="playVoice"
  >
    <view class="voice-animation" :class="{ playing: isPlaying }">
      <view class="voice-wave"></view>
      <view class="voice-wave"></view>
      <view class="voice-wave"></view>
    </view>
    <tui-text :size="text_size" color="#222222" :text="`${voiceTime}''`"></tui-text>
  </view>
</template>

<script setup lang="ts">
import { formatVoiceTime } from '@/uni-module-common/utils/util';
import { uniShowToast } from '@/uni-module-common/utils/uiUtile';
const props = withDefaults(
  defineProps<{
    voiceUrl?: string; // 语音url
    voiceTranslate?: string; //  语音翻译内容
    voiceTime?: number; // 语音时长
    isSelf?: boolean; // 是否是自己的语音
    messageId?: string | number; // 消息id
  }>(),
  { voiceUrl: '', voiceTranslate: '', voiceTime: 0, isSelf: true, messageId: '' }
);
const text_size = ref(28);
// #ifdef MP-WEIXIN
text_size.value = 28;
// #endif
// #ifndef MP-WEIXIN
text_size.value = 40;
// #endif

// 语音播放状态
const isPlaying = ref(false);
// 语音实例
let innerAudioContext: any = null;
// 格式化语音时间
const voiceTime = computed(() => {
  return formatVoiceTime(props.voiceTime);
});
// 计算语音宽度
const calculateVoiceWidth = computed(() => {
  if (!props.voiceTime) return 80;
  console.log('props.voiceTime', props.voiceTime);
  // 将语音时长转为数字
  const seconds = props.voiceTime;
  // 设置最小宽度和最大宽度
  const minWidth = 60;
  const maxWidth = 200;
  // 根据语音时长计算宽度，假设最长60秒对应最大宽度
  const width = minWidth + (seconds / 60) * (maxWidth - minWidth);
  console.log('width', width);
  console.log(
    'Math.min(maxWidth, Math.max(minWidth, width))',
    Math.min(maxWidth, Math.max(minWidth, width))
  );
  return Math.min(maxWidth, Math.max(minWidth, width));
});

// 播放语音
const playVoice = () => {
  console.log('playVoice---props.voiceUrl', props.voiceUrl);
  console.log('playVoice---isPlaying.value', isPlaying.value);
  console.log('playVoice---innerAudioContext', innerAudioContext);
  console.log('playVoice---props.messageId', props.messageId);
  if (!props.voiceUrl) return;
  try {
    if (innerAudioContext) {
      console.log('playVoice----innerAudioContext---try', innerAudioContext);
      innerAudioContext.stop();
      innerAudioContext.destroy();
      innerAudioContext = null;
    }
    innerAudioContext = uni.createInnerAudioContext();
    let tempFilePath = '';
    uni.$emit('playVoice', props.messageId);
    if (isPlaying.value) {
      // 如果正在播放，则停止
      console.log('playVoice----innerAudioContext---isPlaying.value', innerAudioContext);
      innerAudioContext && innerAudioContext.stop();
      isPlaying.value = false;
      return;
    }
    tempFilePath = props.voiceUrl;
    // 设置音频源
    innerAudioContext.src = tempFilePath;
    // innerAudioContext.src =
    //   'http://pic.xxt.cn/n/book-reading/book-file/voice/ad7adcb5c45d4138b245e4792771a5481.mp3';
    console.log('playVoice----innerAudioContext.src', innerAudioContext.src);
    // 监听播放结束
    innerAudioContext &&
      innerAudioContext.onEnded(() => {
        isPlaying.value = false;
      });

    // 监听播放错误
    innerAudioContext &&
      innerAudioContext.onError((res: any) => {
        console.error('播放语音失败', res);
        isPlaying.value = false;
        uniShowToast('语音播放失败');
      });

    // 开始播放
    innerAudioContext && innerAudioContext.play();
    isPlaying.value = true;
  } catch (error: any) {
    console.error('播放语音失败', error);
    isPlaying.value = false;
    uniShowToast(error.message);
  }
};

onMounted(() => {
  uni.$on('playVoice', (messageId: string) => {
    // 如果不是当前消息，则停止播放
    if (messageId !== props.messageId) {
      console.log(
        'playVoice----innerAudioContext---1',
        innerAudioContext,
        messageId,
        props.messageId
      );
      if (innerAudioContext) {
        console.log('playVoice----innerAudioContext---2', innerAudioContext);
        console.log('playVoice----innerAudioContext---3', innerAudioContext.stop);
        innerAudioContext.stop();
      }
      isPlaying.value = false;
    }
  });
});

// 组件销毁时释放资源
onUnmounted(() => {
  console.log('onUnmounted------innerAudioContext------', innerAudioContext);
  innerAudioContext && innerAudioContext.destroy();
  uni.$off('playVoice');
});

onMounted(() => {
  // innerAudioContext = uni.createInnerAudioContext();
  console.log('onmounted------innerAudioContext------', innerAudioContext);
});
</script>

<style scoped lang="scss">
.message-self-cell-voice-file {
  @include normalFlex(row, flex-end, center);
  /* #ifdef MP-WEIXIN */
  margin-right: 15px;
  padding: 0 12px;
  height: 44px;
  /* #endif */
  /* #ifndef MP-WEIXIN */
  margin-right: 25px;
  padding: 0 25px;
  height: 60px;
  /* #endif */
  border-radius: 8px 4px 8px 8px;
  min-width: 80px;
  max-width: 80%;
  background: #ccffdb;
  /* 不是自己的语音 */
  &.is-not-t-self {
    flex-direction: row-reverse; // 反转flex方向，使文本在左侧
    justify-content: flex-end; // 靠左对齐
    margin-left: 15px;
    margin-right: 0;
    border-radius: 4px 8px 8px; // 调整圆角
    background: #fff; // 白色背景
    .voice-animation {
      margin-left: 10px;
      margin-right: 0;
      transform: rotate(180deg); // 翻转语音波形，使其指向左侧
    }
  }
  .voice-animation {
    display: flex;
    align-items: center;
    margin-right: 10px;
    .voice-wave {
      margin: 0 1px;
      border-radius: 1px;
      width: 3px;
      height: 16px;
      background-color: #222;
      opacity: 0.6;
      transform: scaleY(0.4);
      &:nth-child(2) {
        height: 22px;
      }
      &:nth-child(3) {
        height: 18px;
      }
    }
    &.playing {
      .voice-wave {
        animation: voice-wave 1s infinite ease-in-out;
        &:nth-child(1) {
          animation-delay: 0s;
        }
        &:nth-child(2) {
          animation-delay: 0.2s;
        }
        &:nth-child(3) {
          animation-delay: 0.4s;
        }
      }
    }
  }
}
@keyframes voice-wave {
  0%,
  100% {
    transform: scaleY(0.4);
  }
  50% {
    transform: scaleY(1);
  }
}
</style>
