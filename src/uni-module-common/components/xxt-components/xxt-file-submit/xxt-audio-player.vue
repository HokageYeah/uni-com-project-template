<template>
  <view class="xxt-audio-player">
    <view class="xxt-audio-player-bg">
      <image
        class="xxt-audio-player-bg-img"
        mode="aspectFill"
        :src="voicePlayStr"
        @click="handlePlay"
      ></image>
      <text class="xxt-audio-player-bg-time">{{ formatedPlayTime }}</text>
      <slider
        class="xxt-audio-player-bg-slider"
        :min="0"
        :step="0.1"
        :value="playTime"
        active-color="#4bd975"
        background-color="#e9e9e9"
        :max="recordTime ? recordTime : duration"
        :block-size="8"
        block-color="#4bd975"
        @changing="onChanging"
        @change="onChange"
      ></slider>
      <text class="xxt-audio-player-bg-time">{{ formatedRecordTime }}</text>
    </view>
    <tui-icon
      v-if="isShowDelete"
      class="xxt-audio-player-delete-icon"
      custom-prefix="icon-x-cuowu"
      name="iconfont"
      color="#ec6144"
      :size="16"
      @click="deleteAudio"
    />
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { audioType } from './xxtFileType';
import audioManager from './audioManager'; // 导入单例音频管理器
import utils from '@/uni-module-common/utils';
import { $cdn } from '@/uni-module-common/config';
import eventBus from '@/uni-module-common/utils/eventBus';

const props = withDefaults(
  defineProps<{
    recordMucStr: string;
    isShowDelete: boolean;
    recordTime: number;
    audioAry: audioType[];
    noPreload?: boolean;
  }>(),
  {
    recordMucStr: '',
    isShowDelete: true,
    recordTime: 0,
    audioAry: (): audioType[] => [],
    noPreload: false
  }
);

const emits = defineEmits<{
  (e: 'deleteAudio', fileType: number, fileObj: audioType): void;
  (e: 'update:audioAry', audioList: audioType[]): void;
}>();

// 组件状态
const playTime = ref(0);
const duration = ref(0);
const isvoicePlaying = ref(false);

// 格式化时间显示
const formatedPlayTime = computed(() => {
  return utils.formatTime(playTime.value);
});

const formatedRecordTime = computed(() => {
  return utils.formatTime(duration.value);
});

// 播放/暂停图标
const voicePlayStr = computed(() => {
  return isvoicePlaying.value
    ? `${$cdn}/nb/m/uni-task-center/img/record-file-pause.png`
    : `${$cdn}/nb/m/uni-task-center/img/record-file-play.png`;
});

// 处理播放/暂停
const handlePlay = () => {
  if (!props.recordMucStr) return;

  audioManager.play(props.recordMucStr);
};

// 进度条拖动中
const onChanging = (e: any) => {
  const currentTime = Math.floor(e.detail.value);
  playTime.value = currentTime;

  // 如果当前音频正在播放，通知管理器更新进度
  if (audioManager.getPlayState().currentSrc === props.recordMucStr) {
    audioManager.startChanging();
    audioManager.updateChangingTime(currentTime);
  }
};

// 进度条拖动结束
const onChange = (e: any) => {
  const currentTime = Math.floor(e.detail.value);

  // 如果当前音频正在播放，通知管理器跳转进度
  if (audioManager.getPlayState().currentSrc === props.recordMucStr) {
    audioManager.seek(currentTime);
  } else {
    playTime.value = currentTime;
  }
};

// 删除音频
const deleteAudio = () => {
  // 停止当前音频播放
  if (audioManager.getPlayState().currentSrc === props.recordMucStr) {
    audioManager.stop();
  }

  // 找到要删除的音频
  const deleAudio = props.audioAry.find(
    (item) => item.audioPath === props.recordMucStr
  ) as audioType;

  // 触发删除事件
  emits(
    'update:audioAry',
    props.audioAry.filter((item) => item.audioPath !== props.recordMucStr)
  );

  // 附件类型 1 图片 2语音 3视频 4文件 5链接
  emits('deleteAudio', 2, deleAudio);
};

// 监听音频播放状态变化
const handlePlayStateChange = (data: any) => {
  if (data.src === props.recordMucStr) {
    isvoicePlaying.value = data.playing;
  } else if (data.playing) {
    // 其他音频开始播放，当前音频应显示为暂停状态
    isvoicePlaying.value = false;
  }
};

// 监听音频时间更新
const handleTimeUpdate = (data: any) => {
  if (data.src === props.recordMucStr) {
    playTime.value = data.currentTime;
    duration.value = data.duration || props.recordTime;
  }
};

// 监听音频播放结束
const handleAudioEnded = (data: any) => {
  if (data.src === props.recordMucStr) {
    playTime.value = 0;
    isvoicePlaying.value = false;
  }
};

onMounted(() => {
  uni.hideLoading();
  // #ifdef MP-WEIXIN
  uni.setInnerAudioOption({
    obeyMuteSwitch: false
  });
  // #endif
  // 初始化时长
  let luyintime = props.recordTime;
  if (typeof props.recordTime === 'string') {
    luyintime = parseInt(props.recordTime, 10);
  }
  duration.value = luyintime || 0;

  // 注册事件监听
  eventBus.on('audioPlayStateChange', handlePlayStateChange);
  eventBus.on('audioTimeUpdate', handleTimeUpdate);
  eventBus.on('audioEnded', handleAudioEnded);

  // 如果不需要预加载，不做任何操作，否则可以预加载
  if (!props.noPreload && props.recordMucStr) {
    // 预加载可以在这里实现，或者由管理器自动处理
  }
});

onUnmounted(() => {
  // 移除事件监听
  eventBus.off('audioPlayStateChange', handlePlayStateChange);
  eventBus.off('audioTimeUpdate', handleTimeUpdate);
  eventBus.off('audioEnded', handleAudioEnded);

  // 如果当前组件的音频正在播放，停止它
  if (audioManager.getPlayState().currentSrc === props.recordMucStr) {
    audioManager.stop();
  }
});

// 监听音频源变化
watch(
  () => props.recordMucStr,
  (newVal) => {
    if (!newVal) {
      // 音频源清空，重置状态
      isvoicePlaying.value = false;
      playTime.value = 0;
    } else if (!props.noPreload) {
      // 可以在这里实现新音频的预加载逻辑
    }
  }
);
</script>

<style scoped lang="scss">
.xxt-audio-player {
  position: relative;
  padding: 8px 0px;

  &-bg {
    @include normalFlex(row, flex-start);
    padding: 0 10px;
    border-radius: 8px;
    height: 40px;
    background-color: #f9f9f9;

    &-img {
      width: 30px;
      height: 30px;
    }

    &-time {
      margin-left: 8px;
      font-weight: 400;
      font-size: 12px;
      color: #4ad975;
    }

    &-time:last-of-type {
      margin-left: 5px;
      margin-right: 10px;
    }

    &-slider {
      flex: 1;
      margin-left: 10px;
    }
  }

  &-delete-icon {
    position: absolute;
    right: 0px;
    top: 2px;
  }
}
</style>
