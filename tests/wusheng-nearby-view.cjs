const esbuild=require('esbuild'),vm=require('node:vm'),assert=require('node:assert/strict');
const m={exports:{}},code=esbuild.buildSync({entryPoints:['scripting/wusheng-bus/nearby-view.tsx'],bundle:true,format:'cjs',platform:'neutral',jsxFactory:'h',external:['scripting'],write:false,logOverride:{'impossible-typeof':'silent'}}).outputFiles[0].text;
const sdk=new Proxy({Script:{name:'Wusheng Bus',createRunURLScheme:(n,p)=>'scripting://run/'+n+'?page='+p.page},AppIntentManager:{register:()=>()=>({intent:true})},AppIntentProtocol:{AppIntent:0}},{get:(o,k)=>k in o?o[k]:String(k)});
vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>n==='scripting'?sdk:require(n),h:(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props,children}),Date,Storage:{get:()=>undefined}});
function flat(n){if(n==null)return '';if(Array.isArray(n))return n.map(flat).join(' ');return typeof n==='object'?String(n.props?.title||'')+' '+flat(n.children):String(n)}
const snapshot={stop:{id:'stop-A',name:'武胜客运中心站',meters:123},time:Date.now(),otherStops:[{name:'邻近站',meters:300}],services:[{choice:{line:{id:'101',name:'101',end:'终点站'},direction:1,station:{no:3}},items:[{stops:2}],positions:[{stationNo:4,passed:true,distanceMeters:999,stationName:'已驶过站'},{stationNo:1,passed:false,distanceMeters:500,distanceKind:'stations',stationName:'上一站'}]}]};
for(const family of ['systemSmall','systemMedium','systemLarge']){
 const view=m.exports.NearbyView({snapshot,family,interactive:true,card:{balance:0,fetchedAt:Date.now()}}),s=flat(view),controls=view.children.filter(Boolean).at(-1),buttons=controls.children.filter(n=>n?.props?.title);
 assert.equal(buttons.at(-1).props.title,'换向');assert.ok(buttons.at(-1).props.background);assert.match(s,/武胜客运中心站/);assert.match(s,/101/);assert.match(s,/还剩 2 站/);assert.match(s,/站距估算 500米.*近上一站/);assert.doesNotMatch(s,/999|已驶过站|缓存|上次|刷新定位/);
 if(family!=='systemSmall'){assert.match(s,/123 米/);assert.match(s,/1 路.*上行/);assert.match(s,/往终点站/);assert.match(s,/乘车码/);assert.match(s,/0.00/)}
 const stale=flat(m.exports.NearbyView({snapshot:{...snapshot,stale:true},family,card:{balance:1.23,fetchedAt:Date.now()},cardStale:true}));assert.doesNotMatch(stale,/缓存|上次|500米/);assert.match(stale,/预计时间待更新/);assert.match(stale,/1.23/);
 assert.match(flat(m.exports.NearbyView({family})),/打开实时公交查找附近站台/);
 const reverseOnly={...snapshot,services:snapshot.services.map(row=>({...row,choice:{...row.choice,direction:2}}))};assert.match(flat(m.exports.NearbyView({snapshot:reverseOnly,family})),/本站暂无\s*上行\s*线路/);
 const legacy={...snapshot,services:snapshot.services.map(row=>({...row,positions:[{stationName:'上一站',distanceMeters:500,distanceKind:'stations'}]}))};assert.match(flat(m.exports.NearbyView({snapshot:legacy,family})),/距离待更新/);
}
console.log('PASS mobile widget integration: three sizes, nearest arrival distance matching, stale and legacy cache, zero/failed balance, direction empty state and corner controls. Native rendering still requires iPhone.');
