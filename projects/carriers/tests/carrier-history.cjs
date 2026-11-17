const vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const source=esbuild.buildSync({entryPoints:['scripting/carriers/carrier-design.ts'],bundle:true,format:'cjs',platform:'neutral',write:false}).outputFiles[0].text;
const store={},moduleObject={exports:{}};vm.runInNewContext(source,{module:moduleObject,exports:moduleObject.exports,Storage:{get:k=>store[k],set:(k,v)=>store[k]=v},Date});
const design=moduleObject.exports,now=Date.now();
design.rememberUsage({provider:'unicom',fetchedAt:now-7200000,flowMB:5000,voice:200});design.rememberUsage({provider:'unicom',fetchedAt:now-7200000,flowMB:5000,voice:200});assert.equal(store['carrier.hub.usage.v1.unicom'].length,1);
design.rememberUsage({provider:'unicom',fetchedAt:now-7100000,flowMB:4900,voice:200});assert.equal(store['carrier.hub.usage.v1.unicom'].length,1);
assert.equal(design.usage('telecom').days,0);assert.equal(design.usage('telecom').average,null);
store['carrier.hub.usage.v1.unicom']=Array.from({length:9},(_,i)=>({time:now-(8-i)*86400000,flow:20000-i*300}));assert.equal(design.usage('unicom').average,300);assert.ok(design.usage('unicom').daily(3).every(x=>x===300));
store['carrier.hub.usage.v1.unicom']=[{time:now-86400000,flow:100},{time:now,flow:500}];assert.equal(design.usage('unicom').daily(1)[0],null);
design.clearUsage('unicom');assert.equal(design.usage('unicom').days,0);
function luminance(hex){const c=hex.slice(1).match(/../g).map(s=>parseInt(s,16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2]}
for(const [provider,identity] of Object.entries(design.identities))for(const mode of ['light','dark']){const a=luminance(identity.ink[mode]),b=luminance(identity.wash[mode]),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert.ok(ratio>=4.5,provider+' '+mode+' '+ratio)}
console.log('PASS usage history: dedupe, merge window, provider isolation, real daily deltas, reset exclusion, clear; all brand ink/wash pairs meet 4.5:1.');
