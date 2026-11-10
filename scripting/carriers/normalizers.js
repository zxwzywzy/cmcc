/** Shared read-only endpoint allowlist and strict response normalization.
 * References: SOURCES.md. No carrier passwords or login automation.
 */
export const providers = ['cmcc', 'unicom', 'telecom', 'broadnet'];
export const names = {cmcc:'中国移动',unicom:'中国联通',telecom:'中国电信',broadnet:'中国广电'};
export function endpoint(url) {
 if (typeof url !== 'string') return null;
 // Anchor authority, path and optional query: reject userinfo, extra subdomains and trailing paths.
 if (/^https:\/\/m\.client\.10010\.com\/mobileService\/home\/queryUserInfoSeven\.htm(?:\?[^#]*)?$/i.test(url)) return 'unicom';
 if (/^https:\/\/appfuwu\.189\.cn:9021\/query\/qryImportantData(?:\?[^#]*)?$/i.test(url)) return 'telecom';
 if (/^https:\/\/(?:app|wx)\.10099\.com\.cn\/contact-web\/api\/busi\/qryUserInfo(?:\?[^#]*)?$/i.test(url)) return 'broadnet';
 return null;
}
function number(v) {
 if (typeof v !== 'number' && typeof v !== 'string') return undefined;
 if (typeof v === 'string' && !/^-?\d+(?:\.\d+)?$/.test(v.trim().replace(/,/g,''))) return undefined;
 const n=Number(typeof v==='string'?v.replace(/,/g,''):v);
 return Number.isFinite(n)?n:undefined;
}
function flow(v,unit) {
 const n=number(v); if(n===undefined)return undefined;
 switch(String(unit||'').trim().toUpperCase()) {
  case 'TB': case 'T': return n*1024*1024;
  case 'GB': case 'G': return n*1024;
  case 'MB': case 'M': return n;
  case 'KB': case 'K': return n/1024;
  case 'B': return n/1048576;
  default: return undefined;
 }
}
export function normalize(provider,json) {
 const out={provider, fetchedAt:Date.now()};
 if(provider==='broadnet') {
  if(json?.status!=='000000')throw Error('广电查询未成功，请重新登录并抓取');
  const u=json?.data?.userData;
  if(!u||typeof u!=='object')throw Error('广电返回结构未适配');
  const fee=number(u.fee), f=number(u.flow), v=number(u.voice);
  if(fee!==undefined)out.balance=fee/100;
  if(f!==undefined)out.flowMB=f/1024; // upstream flow is KB
  if(v!==undefined)out.voice=v;
 } else if(provider==='unicom') {
  if(json?.code!=='Y'||!Array.isArray(json?.data?.dataList))throw Error('联通会话失效或返回结构未适配');
  for(const item of json.data.dataList) {
   // Do not label an "already used" value as remaining.
   const label=String(item.remainTitle||'');
   if(/已用|消费|已消费/.test(label))continue;
   if(item.type==='fee'&&String(item.unit)==='元')out.balance=number(item.number);
   if(item.type==='flow'&&/剩余|可用/.test(label))out.flowMB=flow(item.number,item.unit);
   if(item.type==='voice'&&/剩余|可用/.test(label)&&/^(分钟|分|min)$/i.test(String(item.unit)))out.voice=number(item.number);
  }
 } else if(provider==='telecom') {
  const r=json?.responseData;
  if(r?.resultCode!=='0000'||!r.data)throw Error('电信会话失效或返回结构未适配');
  const d=r.data;
  // qryImportantData index balance is yuan, not cents.
  out.balance=number(d.balanceInfo?.indexBalanceDataInfo?.balance);
  const n=number(d.flowInfo?.commonFlow?.balance);
  if(n!==undefined)out.flowMB=n/1024; // commonFlow is KB, excludes directional data
  out.voice=number(d.voiceInfo?.voiceDataInfo?.balance);
 } else throw Error('未知运营商');
 if(!['balance','flowMB','voice'].some(k=>Number.isFinite(out[k])))throw Error('未识别出可显示的余额或余量，未保存');
 for(const key of ['balance','flowMB','voice'])if(!Number.isFinite(out[key]))delete out[key];
 return out;
}
export function safeRequest(value) {
 if(!value||!endpoint(value.url))return null;
 const method=String(value.method||'GET').toUpperCase();
 if(!['GET','POST'].includes(method))return null;
 const body=typeof value.body==='string'?value.body:'';
 if(body.length>262144)return null;
 if(/(?:"|&|^)(?:password|passwd|smsCode|verifyCode)(?:"|=)/i.test(body))return null;
 const headers={};
 // Host, content-length, compression and hop-by-hop headers must be rebuilt by fetch.
 const allowed=['cookie','authorization','access','token','access-token','x-access-token','content-type','user-agent','referer','origin','x-requested-with'];
 Object.keys(value.headers||{}).forEach(k=>{ if(allowed.includes(k.toLowerCase())&&typeof value.headers[k]==='string')headers[k]=value.headers[k]; });
 return {url:value.url,method,headers,...(method==='POST'?{body}:{} )};
}
