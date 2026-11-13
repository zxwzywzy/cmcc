import { post,vehicleBatch } from './api'
import { arrivals,finite,normalizeStations,text,vehiclePlate,type Arrival,type Choice,type Station } from './model'
export type Coordinate={latitude:number;longitude:number}
export type Position=Coordinate&{timestamp:number}
export type Service={choice:Choice;stations:Station[]}
export type NearbyStop={id:string;name:string;coordinate:Coordinate;meters:number;services:Service[]}
export type VehiclePosition={label:string;vehicleId?:string;plate?:string;stationNo?:number;stationName?:string;coordinate?:Coordinate;gps:boolean;distanceMeters?:number;distanceKind?:'gps'|'stations';passed?:boolean}
export type NearbySnapshot={stop?:NearbyStop;otherStops:NearbyStop[];services:{choice:Choice;items:ReturnType<typeof arrivals>;positions:VehiclePosition[]}[];position?:Position;time:number;stale?:boolean;locationStale?:boolean;message?:string}
const CACHE='wusheng.bus.nearby.v2'
const POSITION='wusheng.bus.position.v1'
const LOCATION_REVISION='wusheng.bus.location.revision.v1'
const locationRevision=()=>Storage.get<number>(LOCATION_REVISION)||0
let positionFlight:Promise<Position>|undefined
export function cachedNearby(){return Storage.get<NearbySnapshot>(CACHE)||undefined}
export const isNearby=()=>Storage.get('wusheng.bus.mode')!=='manual'
export function setMode(mode:'nearby'|'manual'){Storage.set('wusheng.bus.mode',mode)}
export function coordinate(v:any):Coordinate|undefined{
 for(const pair of [[v?.latitude,v?.longitude],[v?.lat,v?.lng]]){
  const latitude=finite(pair[0]),longitude=finite(pair[1])
  if(latitude!==undefined&&longitude!==undefined&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180&&!(latitude===0&&longitude===0))return {latitude,longitude}
 }
 return undefined
}
export function normalizeNearby(body:any):NearbyStop[]{
 if(body?.code!==0||!Array.isArray(body?.data?.data))throw Error('附近站台查询失败')
 return body.data.data.flatMap((s:any)=>{
  const c=coordinate(s),meters=finite(s.len);if(!c||meters===undefined||meters<0||!text(s.stationId)||!text(s.stationName))return []
  const services:Service[]=(Array.isArray(s.lineDatas)?s.lineDatas:[]).flatMap((l:any)=>{
   const id=text(l.lineId),direction=Number(l.upOrDown),no=finite(l.stationsNo);if(!/^\d+$/.test(id)||![1,2].includes(direction)||no===undefined)return []
   const stations=normalizeStations({code:0,data:{data:Array.isArray(l.stationsList)?l.stationsList:[]}})
   const station=stations.find(v=>v.no===no&&(!l.stationsId||v.id===text(l.stationsId)))||{id:text(l.stationsId)||text(s.stationId),name:text(s.stationName),no}
   return [{choice:{line:{id,name:text(l.lineName),start:text(l.startStations),end:text(l.endStations)},direction,station,destination:stations[stations.length-1]?.name},stations}]
  })
  return [{id:text(s.stationId),name:text(s.stationName),coordinate:c,meters,services}]
 }).sort((a:NearbyStop,b:NearbyStop)=>a.meters-b.meters)
}
export function positions(rows:any[],service:Service,target?:Coordinate):VehiclePosition[]{
 return rows.filter(v=>text(v.lineId)===service.choice.line.id&&Number(v.bizType??v.upOrDown)===service.choice.direction).sort((a,b)=>{const x=finite(a.stationNo)??Infinity,y=finite(b.stationNo)??Infinity,t=service.choice.station.no;return Number(x>t)-Number(y>t)||Math.abs(x-t)-Math.abs(y-t)}).slice(0,8).map(v=>{
  const station=service.stations.find(s=>s.no===finite(v.stationNo));const c=coordinate(v)
  // A reported station is not the vehicle's precise GPS location.
  const source=station as Station&Partial<Coordinate>|undefined
  const no=finite(v.stationNo),targetNo=service.choice.station.no,segments=no===undefined?[]:service.stations.filter(s=>s.no>Math.min(no,targetNo)&&s.no<=Math.max(no,targetNo))
  const estimate=no!==undefined&&segments.length===Math.abs(no-targetNo)&&segments.every(s=>s.distance!==undefined&&s.distance>=0)?segments.reduce((sum,s)=>sum+s.distance!,0):undefined
  return {label:service.choice.line.name,vehicleId:text(v.vehicleId)||undefined,plate:vehiclePlate(v),stationNo:no,stationName:station?.name||text(v.stationName)||(finite(v.stationNo)!==undefined?'第'+v.stationNo+'站（站名未返回）':undefined),coordinate:c||coordinate(source),gps:!!c,distanceMeters:c&&target?distance(c,target):estimate,distanceKind:c&&target?'gps':estimate!==undefined?'stations':undefined,passed:finite(v.stationNo)!==undefined?Number(v.stationNo)>service.choice.station.no:undefined}
 })
}
export async function freshPosition(force=true):Promise<Position>{
 const p=await Location.requestCurrent({forceRequest:force});const c=coordinate(p)
 if(!c||!p?.timestamp||Date.now()-p.timestamp>120000)throw Error('未取得近期定位，请允许精确位置后重试')
 return {...c,timestamp:p.timestamp}
}
async function timelyPosition(force=false):Promise<Position>{
 const generation=locationRevision()
 const valid=(p:any)=>coordinate(p)&&Number.isFinite(p?.timestamp)&&Date.now()>=p.timestamp&&Date.now()-p.timestamp<=600000
 const remember=(p:any)=>{if(!valid(p))throw Error('定位已超过十分钟，请打开脚本重新定位');if(generation!==locationRevision())throw Error('定位请求已取消');const result={...coordinate(p)!,timestamp:p.timestamp};Storage.set(POSITION,result);return result}
 if(!positionFlight){
  const work=(async()=>{
   const first=await Location.requestCurrent({forceRequest:force})
   if(generation!==locationRevision())throw Error('定位请求已取消')
   if(!force&&(!valid(first)||Date.now()-first!.timestamp>60000)){if(valid(first))remember(first);return remember(await Location.requestCurrent({forceRequest:true}))}
   return remember(first)
  })()
  positionFlight=work
  work.then(()=>{if(positionFlight===work)positionFlight=undefined},()=>{if(positionFlight===work)positionFlight=undefined})
 }
 let timer:ReturnType<typeof setTimeout>|undefined
 try{return await Promise.race([positionFlight,new Promise<Position>((_,reject)=>{timer=setTimeout(()=>reject(Error('定位暂未完成')),1500)})])}
 catch(e){
  if(generation!==locationRevision())throw e
  const candidates=[Storage.get<Position>(POSITION),cachedNearby()?.position].filter(valid).sort((a,b)=>b!.timestamp-a!.timestamp)
  if(candidates[0])return candidates[0]!
  throw e
 }finally{if(timer!==undefined)clearTimeout(timer)}
}
export function clearNearby(){Storage.set(LOCATION_REVISION,locationRevision()+1);positionFlight=undefined;Storage.set(POSITION,null);Storage.set(CACHE,null);Storage.set('wusheng.bus.nearby.v1',null);Storage.set('wusheng.bus.location.enabled',false)}
export async function nearbyCurrent(options:{widget?:boolean;enable?:boolean;force?:boolean}={}):Promise<NearbySnapshot|undefined>{
 if(!options.enable&&!Storage.get('wusheng.bus.location.enabled'))return undefined
 const generation=locationRevision()
 let position:Position|undefined,stop:NearbyStop|undefined,otherStops:NearbyStop[]=[]
 try{
  if(options.widget&&!Location.isAuthorizedForWidgetUpdates)throw Error('桌面定位未授权，请打开脚本刷新')
  const p=await timelyPosition(options.force===true),c=coordinate(p)
  if(generation!==locationRevision())return undefined
  if(!c||!p?.timestamp)throw Error('定位未获授权，请打开脚本允许定位')
  position={...c,timestamp:p.timestamp};if(Date.now()-p.timestamp>10*60000)throw Error('定位已超过十分钟，请打开脚本重新定位')
  Storage.set('wusheng.bus.location.enabled',true)
  const list=normalizeNearby(await post('/api/AppBusiness/GetBusStations',{pageIndex:1,pageSize:5,latitude:c.latitude,longitude:c.longitude}))
  if(generation!==locationRevision())return undefined
  stop=list[0];otherStops=list.slice(1,3)
  if(!stop){const result:NearbySnapshot={otherStops:[],services:[],position,time:Date.now(),message:'该位置附近没有公交站台'};Storage.set(CACHE,result);return result}
  const selected=stop.services.filter((s,i,all)=>all.findIndex(v=>v.choice.line.id===s.choice.line.id&&v.choice.direction===s.choice.direction)===i)
  const rows=selected.length?await vehicleBatch(selected.map(s=>({lineId:s.choice.line.id,upOrDown:s.choice.direction}))):[]
  if(generation!==locationRevision())return undefined
  const result:NearbySnapshot={stop,otherStops,services:selected.map(s=>({choice:s.choice,items:arrivals(rows,s.choice,s.stations),positions:positions(rows,s,stop!.coordinate)})),position,time:Date.now(),locationStale:Date.now()-p.timestamp>120000,...(Date.now()-p.timestamp>120000?{message:'定位待更新，当前显示已知站台车辆'}:{})}
  Storage.set(CACHE,result);return result
 }catch(e){
  if(generation!==locationRevision())return undefined
  const previous=Storage.get<NearbySnapshot>(CACHE),message=(e as Error).message
  // Never reuse a vehicle snapshot from another station after a successful new location/stop lookup.
  if(previous&&(!position||previous.position&&distance(position,previous.position)<100)&&(!stop||stop.id===previous.stop?.id)){const fallback={...previous,stale:true,message};Storage.set(CACHE,fallback);return fallback}
  const fallback:NearbySnapshot={stop,otherStops,services:stop?.services.map(s=>({choice:s.choice,items:[],positions:[]}))||[],position,time:Date.now(),stale:true,message};Storage.set(CACHE,fallback);return fallback
 }
}
export function distance(a:Coordinate,b:Coordinate){const r=Math.PI/180,dlat=(b.latitude-a.latitude)*r,dlon=(b.longitude-a.longitude)*r;const x=Math.sin(dlat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dlon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)))}
export function meters(n:number){return n<1000?Math.round(n)+' 米':(n/1000).toFixed(1)+' 公里'}

export function destination(choice:Choice){const end=choice.destination||(choice.direction===1?choice.line.end:choice.line.start);return (end?'往'+end+' · ':'')+(choice.direction===1?'上行':'下行')}
export function vehicleSummary(service:NearbySnapshot['services'][number],stale=false){
 if(stale)return '车辆位置未更新'
 const v=service.positions[0];if(!v)return '暂无实时车辆'
 const d=v.distanceMeters!==undefined?(v.distanceKind==='stations'?'站距估算 ':'直线距本站 ')+Math.round(v.distanceMeters)+' 米':'距本站米数未知'
 return d+(v.stationName?' · 近'+v.stationName:'')+(v.passed?' · 已过本站':'')+(service.positions.length>1?' · 等'+service.positions.length+'辆':'')
}
export function arrivalVehicle(service:NearbySnapshot['services'][number],a:Arrival|undefined=service.items[0]){
 if(!a)return service.positions[0]
 return service.positions.find(p=>a.vehicleId?p.vehicleId===a.vehicleId:a.plate?p.plate===a.plate:p.stationNo!==undefined&&!p.passed&&service.choice.station.no-p.stationNo===a.stops)
}
export function compactVehicleSummary(service:NearbySnapshot['services'][number],stale=false){
 if(stale)return '位置待更新'
 const a=service.items[0],v=arrivalVehicle(service)
 const distance=v?.distanceMeters!==undefined?(v.distanceKind==='stations'?'约':'直线')+(v.distanceMeters<1000?Math.round(v.distanceMeters)+'米':(v.distanceMeters/1000).toFixed(1)+'公里'):'距离待更新'
 return [v?.passed?'已过本站':a&&a.stops>0?'还剩 '+a.stops+' 站':'',v||a?distance:'暂无车辆'].filter(Boolean).join(' · ')
}
