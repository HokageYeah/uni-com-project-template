/**
 * HTTP 请求方法枚举。
 * 公共请求层只保留当前实际使用的方法，避免恢复暂未使用的旧状态码枚举。
 */
export enum RequestEnum {
  GET = 'GET',
  POST = 'POST'
}

/**
 * 常用请求内容类型枚举。
 * 调用方如需特殊 Content-Type，应在具体请求中显式覆盖 header。
 */
export enum ContentTypeEnum {
  JSON = 'application/json;charset=UTF-8',
  TEXT = 'text/plain;charset=UTF-8',
  FORM_URLENCODED = 'application/x-www-form-urlencoded;charset=UTF-8',
  FORM_DATA = 'multipart/form-data;charset=UTF-8'
}
