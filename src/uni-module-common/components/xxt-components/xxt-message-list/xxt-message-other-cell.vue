<template>
  <view class="message-other-cell">
    <image
      class="avator-img"
      mode="aspectFill"
      :src="`${$cdn}/nb/m/base/img/login-student.png`"
    ></image>
    <view v-if="messageType === 'text'" class="message-other-cell-bg">
      <view class="message-other-cell-content">
        <tui-text
          class="message-other-cell-content-text"
          block
          :size="text_size"
          :text="message"
        ></tui-text>
      </view>
      <view class="message-other-cell-time">{{ utils.formatTimeWithChinese(sendTime) }}</view>
    </view>
    <view v-if="messageType === 'voice'" class="message-other-cell-voice">
      <view class="message-other-cell-bg">
        <message-voice
          :voice-url="voiceUrl"
          :voice-translate="voiceTranslate"
          :voice-time="voiceTime"
          :is-self="false"
          :message-id="messageId"
        />
        <view
          v-if="voiceTranslate.length > 0"
          class="message-other-cell-content message-other-cell-voice-translate"
        >
          <tui-text
            class="message-other-cell-content-text"
            block
            :size="text_size"
            :text="voiceTranslate"
          ></tui-text>
        </view>
        <view class="message-other-cell-time">{{ utils.formatTimeWithChinese(sendTime) }}</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import messageVoice from './xxt-message-voice.vue';
import { $cdn } from '@/uni-module-common/config';
import utils from '@/uni-module-common/utils';
const props = withDefaults(
  defineProps<{
    message?: string; // 消息内容
    messageType?: 'text' | 'voice'; // 消息类型 文本 语音
    voiceUrl?: string; // 语音url
    voiceTranslate?: string; //  语音翻译内容
    voiceTime?: number; // 语音时长
    sendTime?: number; // 发送时间
    messageId?: string | number; // 消息id
  }>(),
  {
    message: '',
    messageType: 'text',
    voiceUrl: '',
    voiceTranslate: '',
    voiceTime: 0,
    isSelf: false,
    sendTime: 0,
    messageId: ''
  }
);
const text_size = ref(28);
// #ifdef MP-WEIXIN
text_size.value = 28;
// #endif
// #ifndef MP-WEIXIN
text_size.value = 40;
// #endif
</script>

<style scoped lang="scss">
.message-other-cell {
  padding: 16px 16px 0;
  @include normalFlex(row, flex-start, flex-start);
  .avator-img {
    /* #ifndef MP-WEIXIN */
    width: 75px;
    height: 75px;
    /* #endif */
    /* #ifdef MP-WEIXIN */
    width: 34px;
    height: 34px;
    /* #endif */
  }
  .message-other-cell-bg {
    flex: 1;
    width: 100%;
    @include normalFlex(column, flex-start, flex-start);
    .message-other-cell-time {
      margin-top: 8px;
      margin-left: 15px;
      color: #999;
      /* #ifdef MP-WEIXIN */
      font-size: 12px;
      /* #endif */
      /* #ifndef MP-WEIXIN */
      font-size: 18px;
      margin-left: 25px;
      /* #endif */
    }
  }
  .message-other-cell-content {
    flex: 1;
    box-sizing: border-box;
    margin-left: 15px;
    padding: 12px;
    border-radius: 8px 4px 8px 8px;
    /* #ifndef MP-WEIXIN */
    background-color: #edfbf1;
    max-width: 70%;
    margin-left: 15px;
    padding: 20px;
    /* max-width: 70%; */
    /* #endif */
    /* #ifdef MP-WEIXIN */
    background-color: #f5f5f5;
    /* #endif */
    background-color: #fff;
  }
  .message-other-cell-content-text {
    /* 设置行间距 */
    line-height: 1.5;
  }
  .message-other-cell-voice {
    flex: 1;
    @include normalFlex(column, flex-start, flex-start);
  }
  .message-other-cell-voice-translate {
    margin-top: 8px;
    background-color: #fff;
  }
}
</style>
