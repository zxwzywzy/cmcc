/**
 * 中国广电 App / Quantumult X — experimental local credential capture.
 * App endpoint family is inferred, not verified on-device.
 * Reference for mini-program credential fields (not App compatibility proof):
 * https://github.com/wuhuhuuuu/study/blob/main/Scripts/ChinaBroadnet/ChinaBroadnet.cookie.js
 * Stores only locally; never logs secrets, uploads data, or initiates requests.
 * No automatic sign-in task. Latest captured account replaces the previous one.
 */
(function () {
  const KEY = 'china_broadnet_app_capture_v1';
  const NOTICE = 'china_broadnet_app_capture_notice_v1';
  function notify(message) { $notify('中国广电 App 抓取（试用）', '', message); }
  try {
    if (typeof $request === 'undefined') return;
    const url = String($request.url || '');
    if (!/^https:\/\/app\.10099\.com\.cn\/contact-web\/api\/busi\//i.test(url)) return;
    const headers = {};
    Object.keys($request.headers || {}).forEach(k => { headers[k.toLowerCase()] = String($request.headers[k]); });
    const credentials = {};
    ['access', 'authorization', 'cookie', 'token', 'access-token', 'x-access-token'].forEach(k => {
      if (headers[k] && headers[k].trim()) credentials[k] = headers[k];
    });
    if (!Object.keys(credentials).length) {
      if (!$prefs.valueForKey(NOTICE)) {
        notify('已命中业务请求，但未发现已知鉴权字段。没有保存；当前 App 可能需要进一步适配。');
        $prefs.setValueForKey('1', NOTICE);
      }
      return;
    }
    // Keep only business API payload; explicitly skip names associated with login/OTP/password.
    if (/(?:login|password|passwd|verifycode|smscode|sendSms|resetPwd)/i.test(url.split('?')[0])) return;
    let body = typeof $request.body === 'string' ? $request.body : '';
    if (body.length > 262144) {
      notify('请求体超过试用版保存上限，未保存。');
      return;
    }
    // Do not retain a business request if it unexpectedly contains login credentials.
    if (/(?:"|&|^)(?:password|passwd|smsCode|verifyCode|verificationCode)(?:"|=)/i.test(body)) return;
    const context = {};
    ['content-type', 'user-agent', 'referer', 'origin'].forEach(k => { if (headers[k]) context[k] = headers[k]; });
    const data = { version: 1, source: 'ChinaBroadnet App (experimental)', url,
      method: String($request.method || 'POST'), credentials, headers: context, body };
    const previous = $prefs.valueForKey(KEY);
    let unchanged = false;
    if (previous) {
      try {
        const p = JSON.parse(previous);
        unchanged = JSON.stringify(p.credentials) === JSON.stringify(credentials) && p.body === body && p.url === url;
      } catch (_) {}
    }
    if (unchanged) return;
    data.capturedAt = new Date().toISOString();
    if (!$prefs.setValueForKey(JSON.stringify(data), KEY)) { notify('本地保存失败，请检查圈 X 存储。'); return; }
    notify('已保存鉴权请求到圈 X 本地。尚未验证登录有效性；请关闭抓取订阅。');
  } catch (_) {
    notify('处理失败，未输出敏感数据。当前 App 可能需要进一步适配。');
  } finally { $done({}); }
})();
