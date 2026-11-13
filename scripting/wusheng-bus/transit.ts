import { loadLines,loadStations,vehicles } from './api'
import { arrivals,type Choice,type Line,type Station } from './model'
import { coordinate,distance,positions,type Coordinate,type NearbySnapshot,type VehiclePosition } from './nearby'
import type { RouteRequest } from './route-links'
export type RouteDetail={request:RouteRequest;line:Line;direction:1|2;stations:Station[];stop?:Station;position?:Coordinate;items:ReturnType<typeof arrivals>;positions:VehiclePosition[];time:number;stale?:boolean;message?:string}
const DIRECTION='wusheng.bus.live.direction.v1'
const stationCache=new Map<string,{stations:Station[];time:number}>();let directory:Line[]=[],directoryTime=0
export function liveDirection():1|2{return Storage.get(DIRECTION)===2?2:1}
export function setLiveDirection(direction:1|2){Storage.set(DIRECTION,direction)}
export async function availableLines(){if(!directory.length||Date.now()-directoryTime>3600000){directory=await loadLines();directoryTime=Date.now()}return directory}
export function oneDirection(snapshot:NearbySnapshot|undefined,preferred=liveDirection(),lineId=''){
 const rows=snapshot?.services||[],unique=new Map<string,typeof rows[number]>()
 for(const row of rows){if(lineId&&row.choice.line.id!==lineId)continue;const old=unique.get(row.choice.line.id);if(!old||row.choice.direction===preferred&&old.choice.direction!==preferred)unique.set(row.choice.line.id,row)}
 return [...unique.values()]
}
export function requestFor(c:Choice):RouteRequest{return {lineId:c.line.id,direction:c.direction as 1|2,stationId:c.station.id,stationNo:c.station.no,name:c.line.name}}
export function detailIsLive(detail:RouteDetail|undefined,now=Date.now()){return !!detail&&!detail.stale&&now>=detail.time&&now-detail.time<=45000}
export function routeCoordinates(detail:RouteDetail|undefined){return (detail?.stations||[]).map(coordinate).filter((c):c is Coordinate=>!!c)}
export async function loadRouteDetail(request:RouteRequest,snapshot?:NearbySnapshot):Promise<RouteDetail>{
 if(!/^\d{1,24}$/.test(request.lineId)||![1,2].includes(request.direction))throw Error('线路参数无效')
 const known=snapshot?.stop?.services.find(s=>s.choice.line.id===request.lineId&&s.choice.direction===request.direction)
 const key=request.lineId+':'+request.direction
 const cached=stationCache.get(key)
 let stations=known?.stations?.length?known.stations:cached&&Date.now()-cached.time<=300000?cached.stations:undefined
 if(!stations){stations=await loadStations(request.lineId,request.direction);if(stations.length)stationCache.set(key,{stations,time:Date.now()})}
 let line=known?.choice.line||snapshot?.services.find(s=>s.choice.line.id===request.lineId)?.choice.line||directory.find(l=>l.id===request.lineId)
 if(!line&&!request.name){try{line=(await availableLines()).find(l=>l.id===request.lineId)}catch{}}
 line=line||{id:request.lineId,name:request.name||'公交线路',start:stations[0]?.name||'',end:stations.at(-1)?.name||''}
 const p=snapshot?.position,age=p?Date.now()-p.timestamp:Infinity,position=p&&age>=0&&age<=120000?coordinate(p):undefined
 let stop=stations.find(s=>(request.stationId?s.id===request.stationId:request.stationNo!==undefined)&& (request.stationNo===undefined||s.no===request.stationNo))||(!request.stationId&&request.stationNo===undefined?known?.choice.station:undefined)
 if(!stop&&position){stop=stations.filter(s=>coordinate(s)).sort((a,b)=>distance(position,coordinate(a)!)-distance(position,coordinate(b)!))[0]}
 const target=stop||stations[0]
 if(!target)return {request,line,direction:request.direction,stations,position,items:[],positions:[],time:Date.now(),message:'该方向未返回站点'}
 const choice:Choice={line,direction:request.direction,station:target,destination:stations.at(-1)?.name}
 const live=snapshot&&!snapshot.stale&&Date.now()>=snapshot.time&&Date.now()-snapshot.time<=30000
 const shared=live?snapshot.services.find(r=>r.choice.line.id===request.lineId&&r.choice.direction===request.direction&&r.choice.station.id===target.id&&r.choice.station.no===target.no):undefined
 if(shared)return {request,line,direction:request.direction,stations,stop,position,items:stop?shared.items:[],positions:shared.positions,time:snapshot!.time}
 const rows=await vehicles(request.lineId,request.direction)
 return {request,line,direction:request.direction,stations,stop,position,items:stop?arrivals(rows,choice,stations):[],positions:positions(rows,{choice,stations},stop?coordinate(stop):undefined).map(p=>stop?p:{...p,distanceMeters:undefined,distanceKind:undefined}),time:Date.now()}
}
