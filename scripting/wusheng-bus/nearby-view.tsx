import { Button,HStack,Spacer,Text,Link,Script } from 'scripting'
import { meters,destination,compactVehicleSummary,arrivalVehicle,type NearbySnapshot } from './nearby'
import { estimateLabel,stationProgress,followingLabel } from './model'
import { servicePage,directionLabel } from './paging'
import { BusPageIntent,BusDirectionIntent,BusRefreshIntent } from './app_intents'
import { WidgetCard,type WidgetRoute } from './widget-ui'
import { routeURL } from './route-links'
import { RideAction,directionAppearance } from './widget-actions'
export function NearbyView({snapshot,family,interactive=false,slot='',card,cardStale=false,resting=false}:{snapshot?:NearbySnapshot;family:string;interactive?:boolean;slot?:string;card?:{balance?:number;fetchedAt:number};cardStale?:boolean;resting?:boolean}){
 const s=snapshot,page=servicePage(s,family,slot),small=family==='systemSmall',age=s?Date.now()-s.time:Infinity
 const live=!!s&&!s.stale&&age>=0&&age<=120000
 const routes:WidgetRoute[]=page.rows.map(r=>{
  const a=r.items[0],v=arrivalVehicle(r)
  return {id:r.choice.line.id+':'+r.choice.direction,name:r.choice.line.name,direction:destination(r.choice).replace(/ · [上下]行$/,''),eta:estimateLabel(a,live,r.positions.length),minutes:live&&!a?.atStation&&a?.minutes!==undefined&&a.minutes>0?a.minutes:undefined,detail:compactVehicleSummary(r,!live),plate:live?a?.plate||v?.plate:undefined,hasVehicle:live&&!!(a||v),next:live?r.items.slice(1).map((item,i)=>({label:followingLabel(item,s?.time,live,i?'后续':'下一辆')!,plate:item.plate})):[],progress:stationProgress(a,r.choice.station.no,live),url:routeURL(r.choice)}
 })
 const footer=interactive?<HStack spacing={small?3:6}>{page.count>1&&s?.stop?<Button title={small?'线路':'线路 '+(page.index+1)+'/'+page.count} buttonStyle="plain" font={small?9:10} intent={BusPageIntent({stopId:s.stop.id,family,slot,step:1})}/>:<Link url={Script.createRunURLScheme(Script.name,{page:'live',select:'1'})}><Text font={small?9:10}>线路</Text></Link>}<Spacer minLength={0}/><Link url={Script.createRunURLScheme(Script.name,{page:'ride'})}><RideAction small={small}/></Link><Spacer minLength={0}/><Button title="换向" {...directionAppearance(small)} disabled={!s?.stop} intent={BusDirectionIntent({stopId:s?.stop?.id||'',family,slot})}/></HStack>:null
 return <WidgetCard station={s?.stop?.name||'附近公交'} subtitle={s?.stop?(s.locationStale?'定位待更新':meters(s.stop.meters))+' · '+page.routeCount+' 路 · '+directionLabel(page.direction):'打开实时公交自动定位'} routes={routes} family={family} time={s?.time} card={card} footer={footer} resting={resting} refreshIntent={interactive?BusRefreshIntent(undefined):undefined} empty={s?.stop?'本站暂无'+directionLabel(page.direction)+'线路，点击换向':'打开实时公交查找附近站台'}/>
}
