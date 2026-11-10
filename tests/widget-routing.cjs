const vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const built=esbuild.buildSync({entryPoints:['scripting/carriers/widget.tsx'],bundle:true,format:'cjs',platform:'neutral',jsxFactory:'h',jsxFragment:'Fragment',external:['scripting','./hub','./mobile/styles/index','./mobile/settings','./mobile/slots','./app_intents'],write:false}).outputFiles[0].text;
async function run(parameter,family="systemMedium",loaded=[],selection,styles={}){
 const calls={legacy:[],providers:[],overview:0,present:0,tiles:[],buttons:[],skins:[],switches:0};
 const stubs={scripting:{Widget:{parameter,family,present:()=>calls.present++}},'./hub':{
  preferences:()=>({refresh:120}),carrierStyles:['全景','账单卡','大字余额'],getCarrierStyle:provider=>styles[provider]||'全景',loadAll:async()=>{calls.overview++;return ['cmcc','unicom','telecom','broadnet'].map(provider=>({provider,...(loaded.includes(provider)?{metrics:{balance:1}}:{})}))},
  loadProvider:async provider=>{calls.providers.push(provider);return {provider}},providerNames:{cmcc:'中国移动',unicom:'中国联通',telecom:'中国电信',broadnet:'中国广电'},value:()=>'',flowValue:()=>'',timeValue:()=>''
 },'./mobile/styles/index':{parseParam:p=>{calls.legacy.push(p);return {style:p,accounts:[]}},resolveStyle:()=>({}),styleById:()=>({id:'W'}),renderStyle:(style,family,options)=>{if(options.carrierSwitch){calls.switches++;if(options.carrier){calls.tiles.push(options.carrier.provider);calls.skins.push(styles[options.carrier.provider]||'全景')}}return {original:true}}},'./mobile/settings':{getLook:()=>({})},'./mobile/slots':{loadSlots:async()=>[]},'./app_intents':{readPage:()=>0,readCarrier:()=>selection,CarrierSetIntent:({provider})=>{calls.buttons.push(provider);return {provider}}}};
 const m={exports:{}};vm.runInNewContext(built,{module:m,exports:m.exports,require:name=>stubs[name],h:(type,props)=>{if(type?.name==='CarrierContent'){calls.tiles.push(props.state.provider);calls.skins.push(props.skin)}if(typeof type==='function')return type(props);return {}},Fragment:'Fragment',Date,console});
 await new Promise(resolve=>setTimeout(resolve,10));assert.equal(calls.present,1);return calls;
}
(async()=>{
 for(const [input,expected] of [['全景','全景'],['账单卡 1234','账单卡 1234'],['D 1234','D 1234'],['1234','1234'],['主号:1234,副号:5678','主号:1234,副号:5678'],['移动',''],['移动 账单卡 1234','账单卡 1234'],['cmcc 全景','全景']]){
  const c=await run(input);assert.deepEqual(c.legacy,[expected]);assert.equal(c.overview,0);
 }
 for(const p of ['总览','合集','overview']){const c=await run(p);assert.equal(c.overview,1);assert.equal(c.legacy.length,0)}
 for(const [p,id] of [['联通','unicom'],['电信','telecom'],['广电','broadnet']]){const c=await run(p);assert.deepEqual(c.providers,[id]);assert.equal(c.legacy.length,0)}
 const blankMedium=await run('','systemMedium',['telecom']);assert.equal(blankMedium.overview,1);assert.deepEqual(blankMedium.tiles,['telecom']);assert.equal(blankMedium.switches,1);
 const blankLarge=await run('','systemLarge',['cmcc','telecom']);assert.equal(blankLarge.overview,1);assert.equal(blankLarge.tiles.length,4);
 const blankSmall=await run('','systemSmall');assert.deepEqual(blankSmall.legacy,['']);
 const medium=await run('总览','systemMedium',['cmcc','telecom','broadnet']);
 assert.deepEqual(medium.tiles,['cmcc']);assert.equal(medium.switches,1);
 const switched=await run('总览','systemMedium',['cmcc','telecom','broadnet'],'broadnet');assert.deepEqual(switched.tiles,['broadnet']);
 const missing=await run('总览','systemMedium',['cmcc'],'telecom');assert.deepEqual(missing.tiles,['telecom']);assert.equal(missing.switches,1);
 const large=await run('总览','systemLarge',['cmcc','telecom','broadnet']);
 for(const id of ['cmcc','telecom','broadnet'])assert.ok(large.tiles.includes(id));
 assert.equal(large.tiles.length,4);
 const saved=await run('总览','systemMedium',['broadnet'],'broadnet',{broadnet:'账单卡'});assert.deepEqual(saved.skins,['账单卡']);
 const fixed=await run('电信 大字余额');assert.deepEqual(fixed.skins,['大字余额']);
 const preferred=await run('联通','systemSmall',[],undefined,{unicom:'账单卡'});assert.deepEqual(preferred.skins,['账单卡']);
 console.log('PASS 24 widget cases: blank medium/large, legacy routes, title switching, saved per-carrier style and parameter overrides.');
})().catch(e=>{console.error(e);process.exitCode=1});
