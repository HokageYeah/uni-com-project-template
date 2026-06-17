import { appModuleConfig } from '@/uni-module-common/config';
import ajax from '@/uni-module-common/http';

/**
 * 智学统付三方支付方式枚举。
 * 当前公共支付工具优先落地微信小程序支付，同时保留其他支付方式标识，便于后续业务扩展。
 */
export enum XxtThirdPaidTypeEnum {
  /** 支付宝 App 支付 */
  AliApp = 1,
  /** 微信 App 支付 */
  WxApp = 2,
  /** 微信浏览器 JSAPI 支付 */
  WxJsapi = 3,
  /** 手机浏览器支付宝支付 */
  AliH5 = 9,
  /** 手机浏览器微信支付 */
  WxH5 = 10,
  /** 微信小程序支付 */
  WxMiniProgram = 12
}

/**
 * xxt 订单来源枚举。
 * 这里只列出当前公共支付工具里最常用的来源值，业务仍可直接透传其他 sourceType。
 */
export enum XxtOrderSourceTypeEnum {
  /** H5 网站订购 */
  H5 = 5,
  /** 客户端 App 订购 */
  App = 6
}

/**
 * xxt 订单来源渠道枚举。
 * 业务若有其他来源渠道，可直接传入数字值覆盖。
 */
export enum XxtOrderMarketingTypeEnum {
  /** 网站自行购买 */
  SelfPurchase = 1,
  /** 公众号 */
  WechatOfficial = 2,
  /** 运营群 */
  OperationGroup = 3,
  /** 市场推广 */
  MarketPromotion = 4
}

/**
 * 创建 xxt 订单时的产品构成参数。
 * 适用于需要用户显式选择服务量或服务策略的产品。
 */
export interface XxtOrderCreateProductComponentItem {
  /** 服务 ID */
  serviceId: number;
  /** 服务量选项 ID / 服务策略 ID */
  serviceAmountId: number;
  /** 服务量 */
  serviceAmount?: number;
}

/**
 * 创建 xxt 订单时的产品参数。
 * 一个订单可包含多个产品，当前会员购买场景通常只传一个产品。
 */
export interface XxtOrderCreateProductItem {
  /** 产品 ID */
  productId: number;
  /** 产品构成列表 */
  components?: XxtOrderCreateProductComponentItem[];
}

/**
 * 创建 xxt 订单接口入参。
 * 接口 ID: 2968
 */
export interface XxtOrderCreateRequestParams {
  /** 活动 ID，活动场景时传入 */
  activityId?: number;
  /** 用户自主资料标记 */
  recordId?: number;
  /** 订单类型，部分业务场景会要求额外透传该字段 */
  orderType?: number;
  /** 客户端标识，默认使用当前项目配置的 hostId */
  hostId: number;
  /** 订单来源 */
  sourceType: number;
  /** 来源渠道 */
  marketingType: number;
  /** 产品列表 */
  products: XxtOrderCreateProductItem[];
  /** 优惠券标识列表 */
  couponIds?: number[];
  /** 订单资费缓存 key */
  token?: string;
}

/**
 * 创建 xxt 订单接口返回值。
 */
export interface XxtOrderCreateResponse {
  /** xxt 订单 ID */
  orderId?: number;
  /** 订单名称 */
  orderName: string;
  /** 支付状态：0 待支付，1 已支付 */
  payStatus: number;
  /** 结果类型：1 同步，2 异步 */
  payResultType: number;
}

/**
 * 创建微信/支付宝三方支付订单接口入参。
 * 接口 ID: 2969
 */
export interface XxtThirdOrderCreateRequestParams {
  /** xxt 订单 ID */
  orderId: number;
  /** 支付方式标识 */
  paidType: XxtThirdPaidTypeEnum | number;
  /** 微信 code，JSAPI 和小程序支付时必传 */
  wxCode?: string;
  /** 支付失败或中途退出后的回跳地址 */
  quitUrl?: string;
}

/**
 * 三方支付订单接口原始返回值。
 * 当前接口返回一个 JSON 字符串，因此这里保留 content 原始字段。
 */
export interface XxtThirdOrderCreateResponse {
  /** 三方支付签名信息字符串 */
  content: string;
}

/**
 * 微信支付签名结果。
 * 来自 third-order-create 的 `content` 字段，供 `uni.requestPayment` 使用。
 */
export interface XxtWechatPaySignedOrder {
  /** 微信应用 ID */
  appId: string;
  /** 微信商户号 */
  partnerId: string;
  /** 预支付订单号 */
  prepayId: string;
  /** 时间戳 */
  timeStamp: string;
  /** 随机串 */
  nonceStr: string;
  /** package 字段 */
  packageValue: string;
  /** 签名方式 */
  signType: string;
  /** 支付签名，有些后端口径返回为 paySign */
  paySign?: string;
  /** 支付签名，有些后端口径返回为 sign */
  sign?: string;
  /** 三方支付方式 */
  thirdPayType?: number;
}

/**
 * 微信小程序支付拉起参数。
 * 这里把 `uni.requestPayment` 真正消费的字段单独收口，便于其他业务复用。
 */
export interface XxtWechatMiniProgramPayParams {
  /** 支付提供方 */
  provider: 'wxpay';
  /** 时间戳 */
  timeStamp: string;
  /** 随机串 */
  nonceStr: string;
  /** package 字段 */
  package: string;
  /** 签名方式 */
  signType: string;
  /** 支付签名 */
  paySign: string;
  /** 订单信息 */
  orderInfo: {
    /** 微信应用 ID */
    appid: string;
    /** 微信商户号 */
    partnerid: string;
    /** 预支付订单号 */
    prepayid: string;
  };
}

/**
 * 公共微信支付完整流程入参。
 * 业务方只需要补充自己的订单参数和必要回调，其余流程由公共工具统一处理。
 */
export interface CreateXxtWechatPayFlowOptions {
  /** 创建 xxt 订单入参 */
  orderCreateParams: Omit<XxtOrderCreateRequestParams, 'hostId'> & {
    /** 客户端标识，不传时默认取当前项目配置 */
    hostId?: number;
  };
  /** 三方支付附加参数 */
  thirdOrderCreateParams?: Omit<XxtThirdOrderCreateRequestParams, 'orderId' | 'wxCode' | 'paidType'>;
  /** 支付成功提示文案 */
  successToastText?: string;
  /** 是否展示加载态 */
  showLoading?: boolean;
  /** 加载文案 */
  loadingText?: string;
  /** 支付前，xxt 订单创建成功回调 */
  onOrderCreated?: (orderInfo: XxtOrderCreateResponse) => void;
  /** 三方支付参数准备完成回调 */
  onThirdOrderCreated?: (
    thirdOrderInfo: XxtWechatPaySignedOrder,
    orderInfo: XxtOrderCreateResponse
  ) => void;
  /** 支付成功回调 */
  onPaySuccess?: (result: {
    orderInfo: XxtOrderCreateResponse;
    thirdOrderInfo: XxtWechatPaySignedOrder;
  }) => void;
  /** 支付失败回调 */
  onPayFail?: (error: unknown) => void;
}

/**
 * 公共微信支付完整流程结果。
 * 便于业务在支付完成后继续联动订单页、权益刷新等后续动作。
 */
export interface CreateXxtWechatPayFlowResult {
  /** xxt 订单信息 */
  orderInfo: XxtOrderCreateResponse;
  /** 微信支付签名信息 */
  thirdOrderInfo: XxtWechatPaySignedOrder;
}

/**
 * 创建 xxt 订单。
 * 接口 ID: 2968
 *
 * 由业务方透传产品、来源、渠道等参数，公共支付工具只负责统一请求和类型收口。
 *
 * @param data 请求参数
 * @returns Promise<XxtOrderCreateResponse> xxt 订单信息
 */
export function createXxtOrderApi(
  data: XxtOrderCreateRequestParams
): Promise<XxtOrderCreateResponse> {
  return ajax({
    url: '/order/center/thirdpay/order-create',
    method: 'POST',
    data,
    custom: {
      showLoading: false
    }
  });
}

/**
 * 创建微信/支付宝三方支付订单。
 * 接口 ID: 2969
 *
 * 当前公共支付流程主要消费微信小程序签名结果，其他支付方式后续可继续复用该方法。
 *
 * @param data 请求参数
 * @returns Promise<XxtThirdOrderCreateResponse> 三方支付签名结果
 */
export function createXxtThirdOrderApi(
  data: XxtThirdOrderCreateRequestParams
): Promise<XxtThirdOrderCreateResponse> {
  return ajax({
    url: '/order/center/thirdpay/third-order-create',
    method: 'POST',
    data,
    custom: {
      showLoading: false
    }
  });
}

/**
 * 获取微信登录 code。
 * 微信小程序支付在创建 third-order-create 时必须携带 `wxCode`。
 *
 * @returns Promise<string> 微信登录 code
 */
export function getWechatLoginCode() {
  return new Promise<string>((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success(res) {
        if (res?.code) {
          resolve(res.code);
          return;
        }

        reject(new Error('未获取到微信登录凭证'));
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

/**
 * 解析微信支付签名结果。
 * `third-order-create` 的返回值是字符串，这里统一转换成支付工具可消费的对象。
 *
 * @param response 三方支付接口返回值
 * @returns XxtWechatPaySignedOrder 微信支付签名信息
 */
export function parseWechatPaySignedOrder(
  response: XxtThirdOrderCreateResponse
): XxtWechatPaySignedOrder {
  const signedOrder = JSON.parse(response.content || '{}') as XxtWechatPaySignedOrder;
  return signedOrder;
}

/**
 * 组装微信小程序支付参数。
 * 兼容后端可能返回 `paySign` 或 `sign` 两种签名字段。
 *
 * @param signedOrder 微信支付签名结果
 * @returns XxtWechatMiniProgramPayParams 小程序支付参数
 */
export function buildWechatMiniProgramPayParams(
  signedOrder: XxtWechatPaySignedOrder
): XxtWechatMiniProgramPayParams {
  return {
    provider: 'wxpay',
    timeStamp: signedOrder.timeStamp,
    nonceStr: signedOrder.nonceStr,
    package: signedOrder.packageValue,
    signType: signedOrder.signType,
    paySign: signedOrder.paySign || signedOrder.sign || '',
    orderInfo: {
      appid: signedOrder.appId,
      partnerid: signedOrder.partnerId,
      prepayid: signedOrder.prepayId
    }
  };
}

/**
 * 拉起微信小程序支付。
 * `uni.requestPayment` 不经过统一请求层，因此支付成功和取消提示需要由这里统一承接。
 *
 * @param payParams 小程序支付参数
 * @param successToastText 支付成功提示文案
 * @returns Promise<void> 支付完成
 */
export function requestWechatMiniProgramPayment(
  payParams: XxtWechatMiniProgramPayParams,
  successToastText = '支付成功'
) {
  return new Promise<void>((resolve, reject) => {
    uni.requestPayment({
      ...payParams,
      success: () => {
        uni.showToast({
          title: successToastText,
          icon: 'none'
        });
        resolve();
      },
      fail: (error) => {
        const errMsg = String((error as { errMsg?: string })?.errMsg || '');

        if (errMsg.includes('cancel')) {
          uni.showToast({
            title: '已取消支付',
            icon: 'none'
          });
        } else {
          uni.showToast({
            title: '支付失败，请稍候重试',
            icon: 'none'
          });
        }

        reject(error);
      }
    });
  });
}

/**
 * 一键完成“创建 xxt 订单 -> 创建微信支付订单 -> 拉起微信支付”完整流程。
 * 当前默认走微信小程序支付，其他业务若只需要其中某个阶段，也可直接复用上面拆出的单方法。
 *
 * @param options 公共支付流程配置
 * @returns Promise<CreateXxtWechatPayFlowResult> 支付完成后的关键信息
 */
export async function createXxtWechatPayFlow(
  options: CreateXxtWechatPayFlowOptions
): Promise<CreateXxtWechatPayFlowResult> {
  const showLoading = options.showLoading !== false;
  const loadingText = options.loadingText || '加载中...';

  try {
    if (showLoading) {
      uni.showLoading({
        title: loadingText,
        mask: true
      });
    }

    const orderInfo = await createXxtOrderApi({
      ...options.orderCreateParams,
      hostId: Number(options.orderCreateParams.hostId || appModuleConfig.hostId)
    });

    options.onOrderCreated?.(orderInfo);

    if (!orderInfo.orderId) {
      throw new Error('未获取到有效订单号');
    }

    if (Number(orderInfo.payStatus) === 1) {
      uni.showToast({
        title: options.successToastText || '支付成功',
        icon: 'none'
      });

      const paidResult = {
        orderInfo,
        thirdOrderInfo: {} as XxtWechatPaySignedOrder
      };

      options.onPaySuccess?.(paidResult);
      return paidResult;
    }

    const wxCode = await getWechatLoginCode();
    const thirdOrderResponse = await createXxtThirdOrderApi({
      orderId: orderInfo.orderId,
      paidType: XxtThirdPaidTypeEnum.WxMiniProgram,
      wxCode,
      ...(options.thirdOrderCreateParams || {})
    });
    const thirdOrderInfo = parseWechatPaySignedOrder(thirdOrderResponse);

    options.onThirdOrderCreated?.(thirdOrderInfo, orderInfo);

    if (showLoading) {
      uni.hideLoading();
    }

    await requestWechatMiniProgramPayment(
      buildWechatMiniProgramPayParams(thirdOrderInfo),
      options.successToastText
    );

    const result = {
      orderInfo,
      thirdOrderInfo
    };

    options.onPaySuccess?.(result);
    return result;
  } catch (error) {
    options.onPayFail?.(error);
    throw error;
  } finally {
    if (showLoading) {
      uni.hideLoading();
    }
  }
}
