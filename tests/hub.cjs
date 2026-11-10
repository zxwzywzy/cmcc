const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const source=esbuild.buildSync({entryPoints:['scripting/carriers/hub.ts'],bundle:true,platform:'neutral',format:'cjs',external:['scripting','./mobile/api'],write:false}).outputFiles[0].text;
const store={}, keychain={}, calls=[];
let envelope={val:JSON.stringify({version:1,accounts:{broadnet:{metrics:{provider:'broadnet',balance:2,flowMB:1024,fetchedAt:1},request:{url:'https://app.10099.com.cn/contact-web/api/busi/qryUserInfo',method:'POST',headers:{access:'fake'},body:'{"data":"fake"}'},queryReady:true}}})};
let mode='ok';
const scripting={fetch:async(url,opts)=>{
 calls.push([url,opts]);
 if(url.includes('/query/data/'))return {ok:true,json:async()=>envelope};
 if(mode==='error')throw Error('synthetic offline');
 return {ok:true,json:async()=>({status:'000000',data:{userData:{fee:250,flow:2097152,voice:10}}})};
}};
const mobile={importFromBoxJS:async()=>['synthetic'],loadAccount:async()=>{throw Error('no mobile')},listAccounts:()=>[],removeAccount:()=>{},clearCache:()=>{}};
const m={exports:{}};const context={module:m,exports:m.exports,require:name=>name==='scripting'?scripting:mobile,Storage:{get:k=>store[k],set:(k,v)=>store[k]=v},Keychain:{get:k=>keychain[k],set:(k,v)=>keychain[k]=v},Date};vm.runInNewContext(source,context);
(async()=>{
 const hub=m.exports;
 assert.throws(()=>hub.savePreferences('evil.test',120));
 await hub.importAll();let s=await hub.loadProvider('broadnet',true);assert.equal(s.metrics.balance,2.5);assert.equal(s.metrics.flowMB,2048);assert.equal(s.stale,undefined);assert.equal(calls.at(-1)[1].redirect,'error');
 mode='error';s=await hub.loadProvider('broadnet',true);assert.equal(s.stale,true);assert.equal(s.metrics.balance,2.5);
 hub.forget('broadnet');s=await hub.loadProvider('broadnet');assert.equal(s.metrics,undefined);
 console.log('Hub integration passed: host validation, import, live-query normalization, redirect policy, offline fallback, delete.');
})().catch(e=>{console.error(e);process.exitCode=1});
