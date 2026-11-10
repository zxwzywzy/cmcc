# Paperclip Cookie · Quantumult X

## 新增：武胜公交 Scripting 小组件（0.2.2 试用版）

[下载安装包](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/packages/wusheng-bus-0.2.2.scripting) · [安装说明与验证范围](scripting/wusheng-bus/README.md)

根据当前位置查最近站台、距离与车辆上报的所在站；支持小中大尺寸，参数留空。点击打开前台取码页请求新码，成功出码尚待手机真实定位验证。登录沿用本人微信手机号授权的加密导入，不含独立短信登录。个人凭据不在公开包中。

## 新增：四家运营商余量小组件（0.2.3 电信短信验证码登录）

- [下载 Scripting 安装包](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/packages/carriers-0.2.3.zip)
- [配套圈 X 抓取订阅](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/Carrier-Hub-Cookie-v0.2.1.conf)
- [安装步骤与当前限制](scripting/carriers/README.md)

0.2.3 电信登录新增短信验证码入口：手动拼图 → 明确点击发送验证码 → 输入6位验证码 → 登录并保存。验证码只在本次内存使用，Token 存本机 Keychain；失效后需重新验证码登录，不自动发短信。需要支持 UIImage.getPixelData 的 Scripting（3.2.1 或更新）。真实登录待设备验证。

历史更新：0.2.2 新增电信手机号密码直接登录，凭据仅存本机 Keychain，保留圈 X 导入方式。账号页采用简洁卡片列表，点进去查看套餐与账户、备注、登录方式和样式设置；其他运营商不再在列表中展开大段样式设置。

历史更新：0.2.1 删除重复“运营商”底栏，将四家概览、导入、样式与移动号码详情统一到“账号”。联通按成功响应增加可用积分、套餐名称、短信和套餐资源明细；部分接口不返回这些字段时不猜测。电信修正诊断规则与正文规则重叠，并支持只抓到 Token 鉴权请求后导入尝试查询。真机抓取与在线查询仍需确认。

历史更新：0.2.0 新增大、中、小号共享样式和跨运营商双号对照。在“运营商”页选择尺寸与样式，桌面参数留空即可使用；大号另有“四家总览”。移动蓝、联通红、电信紫、广电绿用于区分运营商。此更新不代表电信、广电抓取与查询已通过真机验证。

历史更新：0.1.6 中号在原全景左上角运营商名称处切换，预览也可点；联通、电信、广电各自可设置全景、账单卡、大字余额；中号总览支持标签切换并读取对应样式；统一四家导入入口；已恢复原样式库、外观和默认参数；移动沿用原查询和 12 种样式，四家概览改用“总览”参数；联通、电信、广电新增统一余量视图、BoxJS 导入及白名单查询请求重用。新增三家均待真机验证，广电 App 接口仍属待验证适配；不承诺安装即可查询成功。只有快照时明确标记为旧数据，不包含自动签到。


由用户提供的 Loon Cookie 插件转换，原脚本作者及版权归 MaYIHEI 和各原作者所有。原项目：https://github.com/MaYIHEI/paperclip 。源码头部、来源 URL 和上游许可证均保留。

## 添加订阅

在圈 X 的重写资源中添加下面的 URL，关闭资源解析器（原生圈 X 格式），启用该资源：

```
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/Paperclip-Cookie-QuantumultX.conf
```

也可将下面一行放入现有配置的 `[rewrite_remote]` 区段：

```ini
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/Paperclip-Cookie-QuantumultX.conf, tag=Paperclip Cookie, update-interval=86400, opt-parser=false, enabled=true
```

开启重写、MITM，安装并在 iOS 设置中完全信任圈 X 证书。打开相应 App 或小程序的会员/签到页面，看到抓取成功通知后关闭本订阅。无需手动复制 Scripts 文件；需能够访问 GitHub Raw 下载配置与脚本。请使用当前版本圈 X；若脚本下载失败，检查资源更新和脚本日志。

这是重写订阅，不是完整代理配置，不要用来替换整份配置。订阅提供 hostname，需确保资源的主机名没有被禁用。本项目不含个人 Cookie、Token、私钥或 MITM 证书；请不要将抓取结果提交到仓库。

## 保留的行为

- 原始 Paperclip 33 条逻辑规则加广电试用规则，共 34 条：31 条请求、3 条响应，13 条需要 body；合并相同 URL 的分发后为 32 条重写。
- 保留原有 32 个 MITM 域名及正则大小写不敏感标志，并加入广电 app.10099.com.cn，共 33 个域名。
- 龙湖根据 x-lf-channel 精确匹配 L0 / C2，不匹配则跳过。
- 北京华联仅在 Referer 包含 wx1b1dda695dff82c8 时执行；龙德广场原规则没有条件，保持无条件执行，所以该 Referer 命中时两份脚本均执行。分发器隔离变量并聚合完成回调。
- requires_body=true 转成 script-request-body / script-response-body；其余为 script-request-header。

## 限制与更新

仅抓 Cookie，自动签到需另配任务。Loon 的 Cookie 不会自动迁移，需要重新抓取。圈 X body 类型重写在 body 为空时不执行，可能与 Loon 不同；未增加二进制 body 参数。证书固定、接口变化和原脚本兼容性仍可能导致失败。

脚本是转换时的快照，不会自动同步原作者更新。更新龙湖、北京华联或龙德脚本时，同时更新对应 dispatcher 中嵌入的副本。配置引用本仓库 main 分支，订阅更新会获取仓库最新配置；必要时在圈 X 内更新脚本缓存。

已检查 33 个 JavaScript 文件语法、规则数量、主机名数量和 5 个请求头分发用例；尚未在 iOS Quantumult X 真机实测。

格式参考：https://github.com/crossutility/Quantumult-X/blob/master/sample.conf 和 https://github.com/crossutility/Quantumult-X/blob/master/sample-import-rewrite.snippet 。

## 中国广电 App 抓取（试用版）

独立订阅：

```
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/ChinaBroadnet-App-Cookie.conf
```

与合集一样在重写资源中添加，关闭资源解析器；启用重写与 MITM，安装并信任证书。打开中国广电 App，登录后进入“我的”，刷新余量/套餐/账户页面。

**未在真机验证。** 已知公开的小程序脚本使用 wx.10099.com.cn/contact-web/api/busi/qryUserInfo，读取 access 请求头及 body.data；App 域名 app.10099.com.cn 有公开规则记录，但本版本的 `/contact-web/api/busi/` 路径族和 App 鉴权字段是待验证推断，不能据此宣称 App 兼容。若 App 使用不同接口/请求头/响应令牌，或证书固定，本版可能无提示或无法捕获。

本版只捕获已知字段 access / authorization / cookie / token / access-token / x-access-token，以及业务请求 URL、方法、正文和少量上下文头，保存到圈 X 本地 `china_broadnet_app_capture_v1`。通知只表示本地保存成功，不代表令牌有效、可自动签到或兼容其他广电脚本。不打印、不上传凭据，不发送任何网络请求；下一个账号覆盖上一个账号。排除常见登录/验证码字段并限制正文大小，但保存内容仍是敏感登录数据。

使用 script-request-body 保留可能必需的请求体；空 body 不触发是圈 X 的限制。请求捕获路径暂不扩到所有域名或登录接口。抓到后关闭本独立订阅。如无提示，请先反馈“无提示”；进一步定位只需脱敏后的请求域名、路径、请求方法和字段名称，不要公开 Cookie/Token 或完整抓包。

广电试用规则已合并至 Paperclip Cookie 合集：更新原合集订阅即可使用。若已添加广电独立订阅，请关闭它，避免重复抓取。合并仅涉及 Cookie 抓取规则，不添加自动签到任务。通过 JavaScript 语法检查和 7 个模拟保存/去重/范围/过滤/失败用例，仍需用户设备验证。

参考：
- https://github.com/wuhuhuuuu/study/blob/main/Scripts/ChinaBroadnet/ChinaBroadnet.cookie.js
- https://github.com/blackmatrix7/ios_rule_script （包含 app.10099.com.cn 的 App 域名规则）
