# 接口依据与实现范围

- 移动：用户提供的 MaYIHEI Scripting CMCC 2.1.2 包，https://www.imarkr.com/api/github/download/MaYIHEI/patch/scripting/cmcc.zip 。保留其 mobile/api.ts、crypto.ts、数据存储和样式，原版源码保存在 mobile/。上游许可证为 LICENSE-upstream。
- 联通：https://github.com/dompling/Scriptable/blob/master/Scripts/ChinaUnicom.js 。GET queryUserInfoSeven.htm，成功 code=Y，data.dataList 中 type=fee/flow/voice、number、unit、remainTitle。本实现只接收可明确解释的单位及剩余标签，不构造未知总量，不复用上游登录代码。
- 电信：https://github.com/Cp0204/ChinaTelecomMonitor/blob/main/telecom_class.py 。qryImportantData 的 responseData.resultCode=0000；indexBalanceDataInfo.balance 原值为元，commonFlow.balance 为 KB，voiceDataInfo.balance 为分钟。只用字段结构编写适配器，不复用上游登录代码。
- 广电：https://github.com/wuhuhuuuu/study/blob/main/Scripts/ChinaBroadnet/ChinaBroadnet.panel.js 。小程序 qryUserInfo 的 status=000000；data.userData.fee 为分、flow 为 KB、voice 为分钟。App 同路径及结构尚未证明；仅在实际返回符合结构时保存。
- Scripting：https://scriptingapp.github.io/guide/Script/Script 。本机界面与小组件使用用户提供包中已有的 Scripting 控件和 API。

只有移动沿用已有续登逻辑。另三家不执行密码登录、不发送验证码、不续登、不签到；保存官方查询请求后按白名单原地址重查，失败则展示明确标记的旧数据。请求阶段与响应阶段关联失败时只保存已解析的快照，不猜测查询正文。

新解析器和抓取桥接均为本次编写，未将任何账户凭据写进源代码。模拟用例只使用合成数据。不宣称已完成运营商或 iOS 真机验证。

新增联通来源（用户指定）：https://github.com/Nanako718/Scripting/blob/main/Quantumult%20X/10010_cookie.conf 及其 js/10010_cookie.js 的 URL/存储键约定；查询字段参考 https://github.com/Nanako718/Scripting/blob/main/scripts/联通/widget.tsx 。仅依据接口结构独立实现适配，未复制其固定示例手机号。

0.2.0 共享布局为本仓库独立适配，参照用户提供的移动全景视觉结构，并复用保留来源的 Root、Num、Bar 等基础组件。品牌区分使用系统符号和独立配色，不新增官方 Logo 素材。

0.2.1 独立实现的字段与协议参考：
- 联通积分：首页 data.dataList 的 type=point，见 https://github.com/anker1209/Scriptable/blob/main/scripts/ChinaUnicom_2024.js 。不执行其脚本或记录其日志。
- 联通资源明细：resources[].details 的 feePolicyName/addUpItemName、use/total/remain，见 https://github.com/Nanako718/Scripting/blob/main/scripts/%E8%81%94%E9%80%9A/widget.tsx 。顶层 packageName 按可选字段处理；不推测套餐名称。
- 电信 App 鉴权结构与只读查询：headerInfos.token 和 content.fieldData，见 https://github.com/Cp0204/ChinaTelecomMonitor/blob/main/telecom_class.py 。只重用用户自己抓取的完整只读请求，不实现其密码登录、加密、续登流程。
- 旧电信网页路径的历史参考：https://github.com/anker1209/Scriptable/blob/main/scripts/ChinaTelecom_2024.js 。本次未登录实测旧页面跳转 https://e.dlife.cn/portal/web/index.html ；主脚本来自 https://static.e.189.cn/portal/web/assets/index-Bg9jNuid.js ，静态检查主文件未找到旧套餐/余额路径；未覆盖懒加载模块或登录后的网络，因此不宣称已适配新门户，也不向用户提供旧网页抓取规则。

0.2.2 电信密码登录的协议与公钥参考用户提供的 ScriptingApp/Community-Scripts 的“电信小组件.scripting”内 util/telecom.ts：https://github.com/ScriptingApp/Community-Scripts/blob/main/%E7%94%B5%E4%BF%A1%E5%B0%8F%E7%BB%84%E4%BB%B6.scripting 。本仓库独立实现请求、Keychain 保存、错误处理及有限重登；修正原参考北京时间计算、语音已用/剩余显示和混合单位进度的问题，不复制其中密码存入 Storage 的行为。
RSA 使用官方 npm jsencrypt 3.3.2 的 ESM 源码打包，来源 https://github.com/travist/jsencrypt ，MIT 许可证保留于 vendor/LICENSE-jsencrypt.txt；无运行时远程代码下载。用户截图是账号列表和详情界面的视觉依据，沿用原移动组件的原生列表、Page/Group/InfoRow。
