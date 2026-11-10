import { post,vehicleBatch } from './api'
import { arrivals,finite,normalizeStations,text,type Choice,type Station } from './model'
export type Coordinate={latitude:number;longitude:number}
export type Position=Coordinate&{timestamp:number}
export type Service={choice:Choice;stations:Station[]}
export type NearbyStop={id:string;name:string;coordinate:Coordinate;meters:number;services:Service[]}
export type VehiclePosition={label:string;stationName?:string;coordinate?:Coordinate;gps:boolean}
export type NearbySnapshot={stop?:NearbyStop;otherStops:NearbyStop[];services:{choice:Choice;items:ReturnType<typeof arrivals>;positions:VehiclePosition[]}[];position?:Position;time:number;stale?:boolean;locationStale?:boolean;message?:string}
const CACHE='wusheng.bus.nearby.v2'
export function cachedNearby(){return Storage.get<NearbySnapshot>(CACHE)||undefined}
export const isNearby=()=>Storage.get('wusheng.bus.mode')!=='manual'
export function setMode(mode:'nearby'|'manual'){Storage.set('wusheng.bus.mode',mode)}
export function coordinate(v:any):Coordinate|undefined{const latitude=finite(v?.latitude),longitude=finite(v?.longitude);return latitude!==undefined&&longitude!==undefined&&Math.abs(latitude)<=90&&Math.abs(longitude)<=180&&!(latitude===0&&longitude===0)?{latitude,longitude}:undefined}
export function normalizeNearby(body:any):NearbyStop[]{
 if(body?.code!==0||!Array.isArray(body?.data?.data))throw Error('附近站台查询失败')
 return body.data.data.flatMap((s:any)=>{
  const c=coordinate(s),meters=finite(s.len);if(!c||meters===undefined||meters<0||!text(s.stationId)||!text(s.stationName))return []
  const services:Service[]=(Array.isArray(s.lineDatas)?s.lineDatas:[]).flatMap((l:any)=>{
   const id=text(l.lineId),direction=Number(l.upOrDown),no=finite(l.stationsNo);if(!/^\d+$/.test(id)||![1,2].includes(direction)||no===undefined)return []
   const stations=normalizeStations({code:0,data:{data:Array.isArray(l.stationsList)?l.stationsList:[]}})
   const station=stations.find(v=>v.no===no&&(!l.stationsId||v.id===text(l.stationsId)))||{id:text(l.stationsId)||text(s.stationId),name:text(s.stationName),no}
   return [{choice:{line:{id,name:text(l.lineName),start:text(l.startStations),end:text(l.endStations)},direction,station},stations}]
  })
  return [{id:text(s.stationId),name:text(s.stationName),coordinate:c,meters,services}]
 }).sort((a:NearbyStop,b:NearbyStop)=>a.meters-b.meters)
}
export function positions(rows:any[],service:Service):VehiclePosition[]{
 return rows.filter(v=>text(v.lineId)===service.choice.line.id&&Number(v.bizType??v.upOrDown)===service.choice.direction).sort((a,b)=>{const x=finite(a.stationNo)??Infinity,y=finite(b.stationNo)??Infinity,t=service.choice.station.no;return Number(x>t)-Number(y>t)||Math.abs(x-t)-Math.abs(y-t)}).slice(0,8).map(v=>{
  const station=service.stations.find(s=>s.no===finite(v.stationNo));const c=coordinate(v)
  // A reported station is not the vehicle's precise GPS location.
  const source=station as Station&Partial<Coordinate>|undefined
  return {label:service.choice.line.name,stationName:station?.name||(finite(v.stationNo)!==undefined?'第'+v.stationNo+'站（站名未返回）':undefined),coordinate:c||coordinate(source),gps:!!c}
 })
}
export async function freshPosition(force=true):Promise<Position>{
 const p=await Location.requestCurrent({forceRequest:force});const c=coordinate(p)
 if(!c||!p?.timestamp||Date.now()-p.timestamp>120000)throw Error('未取得近期定位，请允许精确位置后重试')
 return {...c,timestamp:p.timestamp}
}
export function clearNearby(){Storage.set(CACHE,null);Storage.set('wusheng.bus.nearby.v1',null);Storage.set('wusheng.bus.location.enabled',false)}
export async function nearbyCurrent(options:{widget?:boolean;enable?:boolean}={}):Promise<NearbySnapshot|undefined>{
 if(!options.enable&&!Storage.get('wusheng.bus.location.enabled'))return undefined
 let position:Position|undefined,stop:NearbyStop|undefined,otherStops:NearbyStop[]=[]
 try{
  if(options.widget&&!Location.isAuthorizedForWidgetUpdates)throw Error('桌面定位未授权，请打开脚本刷新')
  const p=await Location.requestCurrent({forceRequest:!options.widget}),c=coordinate(p)
  if(!c||!p?.timestamp)throw Error('定位未获授权，请打开脚本允许定位')
  position={...c,timestamp:p.timestamp};if(Date.now()-p.timestamp>10*60000)throw Error('定位已超过十分钟，请打开脚本重新定位')
  Storage.set('wusheng.bus.location.enabled',true)
  const list=normalizeNearby(await post('/api/AppBusiness/GetBusStations',{pageIndex:1,pageSize:5,latitude:c.latitude,longitude:c.longitude}))
  stop=list[0];otherStops=list.slice(1,3)
  if(!stop){const result:NearbySnapshot={otherStops:[],services:[],position,time:Date.now(),message:'该位置附近没有公交站台'};Storage.set(CACHE,result);return result}
  const selected=stop.services.filter((s,i,all)=>all.findIndex(v=>v.choice.line.id===s.choice.line.id&&v.choice.direction===s.choice.direction)===i)
  const rows=selected.length?await vehicleBatch(selected.map(s=>({lineId:s.choice.line.id,upOrDown:s.choice.direction}))):[]
  const result:NearbySnapshot={stop,otherStops,services:selected.map(s=>({choice:s.choice,items:arrivals(rows,s.choice,s.stations),positions:positions(rows,s)})),position,time:Date.now(),locationStale:Date.now()-p.timestamp>120000}
  Storage.set(CACHE,result);return result
 }catch(e){
  const previous=Storage.get<NearbySnapshot>(CACHE),message=(e as Error).message
  // Never reuse a vehicle snapshot from another station after a successful new location/stop lookup.
  if(previous&&(!position||previous.position&&distance(position,previous.position)<100)&&(!stop||stop.id===previous.stop?.id))return {...previous,stale:true,message}
  return {stop,otherStops,services:stop?.services.map(s=>({choice:s.choice,items:[],positions:[]}))||[],position,time:Date.now(),stale:true,message}
 }
}
export function distance(a:Coordinate,b:Coordinate){const r=Math.PI/180,dlat=(b.latitude-a.latitude)*r,dlon=(b.longitude-a.longitude)*r;const x=Math.sin(dlat/2)**2+Math.cos(a.latitude*r)*Math.cos(b.latitude*r)*Math.sin(dlon/2)**2;return 6371000*2*Math.atan2(Math.sqrt(x),Math.sqrt(Math.max(0,1-x)))}
export function meters(n:number){return n<1000?Math.round(n)+' 米':(n/1000).toFixed(1)+' 公里'}
