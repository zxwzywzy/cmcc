# 运营商组件

## 这个项目做什么

- 在同一个组件查看移动、联通、电信、广电的余额、流量和语音。
- 支持运营商切换、多种布局与主题。
- 从本机 BoxJS 导入本人账户；不上传 Cookie。
- 运营商适配仍为试用：版本和会话变化可能需要重新抓取。

## Scripting 远程导入 / 更新

**[一键导入到 Scripting](scripting://import_scripts?urls=%5B%22https%3A%2F%2Fraw.githubusercontent.com%2Fzxwzywzy%2Fcmcc%2Fmain%2Fprojects%2Fcarriers%2Fpackages%2Fcarriers.zip%22%5D) · [下载安装包](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/carriers/packages/carriers.zip)**

在 Scripting 的「导入远程脚本」入口粘贴以下 **HTTPS 地址**；此地址固定，后续发布会更新为新版：

```text
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/carriers/packages/carriers.zip
```

如果使用 Safari 打开，可用上方「一键导入」。GitHub 页面可能限制自定义协议链接；点击无反应时请复制 HTTPS 地址到 Scripting 导入，而不是复制 GitHub 文件展示页。

同名覆盖更新前不要先删除旧项目。固定地址提供新版包，**不代表系统会自动更新**；自动更新是否启用以 Scripting 内的远程资源设置为准。


## ① 安装到 Scripting

**[点击下载运营商组件](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/carriers/packages/carriers.zip)**

下载后点分享 → 选择 **Scripting** → 导入。已安装时覆盖同名脚本，不要先删除旧脚本。

复制下载地址：
```text
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/carriers/packages/carriers.zip
```

## ② 添加圈 X 抓取订阅

**[打开圈 X 订阅配置](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/carriers/subscriptions/Carrier-Hub-Cookie.conf)**

复制下面完整地址 → 打开 **Quantumult X（圈 X）→ 设置 → 重写 → 资源 → 添加** → 粘贴到资源 URL → 保存。关闭资源解析器；启用重写、MITM，安装并完全信任其证书。

```text
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/carriers/subscriptions/Carrier-Hub-Cookie.conf
```

## ③ 登录并导入

1. 圈 X 中安装并启用 BoxJS；已装过就跳过。[BoxJS 官方安装说明](https://github.com/chavyleung/scripts/tree/master/box)。
2. 移动重新打开 App；联通刷新首页余量；电信进入套餐余量页；广电刷新账户页。新增运营商适配仍以实际抓取结果为准。
3. 回 Scripting 运行「运营商余量」，到账号页点 **从 BoxJS 导入**。导入完成后关闭抓取订阅。
4. 长按桌面添加 **Scripting 小组件**，选择「运营商余量」。运营商总览参数留空。

---

## 开发文件（普通使用不用打开）

[源码](source/) · [配套抓取](capture/) · [全部订阅](subscriptions/) · [历史安装包](packages/) · [测试](tests/)

旧版链接继续保留兼容；新用户使用上方两个直接地址即可。不要把本人 Cookie、Token 或乘车码发到仓库或聊天。

## 组件参数

- 中号、大号参数留空：运营商总览。
- 固定运营商：填 `联通`、`电信` 或 `广电`。
- 移动原有布局和多账号参数：见[完整使用说明](source/README.md)。

## 常见问题

- 抓不到：检查重写、MITM、证书信任以及配置是否重复。
- 导入后无数据：打开对应 App 的余量页重新抓取；不要把鉴权成功等同于余量查询成功。
- 广电等路径可能随 App 变化，未适配时不会虚构余额。

## 隐私

仅用于本人账户和只读查询。不要公开 Cookie、登录 Token、BoxJS 数据或乘车码。
