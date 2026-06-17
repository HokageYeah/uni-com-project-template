import eventBus from '@/uni-module-common/utils/eventBus';

class AudioManager {
  private static instance: AudioManager;
  private audioContext: any = null;
  private isPlaying = false;
  private currentTime = 0;
  private duration = 0;
  private isChanging = false;
  private currentSrc = '';

  // 私有构造函数，防止外部实例化
  private constructor() {
    this.initEventBus();
  }

  // 获取单例实例
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // 初始化事件总线监听
  private initEventBus() {
    eventBus.on('stopAllAudio', () => {
      this.stop();
    });
  }

  // 创建音频上下文
  private createAudioContext() {
    if (this.audioContext) {
      this.destroyAudioContext();
    }

    this.audioContext = uni.createInnerAudioContext();
    this.audioContext.autoplay = false;

    this.audioContext.onPlay(() => {
      this.isPlaying = true;
      eventBus.emit('audioPlayStateChange', {
        playing: true,
        src: this.currentSrc
      });
    });

    this.audioContext.onTimeUpdate(() => {
      if (this.isChanging) return;

      this.currentTime = Math.floor(this.audioContext.currentTime) || 0;
      this.duration = Math.floor(this.audioContext.duration) || 0;

      eventBus.emit('audioTimeUpdate', {
        currentTime: this.currentTime,
        duration: this.duration,
        src: this.currentSrc
      });
    });

    this.audioContext.onEnded(() => {
      this.currentTime = 0;
      this.isPlaying = false;

      eventBus.emit('audioEnded', {
        src: this.currentSrc
      });

      eventBus.emit('audioPlayStateChange', {
        playing: false,
        src: this.currentSrc
      });
    });

    this.audioContext.onError((res: any) => {
      this.isPlaying = false;
      eventBus.emit('audioError', res);
      eventBus.emit('audioPlayStateChange', {
        playing: false,
        src: this.currentSrc
      });
    });
  }

  // 销毁音频上下文
  private destroyAudioContext() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
      this.audioContext = null;
    }
  }

  // 播放音频
  public play(src: string) {
    console.log('播放音频', src, this.currentSrc);
    // 如果是同一音频且正在播放，则暂停
    if (this.currentSrc === src && this.isPlaying) {
      this.pause();
      return;
    }
    if (this.currentSrc === src && !this.isPlaying) {
      this.audioContext.play();
      this.isPlaying = true;
      return;
    }
    // 停止所有其他音频
    eventBus.emit('stopAllAudio');
    // 如果还没有音频上下文或音频源不同，创建新的上下文
    if (!this.audioContext || this.currentSrc !== src) {
      this.currentSrc = src;
      this.createAudioContext();
      this.audioContext.src = src;
    }

    // 播放音频
    this.audioContext.play();
    this.isPlaying = true;
  }

  // 暂停音频
  public pause() {
    if (this.audioContext && this.isPlaying) {
      this.audioContext.pause();
      this.isPlaying = false;
      eventBus.emit('audioPlayStateChange', {
        playing: false,
        src: this.currentSrc
      });
    }
  }

  // 停止音频
  public stop() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.currentTime = 0;
      this.isPlaying = false;
      eventBus.emit('audioTimeUpdate', {
        currentTime: 0,
        duration: this.duration,
        src: this.currentSrc
      });
      eventBus.emit('audioPlayStateChange', {
        playing: false,
        src: this.currentSrc
      });
    }
  }

  // 跳转到指定时间
  public seek(time: number) {
    if (this.audioContext) {
      this.audioContext.seek(time);
      this.currentTime = time;
      this.isChanging = false;
      eventBus.emit('audioTimeUpdate', {
        currentTime: this.currentTime,
        duration: this.duration,
        src: this.currentSrc
      });
    }
  }

  // 开始拖动进度条
  public startChanging() {
    this.isChanging = true;
  }

  // 更新拖动进度
  public updateChangingTime(time: number) {
    if (this.isChanging) {
      this.currentTime = time;
      eventBus.emit('audioTimeUpdate', {
        currentTime: this.currentTime,
        duration: this.duration,
        src: this.currentSrc
      });
    }
  }

  // 获取当前播放状态
  public getPlayState() {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration,
      currentSrc: this.currentSrc
    };
  }

  // 销毁管理器
  public destroy() {
    this.stop();
    this.destroyAudioContext();
    eventBus.off('stopAllAudio');
    AudioManager.instance = null as any;
  }
}

// 导出单例实例
export default AudioManager.getInstance();
