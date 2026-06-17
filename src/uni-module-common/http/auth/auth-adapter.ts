/**
 * HTTP 鉴权适配器协议。
 * 请求层只依赖这组最小方法，不再直接依赖具体的 user store 或登录跳转实现。
 */
export interface HttpAuthAdapter {
  /**
   * 判断当前项目会话是否已登录。
   * 返回 `true` 表示可以继续发起受保护请求，返回 `false` 表示需要进入统一登录流程。
   */
  isLoggedIn(): boolean;
  /**
   * 读取当前请求层可挂载的最小 token。
   * 请求层当前只返回字符串 token；如果底层仍是旧 Cookie Map，则返回空字符串避免误挂到请求头。
   */
  getToken(): string;
  /**
   * 触发统一登录流程。
   * 可选传入显式回跳地址；不传时由适配器内部读取当前页面地址并写入 user store。
   */
  requireLogin(redirectUrl?: string): void;
  /**
   * 清理当前当前登录态。
   * 用于接口明确返回未登录、或网络层确认 401 时的统一兜底。
   */
  clearLoginState(): void;
  /**
   * 跳转到登录页。
   * 这里返回 Promise，方便响应拦截器在需要时等待跳转调用完成后再中断请求链路。
   */
  redirectToLogin(redirectUrl: string): Promise<void>;
}
