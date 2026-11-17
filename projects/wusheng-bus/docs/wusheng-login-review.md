# 武胜公交手机号登录复核

日期：2026年11月16日。范围：本机当前仅有的小程序缓存版本39，重点为pages/Login/index.js、pages/Login copy/index.js和api/mine.js。这里只读取客户端代码，未发送短信、登录请求或重放授权包。

## 观察到的实际登录流程

1. 用户在微信小程序中点击手机号授权按钮。
2. 客户端调用wx.login，取得微信产生的临时code。
3. 调用POST /api/WechatInfo/LoginNew?code=...，使用返回的openId、sessionBag、token和userId。这里的code不是短信验证码。
4. wx.checkSession检查微信登录会话。
5. 从微信手机号授权事件取得iv和encryptedData，调用POST /api/WechatInfo/GetPhoneNumber，字段为aesIv、encryptedData、sessionKey（来自sessionBag）及openId。
6. 成功后保存服务端返回的本人token，通过GetUserInfo读取本人资料。

旧版Login copy页面的会话返回结构略有不同，但同样依赖wx.login及微信手机号授权数据，不能作为独立短信登录证据。

## 是否能在Scripting直接输入手机号登录

当前检查的客户端没有发现手机号输入加短信验证码的登录实现，也没有发现验证码、短信、sendSms、smsCode、verifyCode或SendCode等对应调用。GetPhoneNumber需要微信会话与手机授权事件的数据，不是只填手机号就能取得账号Token的接口。

因此目前没有证据足以实现可用的独立手机号/短信登录。微信环境中的授权步骤不能在Scripting里用虚构code或已有小程序Token替代。若运营方后续提供独立登录接口和正常授权流程，才可以据其规则接入；当前不能断言服务器绝对不存在其他接口。

## 保留的登录方式

圈X抓取订阅保持0.2.7。现有规则已覆盖GetPhoneNumber成功响应，并兼容本人资料、消费记录或乘车码请求的授权字段。只保存规范化Bearer和精确userId，不保存手机号授权请求体、sessionBag、encryptedData、iv或乘车码响应。

操作仍为：启用抓取→在微信武胜公交完成手机号授权或访问已有授权业务页→回Scripting账号页从BoxJS导入。Scripting先验证本人账号查询，再保存到本机Keychain；验证失败不覆盖原登录。不需要账号文件，也没有新增自动发短信、代授权或账号绑定操作。

## 本次应用改动

0.5.1移除换乘规划和全部车辆地图，恢复原实时公交入口，保留线路详情地图、组件样式、余额、订单、车牌、后续到站时间和现有抓取登录。没有添加不可用的手机号登录入口。

参考：微信官方小程序登录说明、手机号授权说明；本报告的应用专属字段来自上述缓存代码，不是官方公开的公交登录协议。
