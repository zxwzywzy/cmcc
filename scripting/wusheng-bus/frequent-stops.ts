import type { RouteRequest } from './route-links'

export const stopSlots=['work','home'] as const
export type StopSlot=typeof stopSlots[number]
export const slotTitle={work:'上班',home:'回家'}
export type FrequentStop=RouteRequest & {name:string;stationId:string;stationNo:number;stationName:string}
const key=(slot:StopSlot)=>'wusheng.bus.frequentStop.v1.'+slot

export function readStop(slot:StopSlot):FrequentStop|undefined {
 const s=Storage.get<FrequentStop>(key(slot))
 return s && typeof s.lineId==='string' && (s.direction===1||s.direction===2) && typeof s.stationId==='string' && Number.isInteger(s.stationNo) && typeof s.name==='string' && typeof s.stationName==='string' ? s : undefined
}
export function saveStop(slot:StopSlot,stop:FrequentStop){Storage.set(key(slot),stop)}
export function removeStop(slot:StopSlot){Storage.remove(key(slot))}
