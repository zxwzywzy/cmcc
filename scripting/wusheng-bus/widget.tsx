import { Widget } from 'scripting'
import { current,balance } from './api'
import { readAccount } from './account'
import { BusView } from './view'
import {isNearby,nearbyCurrent} from './nearby'
import {NearbyView} from './nearby-view'

import {stackSlot} from './paging'
async function main(){
 if(isNearby()){const slot=stackSlot(String(Widget.parameter||''));const [near,card]=await Promise.allSettled([nearbyCurrent({widget:true}),readAccount()?balance():Promise.resolve(undefined)]);const fallback=readAccount()?Storage.get<any>('wusheng.bus.balance'):undefined;Widget.present(<NearbyView snapshot={near.status==='fulfilled'?near.value:undefined} family={Widget.family} slot={slot} card={card.status==='fulfilled'?card.value:fallback} cardStale={card.status==='rejected'} interactive/>,{policy:'after',date:new Date(Date.now()+60000)});return}
 const [bus,card]=await Promise.allSettled([current(),readAccount()?balance():Promise.resolve(undefined)])
 const fallback=readAccount()?Storage.get<any>('wusheng.bus.balance'):undefined
 Widget.present(<BusView family={Widget.family} snapshot={bus.status==='fulfilled'?bus.value:undefined} card={card.status==='fulfilled'?card.value:fallback} cardStale={card.status==='rejected'}/>,{policy:'after',date:new Date(Date.now()+5*60000)})
}
main()
