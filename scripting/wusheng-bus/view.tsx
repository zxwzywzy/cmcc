import { HStack, VStack, Spacer, Text, Image } from 'scripting'
import type { BusSnapshot } from './api'
import type { Arrival } from './model'
import { appearance,palette } from './appearance'
export function clock(n:number){return new Date(n).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}
export function arrivalLabel(a?:Arrival){return !a?'暂无车辆':a.atStation?'已到站':a.stops===0?'车辆在本站附近':'还剩 '+a.stops+' 站'}
export function BusView({snapshot,card,family,cardStale=false}:{snapshot?:BusSnapshot;card?:{balance?:number;cardTail?:string;fetchedAt:number};family:string;cardStale?:boolean}){
 const small=family==='systemSmall',large=family==='systemLarge'||family==='systemExtraLarge',a=snapshot?.items[0],c=snapshot?.choice
 const amount=card?.balance===undefined?'未返回余额':'¥'+card.balance.toFixed(2)
 const look=appearance(),{bg,ink,muted,accent:green}=palette(look.theme)
 return <VStack alignment="leading" spacing={look.compact?3:small?5:large?10:7} padding={look.compact?10:small?10:large?16:14} widgetBackground={bg} background={bg} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'topLeading'}} foregroundStyle={ink}>
 <HStack spacing={5}><Image systemName="bus.fill" foregroundStyle={green} font={12}/><Text font={small?11:12} fontWeight="semibold">武胜公交 · 固定站</Text><Spacer minLength={0}/>{!small&&snapshot?<Text font={10} foregroundStyle={muted}>{clock(snapshot.time)}</Text>:null}</HStack>
 <Text font={small?17:21} fontWeight="bold" lineLimit={1} minScaleFactor={0.7}>{c?c.station.name:'选择候车站'}</Text>
 <Text font={small?10:12} foregroundStyle={muted} lineLimit={1}>{c?c.line.name+' · '+(c.direction===1?'上行':'下行'):'打开脚本选择线路与站点'}</Text>
 <Spacer minLength={0}/>
 <Text font={small?21:large?32:29} fontWeight="bold" foregroundStyle={snapshot?.stale?muted:green} lineLimit={1} minScaleFactor={0.65}>{snapshot?.message||(c?arrivalLabel(a):'尚未设置')}</Text>
 {a?.minutes!==undefined&&!snapshot?.stale?<Text font={small?10:12} foregroundStyle={muted}>{'预计约 '+a.minutes+' 分钟 · 仅供参考'}</Text>:null}
 {large?snapshot?.items.slice(1).map((v,i)=><HStack key={i}><Text font={13}>{'后续车辆 '+(i+2)}</Text><Spacer minLength={0}/><Text font={13}>{arrivalLabel(v)}</Text></HStack>):null}
 <Spacer minLength={0}/>
 {look.showBalance?<HStack spacing={4}><Text font={small?10:12} foregroundStyle={muted} lineLimit={1}>{card?(cardStale?'上次余额 · ':'公交卡 · ')+amount:'余额需登录'}</Text><Spacer minLength={0}/>{!small&&card?<Text font={10} foregroundStyle={muted}>{clock(card.fetchedAt)}</Text>:null}</HStack>:null}
 <Text font={9} foregroundStyle={muted} lineLimit={1}>{snapshot?(snapshot.stale?'缓存数据 · ':'更新于 ')+clock(snapshot.time):'打开脚本设置站点'}</Text>
 </VStack>
}
