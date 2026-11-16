import { loadLines,watchVehicles } from './api'
import { coordinate,type Coordinate } from './nearby'
import { finite,text,vehiclePlate,type Line } from './model'
export type FleetVehicle={key:string;lineId:string;lineName:string;direction:1|2;destination:string;plate?:string;coordinate?:Coordinate;stationName:string;speed?:number}
export type FleetState={lines:Line[];vehicles:FleetVehicle[];time:number;loading:boolean;stale:boolean;message:string}
export function fleetVehicles(rows:any[],lines:Line[]):FleetVehicle[]{
 const known=new Map(lines.map(l=>[l.id,l])),unique=new Map<string,FleetVehicle>()
 for(const r of rows){const line=known.get(text(r?.lineId)),direction=Number(r?.bizType??r?.upOrDown);if(!line||![1,2].includes(direction))continue
  const plate=vehiclePlate(r),identity=text(r.vehicleId)||plate;if(!identity)continue
  const speed=finite(r.speed)
  unique.set(identity,{key:identity,lineId:line.id,lineName:line.name,direction:direction as 1|2,destination:direction===1?line.end:line.start,plate,coordinate:coordinate(r),stationName:text(r.stationName),speed:speed!==undefined&&speed>=0&&speed<=180?speed:undefined})
 }
 return [...unique.values()].sort((a,b)=>a.lineName.localeCompare(b.lineName,'zh-CN',{numeric:true})||a.direction-b.direction||a.key.localeCompare(b.key))
}
export function fleetRegion(vehicles:FleetVehicle[]){const coords=vehicles.flatMap(v=>v.coordinate?[v.coordinate]:[]);if(!coords.length)return undefined;const ys=coords.map(c=>c.latitude),xs=coords.map(c=>c.longitude),minY=Math.min(...ys),maxY=Math.max(...ys),minX=Math.min(...xs),maxX=Math.max(...xs);return {center:{latitude:(minY+maxY)/2,longitude:(minX+maxX)/2},span:{latitudeDelta:Math.max(0.015,(maxY-minY)*1.3),longitudeDelta:Math.max(0.015,(maxX-minX)*1.3)}}}
export function createFleetSession(){
 let state:FleetState={lines:[],vehicles:[],time:0,loading:false,stale:true,message:''},active=false,foreground=true,disposed=false,epoch=0,attempt=0,stop:undefined|(()=>void),retry:ReturnType<typeof setTimeout>|undefined
 const listeners=new Set<(s:FleetState)=>void>(),ready=()=>active&&foreground&&!disposed
 const emit=(patch:Partial<FleetState>)=>{if(disposed)return;state={...state,...patch};for(const fn of listeners)fn({...state})}
 function disconnect(){epoch++;stop?.();stop=undefined;clearTimeout(retry);retry=undefined}
 async function connect(){
  if(!ready())return;const token=++epoch;emit({loading:true,message:''})
  try{
   const lines=state.lines.length?state.lines:await loadLines();if(token!==epoch||!ready())return
   emit({lines});if(!lines.length)throw Error('暂无可查询的公交线路')
   stop=watchVehicles(lines.flatMap(l=>[1,2].map(upOrDown=>({lineId:l.id,upOrDown}))),rows=>{if(token!==epoch||!ready())return;attempt=0;emit({vehicles:fleetVehicles(rows,lines),time:Date.now(),loading:false,stale:false,message:''})},message=>{if(token!==epoch||!ready())return;emit({loading:false,stale:true,message});retry=setTimeout(connect,Math.min(15000,3000*2**Math.min(attempt++,3)))})
  }catch{if(token!==epoch||!ready())return;emit({loading:false,stale:true,message:'暂时无法读取线路，正在重试'});retry=setTimeout(connect,5000)}
 }
 return {getState:()=>({...state}),subscribe(fn:(s:FleetState)=>void){listeners.add(fn);return()=>{listeners.delete(fn)}},setActive(value:boolean){if(value===active)return;active=value;disconnect();if(ready())connect();else emit({loading:false,stale:true})},setForeground(value:boolean){if(value===foreground)return;foreground=value;disconnect();if(ready())connect();else emit({loading:false,stale:true})},refresh(){disconnect();if(ready())connect()},dispose(){disconnect();disposed=true;active=false;listeners.clear()}}
}
