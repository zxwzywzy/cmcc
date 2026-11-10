const vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const built=esbuild.buildSync({entryPoints:['scripting/carriers/widget.tsx'],bundle:true,format:'cjs',platform:'neutral',jsxFactory:'h',jsxFragment:'Fragment',external:['scripting','./hub','./mobile/styles/index','./mobile/settings','./mobile/slots','./app_intents'],write:false}).outputFiles[0].text;
async function run(parameter,family="systemMedium",loaded=[]){
 const calls={legacy:[],providers:[],overview:0,present:0,tiles:[]};
 const stubs={scripting:{Widget:{parameter,family,present:()=>calls.present++}},'./hub':{
  preferences:()=>({refresh:120}),loadAll:async()=>{calls.overview++;return ['cmcc','unicom','telecom','broadnet'].map(provider=>({provider,...(loaded.includes(provider)?{metrics:{balance:1}}:{})}))},
  loadProvider:async provider=>{calls.providers.push(provider);return {provider}},providerNames:{},value:()=>'',flowValue:()=>'',timeValue:()=>''
 },'./mobile/styles/index':{parseParam:p=>{calls.legacy.push(p);return {style:p,accounts:[]}},resolveStyle:()=>({}),renderStyle:()=>({original:true})},'./mobile/settings':{getLook:()=>({})},'./mobile/slots':{loadSlots:async()=>[]},'./app_intents':{readPage:()=>0}};
 const m={exports:{}};vm.runInNewContext(built,{module:m,exports:m.exports,require:name=>stubs[name],h:(type,props)=>{if(props?.state)calls.tiles.push(props.state.provider);return {}},Fragment:'Fragment',Date,console});
 await new Promise(resolve=>setTimeout(resolve,10));assert.equal(calls.present,1);return calls;
}
(async()=>{
 for(const [input,expected] of [['',''],['全景','全景'],['账单卡 1234','账单卡 1234'],['D 1234','D 1234'],['1234','1234'],['主号:1234,副号:5678','主号:1234,副号:5678'],['移动',''],['移动 账单卡 1234','账单卡 1234'],['cmcc 全景','全景']]){
  const c=await run(input);assert.deepEqual(c.legacy,[expected]);assert.equal(c.overview,0);
 }
 for(const p of ['总览','合集','overview']){const c=await run(p);assert.equal(c.overview,1);assert.equal(c.legacy.length,0)}
 for(const [p,id] of [['联通','unicom'],['电信','telecom'],['广电','broadnet']]){const c=await run(p);assert.deepEqual(c.providers,[id]);assert.equal(c.legacy.length,0)}
 const medium=await run('总览','systemMedium',['cmcc','telecom','broadnet']);
 assert.deepEqual(medium.tiles,['cmcc','telecom','broadnet']);
 const large=await run('总览','systemLarge',['cmcc','telecom','broadnet']);
 for(const id of ['cmcc','telecom','broadnet'])assert.ok(large.tiles.includes(id));
 assert.equal(large.tiles.length,4);
 console.log('PASS 17 widget cases: legacy routing and three-carrier medium/large overview.');
})().catch(e=>{console.error(e);process.exitCode=1});
