import { Button,HStack,Spacer,Text,Link,Script } from 'scripting'
import { meters,destination,type NearbySnapshot } from './nearby'
import { estimateLabel,stationProgress } from './model'
import { servicePage,directionLabel } from './paging'
import { BusLocateIntent,BusPageIntent,BusDirectionIntent } from './app_intents'
import { WidgetCard,type WidgetRoute } from './widget-ui'
export function NearbyView({snapshot,family,interactive=false,slot='',card,cardStale=false,resting=false}:{snapshot?:NearbySnapshot;family:string;interactive?:boolean;slot?:string;card?:{balance?:number;fetchedAt:number};cardStale?:boolean;resting?:boolean}){
 const s=snapshot,page=servicePage(s,family,slot),small=family==='systemSmall',age=s?Date.now()-s.time:Infinity
 const live=!!s&&!s.stale&&!s.locationStale&&age>=0&&age<=120000
 const routes:WidgetRoute[]=page.rows.map(r=>{
  const a=r.items[0],v=a?r.positions.find(p=>p.stationNo!==undefined&&!p.passed&&r.choice.station.no-p.stationNo===a.stops):undefined
  const measure=live&&a?(v?.distanceMeters!==undefined?(v.distanceKind==='stations'?'站距估算 ':'直线距本站 ')+(v.distanceMeters<1000?Math.round(v.distanceMeters)+'米':(v.distanceMeters/1000).toFixed(1)+'公里'):'距离待更新'):''
  const detail=live?[a?a.atStation?'已到站':a.stops===0?'本站附近':'还剩 '+a.stops+' 站':'暂无车辆',measure,v?.stationName?'近'+v.stationName:''].filter(Boolean).join(' · '):'位置待更新'
  return {id:r.choice.line.id+':'+r.choice.direction,name:r.choice.line.name,direction:destination(r.choice),eta:estimateLabel(a,live),minutes:live&&!a?.atStation&&a?.minutes!==undefined&&a.minutes>0?a.minutes:undefined,detail,progress:stationProgress(a,r.choice.station.no,live)}
 })
 const footer=interactive?<HStack spacing={small?3:6}><Button title={small?'刷新':'刷新定位'} buttonStyle="plain" font={small?9:11} intent={BusLocateIntent(undefined)}/><Spacer minLength={0}/><Link url={Script.createRunURLScheme(Script.name,{page:'ride'})}><Text font={small?9:11}>乘车码</Text></Link>{page.count>1&&s?.stop?<Button title={(page.index+1)+'/'+page.count+' 下页'} buttonStyle="plain" font={small?8:10} intent={BusPageIntent({stopId:s.stop.id,family,slot,step:1})}/>:null}<Spacer minLength={0}/><Button title="换向" buttonStyle="plain" font={small?9:11} disabled={!s?.stop} intent={BusDirectionIntent({stopId:s?.stop?.id||'',family,slot})}/></HStack>:null
 return <WidgetCard station={s?.stop?.name||'附近公交'} subtitle={s?.stop?meters(s.stop.meters)+' · '+page.routeCount+' 路 · '+directionLabel(page.direction):'点击刷新定位查询'} routes={routes} family={family} time={s?.time} card={card} footer={footer} resting={resting} empty={s?.stop?'本站暂无'+directionLabel(page.direction)+'线路，点击换向':'点击刷新定位查找公交'}/>
}
