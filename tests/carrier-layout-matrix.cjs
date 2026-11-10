const vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const prefs={};
const code=esbuild.buildSync({entryPoints:['scripting/carriers/carrier-layout.tsx'],bundle:true,format:'cjs',platform:'neutral',jsxFactory:'h',external:['scripting','./mobile/ui','./mobile/settings','./carrier-title','./hub'],write:false}).outputFiles[0].text;
const names={cmcc:'中国移动',unicom:'中国联通',telecom:'中国电信',broadnet:'中国广电'};
const theme={t1:'label',t2:'secondaryLabel',t3:'secondaryLabel',track:'separator',card:'secondarySystemBackground',bg:'systemBackground'};
const hub={getCarrierStyle:()=> '全景',getComparePartner:()=>undefined,providerIds:Object.keys(names),providerNames:names,value:(n,u)=>typeof n==='number'&&Number.isFinite(n)?n.toFixed(2)+' '+u:'—',flowValue:n=>typeof n==='number'&&Number.isFinite(n)?(n/1024).toFixed(2)+' GB':'—'};
const store={get:k=>prefs[k],set:(k,v)=>prefs[k]=v};const mod={exports:{}};
vm.runInNewContext(code,{module:mod,exports:mod.exports,Storage:store,h:(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props,children}),require:n=>n==='scripting'?new Proxy({},{get:(_,k)=>String(k)}):n==='./mobile/ui'?{Root:'Root',Num:({value})=>({type:'Text',children:[String(value)]}),Bar:'Bar',makeTheme:()=>theme}:n==='./mobile/settings'?{getLook:()=>({mode:'plain'})}:n==='./carrier-title'?{CarrierTitle:({ctx})=>({type:'CarrierTitle',props:{provider:ctx.carrier.provider}})}:hub,Date});
const styles=['全景','自适应','账单卡','大字余额','今日额度','倒计时','用量预测','用量月报','多号翻页','双号对照','双号全景','四家总览'];
const providers=Object.keys(names),states=providers.map(provider=>({provider,metrics:{provider,balance:21.26,flowMB:2048,flowUsedMB:8192,flowTotalMB:10240,voice:300,voiceUsed:60,voiceTotal:360,fetchedAt:Date.now()}}));
function flatten(node){if(!node||typeof node!=='object')return [];return [node,...(node.children||[]).flat(Infinity).flatMap(flatten)]}
for(const p of providers){prefs['carrier.hub.usage.v1.'+p]=Array.from({length:15},(_,i)=>({time:Date.now()-(14-i)*86400000,flow:20000-i*200,voice:500-i*2}))}
let count=0;
for(const state of states)for(const family of ['systemSmall','systemMedium','systemLarge'])for(const skin of styles){
 if(skin==='四家总览'&&family!=='systemLarge')continue;
 const tree=mod.exports.CarrierLayout({state,family,skin,states,inApp:true,onChange:()=>{}}),nodes=flatten(tree),text=nodes.filter(x=>x.type==='Text').flatMap(x=>x.children||[]).join(' ');
 assert.ok(nodes.some(n=>n.type==='CarrierTitle'&&n.props.provider===state.provider));assert.ok(!/NaN|Infinity|undefined/.test(text),[state.provider,family,skin,text].join(':'));
 for(const n of nodes)if(n.type==='Bar')assert.ok(Number.isFinite(n.props.percent)&&n.props.percent>=0&&n.props.percent<=100);
 count++;
}
for(const family of ['systemSmall','systemMedium','systemLarge']){
 const tree=mod.exports.CarrierLayout({state:{provider:'broadnet'},family,skin:'全景',states:[]});assert.ok(flatten(tree).some(x=>x.type==='CarrierTitle'));
}
console.log('PASS '+count+' carrier/style/size render-tree cases plus empty states (not native screenshot QA).');
