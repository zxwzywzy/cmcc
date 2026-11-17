# 武胜公交

## 这个项目做什么

- 查看最近站台、线路方向、车辆及预计到站信息。
- 搜目的地、查看直达或一次换乘方案，开始行程后桌面同步显示。
- 组件可确认上车、打开乘车码；可靠车辆数据可用时提示剩余站数。
- 乘车码有四种主题墨色，独立桌面亮码组件支持保留与手动刷新。

## Scripting 远程导入 / 更新

**[一键导入到 Scripting](scripting://import_scripts?urls=%5B%22https%3A%2F%2Fraw.githubusercontent.com%2Fzxwzywzy%2Fcmcc%2Fmain%2Fprojects%2Fwusheng-bus%2Fpackages%2Fwusheng-bus.scripting%22%5D) · [下载安装包](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/wusheng-bus/packages/wusheng-bus.scripting)**

在 Scripting 的「导入远程脚本」入口粘贴以下 **HTTPS 地址**；此地址固定，后续发布会更新为新版：

```text
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/wusheng-bus/packages/wusheng-bus.scripting
```

如果使用 Safari 打开，可用上方「一键导入」。GitHub 页面可能限制自定义协议链接；点击无反应时请复制 HTTPS 地址到 Scripting 导入，而不是复制 GitHub 文件展示页。

同名覆盖更新前不要先删除旧项目。固定地址提供新版包，**不代表系统会自动更新**；自动更新是否启用以 Scripting 内的远程资源设置为准。


## ① 安装到 Scripting

**[点击下载武胜公交](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/wusheng-bus/packages/wusheng-bus.scripting)**

下载后点分享 → 选择 **Scripting** → 导入。已安装时覆盖同名脚本，不要先删除旧脚本。

复制下载地址：
```text
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/wusheng-bus/packages/wusheng-bus.scripting
```

## ② 添加圈 X 抓取订阅

**[打开圈 X 订阅配置](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/wusheng-bus/subscriptions/Wusheng-Bus-Login.conf)**

复制下面完整地址 → 打开 **Quantumult X（圈 X）→ 设置 → 重写 → 资源 → 添加** → 粘贴到资源 URL → 保存。关闭资源解析器；启用重写、MITM，安装并完全信任其证书。

```text
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/wusheng-bus/subscriptions/Wusheng-Bus-Login.conf
```

## ③ 登录并导入

1. 圈 X 中安装并启用 BoxJS；已装过就跳过。[BoxJS 官方安装说明](https://github.com/chavyleung/scripts/tree/master/box)。
2. 打开微信里的武胜公交小程序，完成本人登录或手机号授权，触发登录抓取。
3. 回 Scripting 运行「武胜公交」，到账号页点 **从 BoxJS 导入**。导入完成后关闭抓取订阅。
4. 长按桌面添加 **Scripting 小组件**，选择「武胜公交」。普通公交组件参数留空，桌面亮码填 `乘车码`。

---

## 开发文件（普通使用不用打开）

[源码](source/) · [配套抓取](capture/) · [全部订阅](subscriptions/) · [历史安装包](packages/) · [测试](tests/)

旧版链接继续保留兼容；新用户使用上方两个直接地址即可。不要把本人 Cookie、Token 或乘车码发到仓库或聊天。

## 组件参数与边界

- 普通公交 / 行程组件：参数留空。
- 独立桌面乘车码：参数填 `乘车码`。
- 地点搜索和公交匹配不等同于高德道路导航，地图按站序示意。
- iOS 决定组件刷新时间；不可依赖它做准时下车报警。
- 彩色码先验证识别内容一致，失败回退黑白原图；实际公交机兼容性仍需实测。

## 隐私

仅用于本人账户和只读查询。不要公开 Cookie、登录 Token、BoxJS 数据或乘车码。
