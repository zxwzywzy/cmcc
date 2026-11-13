# 武胜公交小程序接口复核

核对日期：2026年11月14日。依据为用户电脑已提取的小程序缓存版本39；本机目前只见版本39，不代表平台线上最新版本。共找到 **48 个字面量 HTTP 业务路径和 1 个实时车辆 WebSocket 通道**。这里只检查客户端实际引用的接口，不代表服务器全部能力。

## 本次实测可用的公开查询

以下 HTTP 查询均未携带登录信息，实际收到 HTTP 200、业务 code=0。附近站台和站名搜索使用公共测试坐标，不是用户实时位置。数量是本次响应，不是永久库存。

| 能力 | 接口尾名 | 本次结果 | 可接入的功能 |
|---|---|---|---|
| 公交线路 | GetBusLine | 38条 | 线路选择、上下行首末班时间；票价字段需再核对单位与含义 |
| 附近站台 | GetBusStations | 5个测试站台 | 最近站台、距离、本站线路 |
| 站名搜索 | GetStationsByName | 2个匹配站台 | 手动搜索、选择候车站 |
| 站台经过线路 | GetBusLineByStationsId | 返回站台和线路结构 | 查看任意站台的经过线路，不局限当前位置 |
| 公交公告 | GetBusNotice | 类型1有1条，类型2有0条 | 运营公告、服务通知；本次0条不等于接口失败 |
| 定制班线 | GetBusCustomizedShuttle | 1条 | 定制线路、时间、服务信息查询 |
| 定制班线站点 | GetLineStationsByLId | 1个站点 | 查看定制线路站点；参数csId，不是普通lineId |
| 失物招领 | GetBusPhysicalRecovery | 0条 | 失物查询；当前无记录 |
| 包车信息 | GetBusCharterCar | 1个分类 | 包车车型与服务信息查询 |

已接入且此前实测的普通线路站点接口是 GetBusLineStationsByLId，使用 lineId + direction。101路上下行各49个站点；26路曾返回44个站点。

GetBusLine 的38条线路均有 sTimeUp/eTimeUp/sTimeD/eTimeD 等首末班字段，36条具有非空 price；价格仍需结合页面核对，不能擅自按分或元转换。lineTracks 虽在字段结构里存在，本次38条均为空，因此没有可直接使用的道路级轨迹，当前地图仍是站点连线示意。

## 实时车辆与本次显示问题

实时车辆来自 `wss://wsdata.wskyzx.com:25790/ws`。发送 lineId 与 upOrDown 数组，返回数组中可见 stationNo、stationName、bizType、speed、lat、lng 等字段。服务器确实能返回车辆；本次一条101双方向订阅返回3条车辆记录，文本帧。

0.4.1修复了 lat/lng 字段识别，但用户截图显示“实时车辆通道暂不可用”，属于手机连接或接收阶段的问题，不能用电脑成功连接代替手机验证。0.4.2补充全局/模块接口兼容、原生Data消息解析、分阶段超时与错误提示，并保证车辆失败时仍展示线路站点和地图。可在设置里点“检查实时车辆连接”，直接核对手机端结果。

本次复核的客户端业务路径中，没有发现已证实可替代该通道的 HTTP 实时车辆查询。`GetCarInfo` 实际接收 NFC 读取字节、readType、userId，用于实体公交卡读取流程，不能当作实时公交车辆接口使用。

## 需要本人登录的功能

| 能力 | 已见接口 | 状态与边界 |
|---|---|---|
| 账号及余额 | GetUserInfo | 已接入、此前本人授权查询成功；cardCashfee按已验证的分换元 |
| 乘车扣费和充值历史 | GetConsumedAndRechargeRecord | 已接入，只查本机登录账号；searchType区分分支 |
| 乘车码 | GetPayRrcode | 已接入，仅用户点击时请求；本次接口复核没有获取新码 |
| 收藏线路、站台 | GetCollectBusLine / GetCollectStations | 源码调用携带本人userId，可考虑接入；本次未读取个人收藏 |
| 本人反馈记录 | GetComplaints | 源码存在查询，接入前需补齐页面参数与分页验证 |
| 家庭账号及关联消费 | GetFamilyAccount / GetBindingBusConsumeRecord | 存在相关流程，涉及关联账号，尚未接入或实测 |
| NFC充值、年审记录 | GetNfcRechargeRecord / GetNfcAnnualAuditRecord | 存在对应页面，需要本人账号及实际卡片流程 |

登录仍是微信 wx.login 的临时code交换，再通过微信手机号授权获得账号令牌；没有找到经过验证的独立短信验证码登录接口。不能把微信一次性code当作长期登录Cookie。

## 仅识别、未执行的操作

源码还包含收藏变更、账号绑定/解绑、反馈提交、充值支付、退款、个人资料更新、图片上传和实体卡年审/写卡等接口。此次未发起这些操作。

NFC相关的 GetKeys、GetBuildWriteData、GetPeriodValidityData 会参与密钥或写卡数据流程；不能因为名称带 Get 就视为普通只读查询。现有代码还把相应MifareClassic流程标为iOS不支持，不能宣称Scripting可以直接复刻实体卡读写。

## 建议接入顺序

先解决手机车辆通道并保留站点图；随后接入站名搜索、任意站台线路和首末班时间。之后可加入公告及本人收藏。定制班线、包车、失物查询可放在独立服务页面，避免挤占候车主界面。

## 证据与范围

- 本次静态检查基于缓存版本39的已提取JavaScript，原包和用户登录数据均不发布。
- REA证据：ev_648edaec3b1bff7e62b7f429bd30c58429b960902737e869d1dd5d14c97b7759；聚焦的5个请求封装文件成功解析，静态关系不等于运行结果。
- 字面量路径和页面参数另从完整app-service.js核对；动态生成的未知路径不在48个统计之内。
- 下方清单只列路径，不含账号、授权、手机号、卡号、订单、乘车码或服务器响应原文。

## 完整路径清单

- `/api/AppBusiness/AddComplaints`
- `/api/AppBusiness/ApplyRefund`
- `/api/AppBusiness/BindingApplication`
- `/api/AppBusiness/BindingOperation`
- `/api/AppBusiness/BindingOperationDel`
- `/api/AppBusiness/CancelApplyRefund`
- `/api/AppBusiness/ConfirmRefund`
- `/api/AppBusiness/GetBindingBusConsumeRecord`
- `/api/AppBusiness/GetBuildWriteData`
- `/api/AppBusiness/GetBusAdvertisingManagement`
- `/api/AppBusiness/GetBusCharterCar`
- `/api/AppBusiness/GetBusCustomizedShuttle`
- `/api/AppBusiness/GetBusLine`
- `/api/AppBusiness/GetBusLineByStationsId`
- `/api/AppBusiness/GetBusLineStationsByLId`
- `/api/AppBusiness/GetBusNfcCardRecord`
- `/api/AppBusiness/GetBusNotice`
- `/api/AppBusiness/GetBusPhysicalRecovery`
- `/api/AppBusiness/GetBusStations`
- `/api/AppBusiness/GetCarInfo`
- `/api/AppBusiness/GetCollectBusLine`
- `/api/AppBusiness/GetCollectStations`
- `/api/AppBusiness/GetComplaints`
- `/api/AppBusiness/GetConsumedAndRechargeRecord`
- `/api/AppBusiness/GetFamilyAccount`
- `/api/AppBusiness/GetKeys`
- `/api/AppBusiness/GetLineStationsByLId`
- `/api/AppBusiness/GetNfcAnnualAuditRecord`
- `/api/AppBusiness/GetNfcRechargeRecord`
- `/api/AppBusiness/GetPayRrcode`
- `/api/AppBusiness/GetPeriodValidityData`
- `/api/AppBusiness/GetStationsByName`
- `/api/AppBusiness/LineCollection`
- `/api/AppBusiness/SearchFamilyAccount`
- `/api/AppBusiness/SubmitAnnualAudit`
- `/api/AppBusiness/UploadAnnualAuditRecords`
- `/api/AppBusiness/UploadAuditImg`
- `/api/AppBusiness/UploadImg`
- `/api/AppBusiness/UploadRechargeRecords`
- `/api/AppBusiness/UploadRechargeRecordsNew`
- `/api/WechatInfo/GetPhoneNumber`
- `/api/WechatInfo/GetUserInfo`
- `/api/WechatInfo/LoginNew?code=`
- `/api/WechatInfo/OrderQuery?out_trade_no=`
- `/api/WechatInfo/UpdateUserInfo`
- `/api/WechatInfo/UploadImg`
- `/api/WechatInfo/WxPayMent`
- `/api/WechatInfo/WxPayMentNfc`
