import { Script } from 'scripting'
import type { Choice } from './model'
export type RouteRequest={lineId:string;direction:1|2;stationId?:string;stationNo?:number;name?:string}
export function parseRouteRequest(q:Record<string,unknown>|undefined):RouteRequest|undefined{
 if(q?.page!=='route'||typeof q.lineId!=='string'||!/^\d{1,24}$/.test(q.lineId)||!['1','2'].includes(String(q.direction)))return undefined
 if(q.stationId!==undefined&&(typeof q.stationId!=='string'||!/^[A-Za-z0-9_-]{1,64}$/.test(q.stationId)))return undefined
 if(q.stationNo!==undefined&&(!/^\d{1,5}$/.test(String(q.stationNo))||Number(q.stationNo)<1||Number(q.stationNo)>10000))return undefined
 return {lineId:q.lineId,direction:Number(q.direction) as 1|2,stationId:typeof q.stationId==='string'?q.stationId:undefined,stationNo:q.stationNo!==undefined?Number(q.stationNo):undefined,name:typeof q.name==='string'?q.name.replace(/[\r\n]/g,' ').slice(0,60):undefined}
}
export function routeURL(c:Choice){const q:Record<string,string>={page:'route',lineId:c.line.id,direction:String(c.direction),name:c.line.name};if(c.station.id)q.stationId=c.station.id;if(Number.isInteger(c.station.no)&&c.station.no>0)q.stationNo=String(c.station.no);return Script.createRunURLScheme(Script.name,q)}
