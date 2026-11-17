# Scripting 生活组件

目前维护两个独立项目，圈 X 配置、配套抓取、安装包与说明都放在各自项目内。

## 运营商组件

移动、联通、电信、广电余额与套餐余量，支持多种桌面布局。从本机 BoxJS 导入本人账号。新增运营商适配为试用版本。

[项目介绍与安装教程](projects/carriers/)

**Scripting 远程导入地址：**
```text
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/carriers/packages/carriers.zip
```
**圈 X 重写订阅地址：**
```text
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/carriers/subscriptions/Carrier-Hub-Cookie.conf
```

## 武胜公交

实时查车、常用候车站、目的地公交规划、行程组件和主题乘车码。支持桌面确认上车及取码；刷新频率由 iOS 决定。

[项目介绍与安装教程](projects/wusheng-bus/)

**Scripting 远程导入地址：**
```text
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/wusheng-bus/packages/wusheng-bus.scripting
```
**圈 X 重写订阅地址：**
```text
https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/wusheng-bus/subscriptions/Wusheng-Bus-Login.conf
```

## 三步开始

1. **Scripting**：导入远程脚本 → 粘贴项目的安装包 HTTPS 地址 → 导入。或进入项目页使用一键导入链接。
2. **圈 X**：设置 → 重写 → 资源 → 添加对应订阅。关闭解析器、启用 MITM 并完全信任证书；BoxJS 按[官方说明](https://github.com/chavyleung/scripts/tree/master/box)安装。
3. 打开对应 App 触发本人抓取 → 回 Scripting 账号页「从 BoxJS 导入」→ 关闭抓取订阅 → 添加桌面组件。

后续更新继续使用同一安装包地址，同名覆盖，不要先删除旧脚本。仅为下载来源，不承诺自动安装更新。

## 开发目录

`projects/carriers/` 是运营商组件，`projects/wusheng-bus/` 是武胜公交。每个项目内含源码、配置、抓取和安装包。旧路径为订阅兼容保留，不是其他项目。
