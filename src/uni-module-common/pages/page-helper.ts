export interface PageUserProfile {
  id?: string | number;
  nickname?: string;
  avatar?: string;
  mobile?: string;
}

export interface ProfileRow {
  label: string;
  value: string;
}

export const HOME_DESCRIPTION = '当前页面是首页，未登录时展示统一占位，登录后展示内容区域。';

export const DIARY_DESCRIPTION =
  '当前页面是中间 Tab 页面，它默认可直接访问，用于承接后续业务页面扩展。';

export const MINE_VISITOR_TITLE = '当前处于游客模式';

/**
 * 统一生成“我的”页最小用户信息展示项。
 * 页面层只负责渲染，不再散落处理字段兼容和空值兜底。
 */
export const buildMineProfileRows = (userInfo: PageUserProfile): ProfileRow[] => {
  return [
    {
      label: '用户 ID',
      value: `${userInfo.id ?? ''}` || '-'
    },
    {
      label: '昵称',
      value: userInfo.nickname || '-'
    },
    {
      label: '头像',
      value: userInfo.avatar || '-'
    },
    {
      label: '手机号',
      value: userInfo.mobile || '-'
    }
  ];
};
