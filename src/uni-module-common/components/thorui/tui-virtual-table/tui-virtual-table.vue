<template>
	<view class="tui-virtual__table" :style="{background:background}">
		<scroll-view enhanced :bounces="bounces" :show-scrollbar="showScrollbar" :scroll-x="scrollx"
			:scroll-left="scrollLeft" class="tui-virtual__scroll-view" v-if="outsideHeader">
			<view class="tui-virtual__table-tr" :class="{'tui-vir__tr-center':cellHeight>0}">
				<view class="tui-table--td"
					:class="{'tui-vir__td-full':full,'tui-table__border-top':horBorder,'tui-table__border-bottom':horBorder,'tui-table__border-right':border,'tui-table__border-left':border && index===0,'tui-table__center': (item.align || align)==='center','tui-table__right':(item.align || align)==='right','tui-table--col-fixed':item.fixed}"
					:style="{borderTopColor:horBorder?borderColor:'transparent',borderBottomColor:horBorder?borderColor:'transparent',height:cellHeight==0?'auto':cellHeight+'px',borderRightColor:border?borderColor:'transparent',borderLeftColor:border && index===0?borderColor:'transparent',background:item.background || headerBgColor,width:item.width+'px',paddingTop:cellHeight==0?padding+'rpx':'0',paddingBottom:cellHeight==0?padding+'rpx':'0',left:item.fixed && item.fixed!=='right'?item.left+'px':'auto',right:item.fixed==='right'?item.right+'px':'auto'}"
					v-for="(item,index) in hData" :key="index" @tap.stop="tableSort(index,false)">
					<view class="tui-table__checkbox"
						:style="{background:chkAll?checkboxColor:'transparent',borderColor:chkAll ?checkboxColor:checkboxBorderColor}"
						v-if="item.type==='selection'" @tap.stop="selectionAll">
						<view class="tui-table__checkmark"
							:style="{borderBottomColor:checkmarkColor,borderRightColor:checkmarkColor}"></view>
					</view>
					<text v-else class="tui-table--td-text"
						:class="{'tui-text__center':(item.align || align)==='center','tui-text__right':(item.align || align)==='right','tui-td__ellipsis':ellipsis}"
						:style="{width:item.width+'px',color:item.color || color,fontSize:(item.size || size)+'rpx',fontWeight:fontWeight}">{{item.label || item.prop}}</text>
					<view class="tui-table__sort-icon" :style="{right:(item.sortRight || 40)+'rpx'}"
						v-if="item.sortable">
						<tui-icon :name="item.sort==='descending'?'turningdown':'turningup'" :size="item.sortSize || 28"
							unit="rpx" :color="item.sort?(item.sortColor || '#333'):(item.color || color)"></tui-icon>
					</view>
					<view class="tui-table__td-sk" :style="{backgroundColor:borderColor}"
						v-if="border && item.fixed==='right'"></view>
				</view>
			</view>
		</scroll-view>
		<scroll-view enhanced :bounces="bounces" :show-scrollbar="showScrollbar" :scroll-x="true" :style="getStyle"
			class="tui-virtual__scroll-view" :scroll-y="!enablePageScroll" :upper-threshold="upperThreshold"
			:lower-threshold="lowerThreshold" :scroll-top="innerScrollOffset" :enable-back-to-top="enableBackToTop"
			@scroll="scrollHandler" @scrolltoupper="onScrollToUpper" @scrolltolower="onScrollToLower">
			<view class="tui-vir__tr-box" :style="styles">
				<view class="tui-virtual__table-tr"
					:class="{'tui-table--header-fixed':fixed,'tui-vir__tr-center':cellHeight>0}" v-if="!outsideHeader">
					<view class="tui-table--td"
						:class="{'tui-vir__td-full':full,'tui-table__border-top':horBorder,'tui-table__border-bottom':horBorder,'tui-table__border-right':border,'tui-table__border-left':border && index===0,'tui-table__center': (item.align || align)==='center','tui-table__right':(item.align || align)==='right','tui-table--col-fixed':item.fixed}"
						:style="{borderTopColor:horBorder?borderColor:'transparent',borderBottomColor:horBorder?borderColor:'transparent',height:cellHeight==0?'auto':cellHeight+'px',borderRightColor:border?borderColor:'transparent',borderLeftColor:border && index===0?borderColor:'transparent',background:item.background || headerBgColor,width:item.width+'px',paddingTop:cellHeight==0? padding+'rpx':'0',paddingBottom:cellHeight==0? padding+'rpx':'0',left:item.fixed && item.fixed!=='right'?item.left+'px':'auto',right:item.fixed==='right'?item.right+'px':'auto'}"
						v-for="(item,index) in hData" :key="index" @tap.stop="tableSort(index,false)">
						<view class="tui-table__checkbox"
							:style="{background:chkAll?checkboxColor:'transparent',borderColor:chkAll ?checkboxColor:checkboxBorderColor}"
							v-if="item.type==='selection'" @tap.stop="selectionAll">
							<view class="tui-table__checkmark"
								:style="{borderBottomColor:checkmarkColor,borderRightColor:checkmarkColor}"></view>
						</view>
						<text v-else class="tui-table--td-text"
							:class="{'tui-text__center':(item.align || align)==='center','tui-text__right':(item.align || align)==='right','tui-td__ellipsis':ellipsis}"
							:style="{width:item.width+'px',color:item.color || color,fontSize:(item.size || size)+'rpx',fontWeight:fontWeight}">{{item.label || item.prop}}</text>
						<view class="tui-table__sort-icon" :style="{right:(item.sortRight || 40)+'rpx'}"
							v-if="item.sortable">
							<tui-icon :name="item.sort==='descending'?'turningdown':'turningup'"
								:size="item.sortSize || 28" unit="rpx"
								:color="item.sort?(item.sortColor || '#333'):(item.color || color)"></tui-icon>
						</view>
						<view class="tui-table__td-sk" :style="{backgroundColor:borderColor}"
							v-if="border && item.fixed==='right'"></view>
					</view>
				</view>
				<view class="tui-virtual__table-tr"
					:class="{'tui-table__border-top':horBorder  && index===0,'tui-vir__tr-center':cellHeight>0}"
					:style="{borderTopColor:'transparent'}" v-for="(item,index) in virtualItems" :key="index">
					<view class="tui-table--td"
						:class="{'tui-vir__td-full':full,'tui-table__border-bottom':horBorder,'tui-table__border-right':border,'tui-table__border-left':border && idx===0,'tui-table__center':(model.align || align)==='center','tui-table__right':(model.align || align)==='right','tui-table__td-wrap':model.type===3,'tui-table--col-fixed':model.fixed }"
						v-for="(model,idx) in hData" :key="model.tdId"
						:style="{borderBottomColor:horBorder?borderColor:'transparent',height:cellHeight==0?'auto':cellHeight+'px',borderRightColor:border?borderColor:'transparent',borderLeftColor:border && idx===0?borderColor:'transparent',background:item.background || ((index+1)%2===0 && stripe?stripeColor:background),width:model.width+'px',paddingTop:cellHeight==0? padding+'rpx':'0',paddingBottom:cellHeight==0? padding+'rpx':'0',left:model.fixed && model.fixed!=='right'?model.left+'px':'auto',right:model.fixed==='right'?model.right+'px':'auto'}"
						@tap.stop="trClick(index,idx,model.prop)">
						<template v-if="model.type!==3">
							<view class="tui-table__checkbox" :class="{'tui-table__disabled':item.is_disabled}"
								:style="{background:item.is_selected ?checkboxColor:'transparent',borderColor:item.is_selected ?checkboxColor:checkboxBorderColor}"
								v-if="model.type==='selection'" @tap.stop="selectionChange(index)">
								<view class="tui-table__checkmark"
									:style="{borderBottomColor:checkmarkColor,borderRightColor:checkmarkColor}">
								</view>
							</view>
							<view class="tui-vir__img-box" v-else-if="model.type===2"
								:class="{'tui-img--ani':isVisible}"
								:style="{width:(model.imgWidth || 80)+'rpx',height:(model.imgHeight || model.imgWidth || 80)+'rpx'}">
								<image v-if="isVisible" class="tui-table--td-img" :src="item[model.prop] || ''"
									mode="widthFix"
									:style="{width:(model.imgWidth || 80)+'rpx',height:(model.imgHeight || model.imgWidth || 80)+'rpx'}">
								</image>
							</view>
							<text class="tui-table--td-text"
								:class="{'tui-text__center':(model.align || align)==='center','tui-text__right':(model.align || align)==='right','tui-td__ellipsis':ellipsis,'tui-td__wrap':!ellipsis}"
								v-else
								:style="{color:getColColor(model,item[model.prop],index),fontSize:(model.textSize || textSize) +'rpx',width:model.width+'px'}">{{item[model.prop]==0?item[model.prop]:(item[model.prop] || '')}}</text>
						</template>
						<template v-else>
							<text class="tui-table--btn" :class="{'tui-td__btn-ml':j>0}"
								:style="{fontSize:(btn.size || textSize) +'rpx',color:btn.color,fontWeight:btn.fontWeight || 'normal'}"
								v-for="(btn,j) in model.buttons" :key="btn.bId"
								@tap.stop="handleTap(index,j)">{{btn.text}}</text>
						</template>
						<view class="tui-table__td-sk" :style="{backgroundColor:borderColor}"
							v-if="border && model.fixed==='right'"></view>
					</view>
				</view>
				<view class="tui-table--empty" v-if="tableList.length===0 && emptyText!==true && emptyText!==''">
					<text class="tui-table__empty-text"
						:style="{fontSize:emptySize+'rpx',color:emptyColor}">{{emptyText}}</text>
				</view>
			</view>
		</scroll-view>
		<view v-if="londingType==1" class="tui-vir__loading" :class="{'tui-vir__loading-show':!isVisible}"
			:style="{color:loadingColor}">
			{{!loadingText || loadingText===true?'':loadingText}}
		</view>

		<scroll-view v-else class="tui-vir__loading-skeleton" :class="{'tui-vir__loading-show':!isVisible}" enhanced
			:bounces="bounces" :show-scrollbar="showScrollbar" :scroll-x="true" :scroll-y="false"
			:scroll-left="scrollLeft">
			<view class="tui-virtual__table-tr" :class="{'tui-vir__tr-center':cellHeight>0}">
				<view class="tui-table--td"
					:class="{'tui-vir__td-full':full,'tui-table__border-top':horBorder,'tui-table__border-bottom':horBorder,'tui-table__border-right':border,'tui-table__border-left':border && index===0,'tui-table__center': (item.align || align)==='center','tui-table__right':(item.align || align)==='right','tui-table--col-fixed':item.fixed}"
					:style="{borderTopColor:horBorder?borderColor:'transparent',borderBottomColor:horBorder?borderColor:'transparent',height:cellHeight==0?'auto':cellHeight+'px',borderRightColor:border?borderColor:'transparent',borderLeftColor:border && index===0?borderColor:'transparent',background:item.background || headerBgColor,width:item.width+'px',paddingTop:cellHeight==0?padding+'rpx':'0',paddingBottom:cellHeight==0?padding+'rpx':'0',left:item.fixed && item.fixed!=='right'?item.left+'px':'auto',right:item.fixed==='right'?item.right+'px':'auto'}"
					v-for="(item,index) in hData" :key="index" @tap.stop="tableSort(index,false)">
					<view class="tui-table__checkbox"
						:style="{background:chkAll?checkboxColor:'transparent',borderColor:chkAll ?checkboxColor:checkboxBorderColor}"
						v-if="item.type==='selection'" @tap.stop="selectionAll">
						<view class="tui-table__checkmark"
							:style="{borderBottomColor:checkmarkColor,borderRightColor:checkmarkColor}"></view>
					</view>
					<text v-else class="tui-table--td-text"
						:class="{'tui-text__center':(item.align || align)==='center','tui-text__right':(item.align || align)==='right','tui-td__ellipsis':ellipsis}"
						:style="{width:item.width+'px',color:item.color || color,fontSize:(item.size || size)+'rpx',fontWeight:fontWeight}">{{item.label || item.prop}}</text>
					<view class="tui-table__sort-icon" :style="{right:(item.sortRight || 40)+'rpx'}"
						v-if="item.sortable">
						<tui-icon :name="item.sort==='descending'?'turningdown':'turningup'" :size="item.sortSize || 28"
							unit="rpx" :color="item.sort?(item.sortColor || '#333'):(item.color || color)"></tui-icon>
					</view>
					<view class="tui-table__td-sk" :style="{backgroundColor:borderColor}"
						v-if="border && item.fixed==='right'"></view>
				</view>
			</view>
			<view class="tui-virtual__table-tr"
				:class="{'tui-table__border-top':horBorder  && index===0,'tui-vir__tr-center':cellHeight>0}"
				:style="{borderTopColor:'transparent'}" v-for="(item,index) in skeletonList" :key="index">
				<view class="tui-table--td"
					:class="{'tui-vir__td-full':full,'tui-table__border-bottom':horBorder,'tui-table__border-right':border,'tui-table__border-left':border && idx===0,'tui-table__center':(model.align || align)==='center','tui-table__right':(model.align || align)==='right','tui-table__td-wrap':model.type===3,'tui-table--col-fixed':model.fixed }"
					v-for="(model,idx) in hData" :key="model.tdId"
					:style="{borderBottomColor:horBorder?borderColor:'transparent',height:cellHeight==0?'auto':cellHeight+'px',borderRightColor:border?borderColor:'transparent',borderLeftColor:border && idx===0?borderColor:'transparent',background:item.background || ((index+1)%2===0 && stripe?stripeColor:background),width:model.width+'px',paddingTop:cellHeight==0? padding+'rpx':'0',paddingBottom:cellHeight==0? padding+'rpx':'0',left:model.fixed && model.fixed!=='right'?model.left+'px':'auto',right:model.fixed==='right'?model.right+'px':'auto'}">
					<template v-if="model.type!==3">
						<view class="tui-table__checkbox tui-vir__skeleton-bg" v-if="model.type==='selection'">
						</view>
						<view class="tui-vir__img-box" v-else-if="model.type===2"
							:style="{width:(model.imgWidth || 80)+'rpx',height:(model.imgHeight || model.imgWidth || 80)+'rpx'}">
						</view>
						<view class="tui-vir__skeleton-cell tui-vir__skeleton-bg" v-else></view>
					</template>
					<template v-else>
						<view class="tui-vir__skeleton-cell tui-vir__skeleton-bg">
						</view>
					</template>
					<view class="tui-table__td-sk" :style="{backgroundColor:borderColor}"
						v-if="border && model.fixed==='right'"></view>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
	import {
		mapVirtualToProps,
		getVisibleItemBounds
	} from './index.js'
	import debounce from './debounce.js'
	export default {
		name: "tui-virtual-table",
		emits: ['change', 'scroll', 'scrolltoupper', 'scrolltolower', 'click', 'trClick', 'tdClick', 'selectionChange',
			'select',
			'selectAll', 'sortChange'
		],
		props: {
			height: {
				type: [Number, String],
				default: 600
			},
			//rpx 或 px
			unit: {
				type: String,
				default: 'rpx'
			},
			background: {
				type: String,
				default: '#fff'
			},
			itemHeight: {
				type: [Number, String],
				default: 100
			},
			itemBuffer: {
				type: [Number, String],
				default: 0
			},
			upperThreshold: {
				type: [Number, String],
				default: 50
			},
			lowerThreshold: {
				type: [Number, String],
				default: 50
			},
			enableBackToTop: {
				type: Boolean,
				default: false
			},
			header: {
				type: Array,
				default () {
					return []
				}
			},
			//表头是否放置容器外
			outsideHeader: {
				type: Boolean,
				default: false
			},
			size: {
				type: [Number, String],
				default: 28
			},
			color: {
				type: String,
				default: '#333'
			},
			fontWeight: {
				type: [Number, String],
				default: 600
			},
			headerBgColor: {
				type: String,
				default: '#fff'
			},
			fixed: {
				type: Boolean,
				default: false
			},
			//表格数据
			tableData: {
				type: Array,
				default () {
					return []
				}
			},
			full: {
				type: Boolean,
				default: false
			},
			//是否带有纵向边框
			border: {
				type: Boolean,
				default: true
			},
			//是否带有横向边框
			horBorder: {
				type: Boolean,
				default: true
			},
			//边框颜色
			borderColor: {
				type: String,
				default: '#eee'
			},
			// 是否为斑马纹table
			stripe: {
				type: Boolean,
				default: false
			},
			//斑马纹颜色
			stripeColor: {
				type: String,
				default: '#F8F8F8'
			},
			textSize: {
				type: [Number, String],
				default: 28
			},
			textColor: {
				type: String,
				default: '#333'
			},
			//单元格对齐方式:left/center/right
			align: {
				type: String,
				default: 'center'
			},
			//文字超出是否省略，默认换行
			ellipsis: {
				type: Boolean,
				default: false
			},
			//单元格上下padding值，单位rpx
			padding: {
				type: [Number, String],
				default: 20
			},
			//是否添加多选框
			selection: {
				type: Boolean,
				default: false
			},
			initEmitChange: {
				type: Boolean,
				default: false
			},
			//选择框选中后颜色
			checkboxColor: {
				type: String,
				default: '#5677fc'
			},
			checkboxBorderColor: {
				type: String,
				default: '#eee'
			},
			checkmarkColor: {
				type: String,
				default: '#fff'
			},
			emptyText: {
				type: String,
				default: '暂无数据'
			},
			emptySize: {
				type: [String, Number],
				default: 24
			},
			emptyColor: {
				type: String,
				default: '#bfbfbf'
			},
			//1-显示加载文本 2-骨架
			londingType: {
				type: [String, Number],
				default: 2
			},
			loadingText: {
				type: String,
				default: '加载中...'
			},
			loadingColor: {
				type: String,
				default: '#999'
			},
			isVirtual: {
				type: Boolean,
				default: true
			},
			bounces: {
				type: Boolean,
				default: false
			},
			showScrollbar: {
				type: Boolean,
				default: false
			}
		},
		computed: {
			getStyle() {
				let style = ''
				if (!this.enablePageScroll && Number(this.height) > 0) {
					const height = this.unit === 'rpx' ? this.getPx(this.height || 600) : this.height;
					style += `height:${height}px;`
				}
				return style;
			},
			valueChange() {
				return `${this.enablePageScroll?1:0}_${this.height}_${this.itemHeight}_${this.itemBuffer}`
			}
		},
		watch: {
			itemHeight(newVal) {
				this.updated(newVal)
			},
			valueChange(val) {
				this.scrollHeight = this.unit === 'rpx' ? this.getPx(this.height || 600) : this.height;
				if (this.firstRendered) {
					this.onChange(this.scrollOffset, true)
				}
			},
			currentIndex(newVal) {
				if (this.firstRendered) {
					this.scrollToIndex(Number(newVal))
				}
			},
			header(vals) {
				this.handleHeader(vals)
			},
			tableData(vals) {
				this.handleData(vals)
			},
			selection(vals) {
				this.handleData(this.tableData)
			}
		},
		created() {
			this.scrollHandler = () => {};
			this.items = []
			this.firstRendered = false
			this.scrollHeight = this.unit === 'rpx' ? this.getPx(this.height || 600) : this.height;
			this.cellHeight = this.getPx(this.itemHeight);
			this.handleHeader(this.header)
			this.handleData(this.tableData)
			if (this.cellHeight > 0) {
				const len = Math.ceil(Number(this.scrollHeight) / this.cellHeight) + 2;
				let list = [];
				for (let i = 0; i < len; i++) {
					list.push(i)
				}
				this.skeletonList = list;
			}
		},
		mounted() {
			this.$nextTick(() => {
				this.isVirtual && this.getBoundingClientRect()
				this.loadData()
				this.bindScrollHandler(10)
			})
		},
		data() {
			return {
				styles: '',
				offsetTop: undefined,
				// 用于记录滚动条实际位置
				scrollOffset: 0,
				// 用于设置滚动条位置
				innerScrollOffset: 0,
				// 第一个元素的索引值
				startIndex: 0,
				// 最后一个元素的索引值
				endIndex: -1,
				//容器总高度 px
				scrollHeight: 300,
				//item项高度 px
				cellHeight: 50,
				currentIndex: 0,
				enablePageScroll: false,
				hData: [],
				totalWidth: '100%',
				tableList: [],
				initTableData: [],
				chkAll: false,
				initVirtualItems: [],
				virtualItems: [],
				scrollLeft: 0,
				scrollTop: 0,
				scrollx: false,
				timer: null,
				isVisible: true,
				skeletonList: []
			};
		},
		methods: {
			getPx(rpx) {
				let px = uni.upx2px(Number(rpx))
				return px % 2 === 0 ? px : px + 1
			},
			getCellHeight() {
				return this.getPx(this.itemHeight)
			},
			/**
			 * 设置子元素的高度
			 * @param {Number} itemHeight 子元素高度
			 */
			updated(itemHeight) {
				this.cellHeight = this.getPx(itemHeight || this.itemHeight);
				this.$emit('init', {
					itemHeight: this.cellHeight
				})
			},
			/**
			 * 用于计算虚拟列表数据
			 * @param {Function} callback 设置完成后的回调函数
			 */
			loadData(callback) {
				if (this.height == 0 || !this.isVirtual) return;
				const {
					cellHeight,
					startIndex,
					endIndex,
					scrollOffset
				} = this
				const options = {
					items: this.tableList,
					itemHeight: cellHeight,
				}
				const indexes = {
					startIndex,
					endIndex
				}
				const virtual = mapVirtualToProps(options, indexes)

				if (!this.outsideHeader && !this.full) {
					this.styles = `width:${this.totalWidth};${virtual.style}`
				} else {
					this.styles = virtual.style
				}
				if (typeof callback === 'function') {
					callback.call(this, {
						items: virtual.items,
						...indexes,
						scrollOffset
					})
				}
			},
			/**
			 * 数据变化时的回调函数
			 * @param {Number} scrollOffset 记录滚动条实际位置
			 * @param {Boolean} scrolled 是否设置滚动条位置
			 * @param {Function} callback 设置完成后的回调函数
			 */
			onChange(scrollOffset, scrolled, callback) {
				// 计算起始点是否发生变化
				const {
					cellHeight,
					scrollHeight,
					itemBuffer,
					startIndex,
					endIndex,
					offsetTop,
					enablePageScroll
				} = this

				const itemCount = Math.max(0, this.items.length - 1)
				const listTop = enablePageScroll ? offsetTop : 0
				const viewTop = scrollOffset - listTop
				const state = getVisibleItemBounds(viewTop, scrollHeight, itemCount, cellHeight, Number(itemBuffer))
				const hasChanged = state.startIndex !== startIndex || state.endIndex !== endIndex

				// 计算起始点是否可视
				const direction = scrollOffset > this.scrollOffset ? 'Down' : 'Up'
				const firstItemVisible = direction === 'Up' && viewTop < startIndex * cellHeight
				const lastItemVisible = direction === 'Down' && viewTop > (endIndex * cellHeight - scrollHeight)

				// 判断起始点大小
				if (state === undefined || state.startIndex > state.endIndex) return

				// 判断起始点是否发生变化及是否可视状态
				if (hasChanged && (firstItemVisible || lastItemVisible) || scrolled) {
					this.startIndex = state.startIndex
					this.endIndex = state.endIndex
					this.loadData((values) => {
						// scroll into view
						if (scrolled) {
							this.innerScrollOffset = scrollOffset
						}
						this.virtualItems = JSON.parse(JSON.stringify(values.items));
						this.initVirtualItems = JSON.parse(JSON.stringify(values.items))
						// trigger change
						this.$emit('change', {
							...values,
							direction,
							scrollOffset
						})

						// trigger callback
						if (typeof callback === 'function') {
							callback.call(this, {
								...values,
								direction,
								scrollOffset
							})
						}
					})
				}

				// 记录滚动条的位置（仅记录不去设置）
				if (this.scrollOffset != scrollOffset) {
					this.scrollOffset = scrollOffset
				}
			},
			/**
			 * 滚动时触发的事件
			 */
			onScroll(e) {
				const scrollTop = e.detail.scrollTop;
				clearTimeout(this.timer);
				this.isVirtual && this.onChange(scrollTop);
				this.scrollx = true;
				const isChange = Math.abs(this.scrollTop - scrollTop) > 50
				if (isChange && this.isVisible && this.isVirtual) {
					this.isVisible = false;
				}
				this.scrollTop = scrollTop;
				this.scrollLeft = e.detail.scrollLeft;
				this.$emit('scroll', e.detail);
				this.timer = setTimeout(() => {
					this.scrollx = false;
					this.isVisible = true;
				}, 120)
			},
			/**
			 * 绑定滚动事件
			 * @param {Boolean} useDebounce 是否防抖
			 */
			bindScrollHandler(useDebounce = true) {
				this.scrollHandler = useDebounce ? debounce(this.onScroll.bind(this), useDebounce, {
					leading: true,
					maxWait: 1,
					trailing: true
				}) : this.onScroll
			},
			/**
			 * 滚动到顶部时触发的事件
			 */
			onScrollToUpper(e) {
				this.$emit('scrolltoupper', e.detail)
			},
			/**
			 * 滚动到底部时触发的事件
			 */
			onScrollToLower(e) {
				this.$emit('scrolltolower', e.detail)
			},
			/**
			 * 根据索引值获取偏移量
			 * @param {Number} index 指定的索引值
			 * @param {Number} itemHeight 子元素高度
			 * @param {Number} itemSize 子元素个数
			 */
			getOffsetForIndex(index, itemHeight, itemSize) {
				itemHeight = itemHeight || this.cellHeight
				itemSize = itemSize || this.items.length
				const realIndex = Math.max(0, Math.min(index, itemSize - 1))
				const scrollOffset = realIndex * itemHeight
				return scrollOffset
			},
			/**
			 * 更新组件
			 * @param {Array} items 实际数据列表，当需要动态加载数据时设置
			 * @param {Function} success 设置完成后的回调函数
			 */
			render(items, success) {
				if (Array.isArray(items)) {
					this.items = items
					this.handleData(items)
				}

				// 首次渲染时滚动至 scrollToIndex 指定的位置
				if (!this.firstRendered) {
					this.firstRendered = true
					this.scrollOffset = this.getOffsetForIndex(this.currentIndex)
				}

				this.getBoundingClientRect(() => this.onChange(this.scrollOffset, true, success))

			},
			/**
			 * 滚动到指定的位置
			 * @param {Number} scrollOffset 指定的位置
			 * @param {Function} success 设置完成后的回调函数
			 */
			scrollTo(scrollOffset, success) {
				if (typeof scrollOffset === 'number') {
					const offset = Math.max(0, Math.min(scrollOffset, this.items.length * this.cellHeight))
					this.onChange(offset, true, success)
				}
			},
			/**
			 * 根据索引值滚动到指定的位置
			 * @param {Number} index 指定元素的索引值
			 * @param {Function} success 设置完成后的回调函数
			 */
			scrollToIndex(index, success) {
				if (typeof index === 'number') {
					this.onChange(this.getOffsetForIndex(index), true, success)
				}
			},
			/**
			 * 获取容器的偏移量
			 * @param {Function} callback 设置完成后的回调函数
			 * @param {Boolean} isForce 是否强制更新
			 */
			getBoundingClientRect(callback, isForce) {
				if (this.offsetTop !== undefined && !isForce && typeof callback === 'function') {
					callback.call(this)
					return
				}
				const className = '.tui-virtual__table'
				uni.createSelectorQuery()
					// #ifndef MP-ALIPAY
					.in(this)
					// #endif
					.select(className)
					.boundingClientRect((rect) => {
						if (!rect) return
						this.offsetTop = rect.top
						callback && callback()
					})
					.exec()
			},
			getId(index) {
				return `tui_${index}_tr_${Math.ceil(Math.random() * 10e5).toString(36)}`
			},
			handleHeader(header) {
				if (header.length === 0) return;
				let vals = JSON.parse(JSON.stringify(header))
				if (this.selection) {
					vals.unshift({
						fixed: true,
						width: 100,
						type: 'selection'
					})
				}
				// let winWidth = uni.getSystemInfoSync().windowWidth
				let width = 0,
					left = 0,
					right = 0;
				let len = vals.length
				vals.map((item, index) => {
					item.tdId = this.getId(index)
					item.width = this.getPx(item.width || 200)
					width += item.width
					if (item.fixed) {
						item.left = item.fixed !== 'right' ? left : 0;
						left += item.width
					}
					if (item.type === 3 && item.buttons) {
						item.buttons.map((btn, idx) => {
							btn.bId = this.getId(index)
						})
					}
					//空 默认排序，ascending-升序 descending-降序
					if (!item.sort) {
						item.sort = ''
					}
				})
				for (let i = 0; i < len; i++) {
					let item = vals[len - i - 1]
					if (item && item.fixed) {
						item.right = item.fixed === 'right' ? right : 0;
						right += item.width
					}
				}
				if (!this.outsideHeader && !this.full) {
					this.totalWidth = `${width}px`;
				}
				this.hData = vals;
			},
			handleData(vals) {
				let table = JSON.parse(JSON.stringify(vals))
				table.map(item => {
					item.is_disabled = item.is_disabled || false;
					item.is_selected = item.is_selected || false;
				})
				this.tableList = table;
				this.initTableData = JSON.parse(JSON.stringify(table))
				if (this.initEmitChange) {
					this.emitSelectionChange()
				}
				if (this.height == 0 || !this.isVirtual) {
					this.virtualItems = this.tableList
					this.items = this.tableList
				}
			},
			handleTap(index, i) {
				const item = this.virtualItems[index]
				this.$emit('click', {
					item: item,
					index: index + this.startIndex,
					btnIndex: i
				})
			},
			trClick(index, idx, prop) {
				let item = this.virtualItems[index]
				this.$emit('trClick', {
					item: item,
					index: index + this.startIndex,
					prop: prop
				})
				this.$emit('tdClick', {
					item: item,
					rowIndex: index + this.startIndex,
					tdIndex: idx,
					prop: prop
				})
			},
			getColColor(model, value, index) {
				let color = '';
				if (model.fn && typeof model.fn === 'function') {
					color = model.fn(value, index)
				}
				return color || model.textColor || this.textColor
			},
			columnColorMethod(fn, prop) {
				if (!fn || !prop) return;
				const data = this.hData;
				const index = data.findIndex(item => item.prop === prop)
				if (index !== -1) {
					let item = data[index]
					item.fn = fn
					this.hData = data;
				}
			},
			selectionAll() {
				if (this.chkAll) {
					this.chkAll = false
					this.tableList.map(item => {
						if (!item.is_disabled) {
							item.is_selected = false
						}
					})
					this.virtualItems.map(item => {
						if (!item.is_disabled) {
							item.is_selected = false
						}
					})
				} else {
					this.chkAll = true;
					this.tableList.map(item => {
						if (!item.is_disabled) {
							item.is_selected = true
						}
					})
					this.virtualItems.map(item => {
						if (!item.is_disabled) {
							item.is_selected = true
						}
					})
				}
				this.$emit('selectAll', {
					is_selected: this.chkAll
				})
				setTimeout(() => {
					this.emitSelectionChange()
				}, 0)
			},
			emitSelectionChange() {
				const itemList = this.tableList.filter(item => item.is_selected === true && item.is_disabled !== true)
				let data = JSON.parse(JSON.stringify(itemList))
				data.forEach(item => {
					delete item.is_selected
					delete item.is_disabled
				})
				this.$emit('selectionChange', data)
			},
			checkSelectionAll() {
				if (!this.tableList || this.tableList.length === 0) return;
				const index = this.tableList.findIndex(item => item.is_selected === false && item.is_disabled !== true)
				if (~index) {
					this.chkAll = false
				} else {
					this.chkAll = true
				}
				setTimeout(() => {
					this.emitSelectionChange()
				}, 0)
			},
			selectionChange(index, selected) {
				if (selected === undefined || selected === null) {
					const item = this.virtualItems[index]
					if (item.is_disabled) return;
					item.is_selected = !item.is_selected;
					//同步至原数据中
					const dataIndex = index + this.startIndex;
					const model = this.tableList[dataIndex]
					model.is_selected = item.is_selected;
					this.$emit('select', {
						is_selected: item.is_selected,
						item: item,
						index: dataIndex
					})
				} else {
					const model = this.tableList[index]
					model.is_selected = selected;

					//同步至虚拟列表中
					if (index >= this.startIndex && index <= this.endIndex) {
						const item = this.virtualItems[index - this.startIndex]
						item.is_selected = selected;
					}

					this.$emit('select', {
						is_selected: model.is_selected,
						item: model,
						index: index
					})
				}

				this.checkSelectionAll()
			},
			//用于多选表格，清空用户的选择
			clearSelection() {
				this.chkAll = false
				this.virtualItems.map(item => {
					if (!item.is_disabled) {
						item.is_selected = false
					}
				})
				this.tableList.map(item => {
					if (!item.is_disabled) {
						item.is_selected = false
					}
				})
			},
			toggleRowSelection(index, selected) {
				const item = this.tableList[index];
				if (!item) return;
				this.selectionChange(index, selected)
			},
			toggleRowDisabled(index, disabled) {
				const item = this.tableList[index];
				if (!item) return;
				if (disabled === undefined || disabled === null) {
					item.is_disabled = !item.is_disabled;
				} else {
					item.is_disabled = disabled;
				}
				if (index >= this.startIndex && index <= this.endIndex) {
					const model = this.virtualItems[index - this.startIndex]
					if (disabled === undefined || disabled === null) {
						model.is_disabled = item.is_disabled;
					} else {
						model.is_disabled = disabled;
					}
				}
			},
			//用于多选表格，切换所有行的选中状态（全选/取消）
			toggleAllSelection() {
				this.selectionAll()
			},
			tableSort(index, sortOrder) {
				if (!this.virtualItems || this.virtualItems.length === 0) return;
				const item = this.hData[index]
				if (item.sortable) {
					// item.sortType='number/date/string'
					//ascending-升序 descending-降序
					let asc = false;
					if (sortOrder) {
						asc = sortOrder === 'ascending'
					} else {
						asc = !item.sort || item.sort === 'descending';
					}
					if (asc) {
						item.sort = 'ascending'
						if (item.sortType === 'number') {
							this.tableList.sort((a, b) => {
								return a[item.prop] - b[item.prop]
							});
						} else if (item.sortType === 'date') {
							this.tableList.sort((a, b) => {
								//日期格式字符串必须可以被转化为日期格式
								return new Date(a[item.prop].replace(/\-/g, '/')).getTime() - new Date(b[item.prop]
									.replace(/\-/g, '/')).getTime()
							});
						} else {
							this.tableList.sort((a, b) => {
								return a[item.prop].localeCompare(b[item.prop], 'zh-Hans-CN');
							});
						}
					} else {
						item.sort = 'descending'
						if (item.sortType === 'number') {
							this.tableList.sort((a, b) => {
								return b[item.prop] - a[item.prop]
							});
						} else if (item.sortType === 'date') {
							this.tableList.sort((a, b) => {
								//日期格式字符串必须可以被转化为日期格式
								return new Date(b[item.prop].replace(/\-/g, '/')).getTime() - new Date(a[item.prop]
									.replace(/\-/g, '/')).getTime()
							});
						} else {
							this.tableList.sort((a, b) => {
								return b[item.prop].localeCompare(a[item.prop], 'zh-Hans-CN');
							});
						}
					}

					const _tableList = this.tableList.slice(this.startIndex, this.endIndex + 1)
					this.virtualItems = JSON.parse(JSON.stringify(_tableList))
					this.hData.forEach((d, idx) => {
						if (index !== idx) {
							d.sort = ''
						}
					})
					this.$emit('sortChange', {
						itemList: this.tableList,
						virtualItems: this.virtualItems,
						sort: item.sort,
						prop: item.prop
					})
				}
			},
			//重置所有排序
			resetSort() {
				this.hData.forEach(item => {
					item.sort = ''
				})
				this.tableList = JSON.parse(JSON.stringify(this.initTableData))
				this.virtualItems = JSON.parse(JSON.stringify(this.initVirtualItems))
			},
			//ascending-升序 descending-降序
			setSort(prop, sortOrder = 'ascending') {
				const index = this.hData.findIndex(item => item.prop === prop)
				if (index !== -1) {
					this.tableSort(index, sortOrder)
				}
			}

		}
	}
</script>

<style scoped>
	.tui-virtual__table {
		position: relative;
		/* #ifndef APP-NVUE */
		display: block;
		overflow: auto;
		height: auto;
		/* #endif */
	}

	.tui-virtual__scroll-view {
		width: 100%;
		position: relative;
		z-index: 1;
		box-sizing: border-box;
	}

	.tui-vir__tr-box {
		position: relative;
		z-index: 1;
	}

	.tui-vir__loading {
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 0;
		font-size: 24rpx;
		color: #999;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		visibility: hidden;
	}

	.tui-vir__loading-skeleton {
		width: 100%;
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 0;
		font-size: 24rpx;
		color: #999;
		opacity: 0;
		visibility: hidden;
		overflow: hidden;
	}

	.tui-vir__skeleton-bg {
		background-color: #f8f8f8;
	}

	.tui-vir__skeleton-cell {

		width: 100%;
		height: 40rpx;
	}

	.tui-vir__loading-show {
		opacity: 1;
		visibility: visible;
	}

	.tui-table__border-top {
		border-top-width: 1px;
		border-top-style: solid;
	}

	.tui-table__border-left {
		border-left-width: 1px;
		border-left-style: solid;
	}

	.tui-table__border-right {
		border-right-width: 1px;
		border-right-style: solid;
	}

	.tui-table__border-bottom {
		border-bottom-width: 1px;
		border-bottom-style: solid;
	}

	.tui-virtual__table-tr {
		display: flex;
		flex-direction: row;
		box-sizing: border-box;
		border-color: transparent;
	}

	.tui-vir__tr-center {
		align-items: center;
	}

	.tui-table--empty {
		width: 100%;
		display: flex;
		flex-direction: row;
		justify-content: center;
		justify-content: center;
		box-sizing: border-box;
	}

	.tui-table__empty-ab {
		position: absolute;
		left: 0;
		top: 96rpx;
		z-index: 2;
	}

	.tui-table__empty-text {
		width: 100%;
		font-weight: 400;
		text-align: center;
		padding: 48rpx 0;
	}

	.tui-table--td {
		display: flex;
		flex-shrink: 0;
		flex-direction: row;
		align-items: center;
		padding-left: 16rpx;
		padding-right: 16rpx;
		position: relative;
		box-sizing: border-box;
	}

	.tui-vir__img-box {
		min-height: 80rpx;
		background-color: #f8f8f8;
	}

	.tui-img--ani {
		animation: visible 0.8s linear;
		background-color: transparent;
	}

	@-webkit-keyframes visible {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	.tui-table__sort-icon {
		position: absolute;
		right: 40rpx;
		top: 0;
		bottom: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
	}

	.tui-table__td-sk {
		position: absolute;
		left: -1px;
		width: 1px;
		top: 0;
		bottom: 0;
	}

	.tui-table__td-wrap {
		flex-wrap: wrap;
	}

	.tui-table--td-text {
		font-weight: 400;
	}

	.tui-table--td-img {
		display: block;
	}

	.tui-table--btn {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		cursor: pointer;
		text-align: center;
		padding: 2px 0;
	}

	.tui-table--btn:active {
		opacity: .5;
	}

	.tui-td__btn-ml {
		margin-left: 24rpx;
	}

	.tui-table--header-fixed {
		position: sticky;
		top: 0;
		z-index: 12;
		left: 0;
		right: 0;
	}

	.tui-table--col-fixed {
		position: sticky;
		z-index: 2;
	}

	.tui-table__center {
		justify-content: center;
		text-align: center;
	}

	.tui-table__right {
		justify-content: flex-end;
		text-align: right;
	}

	.tui-text__center {
		text-align: center;
	}

	.tui-text__right {
		text-align: right;
	}

	.tui-td__ellipsis {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.tui-td__wrap {
		word-break: break-all;
	}

	.tui-table__scroll-view {
		position: relative;
	}

	.tui-table__flex-row {
		flex-direction: row;
	}


	.tui-table__checkbox {
		font-size: 0;
		color: rgba(0, 0, 0, 0);
		width: 36rpx;
		height: 36rpx;
		border-width: 1px;
		border-style: solid;
		display: inline-flex;
		box-sizing: border-box;
		vertical-align: top;
		flex-shrink: 0;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		position: relative;
		border-radius: 8rpx;
		cursor: pointer;
	}

	.tui-table__checkmark {
		width: 18rpx;
		height: 36rpx;
		border-bottom-style: solid;
		border-bottom-width: 3px;
		border-bottom-color: #FFFFFF;
		border-right-style: solid;
		border-right-width: 3px;
		border-right-color: #FFFFFF;
		box-sizing: border-box;
		transform: rotate(45deg) scale(0.5) translateZ(0);
		transform-origin: 54% 48%;
	}

	.tui-table__disabled {
		opacity: .5;
		/* #ifdef H5 */
		cursor: not-allowed;
		/* #endif */
	}

	.tui-vir__td-full {
		flex: 1;
		box-sizing: border-box;
		overflow: hidden;
	}
</style>
