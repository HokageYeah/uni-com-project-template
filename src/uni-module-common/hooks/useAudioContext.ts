import log from '@/uni-module-common/utils/log';

const useAudioContext = () => {
  let audioContext: any = null;
  const audioPlayingFlag = ref(false);

  const useBackgroundAudio = ref(false); // 是否使用背景音频管理器

  const initAudioContext = () => {
    if (!audioContext) {
      if (useBackgroundAudio.value) {
        audioContext = uni.getBackgroundAudioManager();
        audioContext.title = '每日新闻';
        audioContext.protocol = 'https';
      } else {
        audioContext = uni.createInnerAudioContext();
        audioContext.autoplay = true;
      }

      audioContext.onPause(() => {
        console.log('背景音频暂停事件', new Date().getTime());
      });
      audioContext.onError((res: any) => {
        console.log(res.errMsg);
        console.log(res.errCode);
        audioPlayingFlag.value = false;
        uni.showToast({ title: '音频加载失败', icon: 'none', duration: 3000 });
        log.event('播放音频报错', '音频播放hooks', {
          url: audioContext.src,
          title: audioContext.title,
          res: JSON.stringify(res),
          useBackgroundAudio: useBackgroundAudio.value
        });
      });
      audioContext.onStop(() => {
        audioPlayingFlag.value = false;
        console.log('播放结束', new Date().getTime());
        log.event('播放结束', '音频播放hooks', {
          url: audioContext.src,
          title: audioContext.title,
          useBackgroundAudio: useBackgroundAudio.value
        });
      });
      audioContext.onEnded(() => {
        audioPlayingFlag.value = false;
        audioContext.stop();
        console.log('播放结束-自然结束', new Date().getTime());
        log.event('播放结束-自然结束', '音频播放hooks', {
          url: audioContext.src,
          title: audioContext.title,
          useBackgroundAudio: useBackgroundAudio.value
        });
        audioContext.src = '';
        audioContext.title = '';
        audioContext = null;
      });
    }
  };
  const playAudio = (url: string, imgUrl?: string, title?: string) => {
    if (!audioContext) {
      initAudioContext();
    }
    audioContext.src = url;
    if (imgUrl) {
      audioContext.coverImgUrl = imgUrl;
    }
    if (title) {
      audioContext.title = title;
    }
    audioPlayingFlag.value = true;
    console.log('开始播放--已修改src', url, new Date().getTime());

    audioContext.onCanplay(() => {
      console.log('可以播放了', new Date().getTime());
    });
    audioContext.onPlay(() => {
      console.log('开始播放', new Date().getTime());
      log.event('开始播放音频', '音频播放hooks', {
        url,
        title,
        useBackgroundAudio: useBackgroundAudio.value
      });
    });
  };

  const stopAudio = () => {
    try {
      if (audioContext) {
        audioContext.pause();
        if (!useBackgroundAudio.value) {
          audioContext.destroy();
        } else {
          audioContext.stop();
          audioContext.src = '';
          audioContext.title = '';
        }
        audioContext = null;
      }
      audioPlayingFlag.value = false;
    } catch (e) {
      // TODO handle the exception
    }
  };

  return {
    audioPlayingFlag,
    useBackgroundAudio,
    initAudioContext,
    playAudio,
    stopAudio
  };
};

export default useAudioContext;
