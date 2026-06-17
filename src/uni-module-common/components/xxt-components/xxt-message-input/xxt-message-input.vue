<template>
  <view class="input-container">
    <view class="input-box">
      <image
        class="input-box-voice-img"
        mode="aspectFill"
        :src="voiceImgSrc"
        @click="!isVoiceOnly && (isVoice = !isVoice)"
      ></image>
      <view v-if="!isVoice" class="input-box-text" @click="inputText"> 输入文字 </view>
      <view
        v-else
        class="input-box-text"
        :class="{ recording: isRecording }"
        @touchstart="startRecording"
        @touchend="stopRecording"
        @touchcancel="cancelRecording"
      >
        <!-- #ifdef MP-WEIXIN -->
        {{ isRecording ? '松开 结束' : '按住 说话' }}
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        {{ isRecording ? '松开 结束' : '按住 说话（请先插入耳机再说话）' }}
        <!-- #endif -->
      </view>
    </view>
  </view>
  <!-- 录音提示遮罩 -->
  <view v-if="isRecording" class="recording-mask">
    <view class="recording-content">
      <view class="recording-icon">
        <view v-for="(item, index) in 3" :key="index" class="recording-wave"></view>
      </view>
      <view class="recording-text">正在录音...</view>
      <view class="recording-time">{{ recordingTime }}s</view>
    </view>
  </view>
  <!-- <xxt-textarea-mask
    ref="linkMask"
    :placeholder="commentPlaceholder"
    :is-common="true"
    :maxlength="maxlength"
    @link-sure="linkSure"
    @input-change="inputChange"
  /> -->
  <xxt-textarea-mask-new
    ref="linkMask"
    :placeholder="commentPlaceholder"
    :is-common="true"
    :maxlength="maxlength"
    @link-sure="linkSure"
    @input-change="inputChange"
  />
</template>

<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid';
import { sendLeaveMessage } from '@/uni-module-common/components/xxt-components/xxt-message-list/hooks/api-hooks';
import useRoomMessageListStore from '@/uni-module-common/components/xxt-components/xxt-message-list/message-store/messageStore';
import { uniShowToast } from '@/uni-module-common/utils/uiUtile';
import { $cdn, appModuleConfig } from '@/uni-module-common/config';
import { uploadFilePromise } from '@/uni-module-common/http';
import { wxuuid } from '@/uni-module-common/utils/wxUuid';

const props = withDefaults(
  defineProps<{
    roomId: number;
    // 是否只能输入语音
    isVoiceOnly: boolean;
    // 发送地址
    sendUrl?: string;
  }>(),
  {
    roomId: 0,
    isVoiceOnly: false,
    sendUrl: '/book-reading/leave-msg/send-message' // 默认是智慧阅读项目-家校留言模块
  }
);
const emit = defineEmits<{
  (e: 'sendVoice', data: { filePath: string; duration: number; fileId: string }): void;
  (e: 'sendText', data: string): void;
}>();
const roomMessageListStore = useRoomMessageListStore();
const { userInfo } = useStore('user');
const isVoice = ref(props.isVoiceOnly);
const commentPlaceholder = ref('输入文字');
const linkMask: any = ref<HTMLDivElement>();
const maxlength = ref(200);
const voiceImgSrc = computed(() => {
  console.log('isVoice.value', isVoice.value);
  if (props.isVoiceOnly) {
    return `${$cdn}/nb/m/uni-zhyd/img/sound-record.png`;
  }
  return !isVoice.value
    ? `${$cdn}/nb/m/uni-zhyd/img/sound-record.png`
    : `${$cdn}/nb/m/uni-zhyd/img/sound-keyboard.png`;
});

// 录音管理器
const isRecording = ref(false);
const recordingTime = ref(0);
// #ifndef H5
const recorderManager = uni.getRecorderManager();
let recordTimer: any = null;
let recordingTimeout: any = null;
// 长按开始和取消
let isLongPress = false;

// 录音相关事件监听
recorderManager.onStart(() => {
  console.log('录音开始');
  // 录音的时候需要关闭所有正在播放的音频
  uni.$emit('playVoice', -1);
  if (!isLongPress) {
    recorderManager.stop();
    isRecording.value = false;
    recordingTime.value = 0;
    return;
  }
  isRecording.value = true;
  let isstoping = false;
  // 开始计时
  recordingTime.value = 0;
  recordTimer = setInterval(() => {
    recordingTime.value++;
    // 设置最大录音时长，例如60秒
    if (recordingTime.value >= 60) {
      stopRecording();
      isstoping = true;
    }
  }, 1000);
  // 设置录音超时，防止用户忘记松开
  recordingTimeout = setTimeout(() => {
    if (isRecording.value && !isstoping) {
      stopRecording();
    }
  }, 60000); // 60秒后自动结束
});

recorderManager.onStop((res) => {
  console.log('录音结束', res);
  isRecording.value = false;
  clearInterval(recordTimer);
  clearTimeout(recordingTimeout);

  // 录音时间太短
  if (recordingTime.value < 1) {
    uniShowToast('录音时间太短');
    return;
  }

  // 发送录音消息
  const { tempFilePath, duration } = res;
  // 如果duration没有（app端kennel没有）
  if (!duration) {
    emitVoiceMessage(tempFilePath, recordingTime.value);
  } else {
    emitVoiceMessage(tempFilePath, Math.floor(duration / 1000));
  }
});

recorderManager.onError((res) => {
  console.error('录音失败', res);
  isRecording.value = false;
  clearInterval(recordTimer);
  clearTimeout(recordingTimeout);
  uniShowToast('录音失败');
});

// 开始录音
const startRecording = () => {
  console.log('startRecording');
  // // #ifdef APP-PLUS
  // const platform = uni.getSystemInfoSync().platform;
  // if (platform === 'android') {
  //   const anStatus = await appCheckPermission();
  //   if (anStatus !== 1) {
  //     return;
  //   }
  // } else if (platform === 'ios') {
  //   const iosStatus = await checkPermission();
  //   if (iosStatus !== 1) {
  //     return;
  //   }
  // }
  // // #endif

  // // #ifdef MP-WEIXIN
  // // 如果是小程序则掉起录音授权弹窗
  // try {
  //   const isPermission = await getWeixinPermission();
  //   if (!isPermission) {
  //     return;
  //   }
  // } catch (error) {}
  // // #endif

  isLongPress = true;
  recorderManager.start({
    duration: 60000, // 最长录音时间，单位ms
    sampleRate: 16000, // 采样率
    format: 'mp3' // 音频格式
  });
};

// 停止录音
function stopRecording() {
  isLongPress = false;
  console.log('stopRecording');
  if (isRecording.value) {
    recorderManager.stop();
  }
}

// 取消录音
function cancelRecording() {
  if (isRecording.value) {
    isRecording.value = false;
    clearInterval(recordTimer);
    clearTimeout(recordingTimeout);
    recorderManager.stop(); // 停止录音但不处理结果
    uniShowToast('已取消录音');
  }
}

const voiceUpload = async (filePath: string, duration: number) => {
  const url = '/zuul/book-reading/reading-record/upload-file';
  let randomUUID = '';
  // #ifdef MP-WEIXIN
  randomUUID = wxuuid();
  // #endif
  // #ifndef MP-WEIXIN
  randomUUID = uuidv4();
  //  #endif
  const formData = {
    fileIdentity: randomUUID,
    fileSeq: 1,
    fileParam: `${duration}`,
    fileType: 2
  };
  uniShowToast('语音上传中...');
  try {
    console.log('voiceUpload---filePath---', filePath);
    console.log('voiceUpload---url---', url);
    console.log('voiceUpload---formData---', formData);
    const res = await uploadFilePromise(filePath, '', 2, 1, formData, url);
    console.log('voiceUpload---res---', res);
    const fileId = res ? res.fileId : '';
    if (fileId) {
      let params: any = {
        hostType: 1,
        hostId: appModuleConfig.hostId,
        fileIdentity: formData.fileIdentity
      };
      // #ifdef APP || APP-PLUS
      params = {
        hostType: 2,
        roomId: props.roomId,
        fileIdentity: formData.fileIdentity
      };
      // #endif
      const sendRes: any = await sendLeaveMessage(props.sendUrl, params);
      if (sendRes.content && sendRes.content.length > 0) {
        const messageid = sendRes.content;
        roomMessageListStore.addMessage(
          {
            messageId: messageid,
            messageType: 2,
            messageContent: '',
            selfFlag: true,
            sendDate: new Date().getTime(),
            userId: userInfo.value.userId,
            userName: userInfo.value.username,
            userType: userInfo.value.jut,
            voiceUrl: filePath,
            duration
          },
          props.roomId
        );
        emit('sendVoice', {
          filePath,
          duration,
          fileId
        });
      } else {
        uniShowToast('语音上传失败');
      }
    }
  } catch (err) {
    uniShowToast('语音上传失败');
  } finally {
    uni.hideLoading();
  }
};

// 发送语音消息
function emitVoiceMessage(filePath: string, duration: number) {
  // 这里可以添加上传语音文件的逻辑
  console.log('发送语音消息', filePath, duration);
  voiceUpload(filePath, duration);
}
// #endif

const inputText = () => {
  linkMask!.value.showPopup();
  console.log('inputText');
};
const inputVoice = () => {
  console.log('inputVoice');
};
const linkSure = async (content: string) => {
  console.log('linkSure', content);
  if (content.trim()) {
    try {
      uniShowToast('发送中...');
      const sendRes: any = await sendLeaveMessage(props.sendUrl, {
        hostType: 1,
        hostId: appModuleConfig.hostId,
        massageContent: content
      });
      if (sendRes.content && sendRes.content.length > 0) {
        const messageid = sendRes.content;
        roomMessageListStore.addMessage(
          {
            messageId: messageid,
            messageType: 1,
            messageContent: content,
            selfFlag: true,
            sendDate: new Date().getTime(),
            userId: userInfo.value.userId,
            userName: userInfo.value.username,
            userType: userInfo.value.jut,
            voiceUrl: '',
            duration: 0
          },
          props.roomId
        );
        emit('sendText', content);
      } else {
        uniShowToast('发送失败');
      }
    } catch (err) {
      uniShowToast('发送失败');
    } finally {
      uni.hideLoading();
    }
  }
};
const inputChange = (content: string) => {
  console.log('inputChange', content.length);
  if (content.length >= maxlength.value) {
    uniShowToast(`输入内容不能超过${maxlength.value}个字符`);
  }
};
// 组件销毁时清理定时器
onUnmounted(() => {
  clearInterval(recordTimer);
  clearTimeout(recordingTimeout);
});
</script>

<style scoped lang="scss">
.input-container {
  /* 解决外边距塌陷 */
  overflow: hidden;
  width: 100%;
  height: 100%;
  /* #ifdef MP-WEIXIN */
  background-color: #fff;
  /* #endif */
  /* #ifndef MP-WEIXIN */
  background-color: #edfbf1;
  /* #endif */
  /* background-color: yellow; */
}
.input-box {
  box-sizing: border-box;
  margin-top: 8px;
  padding: 0 16px;
  width: 100%;
  /* #ifdef MP-WEIXIN */
  height: 40px;
  /* #endif */
  /* #ifndef MP-WEIXIN */
  height: 75px;
  /* #endif */
  /* background-color: red; */
  @include normalFlex(row, flex-start, center);
  .input-box-voice-img {
    margin-right: 8px;
    /* #ifdef MP-WEIXIN */
    width: 24px;
    height: 24px;
    /* #endif */
    /* #ifndef MP-WEIXIN */
    width: 42px;
    height: 42px;
    /* #endif */
  }
  .input-box-text {
    flex: 1;
    /* #ifdef MP-WEIXIN */
    border-radius: 4px;
    line-height: 40px;
    background-color: #f5f5f5;
    font-size: 14px;
    /* #endif */
    /* #ifndef MP-WEIXIN */
    border-radius: 11px;
    line-height: 75px;
    border: 1px solid #4ad975;
    background-color: #fff;
    font-size: 20px;
    /* #endif */
    height: 100%;
    text-align: center;
    color: #222;
    transition: all 0.3s;
    &.recording {
      background-color: #e0e0e0;
    }
  }
}

// 录音遮罩层
.recording-mask {
  display: flex;
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  /* background-color: rgba(0, 0, 0, 0.5); */
  z-index: 999;
  justify-content: center;
  align-items: center;
  .recording-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    width: 160px;
    height: 160px;
    background-color: rgba(0, 0, 0, 0.7);
    .recording-icon {
      display: flex;
      align-items: flex-end;
      margin-bottom: 10px;
      height: 40px;
      .recording-wave {
        margin: 0 2px;
        border-radius: 2px;
        width: 5px;
        height: 20px;
        background-color: #fff;
        animation: wave-animation 1s infinite ease-in-out;
        &:nth-child(1) {
          height: 15px;
          animation-delay: 0s;
        }
        &:nth-child(2) {
          height: 30px;
          animation-delay: 0.2s;
        }
        &:nth-child(3) {
          height: 20px;
          animation-delay: 0.4s;
        }
      }
    }
    .recording-text {
      margin-bottom: 5px;
      font-size: 16px;
      color: #fff;
    }
    .recording-time {
      font-size: 14px;
      color: #fff;
    }
  }
}
@keyframes wave-animation {
  0%,
  100% {
    transform: scaleY(0.5);
  }
  50% {
    transform: scaleY(1);
  }
}
</style>
