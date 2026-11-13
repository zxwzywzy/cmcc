const assert=require('node:assert/strict'),vm=require('node:vm'),esbuild=require('esbuild');
const memory={},m={exports:{}},sdk=new Proxy({Script:{name:'Bus',createRunURLScheme:()=> 'scripting://route'},AppIntentManager:{register:()=>()=>({})},AppIntentProtocol:{AppIntent:0}},{get:(o,k)=>k in o?o[k]:String(k)});
const code=esbuild.buildSync({stdin:{contents:"export * from './scripting/wusheng-bus/model';export * from './scripting/wusheng-bus/nearby';export * from './scripting/wusheng-bus/appearance';export * from './scripting/wusheng-bus/nearby-view';export * from './scripting/wusheng-bus/view'",resolveDir:process.cwd(),loader:'tsx'},bundle:true,format:'cjs',platform:'neutral',external:['scripting'],jsxFactory:'h',write:false,logOverride:{'impossible-typeof':'silent'}}).outputFiles[0].text;
vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>n==='scripting'?sdk:require(n),Storage:{get:k=>memory[k],set:(k,v)=>memory[k]=v},Date,h:(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props:props||{},children})});
const ui=m.exports,now=Date.now(),stations=[1,2,3,4,5].map(no=>({id:'s'+no,no,name:'站'+no,distance:no===1?0:500,latitude:30.3+no*0.001,longitude:106.3}));
const choice={line:{id:'1',name:'101',end:'合川区沙鱼镇'},direction:1,station:stations[4],destination:'合川区沙鱼镇'};
const first={lineId:'1',vehicleId:'90071992547409931',bizType:1,stationNo:4,license:'川X12345',speed:30,lat:30.304, lng:106.3};
const second={...first,vehicleId:'90071992547409932',license:'川X54321',speed:15};
const third={...first,vehicleId:'90071992547409933',license:'川X98765',stationNo:2};
const raw=[second,first,first,third,{...first,bizType:2,license:'川X00000'}],items=ui.arrivals(raw,choice,stations),positions=ui.positions(raw,{choice,stations},stations[4]);
assert.equal(items.length,3);assert.equal(items[0].plate,'川X12345');assert.equal(items[1].plate,'川X54321');assert.equal(items[0].vehicleId,first.vehicleId);assert.equal(items[0].minutes,1);assert.equal(items[1].minutes,2);
const service={choice,items,positions};assert.equal(ui.arrivalVehicle(service).plate,'川X12345','same-station vehicles must match by identity, not only station number');
assert.match(ui.followingLabel(items[1],now),/下一辆 · 约\d{2}:\d{2} · 2分钟/);assert.equal(ui.followingLabel(items[1],now,false),undefined);assert.match(ui.followingLabel({...items[1],minutes:undefined},now),/时间待更新/);assert.equal(ui.vehiclePlate({license:'<secret>'}),undefined);
const snapshot={stop:{id:'physical',name:'合川区沙鱼镇',meters:51},services:[service],time:now};
function flat(n){if(n==null)return '';if(Array.isArray(n))return n.map(flat).join(' ');return typeof n==='object'?flat(n.children):String(n)}
for(const style of ui.BUS_STYLES)for(const family of ['systemSmall','systemMedium','systemLarge']){
 ui.saveStyle(family,style);const shown=flat(ui.NearbyView({snapshot,family,interactive:true}));assert.match(shown,/川X12345/);assert.doesNotMatch(shown,/直线距本站|近合川区|近站4/);assert.match(shown,/往合川区沙鱼镇/);
 if(family==='systemSmall')assert.doesNotMatch(shown,/下一辆/);else assert.match(shown,/下一辆 · 约/);
 if(family==='systemLarge')assert.match(shown,/川X54321/);
 const stale=flat(ui.NearbyView({snapshot:{...snapshot,stale:true},family}));assert.doesNotMatch(stale,/下一辆|川X12345|川X54321/);
 const fixed=flat(ui.BusView({snapshot:{choice,items,vehicleCount:3,time:now},family}));assert.match(fixed,/川X12345/);if(family!=='systemSmall')assert.match(fixed,/下一辆/);
 const unknown={...snapshot,services:[{...service,items:items.map(a=>({...a,plate:undefined,vehicleId:undefined})),positions:positions.map(p=>({...p,plate:undefined,vehicleId:undefined}))}]};assert.match(flat(ui.NearbyView({snapshot:unknown,family})),/车牌未上报/);
}
console.log('PASS exact vehicle/plate pairing, duplicate and reverse-direction isolation, compact line metadata, current plates across all four styles and sizes, room-aware next arrivals, absolute ETA clocks and missing/stale data honesty.');
