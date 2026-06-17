# uni-app 微信小程序模板工程登录改造总计划

## 开发前强制必读

在继续执行本计划和后续各个 task 之前，必须先阅读以下规范，且开发过程必须严格遵守：

1. [仓库级 AI 通用编码与协作规范](../../../../.codex/rules/AI通用编码与协作规范.mdc)
2. [UniApp 模块化工程规范](../../.codex/rules/UniApp模块化工程规范.mdc)

强制要求如下：

- 先读规范，再读本计划，再读对应 task，最后才能编码
- 开发过程中必须优先补充中文注释和中文日志，方便联调、排障、复盘以及后续 LLM 接手
- 改动必须保持通用性、功用性、封装性，优先采用业界主流、低耦合、易维护的实现方式
- 严禁跳过计划边界直接扩写功能，严禁把旧业务登录耦合重新带回模板主链路

## 当前进度
- `task-01-auth-model-and-store`：已完成
  - 当前已实现模板最小会话模型，并保留少量过渡兼容层以保证后续任务可平滑推进
  - 已补充中文注释与中文日志，便于后续调测
  - 全仓类型校验是否通过以当前命令输出为准；原先阻断校验的 `src/uni_modules/uni-module-public/login/services/member.d.ts` 已在登录目录二次清理中删除
- `task-02-http-auth-interceptor`：已完成
  - 已新增 `src/uni-module-common/auth/*` 模板认证公共层，统一管理登录页跳转、回跳地址和重复跳转保护
  - `src/uni-module-common/http/index.ts` 已切到新的模板鉴权入口：`custom.auth === true` 未登录时会在请求前直接阻断，并统一跳转脚手架登录页
  - 已实现接口未登录状态码的统一兜底处理：清空最小会话状态后再跳转脚手架登录页，不再依赖旧授权页
  - 已保留 `requestCookies` 过渡兼容桥，避免当前旧登录成功链路在 `task-03` / `task-06` 完成前出现回归
  - 已完成针对本任务新增认证层与请求拦截改动的独立校验与静态检查；小程序实际运行已验证能够重新启动成功
- `task-03-login-page-template`：已完成并完成二次清理
  - 已保留原登录页路径 `/uni_modules/uni-module-public/login/login`，并整体替换为脚手架占位登录页
  - 已新增 `scaffold-login.ts`，统一管理默认回跳地址、示例登录用户和脚手架最小登录态构建协议
  - 登录页已支持继续接收历史兼容参数 `redictUrl`，并兼容消费 user store 中记录的回跳地址
  - 登录页已保留脚手架假登录入口：默认写入明确标注的假登录数据以跑通工程；后续项目必须替换真实登录接口并使用后端凭证调用 `setLoginState()` 后回跳；“暂不登录”按钮支持返回上一页或兜底跳转
  - 已删除登录目录内旧手机号绑定、多身份切换、旧登录接口、旧协议页和旧登录处理 hooks
  - 已完成 task-03 独立契约校验、页面与 helper 的静态检查，以及 `npm run dev:mp-weixin couple-diary` 启动编译验证
- `task-04-unlogin-components-and-page-guard`：已完成
  - 已将 `xxt-unlogin` 收敛为模板统一的未登录占位与登录入口组件，保留 `tip`、`showBtn`、`btnDesc`、`url`、`loginUrl` 等常用对外参数
  - 登录按钮行为已统一切到脚手架登录页 `/uni_modules/uni-module-public/login/login`，并优先使用 `url` / `loginUrl` 作为登录后的回跳地址
  - 已移除组件内部旧工程专属逻辑：历史 bridge 登录、写死页面路径、环境特判与旧回调链路
  - 已将 `xxt-common-unlogin` 重构为模板统一页面登录拦截容器：已登录渲染页面内容，未登录渲染 `xxt-unlogin`
  - 已保守保留 `isShowAddClass` 等旧参数作为兼容扩展位，但模板默认不再内置加班级、多身份、原生桥接等业务判断
  - 已完成 task-04 独立契约校验、组件静态检查，以及 `npm run dev:mp-weixin couple-diary` 启动编译验证
- `task-05-page-routing-and-example-pages`：已完成
  - 已从 `pages.json` 主链路移除 `pages/index/transfer-index` 与 `pages/index/login-authorization`，默认启动页已切回模板首页 `/pages/index/index`
  - 已调整全局路由拦截：未登录访问受保护页面时直接进入脚手架登录页，不再中转旧授权页；首页、日记、我的 3 个 Tab 允许游客直接进入
  - 已补齐 3 个 Tab 的模板示例页面：首页展示 `xxt-common-unlogin` 包裹示例，中间 Tab 展示公开访问示例，我的页区分游客态与最小登录态
  - 已新增 `template-page-helper.ts` 与 task-05 独立契约校验，统一首页说明文案和“我的”页最小用户信息展示协议
  - 已将首页/我的旧子包 Tab 映射收口回主包页面，避免切换 Tab 时再落到旧示例子包入口
  - 已完成 task-05 独立契约校验、页面与路由拦截静态检查，以及 `npm run dev:mp-weixin couple-diary` 编译验证
- `task-06-legacy-login-cleanup`：已完成
  - 已新增 `src/uni-module-common/auth/template-app-launch*.ts` 模板启动辅助层，`App.vue` 与原生 bridge 已改为走新的模板启动入口，不再直接依赖旧 `loginGetInfo.ts` / `global.ts`
  - 已在脚手架整理阶段删除 `pages/index/transfer-index.vue`、`pages/index/login-authorization.vue` 和阶段契约测试文件，避免继续保留旧授权中转链路与改版过程产物
  - 已为 `login-info.ts`、`loginGetInfo.ts`、`userLogin.ts`、`wxAuthorizedLogin.ts`、`useLoginHooks.ts`、`global.ts` 等旧文件补充“旧业务遗留 / 模板默认不使用”的中文说明
  - 登录目录内的 `processLoginInfoHooks.ts`、`switch-role.vue`、`bind-phone.vue`、旧 `services/*` 和旧协议页已删除，脚手架占位登录页默认不再进入旧多身份流程
  - 已补充 task-06 独立契约校验，固定模板真实登录接入点与原生启动透传数据的解析协议
  - 已完成 task-06 独立契约校验、相关文件静态检查，以及 `npm run dev:mp-weixin couple-diary` 编译验证

## 1. 目标
将 `uni-com-project-template` 从“带旧业务登录体系的模板工程”整理为“可复用的 uni-app 微信小程序模板工程”。

本轮改造需要同时满足以下目标：

- 保留 3 个 tabbar：首页、中间 tab、我的
- 去除旧授权登录链路，不再依赖 `transfer-index` 和 `login-authorization`
- 用户信息存储改为最小模板模型，不再承载旧业务身份模型
- 页面级登录拦截优先统一使用 `xxt-common-unlogin`
- 请求级未登录兜底由公共请求层统一处理
- 登录页仅保留脚手架占位实现，后续业务项目可自行补充真实登录流程

## 2. 设计决策

### 2.1 登录模式
- 采用“按需登录”模式，不做开屏强制授权
- 首页、中间 tab、我的页在未登录状态下都允许进入
- 用户在访问受保护页面或发起受保护请求时，再统一跳转登录页

### 2.2 页面拦截方式
- 模板默认使用 `xxt-common-unlogin`
- 页面若需要登录后才能完整访问，优先使用组件包裹页面主体内容
- 页面本身不再重复写散落的 `isLogin` 判断和旧登录跳转逻辑

### 2.3 请求拦截方式
- 保留 `custom.auth === true` 作为“该请求必须登录”的唯一公共约定
- 未登录时：
  - 请求前拦截直接阻断请求
  - 统一记录回跳地址并跳转到脚手架登录页
- 接口返回未登录状态码时：
  - 清理本地最小会话状态
  - 再统一跳转登录页

### 2.4 用户态模型
- 模板层只保留最小用户态
- 不再保留学校、班级、年级、角色、多身份、旧 Cookie Map、设备信息等旧业务字段
- 最小用户信息建议统一为：

```ts
interface TemplateUserInfo {
  id: string | number;
  nickname: string;
  avatar: string;
  mobile?: string;
}
```

### 2.5 登录页路径与回跳协议
- 继续复用现有登录页路径 `/uni_modules/uni-module-public/login/login`
- 继续复用 `redictUrl` 作为回跳参数，避免全局页面再次改造路由协议

## 3. 模块边界

### 3.1 `src/uni-module-common/store/user.ts`
- 只管理模板级会话状态与最小用户信息
- 提供统一会话接口：
  - `setLoginState`
  - `setUserInfo`
  - `setLoginRedirectUrl`
  - `clearLoginState`
  - `requireLogin`
  - `consumeLoginRedirect`

### 3.2 `src/uni-module-common/http/index.ts`
- 只管理请求实例、loading、toast、错误提示、登录兜底
- 不再直接承载旧项目的 Cookie 拼装、silent login、授权页白名单、自动静默登录逻辑

### 3.3 `src/uni-module-common/auth/*`
- 新增模板认证公共层
- 管理登录跳转、回跳地址、统一登录要求判断
- 让“页面登录”和“请求登录”都能走同一套入口

### 3.4 `xxt-common-unlogin` / `xxt-unlogin`
- 作为模板级页面登录占位组件
- 已登录时展示默认插槽
- 未登录时展示统一提示与登录按钮
- 组件内部统一跳脚手架登录页，不再写死旧工程路径和桥接登录逻辑

### 3.5 页面层
- 不再维护旧登录主链路
- 只消费：
  - `user store`
  - `auth` 公共能力
  - `xxt-common-unlogin`

## 4. 需要重点清理的旧耦合

### 4.1 页面入口耦合

以下旧页面入口已从 `pages.json` 移除，并在脚手架整理阶段删除：

- `src/pages/index/transfer-index.vue`
- `src/pages/index/login-authorization.vue`

### 4.2 公共登录工具耦合
- `src/uni-module-common/utils/login-info.ts`
- `src/uni-module-common/utils/loginGetInfo.ts`
- `src/uni-module-common/utils/userLogin.ts`
- `src/uni-module-common/utils/wxAuthorizedLogin.ts`
- `src/uni-module-common/hooks/useLoginHooks.ts` 中旧登录相关逻辑
- `src/uni-module-common/utils/global.ts` 中旧全局登录态

### 4.3 请求层耦合
- `src/uni-module-common/http/index.ts` 中：
  - Cookie 拼装
  - 增量 Cookie 保存
  - silent login
  - 授权页白名单
  - `defaultAuthorizationPage`
  - 自动 wx 登录

### 4.4 用户态耦合
- `src/uni-module-common/store/user.ts` 中：
  - 多身份模型
  - 年级学期
  - 设备信息
  - 旧登录初始化逻辑
  - 旧 Cookie 登录态判定逻辑

## 5. 推荐实施顺序
建议按下面顺序实施，避免改动互相打架：

1. 重构 `user store`，先建立模板最小会话模型
2. 重构 `http/index.ts`，统一请求层鉴权与跳登录逻辑
3. 重写脚手架登录页，建立占位登录入口
4. 重构 `xxt-common-unlogin` / `xxt-unlogin`
5. 整理页面入口、tab 页面和示例页
6. 清理旧登录遗留工具与示例测试页

## 6. 验收标准
- 未登录可进入首页、中间 tab、我的页
- 我的页展示游客态，点击登录进入脚手架登录页
- `xxt-common-unlogin` 包裹页面在未登录时展示未登录占位
- 登录页保留脚手架假登录入口，默认写入明确标注的假登录数据以跑通工程；业务项目必须替换真实登录接口后再按 `redictUrl` 回跳
- `custom.auth: true` 的请求在未登录时不会真正发出，而是统一进入登录流程
- 接口返回未登录状态码时，会清理本地会话并跳登录页
- 工程主链路不再依赖旧授权页、旧 Cookie 登录逻辑和多身份模型

## 7. 任务文档归档说明

本计划对应的 6 份 task 明细文档已执行完成，并在脚手架整理阶段移除。

后续维护以前端工程 [README.md](../../README.md) 和本计划中的最终边界为准，不再继续按 task 明细文档推进。

## 8. 模板接入说明
后续业务项目如果要接入真实登录流程，优先从以下 3 个入口补充：

1. 改 `src/uni_modules/uni-module-public/login/login.vue` 的真实登录 UI 与接口
2. 改 `src/uni-module-common/store/user.ts` 的最小会话写入逻辑
3. 改 `src/uni-module-common/http/index.ts` 或 `src/uni-module-common/auth/*` 的鉴权协议

模板默认不再内置旧项目里的多身份、学校班级、年级学期、微信授权头像昵称、silent login 等业务逻辑。
