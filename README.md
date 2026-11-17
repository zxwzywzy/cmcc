# 两个项目，直接安装

| 项目 | 第一步：Scripting 安装包 | 第二步：圈 X 抓取订阅 | 新手教程 |
|---|---|---|---|
| 运营商组件 | [下载组件](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/carriers/packages/carriers.zip) | [复制订阅地址](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/carriers/subscriptions/Carrier-Hub-Cookie.conf) | [三步安装](projects/carriers/) |
| 武胜公交 | [下载组件](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/wusheng-bus/packages/wusheng-bus.scripting) | [复制订阅地址](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/wusheng-bus/subscriptions/Wusheng-Bus-Login.conf) | [三步安装](projects/wusheng-bus/) |

**Scripting：**下载上表安装包 → 分享到 Scripting → 导入同名项目。

**圈 X：**复制对应订阅地址 → 设置 → 重写 → 资源 → 添加；关闭解析器，开启重写和 MITM 并信任证书。BoxJS 按[官方指引](https://github.com/chavyleung/scripts/tree/master/box)安装。

**最后：**按项目教程触发本人登录抓取 → 回脚本账号页「从 BoxJS 导入」→ 关闭抓取订阅 → 添加桌面组件。

源码、配置、抓取和安装包都按项目放在 `projects/carriers/`、`projects/wusheng-bus/`，旧路径仅为兼容，不用到处寻找文件。
