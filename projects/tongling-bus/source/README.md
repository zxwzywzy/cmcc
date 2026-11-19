# 安卓源码

原生 Kotlin、Jetpack Compose Material 3 与 RemoteViews 桌面组件，无登录与支付接口。

开发环境：JDK 21、Android SDK 36、Gradle 8.14.3（Wrapper）、Android Gradle Plugin 8.13.0、Kotlin 2.2.20。最低 Android API 26，目标 API 35。

设置 `ANDROID_HOME`，或在本目录创建不提交到 Git 的 `local.properties`，填写 Android SDK 路径。执行：

```powershell
.\gradlew.bat :app:assembleDebug :app:testDebugUnitTest :app:lintDebug
```

调试 APK 在 `app/build/outputs/apk/debug/`。检查测试结果在 `app/build/reports/`。

发布构建使用本机环境变量 `TONGLING_KEYSTORE`、`TONGLING_STORE_PASSWORD`、`TONGLING_KEY_PASSWORD`，密钥别名为 `tongling`。配置后运行 `:app:assembleRelease :app:lintRelease`；没有签名配置时仅生成未签名发布包，不可当成可安装版本上传。不要提交密钥、密码、`local.properties` 或构建缓存。

网络层仅请求公开的乘客查询路径，不设置 Cookie 或 Authorization。模型只保留组件需要的字段；运营方响应里的组织、创建者等无关字段不落盘。用户收藏和快照存在应用私有存储，关闭系统应用备份。

主要入口：`MainActivity.kt`（界面与选择流程）、`BusApi.kt`（公开查询）、`Model.kt`（站序与剩余站数）、`BusWidgets.kt`（三种组件）、`Background.kt`（限时前台刷新与周期任务）。
