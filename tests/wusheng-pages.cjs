const assert=require('node:assert/strict'),vm=require('node:vm'),esbuild=require('esbuild');const store={};const m={exports:{}};
vm.runInNewContext(esbuild.buildSync({entryPoints:['scripting/wusheng-bus/paging.ts'],bundle:true,format:'cjs',write:false}).outputFiles[0].text,{module:m,exports:m.exports,Storage:{get:k=>store[k],set:(k,v)=>store[k]=v}});
const p=m.exports,s={stop:{id:'stop-A'},services:Array.from({length:19},(_,i)=>({route:i,choice:{line:{id:String(i)},direction:1}}))};
for(const family of ['systemSmall','systemMedium','systemLarge']){const seen=new Set(),count=p.servicePage(s,family).count;for(let n=0;n<count;n++){for(const row of p.servicePage(s,family).rows)seen.add(row.route);p.turnPage(s,family,'stop-A',1)}assert.equal(seen.size,19);assert.equal(p.servicePage(s,family).index,0);p.turnPage(s,family,'stop-A',-1);assert.equal(p.servicePage(s,family).index,count-1);assert.equal(p.servicePage({...s,stop:{id:'stop-B'}},family).index,0);p.turnPage(s,family,'old-stop',1);assert.equal(p.servicePage(s,family).index,count-1)}
assert.equal(p.servicePage(undefined,'systemMedium').count,1);assert.equal(p.servicePage(undefined,'systemMedium').rows.length,0);
const fs=require('node:fs'),index=fs.readFileSync('scripting/wusheng-bus/index.tsx','utf8');assert.match(index,/title="更新脚本"/);assert.match(index,/Script.createImportScriptsURLScheme/);assert.match(index,/packages\/wusheng-bus.scripting/);
console.log('PASS all 19 routes reachable at every size, next/previous wrapping, station-change reset, stale click ignored, update button uses official importer.');

const d={stop:{id:'directions'},services:[{choice:{line:{id:'101'},direction:1}},{choice:{line:{id:'101'},direction:2}},{choice:{line:{id:'102'},direction:1}},{choice:{line:{id:'101'},direction:1}}]};
assert.equal(p.servicePage(d,'systemMedium','1').routeCount,2);assert.equal(p.servicePage(d,'systemMedium','1').total,2);
p.switchDirection(d,'systemMedium','directions','1');assert.equal(p.servicePage(d,'systemMedium','1').direction,2);assert.equal(p.servicePage(d,'systemMedium','1').total,1);assert.equal(p.servicePage(d,'systemMedium','1').routeCount,1);assert.equal(p.servicePage(d,'systemMedium','2').direction,1);
p.switchDirection(d,'systemMedium','directions','1');assert.equal(p.servicePage(d,'systemMedium','1').direction,1);assert.equal(p.servicePage(d,'systemMedium','1').total,2);
store['wusheng.bus.direction.systemMedium.stack1']=0;assert.equal(p.selectedDirection('systemMedium','1'),1);
const emptyDirection={...d,services:d.services.filter(row=>row.choice.direction===2)};assert.equal(p.servicePage(emptyDirection,'systemMedium','1').rows.length,0);
assert.equal(p.servicePage(s,'systemMedium','2').index,1);assert.equal(p.servicePage(s,'systemLarge','10').index,2);
assert.equal(p.stackSlot('叠放2'),'2');assert.equal(p.stackSlot('叠放10'),'10');assert.equal(p.stackSlot('叠放11'),'');
console.log('PASS per-direction unique line count, up/down toggle, legacy direction migration, empty direction, per-stack isolation and initial page offsets.');
