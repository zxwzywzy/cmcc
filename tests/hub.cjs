const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const source=esbuild.buildSync({entryPoints:['scripting/carriers/hub.ts'],bundle:true,platform:'neutral',format:'cjs',external:['scripting','./mobile/api'],write:false}).outputFiles[0].text;
const store={}, keychain={}, calls=[];
let envelope={val:JSON.stringify({version:1,accounts:{broadnet:{metrics:{provider:'broadnet',balance:2,flowMB:1024,fetchedAt:1},request:{url:'https://app.10099.com.cn/contact-web/api/busi/qryUserInfo',method:'POST',headers:{access:'fake'},body:'{"data":"fake"}'},queryReady:true}}})};
let mode='ok';
const scripting={fetch:async(url,opts)=>{
 calls.push([url,opts]);
 if(url.includes('/query/data/10010.cookie'))return {ok:true,json:async()=>({val:''})};
 if(url.includes('carrier_hub_diagnostics_v1'))return {ok:true,json:async()=>({val:JSON.stringify({providers:{telecom:{stage:'nearby-query'}}})})};
 if(url.includes('/query/data/'))return {ok:true,json:async()=>envelope};
 if(mode==='error')throw Error('synthetic offline');
 return {ok:true,json:async()=>({status:'000000',data:{userData:{fee:250,flow:2097152,voice:10}}})};
}};
const mobile={importFromBoxJS:async()=>['synthetic'],loadAccount:async()=>{throw Error('no mobile')},listAccounts:()=>[],removeAccount:()=>{},clearCache:()=>{}};
const m={exports:{}};const context={module:m,exports:m.exports,require:name=>name==='scripting'?scripting:mobile,Storage:{get:k=>store[k],set:(k,v)=>store[k]=v},Keychain:{get:k=>keychain[k],set:(k,v)=>keychain[k]=v,remove:k=>delete keychain[k]},Date};vm.runInNewContext(source,context);
(async()=>{
 const hub=m.exports;
 assert.equal(hub.getCarrierStyle('telecom'),'全景');
 const credentialsBefore=JSON.stringify(keychain);
 hub.setCarrierStyle('telecom','账单卡');hub.setCarrierStyle('unicom','大字余额');
 assert.equal(hub.getCarrierStyle('telecom'),'账单卡');assert.equal(hub.getCarrierStyle('unicom'),'大字余额');assert.equal(hub.getCarrierStyle('broadnet'),'全景');
 assert.throws(()=>hub.setCarrierStyle('telecom','unknown'));assert.equal(JSON.stringify(keychain),credentialsBefore);

 assert.throws(()=>hub.savePreferences('evil.test',120));
 const raw=JSON.parse(envelope.val);for(const p of ['unicom','telecom'])raw.accounts[p]={metrics:{provider:p,balance:3,flowMB:512,fetchedAt:1},request:null,queryReady:false};envelope={val:JSON.stringify(raw)};
 const summary=await hub.importAll();assert.ok(summary.includes('接口未适配'));for(const p of ['中国联通','中国电信','中国广电'])assert.ok(summary.includes(p));
 for(const p of ['unicom','telecom']){const state=await hub.loadProvider(p);assert.equal(state.metrics.balance,3);assert.equal(state.stale,true);}
 let s=await hub.loadProvider('broadnet',true);assert.equal(s.metrics.balance,2.5);assert.equal(s.metrics.flowMB,2048);assert.equal(s.stale,undefined);assert.equal(calls.at(-1)[1].redirect,'error');
 mode='error';s=await hub.loadProvider('broadnet',true);assert.equal(s.stale,true);assert.equal(s.metrics.balance,2.5);
 hub.forget('broadnet');s=await hub.loadProvider('broadnet');assert.equal(s.metrics,undefined);
 console.log('Hub integration passed: host validation, import, live-query normalization, redirect policy, offline fallback, delete, three-carrier import and named import results.');
})().catch(e=>{console.error(e);process.exitCode=1});
