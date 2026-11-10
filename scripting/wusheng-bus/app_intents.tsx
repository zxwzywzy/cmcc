import { AppIntentManager,AppIntentProtocol,Widget } from 'scripting'
import { isNearby,nearbyCurrent,cachedNearby } from './nearby'
import { current } from './api'
export const BusRefreshIntent=AppIntentManager.register({name:'WushengBusRefresh',protocol:AppIntentProtocol.AppIntent,perform:async()=>{if(isNearby())await nearbyCurrent({widget:true});else await current();Widget.reloadAll()}})

import {turnPage} from './paging'
export const BusPageIntent=AppIntentManager.register({name:'WushengBusPage',protocol:AppIntentProtocol.AppIntent,perform:async({stopId,family,step}:{stopId:string;family:string;step:number})=>{turnPage(cachedNearby(),family,stopId,step);Widget.reloadAll()}})
