const assert=require('node:assert/strict'),vm=require('node:vm'),esbuild=require('esbuild');
const code=esbuild.buildSync({entryPoints:['scripting/wusheng-bus/api.ts'],bundle:true,format:'cjs',platform:'neutral',external:['scripting'],write:false,logOverride:{'impossible-typeof':'silent'}}).outputFiles[0].text;
const payload='[{"lineId":1135524964556869651,"bizType":1,"stationNo":14,"lat":30.35,"lng":106.3}]';
function harness({native=false,binary=false,event=false,invalid=false,mode='ok',http=false}={}){
 const timers=new Map(),memory={},calls={construct:0,send:0,close:0,fetch:0};let id=0;
 class Socket{
  constructor(){calls.construct++;queueMicrotask(()=>{if(mode==='error')this.onerror?.(Error('private diagnostic text must not persist'));else if(mode!=='connect_timeout')this.onopen?.()})}
  send(){calls.send++;if(mode==='send_error')throw Error('private message');if(mode==='response_timeout')return;queueMicrotask(()=>{const raw=invalid?'not-json-secret':payload;const data=binary?{toRawString:encoding=>{assert.equal(encoding,'utf-8');return raw}}:raw;this.onmessage?.(event?{data}:data)})}
  close(){calls.close++;this.onclose?.('normal')}
 }
 const sdk={fetch:async(url)=>{calls.fetch++;if(!http)throw Error('No HTTP for socket-only checks');assert.ok(url.endsWith('/api/AppBusiness/GetBusLine'));return {ok:true,text:async()=>JSON.stringify({code:0,data:{data:[{lineId:'1135524964556869651',lineName:'101'}]}})}},...(native||mode==='unavailable'?{}:{WebSocket:Socket})},m={exports:{}};
 vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>n==='scripting'?sdk:require(n),...(native?{WebSocket:Socket}:{}),Storage:{get:k=>memory[k],set:(k,v)=>memory[k]=v},Keychain:{get:()=>{throw Error('No account access')}},Date,queueMicrotask,setTimeout:(f,ms)=>{timers.set(++id,{f,ms});return id},clearTimeout:id=>timers.delete(id)});
 return {api:m.exports,calls,timers,memory,async expire(){await new Promise(r=>setImmediate(r));const last=[...timers.entries()].sort((a,b)=>a[1].ms-b[1].ms)[0];assert.ok(last);timers.delete(last[0]);last[1].f();await new Promise(r=>setImmediate(r))}};
}
(async()=>{
 for(const opts of [{native:true},{native:true,binary:true},{native:true,event:true},{native:true,binary:true,event:true},{}]){
  const h=harness(opts),rows=await h.api.vehicleBatch([{lineId:'1135524964556869651',upOrDown:1}]);
  assert.equal(rows.length,1);assert.equal(String(rows[0].lineId),'1135524964556869651');assert.equal(h.calls.close,1);assert.equal(h.timers.size,0);assert.equal(h.calls.fetch,0);
 }
 for(const mode of ['error','send_error','connect_timeout','response_timeout']){
  const h=harness({native:true,mode}),pending=h.api.vehicles('1',1),rejected=assert.rejects(pending,/实时车辆/);
  if(mode.endsWith('timeout'))await h.expire();await rejected;
  assert.equal(h.timers.size,0);assert.equal(h.calls.close,1);assert.ok(!JSON.stringify(h.memory).includes('private'));
 }
 const invalid=harness({native:true,invalid:true}),failure=assert.rejects(invalid.api.vehicles('1',1),/实时车辆/);await invalid.expire();await failure;assert.equal(invalid.timers.size,0);assert.ok(!JSON.stringify(invalid.memory).includes('secret'));
 const absent=harness({mode:'unavailable'});await assert.rejects(absent.api.vehicles('1',1),/更新 Scripting/);assert.equal(absent.api.vehicleConnectionStatus().source,'none');assert.equal(absent.timers.size,0);assert.equal(absent.calls.construct,0);
 const diagnostic=harness({native:true,binary:true,http:true});assert.match(await diagnostic.api.checkTransitConnection(),/101车辆通道已连接，返回 1 条/);assert.equal(diagnostic.calls.fetch,1);assert.equal(diagnostic.api.vehicleConnectionStatus().source,'global');assert.equal(diagnostic.api.vehicleConnectionStatus().stage,'received');assert.ok(!JSON.stringify(diagnostic.memory).includes('1135524964556869651'));
 console.log('PASS global and module WebSocket hosts, native Data and event payloads, exact long IDs, typed connection failures, timer cleanup and no credential/QR side effects.');
})().catch(e=>{console.error(e);process.exitCode=1});
