const assert=require('node:assert/strict'),vm=require('node:vm'),esbuild=require('esbuild');
// Make the simulated phone's local hours differ from UTC, on every test host.
process.env.TZ='Asia/Shanghai';
const NativeDate=Date,ROOT='scripting/wusheng-bus/',RUNTIME='wusheng.bus.widget.runtime.v3';
const bundles={};
for(const entry of ['runtime.ts','widget.tsx','app_intents.tsx','paging.ts'])bundles[entry]=esbuild.buildSync({entryPoints:[ROOT+entry],bundle:true,format:'cjs',platform:'neutral',external:['scripting','./view','./nearby-view'],jsxFactory:'h',write:false,logOverride:{'impossible-typeof':'silent'}}).outputFiles[0].text;
const route={lineId:'1135524964556869651',lineName:'101',upOrDown:1,stationsId:'s2',stationsNo:2,stationsList:[{stationId:'s1',stationName:'上一站',stationNo:1,distance:0},{stationId:'s2',stationName:'候车站',stationNo:2,distance:500}]};
const selected={line:{id:route.lineId,name:'101'},direction:1,station:{id:'s2',name:'候车站',no:2}};
const account=JSON.stringify({authorization:'Bearer SYNTHETIC_TEST_TOKEN_12345',userId:'1234567890'});
function harness({hour=12,minute=0,mode,enabled=true,nearby=true,signedIn=true}={}){
 let now=new NativeDate(2026,10,14,hour,minute).getTime(),lastLocationOptions;
 const store={'wusheng.bus.location.enabled':true,'wusheng.bus.choice':selected},calls={http:[],ws:0,location:0,authorization:0,keychain:0,reloads:0},presentations=[],registered={};
 if(!nearby)store['wusheng.bus.mode']='manual';
 if(mode!==undefined||!enabled)store[RUNTIME]={enabled,mode:mode||'manual'};
 class PhoneDate extends NativeDate{constructor(...args){super(...(args.length?args:[now]))}static now(){return now}}
 const Storage={get:k=>store[k],set:(k,v)=>{store[k]=v}};
 const Location={get isAuthorizedForWidgetUpdates(){calls.authorization++;return true},requestCurrent:async options=>{calls.location++;lastLocationOptions=options;return {latitude:30.3,longitude:106.3,timestamp:now}}};
 const Widget={family:'systemMedium',parameter:'叠放2',present:(node,policy)=>presentations.push({node,policy}),reloadAll:()=>calls.reloads++};
 const sdk=new Proxy({Widget,AppIntentProtocol:{AppIntent:0},AppIntentManager:{register:config=>{registered[config.name]=config.perform;return params=>({name:config.name,params})}},
  fetch:async url=>{calls.http.push(url);let body;
   if(url.endsWith('/api/AppBusiness/GetBusStations'))body={code:0,data:{data:[{stationId:'stop-A',stationName:'候车站',len:100,latitude:30.301,longitude:106.3,lineDatas:[route]}]}};
   else if(url.endsWith('/api/AppBusiness/GetBusLineStationsByLId'))body={code:0,data:{data:route.stationsList}};
   else if(url.endsWith('/api/WechatInfo/GetUserInfo'))body={code:0,data:{cardCashfee:235,cardNo:'TEST1234'}};
   else throw Error('Unexpected endpoint: '+url);
   return {ok:true,text:async()=>JSON.stringify(body)};
  },
  WebSocket:class{constructor(){calls.ws++;queueMicrotask(()=>this.onopen?.())}send(){queueMicrotask(()=>this.onmessage?.(JSON.stringify([{lineId:route.lineId,bizType:1,stationNo:1,speed:30}])))}close(){}},
 },{get:(o,k)=>k in o?o[k]:String(k)});
 const views={BusView:props=>({type:'BusView',props}),NearbyView:props=>({type:'NearbyView',props})};
 const h=(type,props,...children)=>typeof type==='function'?type({...props,children}):({type,props:props||{},children});
 function load(entry){const m={exports:{}};vm.runInNewContext(bundles[entry],{module:m,exports:m.exports,require:n=>n==='scripting'?sdk:n==='./view'||n==='./nearby-view'?views:require(n),Storage,Location,Keychain:{get:()=>{calls.keychain++;return signedIn?account:undefined}},Date:PhoneDate,h,setTimeout,clearTimeout});return m.exports}
 const runtime=load('runtime.ts'),paging=load('paging.ts');load('app_intents.tsx');
 return {store,calls,runtime,paging,registered,presentations,get now(){return now},get locationOptions(){return lastLocationOptions},advance:ms=>{now+=ms},setTime:(h,m=0)=>{now=new NativeDate(2026,10,14,h,m).getTime()},
  async widget(){const count=presentations.length;load('widget.tsx');await new Promise(resolve=>setImmediate(resolve));assert.equal(presentations.length,count+1,'actual widget main must present exactly once');return presentations.at(-1)},
  async intent(name,params){await registered['WushengBus'+name](params)},
 };
}
function noIO(h){assert.equal(h.calls.http.length,0,'no HTTP including balance/QR');assert.equal(h.calls.ws,0,'no WebSocket');assert.equal(h.calls.location,0,'no location request');assert.equal(h.calls.authorization,0,'do not even query widget location authorization')}
function counts(h){return {http:h.calls.http.length,ws:h.calls.ws,location:h.calls.location}}
function cached(h){const time=h.now-20*60000;h.store['wusheng.bus.arrival']={choice:selected,items:[{stops:1,minutes:1}],time};h.store['wusheng.bus.balance']={balance:2.35,fetchedAt:time};h.store['wusheng.bus.nearby.v2']={stop:{id:'stop-A',name:'候车站',meters:100},otherStops:[],services:Array.from({length:6},(_,i)=>({choice:{...selected,line:{id:String(i),name:String(i)},direction:i<4?1:2},items:[],positions:[]})),position:{latitude:30.3,longitude:106.3,timestamp:time},time};return time}
function find(node,predicate){if(!node||typeof node!=='object')return;if(Array.isArray(node)){for(const child of node){const found=find(child,predicate);if(found)return found}return}return predicate(node)?node:find(node.children,predicate)}

(async()=>{
 const settings=harness();assert.equal(JSON.stringify(settings.runtime.widgetRuntime()),JSON.stringify({enabled:true,mode:'always'}));assert.equal(settings.store[RUNTIME],undefined,'reading defaults has no writes');
 assert.equal(settings.runtime.saveWidgetRuntime({mode:'commute'}).enabled,true);assert.equal(settings.runtime.saveWidgetRuntime({enabled:false}).mode,'commute');assert.equal(settings.runtime.saveWidgetRuntime({enabled:true}).mode,'commute');
 assert.equal(settings.runtime.saveWidgetRuntime({mode:'invalid',enabled:'no'}).mode,'commute');settings.store[RUNTIME]={mode:'invalid',enabled:false};assert.equal(settings.runtime.widgetRuntime().mode,'always');assert.equal(settings.runtime.widgetRuntime().enabled,false);

 for(const nearby of [true,false])for(const signedIn of [true,false]){
  const h=harness({nearby,signedIn,mode:'manual'}),time=cached(h),original=JSON.stringify(h.store['wusheng.bus.nearby.v2']);
  const {node,policy}=await h.widget();noIO(h);assert.equal(node.type,nearby?'NearbyView':'BusView');assert.equal(node.props.resting,true);assert.equal(node.props.snapshot.time,time);assert.equal(node.props.snapshot.stale,true);
  assert.equal(node.props.cardStale,signedIn);assert.equal(node.props.card?.fetchedAt,signedIn?time:undefined);assert.equal(JSON.stringify(h.store['wusheng.bus.nearby.v2']),original,'aging a display must not rewrite snapshots');assert.equal(policy.policy,'after');assert.equal(policy.date.getTime()-h.now,6*60*60000);if(nearby){assert.equal(node.props.slot,'2');assert.equal(node.props.snapshot.locationStale,true)}
 }
 const empty=harness({mode:'manual'});assert.equal((await empty.widget()).node.props.snapshot,undefined);noIO(empty);
 const different=harness({nearby:false,mode:'manual'});cached(different);different.store['wusheng.bus.choice']={...selected,direction:2};assert.equal((await different.widget()).node.props.snapshot,undefined);noIO(different);
 const legacy=harness();legacy.store['wusheng.bus.widget.runtime.v1']={enabled:true,mode:'manual'};assert.equal(legacy.runtime.widgetRuntime().mode,'always');legacy.store['wusheng.bus.widget.runtime.v1']={enabled:false,mode:'manual'};assert.equal(legacy.runtime.widgetRuntime().enabled,false);legacy.store['wusheng.bus.widget.runtime.v1']={enabled:true,mode:'commute'};assert.equal(legacy.runtime.widgetRuntime().mode,'commute');legacy.runtime.saveWidgetRuntime({mode:'manual'});assert.equal(legacy.runtime.widgetRuntime().mode,'manual');

 for(const [hour,minute,active] of [[6,59,false],[7,0,true],[8,59,true],[9,0,false],[16,59,false],[17,0,true],[19,29,true],[19,30,false],[23,59,false]]){
  const h=harness({hour,minute,mode:'commute'});const p=await h.widget();assert.equal(p.node.props.resting,!active,`${hour}:${minute} uses phone local hours`);if(active){assert.equal(h.calls.location,1);assert.equal(h.calls.ws,1);assert.equal(h.calls.http.length,2)}else noIO(h);
 }
 const beforeWindow=harness({hour:6,minute:59,mode:'commute'});let p=await beforeWindow.widget();assert.equal(p.policy.date.getHours(),7);assert.equal(p.policy.date.getMinutes(),0);beforeWindow.advance(60000);await beforeWindow.widget();assert.equal(beforeWindow.calls.location,1);
 const beforeEnd=harness({hour:19,minute:29,mode:'commute',nearby:false});beforeEnd.advance(59000);p=await beforeEnd.widget();assert.equal(p.policy.date.getHours(),19);assert.equal(p.policy.date.getMinutes(),30);
 const fixedActive=harness({mode:'always',nearby:false});p=await fixedActive.widget();assert.equal(p.policy.date.getTime()-fixedActive.now,15000,'fixed-route requests a 15-second update');

 for(const mode of ['manual','commute','always'])for(const nearby of [true,false]){
  const h=harness({mode,enabled:false,nearby});cached(h);p=await h.widget();noIO(h);assert.equal(h.calls.keychain,0);const button=find(p.node,n=>n.type==='Button'&&n.props.title==='唤醒');assert.ok(button,'off view exposes a wake button');assert.equal(button.props.intent.name,'WushengBusWake');
  await h.intent('Refresh');await h.intent('Locate');await h.widget();noIO(h);assert.equal(h.runtime.widgetRuntime().enabled,false);
  await h.intent('Wake');assert.equal(h.runtime.widgetRuntime().enabled,true);assert.equal(h.runtime.widgetRuntime().mode,mode);assert.equal(h.calls.ws,1);assert.equal(h.calls.http.length,2);assert.equal(h.calls.location,nearby?1:0);const fetched=counts(h);await h.widget();await h.widget();assert.deepEqual(counts(h),fetched,'wake reloads do not perform the same update again');
 }
 for(const nearby of [true,false]){
  const h=harness({nearby,mode:'manual'});cached(h);await h.intent('Refresh');assert.equal(h.calls.ws,1);assert.equal(h.calls.http.length,2);assert.equal(h.calls.location,nearby?1:0);assert.equal(h.runtime.widgetRuntime().mode,'manual');const fresh=h.now;h.advance(1000);p=await h.widget();assert.equal(p.node.props.resting,true);assert.equal(p.node.props.snapshot.time,fresh);assert.equal(p.node.props.snapshot.stale,false);assert.equal(p.node.props.cardStale,false);h.advance(60000);await h.widget();assert.equal(h.calls.ws,1,'manual stays asleep after explicit refresh');
 }
 const locate=harness({hour:12,mode:'commute'});await locate.intent('Locate');assert.equal(locate.locationOptions.forceRequest,true);assert.equal(locate.calls.location,1);assert.equal(locate.calls.ws,1);await locate.widget();assert.equal(locate.calls.ws,1);assert.equal(locate.runtime.widgetRuntime().mode,'commute');
 const localExpiry=harness({mode:'manual'});await localExpiry.intent('Refresh');const beforeExpiry=counts(localExpiry);p=await localExpiry.widget();assert.equal(p.policy.date.getTime()-localExpiry.now,61000);localExpiry.advance(61001);p=await localExpiry.widget();assert.deepEqual(counts(localExpiry),beforeExpiry);assert.equal(p.node.props.snapshot.stale,true);assert.equal(p.policy.date.getTime()-localExpiry.now,6*60*60000);
 const always=harness({mode:'always'});p=await always.widget();assert.equal(p.node.props.resting,false);assert.equal(always.calls.ws,1);assert.equal(always.calls.http.length,2);assert.equal(p.policy.date.getTime()-always.now,15000);always.advance(60000);await always.widget();assert.equal(always.calls.ws,2);await always.intent('Pause');assert.equal(always.runtime.widgetRuntime().enabled,false);const paused=counts(always);await always.widget();assert.deepEqual(counts(always),paused);
 const anonymous=harness({mode:'always',signedIn:false,nearby:false});await anonymous.widget();assert.equal(anonymous.calls.http.length,1);assert.equal(anonymous.calls.ws,1);
 const balanceRate=harness();await balanceRate.widget();balanceRate.advance(15000);await balanceRate.widget();assert.equal(balanceRate.calls.ws,2);assert.equal(balanceRate.calls.http.filter(u=>u.endsWith('/GetUserInfo')).length,1);balanceRate.advance(5*60000);await balanceRate.widget();assert.equal(balanceRate.calls.http.filter(u=>u.endsWith('/GetUserInfo')).length,2);
 const fixedSwitch=harness({nearby:false,mode:'always'});await fixedSwitch.intent('FixedDirection');assert.equal(fixedSwitch.store['wusheng.bus.choice'].direction,2);assert.equal(fixedSwitch.store['wusheng.bus.arrival'].choice.station.id,'s2');assert.equal(fixedSwitch.calls.ws,1);assert.equal(fixedSwitch.calls.location,0);const fixedOff=harness({nearby:false,enabled:false});await fixedOff.intent('FixedDirection');noIO(fixedOff);

 for(const mode of ['manual','commute','always'])for(const enabled of [true,false]){
  const h=harness({mode,enabled});cached(h);h.store['wusheng.bus.nearby.v2'].time=h.now;const before=JSON.stringify(h.runtime.widgetRuntime()),params={stopId:'stop-A',family:'systemMedium',slot:'2'};
  await h.intent('Page',{...params,step:1});assert.equal(h.paging.servicePage(h.store['wusheng.bus.nearby.v2'],'systemMedium','2').index,0);await h.widget();noIO(h);
  await h.intent('Direction',params);assert.equal(h.paging.selectedDirection('systemMedium','2'),2);assert.equal(h.paging.selectedDirection('systemMedium','1'),1);await h.widget();noIO(h);assert.equal(JSON.stringify(h.runtime.widgetRuntime()),before,'paging/direction preserve enabled and mode');
  if(!enabled){await h.intent('Wake');assert.equal(h.paging.selectedDirection('systemMedium','2'),2)}
 }
 const expiry=harness({mode:'always'});cached(expiry);expiry.store['wusheng.bus.nearby.v2'].time=expiry.now;await expiry.intent('Page',{stopId:'stop-A',family:'systemMedium',slot:'2',step:1});await expiry.widget();noIO(expiry);expiry.advance(30001);await expiry.widget();assert.equal(expiry.calls.ws,1,'automatic updates resume after local redraw guard');
 const staleAuto=harness({mode:'always'});cached(staleAuto);staleAuto.runtime.noteWidgetInteraction();await staleAuto.widget();assert.equal(staleAuto.calls.ws,1,'a local redraw guard cannot suppress a stale automatic snapshot');
 const migrated=harness();migrated.store['wusheng.bus.widget.runtime.v2']={enabled:true,mode:'manual'};assert.equal(migrated.runtime.widgetRuntime().mode,'always');migrated.store['wusheng.bus.widget.runtime.v2']={enabled:false,mode:'commute'};assert.equal(migrated.runtime.widgetRuntime().enabled,false);assert.equal(migrated.runtime.widgetRuntime().mode,'commute');
 const stale=harness({mode:'manual'});cached(stale);stale.store['wusheng.bus.nearby.v2'].time=stale.now;stale.store['wusheng.bus.nearby.v2'].stale=true;assert.equal((await stale.widget()).node.props.snapshot.stale,true,'a previous failure stays stale');
 for(const code of [bundles['widget.tsx'],bundles['app_intents.tsx']])assert.doesNotMatch(code,/function requestRide|function rideImage|ride-page|fromTap/,'widget and intent dependency graphs never import ride code');
 console.log('PASS runtime defaults/patching; actual widget + intents with real API/nearby modules: zero sleep/off IO, local commute boundaries, timestamps/staleness, explicit refresh/locate/wake, automatic updates, pause, per-stack page/direction, and tap-only QR isolation.');
})().catch(error=>{console.error(error);process.exitCode=1});
