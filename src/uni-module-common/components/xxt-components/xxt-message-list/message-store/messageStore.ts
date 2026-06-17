import { cloneDeep } from 'lodash';
import type { MessageType, RoomMessageStoreType } from '../hooks/messageType';

const defaultRoomMessageList: RoomMessageStoreType[] = [
  {
    roomId: 0,
    messageList: []
  }
];

const roomMessageListStore = defineStore({
  id: 'roomMessageListStore',
  state: () => ({
    roomMessageList: cloneDeep(defaultRoomMessageList),
    isPlaying: false
  }),
  actions: {
    addMessage(message: MessageType, roomId: number) {
      const roomMessageListIndex = this.roomMessageList.findIndex((item) => item.roomId === roomId);
      console.log('addMessage', message, roomId);
      if (roomMessageListIndex !== -1) {
        console.log('roomMessageList', this.roomMessageList[roomMessageListIndex]);
        this.roomMessageList[roomMessageListIndex].messageList.push(message);
      } else {
        console.log('roomMessageList-else', this.roomMessageList);
        this.roomMessageList.push({ roomId, messageList: [message] });
      }
    },
    addMessageList(messageList: MessageType[], roomId: number) {
      const roomMessageListIndex = this.roomMessageList.findIndex((item) => item.roomId === roomId);
      if (roomMessageListIndex !== -1) {
        this.roomMessageList[roomMessageListIndex].messageList = [
          ...messageList,
          ...this.roomMessageList[roomMessageListIndex].messageList
        ];
        console.log(
          'addMessageList---this.roomMessageList1---roomid',
          roomId,
          this.roomMessageList
        );
      } else {
        this.roomMessageList.push({ roomId, messageList });
        console.log(
          'addMessageList---this.roomMessageList2---roomid',
          roomId,
          this.roomMessageList
        );
      }
    },
    // 清空消息列表
    clearMessageList(roomId: number) {
      console.log('clearMessageList---roomMessageList---', this.roomMessageList);
      const roomMessageListIndex = this.roomMessageList.findIndex((item) => item.roomId === roomId);
      this.roomMessageList[roomMessageListIndex].messageList = [];
    }
  },
  getters: {
    getRoomMessageList(state) {
      return state.roomMessageList;
    },
    getMessageList(state) {
      return (roomId: number) => {
        return state.roomMessageList.find((item) => item.roomId === roomId)?.messageList;
      };
    }
  }
  // persist: {
  //   enabled: true,
  //   H5Storage: window?.localStorage,
  //   strategies: [
  //     {
  //       // 之前的
  //       // storage: window?.localStorage
  //       //  存储在本地
  //       storage: {
  //         getItem: (key: string) => {
  //           return uni.getStorageSync(key);
  //         },
  //         setItem: (key: string, value: string) => {
  //           uni.setStorageSync(key, value);
  //         },
  //         removeItem: (key: string) => {
  //           uni.removeStorageSync(key);
  //         },
  //         length: 1,
  //         key: (index: number) => {
  //           console.log('key--', index);
  //           return 'roomMessageList';
  //         },
  //         clear: () => {
  //           uni.clearStorageSync();
  //         }
  //       }
  //     }
  //   ]
  // }
});

export default roomMessageListStore;
