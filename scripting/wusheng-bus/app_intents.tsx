import { AppIntentManager,AppIntentProtocol,Widget } from 'scripting'
import { isNearby,nearbyCurrent } from './nearby'
import { current } from './api'
export const BusRefreshIntent=AppIntentManager.register({name:'WushengBusRefresh',protocol:AppIntentProtocol.AppIntent,perform:async()=>{if(isNearby())await nearbyCurrent({widget:true});else await current();Widget.reloadAll()}})
