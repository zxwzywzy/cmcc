import { Button,HStack,VStack,Spacer,Text,Image,Link,Script } from 'scripting'
import { clock } from './view'
import { meters,destination,type NearbySnapshot } from './nearby'
import { servicePage,directionLabel } from './paging'
import { BusLocateIntent,BusPageIntent,BusDirectionIntent } from './app_intents'
const bg='#071423',white='#F2F7F8',muted='#9AAAB3',cyan='#39D4E0'
function firstVehicle(row:NearbySnapshot['services'][number],stale:boolean){
 if(stale)return '缓存数据'
 const a=row.items[0]
 if(!a)return '暂无实时'
 return a.atStation?'已到站':a.stops===0?'本站附近':'还剩'+a.stops+'站'
}
function vehicleDistance(row:NearbySnapshot['services'][number],stale:boolean){
 if(stale||!row.items.length)return '车辆距离未知'
 const target=row.choice.station.no,stops=row.items[0].stops
 const v=row.positions.find(p=>p.stationNo!==undefined&&!p.passed&&target-p.stationNo===stops)
 if(!v||v.distanceMeters===undefined)return '车辆距离未知'
 const d=v.distanceMeters<1000?Math.round(v.distanceMeters)+'米':(v.distanceMeters/1000).toFixed(1)+'公里'
 return (v.distanceKind==='stations'?'站距估算 ':'直线距本站 ')+d+(v.stationName?' · 近'+v.stationName:'')
}
export function NearbyView({snapshot,family,interactive=false,slot='',card,cardStale=false}:{snapshot?:NearbySnapshot;family:string;interactive?:boolean;slot?:string;card?:{balance?:number;fetchedAt:number};cardStale?:boolean}){
 const small=family==='systemSmall',large=family==='systemLarge'||family==='systemExtraLarge',s=snapshot,page=servicePage(s,family,slot)
 const launch=Script.createRunURLScheme(Script.name,{page:'ride'})
 return <VStack alignment="leading" spacing={small?5:large?10:6} padding={small?11:large?18:14} widgetBackground={bg} foregroundStyle={white} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'topLeading'}}>
 <HStack spacing={5}><Text font={small?11:large?17:14} fontWeight="semibold" lineLimit={1}>{'当前站台：'+(s?.stop?.name||'等待定位')}</Text><Spacer minLength={0}/><Image systemName="location" font={small?12:large?21:16} foregroundStyle={cyan}/></HStack>
 {!small?<Text font={large?11:10} foregroundStyle={muted} lineLimit={1}>{s?.stop?meters(s.stop.meters)+' · '+page.routeCount+' 路 · '+directionLabel(page.direction):'打开脚本允许精确定位'}</Text>:null}
 <VStack alignment="leading" spacing={large?5:3} frame={{maxWidth:'infinity'}}>
 {page.rows.map((r,i)=><VStack key={r.choice.line.id+':'+r.choice.direction+':'+i} alignment="leading" spacing={large?5:2} frame={{maxWidth:'infinity'}}>
  <HStack spacing={small?3:large?9:6}><Text font={small?17:large?23:18} fontWeight="bold" foregroundStyle={i%2===0?white:cyan} lineLimit={1} minScaleFactor={0.7}>{r.choice.line.name+(small?(r.choice.direction===1?' ↑':' ↓'):'')}</Text><Text font={small?10:large?14:12} foregroundStyle={s?.stale?muted:cyan} lineLimit={1}>{firstVehicle(r,!!s?.stale)}</Text><Spacer minLength={0}/>{!small&&r.items[0]?.minutes!==undefined&&!s?.stale?<Text font={large?11:10} foregroundStyle={muted}>{'约'+r.items[0].minutes+'分钟'}</Text>:null}</HStack>
  {!small?<Text font={large?12:10} foregroundStyle={muted} lineLimit={1}>{destination(r.choice)}</Text>:null}
  <Text font={small?9:large?12:10} foregroundStyle={muted} lineLimit={1}>{vehicleDistance(r,!!s?.stale)}</Text>
 </VStack>)}
 {s?.stop&&!page.rows.length?<Text font={small?11:large?16:13} foregroundStyle={muted}>本站暂无{directionLabel(page.direction)}线路，点击换向</Text>:null}
 {!s?.stop?<Text font={11} foregroundStyle={muted}>点击刷新定位查找公交</Text>:null}
 </VStack>
 <Spacer minLength={0}/>
 {s?.message?<Text font={9} foregroundStyle={muted} lineLimit={1}>{s.message}</Text>:null}
 {!small?<Text font={10} foregroundStyle={muted} lineLimit={1}>{card?.balance!==undefined?(cardStale?'上次余额 ':'公交卡余额 ')+'¥'+card.balance.toFixed(2)+' · '+clock(card.fetchedAt):card?'余额未返回':'余额需导入账号'}</Text>:null}
 <HStack spacing={5}><Text font={small?9:large?11:10} foregroundStyle={muted} lineLimit={1}>{s?(s.stale?'缓存 · ':s.locationStale?'旧定位 · ':'更新 · ')+clock(s.time):'尚未定位'}</Text><Spacer minLength={0}/>{interactive&&page.count>1&&s?.stop?<Button title={(page.index+1)+'/'+page.count+' 下页'} buttonStyle="plain" font={small?9:large?12:11} intent={BusPageIntent({stopId:s.stop.id,family,slot,step:1})}/>:null}{!small&&interactive?<Link url={launch}><Text font={11} foregroundStyle={cyan}>乘车码</Text></Link>:null}</HStack>
 {interactive?<HStack spacing={8}><Button title={small?'刷新':'刷新定位'} buttonStyle="plain" font={small?10:12} intent={BusLocateIntent(undefined)}/><Spacer minLength={0}/><Button title={'换向 · '+directionLabel(page.direction)} buttonStyle="plain" font={small?10:12} disabled={!s?.stop} intent={BusDirectionIntent({stopId:s?.stop?.id||'',family,slot})}/></HStack>:null}
 </VStack>
}
