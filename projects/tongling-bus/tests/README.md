# 测试

自动测试放在安卓标准目录 [app/src/test](../source/app/src/test/)。测试剩余站数排序、已过站车辆、非运营车辆、未知站点、环线歧义、换向身份及快照序列化，不用固定车辆名单充当在线成功。

在源码目录运行 `gradlew.bat :app:testDebugUnitTest :app:lintDebug`。构建和测试不能代替小米 15 的安装、桌面点击与后台刷新实测，具体边界见 [验证记录](../docs/validation.md)。
