import utils from '../utils';
import { clickUrlPrefix } from '../config/index';
import { formatTokenObj, setCookie } from './caches';
import ajax from '@/uni-module-common/http';
import bridge from '@/uni-module-common/utils/uniToNativeBridge';
import { uniToNatAccessLog, uniToNatClickLog } from '@/uni-module-common/utils/uniToNavProtocol';
import { variableTypeDetection } from '@/uni-module-common/utils/verifyType';

const token = uni.getStorageSync('token');

const IS_DEV = ['dev', 'development'].includes(process.env.NODE_ENV as string);

// 静态资源发布目录
// const publicPath = defaultSettings.publicPath;
// const publicPath4Concat = publicPath.replace(/\/$/, '');
// // console.log(`publicPath: ${publicPath}, publicPath4Concat: ${publicPath4Concat}`);

// 内部方法
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
function log(url: string) {
  try {
    // 先去除点击日志请求
    ajax({
      url,
      method: 'GET',
      custom: {
        showError: false,
        isCancelHideToast: true,
        isCancelHideLoading: true
      }
    });
  } catch (e) {
    // do nothing
  }
}

const cookieName = 'xxtSessionId';
const randomChars = '0123456789abcdefghijklmnopqrstuvwxyx';
const randomCharsLen = randomChars.length;

function createCookieIfNessary() {
  if (formatTokenObj(token)[cookieName]) {
    return;
  }

  // 生成随机串（长度 40）
  let cookieValue = `${new Date().getTime()}.${Math.random()}`;
  const len = cookieValue.length;
  for (let i = len; i < 40; i += 1) {
    cookieValue += randomChars.charAt(Math.ceil(Math.random() * randomCharsLen));
  }

  // cookie 有效期 3650 天（10 年）
  const cookieSetting = { expires: 3650, path: '/', domain: '' };
  // #ifdef H5
  const hostname = window.location.hostname;
  if (hostname?.indexOf('.') > 0 && !/^\d+\.\d+.\d+.\d+$/.test(hostname)) {
    // 包含 . （英文句号）且非 ip 时，可认为是正常域名，获取顶级域名
    cookieSetting.domain = hostname?.split('.').slice(-2).join('.');
  }
  // #endif
  setCookie(cookieName, cookieValue, cookieSetting.expires, cookieSetting.path);
}

function checkViewParams(url: string, referer: any) {
  let valid = true;
  // 仅开发环境校验
  if (!IS_DEV) {
    return true;
  }
  if (typeof url !== 'string') {
    valid = false;
    utils.toast({
      title: `程序猿/媛请注意！ log.view 方法入参 url: ${url} 格式错误，必须是字符串！`
    });
  } else if (url.length === 0) {
    valid = false;
    utils.toast({
      title: `程序猿/媛请注意！ log.view 方法入参 url: ${url} 长度为 0，这能记上啥？`
    });
  }

  if (referer) {
    // referer 有值时再校验
    if (typeof referer !== 'string') {
      valid = false;
      utils.toast({
        title: `程序猿/媛请注意！ log.view 方法入参 referer: ${referer} 格式错误，必须是字符串！`
      });
    }
  }

  return valid;
}

function checkEventParams(eventType: any, _source: any, _content: any) {
  let valid = true;
  // 仅开发环境校验
  if (!IS_DEV) {
    return true;
  }
  if (typeof eventType !== 'string') {
    valid = false;
    utils.toast({
      title: `程序猿/媛请注意！ log.event 方法入参 eventType: ${eventType} 格式错误，必须是字符串！`
    });
  } else if (eventType.length === 0) {
    valid = false;
    utils.toast({
      title: `程序猿/媛请注意！ log.view 方法入参 eventType: ${eventType} 长度为 0，这能记上啥？`
    });
  }

  if (_source) {
    if (typeof _source !== 'string') {
      valid = false;
      utils.toast({
        title: `程序猿/媛请注意！ log.event 方法入参 _source: ${_source} 格式错误，必须是字符串！`
      });
    }
  }

  if (_content) {
    if (typeof _content !== 'object' || Array.isArray(_content)) {
      // 数组使用 typeof 求值也是 object，因此需要排查
      valid = false;
      utils.toast({
        title: `程序猿/媛请注意！ log.event 方法入参 _content: ${_content} 格式错误，必须是 json 对象！`
      });
    }

    // 检查 _content 子属性，不能是 json 对象或数组

    for (const key in _content) {
      const value = _content[key];
      if (value != null && typeof value === 'object') {
        // 值为 null、undefined 时会在后续逻辑中移除，此处可放行
        valid = false;
        utils.toast({
          title: `程序猿/媛请注意！ log.event 方法入参 _content: ${_content} 格式错误，存在嵌套属性 ${key}！`
        });
      }
    }
  }

  return valid;
}

/**
 * 发送浏览日志
 * @param {String} url 请求页面
 * @param {String} referer 来源页面
 */
function view(url: string, referer: any) {
  // 参数校验
  if (IS_DEV && !checkViewParams(url, referer)) {
    return;
  }

  // // 生成 Cookie xxtSessionId
  createCookieIfNessary();
  console.log('发送浏览日志----view----', url, referer);
  // 如果是app端走桥接
  // #ifdef APP-PLUS || APP
  bridge.sendNativeEvent(uniToNatAccessLog, {
    aurl: url,
    ref: referer
  });
  // #endif

  // #ifndef APP-PLUS || APP
  const { windowWidth, windowHeight } = uni.getSystemInfoSync();
  const logUrl = `${clickUrlPrefix}/click/statrecord.do?cr.url=${encodeURIComponent(
    url
  )}&cr.referURL=${encodeURIComponent(referer)}&cr.webId=${
    formatTokenObj(token).XXT_ID || 0
  }&cr.windowWidth=${windowWidth}&cr.windowHeight=${windowHeight}&cr.charset=UTF-8`;

  log(logUrl);
  // #endif
}

/**
 * 发送事件日志
 * @param {String} eventType 事件类型标识
 * @param {String} _source   事件来源区域标识 【注】可选参数
 * @param {Object} _content  事件内容        【注】可选参数
 */
function event(eventType: any, _source?: any, _content?: any) {
  // 参数校验
  console.log('发送事件日志----checkEventParams----', IS_DEV, eventType, _source, _content);
  if (IS_DEV && !checkEventParams(eventType, _source, _content)) {
    return;
  }

  // 生成 Cookie xxtSessionId
  createCookieIfNessary();

  // 移除 _content 值为 null 或 undefined，以及嵌套（含数组）的子属性
  if (_content) {
    for (const key in _content) {
      const value = _content[key];
      if (value == null || typeof value === 'object') {
        delete _content[key];
      }
    }
  }
  const pages = getCurrentPages();
  if (variableTypeDetection.isArray(pages) && pages.length > 0) {
    const page: any = pages[pages.length - 1];
    let routeUrl = '';
    if (variableTypeDetection.isObject(page) && variableTypeDetection.isObject(page?.$page)) {
      routeUrl = page?.$page?.fullPath || '';
    }

    // todo 需要把_content内容中的#号去掉，否则在拼接请求url的时候#号会被当成冒点，后面的会被截取掉
    // console.log('发送事件日志----event----', eventType, _source, _content, page?.route, routeUrl);
    // console.log('发送事件日志----eventstring1----', JSON.stringify(_content));
    // console.log('发送事件日志----eventstring2----', encodeURI(JSON.stringify(_content)));
    // console.log(
    //   '发送事件日志----eventstring3----',

    //   encodeURI(encodeURI(JSON.stringify(_content)))
    // );
    // 如果是app端走桥接
    // #ifdef APP-PLUS || APP
    bridge.sendNativeEvent(uniToNatClickLog, {
      cn: eventType,
      src: _source || '',
      aurl: page?.route || '',
      co: _content ? JSON.stringify(_content) : ''
    });
    // #endif

    // #ifndef APP-PLUS || APP
    const logUrl =
      `${clickUrlPrefix}/click/eventlog.do` +
      `?eventLog.eventType=${encodeURI(encodeURI(eventType))}&eventLog.webId=${
        formatTokenObj(token).XXT_ID || 0
      }&eventLog.currentURL=${encodeURIComponent(routeUrl)}&eventLog.source=${
        _source ? encodeURI(encodeURI(_source)) : ''
      }&eventLog.content=${_content ? encodeURI(encodeURI(JSON.stringify(_content))) : ''}`;

    log(logUrl);
    // #endif
  }
}

/**
 * 通用日志上传函数，支持错误日志、操作日志、埋点等，并提供更丰富的上下文
 * @param {String} eventType 事件类型标识
 * @param {String} source 事件来源区域/组件标识
 * @param {Object} mainData 主要数据对象，可以是错误对象或其他需要记录的数据
 * @param {Object} extraData 额外数据，扩展信息
 */
function eventContextLog(
  eventType: string,
  source: string,
  mainData: any = {},
  extraData: Record<string, any> = {}
) {
  try {
    // 构建基础日志数据
    const logData: Record<string, any> = {
      ...extraData,
      source // 统一记录来源，方便后续分析
    };

    // 如果主数据是错误对象，提取错误信息
    if (mainData instanceof Error || (mainData && (mainData.message || mainData.errMsg))) {
      const errorMsg = mainData.errMsg || mainData.message || mainData.toString?.() || '未知错误';
      const errorCode = mainData.errCode || mainData.code || '';

      logData.errorMsg = errorMsg;
      if (errorCode) {
        logData.errorCode = errorCode;
      }
    }
    // 否则直接合并主数据到日志数据中
    else if (typeof mainData === 'object') {
      // 避免嵌套对象导致日志失败
      Object.keys(mainData).forEach((key) => {
        const value = mainData[key];
        // 只保留基本类型，避免复杂对象
        if (value !== null && typeof value !== 'object') {
          logData[key] = value;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // 对于对象，尝试转成字符串
          try {
            logData[key] = JSON.stringify(value);
          } catch (e) {
            logData[key] = '[复杂对象]';
          }
        }
      });
    }
    // 如果是基本类型，则作为value记录
    else if (mainData !== undefined) {
      logData.value = String(mainData);
    }

    // 记录调用栈以便定位问题
    try {
      const err = new Error('获取调用栈');
      if (err.stack) {
        const stackLines = err.stack.split('\n');
        // 尝试获取调用者的位置（通常是第3行）
        if (stackLines.length > 2) {
          logData.stackTrace = stackLines[2]?.trim() || '';
        }
      }
    } catch (e) {
      // 忽略获取调用栈错误
    }

    // 记录时间戳
    logData.timestamp = Date.now();

    // 调用基础日志函数
    event(eventType, source, logData);

    return true;
  } catch (logErr) {
    console.error(`记录日志失败 - ${eventType}:`, logErr);

    // 尝试发送元日志（记录日志失败的日志）
    try {
      event('日志记录失败', 'logWithContext', {
        failedEventType: eventType,
        errorSource: source
      });
    } catch (e) {
      console.error('元日志记录也失败了:', e);
    }

    return false;
  }
}

export default {
  view,
  event,
  eventContextLog
};
