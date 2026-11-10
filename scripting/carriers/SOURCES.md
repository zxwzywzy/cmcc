# 接口依据与实现范围

- 移动：用户提供的 MaYIHEI Scripting CMCC 2.1.2 包，https://www.imarkr.com/api/github/download/MaYIHEI/patch/scripting/cmcc.zip 。保留其 mobile/api.ts、crypto.ts、数据存储和样式，原版源码保存在 mobile/。上游许可证为 LICENSE-upstream。
- 联通：https://github.com/dompling/Scriptable/blob/master/Scripts/ChinaUnicom.js 。GET queryUserInfoSeven.htm，成功 code=Y，data.dataList 中 type=fee/flow/voice、number、unit、remainTitle。本实现只接收可明确解释的单位及剩余标签，不构造未知总量，不复用上游登录代码。
- 电信：https://github.com/Cp0204/ChinaTelecomMonitor/blob/main/telecom_class.py 。qryImportantData 的 responseData.resultCode=0000；indexBalanceDataInfo.balance 原值为元，commonFlow.balance 为 KB，voiceDataInfo.balance 为分钟。只用字段结构编写适配器，不复用上游登录代码。
- 广电：https://github.com/wuhuhuuuu/study/blob/main/Scripts/ChinaBroadnet/ChinaBroadnet.panel.js 。小程序 qryUserInfo 的 status=000000；data.userData.fee 为分、flow 为 KB、voice 为分钟。App 同路径及结构尚未证明；仅在实际返回符合结构时保存。
- Scripting：https://scriptingapp.github.io/guide/Script/Script 。本机界面与小组件使用用户提供包中已有的 Scripting 控件和 API。

只有移动沿用已有续登逻辑。另三家不执行密码登录、不发送验证码、不续登、不签到；保存官方查询请求后按白名单原地址重查，失败则展示明确标记的旧数据。请求阶段与响应阶段关联失败时只保存已解析的快照，不猜测查询正文。

新解析器和抓取桥接均为本次编写，未将任何账户凭据写进源代码。模拟用例只使用合成数据。不宣称已完成运营商或 iOS 真机验证。
