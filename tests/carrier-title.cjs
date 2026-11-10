const vm=require('node:vm'),assert=require('node:assert/strict'),esbuild=require('esbuild');
const code=esbuild.buildSync({entryPoints:['scripting/carriers/carrier-title.tsx'],bundle:true,format:'cjs',platform:'neutral',jsxFactory:'h',external:['scripting','./hub','./app_intents'],write:false}).outputFiles[0].text;
const m={exports:{}};let clicks=0;
vm.runInNewContext(code,{module:m,exports:m.exports,Storage:{get:()=>null,set:()=>{}},h:(type,props,...children)=>({type,props,children}),require:name=>name==='scripting'?{Button:'Button',HStack:'HStack',Image:'Image',Text:'Text'}:name==='./hub'?{providerNames:{cmcc:'中国移动',telecom:'中国电信'},importedProviders:()=>['cmcc','telecom'],providerIds:['cmcc','unicom','telecom','broadnet']}:{CarrierNextIntent:params=>({name:'CarrierHubNextProvider',params})}});
const base={th:{t1:'label',t3:'secondaryLabel'},carrier:{provider:'telecom'}};
let node=m.exports.CarrierTitle({ctx:{...base,inApp:true,onCarrierChange:()=>clicks++}});assert.equal(node.type,'Button');node.props.action();assert.equal(clicks,1);
node=m.exports.CarrierTitle({ctx:{...base,inApp:false}});assert.equal(node.props.intent.name,'CarrierHubNextProvider');assert.equal(node.props.intent.params.current,'telecom');assert.deepEqual([...node.props.intent.params.available],['cmcc','unicom','telecom','broadnet']);
console.log('PASS original carrier-title button: preview action and widget next-provider intent.');
