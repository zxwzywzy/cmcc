import { Button,HStack,Link,Script,Spacer,Text } from 'scripting'
import type { BusSnapshot } from './api'
import { estimateLabel,stationProgress,followingLabel,type Arrival } from './model'
import { BusFixedDirectionIntent,BusRefreshIntent } from './app_intents'
import { WidgetCard,type WidgetRoute } from './widget-ui'
import { routeURL } from './route-links'
import { RideAction,directionAppearance } from './widget-actions'
export function clock(n:number){return new Date(n).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}
export function arrivalLabel(a?:Arrival){return !a?'暂无车辆':a.atStation?'已到站':a.stops===0?'车辆在本站附近':'还剩 '+a.stops+' 站'}
export function BusView({snapshot,card,family,cardStale=false,resting=false}:{snapshot?:BusSnapshot;card?:{balance?:number;cardTail?:string;fetchedAt:number};family:string;cardStale?:boolean;resting?:boolean}){
 const s=snapshot,c=s?.choice,age=s?Date.now()-s.time:Infinity,live=!!s&&!s.stale&&age>=0&&age<=120000
 const a=s?.items[0]
 const routes:WidgetRoute[]=c?[{id:'fixed',name:c.line.name,direction:c.destination?'往'+c.destination:(c.direction===1?'上行':'下行'),eta:estimateLabel(a,live,s?.vehicleCount),minutes:live&&!a?.atStation&&a?.minutes!==undefined&&a.minutes>0?a.minutes:undefined,detail:live?!a&&s?.vehicleCount?'线路有车，点击查看位置':a&&a.stops===0?'候车站附近':arrivalLabel(a):'位置待更新',plate:live?a?.plate||s?.vehiclePlate:undefined,hasVehicle:live&&!!(a||s?.vehicleCount),next:live?s?.items.slice(1).map((item,i)=>({label:followingLabel(item,s.time,live,i?'后续':'下一辆')!,plate:item.plate})):[],progress:stationProgress(a,c.station.no,live),url:routeURL(c)}]:[]
 const small=family==='systemSmall',footer=<HStack><Link url={Script.createRunURLScheme(Script.name,{page:'live',select:'1'})}><Text font={small?9:10}>线路</Text></Link><Spacer/><Link url={Script.createRunURLScheme(Script.name,{page:'ride'})}><RideAction small={small}/></Link><Spacer/><Button title="换向" {...directionAppearance(small)} disabled={!c} intent={BusFixedDirectionIntent(undefined)}/></HStack>
 return <WidgetCard station={c?.station.name||'选择候车站'} subtitle={c?'固定候车站 · '+(c.direction===1?'上行':'下行'):'在设置中选择线路与站点'} family={family} routes={routes} time={s?.time} card={card} footer={footer} resting={resting} refreshIntent={BusRefreshIntent(undefined)} empty="打开脚本选择候车站"/>
}
