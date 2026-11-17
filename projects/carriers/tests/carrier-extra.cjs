const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const compiled=esbuild.buildSync({entryPoints:['scripting/carriers/normalizers.js'],bundle:true,format:'cjs',write:false}).outputFiles[0].text;
const mod={exports:{}};vm.runInNewContext(compiled,{module:mod,exports:mod.exports,Date});
const {normalizeUnicomCookie,normalizeTelecomWeb}=mod.exports;
const fee={code:'Y',data:{dataList:[{type:'fee',unit:'元',number:'21.26'},{type:'point',number:'0',remainTitle:'可用积分'}]}};
const detail={code:'0000',packageName:'测试套餐',canuseSmsAllUnit:'条',canuseVoiceAllUnit:'分钟',resources:[{type:'Sms',remainResource:'12',details:[{feePolicyName:'测试短信包',remain:'12',use:'8',total:'20',unit:'条'}]},{type:'Voice',remainResource:'30'}]};
let m=normalizeUnicomCookie(fee,detail);assert.equal(m.points,0);assert.equal(m.balance,21.26);assert.equal(m.packageName,'测试套餐');assert.equal(m.sms,12);assert.equal(m.resourceDetails[0].used,8);
m=normalizeUnicomCookie({code:'Y',feeResource:{feePersent:'1',newUnit:'元'},data:{dataList:[{type:'point',number:'33',remainTitle:'已兑换积分'}]}},{...detail,code:'error'});assert.equal(m.points,undefined);assert.equal(m.packageName,undefined);assert.equal(m.resourceDetails,undefined);
m=normalizeUnicomCookie(fee,{...detail,resources:[{type:'Flow',details:[{addUpItemName:'包',total:'10'}]}]});assert.equal(m.resourceDetails[0].unit,undefined);assert.equal(m.resourceDetails[0].remaining,undefined);
const appResponse={responseData:{resultCode:'0000',data:{balanceInfo:{indexBalanceDataInfo:{balance:'12.34'}},flowInfo:{commonFlow:{balance:1048576,used:1048576}},voiceInfo:{voiceDataInfo:{balance:0,used:60}}}}};
const appReq={url:'https://appfuwu.189.cn:9021/query/qryImportantData',method:'POST',headers:{'Content-Type':'application/json',Host:'wrong-host'},body:JSON.stringify({headerInfos:{token:'private-test-token',userLoginName:'synthetic-A'},content:{fieldData:{account:'synthetic-A'}}})};
const code=fs.readFileSync('scripts/carrier_hub_capture.js','utf8');
function capture(req,store={}){let done=0;const notices=[];vm.runInNewContext(code,{$request:req,$prefs:{valueForKey:k=>store[k],setValueForKey:(v,k)=>{store[k]=v;return true}},$notify:(...a)=>notices.push(a),$done:()=>done++});assert.equal(done,1);assert.ok(!JSON.stringify(notices).includes('private-test'));return {store,notices}}
let c=capture(appReq);assert.equal(JSON.parse(c.store['10000.app.request']).headers.Host,undefined);assert.equal(JSON.parse(c.store.carrier_hub_diagnostics_v1).providers.telecom.stage,'auth-saved');assert.equal(c.store.carrier_hub_v1,undefined);assert.ok(c.notices[0][2].includes('还不是余量查询成功'));assert.ok(!c.store.carrier_hub_diagnostics_v1.includes('private-test'));
for(const req of [{...appReq,url:'https://evil.test/query/qryImportantData'},{...appReq,body:'{}'},{...appReq,body:JSON.stringify({headerInfos:{token:'private-test'},password:'do-not-save'})}])assert.equal(capture(req).store['10000.app.request'],undefined);
// Diagnostic request-header patterns must not shadow exact request-body capture rules.
const conf=fs.readFileSync('Carrier-Hub-Cookie-v0.2.1.conf','utf8');
const patterns=conf.split(/\r?\n/).filter(x=>x.includes(' url script-request-')&&x.includes('carrier_hub_capture')).map(x=>new RegExp(x.split(' url ')[0]));
assert.equal(patterns.filter(x=>x.test(appReq.url)).length,1);assert.equal(patterns.filter(x=>x.test('https://app.10099.com.cn/contact-web/api/busi/qryUserInfo')).length,1);
const hubCode=esbuild.buildSync({entryPoints:['scripting/carriers/hub.ts'],bundle:true,format:'cjs',platform:'neutral',external:['scripting','./mobile/api'],write:false}).outputFiles[0].text;
const prefs={},keys={};let request=appReq,offline=false;const requests=[];
const scripting={fetch:async(url,options)=>{
 requests.push([url,options]);
 if(url.includes('/query/data/10000.app.request'))return {ok:true,json:async()=>({val:JSON.stringify(request)})};
 if(url.includes('/query/data/'))return {ok:true,json:async()=>({val:''})};
 assert.equal(url,appReq.url);assert.equal(options.redirect,'error');assert.equal(options.method,'POST');assert.equal(options.body,request.body);assert.equal(options.headers.Host,undefined);if(offline)throw Error('offline');return {ok:true,json:async()=>appResponse};
}};
const mobile={importFromBoxJS:async()=>{throw Error('none')},listAccounts:()=>[],loadAccount:async()=>{throw Error('none')},removeAccount:()=>{},clearCache:()=>{}};
const hub={exports:{}};vm.runInNewContext(hubCode,{module:hub,exports:hub.exports,require:n=>n==='scripting'?scripting:mobile,Storage:{get:k=>prefs[k],set:(k,v)=>prefs[k]=v},Keychain:{get:k=>keys[k],set:(k,v)=>keys[k]=v,remove:k=>delete keys[k]},Date});
(async()=>{let result=await hub.exports.importAll();assert.ok(result.includes('电信 App 鉴权已导入并查到数据'));let s=await hub.exports.loadProvider('telecom');assert.equal(s.metrics.balance,12.34);assert.equal(s.metrics.flowMB,1024);assert.equal(s.metrics.voice,0);offline=true;s=await hub.exports.loadProvider('telecom',true);assert.equal(s.stale,true);assert.equal(s.metrics.balance,12.34);request={...appReq,body:JSON.stringify({headerInfos:{token:'private-test-B',userLoginName:'synthetic-B'},content:{fieldData:{account:'synthetic-B'}}})};await hub.exports.importAll();s=await hub.exports.loadProvider('telecom',true);assert.equal(s.metrics,undefined);hub.exports.forget('telecom');assert.equal(keys['carrier.hub.telecom.app.request.v1'],undefined);assert.equal(prefs['carrier.hub.usage.v1.telecom'].length,0);console.log('PASS Unicom points/package/SMS/details and missing units; Telecom request-only capture, nonoverlapping rules, import/query/cache/account isolation and deletion.');})().catch(e=>{console.error(e);process.exitCode=1});
