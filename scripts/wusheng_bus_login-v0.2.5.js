// Quantumult X: capture this mini-program's profile-query authorization locally.
// No requests are sent; no login code, phone, card data or ride code is retained.
(function(){
 const KEY='wusheng_bus_login_v1';
 try{
  if(typeof $response!=='undefined')return;
  if(!/^https:\/\/wsapi\.wskyzx\.com:26110\/api\/WechatInfo\/GetUserInfo(?:\?|$)/i.test(String($request.url||'')))return;
  const headers=$request.headers||{},name=Object.keys(headers).find(k=>k.toLowerCase()==='authorization');
  const authorization=name?String(headers[name]).trim():'';
  if(!/^Bearer [^\r\n]{16,32768}$/.test(authorization))return;
  const raw=typeof $request.body==='string'?$request.body:'';
  if(!raw||raw.length>65536)return;
  // Preserve numeric userId values above JavaScript's safe integer range.
  const body=JSON.parse(raw.replace(/([{,]\s*"userId"\s*:\s*)(\d{1,24})(?=\s*[,}])/g,'$1"$2"'));
  const userId=typeof body.userId==='string'?body.userId:'';
  if(!/^\d{1,24}$/.test(userId))return;
  let previous;try{previous=JSON.parse($prefs.valueForKey(KEY)||'null')}catch(_){}
  const saved=$prefs.setValueForKey(JSON.stringify({version:1,authorization,userId,capturedAt:Date.now()}),KEY);
  if(saved&&(!previous||previous.authorization!==authorization||previous.userId!==userId))$notify('武胜公交 · 授权已抓取','','回到 Scripting，点击“从圈 X 导入登录”。验证成功后可关闭本抓取订阅。');
 }catch(_){}finally{$done({})}
})();
