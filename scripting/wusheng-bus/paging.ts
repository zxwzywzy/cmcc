import type { NearbySnapshot } from './nearby'
export const pageSize=(family:string)=>family==='systemSmall'?1:family==='systemLarge'||family==='systemExtraLarge'?3:2
export function stackSlot(param:string){const match=/^叠放([1-9]|10)$/.exec(param.trim());return match?match[1]:''}
const suffix=(family:string,slot:string)=>family+(slot?'.stack'+slot:'')
// One direction per route; the button switches strictly between up and down.
export function selectedDirection(family:string,slot=''):number{const v=Storage.get<number>('wusheng.bus.direction.'+suffix(family,slot));return v===2?2:1}
export const directionLabel=(v:number)=>v===2?'下行':'上行'
export function servicePage(snapshot:NearbySnapshot|undefined,family:string,slot=''){
 const raw=snapshot?.services||[],direction=selectedDirection(family,slot),byLine=new Map<string,typeof raw[number]>()
 for(const row of raw){if(row.choice.direction===direction&&!byLine.has(row.choice.line.id))byLine.set(row.choice.line.id,row)}
 const all=Array.from(byLine.values()),size=pageSize(family),count=Math.max(1,Math.ceil(all.length/size)),key='wusheng.bus.page.'+suffix(family,slot)
 const saved=Storage.get<{stopId:string;index:number}>(key),base=slot?Number(slot)-1:0,index=saved?.stopId===snapshot?.stop?.id&&Number.isInteger(saved?.index)?((saved!.index%count)+count)%count:base%count
 return {index,count,total:all.length,routeCount:all.length,direction,rows:all.slice(index*size,index*size+size)}
}
export function turnPage(snapshot:NearbySnapshot|undefined,family:string,stopId:string,step:number,slot=''){
 if(!snapshot?.stop||snapshot.stop.id!==stopId||!['systemSmall','systemMedium','systemLarge','systemExtraLarge'].includes(family)||![1,-1].includes(step))return
 const p=servicePage(snapshot,family,slot);Storage.set('wusheng.bus.page.'+suffix(family,slot),{stopId,index:(p.index+step+p.count)%p.count})
}
export function switchDirection(snapshot:NearbySnapshot|undefined,family:string,stopId:string,slot=''){
 if(!snapshot?.stop||snapshot.stop.id!==stopId||!['systemSmall','systemMedium','systemLarge','systemExtraLarge'].includes(family))return
 Storage.set('wusheng.bus.direction.'+suffix(family,slot),selectedDirection(family,slot)===1?2:1)
 Storage.set('wusheng.bus.page.'+suffix(family,slot),{stopId,index:0})
}
