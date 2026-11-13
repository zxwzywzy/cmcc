// Local-only login capture. A ride-code REQUEST supplies only auth + userId;
// no ride-code response, phone grant body or full profile is saved or replayed.
(function(){
 const KEY='wusheng_bus_login_v1',DIAG='wusheng_bus_login_diag_v1',VERSION='0.2.6';
 function report(state){
  let old;try{old=JSON.parse($prefs.valueForKey(DIAG)||'null')}catch(_){}
  const now=Date.now(),notify=!old||old.version!==VERSION||!old.notifiedAt||now-old.notifiedAt>60000||state==='captured'&&old.state!=='captured';
  const row={version:VERSION,state,time:now,notifiedAt:notify?now:old.notifiedAt};
  $prefs.setValueForKey(JSON.stringify(row),DIAG);
  if(!notify)return;
  const notes={captured:'回 Scripting 点击“从圈 X 导入登录”，验证成功后关闭抓取订阅。','missing-auth':'已命中公交请求，但尚无登录 Token。请在微信武胜公交正常登录后重试。','missing-user':'已命中公交请求，但缺少用户标识。请重新进入微信乘车码或消费记录页面。','invalid-body':'已命中公交请求，但未读到预期字段。请到 Scripting 检查抓取状态。','login-unready':'已命中登录响应，但登录授权尚未完整。请在微信完成登录。','save-failed':'已命中完整授权，但圈 X 本地保存失败，请检查圈 X。'};
  $notify(state==='captured'?'武胜公交 · 授权已抓取':'武胜公交 · 抓取诊断','',notes[state]||'已命中公交请求，请到 Scripting 检查抓取状态。');
 }
 function parse(raw){
  if(typeof raw!=='string'||!raw||raw.length>65536)throw Error();
  return JSON.parse(raw.replace(/([{,]\s*"userId"\s*:\s*)(\d{1,24})(?=\s*[,}])/g,'$1"$2"'));
 }
 function auth(value){
  if(typeof value!=='string')return '';
  const match=/^Bearer\s+([^\r\n]{16,32768})$/i.exec(value.trim());
  return match?'Bearer '+match[1]:'';
 }
 function identity(value){return typeof value==='string'&&/^\d{1,24}$/.test(value)?value:''}
 try{
  const match=/^https:\/\/wsapi\.wskyzx\.com:26110(\/api\/(?:WechatInfo\/(?:GetUserInfo|GetPhoneNumber)|AppBusiness\/(?:GetPayRrcode|GetConsumedAndRechargeRecord)))(?:\?|$)/i.exec(String($request.url||''));
  if(!match)return;
  const path=match[1].toLowerCase(),response=typeof $response!=='undefined',login=path==='/api/wechatinfo/getphonenumber';
  if(response!==login)return;
  let authorization='',userId='';
  if(login){
   let body;try{body=parse($response.body)}catch(_){report('invalid-body');return}
   if(body.code!==0||!body.data||typeof body.data.token!=='string'){report('login-unready');return}
   authorization=auth(/^Bearer\s/i.test(body.data.token)?body.data.token:'Bearer '+body.data.token);userId=identity(body.data.userId);
   if(!authorization||!userId){report('login-unready');return}
  }else{
   const headers=$request.headers||{},name=Object.keys(headers).find(k=>k.toLowerCase()==='authorization');authorization=auth(name?String(headers[name]):'');
   if(!authorization){report('missing-auth');return}
   const raw=$request.body;
   try{
    if(typeof raw==='string'&&raw.trim().startsWith('{'))userId=identity(parse(raw).userId);
    else if(typeof raw==='string'&&raw.length<=65536){const field=/(?:^|&)userId=([^&]*)/.exec(raw);if(field)userId=identity(decodeURIComponent(field[1]))}
   }catch(_){report('invalid-body');return}
   if(!userId){report('missing-user');return}
  }
  if(!$prefs.setValueForKey(JSON.stringify({version:1,authorization,userId,capturedAt:Date.now()}),KEY)){report('save-failed');return}
  report('captured');
 }catch(_){}finally{$done({})}
})();
