<template>
  <view class="home-book-recommended">
    <!-- <view class="model-header">
      <image
        :src="`${$cdn}/nb/m/uni-zhyd/img/class_study_title_guidance.png`"
        mode="aspectFill"
        class="model-header-left-image"
      />
      <view class="model-header-left-title">{{ title }}</view>
      <view class="model-header-right" @click="handleClickAll">
        <tui-text size="28" color="#999999" text="查看全部" font-weight="400" />
        <tui-icon name="arrowright" color="#999999" size="16"></tui-icon>
      </view>
    </view> -->
    <xxt-common-title :title="title" :is-show-mark="isShowMark" :title-font-size="titleFontSize">
      <template #right>
        <view class="more-book-recommend" @click="handleClickAll">
          <text class="more-book-recommend-desc">查看全部</text>
          <tui-icon name="arrowright" color="#999999" size="16"></tui-icon>
        </view>
      </template>
    </xxt-common-title>
    <view class="book-recommended-content">
      <xxt-swiper :swiper-list="swiperList" :height="300">
        <template #content="{ item }">
          <view class="book-recommended-content-item" @click="handleClickItem(item)">
            <view class="book-recommended-content-item-title"> {{ item.booklistName }} </view>
            <view class="book-recommended-content-item-title book-recommended-content-item-desc">
              {{ item.booklistDesc }}
            </view>
            <tui-lazyload-img
              width="100%"
              height="390rpx"
              :src="item.booklistCover || ''"
              mode="scaleToFill"
              radius="24rpx"
              style="flex-shrink: 0"
            ></tui-lazyload-img>
          </view>
        </template>
      </xxt-swiper>
    </view>
  </view>
</template>

<script setup lang="ts">
import ajax from '@/uni-module-common/http';
const props = withDefaults(
  defineProps<{
    title: string;
    isShowMark?: boolean;
    titleFontSize?: number;
  }>(),
  {
    title: '',
    isShowMark: true,
    titleFontSize: 18
  }
);
/**
 * 获取书单卡片列表
 */
function getBooklistList(data: any) {
  return ajax({
    url: '/book-reading/family-library/get-booklist-list',
    method: 'POST',
    data,
    custom: {
      showLoading: false
    }
  });
}
const swiperList = ref([]);
const router = useRouter();
const handleClickItem = (item: any) => {
  console.log('item----info-----', item);
  router.push({
    path: '/pages/2025-activity/summer/recommendation-books/recommenda-book-tabs-list',
    query: {
      booklistId: item.booklistId
    }
  });
};
const handleClickAll = (e: any) => {
  console.log('e----info-----', e);
  console.log('handleClickAll----info-----');
  router.push({
    path: '/pages/2025-activity/summer/recommendation-books/recommenda-book-tabs-list'
  });
};
onMounted(async () => {
  const res: any = await getBooklistList({ booklistType: 5 });
  console.log('res----info-----', res);
  swiperList.value = res;
});
</script>

<style scoped lang="scss">
.home-book-recommended {
  margin-top: 24px;
  background-color: #f9f9f9;
}
/* 模型头部 */
/* .model-header {
  @include normalFlex(row, flex-start, center);
  .model-header-left-image {
    width: 8px;
    height: 16px;
  }
  .model-header-left-title {
    flex: 1;
    margin-left: 8px;
    font-weight: bold;
    font-size: 18px;
    color: #222;
  }
  .model-header-right {
    @include normalFlex(row, flex-end, center);
    width: 80px;
  }
} */

.more-book-recommend {
  @include normalFlex(row, flex-end, center);
  .more-book-recommend-desc {
    font-size: 14px;
    color: #999999;
  }
}
/* 模型头部 */

.book-recommended-content {
  overflow: hidden;
  margin-top: 20px;
  border-radius: 16px;
  height: 300px;
  background-color: #fff;
}
.book-recommended-content-item {
  box-sizing: border-box;
  width: 100%;
  height: 258px;
  /* background-color: red; */
  padding: 16px 16px 0;
}
.book-recommended-content-item-title {
  /* 只显示一行，多行文本省略号 */
  overflow: hidden;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  display: -webkit-box;
  font-weight: bold;
  font-size: 16px;
  color: #222222;
  margin-bottom: 8px;
}
.book-recommended-content-item-desc {
  font-weight: 400;
  font-size: 14px;
  color: #999999;
}
</style>
