import { Widget } from 'scripting'
import { current,balance } from './api'
import { readAccount } from './account'
import { BusView } from './view'
async function main(){
 const [bus,card]=await Promise.allSettled([current(),readAccount()?balance():Promise.resolve(undefined)])
 const fallback=readAccount()?Storage.get<any>('wusheng.bus.balance'):undefined
 Widget.present(<BusView family={Widget.family} snapshot={bus.status==='fulfilled'?bus.value:undefined} card={card.status==='fulfilled'?card.value:fallback} cardStale={card.status==='rejected'}/>,{policy:'after',date:new Date(Date.now()+5*60000)})
}
main()
