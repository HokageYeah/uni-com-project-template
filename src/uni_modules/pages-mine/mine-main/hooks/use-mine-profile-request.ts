import { computed, ref } from 'vue';
import { getCurrentUserInfoApi } from './mine-api';
import type { CurrentUserInfo } from './mine-api';

function pickDisplayText(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return fallback;
}

/**
 * 我的页 request<T>() 接入逻辑。
 * hook 只负责页面状态和安全日志，失败 toast 仍交给公共请求层统一处理，避免重复弹窗。
 */
export function useMineProfileRequest() {
  /** 用户信息请求是否正在执行，用于禁用按钮并展示“刷新中”状态。 */
  const loading = ref(false);
  /** request<T>() 归一化后的当前用户数据，仅用于页面摘要展示。 */
  const currentUser = ref<CurrentUserInfo | null>(null);
  /** 失败摘要只保留可展示文案，不保存完整 raw 响应。 */
  const errorText = ref('');

  const currentUserSummary = computed(() => {
    if (!currentUser.value) {
      return '尚未请求用户信息';
    }

    const nickname = pickDisplayText(currentUser.value.nickname, '未返回昵称');
    const id = pickDisplayText(currentUser.value.id, '未返回 ID');

    return `接口返回用户：${nickname}（ID：${id}）`;
  });

  const loadCurrentUserInfo = async () => {
    if (loading.value) {
      return;
    }

    loading.value = true;
    errorText.value = '';
    console.info('[我的页] 开始调用 request<T>() 受保护接口');

    try {
      const result = await getCurrentUserInfoApi();

      if (result.success) {
        currentUser.value = result.data || null;
        console.info('[我的页] request<T>() 接口调用成功');
        return;
      }

      currentUser.value = null;
      errorText.value = result.error || '用户信息请求失败';
      console.warn('[我的页] request<T>() 接口调用失败', {
        错误摘要: errorText.value
      });
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    currentUserSummary,
    errorText,
    loadCurrentUserInfo
  };
}
