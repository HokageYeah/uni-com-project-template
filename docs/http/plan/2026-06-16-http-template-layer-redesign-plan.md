# uni-app 脚手架工程 HTTP 请求层重设计总计划

## 开发前强制必读

在继续执行本计划和后续各个 task 之前，必须先阅读以下规范，且开发过程必须严格遵守：

1. [仓库级 AI 通用编码与协作规范](../../../../../.claude/rules/AI通用编码与协作规范.md)
2. [UniApp 模块化工程规范](../../../.claude/rules/UniApp模块化工程规范.md)
3. [登录改造总计划](../../plan/2026-06-15-uniapp-template-auth-refactor-plan.md)

强制要求如下：

- 先读规范，再读本计划，再读对应 task，最后才能编码
- 每个 task 必须先确认当前引用关系，不能凭记忆删除兼容 API
- 公共请求层必须保留足够中文注释和可定位日志，但禁止打印 token、Cookie、header、formData、完整 response 等敏感内容
- 所有改造必须保持零破坏性：先包兼容层，再迁移调用方，最后才删除 legacy
- 严禁为了“架构好看”一次性重写 HTTP、上传、鉴权和旧登录链路

## 当前状态

- `task-01-http-contract-and-types`：已完成
  - 已新增 `types.ts`，冻结 `ajax` 默认导出、`custom.showLoading`、`custom.showError`、`custom.auth`、`saveCookies`、`needDealCookieNames`、`uploadFilePromise`、`newUploadFilePromise`、`uploadFilesCallBack` 等旧契约
  - 已新增 `enums.ts` 承载 `RequestEnum` 和 `ContentTypeEnum`，`httpEnum.ts` 暂时保留为兼容 re-export
  - 已补充请求 custom、推荐响应、请求错误、上传结果等通用类型；本任务未改变运行行为
- `task-02-http-core-client`：已完成
  - 已新增 `core/create-http-client.ts`，下沉 `uni-ajax` 基础实例配置，核心层不直接依赖 user store、登录跳转或上传实现
  - 已新增 `core/resolve-request-url.ts`，集中处理 click、AI、普通 API 与完整 URL 直通，保持 H5 / 非 H5 条件编译行为不变
  - 已新增 `core/normalize-response.ts` 和 `core/request-error.ts`，为后续 `request<T>()` 预留响应元信息和统一错误对象能力
  - `index.ts` 仍作为兼容门面，继续保留鉴权、Cookie 兼容、上传兼容和旧命名导出
- `task-03-http-auth-adapter`：已完成
  - 已新增 `auth/auth-adapter.ts`、`auth/http-auth-adapter.ts`、`auth/unauthorized-matcher.ts`，将登录态读取、最小 token 提取、登录跳转和未登录判断集中到鉴权层
  - `index.ts` 已改为通过 `httpAuthAdapter` 执行 `custom.auth` 前置拦截、响应未登录兜底和网络 401 兜底，HTTP 门面不再直接散落鉴权实现
  - 已保留 `custom.auth`、旧 `login-v2/login/user-select-login` 历史特例和 `createAuthRedirectError()` 协议，确保旧调用方行为不变
  - 已补充 task-03 独立契约校验，并完成 `http/index.ts` 与 `http/auth/*.ts` 的 ESLint 校验
- `task-04-http-cookie-legacy-bridge`：已完成
  - 已新增 `legacy/cookie-bridge.ts`，将旧 Cookie 名单、Cookie 解析、旧 token Map 更新和 `requestCookies` 过渡写入统一下沉到 legacy 层
  - `index.ts` 已改为 re-export 旧 Cookie 兼容 API，HTTP 主门面不再直接维护 Cookie 名单和解析细节
  - `ossUpload.ts` 已改为直接复用 legacy bridge 的 `setWXLoginCookie`，避免旧上传链路继续复制 Cookie 拼装逻辑
  - 已补充 task-04 独立契约校验，并完成 `http/index.ts`、`http/ossUpload.ts`、`http/legacy/*.ts` 的 ESLint 校验
- `task-05-http-upload-layer`：已完成
  - 已新增 `upload/upload-types.ts`、`upload/upload-events.ts`、`upload/create-upload-task.ts`，集中收口上传类型、事件名、任务生命周期辅助函数与公共上传常量
  - 已新增 `legacy/legacy-upload.ts` 与 `upload/strategy-upload.ts`，分别承接旧普通上传和 OSS 策略上传实现，保留原位置参数签名和历史返回结构
  - `index.ts` 已移除大段上传实现，仅保留兼容导出；`ossUpload.ts` 已降级为 `newUploadFilePromise` 的兼容 re-export 文件
  - 已补充 task-05 独立契约校验，并完成 `http/index.ts`、`http/ossUpload.ts`、`http/legacy/*.ts`、`http/upload/*.ts` 的 ESLint/TS 校验
- `task-06-http-request-api-migration`：已完成
  - 已新增 `src/uni-module-common/http/request.ts`，通过 `createRequestApi(instance)` 复用现有 ajax 实例并返回统一 `ApiResponse<T>`
  - `src/uni-module-common/http/index.ts` 已保留旧默认导出并新增 `request` 命名导出，旧上传与 Cookie 兼容出口不变
  - 已在“我的”页新增 `request<T>()` 受保护接口示例，显式使用 `custom.auth: true`
  - 已在 task 文档中记录 legacy 删除条件，当前不删除 `ajax`、Cookie bridge、旧上传入口和未登录历史特例
- `src/uni-module-common/http/httpEnum.ts`：已清理为通用请求枚举，只保留 `RequestEnum` 和 `ContentTypeEnum`
- `src/uni-module-common/http/httpStrategyVerify.ts`：已删除，无运行时引用
- `src/uni-module-common/http/index.ts`：已完成第一轮脱敏和降噪，但仍承担请求、鉴权、Cookie 兼容、上传等多重职责
- `src/uni-module-common/http/ossUpload.ts`：已完成第一轮脱敏和边界说明，但本质仍是上传策略兼容层，不是纯 HTTP 基建
- `npm run type-check` 当前仍会被仓库历史问题阻断，已知历史问题包括：
  - `src/uni-module-common/components/thorui/tui-form-button/tui-form-button.vue`
  - `src/uni-module-common/components/xxt-components/xxt-file-submit/xxt-video-list-v2.vue`
  - `src/uni_modules/uni-module-public/login/services/member.d.ts` 已在登录目录二次清理中删除，不再作为后续阻断项

## 1. 目标

将 `src/uni-module-common/http` 从“旧业务混合请求层”整理为“可复用的 uni-app 请求层”。

本轮重设计需要同时满足以下目标：

- 保留旧调用方可用，避免页面、登录、上传链路回归
- 建立干净的请求核心，只负责请求创建、URL 解析、响应归一化、错误对象
- 将鉴权改为 adapter，不让 HTTP 核心直接绑定 user store 和登录跳转实现
- 将 Cookie 旧链路下沉为 legacy bridge，明确它不是主会话模型
- 将上传能力从请求核心中拆出，普通上传、OSS 策略上传和旧上传入口分层管理
- 新增推荐的 `request<T>()` 泛型请求 API，但保留旧 `ajax` 默认导出
- 逐步迁移需要登录的接口到 `custom.auth: true` 或新请求 API
- 最终删除 legacy Cookie、旧上传入口和旧登录未登录特例

## 2. 核心判断

### 2.1 是否值得做

✅ 值得做。

当前 HTTP 层还能运行，但不是请求层。它把请求客户端、鉴权跳转、Cookie 兼容、上传、OSS 策略和 URL 分流塞在一起。继续这样下去，新项目复用脚手架时会被迫继承旧业务规则。

### 2.2 不应该怎么做

不要一次性重写所有逻辑。那会破坏用户空间。

正确方式是：冻结旧契约 → 抽干净核心 → 下沉兼容桥 → 新 API 逐步迁移 → 引用清零后删除 legacy。

## 3. 设计决策

### 3.1 双入口策略

短期保留两个入口：

1. `ajax`：旧兼容入口，默认导出保持不变
2. `request<T>()`：新推荐入口，提供明确类型和统一响应模型

```ts
export default ajax;
export { request };
```

这样新页面可以使用干净 API，旧页面不用立刻迁移。

### 3.2 HTTP 核心只做四件事

`core` 层只允许处理：

- 创建请求实例
- 解析请求 URL
- 归一化响应
- 生成统一错误对象

禁止在 `core` 层直接处理：

- 登录跳转
- user store
- Cookie Map
- 文件上传
- OSS 策略
- 业务 toast 文案

### 3.3 鉴权使用 adapter

鉴权能力通过 `HttpAuthAdapter` 接入：

```ts
export interface HttpAuthAdapter {
  isLoggedIn(): boolean;
  getToken(): string;
  requireLogin(redirectUrl?: string): void;
  clearLoginState(): void;
  redirectToLogin(redirectUrl: string): Promise<void>;
}
```

默认实现使用当前项目 `user store` 和 `auth` 公共层。业务项目可以替换 adapter，而不是修改 HTTP 核心。

### 3.4 未登录判断集中管理

当前未登录协议包括：

- 标准旧协议：`status === 401 && code === 2`
- 历史登录特例：`login-v2/login/user-select-login` 返回 `status === 500 && code === 41`

这些判断必须集中到 `unauthorized-matcher.ts`，并标明历史特例后续要删除。

### 3.5 Cookie 兼容桥下沉 legacy

`saveCookies`、`needDealCookieNames`、`requestCookies` 写入逻辑都属于旧登录兼容，不属于主会话模型。

短期保留导出，文件位置下沉到：

```text
src/uni-module-common/http/legacy/cookie-bridge.ts
```

### 3.6 上传层独立

上传不是 HTTP 请求核心的一部分。

拆分为：

- 普通上传任务
- OSS 策略上传
- 上传事件名
- 旧上传入口兼容层

短期继续保留：

- `uploadFilePromise`
- `newUploadFilePromise`
- `uploadFilesCallBack`

### 3.7 日志策略

公共层只允许保留结构化、脱敏、可定位日志。

允许输出：

- URL 或相对路径
- 请求方法
- 状态码 / 业务码
- 上传通道
- 文件类型编号
- 是否命中策略
- 错误摘要

禁止输出：

- token
- Cookie 明文
-完整 header
- 完整 formData
- 完整 response
- OSS 表单签名字段全文

## 4. 目标目录结构

```text
src/uni-module-common/http/
├── index.ts                      # 兼容门面：旧调用方继续从这里 import
├── types.ts                      # 通用请求、响应、错误、custom 配置类型
├── enums.ts                      # 请求方法、Content-Type 等通用枚举
├── core/
│   ├── create-http-client.ts      # 纯请求实例创建
│   ├── resolve-request-url.ts     # URL/baseURL/channel 解析
│   ├── normalize-response.ts      # 响应归一化
│   └── request-error.ts           # 统一错误对象
├── auth/
│   ├── auth-adapter.ts            # 鉴权适配器接口
│   ├── http-auth-adapter.ts   # 当前默认鉴权实现
│   └── unauthorized-matcher.ts    # 未登录响应判断
├── legacy/
│   ├── cookie-bridge.ts           # 旧 Cookie 兼容桥，带废弃说明
│   └── legacy-upload.ts           # 旧 uploadFilePromise 兼容出口
└── upload/
    ├── upload-types.ts            # 上传入参、返回、事件类型
    ├── upload-events.ts           # 上传事件名
    ├── create-upload-task.ts      # 普通上传任务
    └── strategy-upload.ts         # OSS 策略上传
```

## 5. 必须冻结的旧契约

以下契约在迁移完成前不能破坏：

- `import ajax from '@/uni-module-common/http'`
- `custom.showLoading`
- `custom.showError`
- `custom.auth`
- `saveCookies`
- `needDealCookieNames`
- `uploadFilePromise`
- `newUploadFilePromise`
- `uploadFilesCallBack`
- 上传成功返回中的 `fileId`、`filePath`、`itemSeq`
- 请求失败时的历史兼容返回行为

## 6. 历史实施阶段

### Phase 1：冻结契约并新增通用类型

- 新增 `types.ts` 和 `enums.ts`
- 固化旧导出清单
- 不改变运行行为

### Phase 2：抽出 HTTP 核心客户端

- 新增 `core/create-http-client.ts`
- 新增 `core/resolve-request-url.ts`
- 新增 `core/normalize-response.ts`
- 新增 `core/request-error.ts`
- `index.ts` 仍作为兼容门面

### Phase 3：抽出鉴权 adapter

- 新增 `auth/auth-adapter.ts`
- 新增 `auth/http-auth-adapter.ts`
- 新增 `auth/unauthorized-matcher.ts`
- 保持 `custom.auth` 行为不变

### Phase 4：下沉 Cookie legacy bridge

- 新增 `legacy/cookie-bridge.ts`
- 迁移 `saveCookies`、`needDealCookieNames`、`setWXLoginCookie`
- `index.ts` 继续 re-export 旧 API

### Phase 5：拆出上传层

- 新增 `upload/*`
- 新增 `legacy/legacy-upload.ts`
- 保留 `uploadFilePromise`、`newUploadFilePromise`、`uploadFilesCallBack`
- 上传返回契约不变

### Phase 6：新增推荐请求 API 并迁移调用方

- 新增 `request<T>()`
- 新代码优先使用 `request<T>()`
- 逐步给受保护接口补 `custom.auth: true`
- 引用清零后删除 legacy

以上阶段均已执行完成。阶段明细 task 文档和阶段契约测试文件属于改版过程产物，已在脚手架整理阶段移除。

## 7. 验收标准

- 旧调用方无需修改即可继续运行
- 新请求核心不直接 import `useStore('user')`、`redirectToTemplateLogin`、`uni.uploadFile`
- 鉴权逻辑只出现在 `auth/*`
- Cookie 旧逻辑只出现在 `legacy/cookie-bridge.ts`
- 上传逻辑只出现在 `upload/*` 和 `legacy/legacy-upload.ts`
- HTTP 目录无敏感日志
- `index.ts` 行数和职责逐步下降
- 新增代码均有中文注释说明字段、状态、边界和兼容原因

## 8. 验证命令

### 引用验证

```bash
cd uni-com-project-template
rg "saveCookies|needDealCookieNames|requestCookies|uploadFilePromise|newUploadFilePromise|uploadFilesCallBack|custom\.auth|login-v2/login/user-select-login" src
```

### 敏感日志验证

```bash
cd uni-com-project-template
rg "console\.(log|warn|error|info).*token|console\.(log|warn|error|info).*header|console\.(log|warn|error|info).*formData|console\.(log|warn|error|info).*cookies|console\.(log|warn|error|info).*response" src/uni-module-common/http
```

### 静态检查

```bash
cd uni-com-project-template
npx eslint src/uni-module-common/http/**/*.ts
npm run type-check
```

如果 `npm run type-check` 被历史问题阻断，必须记录具体文件和错误，并至少保证本次修改文件的 ESLint 通过。

### CCG 质量门禁

```bash
cd /Users/yuye/YeahWork/Python项目/couple-diary-doc
node "/Users/yuye/.claude/skills/ccg/run_skill.js" verify-change uni-com-project-template/src/uni-module-common/http
node "/Users/yuye/.claude/skills/ccg/run_skill.js" verify-quality uni-com-project-template/src/uni-module-common/http
node "/Users/yuye/.claude/skills/ccg/run_skill.js" verify-security uni-com-project-template/src/uni-module-common/http
```

## 9. 任务文档归档说明

本计划对应的 6 份 HTTP task 明细文档已执行完成，并在脚手架整理阶段移除。

后续维护以前端工程 [README.md](../../../README.md)、本计划中的目标目录结构和最终形态为准，不再继续按 task 明细文档推进。

## 10. 最终形态

最终请求层应该做到：

- 请求核心简单、可读、可替换
- 鉴权是 adapter，不是写死逻辑
- Cookie 旧链路可删除
- 上传层独立，不污染 HTTP 核心
- 新业务优先使用 `request<T>()`
- 旧 API 只作为过渡兼容，不再扩散新调用
