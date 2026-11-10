import { endpoint, normalize, safeRequest, names } from '../scripting/carriers/normalizers.js';
const DATA='carrier_hub_v1', PENDING='carrier_hub_pending_v1';
function read(key) {try{return JSON.parse($prefs.valueForKey(key)||'{}');}catch(_){return {};}}
function notify(p,text){$notify(names[p]+' · 运营商小组件','',text);}
try {
 const p=endpoint($request.url);
 if(p) {
  const session=String($request.sessionIndex||'');
  if(typeof $response==='undefined') {
   const req=safeRequest($request);
   if(req) {
    const pending=read(PENDING), key=p+':'+session;
    pending[key]={request:req,time:Date.now()};
    const clean={};Object.keys(pending).filter(k=>Date.now()-pending[k].time<120000).slice(-16).forEach(k=>clean[k]=pending[k]);
    $prefs.setValueForKey(JSON.stringify(clean),PENDING);
   }
  } else if(Number($response.statusCode||$response.status||200)===200) {
   const metrics=normalize(p,JSON.parse($response.body||'{}'));
   const pending=read(PENDING), key=p+':'+session, saved=pending[key];
   const data=read(DATA); data.version=1;data.accounts=data.accounts||{};
   let request=saved&&Date.now()-saved.time<120000?saved.request:null;
   // GET user overview can be captured directly; POST requires its exact body from request stage.
   if(!request&&p==='unicom'&&String($request.method||'GET').toUpperCase()==='GET')request=safeRequest($request);
   data.accounts[p]={metrics,request,queryReady:!!request&&(request.method==='GET'||!!request.body)};
   const ok=$prefs.setValueForKey(JSON.stringify(data),DATA);
   delete pending[key];$prefs.setValueForKey(JSON.stringify(pending),PENDING);
   if(ok)notify(p,'已保存查询数据'+(data.accounts[p].queryReady?'及查询请求':'快照')+'。请在 Scripting 从 BoxJS 导入，完成后关闭抓取。');
   else notify(p,'本地保存失败，请检查圈 X 存储。');
  }
 }
} catch(_) {
 const p=endpoint($request.url);if(p)notify(p,'本次返回未能解析，未覆盖上次数据。');
} finally {$done({});}
