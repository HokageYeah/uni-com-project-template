/**
 * 权限编码。
 * 脚手架层只认为它是字符串，不绑定具体业务系统的菜单、资源或接口编码规则。
 */
export type PermissionCode = string;

/**
 * 权限检查上下文。
 * 业务项目可以把当前页面、资源归属、用户身份等额外信息放到这里，
 * 脚手架层不解析这些字段，避免重新耦合到某个具体业务。
 */
export type PermissionContext = Record<string, unknown>;

/**
 * 单个权限编码的检查结果。
 */
export interface PermissionCheckItem {
  /** 被检查的权限编码 */
  code: PermissionCode;
  /** 当前用户是否拥有该权限 */
  allowed: boolean;
  /** 拒绝或放行原因，便于业务侧日志排查 */
  reason?: string;
  /** 业务侧可透传的原始结果，脚手架层不做结构假设 */
  raw?: unknown;
}

/**
 * 批量权限检查结果。
 */
export interface PermissionCheckResult {
  /** 是否全部权限都通过 */
  allAllowed: boolean;
  /** 每个权限编码对应的检查结果 */
  items: PermissionCheckItem[];
  /** 业务侧可透传的原始结果，便于兼容不同项目协议 */
  raw?: unknown;
}

/**
 * 业务项目注册的权限检查器入参。
 */
export interface PermissionCheckerPayload {
  /** 本次需要检查的权限编码列表 */
  resourceCodeList: PermissionCode[];
  /** 调用方传入的业务上下文 */
  context: PermissionContext;
}

/**
 * 业务项目注册的权限检查器。
 * 不同项目可以在启动阶段接入自己的权限接口，这里只约束返回结构。
 */
export type PermissionChecker = (
  payload: PermissionCheckerPayload
) => Promise<PermissionCheckResult> | PermissionCheckResult;

let permissionChecker: PermissionChecker | null = null;

const normalizeResourceCodeList = (resourceCodeList: PermissionCode[] = []) => {
  return resourceCodeList.filter((code) => typeof code === 'string' && code.trim().length > 0);
};

const createDeniedItems = (resourceCodeList: PermissionCode[], reason: string) => {
  return resourceCodeList.map((code) => ({
    code,
    allowed: false,
    reason
  }));
};

const createDeniedResult = (
  resourceCodeList: PermissionCode[],
  reason: string,
  raw?: unknown
): PermissionCheckResult => {
  return {
    allAllowed: false,
    items: createDeniedItems(resourceCodeList, reason),
    raw
  };
};

const isPermissionCheckResult = (result: unknown): result is PermissionCheckResult => {
  if (!result || typeof result !== 'object') {
    return false;
  }

  const permissionResult = result as PermissionCheckResult;
  return typeof permissionResult.allAllowed === 'boolean' && Array.isArray(permissionResult.items);
};

const normalizePermissionCheckResult = (
  result: unknown,
  resourceCodeList: PermissionCode[]
): PermissionCheckResult => {
  if (!isPermissionCheckResult(result)) {
    console.warn('[权限] 权限检查器返回结构无效，已按保守策略拒绝', result);
    return createDeniedResult(resourceCodeList, '权限检查器返回结构无效', result);
  }

  const normalizedItems = resourceCodeList.map((code) => {
    const matchedItem = result.items.find((item) => item?.code === code);

    if (!matchedItem || typeof matchedItem.allowed !== 'boolean') {
      return {
        code,
        allowed: false,
        reason: '权限检查器返回结果缺少当前权限编码'
      };
    }

    return {
      ...matchedItem,
      code,
      allowed: Boolean(matchedItem.allowed)
    };
  });

  const allAllowed = Boolean(result.allAllowed) && normalizedItems.every((item) => item.allowed);

  if (!allAllowed) {
    console.warn('[权限] 权限检查未全部通过，已返回标准化拒绝结果', {
      权限编码列表: resourceCodeList,
      检查结果: normalizedItems
    });
  }

  return {
    allAllowed,
    items: normalizedItems,
    raw: result.raw
  };
};

/**
 * 注册业务权限检查器。
 * 真实项目需要在应用初始化或业务模块初始化时调用它，把自己的权限接口接进来。
 */
export function setPermissionChecker(checker: PermissionChecker) {
  if (typeof checker !== 'function') {
    console.warn('[权限] 注册权限检查器失败，入参不是函数，已恢复默认拒绝策略');
    permissionChecker = null;
    return;
  }

  console.info('[权限] 注册业务权限检查器');
  permissionChecker = checker;
}

/**
 * 重置权限检查器。
 * 常用于测试、退出项目上下文或业务模块卸载后恢复脚手架默认保守策略。
 */
export function resetPermissionChecker() {
  console.info('[权限] 重置业务权限检查器，后续检查将默认拒绝');
  permissionChecker = null;
}

/**
 * 批量检查权限。
 * 默认未注册业务检查器时保守拒绝，避免脚手架被复用到新项目时留下默认放行的安全坑。
 */
export async function checkPermissions(
  resourceCodeList: PermissionCode[] = [],
  context: PermissionContext = {}
): Promise<PermissionCheckResult> {
  const normalizedResourceCodeList = normalizeResourceCodeList(resourceCodeList);

  if (normalizedResourceCodeList.length === 0) {
    console.info('[权限] 权限编码列表为空，直接返回不放行结果');
    return {
      allAllowed: false,
      items: []
    };
  }

  if (!permissionChecker) {
    const reason = '权限检查器未配置';
    console.warn('[权限] 权限检查器未配置，已按保守策略拒绝', {
      权限编码列表: normalizedResourceCodeList,
      上下文: context
    });

    return createDeniedResult(normalizedResourceCodeList, reason);
  }

  try {
    const result = await permissionChecker({
      resourceCodeList: normalizedResourceCodeList,
      context
    });
    const normalizedResult = normalizePermissionCheckResult(result, normalizedResourceCodeList);

    console.info('[权限] 业务权限检查完成', {
      权限编码列表: normalizedResourceCodeList,
      是否全部通过: normalizedResult.allAllowed
    });

    return normalizedResult;
  } catch (error) {
    const reason = '权限检查器执行失败';
    console.warn('[权限] 权限检查器执行失败，已按保守策略拒绝', error);

    return createDeniedResult(normalizedResourceCodeList, reason, error);
  }
}

/**
 * 检查单个权限编码。
 */
export async function checkPermission(
  resourceCode: PermissionCode,
  context: PermissionContext = {}
): Promise<boolean> {
  const result = await checkPermissions([resourceCode], context);
  return Boolean(result.items[0]?.allowed && result.allAllowed);
}

/**
 * 兼容旧导出名：检查一组页面元素权限。
 * 当前不再内置任何旧业务接口，只委托给业务项目注册的权限检查器。
 */
export async function useElPermission(resourceCodeList: PermissionCode[]) {
  const result = await checkPermissions(resourceCodeList);
  return result.allAllowed;
}

/**
 * 兼容旧导出名：检查一组业务资源权限。
 * 返回通用权限结果，调用方可按 items / allAllowed 判断具体表现。
 */
export async function useParentResourcePermission(resourceCodeList: PermissionCode[]) {
  return checkPermissions(resourceCodeList);
}

/**
 * 兼容旧导出名：检查分享类单权限。
 * 这里只取第一个权限编码，保持旧调用形态不崩。
 */
export async function useClockShare(resourceCodeList: PermissionCode[]) {
  return checkPermission(resourceCodeList[0] || '');
}
