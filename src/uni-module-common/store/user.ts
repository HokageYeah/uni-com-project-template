/**
 * 模板工程的用户态 Store。
 *
 * 这一版实现以“最小会话模型”为主：
 * - 只把登录态、登录凭证、最小用户信息、回跳地址作为模板核心能力
 * - 旧项目里的多身份、年级学期、静默登录等复杂逻辑不再继续下沉到模板层
 *
 * 说明：
 * - 当前仓库里还有部分旧页面和旧工具仍然直接依赖老的 Store 方法名
 * - 为了让 task-01 落地后主链路先保持稳定，这里保留了少量“兼容方法”和“兼容字段”
 * - 这些兼容能力都只做最轻量处理，后续会在 task-02 / task-03 / task-06 中继续收口
 */

/**
 * 模板工程的最小用户信息。
 * 这是后续所有项目都能复用的核心字段集合。
 */
export interface TemplateUserInfo {
  /** 用户唯一标识，模板层统一使用 id */
  id: string | number;
  /** 用户昵称 */
  nickname: string;
  /** 用户头像地址 */
  avatar: string;
  /** 用户手机号，允许为空 */
  mobile?: string;
  /**
   * 过渡兼容字段：旧工程里很多地方仍然读取 wid。
   * task-05 / task-06 清理旧页面后可以继续收口。
   */
  wid?: string | number;
  /**
   * 过渡兼容字段：旧工程里历史上把 avatar 写成 avatorUrl。
   * 模板统一字段是 avatar，这里只做兼容映射。
   */
  avatorUrl?: string;
  /**
   * 过渡兼容字段：兼容少量旧页面读取 avatarUrl。
   */
  avatarUrl?: string;
  /**
   * 允许旧页面在过渡期挂一些非模板字段，避免 task-01 期间主链路直接崩掉。
   * 后续任务会逐步把这些旧字段从调用方清掉。
   */
  [key: string]: any;
}

/**
 * 登录态写入参数。
 */
export interface SetLoginStatePayload {
  /** 登录凭证。当前模板统一使用 token 命名。 */
  token?: any;
  /** 登录成功后需要写入的最小用户信息。 */
  userInfo?: Partial<TemplateUserInfo> | null;
}

/**
 * 过渡兼容字段：旧工程里有 userAgent 的读取逻辑。
 * 模板层不再把它当作核心用户态，只保留一个空对象承接旧引用。
 */
interface LegacyUserAgent {
  hostId?: string;
  appversion?: string;
  appversioncode?: string;
  [key: string]: any;
}

/**
 * 过渡兼容字段：旧工程里有 clientInfo 的读取逻辑。
 */
interface LegacyClientInfo {
  cv?: string;
  chv?: string;
  ch?: string;
  jv?: string;
  cbv?: string;
  [key: string]: any;
}

const LOGIN_TOKEN_STORAGE_KEY = 'token';
const LOGIN_USER_INFO_STORAGE_KEY = 'userInfo';
const LOGIN_REDIRECT_STORAGE_KEY = 'loginRedirectUrl';

/**
 * 模板层默认空用户。
 * 说明：
 * - id 默认留空字符串，方便后续直接用 truthy 判断
 * - wid / avatorUrl / avatarUrl 只是过渡兼容字段
 */
const createDefaultUserInfo = (): TemplateUserInfo => ({
  id: '',
  nickname: '',
  avatar: '',
  mobile: '',
  wid: '',
  avatorUrl: '',
  avatarUrl: ''
});

/**
 * 过渡兼容默认值：旧页面还会读取这些字段。
 * 这里只保留最轻量的空结构，不再承载旧业务意义。
 */
const defaultLegacyUserAgent: LegacyUserAgent = {
  hostId: '',
  appversion: '',
  appversioncode: ''
};

const defaultLegacyClientInfo: LegacyClientInfo = {
  cv: '',
  chv: '',
  ch: '',
  jv: '',
  cbv: ''
};

/**
 * 旧页面仍然会读取 accountList 和 deafultGradeTerm。
 * task-01 先保留空壳，防止当前页面直接访问时报错。
 */
const defaultLegacyGradeTerm = {
  grade: {
    code: 0,
    desc: ''
  },
  term: {
    code: 0,
    desc: ''
  }
};

/**
 * 从本地缓存中读取用户信息。
 * 这里统一兜底，避免 storage 中出现 `undefined` / 非 JSON 字符串时把页面带崩。
 */
const getStoredUserInfo = (): Partial<TemplateUserInfo> => {
  const rawUserInfo = uni.getStorageSync(LOGIN_USER_INFO_STORAGE_KEY);
  if (!rawUserInfo || rawUserInfo === 'undefined') {
    return {};
  }

  if (typeof rawUserInfo === 'object') {
    return rawUserInfo;
  }

  try {
    return JSON.parse(rawUserInfo);
  } catch (error) {
    console.warn('[用户状态] 读取本地用户信息失败，已回退为空对象', error);
    return {};
  }
};

/**
 * 统一把各种来源的用户信息收口成模板最小结构。
 * 兼容点：
 * - nickname / nickName
 * - avatar / avatorUrl / avatarUrl
 * - id / wid / webId
 */
const normalizeUserInfo = (rawUserInfo: Partial<TemplateUserInfo> | null | undefined) => {
  const sourceUserInfo = rawUserInfo || {};
  const defaultUserInfo = createDefaultUserInfo();

  const id = sourceUserInfo.id ?? sourceUserInfo.wid ?? sourceUserInfo.webId ?? '';
  const nickname = sourceUserInfo.nickname ?? sourceUserInfo.nickName ?? '';
  const avatar =
    sourceUserInfo.avatar ?? sourceUserInfo.avatorUrl ?? sourceUserInfo.avatarUrl ?? '';
  const mobile = sourceUserInfo.mobile ?? '';

  return {
    ...defaultUserInfo,
    ...sourceUserInfo,
    id,
    nickname,
    avatar,
    mobile,
    wid: sourceUserInfo.wid ?? sourceUserInfo.webId ?? id,
    avatorUrl: avatar,
    avatarUrl: avatar
  } as TemplateUserInfo;
};

/**
 * 模板登录态判断：
 * - 字符串：只要非空就视为已登录
 * - 对象：只要有 key 就视为已登录
 * - 数组：只要有元素就视为已登录
 * - 其它：走布尔值
 *
 * 说明：
 * 旧工程会按 Cookie Map 判断，这一版先统一降级为“最小凭证存在即已登录”。
 */
export const isLoginFunc = (token: any) => {
  if (Array.isArray(token)) {
    return token.length > 0;
  }

  if (token && typeof token === 'object') {
    return Object.keys(token).length > 0;
  }

  if (typeof token === 'string') {
    return token.trim().length > 0;
  }

  return Boolean(token);
};

const user = defineStore({
  id: 'user',
  state: () => {
    const token = uni.getStorageSync(LOGIN_TOKEN_STORAGE_KEY) || '';
    return {
      /**
       * 是否已登录。
       * 这是模板层最核心的判断字段。
       */
      isLogin: isLoginFunc(token),
      /**
       * 模板层统一使用的登录凭证。
       */
      token,
      /**
       * 过渡兼容字段：旧请求层和旧页面仍然读取 useToken。
       * 当前保持和 token 同步。
       */
      useToken: token,
      /**
       * 当前登录用户的最小信息。
       */
      userInfo: normalizeUserInfo(getStoredUserInfo()),
      /**
       * 未登录时记录的回跳地址。
       * 页面级和请求级登录跳转都应该写到这里。
       */
      loginRedirectUrl: uni.getStorageSync(LOGIN_REDIRECT_STORAGE_KEY) || '',
      /**
       * 过渡兼容字段：旧代码仍在读取 userAgent。
       * 模板层不再把它当核心状态，只保留空对象承接引用。
       */
      userAgent: { ...defaultLegacyUserAgent } as LegacyUserAgent,
      /**
       * 过渡兼容字段：旧代码仍在读取 clientInfo。
       */
      clientInfo: { ...defaultLegacyClientInfo } as LegacyClientInfo,
      /**
       * 过渡兼容字段：旧页面还会读取身份列表。
       * task-01 之后不再更新这份数据。
       */
      accountList: [] as any[],
      /**
       * 过渡兼容字段：旧页面还会读取默认年级学期。
       * 模板主流程不再依赖它。
       */
      deafultGradeTerm: { ...defaultLegacyGradeTerm }
    };
  },
  actions: {
    /**
     * 写入模板登录态。
     * 这是新的核心入口，后续登录成功后统一调用它。
     */
    setLoginState(payload: SetLoginStatePayload = {}) {
      const nextToken = payload.token ?? '';
      const nextIsLogin = isLoginFunc(nextToken);

      console.log('[用户状态] 开始写入模板登录态', {
        是否登录: nextIsLogin,
        是否携带用户信息: Boolean(payload.userInfo)
      });

      this.token = nextToken;
      this.useToken = nextToken;
      this.isLogin = nextIsLogin;

      if (nextIsLogin) {
        uni.setStorageSync(LOGIN_TOKEN_STORAGE_KEY, nextToken);
      } else {
        uni.removeStorageSync(LOGIN_TOKEN_STORAGE_KEY);
      }

      if (payload.userInfo) {
        this.setUserInfo(payload.userInfo);
      } else if (!nextIsLogin) {
        this.userInfo = createDefaultUserInfo();
        uni.removeStorageSync(LOGIN_USER_INFO_STORAGE_KEY);
      }

      console.log('[用户状态] 模板登录态写入完成', {
        是否登录: this.isLogin,
        当前用户ID: this.userInfo.id || ''
      });

      return this.isLogin;
    },

    /**
     * 单独写入最小用户信息。
     * 登录页模拟登录、真实登录成功、页面资料刷新都应优先走这个方法。
     */
    setUserInfo(userInfo: Partial<TemplateUserInfo> | null | undefined) {
      const normalizedUserInfo = normalizeUserInfo(userInfo);
      console.log('[用户状态] 更新用户最小信息', normalizedUserInfo);
      this.userInfo = normalizedUserInfo;
      uni.setStorageSync(LOGIN_USER_INFO_STORAGE_KEY, JSON.stringify(normalizedUserInfo));
      return this.userInfo;
    },

    /**
     * 记录登录后的回跳地址。
     */
    setLoginRedirectUrl(url = '') {
      console.log('[用户状态] 记录登录回跳地址', url);
      this.loginRedirectUrl = url;

      if (url) {
        uni.setStorageSync(LOGIN_REDIRECT_STORAGE_KEY, url);
      } else {
        uni.removeStorageSync(LOGIN_REDIRECT_STORAGE_KEY);
      }
    },

    /**
     * 清空当前登录态和用户信息。
     */
    clearLoginState() {
      console.log('[用户状态] 清空模板登录态和用户信息');
      this.isLogin = false;
      this.token = '';
      this.useToken = '';
      this.userInfo = createDefaultUserInfo();
      this.setLoginRedirectUrl('');

      uni.removeStorageSync(LOGIN_TOKEN_STORAGE_KEY);
      uni.removeStorageSync(LOGIN_USER_INFO_STORAGE_KEY);
    },

    /**
     * 统一判断当前操作是否需要登录。
     * 返回值说明：
     * - `true`：当前未登录，调用方应该跳登录页
     * - `false`：当前已登录，可以继续当前流程
     */
    requireLogin(redirectUrl = '') {
      if (this.isLogin) {
        console.log('[用户状态] 当前已登录，无需再次跳转登录');
        return false;
      }

      const finalRedirectUrl = redirectUrl || this.loginRedirectUrl || '/pages/index/index';
      console.log('[用户状态] 当前未登录，准备记录回跳地址', finalRedirectUrl);
      this.setLoginRedirectUrl(finalRedirectUrl);
      return true;
    },

    /**
     * 读取一次回跳地址，并在读取后立即清空。
     * 登录页登录成功后应优先使用这个方法回跳。
     */
    consumeLoginRedirect() {
      const redirectUrl = this.loginRedirectUrl || '/pages/index/index';
      console.log('[用户状态] 消费登录回跳地址', redirectUrl);
      this.setLoginRedirectUrl('');
      return redirectUrl;
    },

    /**
     * 兼容旧工程的 setToken 调用。
     * 当前只做最小转换：把 token 写入模板登录态，把传入用户信息映射到最小用户模型。
     */
    async setToken(token = '', userMessage: any = {}) {
      console.log('[用户状态] 兼容方法 setToken 被调用');
      return this.setLoginState({
        token,
        userInfo: userMessage && Object.keys(userMessage).length > 0 ? userMessage : null
      });
    },

    /**
     * 兼容旧工程的 resetUserData 调用。
     */
    resetUserData() {
      console.log('[用户状态] 兼容方法 resetUserData 被调用');
      this.clearLoginState();
    },

    /**
     * 兼容旧工程逐字段写入的场景。
     * 当前只作为过渡方法保留，后续页面应统一改为 setUserInfo。
     */
    setUserInfoAttr(key: string, value: any) {
      console.log('[用户状态] 兼容设置用户字段', { 字段名: key, 字段值: value });
      const nextUserInfo = {
        ...this.userInfo,
        [key]: value
      };
      this.setUserInfo(nextUserInfo);
    },

    /**
     * 过渡兼容：旧项目会主动写 userAgent。
     * 模板层先只做承接和日志，不再把它作为核心登录态的一部分。
     */
    setUserAgent(userAgent: string) {
      console.log('[用户状态] 写入兼容 userAgent', userAgent);
      if (!userAgent || typeof userAgent !== 'string') {
        this.userAgent = { ...defaultLegacyUserAgent };
        return this.userAgent;
      }

      const userAgentObject = userAgent.split(';').reduce((result: LegacyUserAgent, item) => {
        const [key, value] = item.split(':');
        if (key) {
          result[key] = value || '';
        }
        return result;
      }, {} as LegacyUserAgent);

      this.userAgent = {
        ...defaultLegacyUserAgent,
        ...userAgentObject
      };

      return this.userAgent;
    },

    /**
     * 过渡兼容：旧项目会主动写 clientInfo。
     */
    setClientInfo(clientInfo: any) {
      console.log('[用户状态] 写入兼容 clientInfo', clientInfo);
      if (!clientInfo) {
        this.clientInfo = { ...defaultLegacyClientInfo };
        return this.clientInfo;
      }

      if (typeof clientInfo === 'object') {
        this.clientInfo = {
          ...defaultLegacyClientInfo,
          ...clientInfo
        };
        return this.clientInfo;
      }

      try {
        const parsedClientInfo = JSON.parse(clientInfo);
        this.clientInfo = {
          ...defaultLegacyClientInfo,
          ...parsedClientInfo
        };
      } catch (error) {
        console.warn('[用户状态] clientInfo 解析失败，已回退为空对象', error);
        this.clientInfo = { ...defaultLegacyClientInfo };
      }

      return this.clientInfo;
    },

    /**
     * 兼容旧登录成功后的统一回调。
     * 当前收口到最小登录态，不再继续做旧业务用户模型装配。
     */
    async loginAfter(userMessage: any, userAgent = '', clientInfo: any = {}) {
      console.log('[用户状态] 兼容方法 loginAfter 被调用，开始写入模板用户态');
      userAgent && this.setUserAgent(userAgent);
      clientInfo && this.setClientInfo(clientInfo);

      this.setLoginState({
        token: this.token || this.useToken,
        userInfo: userMessage && Object.keys(userMessage).length > 0 ? userMessage : null
      });

      return this.userInfo;
    },

    /**
     * 初始化模板用户态。
     * 这里只从本地缓存恢复最小会话信息，不再做微信静默登录或旧 Cookie 修复。
     */
    async initStoreData(entry = 'unknown') {
      console.log('[用户状态] 初始化模板用户态', entry);
      const storedToken = uni.getStorageSync(LOGIN_TOKEN_STORAGE_KEY) || '';
      const storedUserInfo = getStoredUserInfo();
      const storedRedirectUrl = uni.getStorageSync(LOGIN_REDIRECT_STORAGE_KEY) || '';

      this.token = storedToken;
      this.useToken = storedToken;
      this.isLogin = isLoginFunc(storedToken);
      this.userInfo = normalizeUserInfo(storedUserInfo);
      this.loginRedirectUrl = storedRedirectUrl;

      console.log('[用户状态] 模板用户态初始化完成', {
        是否登录: this.isLogin,
        当前用户ID: this.userInfo.id || '',
        回跳地址: this.loginRedirectUrl || ''
      });

      return {
        isLogin: this.isLogin,
        token: this.token,
        userInfo: this.userInfo,
        loginRedirectUrl: this.loginRedirectUrl
      };
    },

    /**
     * 兼容旧页面的资料刷新调用。
     * 这一步只做最小用户信息更新，不再请求旧接口。
     */
    async getInfo(userMessage: any = {}) {
      console.log('[用户状态] 兼容方法 getInfo 被调用', userMessage);
      if (userMessage && Object.keys(userMessage).length > 0) {
        this.setUserInfo(userMessage);
      }
      return this.userInfo;
    },

    /**
     * 兼容旧代码：保留空实现，后续任务会从调用方清掉。
     */
    setAccountList(accountList: any[] = []) {
      console.log('[用户状态] 兼容设置 accountList', accountList);
      this.accountList = accountList;
    },

    /**
     * 兼容旧代码：模板层不再维护默认年级学期，只保留最轻量的承接。
     */
    setDeafultGradeTerm(deafultGradeTerm: any) {
      console.log('[用户状态] 兼容设置 deafultGradeTerm', deafultGradeTerm);
      this.deafultGradeTerm = deafultGradeTerm || { ...defaultLegacyGradeTerm };
    },

    /**
     * 兼容旧代码：统一降级为最小用户信息更新。
     */
    async updateUserData(userMessage: any) {
      console.log('[用户状态] 兼容方法 updateUserData 被调用', userMessage);
      if (userMessage && Object.keys(userMessage).length > 0) {
        this.setUserInfo(userMessage);
      }
      return this.userInfo;
    },

    /**
     * 兼容旧代码：当前模板工程不再维护多身份列表。
     */
    async getUserMore() {
      console.log('[用户状态] 模板层已不再维护多身份列表，返回空数组');
      return [];
    }
  }
});

export default user;
