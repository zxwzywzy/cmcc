# 安装包

## 固定下载入口

- [铜陵候车 · 安卓 APK](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/tongling-bus/packages/tongling-bus.apk)
- [铜陵候车 · 源码 ZIP](https://raw.githubusercontent.com/zxwzywzy/cmcc/main/projects/tongling-bus/packages/tongling-bus-source.zip)
- [版本索引](latest.json) · [SHA-256 校验清单](SHA256SUMS.txt)

固定名称用于后续覆盖更新；带版本号文件为历史快照，保留不删除。APK 直接在安卓安装，不导入 Scripting。

## 历史版本

- [0.1.0 安卓 APK（预览版）](tongling-bus-0.1.0.apk)
- [0.1.0 源码 ZIP](tongling-bus-0.1.0-source.zip)

应用 ID：`com.zxwzywzy.tonglingbus`。最低 Android 8.0 / API 26。正式签名证书 SHA-256：

```text
75c0b469c1338b53f8aa8f825ddeff2116273e424a0e513c77e406619803b2c2
```

这是公钥证书指纹，不是 APK 文件校验值。文件校验请查看 `SHA256SUMS.txt`。签名私钥和密码不公开；后续版本应保持同一签名，安装时同名覆盖，不先卸载。

目前已完成源码构建、签名校验与自动测试。小米 15 的界面、启动器组件、微信切换和后台调度仍需真机验证，详见 [验证范围](../docs/validation.md)。
