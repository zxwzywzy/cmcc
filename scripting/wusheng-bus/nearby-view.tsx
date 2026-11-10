import { Button,HStack,VStack,Spacer,Text,Image,Link,Script } from 'scripting'
import { arrivalLabel,clock } from './view'
import { meters,destination,vehicleSummary,type NearbySnapshot } from './nearby'
import { servicePage,directionLabel } from './paging'
import { BusLocateIntent,BusPageIntent,BusDirectionIntent } from './app_intents'
const green={light:'#096448',dark:'#6EE0AC'},ink={light:'#172B25',dark:'#E8F4EE'},muted={light:'#51665C',dark:'#B5C8BE'}
export function NearbyView({snapshot,family,mapImage,interactive=false,slot=''}:{snapshot?:NearbySnapshot;family:string;mapImage?:any;interactive?:boolean;slot?:string}){
 const small=family==='systemSmall',large=family==='systemLarge'||family==='systemExtraLarge',s=snapshot,page=servicePage(s,family,slot)
 const launch=Script.createRunURLScheme(Script.name,{page:'ride'})
 return <VStack alignment="leading" spacing={large?7:3} padding={large?10:6} foregroundStyle={ink} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'topLeading'}}>
 <HStack spacing={4}><Image systemName="location.fill" font={11} foregroundStyle={green}/><Text font={small?14:16} fontWeight="bold" lineLimit={1} minimumScaleFactor={0.7}>{s?.stop?.name||'定位查最近站台'}</Text><Spacer minLength={0}/></HStack>
 <Text font={small?9:10} foregroundStyle={muted} lineLimit={small?2:1}>{s?.stop?'最近 · '+page.routeCount+'路公交 · '+meters(s.stop.meters)+' · '+directionLabel(page.direction):'打开脚本允许精确定位'}</Text>
 <HStack spacing={8}><VStack alignment="leading" spacing={large?7:3} frame={{maxWidth:'infinity'}}>
 {page.rows.map((r,i)=><VStack key={i} alignment="leading" spacing={1}><HStack><Text font={small?11:12} fontWeight="semibold" lineLimit={1}>{r.choice.line.name+' '+(r.choice.direction===1?'上行':'下行')+' · '+(large?(s?.stale?'查询失败/缓存':arrivalLabel(r.items[0])):destination(r.choice).replace(/ · (上行|下行)$/,''))}</Text></HStack>{large?<Text font={10} foregroundStyle={green} lineLimit={1}>{destination(r.choice)}</Text>:null}<Text font={small?9:10} foregroundStyle={muted} lineLimit={small?2:1}>{vehicleSummary(r,!!s?.stale)}</Text></VStack>)}
 {s?.stop&&!page.rows.length?<Text font={11}>本站暂无该方向线路</Text>:null}
 </VStack>{large&&mapImage?<Image image={mapImage} resizable frame={{width:90,height:60}}/>:null}</HStack>
 <Spacer minLength={0}/>
 {s?.message?<Text font={9} foregroundStyle={muted} lineLimit={1}>{s.message}</Text>:null}
 <HStack spacing={4}><Text font={9} foregroundStyle={muted} lineLimit={1}>{s?(s.stale?'缓存 ':'')+(s.locationStale?'旧定位 ':'')+clock(s.time):'先开启定位'}</Text><Spacer minLength={0}/>{interactive&&page.count>1?<Button title={(page.index+1)+'/'+page.count+' 下页'} buttonStyle="plain" font={9} intent={BusPageIntent({stopId:s!.stop!.id,family,slot,step:1})}/>:null}{!small&&interactive?<Link url={launch}><Text font={10}>乘车码</Text></Link>:null}</HStack>
 {interactive?<HStack><Button title="刷新定位" buttonStyle="plain" font={small?10:12} intent={BusLocateIntent()}/><Spacer minLength={0}/><Button title="换向" buttonStyle="plain" font={small?10:12} disabled={!s?.stop} intent={BusDirectionIntent({stopId:s?.stop?.id||'',family,slot})}/></HStack>:null}
 </VStack>
}
