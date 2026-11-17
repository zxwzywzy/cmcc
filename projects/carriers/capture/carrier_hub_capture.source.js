import { endpoint, normalize, safeRequest, names } from '../scripting/carriers/normalizers.js';
const DATA='carrier_hub_v1', PENDING='carrier_hub_pending_v1', DIAG='carrier_hub_diagnostics_v1';
function read(key) {try{return JSON.parse($prefs.valueForKey(key)||'{}');}catch(_){return {};}}
function notify(p,text){$notify(names[p]+' · 运营商小组件','',text);}
function nearby(url){
 if(/^https:\/\/appfuwu\.189\.cn(?::9021)?\/query\//i.test(url))return 'telecom';
 if(/^https:\/\/(?:app|wx)\.10099\.com\.cn\/contact-web\/api\/busi\//i.test(url)&&!/(?:login|password|sms|verify)/i.test(url.split('?')[0]))return 'broadnet';
 if(/^https:\/\/m\.client\.10010\.com\/mobileService\/home\/query/i.test(url))return 'unicom';
 return null;
}
function diagnostic(p,stage,message,status){
 const d=read(DIAG);d.version=1;d.providers=d.providers||{};
 const old=d.providers[p];
 // No query string, header, request/response body or credential is retained here.
 const match=String($request.url).match(/^https:\/\/([^/?#]+)([^?#]*)/);
 const path=match?(match[1]+match[2]).replace(/[A-Za-z0-9_-]{16,}|\d{5,}/g,':id'):'已匹配';
 d.providers[p]={stage,path,time:Date.now(),...(status?{status}:{})};
 $prefs.setValueForKey(JSON.stringify(d),DIAG);
 if(!old||old.stage!==stage||Date.now()-old.time>60000)notify(p,message);
}
function responseStatus(){
 const raw=$response.statusCode??$response.status??200;
 const match=String(raw).match(/\b(\d{3})\b/);return match?Number(match[1]):Number(raw);
}
try {
 const p=endpoint($request.url);
 if(!p){const candidate=nearby(String($request.url||''));if(candidate)diagnostic(candidate,'nearby-query','已看到业务查询流量，但接口尚未适配，未保存余量。请在组件中导入查看诊断。')}
 if(p) {
  const session=String($request.sessionIndex||'');
  if(typeof $response==='undefined') {
   const req=safeRequest($request);
   let authSaved=false;
   if(p==='telecom'&&req?.method==='POST'){
    try{const body=JSON.parse(req.body);if(typeof body.headerInfos?.token==='string'&&body.headerInfos.token.trim())authSaved=$prefs.setValueForKey(JSON.stringify(req),'10000.app.request')}catch(_){}
   }
   if(authSaved)diagnostic(p,'auth-saved','已保存电信 App 鉴权请求（含 Token）。请到 Scripting 账号页从 BoxJS 导入尝试查询；这还不是余量查询成功。');
   else diagnostic(p,'request-seen','已命中查询请求，等待解析响应；这还不是抓取成功。');
   if(req) {
    const pending=read(PENDING), key=p+':'+session;
    pending[key]={request:req,time:Date.now()};
    const clean={};Object.keys(pending).filter(k=>Date.now()-pending[k].time<120000).slice(-16).forEach(k=>clean[k]=pending[k]);
    $prefs.setValueForKey(JSON.stringify(clean),PENDING);
   }
  } else if(responseStatus()===200) {
   const metrics=normalize(p,JSON.parse($response.body||'{}'));
   const pending=read(PENDING), key=p+':'+session, saved=pending[key];
   const data=read(DATA); data.version=1;data.accounts=data.accounts||{};
   let request=saved&&Date.now()-saved.time<120000?saved.request:null;
   // GET user overview can be captured directly; POST requires its exact body from request stage.
   if(!request&&p==='unicom'&&String($request.method||'GET').toUpperCase()==='GET')request=safeRequest($request);
   data.accounts[p]={metrics,request,queryReady:!!request&&(request.method==='GET'||!!request.body)};
   const ok=$prefs.setValueForKey(JSON.stringify(data),DATA);
   delete pending[key];$prefs.setValueForKey(JSON.stringify(pending),PENDING);
   if(ok)diagnostic(p,'saved','已保存查询数据'+(data.accounts[p].queryReady?'及查询请求':'快照')+'。请在 Scripting 从 BoxJS 导入，完成后关闭抓取。');
   else notify(p,'本地保存失败，请检查圈 X 存储。');
  } else {diagnostic(p,'http-error','已命中接口，但 HTTP 返回未成功，未保存余量。',responseStatus());
  }
 }
} catch(_) {
 const p=endpoint($request.url);if(p)diagnostic(p,'schema-mismatch','接口已命中，但响应格式尚未适配或会话失效；未覆盖上次数据。');
} finally {$done({});}
