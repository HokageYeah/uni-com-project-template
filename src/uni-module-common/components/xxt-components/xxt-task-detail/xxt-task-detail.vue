<template>
  <view class="task-detail">
    <view class="task-header">
      <view class="div-color-green"></view>
      <view v-if="task?.taskName" class="task-name">
        {{ task.taskName }}
      </view>
      <tui-icon
        v-if="showMoreOpt || isCustomWork"
        name="more-fill"
        color="#222"
        :size="20"
        @click="clickMoreOpt"
      ></tui-icon>
    </view>
    <view class="mt-16 fs-24">
      <text v-if="!isTeacher" class="mr-50">{{ task.userName }}</text>
      <text v-if="task?.sendDate" color="#666">{{
        utils.formatTimeWithChinese(task?.sendDate)
      }}</text>
      <text v-if="task?.updateDate" color="#FF5436" class="ml-50">
        修改于{{ utils.parseTime(task.updateDate, '{m}月{d}日 {h}:{i}') }}
      </text>
    </view>
    <view v-if="task?.endDate" class="mt-16">
      <tui-tag type="light-danger" shape="circle" padding="8rpx 10rpx" size="24rpx">
        {{ task.taskStatus === 2 ? '已截止' : '截止时间' }}
      </tui-tag>
      <text class="ml-12 fs-24">{{ utils.formatTimeWithChinese(task.endDate) }}</text>
      <tui-form-button
        v-if="task.planInfo?.planId"
        background="#fff"
        color="#4ad975"
        border-color="#4ad975"
        radius="8rpx"
        width="166rpx"
        height="42rpx"
        size="24"
        plain
        style="float: right"
        @click="go2PlanDetail(task.planInfo?.planId, task.planInfo?.planType)"
      >
        查看计划详情
      </tui-form-button>
    </view>
    <view
      v-if="task?.taskContent"
      class="mt-24 task-content-wrap"
      @touchstart="handleTaskContentTouchStart"
      @touchmove="handleTaskContentTouchMove"
      @touchend="handleTaskContentTouchEnd"
      @touchcancel="handleTaskContentTouchEnd"
    >
      <xxt-text-overflow
        :text="task.taskContent"
        :show-hidden-btn="true"
        :default-hide="!props.isTeacher"
        :clamp="3"
      ></xxt-text-overflow>
    </view>
    <view v-if="task?.attachList?.length > 0" class="mt-24">
      <attachPreview :attach-list="task.attachList"></attachPreview>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import attachPreview from './attach-preview.vue';
import { copyText } from '@/uni-module-common/helper';
import utils from '@/uni-module-common/utils';
import { holidayPlanDeatilH5 } from '@/uni-module-common/utils/uniToAppH5Bridge';

const props = defineProps({
  // task 数据
  taskInfo: {
    type: Object,
    default: () => {}
  },
  isTeacher: {
    type: Boolean,
    require: true
  },
  showMoreOpt: {
    type: Boolean,
    default: false
  },
  isCustomWork: {
    type: Boolean,
    default: false
  },
  enableTaskContentCopy: {
    type: Boolean,
    default: false
  }
});
const emit = defineEmits(['clickMoreOpt']);

const task: any = ref({});
const taskContentPressTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const taskContentTouchStartPoint = ref({ x: 0, y: 0 });
const LONG_PRESS_DELAY = 600;
const MOVE_THRESHOLD = 10;

watch(
  () => props.taskInfo,
  (newV) => {
    task.value = newV;
  },
  { immediate: true }
);

const go2PlanDetail = (planId: Number, planType: Number) => {
  // 跳转到 h5 寒假作业计划详情页
  // holidayPlanDeatilH5(`&planId=${planId}`);

  if (planType === 1) {
    holidayPlanDeatilH5(`&planId=${planId}`);
  } else if (planType === 2) {
    uni.navigateTo({ url: `/pages/holiday-plan/holiday-plan-detail?pId=${planId}` });
  }
};
const clickMoreOpt = () => {
  emit('clickMoreOpt', {
    showMoreOpt: true,
    isCustomWork: props.isCustomWork
  });
};

const clearTaskContentPressTimer = () => {
  if (taskContentPressTimer.value) {
    clearTimeout(taskContentPressTimer.value);
    taskContentPressTimer.value = null;
  }
};

const getTouchPoint = (event: any) => {
  const touch = event?.touches?.[0] || event?.changedTouches?.[0];
  return {
    x: touch?.clientX ?? touch?.pageX ?? 0,
    y: touch?.clientY ?? touch?.pageY ?? 0
  };
};

const handleTaskContentTouchStart = (event: any) => {
  if (!props.enableTaskContentCopy || !task.value?.taskContent) {
    return;
  }

  clearTaskContentPressTimer();
  taskContentTouchStartPoint.value = getTouchPoint(event);
  taskContentPressTimer.value = setTimeout(() => {
    taskContentPressTimer.value = null;
    copyText(task.value?.taskContent);
  }, LONG_PRESS_DELAY);
};

const handleTaskContentTouchMove = (event: any) => {
  if (!taskContentPressTimer.value) {
    return;
  }

  const currentPoint = getTouchPoint(event);
  const movedX = Math.abs(currentPoint.x - taskContentTouchStartPoint.value.x);
  const movedY = Math.abs(currentPoint.y - taskContentTouchStartPoint.value.y);

  if (movedX > MOVE_THRESHOLD || movedY > MOVE_THRESHOLD) {
    clearTaskContentPressTimer();
  }
};

const handleTaskContentTouchEnd = () => {
  clearTaskContentPressTimer();
};

onBeforeUnmount(() => {
  clearTaskContentPressTimer();
});
</script>

<style scoped lang="scss">
$number: 24;
.task-detail {
  padding: 36rpx 32rpx;
  background-color: white;
}
.task-header {
  display: flex;
  align-items: center;
  width: 100%;
  .task-name {
    display: inline-block;
    width: 100%;
    margin-left: 16rpx;
    line-height: 150%;
    font-weight: bold;
    font-size: 36rpx;
  }
}
.div-color-green {
  display: inline-block;
  border-radius: 24rpx;
  width: 8rpx;
  height: 28rpx;
  background-color: #4ad975;
}
.mt-#{$number} {
  margin-top: #{$number}rpx;
}
.mr-#{$number} {
  margin-right: #{$number}rpx;
}
.ml-#{$number} {
  margin-left: #{$number}rpx;
}
.fs-#{$number} {
  font-size: #{$number}rpx;
}

.task-content-wrap {
  width: 100%;
}
</style>
