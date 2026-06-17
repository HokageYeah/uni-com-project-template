import eventBus from '@/uni-module-common/utils/eventBus';

type EventCallback = (data?: any) => void;
type EventType = 'open' | 'message' | 'close' | 'error' | 'reconnecting';

// 连接状态枚举
enum ConnectionState {
  CONNECTING = 0, // 连接中
  CONNECTED = 1, // 连接成功
  DISCONNECTED = 2, // 连接断开
  RECONNECTING = 3 // 重连中
}

class SocketService {
  private socketTask: UniApp.SocketTask | null = null; // 连接任务
  private reconnectAttempts = 0; // 重连次数
  private maxReconnectAttempts = 5; // 最大重连次数
  private reconnectInterval = 3000; // 重连间隔
  private _url = ''; // 连接地址
  private shouldReconnect = true; // 是否需要重连
  private heartbeatInterval: number | null = null; // 修复：uni-app 中应为 number
  private heartbeatDelay = 30000; // 心跳间隔30秒
  private pingMessage = { type: 'ping' }; // 心跳消息内容
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED; // 连接状态

  constructor(url: string) {
    this._url = url; // 连接地址
  }

  get url() {
    return this._url;
  }

  set url(url: string) {
    this._url = url;
  }

  // 判断连接是否正常
  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  // 获取 Token 并格式化为 Cookie
  private getAuthCookie(): string {
    const token = uni.getStorageSync('token'); // 获取token
    if (!token) return '';

    // 如果 token 是对象类型，格式化处理
    if (typeof token === 'object') {
      return Object.entries(token)
        .map(([key, item]: [string, any]) => `${key}=${item.value}`)
        .join(';');
    }
    return token;
  }

  // 创建连接
  connect() {
    // 如果已有连接，先关闭
    if (this.socketTask) {
      this.socketTask.close({});
      this.socketTask = null;
    }

    // 防止重复连接
    if (this.connectionState === ConnectionState.CONNECTING) {
      console.warn('WebSocket 正在连接中，请勿重复调用');
      return;
    }

    this.connectionState = ConnectionState.CONNECTING;
    const cookie = this.getAuthCookie();

    this.socketTask = uni.connectSocket({
      url: this._url,
      header: {
        Cookie: cookie
      },
      complete: () => {}
    });

    this.bindEvents();
  }

  // 更新、设置连接地址
  updateUrl(url: string) {
    this._url = url;
  }

  // 绑定原生事件
  private bindEvents() {
    if (!this.socketTask) return;

    this.socketTask.onOpen(() => {
      console.log('WebSocket 连接成功');
      this.reconnectAttempts = 0;
      this.shouldReconnect = true;
      this.connectionState = ConnectionState.CONNECTED;
      this.startHeartbeat(); // 连接成功后启动心跳
      eventBus.emit('open');
    });

    this.socketTask.onMessage((res) => {
      try {
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        // 如果是服务器返回的 pong 消息，不需要转发给业务层
        if (data.type !== 'pong') {
          eventBus.emit('message', data);
        }
      } catch (e) {
        console.error('WebSocket 消息解析失败:', e);
        // 即使解析失败也触发 message 事件，让业务层处理
        eventBus.emit('message', res.data);
      }
    });

    this.socketTask.onClose((res) => {
      const { code, reason } = res;
      console.log(`WebSocket 关闭，代码: ${code}, 原因: ${reason || '未知'}`);
      this.stopHeartbeat(); // 关闭时停止心跳
      this.connectionState = ConnectionState.DISCONNECTED;
      eventBus.emit('close', { code, reason });

      // 只有在需要重连且不是主动关闭时才重连
      // 这里有问题，ios在对话过程中熄屏，或者退出微信程序后，再次打开现实关闭，状态码是非1000，重新连接成功
      // 安卓则同样的操作，状态码是1000，不会重新连接。所以调整逻辑，只要断开了就重新连接，不判断状态码。
      // 每次断开都重新连接，连接需要根据最新的url进行重新连接。
      // if (this.shouldReconnect && code !== 1000) {
      //   this.tryReconnect();
      // }
      if (this.shouldReconnect) {
        this.tryReconnect();
      }
    });

    this.socketTask.onError((err) => {
      console.error('WebSocket 错误:', err);
      this.stopHeartbeat(); // 错误时停止心跳
      this.connectionState = ConnectionState.DISCONNECTED;
      eventBus.emit('error', err);

      if (this.shouldReconnect) {
        this.tryReconnect();
      }
    });
  }

  // 启动心跳机制
  startHeartbeat() {
    this.stopHeartbeat(); // 先停止可能存在的心跳
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState === ConnectionState.CONNECTED && this.socketTask) {
        this.send(this.pingMessage);
      } else {
        // 如果状态不对，停止心跳
        this.stopHeartbeat();
      }
    }, this.heartbeatDelay) as unknown as number;
  }

  // 停止心跳机制
  stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // 事件监听
  on(event: EventType, callback: EventCallback) {
    eventBus.on(event, callback);
  }

  // 取消监听
  off(event: EventType, callback?: EventCallback) {
    eventBus.off(event, callback);
  }

  // 发送消息
  send(data: object) {
    if (this.connectionState !== ConnectionState.CONNECTED || !this.socketTask) {
      console.error('WebSocket 未连接，无法发送消息');
      return false;
    }

    try {
      this.socketTask.send({
        data: JSON.stringify(data),
        success: () => {
          // 只在非心跳消息时打印日志
          if ((data as any).type !== 'ping') {
            console.log('消息发送成功:', data);
          }
        },
        fail: (err) => {
          console.error('消息发送失败:', err);
        }
      });
      return true;
    } catch (err) {
      console.error('消息发送异常:', err);
      return false;
    }
  }

  // 尝试重连
  tryReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.shouldReconnect) {
      console.error('WebSocket 重连失败，已达到最大重连次数');
      this.connectionState = ConnectionState.DISCONNECTED;
      return;
    }

    this.reconnectAttempts++;
    this.connectionState = ConnectionState.RECONNECTING;

    // 指数退避策略，重连间隔逐渐增加，最大不超过 30 秒
    const currentInterval = Math.min(
      this.reconnectInterval * 2 ** (this.reconnectAttempts - 1),
      30000
    );

    console.log(
      `尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})，间隔 ${currentInterval}ms`
    );

    eventBus.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      interval: currentInterval
    });

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect();
      }
    }, currentInterval);
  }

  // 主动关闭连接，并停止自动重连
  stop() {
    this.shouldReconnect = false;
    this.stopHeartbeat();

    if (this.socketTask) {
      this.socketTask.close({
        code: 1000,
        reason: '主动关闭'
      });
      this.socketTask = null;
    }

    this.connectionState = ConnectionState.DISCONNECTED;
    console.log('WebSocket 已停止并断开连接');
  }

  // 重建连接，先停止连接，再重连
  restart() {
    console.log('重建 WebSocket 连接');
    this.stop();

    // 延迟一下再重连，确保资源已释放
    setTimeout(() => {
      this.shouldReconnect = true;
      this.reconnectAttempts = 0;
      this.connect();
    }, 100);
  }

  // 关闭连接并清理所有事件监听
  close() {
    this.stop();
    // eventBus.clear();
    // 清理websocket事件
    eventBus.off('open');
    eventBus.off('message');
    eventBus.off('close');
    eventBus.off('error');
    eventBus.off('reconnecting');
    console.log('WebSocket 已关闭并清理所有事件');
  }
}

// 创建单例
export const createSocket = (url: string) => {
  return new SocketService(url);
};
