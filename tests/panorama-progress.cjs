const vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const code=esbuild.buildSync({entryPoints:['scripting/carriers/carrier-meters.tsx'],bundle:true,format:'cjs',platform:'neutral',jsxFactory:'h',external:['scripting','./mobile/ui','./carrier-title','./carrier-content','./hub'],write:false}).outputFiles[0].text;
const m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,h:(type,props,...children)=>({type,props,children}),require:n=>n==='scripting'?{HStack:'HStack',VStack:'VStack',Text:'Text',Spacer:'Spacer'}:n==='./mobile/ui'?{Root:'Root',Num:'Num',Bar:'Bar',RED:{}}:n==='./hub'?{flowValue:n=>n===undefined?'—':`${n/1024} GB`}:{} });
function all(node,type){if(!node||typeof node!=='object')return [];return [...(node.type===type?[node]:[]),...(node.children||[]).flat(Infinity).flatMap(x=>all(x,type))]}
const ctx={th:{t1:'label',t2:'secondaryLabel',t3:'secondaryLabel'}};
let view=m.exports.RemainingMeter({ctx,label:'通用',remain:2048,total:10240,used:8192});assert.equal(all(view,'Bar')[0].props.percent,20);assert.ok(all(view,'Text').some(n=>n.children.includes('20%')));
view=m.exports.RemainingMeter({ctx,label:'通用',remain:2048});assert.equal(all(view,'Bar')[0].props.percent,0);assert.ok(all(view,'Text').some(n=>n.children.includes('—')));assert.ok(all(view,'Text').some(n=>n.children.includes('总量未返回')));
view=m.exports.RemainingMeter({ctx,label:'语音',remain:0,total:300,used:300,voice:true});assert.ok(all(view,'Text').some(n=>n.children.includes('0%')));
view=m.exports.RemainingMeter({ctx,label:'语音',remain:0,total:0,voice:true});assert.ok(all(view,'Text').some(n=>n.children.includes('—')));
console.log('PASS panorama progress: real totals, missing totals, zero remaining and zero total.');
