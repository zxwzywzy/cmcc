const assert=require('node:assert/strict'),vm=require('node:vm'),esbuild=require('esbuild'),crypto=require('node:crypto');
const memory={},keys={};
function moduleOf(entry,extra={}){const m={exports:{}};const code=esbuild.buildSync({entryPoints:[entry],bundle:true,format:'cjs',platform:'neutral',external:['scripting'],jsxFactory:'h',write:false,logOverride:{'impossible-typeof':'silent'}}).outputFiles[0].text;vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>n==='scripting'?new Proxy({},{get:(_,k)=>k}):require(n),Storage:{get:k=>memory[k],set:(k,v)=>memory[k]=v},Keychain:{get:k=>keys[k],set:(k,v)=>keys[k]=v,remove:k=>delete keys[k]},setTimeout,clearTimeout,Date,h:(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props,children}),...extra});return m.exports}
const model=moduleOf('scripting/wusheng-bus/model.ts'),account=moduleOf('scripting/wusheng-bus/account.ts');
assert.equal(model.normalizeAccount({code:0,data:{cardCashfee:0,cardNo:'123456'}}).balance,0);
assert.equal(model.normalizeAccount({code:0,data:{}}).balance,undefined);
assert.equal(model.normalizeAccount({code:0,data:{cardCashfee:'235'}}).balance,2.35);
assert.throws(()=>model.normalizeAccount({code:401,data:{cardCashfee:999}}));
const choice={line:{id:'1135524964556869651'},direction:1,station:{id:'3',no:3}},stations=[{no:1,distance:0},{no:2,distance:500},{no:3,distance:500}],row={lineId:choice.line.id,bizType:1,stationNo:1,speed:30};
assert.equal(model.arrivals([row],choice,stations)[0].stops,2);assert.equal(model.arrivals([row],choice,stations)[0].minutes,2);
assert.equal(model.arrivals([{...row,speed:0}],choice,stations)[0].minutes,undefined);
assert.equal(model.arrivals([row],choice,[{no:1}])[0].minutes,undefined);
assert.equal(model.arrivals([{...row,bizType:2}],choice,stations).length,0);
assert.equal(model.arrivals([],choice,stations).length,0);
assert.equal(model.arrivals([{...row,stationNo:4}],choice,stations).length,0);
assert.equal(model.arrivals([{...row,stationNo:3,ioStation:1}],choice,stations)[0].atStation,true);
const password='test-password-only',salt=crypto.randomBytes(16),iv=crypto.randomBytes(16),key=crypto.pbkdf2Sync(password,salt,100000,64,'sha256'),payload={authorization:'Bearer SYNTHETIC_TEST_TOKEN_12345',userId:'1234567890'},enc=crypto.createCipheriv('aes-256-cbc',key.subarray(0,32),iv),ciphertext=Buffer.concat([enc.update(JSON.stringify(payload)),enc.final()]).toString('base64');
const envelope={version:'WB1',iterations:100000,salt:salt.toString('hex'),iv:iv.toString('hex'),ciphertext};envelope.mac=crypto.createHmac('sha256',key.subarray(32)).update('WB1|'+envelope.salt+'|'+envelope.iv+'|'+ciphertext).digest('hex');
const decoded=account.decodeAccount(JSON.stringify(envelope),password);assert.equal(decoded.userId,payload.userId);assert.equal(decoded.authorization,payload.authorization);assert.throws(()=>account.decodeAccount(JSON.stringify(envelope),'wrong'));assert.throws(()=>account.decodeAccount(JSON.stringify({...envelope,ciphertext:'bad'}),password));account.saveAccount(decoded);assert.equal(account.readAccount().userId,payload.userId);account.forgetAccount();assert.equal(account.readAccount(),undefined);
const view=moduleOf('scripting/wusheng-bus/view.tsx');function flat(n){if(n==null)return '';if(Array.isArray(n))return n.map(flat).join(' ');return typeof n==='object'?flat(n.children):String(n)}
for(const family of ['systemSmall','systemMedium','systemLarge']){const text=flat(view.BusView({snapshot:{choice:{...choice,line:{...choice.line,name:'101'},station:{...choice.station,name:'武胜公交站'}},items:[{stops:2,minutes:2}],time:Date.now()},card:{balance:0,fetchedAt:Date.now()},family}));assert.match(text,/还剩 2 站/);assert.match(text,/¥0.00/);assert.match(text,/武胜公交站/);assert.match(flat(view.BusView({family})),/选择你的候车站/)}
(async()=>{let called=false;const api=moduleOf('scripting/wusheng-bus/api.ts',{require:n=>n==='scripting'?{fetch:()=>{called=true;throw Error('should not call')},WebSocket:class{}}:require(n)});await assert.rejects(()=>api.post('/api/Pay/Charge',{}),/不支持/);assert.equal(called,false);console.log('Bus: balance units, missing/zero, route/direction, arrival estimates, encrypted import, tampering, three widget sizes and read-only allowlist passed.');})().catch(e=>{console.error(e);process.exitCode=1});
