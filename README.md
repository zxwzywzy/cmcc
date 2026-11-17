# 我的 Scripting 项目

仓库按项目划分，目前主要维护两个项目。每个项目自己的源码、圈 X 配置、抓取脚本、安装包和文档都放在对应项目目录内。

| 项目 | 项目目录 | 下载 | 配套圈 X 订阅 |
|---|---|---|---|
| 运营商组件 | [打开项目](projects/carriers/) | [下载组件](projects/carriers/packages/carriers.zip) | [运营商抓取](projects/carriers/subscriptions/Carrier-Hub-Cookie.conf) |
| 武胜公交 | [打开项目](projects/wusheng-bus/) | [下载组件](projects/wusheng-bus/packages/wusheng-bus.scripting) | [公交登录抓取](projects/wusheng-bus/subscriptions/Wusheng-Bus-Login.conf) |

## 目录约定

```text
projects/
  carriers/               运营商组件
    source/               源码
    subscriptions/        运营商圈 X 配置
    capture/              运营商配套抓取文件
    packages/             安装包
    tests/                测试
  wusheng-bus/            武胜公交
    source/               源码
    subscriptions/        公交圈 X、BoxJS 配置
    capture/              公交登录及诊断抓取
    packages/             安装包
    docs/                 公交说明
    tests/                测试
```

旧根目录订阅、`scripting/`、`scripts/`、`packages/` 为已有用户保留兼容地址，暂不删除，不再作为首页的项目分类。其他历史 App / 小程序抓取文件未混入以上两个项目，也未删除。根目录 `tools/`、`tests/` 和包管理文件保留既有开发流程。

以后新增项目，使用 `projects/<项目名>/`，将该项目的全部相关文件放进去，而不是另建一个全仓库抓取脚本分类。
