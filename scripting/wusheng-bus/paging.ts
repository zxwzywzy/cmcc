import type { NearbySnapshot } from './nearby'
export const pageSize=(family:string)=>family==='systemSmall'?1:family==='systemLarge'||family==='systemExtraLarge'?4:2
export function servicePage(snapshot:NearbySnapshot|undefined,family:string){
 const all=snapshot?.services||[],size=pageSize(family),count=Math.max(1,Math.ceil(all.length/size)),key='wusheng.bus.page.'+family
 const saved=Storage.get<{stopId:string;index:number}>(key),index=saved?.stopId===snapshot?.stop?.id&&Number.isInteger(saved?.index)?((saved!.index%count)+count)%count:0
 return {index,count,total:all.length,rows:all.slice(index*size,index*size+size)}
}
export function turnPage(snapshot:NearbySnapshot|undefined,family:string,stopId:string,step:number){
 if(!snapshot?.stop||snapshot.stop.id!==stopId||!['systemSmall','systemMedium','systemLarge','systemExtraLarge'].includes(family)||![1,-1].includes(step))return
 const p=servicePage(snapshot,family);Storage.set('wusheng.bus.page.'+family,{stopId,index:(p.index+step+p.count)%p.count})
}
