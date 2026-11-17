import { Widget } from 'scripting'
import { current,balance,choice,type BusSnapshot } from './api'
import { readAccount } from './account'
import { BusView } from './view'
import {isNearby,nearbyCurrent,cachedNearby} from './nearby'
import {NearbyView} from './nearby-view'
import {RestView} from './rest-view'
import {stackSlot} from './paging'
import {widgetRuntime,widgetAwake,widgetReloadIsLocal,widgetRefreshDate,noteWidgetInteraction} from './runtime'

import {readActiveTrip} from './active-trip'
import {remainingStops} from './ride-progress'
import {waitingETA,presentTrip} from './trip-widget'

import {presentRideWidget} from './ride-widget'

async function main(){
 let settings=widgetRuntime()
 if(String(Widget.parameter||'').trim()==='乘车码'){
  if(settings.enabled)await presentRideWidget()
  else Widget.present(<RestView family={Widget.family}/>,{policy:'after',date:widgetRefreshDate(settings,false)})
  return
 }
 const trip=settings.enabled?readActiveTrip():undefined
 if(trip){
  const eta=!trip.onBoard&&widgetAwake(settings)?await waitingETA(trip):undefined
  const remaining=trip.onBoard&&widgetAwake(settings)?await remainingStops(trip).catch(()=>undefined):undefined
  settings=widgetRuntime()
  if(presentTrip(settings,isNearby(),trip,eta,remaining))return
 }
 const nearby=isNearby(),resting=!widgetAwake(settings)
 const policy={policy:'after' as const,date:widgetRefreshDate(settings,nearby)}
 if(!settings.enabled){Widget.present(<RestView family={Widget.family}/>,policy);return}
 const account=readAccount(),slot=stackSlot(String(Widget.parameter||''))
 let snapshot=nearby?cachedNearby():cachedBus()
 let card=account?Storage.get<Awaited<ReturnType<typeof balance>>>('wusheng.bus.balance')||undefined:undefined
 let cardStale=!!card&&(!Number.isFinite(card.fetchedAt)||card.fetchedAt>Date.now()||Date.now()-card.fetchedAt>=5*60000)
 const recent=!!snapshot&&!snapshot.stale&&Date.now()>=snapshot.time&&Date.now()-snapshot.time<15000
 if(!resting&&!(widgetReloadIsLocal()&&recent)){
  const needsBalance=!!account&&(!card||cardStale)
  const cardWork=(needsBalance?balance(account,{timeout:2}):Promise.resolve(card)).then(value=>({status:'fulfilled' as const,value}),()=>({status:'rejected' as const}))
  const bus=await (nearby?nearbyCurrent({widget:true}):current()).then(value=>({status:'fulfilled' as const,value}),()=>({status:'rejected' as const}))
  if(bus.status==='fulfilled')snapshot=bus.value
  else if(snapshot)snapshot={...snapshot,stale:true}
  if(bus.status==='fulfilled'&&bus.value&&!bus.value.stale)noteWidgetInteraction()
  const result=await briefly(cardWork,250)
  if(result?.status==='fulfilled'){card=result.value;cardStale=false}
  else cardStale=!!card
 }
 // A trip may also have started during a normal bus/balance refresh.
 const latest=widgetRuntime()
 if(!latest.enabled){Widget.present(<RestView family={Widget.family}/>,{policy:'after',date:widgetRefreshDate(latest,nearby)});return}
 if(presentTrip(latest,nearby))return
 policy.date=widgetRefreshDate(settings,nearby)
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
async function briefly<T>(work:Promise<T>,ms:number):Promise<T|undefined>{let timer:ReturnType<typeof setTimeout>|undefined;try{return await Promise.race([work,new Promise<undefined>(resolve=>{timer=setTimeout(()=>resolve(undefined),ms)})])}finally{if(timer!==undefined)clearTimeout(timer)}}
function cachedBus():BusSnapshot|undefined{
 const saved=Storage.get<BusSnapshot>('wusheng.bus.arrival'),selected=choice()
 return saved&&selected&&saved.choice.line.id===selected.line.id&&saved.choice.direction===selected.direction&&saved.choice.station.id===selected.station.id&&saved.choice.station.no===selected.station.no?saved:undefined
}
main()
