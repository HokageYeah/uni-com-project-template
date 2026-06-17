<template>
  <view class="message-self-cell">
    <view v-if="messageType === 'text'" class="message-self-cell-bg">
      <view class="message-self-cell-content">
        <tui-text
          class="message-self-cell-content-text"
          block
          :size="text_size"
          :text="message"
        ></tui-text>
      </view>
      <view class="message-self-cell-time">{{ utils.formatTimeWithChinese(sendTime) }}</view>
    </view>
    <view v-if="messageType === 'voice'" class="message-self-cell-voice">
      <view class="message-self-cell-bg">
        <message-voice
          :voice-url="voiceUrl"
          :voice-translate="voiceTranslate"
          :voice-time="voiceTime"
          :is-self="true"
          :message-id="messageId"
        />
        <view
          v-if="voiceTranslate.length > 0"
          class="message-self-cell-content message-self-cell-voice-translate"
        >
          <tui-text
            class="message-self-cell-content-text"
            block
            :size="text_size"
            :text="voiceTranslate"
          ></tui-text>
        </view>
        <view class="message-self-cell-time">{{ utils.formatTimeWithChinese(sendTime) }}</view>
      </view>
    </view>
    <image
      class="avator-img"
      mode="aspectFill"
      :src="`${$cdn}/nb/m/base/img/login-student.png`"
    ></image>
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
.message-self-cell {
  padding: 16px 16px 0;
  /* #ifndef MP-WEIXIN */
  background-color: #edfbf1;
  /* #endif */
  /* #ifdef MP-WEIXIN */
  background-color: #f5f5f5;
  /* #endif */
  @include normalFlex(row, flex-end, flex-start);
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
  .message-self-cell-bg {
    flex: 1;
    width: 100%;
    @include normalFlex(column, flex-start, flex-end);
    .message-self-cell-time {
      margin-top: 8px;
      margin-right: 15px;
      color: #999;
      /* #ifdef MP-WEIXIN */
      font-size: 12px;
      /* #endif */
      /* #ifndef MP-WEIXIN */
      font-size: 18px;
      margin-right: 25px;
      /* #endif */
    }
  }
  .message-self-cell-content {
    flex: 1;
    box-sizing: border-box;
    margin-right: 15px;
    padding: 12px;
    border-radius: 8px 4px 8px 8px;
    background-color: #ccffdb;
    /* #ifndef MP-WEIXIN */
    max-width: 70%;
    margin-right: 25px;
    padding: 20px;
    /* #endif */
  }
  .message-self-cell-content-text {
    /* 设置行间距 */
    line-height: 1.5;
  }
  .message-self-cell-voice {
    flex: 1;
    @include normalFlex(column, flex-start, flex-end);
  }
  .message-self-cell-voice-translate {
    margin-top: 8px;
    /* #ifndef MP-WEIXIN */
    background-color: #fff;
    /* #endif */
  }
}
</style>
