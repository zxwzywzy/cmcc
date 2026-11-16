import * as Scripting from 'scripting'
import { fetch } from 'scripting'
import { post } from './api'
import { coordinate,distance,normalizeNearby,type Coordinate,type NearbyStop,type Service } from './nearby'
import { finite,text } from './model'
export type JourneyPlace={name:string;coordinate:Coordinate;city?:string}
export type JourneyLeg={kind:'walk'|'bus';name:string;from:string;to:string;coordinates:Coordinate[];meters?:number;stops?:number;lineId?:string;direction?:number}
export type JourneyPlan={id:string;source:'operator'|'amap';changes:number;walkingMeters:number;durationSeconds?:number;legs:JourneyLeg[]}
export type JourneyResult={plans:JourneyPlan[];note:string}
const MAP_KEY='wusheng.bus.journey.amap.key.v1',CITY_KEY='wusheng.bus.journey.city.v1'
const PUBLIC_CENTER={latitude:30.351705,longitude:106.303647}
async function quickPlaces(work:Promise<JourneyPlace[]>){let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<JourneyPlace[]>(resolve=>{timer=setTimeout(()=>resolve([]),2500)})])}finally{clearTimeout(timer)}}
export function onlineJourneyConfigured(){return !!Keychain.get(MAP_KEY)}
export function journeyCity(){return Storage.get<string>(CITY_KEY)||'广安市'}
export function saveJourneyKey(value:string,city:string){const key=value.trim();if(!/^[a-f0-9]{32}$/i.test(key))throw Error('请输入自己的高德 Web服务 Key');Keychain.set(MAP_KEY,key);Storage.set(CITY_KEY,city.trim().slice(0,40)||'广安市')}
export function removeJourneyKey(){Keychain.remove(MAP_KEY)}
export async function searchJourneyPlaces(query:string,bias=PUBLIC_CENTER):Promise<JourneyPlace[]>{
 const input=query.trim();if(!input||input.length>80)throw Error('请输入80字以内的站台或地点名称')
 const Search=(globalThis as any).MapSearch||(Scripting as any).MapSearch
 const requests=[post('/api/AppBusiness/GetStationsByName',{stationName:input,latitude:bias.latitude,longitude:bias.longitude}).then(body=>{
  if(body?.code!==0||!Array.isArray(body.data))return []
  return body.data.flatMap((s:any)=>{const c=coordinate(s);return c?[{name:text(s.stationName)||input,coordinate:c}]:[]})
 })]
 if(typeof Search?.locate==='function')requests.push(quickPlaces(Search.locate({query:input,region:{center:bias,span:{latitudeDelta:0.5,longitudeDelta:0.5}}}).then((items:any[])=>items.flatMap(item=>{const c=coordinate(item.coordinate);return c?[{name:text(item.name)||input,coordinate:c,city:text(item.placemark?.locality)||undefined}]:[]}))))
 const found=await Promise.allSettled(requests),all:JourneyPlace[]=[]
 for(const result of found)if(result.status==='fulfilled')for(const item of result.value){if(!all.some(p=>p.name===item.name&&distance(p.coordinate,item.coordinate)<30))all.push(item)}
 return all.slice(0,12)
}
export async function currentJourneyPlace():Promise<JourneyPlace>{
 let timer:ReturnType<typeof setTimeout>|undefined
 try{
  const work=(async()=>{let p=await Location.requestCurrent({forceRequest:false});if(!p||Date.now()-p.timestamp>120000)p=await Location.requestCurrent({forceRequest:true});const c=coordinate(p);if(!c||!p?.timestamp||Date.now()<p.timestamp||Date.now()-p.timestamp>120000)throw Error();return {name:'当前位置',coordinate:c}})()
  return await Promise.race([work,new Promise<JourneyPlace>((_,reject)=>{timer=setTimeout(()=>reject(Error()),4000)})])
 }catch{throw Error('暂时无法取得当前位置，可搜索站台作为起点')}
 finally{clearTimeout(timer)}
}
function walk(from:string,to:string,a:Coordinate,b:Coordinate,meters=distance(a,b)):JourneyLeg{return {kind:'walk',name:'步行接驳',from,to,coordinates:[a,b],meters}}
function stopIndex(service:Service){return service.stations.findIndex(s=>s.id===service.choice.station.id&&s.no===service.choice.station.no)}
function ride(service:Service,from:number,to:number):JourneyLeg{return {kind:'bus',name:service.choice.line.name,from:service.stations[from].name,to:service.stations[to].name,coordinates:service.stations.slice(from,to+1).flatMap(s=>{const c=coordinate(s);return c?[c]:[]}),stops:to-from,lineId:service.choice.line.id,direction:service.choice.direction}}
function sameService(a:Service,b:Service){return a.choice.line.id===b.choice.line.id&&a.choice.direction===b.choice.direction}
export function localJourneyPlans(origin:JourneyPlace,destination:JourneyPlace,originStops:NearbyStop[],destinationStops:NearbyStop[]):JourneyPlan[]{
 const starts=originStops.filter(s=>s.meters>=0&&s.meters<=1000),ends=destinationStops.filter(s=>s.meters>=0&&s.meters<=1000),candidates=new Map<string,JourneyPlan>()
 const add=(legs:JourneyLeg[],id:string)=>{const walkingMeters=legs.filter(l=>l.kind==='walk').reduce((n,l)=>n+(l.meters||0),0);const plan:JourneyPlan={id,source:'operator',changes:legs.filter(l=>l.kind==='bus').length-1,walkingMeters,legs};const previous=candidates.get(id);if(!previous||walkingMeters<previous.walkingMeters)candidates.set(id,plan)}
 for(const start of starts)for(const end of ends)for(const a of start.services)for(const b of end.services){
  const ai=stopIndex(a),bi=stopIndex(b);if(ai<0||bi<0)continue
  const first=walk(origin.name,a.stations[ai].name,origin.coordinate,start.coordinate,start.meters),last=walk(b.stations[bi].name,destination.name,end.coordinate,destination.coordinate,end.meters)
  const key=a.choice.line.id+':'+a.choice.direction+':'+a.choice.station.no+'>'+b.choice.line.id+':'+b.choice.direction+':'+b.choice.station.no
  if(sameService(a,b)){
   const endIndex=a.stations.findIndex(s=>s.id===b.choice.station.id&&s.no===b.choice.station.no)
   if(endIndex>ai)add([first,ride(a,ai,endIndex),last],key)
   continue
  }
  let best:{i:number;j:number;meters:number;score:number}|undefined
  for(let i=ai+1;i<a.stations.length;i++)for(let j=0;j<bi;j++){
   const ca=coordinate(a.stations[i]),cb=coordinate(b.stations[j]);if(!ca||!cb)continue
   const meters=distance(ca,cb),same=a.stations[i].id===b.stations[j].id
   if(meters>(same?150:80))continue
   const score=meters+(i-ai+bi-j)*10
   if(!best||score<best.score)best={i,j,meters,score}
  }
  if(best){const ta=a.stations[best.i],tb=b.stations[best.j];add([first,ride(a,ai,best.i),walk(ta.name,tb.name,coordinate(ta)!,coordinate(tb)!,best.meters),ride(b,best.j,bi),last],key+':'+ta.no+':'+tb.no)}
 }
 const ordered=[...candidates.values()].sort((a,b)=>a.changes-b.changes||a.walkingMeters-b.walkingMeters||a.legs.reduce((n,l)=>n+(l.stops||0),0)-b.legs.reduce((n,l)=>n+(l.stops||0),0)),seen=new Set<string>()
 return ordered.filter(plan=>{const signature=plan.legs.filter(l=>l.kind==='bus').map(l=>l.lineId+':'+l.direction).join('>');if(seen.has(signature))return false;seen.add(signature);return true}).slice(0,5)
}
function polyline(value:any):Coordinate[]{if(typeof value!=='string')return [];return value.split(';').slice(0,8000).flatMap(pair=>{const [lng,lat]=pair.split(',');const c=coordinate({latitude:lat,longitude:lng});return c?[c]:[]})}
export function normalizeOnlineJourney(body:any):JourneyPlan[]{
 if(String(body?.status)!=='1'||!Array.isArray(body?.route?.transits))throw Error('在线换乘未返回可用方案')
 return body.route.transits.slice(0,5).flatMap((plan:any,index:number)=>{
  if(!Array.isArray(plan.segments)||plan.segments.some((s:any)=>s?.railway&&Object.keys(s.railway).length||s?.taxi&&Object.keys(s.taxi).length))return []
  const legs:JourneyLeg[]=[]
  for(const segment of plan.segments.slice(0,40)){
   const walking=segment.walking,walkCoordinates=(Array.isArray(walking?.steps)?walking.steps:[]).flatMap((s:any)=>polyline(s.polyline))
   if(walkCoordinates.length>=2)legs.push({kind:'walk',name:'步行',from:text(walking.origin)||'步行起点',to:text(walking.destination)||'步行终点',coordinates:walkCoordinates,meters:finite(walking.distance)})
   const bus=segment.bus?.buslines?.[0];if(bus){const coordinates=polyline(bus.polyline),from=text(bus.departure_stop?.name),to=text(bus.arrival_stop?.name);if(from&&to)legs.push({kind:'bus',name:text(bus.name)||'公交',from,to,coordinates,stops:finite(bus.via_num)!==undefined?Number(bus.via_num)+1:undefined})}
  }
  const buses=legs.filter(l=>l.kind==='bus');if(!buses.length)return []
  const duration=finite(plan.cost?.duration),walkingMeters=finite(plan.walking_distance)??legs.reduce((n,l)=>n+(l.kind==='walk'?l.meters||0:0),0)
  return [{id:'online:'+index,source:'amap' as const,changes:buses.length-1,walkingMeters,durationSeconds:duration!==undefined&&duration>0?duration:undefined,legs}]
 })
}
async function onlinePlans(origin:JourneyPlace,destination:JourneyPlace,key:string){
 const params={key,origin:origin.coordinate.longitude+','+origin.coordinate.latitude,destination:destination.coordinate.longitude+','+destination.coordinate.latitude,city1:origin.city||journeyCity(),city2:destination.city||journeyCity(),strategy:'8',show_fields:'cost,polyline',output:'json'}
 const query=Object.entries(params).map(([k,v])=>encodeURIComponent(k)+'='+encodeURIComponent(v)).join('&')
 try{const response=await fetch('https://restapi.amap.com/v5/direction/transit/integrated?'+query,{method:'GET',redirect:'error',handleRedirect:async()=>null,timeout:10});if(!response.ok)throw Error();return normalizeOnlineJourney(await response.json())}catch{throw Error('在线换乘暂不可用，已改用公交线路规划')}
}
export async function planJourney(origin:JourneyPlace,destination:JourneyPlace):Promise<JourneyResult>{
 if(!coordinate(origin.coordinate)||!coordinate(destination.coordinate))throw Error('请先选择有效的起点和终点')
 if(distance(origin.coordinate,destination.coordinate)<30)throw Error('起点和终点距离很近，可直接步行')
 const key=Keychain.get(MAP_KEY);let note=''
 if(key){try{const plans=await onlinePlans(origin,destination,key);if(plans.length)return {plans,note:'在线公交换乘方案，预计耗时不代表实时车辆到站'};note='在线服务未返回方案，已改用公交线路规划'}catch{note='在线换乘暂不可用，已改用公交线路规划'}}
 const [a,b]=await Promise.all([post('/api/AppBusiness/GetBusStations',{pageIndex:1,pageSize:5,...origin.coordinate}),post('/api/AppBusiness/GetBusStations',{pageIndex:1,pageSize:5,...destination.coordinate})])
 const starts=normalizeNearby(a),ends=normalizeNearby(b),plans=localJourneyPlans(origin,destination,starts,ends)
 if(!plans.length)return {plans:[],note:note||'附近站点中未找到直达或一次换乘方案；可改选站台，或配置自己的在线地图 Key 查询更多方案'}
 return {plans,note:(note?note+'；':'')+'基于运营线路规划直达或一次换乘；步行距离按接驳直线估算，未推测总耗时'}
}
