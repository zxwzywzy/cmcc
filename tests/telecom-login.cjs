const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const code=esbuild.buildSync({entryPoints:['scripting/carriers/telecom-login.ts'],bundle:true,format:'cjs',platform:'neutral',external:['scripting'],write:false}).outputFiles[0].text;
const keys={},calls=[];let mode='ok',queryCount=0,loginCount=0;const secrets=['SyntheticPwd!','SyntheticNewPwd!','13000000000','13100000000'];
const trans=v=>[...v].map(x=>String.fromCharCode(x.charCodeAt(0)+2)).join('');
const reply={responseData:{resultCode:'0000',data:{balanceInfo:{indexBalanceDataInfo:{balance:'21.26'}},flowInfo:{totalAmount:{used:'1048576',total:'3145728'}},voiceInfo:{voiceDataInfo:{used:'60',total:'300'}}}}};
const scripting={fetch:async(url,opt)=>{
 calls.push([url,opt]);assert.equal(opt.redirect,'error');assert.equal(opt.method,'POST');const b=JSON.parse(opt.body);
 if(url.includes('userLoginNormal')){loginCount++;assert.equal(b.headerInfos.code,'userLoginNormal');assert.match(b.headerInfos.timestamp,/^\d{14}$/);assert.equal(Buffer.from(b.content.fieldData.loginAuthCipherAsymmertric,'base64').length,128);assert.equal(b.content.fieldData.phoneNum,trans('13000000000'));assert.equal(b.content.fieldData.authentication,trans('SyntheticPwd!'));if(mode==='bad-login')return {ok:true,json:async()=>({responseData:{resultCode:'error',resultDesc:'SyntheticPwd!'}})};return {ok:true,json:async()=>({responseData:{resultCode:'0000',data:{loginSuccessResult:{token:'synthetic-token-'+loginCount,provinceCode:'p',cityCode:'c'}}}})}}
 assert.equal(url,'https://appfuwu.189.cn:9021/query/qryImportantData');queryCount++;assert.equal(b.headerInfos.code,'qryImportantData');assert.ok(b.headerInfos.token);assert.equal(b.content.fieldData.account,trans('13000000000'));
 if(mode==='network')throw Error('SyntheticPwd!');if(mode==='expire-once'){mode='ok';return {ok:true,json:async()=>({responseData:{resultCode:'auth-failed'}})}}if(mode==='reject')return {ok:true,json:async()=>({responseData:{resultCode:'auth-failed'}})};return {ok:true,json:async()=>reply};
}};
const m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require:()=>scripting,Keychain:{get:k=>keys[k],set:(k,v)=>keys[k]=v,remove:k=>delete keys[k]},Storage:{set:()=>assert.fail('Credentials may not use Storage')},console:{error:()=>{},log:()=>assert.fail('Unexpected log')},Date,Math,Uint8Array,Uint32Array,setTimeout,clearTimeout});
(async()=>{
 const a=m.exports;assert.equal(a.beijingTimestamp(Date.UTC(2026,0,1,0,2,3)),'20260101080203');
 let r=await a.configureTelecomLogin('13000000000','SyntheticPwd!');assert.equal(r.balance,21.26);assert.equal(r.phoneTail,'0000');assert.equal(r.flowScope,'all');assert.equal(r.flowMB,2048);assert.equal(r.voice,240);assert.equal(r.voiceTotal,300);assert.equal(a.telecomLoginInfo().phoneTail,'0000');assert.equal(a.telecomAccountMatches('13100000000'),false);assert.equal(a.telecomAccountMatches('13000000000'),true);
 const saved=keys['carrier.hub.telecom.login.v1'];assert.ok(saved.includes('SyntheticPwd!'));
 mode='bad-login';await assert.rejects(a.configureTelecomLogin('13000000000','SyntheticPwd!'),e=>!secrets.some(s=>e.message.includes(s)));assert.equal(keys['carrier.hub.telecom.login.v1'],saved);
 mode='expire-once';let before=loginCount;r=await a.queryTelecomLogin();assert.equal(loginCount,before+1);assert.equal(r.voice,240);
 mode='network';before=loginCount;await assert.rejects(a.queryTelecomLogin(),e=>!e.message.includes('SyntheticPwd!'));assert.equal(loginCount,before);
 mode='reject';before=loginCount;await assert.rejects(a.queryTelecomLogin());assert.equal(loginCount,before+1);
 mode='ok';r=await a.saveTelecomSmsSession({phone:'13000000000',token:'sms-session-token',deviceID:'device'});assert.equal(a.telecomLoginInfo().mode,'sms');assert.ok(!keys['carrier.hub.telecom.login.v1'].includes('SyntheticPwd!'));mode='reject';before=loginCount;await assert.rejects(a.queryTelecomLogin());assert.equal(loginCount,before);
 a.removeTelecomLogin();assert.equal(a.telecomLoginInfo(),undefined);assert.equal(keys['carrier.hub.telecom.login.v1'],undefined);
 console.log('PASS Telecom password login: real RSA encryption without browser globals, UTC+8 timestamp, derived remaining/totals, Keychain-only persistence, failed replacement isolation, bounded re-login and secret-free errors.');
})().catch(e=>{console.error(e);process.exitCode=1});
