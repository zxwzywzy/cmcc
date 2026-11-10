import { AppIntentManager,AppIntentProtocol,Widget } from 'scripting'
import { isNearby,nearbyCurrent,cachedNearby } from './nearby'
import { current } from './api'
export const BusRefreshIntent=AppIntentManager.register({name:'WushengBusRefresh',protocol:AppIntentProtocol.AppIntent,perform:async()=>{if(isNearby())await nearbyCurrent({widget:true});else await current();Widget.reloadAll()}})

import {turnPage,switchDirection} from './paging'
export const BusPageIntent=AppIntentManager.register({name:'WushengBusPage',protocol:AppIntentProtocol.AppIntent,perform:async({stopId,family,step,slot=''}:{stopId:string;family:string;step:number;slot?:string})=>{turnPage(cachedNearby(),family,stopId,step,slot);Widget.reloadAll()}})

export const BusLocateIntent=AppIntentManager.register({name:'WushengBusLocate',protocol:AppIntentProtocol.AppIntent,perform:async()=>{await nearbyCurrent({widget:true,force:true});Widget.reloadAll()}})
export const BusDirectionIntent=AppIntentManager.register({name:'WushengBusDirection',protocol:AppIntentProtocol.AppIntent,perform:async({stopId,family,slot=''}:{stopId:string;family:string;slot?:string})=>{switchDirection(cachedNearby(),family,stopId,slot);Widget.reloadAll()}})
