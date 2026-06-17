<template>
  <xxt-unlogin v-if="!isLogin" :login-url="props.loginUrl" :url="props.loginUrl"></xxt-unlogin>
  <view v-else :class="props.classStyleName">
    <slot></slot>
    <slot name="contentData" :data="slotPayload"></slot>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    loginUrl: string;
    isShowAddClass?: boolean;
    stuAddClassH5Url?: string;
    classStyleName?: string;
  }>(),
  {
    loginUrl: '',
    isShowAddClass: false,
    stuAddClassH5Url: '',
    classStyleName: 'container'
  }
);

const { isLogin } = useStore('user');

/**
 * `xxt-common-unlogin` 是模板统一的页面级登录拦截容器。
 * 模板版本只负责两件事：
 * - 已登录时渲染页面内容
 * - 未登录时渲染 `xxt-unlogin`
 *
 * 旧工程中的加班级判断、原生桥接登录、身份分流等逻辑不再内置，
 * 后续若业务项目仍有此类需求，应在业务层自行扩展。
 */
const slotPayload = {
  isTeacher: false,
  isStudent: false
};
</script>

<style scoped lang="scss">
.container {
  @include normalContainer();
}
</style>
