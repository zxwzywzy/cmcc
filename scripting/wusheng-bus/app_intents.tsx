import { AppIntentManager,AppIntentProtocol,Widget } from 'scripting'
import { isNearby,nearbyCurrent,cachedNearby } from './nearby'
import { current,balance } from './api'
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

export const BusPageIntent=AppIntentManager.register({name:'WushengBusPage',protocol:AppIntentProtocol.AppIntent,perform:async({stopId,family,step,slot=''}:{stopId:string;family:string;step:number;slot?:string})=>{turnPage(cachedNearby(),family,stopId,step,slot);noteWidgetInteraction();Widget.reloadAll()}})
export const BusDirectionIntent=AppIntentManager.register({name:'WushengBusDirection',protocol:AppIntentProtocol.AppIntent,perform:async({stopId,family,slot=''}:{stopId:string;family:string;slot?:string})=>{switchDirection(cachedNearby(),family,stopId,slot);noteWidgetInteraction();Widget.reloadAll()}})
