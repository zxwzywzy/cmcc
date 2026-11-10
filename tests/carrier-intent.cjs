const vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const code=esbuild.buildSync({entryPoints:['scripting/carriers/app_intents.tsx'],bundle:true,format:'cjs',platform:'neutral',external:['scripting','./mobile/api'],write:false}).outputFiles[0].text;
const data={'cmcc.page':3},handlers={};let reloads=0;
const moduleObject={exports:{}};
vm.runInNewContext(code,{module:moduleObject,exports:moduleObject.exports,Storage:{get:k=>data[k],set:(k,v)=>data[k]=v},require:name=>name==='scripting'?{AppIntentManager:{register:o=>{handlers[o.name]=o.perform;return params=>({name:o.name,params})}},AppIntentProtocol:{AppIntent:0},Widget:{reloadAll:()=>reloads++}}:{clearCache:()=>{}}});
(async()=>{
 assert.equal(moduleObject.exports.readCarrier(),undefined);
 for(const provider of ['cmcc','unicom','telecom','broadnet']){await handlers.CarrierHubSelectProvider({provider});assert.equal(moduleObject.exports.readCarrier(),provider);assert.equal(data['cmcc.page'],3)}
 assert.equal(reloads,4);
 await handlers.CarrierHubSelectProvider({provider:'unknown'});assert.equal(moduleObject.exports.readCarrier(),'broadnet');assert.equal(reloads,4);
 assert.equal(moduleObject.exports.nextCarrier('cmcc',['cmcc','telecom','broadnet']),'telecom');
 assert.equal(moduleObject.exports.nextCarrier('broadnet',['cmcc','telecom','broadnet']),'cmcc');
 await handlers.CarrierHubNextProvider({current:'cmcc',available:['cmcc','telecom']});assert.equal(moduleObject.exports.readCarrier(),'telecom');assert.equal(data['cmcc.page'],3);
 console.log('PASS carrier intent: all providers, persistence, independent mobile paging, invalid selection.');
})().catch(e=>{console.error(e);process.exitCode=1});
