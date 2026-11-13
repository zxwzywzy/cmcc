import { AppIntentManager,AppIntentProtocol,Widget } from 'scripting'
import { isNearby,nearbyCurrent,cachedNearby,coordinate,distance } from './nearby'
import { current,balance,choice,loadStations,saveChoice,vehicles } from './api'
import { arrivals } from './model'
import { readAccount } from './account'
import {turnPage,switchDirection} from './paging'
import {widgetRuntime,saveWidgetRuntime,noteWidgetInteraction} from './runtime'

async function refreshOnce(locate=false){
 if(!widgetRuntime().enabled){Widget.reloadAll();return}
 noteWidgetInteraction()
 try{await Promise.allSettled([locate?nearbyCurrent({widget:true,force:true}):isNearby()?nearbyCurrent({widget:true}):current(),readAccount()?balance():Promise.resolve(undefined)])}
 finally{noteWidgetInteraction();Widget.reloadAll()}
}
export const BusRefreshIntent=AppIntentManager.register({name:'WushengBusRefresh',protocol:AppIntentProtocol.AppIntent,perform:async()=>{await refreshOnce()}})
export const BusLocateIntent=AppIntentManager.register({name:'WushengBusLocate',protocol:AppIntentProtocol.AppIntent,perform:async()=>{await refreshOnce(true)}})
export const BusWakeIntent=AppIntentManager.register({name:'WushengBusWake',protocol:AppIntentProtocol.AppIntent,perform:async()=>{saveWidgetRuntime({enabled:true});await refreshOnce()}})
export const BusPauseIntent=AppIntentManager.register({name:'WushengBusPause',protocol:AppIntentProtocol.AppIntent,perform:async()=>{saveWidgetRuntime({enabled:false});noteWidgetInteraction();Widget.reloadAll()}})
export const BusFixedDirectionIntent=AppIntentManager.register({name:'WushengBusFixedDirection',protocol:AppIntentProtocol.AppIntent,perform:async()=>{
 if(!widgetRuntime().enabled)return
 const previous=choice();if(!previous)return
 noteWidgetInteraction()
 try{
  const direction=previous.direction===1?2:1,stations=await loadStations(previous.line.id,direction),anchor=coordinate(previous.station),same=stations.filter(s=>s.name===previous.station.name)
  const stop=anchor?stations.filter(s=>coordinate(s)).sort((a,b)=>distance(anchor,coordinate(a)!)-distance(anchor,coordinate(b)!))[0]:same.length===1?same[0]:undefined
  if(!stop)return
  const rows=await vehicles(previous.line.id,direction),selected=choice();if(selected?.line.id!==previous.line.id||selected.direction!==previous.direction||selected.station.id!==previous.station.id||selected.station.no!==previous.station.no)return
  const next={line:previous.line,direction,station:stop,destination:stations.at(-1)?.name};saveChoice(next);Storage.set('wusheng.bus.arrival',{choice:next,items:arrivals(rows,next,stations),vehicleCount:rows.filter(v=>String(v.lineId)===next.line.id&&Number(v.bizType??v.upOrDown)===direction).length,time:Date.now()})
 }finally{noteWidgetInteraction();Widget.reloadAll()}
}})

export const BusPageIntent=AppIntentManager.register({name:'WushengBusPage',protocol:AppIntentProtocol.AppIntent,perform:async({stopId,family,step,slot=''}:{stopId:string;family:string;step:number;slot?:string})=>{turnPage(cachedNearby(),family,stopId,step,slot);noteWidgetInteraction();Widget.reloadAll()}})
export const BusDirectionIntent=AppIntentManager.register({name:'WushengBusDirection',protocol:AppIntentProtocol.AppIntent,perform:async({stopId,family,slot=''}:{stopId:string;family:string;slot?:string})=>{switchDirection(cachedNearby(),family,stopId,slot);noteWidgetInteraction();Widget.reloadAll()}})
