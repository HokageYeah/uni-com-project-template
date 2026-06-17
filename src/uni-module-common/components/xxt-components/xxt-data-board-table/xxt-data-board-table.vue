<template>
  <view class="data-table">
    <table cellpadding="0" cellspacing="0" class="table header-box">
      <tr
        v-if="header.length > 0"
        class="table-tr"
        style="background-color: rgba(74, 217, 117, 0.15)"
      >
        <td
          v-for="item in header"
          :key="item.key"
          bold
          class="table-td header-td"
          style="font-weight: bold; color: #222"
          :style="{ width: `${100 / header.length}%` }"
        >
          <view class="table-td-view">{{ item.title }}</view>
        </td>
      </tr>
    </table>
    <view class="import-table">
      <scroll-view scroll-y style="max-height: 600rpx" @scrolltolower="onScrollToLower">
        <table cellpadding="0" cellspacing="0" class="table">
          <tr
            v-for="(row, index) in tableData"
            :key="index"
            margin-top="8rpx"
            background-color="#fff"
            class="table-tr"
            style="margin-top: 16rpx"
            :style="{
              backgroundColor: row.isMe ? '#FFF4D9' : index % 2 === 1 ? '#FAFAFC' : '#fff'
            }"
          >
            <td
              v-for="(headItem, idx) in header"
              :key="`headItem-${idx}`"
              class="table-td data-td"
              :style="{
                width: `${100 / header.length}%`
                // color: row.isMe ? '#4ad975' : '#222'
              }"
            >
              <view class="table-td-view">
                <!-- 操作按钮列 -->
                <view
                  v-if="
                    headItem.type === 'buttons' && row[headItem.key] && row[headItem.key].length > 0
                  "
                  class="button-group"
                >
                  <text
                    v-for="(button, btnIdx) in row[headItem.key]"
                    :key="btnIdx"
                    class="action-btn"
                    :class="`btn-${button.type}`"
                    @click="handleButtonClick(button.action, row, index)"
                  >
                    {{ button.text }}
                  </text>
                </view>
                <!-- 普通数据列 排除[]数据 -->
                <text v-else-if="!Array.isArray(row[headItem.key])">{{ row[headItem.key] }}</text>
              </view>
            </td>
          </tr>
        </table>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { DataTableColumn, DataTableData } from './data-table';
const props = defineProps<{
  header: DataTableColumn[];
  tableData: DataTableData[];
}>();
const emit = defineEmits<{
  (e: 'buttonClick', action: string, row: DataTableData, index: number): void;
  (e: 'scrollToLower', event: any): void;
}>();
const { header, tableData } = toRefs(props);
const handleButtonClick = (action: string, row: DataTableData, index: number) => {
  emit('buttonClick', action, row, index);
};
const onScrollToLower = (e: any) => {
  emit('scrollToLower', e);
};
</script>

<style scoped lang="scss">
.data-table {
  position: relative;
  border: 0.5px solid #dddddd;
}
.import-table {
  display: block;
  overflow: auto;
  width: 100%;
  /* #ifndef APP-NVUE */
  max-height: 400px;
  /* #endif */
}
.table {
  display: table;
  position: relative;
  box-sizing: border-box;
  border-radius: 5px;
  width: 100%;
  table-layout: fixed; /* 固定表格布局，确保列宽平均分配 */
  /* #ifndef APP-NVUE */
  max-height: 450px;
  background-color: #fff;
  /* #endif */
}
.table-tr {
  /* #ifndef APP-NVUE */
  display: table-row;
  position: relative;
  box-sizing: border-box;
  /* #endif */
  min-height: 50px; /* 最小高度，支持自适应 */
  transition: all 0.3s;
}
.table-td {
  display: table-cell;
  box-sizing: border-box;
  border-right: 0.5px solid #dddddd;
  border-bottom: 0.5px solid #dddddd;
  vertical-align: middle; /* 垂直居中 */
  &:last-child {
    border-right: none;
  }
  font-weight: 400;
  font-size: 14px;
  color: #606266;
  /* 边框 */
  &-view {
    padding: 8px 6px;
    width: 100%;
    min-height: 34px; /* 最小高度确保内容不会太挤 */
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    word-wrap: break-word;
    word-break: break-all; /* 强制换行，避免单词过长撑破布局 */
    white-space: normal; /* 允许换行 */
    line-height: 1.4; /* 适当的行高，让多行文字更好看 */
  }
}
.button-group {
  display: flex;
  gap: 4px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  /* 确保按钮组在新的布局下正常显示 */
}
.action-btn {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: white;
  text-align: center;
  min-width: 40px;
  flex-shrink: 0; /* 防止按钮被压缩 */
  white-space: nowrap; /* 按钮文字不换行 */

  &.btn-primary {
    background-color: #007aff;
  }

  &.btn-warning {
    background-color: #ff9500;
  }

  &.btn-danger {
    background-color: #ff3b30;
  }

  &.btn-success {
    background-color: #4ad975;
  }

  &:active {
    opacity: 0.7;
  }
}

/* 表头特殊样式 */
.header-td {
  .table-td-view {
    font-weight: bold;
    min-height: 40px; /* 表头高度可以稍微小一点 */
  }
}

/* 数据行继承基础样式，无需额外定义 */
</style>
