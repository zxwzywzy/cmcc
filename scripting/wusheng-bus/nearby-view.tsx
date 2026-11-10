import { Button,HStack,VStack,Spacer,Text,Image,Link,Script } from 'scripting'
import { arrivalLabel,clock } from './view'
import { meters,type NearbySnapshot } from './nearby'
import { BusRefreshIntent } from './app_intents'
const green={light:'#096448',dark:'#6EE0AC'},ink={light:'#172B25',dark:'#E8F4EE'},muted={light:'#51665C',dark:'#B5C8BE'}
export function NearbyView({snapshot,family,mapImage,interactive=false}:{snapshot?:NearbySnapshot;family:string;mapImage?:any;interactive?:boolean}){
 const small=family==='systemSmall',large=family==='systemLarge'||family==='systemExtraLarge',s=snapshot
 const medium=!small&&!large
 const rows=s?.services.slice(0,small?1:large?4:2)||[]
 const launch=Script.createRunURLScheme(Script.name,{page:'ride'})
 return <VStack alignment="leading" spacing={large?8:3} padding={large?10:6} foregroundStyle={ink} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'topLeading'}}>
 <HStack spacing={4}><Image systemName="location.fill" font={11} foregroundStyle={green}/><Text font={medium?15:11} fontWeight="semibold" lineLimit={1} minimumScaleFactor={0.75}>{medium?(s?.stop?.name||'定位查最近站台'):'附近公交'}</Text><Spacer minLength={0}/>{!small&&s?<Text font={10} foregroundStyle={muted}>{medium&&s.stop?meters(s.stop.meters):clock(s.time)}</Text>:null}</HStack>
 {!medium?<HStack spacing={4}><Text font={small?15:16} fontWeight="bold" lineLimit={1}>{s?.stop?.name||'定位查最近站台'}</Text>{!small&&s?.stop?<Text font={10} foregroundStyle={green} lineLimit={1}>{meters(s.stop.meters)}</Text>:null}</HStack>:null}
 <HStack spacing={10}>
 <VStack alignment="leading" spacing={3} frame={{maxWidth:'infinity'}}>
 {!medium?<Text font={small?10:9} foregroundStyle={green}>{s?.stop?(small?'距你 '+meters(s.stop.meters):'直线距离 · 车辆所在站见下方'):'打开脚本允许定位'}</Text>:null}
 {rows.map((r,i)=><VStack key={i} alignment="leading" spacing={2}><Text font={12} fontWeight="semibold" lineLimit={1}>{r.choice.line.name+' '+(r.choice.direction===1?'上行':'下行')+' · '+(s?.stale?'上次数据':arrivalLabel(r.items[0]))}</Text>{<Text font={small?9:10} foregroundStyle={muted} lineLimit={1}>{r.positions[0]?.stationName?'车辆近'+r.positions[0].stationName:r.positions[0]?.gps?'车辆已上报GPS':'暂未返回车辆位置'}</Text>}</VStack>)}
 </VStack>
 {!small&&mapImage?<Image image={mapImage} resizable frame={{width:100,height:60}}/>:null}
 </HStack>
 {large&&s?.otherStops.length?<Text font={11} foregroundStyle={muted} lineLimit={2}>{'其他站台：'+s.otherStops.map(t=>t.name+' '+meters(t.meters)).join(' · ')}</Text>:null}
 <Spacer minLength={0}/>
 {s?.message?<Text font={10} foregroundStyle={muted} lineLimit={2}>{s.message}</Text>:null}
 {!medium||!interactive?<Text font={9} foregroundStyle={muted} lineLimit={1}>{s?(s.stale?'缓存 · ':'')+(s.locationStale?'定位为缓存 · ':'')+'更新 '+clock(s.time)+' · 非连续追踪':'先打开脚本开启定位'}</Text>:null}
 {interactive?<HStack><Button title="刷新" buttonStyle="plain" intent={BusRefreshIntent()} font={small?11:12}/><Spacer minLength={0}/>{medium&&s?<Text font={9} foregroundStyle={muted}>{(s.stale?'缓存 ':s.locationStale?'旧定位 ':'')+clock(s.time)}</Text>:null}<Link url={launch}><Text font={small?11:12}>乘车码</Text></Link></HStack>:null}
 </VStack>
}
