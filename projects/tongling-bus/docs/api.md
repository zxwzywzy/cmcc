# 铜陵公交公开乘客接口

核实日期：2026-11-19。由用户提供的公众号入口读取公开页面脚本，再按实际声明的请求验证，不猜测后台管理路径。

```text
https://wx.tlgjzgs.com/Interact/touchscreen/MenuLeft?parentId=2&code=000001&systemType=2&domainId=false
```

公共前缀：`https://wx.tlgjzgs.com/Interact/TouchScreen/`。POST 使用 UTF-8 表单编码，不是 JSON 请求体。所有本次样例均未发送 Cookie 或 Authorization。

| 路径 | 方法、参数 | 能力 |
| --- | --- | --- |
| `GetLineInfoByLine` | POST `lineName`、`domainId=false` | 线路 ID、方向、首末站、首末班时间 |
| `GetLineStationGpsData` | GET `lineid`、`direction`、`domainId=false` | 站序、车辆当前站点 ID、车牌、运营标志 |
| `GetStationName` | POST `stationName`、`domainId=false` | 站名候选 |
| `GetLineInfosByStation` | POST `stationName`、`domainId=false` | 途经站点的线路与方向 |
| `GetLinePlanInfos` | GET `lineid`、`direction`、`domainId=false` | 下趟始发计划 `SendTime`，不等同于预计到站 |
| `GetTransferInfo` | POST `startStationName`、`endStationName`、`domainId=false` | 乘车方案；实测直达样例成功，尚未验证真实换乘样例 |
| `getNotice` | GET | 通知 HTML；没有直接嵌入应用页面 |

最近完整研究样本：170 条线路方向记录，85 个不同线路 ID。1 路 `446` 方向 1 有 47 个站点；2 路 `466` 方向 1 有 21 个站点，均查到运营车辆。数字随运营与数据维护变化。

车辆响应中的 `CurrentStationId` 是站点位置。样例没有车辆经纬度、速度、定位时间或到离站事件；`CurrentStationVehicleCount` 不解释为车内人数。“恒大绿洲”相关响应抽查的 391 条站点记录经纬度均为 0。不能据此提供精确 GPS、距离米数、自动最近站台或分钟预测。

应用只接入前四个接口用于线路、站点和车辆展示；其他接口属于研究验证结果，不代表都已提供界面功能。没有接入微信授权、支付、账户余额、订单或后台管理系统。

只读复核程序见 `../tools/probe.py`，没有持续轮询、登录或支付请求。原始页面和无关业务元数据不随安装包发布。
