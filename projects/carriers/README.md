# 运营商组件

移动、联通、电信、广电余量查询与桌面组件。本目录集中此项目的源码、订阅、抓取文件、安装包及说明，不包含其他 App 或小程序脚本。

| 内容 | 目录 |
|---|---|
| Scripting 源码 | [source/](source/) |
| 圈 X 配置 / BoxJS | [subscriptions/](subscriptions/) |
| 配套抓取脚本 | [capture/](capture/) |
| 安装包及历史版本 | [packages/](packages/) |
| 测试 | [tests/](tests/) |

## 使用入口

- [下载运营商组件](packages/carriers.zip)
- [圈 X 抓取订阅](subscriptions/Carrier-Hub-Cookie.conf)
- [广电配置](subscriptions/ChinaBroadnet-App-Cookie.conf)

## 兼容旧地址

原 `scripting/`、`scripts/`、`packages/` 及根目录配置暂时保留为旧地址兼容，不是其他独立项目。新项目入口以本目录为准。现有安装无需重配；更新源码、打包时也要维护这些旧入口。测试暂仍从原仓库根目录按 `package.json` 运行，避免改变既有路径。
