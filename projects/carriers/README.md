# 运营商组件

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
