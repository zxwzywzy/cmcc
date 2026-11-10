# Paperclip Cookie · Quantumult X

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

- 原始 33 条逻辑规则：30 条请求、3 条响应，12 条需要 body；合并相同 URL 的分发后为 31 条重写。
- 保留全部 32 个 MITM 域名及正则大小写不敏感标志。
- 龙湖根据 x-lf-channel 精确匹配 L0 / C2，不匹配则跳过。
- 北京华联仅在 Referer 包含 wx1b1dda695dff82c8 时执行；龙德广场原规则没有条件，保持无条件执行，所以该 Referer 命中时两份脚本均执行。分发器隔离变量并聚合完成回调。
- requires_body=true 转成 script-request-body / script-response-body；其余为 script-request-header。

## 限制与更新

仅抓 Cookie，自动签到需另配任务。Loon 的 Cookie 不会自动迁移，需要重新抓取。圈 X body 类型重写在 body 为空时不执行，可能与 Loon 不同；未增加二进制 body 参数。证书固定、接口变化和原脚本兼容性仍可能导致失败。

脚本是转换时的快照，不会自动同步原作者更新。更新龙湖、北京华联或龙德脚本时，同时更新对应 dispatcher 中嵌入的副本。配置引用本仓库 main 分支，订阅更新会获取仓库最新配置；必要时在圈 X 内更新脚本缓存。

已检查 33 个 JavaScript 文件语法、规则数量、主机名数量和 5 个请求头分发用例；尚未在 iOS Quantumult X 真机实测。

格式参考：https://github.com/crossutility/Quantumult-X/blob/master/sample.conf 和 https://github.com/crossutility/Quantumult-X/blob/master/sample-import-rewrite.snippet 。
