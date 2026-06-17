/**
 * @description: 分辨率模式
 */
export enum ResolutionModeEnum {
  RESOLUTION_360P = 0,
  RESOLUTION_480P = 1,
  RESOLUTION_540P = 2,
  RESOLUTION_720P = 3
}

/**
 * @description: 视频质量
 */
export enum VideoQualityEnum {
  SSD = 0, // 超高清
  HD = 1, // 高清
  SD = 2, // 标清
  LD = 3, // 低清
  PD = 4, // 较差清
  EPD = 5 // 极差清
}
