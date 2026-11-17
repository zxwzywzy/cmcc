// Local-only metadata diagnosis; no network calls, cookies, auth bodies or QR content retained.
(function(){
 const KEY='wusheng_bus_diag_v1';
 const fields=new Set(['code','status','message','msg','data','result','success','list','rows','records','total','page','routes','stations','buses','vehicles','balance','amount','card','arrival','distance','time','expires','expireTime']);
 function shape(v,depth){
  if(v===null)return 'null';if(Array.isArray(v))return depth>=3?'array':{array:v.length?shape(v[0],depth+1):'empty'};
  if(typeof v==='object'){
   if(depth>=3)return 'object';const out={};let other=false;
   for(const k of Object.keys(v).slice(0,30)){if(fields.has(k))out[k]=shape(v[k],depth+1);else other=true;}
   if(other)out.otherFields='present';return out;
  }
  return typeof v;
 }
 function id(path){let n=2166136261;for(let i=0;i<path.length;i++){n^=path.charCodeAt(i);n=Math.imul(n,16777619)}return (n>>>0).toString(16)}
 try{
  const m=String($request.url||'').match(/^https:\/\/([a-z0-9.-]+)(?::443)?(\/[^?#]*)/i);if(!m)return;
  let d;try{d=JSON.parse($prefs.valueForKey(KEY)||'null')}catch(_){}
  if(!d||d.version!==1||!Array.isArray(d.records))d={version:1,records:[]};
  const response=typeof $response!=='undefined',headers=$request.headers||{};
  const names=Object.keys(headers).map(k=>k.toLowerCase());
  const record={host:m[1].toLowerCase(),interfaceId:id(m[2]),stage:response?'response':'request',time:Date.now(),hasCookie:names.includes('cookie'),hasAuthorization:names.includes('authorization')};
  if(response){
   const status=String($response.statusCode||$response.status||'').match(/\b(\d{3})\b/);if(status)record.status=Number(status[1]);
   const raw=typeof $response.body==='string'?$response.body:'';
   if(raw.length>0&&raw.length<=262144){try{record.structure=shape(JSON.parse(raw),0)}catch(_){record.structure='not-json'}}else record.structure=raw.length?'body-too-large':'empty-or-binary';
  }
  d.records=d.records.filter(r=>!(r.host===record.host&&r.interfaceId===record.interfaceId&&r.stage===record.stage));d.records.push(record);d.records=d.records.slice(-60);
  if($prefs.setValueForKey(JSON.stringify(d),KEY)&&d.records.length===1)$notify('武胜公交 · 接口诊断','','已记录结构诊断，不含 Cookie 或业务内容。完成三个页面操作后回 Scripting 导入。');
 }catch(_){}finally{$done({});}
})();
