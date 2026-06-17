import ajax from '@/uni-module-common/http';
import eventBus from '@/uni-module-common/utils/eventBus';

const gotoPay = ref('/book-reading/family-order/save-package-order'); // 下单接口地址，拉起微信支付

// 获取微信支付状态接口
const orderPayStatusUrl = ref('/book-reading/family-order/get-package-order-pay-status');

export const setPayUrl = (url: string) => {
  gotoPay.value = url;
};

export const setPayStatusUrl = async (url: string) => {
  orderPayStatusUrl.value = url;
};

/**
 * 获取订单支付状态
 * @param orderCode 订单编码
 * @return number 订单支付状态
 */
const getPackageOrderPayStatus = async (orderCode: string) => {
  const res: any = await ajax({
    url: orderPayStatusUrl.value,
    method: 'POST',
    data: {
      orderCode
    }
  });
  // payStatus 支付状态 -1订单不存在，0 待支付订单 1 已支付订单 2 支付失败，4用户取消支付
  // return res?.payStatus || -2;
  return res;
};

// #ifdef MP-WEIXIN

const _wxpaySuccessFunc = async (res: any) => {
  console.log('wxpaySuccessFunc');
  // 微信支付成功回调
  let orderPayInfo: any = await getPackageOrderPayStatus(res.orderCode);
  console.log('wxpaySuccessFunc--orderPayInfo--', orderPayInfo);
  if (orderPayInfo.payStatus === 1) {
    uni.showToast({
      icon: 'none',
      title: '支付成功'
    });
    eventBus.emit('payResult', {
      orderCode: res.orderCode,
      result: orderPayInfo,
      payStatus: 'success'
    });
    return;
  }
  // 如果orderPayStatus 为0 待支付订单， 则10秒后重新请求支付状态，最多请求6次，也就是1分钟
  if (orderPayInfo.payStatus === 0) {
    for (let i = 0; i < 6; i++) {
      uni.showLoading({
        title: '订单确认中...',
        mask: true
      });
      await new Promise((resolve) => setTimeout(resolve, 10000));
      orderPayInfo = await getPackageOrderPayStatus(res.orderCode);
      uni.hideLoading();
      if (orderPayInfo.payStatus === 1) {
        // 支付成功
        uni.showToast({
          icon: 'none',
          title: '支付成功'
        });
        eventBus.emit('payResult', {
          orderCode: res.orderCode,
          result: orderPayInfo,
          payStatus: 'success'
        });
        return;
      } else if (orderPayInfo.payStatus !== 0) {
        // 支付失败或其他状态
        break;
      }
    }
  }
  uni.hideLoading();
  // 最终支付失败
  eventBus.emit('payResult', {
    payStatus: 'failed'
  });
};

/**
 * 微信小程序拉起支付
 * @param payInfo  gotoPay 接口的传参
 * @return {Promise<void>}
 */
async function wechatPay(payInfo: any) {
  try {
    console.log('wechatPay--payInfo--', gotoPay.value, payInfo);
    console.log('wechatPay---', orderPayStatusUrl.value);

    const res: any = await ajax({
      url: gotoPay.value,
      method: 'POST',
      data: payInfo
    });
    console.log('wechatPay--res--', res);
    // return;
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: res.timeStamp, // 时间戳（单位：秒）
      nonceStr: res.nonceStr, // 随机字符串
      package: res.packageValue, // 固定值
      signType: res.signType, // 签名算法
      paySign: res.paySign, // 签名，这里用的 MD5/RSA 签名
      orderInfo: {
        appid: res.appId, // 微信开放平台 - 应用 - AppId，注意和微信小程序、公众号 AppId 可能不一致
        partnerid: res.partnerId, // 微信支付商户号
        prepayid: res.prepayId // 统一下单订单号
      },
      success: async () => {
        // 微信支付成功回调
        _wxpaySuccessFunc(res);
        // const orderPayStatus = await getPackageOrderPayStatus(res.orderCode);
        // if (orderPayStatus === 1) {
        //   uni.showToast({
        //     icon: 'none',
        //     title: '支付成功'
        //   });
        //   eventBus.emit('payResult', {
        //     orderCode: res.orderCode,
        //     result: res,
        //     payStatus: 'success'
        //   });
        // } else {
        //   eventBus.emit('payResult', {
        //     payStatus: 'failed'
        //   });
        // }
      },
      fail: (err) => {
        console.log('pay fail', err);

        uni.showToast({
          icon: 'none',
          title: '取消支付'
        });
        eventBus.emit('payResultStatus', 'failed');
      }
    });
  } catch (e) {
    console.log('wechatPay--err--', e);
    uni.showToast({
      title: '微信支付失败，请稍候重试',
      icon: 'none'
    });
    eventBus.emit('payResultStatus', 'failed');
  }
}
// #endif

/**
 * 处理支付
 * @param submitResult 结算结果
 */
export async function handleDoPay(submitResult: any) {
  // 微信支付
  // #ifdef MP-WEIXIN
  await wechatPay(submitResult);
  // #endif
}
