const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),esbuild=require('esbuild');
const source=fs.readFileSync('scripts/wusheng_bus_login-v0.2.7.js','utf8'),key='wusheng_bus_login_v1',diag='wusheng_bus_login_diag_v1',authorization='Bearer SYNTHETIC_TEST_TOKEN_12345';
function capture(request,store={},extra={}){
 let done=0;const notices=[],writes=[];
 vm.runInNewContext(source,{$request:request,$prefs:{valueForKey:k=>store[k],setValueForKey:(v,k)=>{store[k]=v;writes.push({k,v});return true}},$notify:(...v)=>notices.push(v),$done:()=>done++,Date,...extra});
 assert.equal(done,1);return {store,notices,writes};
}
const request={url:'https://wsapi.wskyzx.com:26110/api/WechatInfo/GetUserInfo',headers:{Authorization:authorization},body:'{"userId":123456789012345678901234}'};
const captured=capture(request),envelope=JSON.parse(captured.store[key]);assert.equal(envelope.userId,'123456789012345678901234');assert.equal(envelope.authorization,authorization);assert.deepEqual(Object.keys(envelope).sort(),['authorization','capturedAt','userId','version']);assert.equal(captured.notices.length,1);assert.doesNotMatch(JSON.stringify(captured.notices),/SYNTHETIC|123456789/);
assert.equal(capture(request,captured.store).notices.length,0);assert.ok(capture({...request,headers:{authorization},body:'{"userId":"1234567890"}'}).store[key]);
for(const path of ['GetPayRrcode','GetConsumedAndRechargeRecord']){const r=capture({...request,url:'https://wsapi.wskyzx.com:26110/api/AppBusiness/'+path,body:'userId=1234567890'});assert.equal(JSON.parse(r.store[key]).userId,'1234567890');assert.equal(JSON.parse(r.store[diag]).state,'captured')}
const loginRequest={url:'https://wsapi.wskyzx.com:26110/api/WechatInfo/GetPhoneNumber',headers:{}};Object.defineProperty(loginRequest,'body',{get(){throw Error('must not read phone grant request body')}});
const loginResponse=capture(loginRequest,{},{$response:{body:'{"code":0,"data":{"userId":123456789012345678901234,"token":"SYNTHETIC_TEST_TOKEN_12345","phone":"SHOULD_NOT_PERSIST"}}'}});assert.equal(JSON.parse(loginResponse.store[key]).userId,envelope.userId);assert.doesNotMatch(JSON.stringify(loginResponse.store),/SHOULD_NOT_PERSIST/);
const failedLogin=capture(loginRequest,{},{$response:{body:'{"code":401,"data":{"userId":"1","token":"SYNTHETIC_TEST_TOKEN_12345"}}'}});assert.equal(failedLogin.store[key],undefined);assert.equal(JSON.parse(failedLogin.store[diag]).state,'login-unready');
const qrResponse={};Object.defineProperty(qrResponse,'body',{get(){throw Error('must not read QR response')}});assert.equal(capture({...request,url:'https://wsapi.wskyzx.com:26110/api/AppBusiness/GetPayRrcode'}, {},{$response:qrResponse}).writes.length,0);
const throttled={};assert.equal(capture(request,throttled,{Date:{now:()=>5000}}).notices.length,1);assert.equal(capture(request,throttled,{Date:{now:()=>5001}}).notices.length,0);assert.equal(capture(request,throttled,{Date:{now:()=>65001}}).notices.length,1);
const incomplete={};capture({...request,headers:{}},incomplete,{Date:{now:()=>5000}});assert.equal(capture(request,incomplete,{Date:{now:()=>5001}}).notices.length,1);
for(const invalid of [
 {...request,url:request.url.replace('wsapi.wskyzx.com','example.com')},
 {...request,url:request.url.replace('GetUserInfo','GetUserInfoExtra')},
 {...request,headers:{}},
 {...request,body:'bad json'},
 {...request,body:'{"userId":null}'},
 {...request,body:'{"userId":1.2}'},
 {...request,body:'{"userId":1234567890123456789012345}'},
])assert.equal(capture(invalid).store[key],undefined);
assert.equal(capture(request,{},{$response:{body:'{"qrcode":"should not inspect"}'}}).writes.length,0);
const saveFailed=capture(request,{},{$prefs:{valueForKey:()=>null,setValueForKey:()=>false}});assert.equal(saveFailed.notices.length,1);assert.doesNotMatch(JSON.stringify(saveFailed.notices),/授权已抓取/);
const missing=capture({...request,headers:{}});assert.equal(JSON.parse(missing.store[diag]).state,'missing-auth');assert.doesNotMatch(JSON.stringify(missing.store),/SYNTHETIC|123456789/);
const userMissing=capture({...request,body:'{}'});assert.equal(JSON.parse(userMissing.store[diag]).state,'missing-user');
assert.doesNotMatch(source,/\$task|\$httpClient|console\.|sessionKey|encryptedData/);
const conf=fs.readFileSync('Wusheng-Bus-Login.conf','utf8'),rules=conf.split(/\r?\n/).filter(l=>l.includes(' url '));assert.match(conf,/^hostname = wsapi\.wskyzx\.com\r?$/m);assert.equal(rules.length,2);assert.match(rules[0],/url script-request-body/);assert.match(rules[1],/GetPhoneNumber.*url script-response-body/);assert.ok(new RegExp(rules[0].split(' url ')[0]).test(request.url));assert.ok(new RegExp(rules[0].split(' url ')[0]).test('https://wsapi.wskyzx.com:26110/api/AppBusiness/GetPayRrcode'));assert.ok(!new RegExp(rules[0].split(' url ')[0]).test(loginRequest.url));
const built=esbuild.buildSync({entryPoints:['scripting/wusheng-bus/login.ts'],bundle:true,format:'cjs',platform:'neutral',external:['scripting','./api'],write:false,logOverride:{'impossible-typeof':'silent'}}).outputFiles[0].text;
function fixture(){
 const m={exports:{}},memory={},keys={},calls=[];let reply={val:captured.store[key]},fail=false,primaryFails=false,mutation;
 const api={balance:async a=>{calls.push({type:'verify',userId:a.userId});if(mutation)mutation();if(fail)throw Error('authorization expired');return {balance:0,fetchedAt:Date.now()}}};
 vm.runInNewContext(built,{module:m,exports:m.exports,require:n=>n==='scripting'?{fetch:async(url,opts)=>{calls.push({type:'boxjs',url,opts});if(primaryFails&&url.startsWith('https://boxjs.com/'))throw Error('unreachable');return {ok:true,text:async()=>JSON.stringify(reply)}}}:n==='./api'?api:require(n),Storage:{get:k=>memory[k],set:(k,v)=>memory[k]=v},Keychain:{get:k=>keys[k],set:(k,v)=>keys[k]=v},Date});
 return {login:m.exports,memory,keys,calls,setReply:v=>reply=v,fail:()=>fail=true,failPrimary:()=>primaryFails=true,mutate:f=>mutation=f};
}
(async()=>{
 const f=fixture();assert.equal(f.calls.length,0);const card=await f.login.loginFromBoxJS();assert.equal(card.balance,0);assert.equal(f.calls.length,2);assert.equal(f.calls[0].url,'https://boxjs.com/query/data/'+key);assert.equal(f.calls[1].userId,envelope.userId);assert.equal(JSON.parse(f.keys['wusheng.bus.auth.v1']).authorization,authorization);assert.equal(f.memory['wusheng.bus.balance'].balance,0);assert.doesNotMatch(JSON.stringify(f.memory),/SYNTHETIC|123456789/);
 const install=f.login.captureInstallURL();assert.ok(install.startsWith('quantumult-x:///add-resource?remote-resource='));assert.doesNotMatch(install,/update-configuration/);const resource=JSON.parse(decodeURIComponent(install.split('remote-resource=')[1]));assert.equal(Object.keys(resource).length,1);assert.equal(resource.rewrite_remote.length,1);assert.match(resource.rewrite_remote[0],/Wusheng-Bus-Login\.conf/);
 const count=f.calls.length;await assert.rejects(()=>f.login.loginFromBoxJS('evil.example'),/BoxJS/);assert.equal(f.calls.length,count);
 const net=fixture();net.failPrimary();await net.login.loginFromBoxJS();assert.equal(net.calls.length,3);assert.equal(net.memory['wusheng.bus.boxjs.host'],'boxjs.net');assert.equal(JSON.parse(net.keys['wusheng.bus.auth.v1']).userId,envelope.userId);
 const oldKey=f.keys['wusheng.bus.auth.v1'];f.fail();await assert.rejects(()=>f.login.loginFromBoxJS(),/expired/);assert.equal(f.keys['wusheng.bus.auth.v1'],oldKey);
 const absent=fixture();absent.setReply({});await assert.rejects(()=>absent.login.loginFromBoxJS(),/还没有抓到/);assert.equal(Object.keys(absent.keys).length,0);assert.equal(absent.calls.length,2);assert.ok(absent.calls[1].url.startsWith('https://boxjs.net/'));
 const malformed=fixture();malformed.setReply({val:'{"version":1}'});await assert.rejects(()=>malformed.login.loginFromBoxJS(),/不完整/);assert.equal(Object.keys(malformed.keys).length,0);
 const changed=fixture();changed.mutate(()=>changed.keys['wusheng.bus.auth.v1']=JSON.stringify({authorization:'Bearer OTHER_SYNTHETIC_TOKEN_12345',userId:'9'}));await assert.rejects(()=>changed.login.loginFromBoxJS(),/账号已变化/);assert.equal(JSON.parse(changed.keys['wusheng.bus.auth.v1']).userId,'9');
 const ready=fixture();assert.match(await ready.login.captureStatus(),/BoxJS 已读到完整授权/);assert.equal(ready.calls.filter(r=>r.type==='verify').length,0);assert.equal(Object.keys(ready.keys).length,0);
 const noHit=fixture();noHit.setReply({});assert.match(await noHit.login.captureStatus(),/尚未命中业务请求/);
 const hit=fixture();hit.setReply({val:JSON.stringify({state:'missing-auth',version:'0.2.6'})});assert.match(await hit.login.captureStatus(),/已命中.*没有登录 Token/);
 const index=fs.readFileSync('scripting/wusheng-bus/index.tsx','utf8');assert.doesNotMatch(index,/DocumentPicker|SecureField|decodeAccount|readAsString|ImportAccount|BOXJS_SUBSCRIPTION|复制 BoxJS 应用订阅|title="BoxJS 域名"|weixin:\/\//);assert.match(index,/从 BoxJS 导入/);assert.match(index,/检查抓取状态/);
 console.log('PASS scoped QX profile/ride-request/login-response capture, SNI hostname without port, exact long user IDs, no phone grants or QR responses retained, throttled safe diagnostics, BoxJS verification before saving and capture-state UI.');
})().catch(e=>{console.error(e);process.exitCode=1});
