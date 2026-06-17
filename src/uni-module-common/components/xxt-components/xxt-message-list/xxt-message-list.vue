<template>
  <view class="list-container">
    <view
      v-for="(item, index) in roomMessageListStore.getMessageList(roomId)"
      :key="item.messageId"
      class="message-item"
      style="margin-bottom: 10px; width: 100%"
    >
      <messageSelfCell
        v-if="item.selfFlag && item.messageType === 1"
        class="messageCell"
        message-type="text"
        :message="item.messageContent"
        :message-id="item.messageId"
        :send-time="item.sendDate"
      />
      <messageOtherCell
        v-if="!item.selfFlag && item.messageType === 1"
        :class="`messageCell${index}`"
        message-type="text"
        :message="item.messageContent"
        :message-id="item.messageId"
        :send-time="item.sendDate"
      />
      <messageSelfCell
        v-if="item.selfFlag && item.messageType === 2"
        :class="`messageCell${index}`"
        message-type="voice"
        :voice-url="item.voiceUrl"
        :voice-translate="item.messageContent"
        :voice-time="item.duration"
        :message-id="item.messageId"
        :send-time="item.sendDate"
      />
      <messageOtherCell
        v-if="!item.selfFlag && item.messageType === 2"
        :class="`messageCell${index}`"
        message-type="voice"
        :voice-url="item.voiceUrl"
        :voice-translate="item.messageContent"
        :voice-time="item.duration"
        :message-id="item.messageId"
        :send-time="item.sendDate"
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { getLeaveMessageList } from './hooks/api-hooks';
import type { MessageResponseType } from './hooks/messageType';
import useRoomMessageListStore from './message-store/messageStore';
import messageSelfCell from './xxt-message-self-cell.vue';
import messageOtherCell from './xxt-message-other-cell.vue';
import { appModuleConfig } from '@/uni-module-common/config/';
const props = withDefaults(
  defineProps<{
    roomId: number;
    // 获取留言记录地址
    getMessageListUrl?: string;
  }>(),
  {
    roomId: 0,
    getMessageListUrl: '/book-reading/leave-msg/get-message-list' // 默认是智慧阅读项目-家校留言模块
  }
);
const emits = defineEmits<{
  (e: 'update:trigger', val: boolean): void;
  (e: 'scrollToBottom'): void;
}>();
const roomMessageListStore = useRoomMessageListStore();
const messageListObj: Ref<MessageResponseType> = ref({
  resultList: [],
  totalRow: 0, // 总行数
  startRow: 0, // 起始行数
  pageSize: 10, // 每页行数
  totalPage: 0, // 总页数
  startPage: 0, // 起始页数
  pageCurrent: 0 // 当前页数
});
const messagePostParams = ref<any>({
  current: 1,
  pageSize: 10,
  search: {
    hostType: 1,
    hostId: appModuleConfig.hostId,
    roomId: ''
  },
  filter: {},
  sorter: {}
});
// #ifdef APP || APP-PLUS
messagePostParams.value = {
  current: 1,
  pageSize: 10,
  search: {
    hostType: 2,
    roomId: props.roomId
  },
  filter: {},
  sorter: {}
};
// #endif

// const newScrollToBottom = () => {
//   console.log('scrollToBottom---3');
//   nextTick(() => {
//     const query = uni.createSelectorQuery();
//     const messageList = roomMessageListStore.getMessageList(0);
//     const index = !messageList ? 0 : messageList.length - 1;
//     console.log('scrollToBottom---index---', index);
//     query.select('.messageCell').boundingClientRect();
//     query.exec((res: any) => {
//       console.log('scrollToBottom---res---2', res);
//       // const messageCellList = res[0];
//       // const lastMessageCell = messageCellList[messageCellList.length - 1];
//       // console.log('scrollToBottom---lastMessageCell---', lastMessageCell);
//       // const top = lastMessageCell.top;
//       // console.log('scrollToBottom---top---', top);
//       // const scrollTop = top;
//       // emits('scrollToBottoms');
//       // props.scrollToBottom();
//       // eventBus.emit('scrollToBottom');
//     });
//   });
// };

watch(
  messagePostParams,
  async (newVal, oldVal) => {
    console.log('messagePostParams', newVal, oldVal);
    const res: any = await getLeaveMessageList(props.getMessageListUrl, newVal);
    console.log('messagePostParams---res', res);
    if (!messagePostParams.value.search.messageId) {
      // 说明是第一次请求
      console.log('scrollToBottom---1');
      console.log('scrollToBottom---2');
      console.log('messagePostParams', messagePostParams.value);
      console.log('roomId', props.roomId);
      // newScrollToBottom();
      // #ifndef MP-WEIXIN
      nextTick(() => {
        emits('scrollToBottom');
      });
      // #endif
      // #ifdef MP-WEIXIN
      nextTick(() => {
        emits('scrollToBottom');
      });
      // #endif
    }
    console.log('getLeaveMessageList', res);
    messageListObj.value = res;
    roomMessageListStore.addMessageList(res.resultList, props.roomId);
    console.log('关闭下拉刷新动画');
    uni.stopPullDownRefresh();
    emits('update:trigger', false);
  },
  {
    deep: true,
    immediate: true
  }
);

// scroll-view 下拉刷新
function refresherrefresh(isEmit = false) {
  console.log('下拉刷新---refresherrefresh', isEmit);
  !isEmit && emits('update:trigger', true);
  // 拿到messageid
  const messageId = roomMessageListStore.getMessageList(props.roomId)![0].messageId;
  console.log('下拉刷新---messageId', messageId);
  console.log(
    '下拉刷新---messagePostParams.value.search.messageId',
    messagePostParams.value.search.messageId
  );
  if (messageId === messagePostParams.value.search.messageId) {
    setTimeout(() => {
      uni.stopPullDownRefresh();
      emits('update:trigger', false);
    }, 500);
  } else {
    messagePostParams.value.search.messageId = messageId;
    console.log('下拉刷新---messagePostParams', messagePostParams.value);
  }

  // 上拉加载时存在页面滚动的情况，导致列表上翻时最顶部内容被隐藏，此处强制返回到页面顶部
  uni.pageScrollTo({
    scrollTop: 0,
    duration: 100
  });
}
// 上拉加载更多的图书柜书籍
function onLoadMoreDynamic() {
  console.log('onLoadMoreDynamic---');
}
defineExpose({
  refresherrefresh,
  onLoadMoreDynamic,
  messagePostParams
});
</script>

<style scoped lang="scss">
.list-container {
  width: 100%;
  height: 100%;
  /* #ifndef MP-WEIXIN */
  background-color: #edfbf1;
  /* #endif */
  /* #ifdef MP-WEIXIN */
  background-color: #f5f5f5;
  /* #endif */
}
.message-item {
  /* #ifndef MP-WEIXIN */
  background-color: #edfbf1;
  /* #endif */
  /* #ifdef MP-WEIXIN */
  background-color: #f5f5f5;
  /* #endif */
}
</style>
