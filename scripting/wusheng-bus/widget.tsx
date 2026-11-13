import { Widget } from 'scripting'
import { current,balance,choice,type BusSnapshot } from './api'
import { readAccount } from './account'
import { BusView } from './view'
import {isNearby,nearbyCurrent,cachedNearby} from './nearby'
import {NearbyView} from './nearby-view'
import {RestView} from './rest-view'
import {stackSlot} from './paging'
import {widgetRuntime,widgetAwake,widgetReloadIsLocal,widgetRefreshDate} from './runtime'

async function main(){
 const settings=widgetRuntime(),nearby=isNearby(),resting=!widgetAwake(settings)
 const policy={policy:'after' as const,date:widgetRefreshDate(settings,nearby)}
 if(!settings.enabled){Widget.present(<RestView family={Widget.family}/>,policy);return}
 const account=readAccount(),slot=stackSlot(String(Widget.parameter||''))
 let snapshot=nearby?cachedNearby():cachedBus()
 let card=account?Storage.get<Awaited<ReturnType<typeof balance>>>('wusheng.bus.balance')||undefined:undefined
 let cardStale=!!card&&(!Number.isFinite(card.fetchedAt)||Date.now()-card.fetchedAt>5*60000)
 if(!resting&&!widgetReloadIsLocal()){
  const [bus,result]=await Promise.allSettled([nearby?nearbyCurrent({widget:true}):current(),account?balance():Promise.resolve(undefined)])
  if(bus.status==='fulfilled')snapshot=bus.value
  else if(snapshot)snapshot={...snapshot,stale:true}
  if(result.status==='fulfilled'){card=result.value;cardStale=false}
  else cardStale=!!card
 }
 // Age the displayed copy only; retain the actual fetch/location timestamps.
 if(snapshot){
  snapshot={...snapshot,stale:!!snapshot.stale||!Number.isFinite(snapshot.time)||Date.now()-snapshot.time>(nearby?60000:120000)}
  if('services' in snapshot&&snapshot.position)snapshot={...snapshot,locationStale:!!snapshot.locationStale||Date.now()-snapshot.position.timestamp>120000}
  // Expire time-sensitive text with a local-only redraw even while sleeping.
  const expires=snapshot.time+(nearby?60000:120000)+1000
  if(resting&&Number.isFinite(expires)&&expires>Date.now())policy.date=new Date(Math.min(policy.date.getTime(),expires))
 }
 if(nearby)Widget.present(<NearbyView snapshot={snapshot as ReturnType<typeof cachedNearby>} family={Widget.family} slot={slot} card={card} cardStale={cardStale} interactive resting={resting}/>,policy)
 else Widget.present(<BusView family={Widget.family} snapshot={snapshot as BusSnapshot|undefined} card={card} cardStale={cardStale} resting={resting}/>,policy)
}
function cachedBus():BusSnapshot|undefined{
 const saved=Storage.get<BusSnapshot>('wusheng.bus.arrival'),selected=choice()
 return saved&&selected&&saved.choice.line.id===selected.line.id&&saved.choice.direction===selected.direction&&saved.choice.station.id===selected.station.id?saved:undefined
}
main()
