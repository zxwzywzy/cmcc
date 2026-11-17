// China Unicom riskSync Cookie capture for Quantumult X.
// Rule/key contract supplied by DTZSGHNR / Nanako718:
// https://github.com/Nanako718/Scripting/blob/main/Quantumult%20X/10010_cookie.conf
// Independently implemented: one completion callback, no Cookie in logs/notifications.
(function(){
 try{
  if(typeof $request==='undefined'||!/^https:\/\/m\.client\.10010\.com\/mobileserviceNine\/v1\/riskCollection\/riskSync/.test(String($request.url||'')))return;
  const headers=$request.headers||{};
  const key=Object.keys(headers).find(k=>k.toLowerCase()==='cookie');
  const cookie=key?String(headers[key]).trim():'';
  if(!cookie){$notify('中国联通 Cookie','请求已命中，但未包含 Cookie','请登录联通 App 后再刷新首页。');return;}
  if(cookie.length>32768||/[\r\n]/.test(cookie)){$notify('中国联通 Cookie','Cookie 格式异常，未保存','未覆盖原有数据。');return;}
  if($prefs.valueForKey('10010.cookie')===cookie)return;
  const ok=$prefs.setValueForKey(cookie,'10010.cookie');
  $notify('中国联通 Cookie',ok?'Cookie 已保存':'保存失败',ok?'已写入 10010.cookie；请到 Scripting 从 BoxJS 导入。':'请检查圈 X 本地存储。');
 }catch(_){$notify('中国联通 Cookie','处理失败','未输出登录凭据。');}
 finally{$done({});}
})();
