import { Button,HStack,Link,Script,Spacer,Text } from 'scripting'
import type { BusSnapshot } from './api'
import { estimateLabel,stationProgress,type Arrival } from './model'
import { BusFixedDirectionIntent } from './app_intents'
import { WidgetCard,type WidgetRoute } from './widget-ui'
import { routeURL } from './route-links'
import { RideAction,directionAppearance } from './widget-actions'
export function clock(n:number){return new Date(n).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}
export function arrivalLabel(a?:Arrival){return !a?'暂无车辆':a.atStation?'已到站':a.stops===0?'车辆在本站附近':'还剩 '+a.stops+' 站'}
export function BusView({snapshot,card,family,cardStale=false,resting=false}:{snapshot?:BusSnapshot;card?:{balance?:number;cardTail?:string;fetchedAt:number};family:string;cardStale?:boolean;resting?:boolean}){
 const s=snapshot,c=s?.choice,age=s?Date.now()-s.time:Infinity,live=!!s&&!s.stale&&age>=0&&age<=120000
 const routes:WidgetRoute[]=c?(s?.items.length?s.items.slice(0,family==='systemSmall'?1:family==='systemMedium'?2:3):[undefined]).map((a,i)=>({id:'fixed:'+i,name:c.line.name+(i?' · 后续车辆':''),direction:(c.direction===1?'上行':'下行')+(c.destination?' · 往'+c.destination:''),eta:estimateLabel(a,live),minutes:live&&!a?.atStation&&a?.minutes!==undefined&&a.minutes>0?a.minutes:undefined,detail:live?arrivalLabel(a):'位置待更新',progress:stationProgress(a,c.station.no,live),url:routeURL(c)})):[]
 const small=family==='systemSmall',footer=<HStack><Link url={Script.createRunURLScheme(Script.name,{page:'live',select:'1'})}><Text font={small?9:10}>线路</Text></Link><Spacer/><Link url={Script.createRunURLScheme(Script.name,{page:'ride'})}><RideAction small={small}/></Link><Spacer/><Button title="换向" {...directionAppearance(small)} disabled={!c} intent={BusFixedDirectionIntent(undefined)}/></HStack>
 return <WidgetCard station={c?.station.name||'选择候车站'} subtitle={c?'固定候车站 · '+(c.direction===1?'上行':'下行'):'在设置中选择线路与站点'} family={family} routes={routes} time={s?.time} card={card} footer={footer} resting={resting} empty="打开脚本选择候车站"/>
}
