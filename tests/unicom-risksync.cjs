const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const capture=fs.readFileSync('scripts/unicom_risksync_cookie-v0.1.8.js','utf8');
function run(headers={},value,fail=false){let done=0;const store=value?{'10010.cookie':value}:{},notices=[],logs=[];
 vm.runInNewContext(capture,{$request:{url:'https://m.client.10010.com/mobileserviceNine/v1/riskCollection/riskSync',headers},$prefs:{valueForKey:k=>store[k],setValueForKey:(v,k)=>{if(fail)return false;store[k]=v;return true}},$notify:(...a)=>notices.push(a),$done:()=>done++,console:{log:(...a)=>logs.push(a)}});
 assert.equal(done,1);return {store,notices,logs};
}
let a=run({cOoKiE:'synthetic_cookie=abc'});assert.equal(a.store['10010.cookie'],'synthetic_cookie=abc');assert.equal(a.notices.length,1);assert.ok(!JSON.stringify(a.notices).includes('synthetic_cookie=abc'));assert.equal(a.logs.length,0);
a=run({});assert.equal(a.store['10010.cookie'],undefined);assert.ok(a.notices[0][1].includes('未包含'));
a=run({Cookie:'a=b'},'a=b');assert.equal(a.notices.length,0);
a=run({Cookie:'a=b'},undefined,true);assert.equal(a.store['10010.cookie'],undefined);assert.equal(a.notices[0][1],'保存失败');
const compiled=esbuild.buildSync({entryPoints:['scripting/carriers/hub.ts'],bundle:true,format:'cjs',platform:'neutral',external:['scripting','./mobile/api'],write:false}).outputFiles[0].text;
const prefs={},keys={},requests=[];let cookie='u_account=13000000000; ecs_token=synthetic';let offline=false;
const scripting={fetch:async(url,options)=>{
 requests.push([url,options]);
 if(url.includes('/query/data/10010.cookie'))return {ok:true,json:async()=>({val:cookie})};
 if(url.includes('/query/data/'))return {ok:true,json:async()=>({val:''})};
 if(offline)throw Error('synthetic offline');
 assert.equal(options.headers.Cookie,cookie);assert.equal(options.redirect,'error');
 if(url.includes('mobileserviceimportant')){assert.ok(url.includes('desmobiel=13000000000'));return {ok:true,json:async()=>({code:'Y',feeResource:{feePersent:'8.25',newUnit:'元'}})}}
 return {ok:true,json:async()=>({code:'0000',canuseFlowAllUnit:'GB',canuseVoiceAllUnit:'分钟',flowSumList:[{flowtype:'1',xcanusevalue:'2560'}],resources:[{type:'Voice',remainResource:'0'}]})};
}};
const mobile={importFromBoxJS:async()=>{throw Error('none')},listAccounts:()=>[],loadAccount:async()=>{throw Error('none')},clearCache:()=>{},removeAccount:()=>{}};
const m={exports:{}};vm.runInNewContext(compiled,{module:m,exports:m.exports,require:n=>n==='scripting'?scripting:mobile,Storage:{get:k=>prefs[k],set:(k,v)=>prefs[k]=v},Keychain:{get:k=>keys[k],set:(k,v)=>keys[k]=v,remove:k=>delete keys[k]},Date});
(async()=>{
 const summary=await m.exports.importAll();assert.ok(summary.includes('联通 riskSync Cookie 已导入并查到数据'));
 let state=await m.exports.loadProvider('unicom');assert.equal(state.metrics.balance,8.25);assert.equal(state.metrics.flowMB,2560);assert.equal(state.metrics.voice,0);
 offline=true;state=await m.exports.loadProvider('unicom',true);assert.equal(state.stale,true);assert.equal(state.metrics.balance,8.25);
 cookie='u_account=13100000000; ecs_token=synthetic-other';await m.exports.importAll();state=await m.exports.loadProvider('unicom',true);assert.equal(state.metrics,undefined);
 m.exports.forget('unicom');assert.equal(keys['carrier.hub.unicom.cookie.v1'],undefined);
 console.log('PASS riskSync capture + BoxJS Cookie import, direct query, offline fallback, changed-account cache isolation and delete.');
})().catch(e=>{console.error(e);process.exitCode=1});
