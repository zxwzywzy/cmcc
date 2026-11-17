const assert=require('node:assert/strict'),vm=require('node:vm'),esbuild=require('esbuild');
const source=esbuild.buildSync({entryPoints:['scripting/carriers/carrier-overview.tsx'],bundle:true,format:'cjs',platform:'neutral',external:['scripting','./hub','./carrier-layout','./carrier-design','./app_intents','./mobile/kit'],jsxFactory:'h',write:false}).outputFiles[0].text;
const names={cmcc:'中国移动',unicom:'中国联通',telecom:'中国电信',broadnet:'中国广电'};
const scripting=new Proxy({useState:v=>[v,()=>{}],useEffect:()=>{},Navigation:{useDismiss:()=>()=>{}}},{get:(t,p)=>p in t?t[p]:String(p)});
const hub={providerIds:Object.keys(names),providerNames:names,preferences:()=>({host:'boxjs.com'}),accountTitle:s=>s.metrics?.phoneTail?'尾号 '+s.metrics.phoneTail:names[s.provider],telecomLoginInfo:()=>undefined,value:(n,u)=>n===undefined?'—':n+' '+u,flowValue:n=>n===undefined?'—':n+' MB'};
const m={exports:{}};vm.runInNewContext(source,{module:m,exports:m.exports,require:n=>n==='scripting'?scripting:n==='./hub'?hub:n==='./mobile/kit'?new Proxy({},{get:(_,p)=>String(p)}):{},h:(type,props,...children)=>({type:typeof type==='function'?type.name:type,props,children})});
function nodes(v){return v&&typeof v==='object'?[v,...(v.children||[]).flat(Infinity).flatMap(nodes)]:[]}
for(const p of ['unicom','telecom','broadnet']){
 const ns=nodes(m.exports.CarrierAccountCard({state:{provider:p,metrics:{balance:-5.52,flowMB:1024,voice:30,phoneTail:'1234'}}}));const txt=ns.filter(n=>n.type==='Text').flatMap(n=>n.children).join(' ');assert.ok(txt.includes('尾号 1234'));assert.ok(txt.includes('已欠费'));assert.ok(!/NaN|undefined/.test(txt));
}
let tree=nodes(m.exports.CarrierOverview({mobileAccounts:{type:'MobileAccounts',children:[]}}));assert.ok(tree.some(x=>x.type==='MobileAccounts'));assert.equal(tree.filter(x=>x.type==='TextField').length,1);assert.ok(!tree.some(x=>x.type==='Picker'));assert.ok(tree.some(x=>x.type==='NavigationLink'&&x.props.destination.type==='CarrierAccountDetail'));
tree=nodes(m.exports.TelecomLoginForm({saved:async()=>{}}));assert.equal(tree.filter(x=>x.type==='SecureField').length,1);assert.equal(tree.find(x=>x.type==='SecureField').props.value,'');assert.ok(!tree.some(x=>x.type==='TextField'&&x.props.title==='登录密码'));
console.log('PASS account page structure: retained Mobile rows, compact carrier cards, detail links, styles outside account summaries and masked empty password field (not native screenshots).');
