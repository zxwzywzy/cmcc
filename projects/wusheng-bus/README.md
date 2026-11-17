# 武胜公交

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
