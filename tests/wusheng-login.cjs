const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),esbuild=require('esbuild');
const source=fs.readFileSync('scripts/wusheng_bus_login-v0.2.5.js','utf8'),key='wusheng_bus_login_v1',authorization='Bearer SYNTHETIC_TEST_TOKEN_12345';
function capture(request,store={},extra={}){
 let done=0;const notices=[],writes=[];
 vm.runInNewContext(source,{$request:request,$prefs:{valueForKey:k=>store[k],setValueForKey:(v,k)=>{store[k]=v;writes.push({k,v});return true}},$notify:(...v)=>notices.push(v),$done:()=>done++,Date,...extra});
 assert.equal(done,1);return {store,notices,writes};
}
const request={url:'https://wsapi.wskyzx.com:26110/api/WechatInfo/GetUserInfo',headers:{Authorization:authorization},body:'{"userId":123456789012345678901234}'};
const captured=capture(request),envelope=JSON.parse(captured.store[key]);assert.equal(envelope.userId,'123456789012345678901234');assert.equal(envelope.authorization,authorization);assert.deepEqual(Object.keys(envelope).sort(),['authorization','capturedAt','userId','version']);assert.equal(captured.notices.length,1);assert.doesNotMatch(JSON.stringify(captured.notices),/SYNTHETIC|123456789/);
assert.equal(capture(request,captured.store).notices.length,0);assert.equal(capture({...request,headers:{authorization},body:'{"userId":"1234567890"}'}).writes.length,1);
for(const invalid of [
 {...request,url:request.url.replace('wsapi.wskyzx.com','example.com')},
 {...request,url:request.url.replace('GetUserInfo','GetPayRrcode')},
 {...request,url:request.url.replace('GetUserInfo','GetUserInfoExtra')},
 {...request,headers:{}},
 {...request,body:'bad json'},
 {...request,body:'{"userId":null}'},
 {...request,body:'{"userId":1.2}'},
 {...request,body:'{"userId":1234567890123456789012345}'},
])assert.equal(capture(invalid).writes.length,0);
assert.equal(capture(request,{},{$response:{body:'{"qrcode":"should not inspect"}'}}).writes.length,0);
assert.equal(capture(request,{},{$prefs:{valueForKey:()=>null,setValueForKey:()=>false}}).notices.length,0);
assert.doesNotMatch(source,/\$task|\$httpClient|console\.|sessionKey|encryptedData/);
const conf=fs.readFileSync('Wusheng-Bus-Login.conf','utf8'),rule=conf.split(/\r?\n/).find(l=>l.includes(' url '));assert.match(conf,/hostname = wsapi\.wskyzx\.com:26110/);assert.equal(conf.split(/\r?\n/).filter(l=>l.includes(' url ')).length,1);assert.match(rule,/url script-request-body/);assert.ok(new RegExp(rule.split(' url ')[0]).test(request.url));
const built=esbuild.buildSync({entryPoints:['scripting/wusheng-bus/login.ts'],bundle:true,format:'cjs',platform:'neutral',external:['scripting','./api'],write:false,logOverride:{'impossible-typeof':'silent'}}).outputFiles[0].text;
function fixture(){
 const m={exports:{}},memory={},keys={},calls=[];let reply={val:captured.store[key]},fail=false,mutation;
 const api={balance:async a=>{calls.push({type:'verify',userId:a.userId});if(mutation)mutation();if(fail)throw Error('authorization expired');return {balance:0,fetchedAt:Date.now()}}};
 vm.runInNewContext(built,{module:m,exports:m.exports,require:n=>n==='scripting'?{fetch:async(url,opts)=>{calls.push({type:'boxjs',url,opts});return {ok:true,text:async()=>JSON.stringify(reply)}}}:n==='./api'?api:require(n),Storage:{get:k=>memory[k],set:(k,v)=>memory[k]=v},Keychain:{get:k=>keys[k],set:(k,v)=>keys[k]=v},Date});
 return {login:m.exports,memory,keys,calls,setReply:v=>reply=v,fail:()=>fail=true,mutate:f=>mutation=f};
}
(async()=>{
 const f=fixture();assert.equal(f.calls.length,0);const card=await f.login.loginFromBoxJS();assert.equal(card.balance,0);assert.equal(f.calls.length,2);assert.equal(f.calls[0].url,'https://boxjs.com/query/data/'+key);assert.equal(f.calls[1].userId,envelope.userId);assert.equal(JSON.parse(f.keys['wusheng.bus.auth.v1']).authorization,authorization);assert.equal(f.memory['wusheng.bus.balance'].balance,0);assert.doesNotMatch(JSON.stringify(f.memory),/SYNTHETIC|123456789/);
 const install=f.login.captureInstallURL();assert.ok(install.startsWith('quantumult-x:///add-resource?remote-resource='));assert.doesNotMatch(install,/update-configuration/);const resource=JSON.parse(decodeURIComponent(install.split('remote-resource=')[1]));assert.equal(Object.keys(resource).length,1);assert.equal(resource.rewrite_remote.length,1);assert.match(resource.rewrite_remote[0],/Wusheng-Bus-Login\.conf/);
 const count=f.calls.length;await assert.rejects(()=>f.login.loginFromBoxJS('evil.example'),/BoxJS/);assert.equal(f.calls.length,count);
 const oldKey=f.keys['wusheng.bus.auth.v1'];f.fail();await assert.rejects(()=>f.login.loginFromBoxJS(),/expired/);assert.equal(f.keys['wusheng.bus.auth.v1'],oldKey);
 const absent=fixture();absent.setReply({});await assert.rejects(()=>absent.login.loginFromBoxJS(),/还没有抓到/);assert.equal(Object.keys(absent.keys).length,0);assert.equal(absent.calls.length,1);
 const malformed=fixture();malformed.setReply({val:'{"version":1}'});await assert.rejects(()=>malformed.login.loginFromBoxJS(),/不完整/);assert.equal(Object.keys(malformed.keys).length,0);
 const changed=fixture();changed.mutate(()=>changed.keys['wusheng.bus.auth.v1']=JSON.stringify({authorization:'Bearer OTHER_SYNTHETIC_TOKEN_12345',userId:'9'}));await assert.rejects(()=>changed.login.loginFromBoxJS(),/账号已变化/);assert.equal(JSON.parse(changed.keys['wusheng.bus.auth.v1']).userId,'9');
 const index=fs.readFileSync('scripting/wusheng-bus/index.tsx','utf8');assert.doesNotMatch(index,/DocumentPicker|SecureField|decodeAccount|readAsString|ImportAccount/);assert.match(index,/从圈 X 导入登录/);
 console.log('PASS scoped QX capture, exact long user IDs, no sensitive notices or extra traffic, BoxJS login verified before Keychain save, invalid/expired capture preserves account, add-resource scheme and no-file login UI.');
})().catch(e=>{console.error(e);process.exitCode=1});
