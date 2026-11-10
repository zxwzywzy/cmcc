import { HStack, VStack, Spacer, Text, Image } from 'scripting'
import type { BusSnapshot } from './api'
import type { Arrival } from './model'
const ink={light:'#172B25',dark:'#E8F4EE'},muted={light:'#51665C',dark:'#B5C8BE'},green={light:'#096448',dark:'#6EE0AC'}
export function clock(n:number){return new Date(n).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}
export function arrivalLabel(a?:Arrival){return !a?'暂无车辆':a.atStation?'已到站':a.stops===0?'车辆在本站附近':'还剩 '+a.stops+' 站'}
export function BusView({snapshot,card,family,cardStale=false}:{snapshot?:BusSnapshot;card?:{balance?:number;cardTail?:string;fetchedAt:number};family:string;cardStale?:boolean}){
 const small=family==='systemSmall',large=family==='systemLarge'||family==='systemExtraLarge',a=snapshot?.items[0],c=snapshot?.choice
 const amount=card?.balance===undefined?'未返回余额':'¥'+card.balance.toFixed(2)
 return <VStack alignment="leading" spacing={small?6:10} padding={small?12:16} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'topLeading'}} foregroundStyle={ink}>
 <HStack spacing={5}><Image systemName="bus.fill" foregroundStyle={green} font={13}/><Text font={12} fontWeight="semibold">武胜公交</Text><Spacer minLength={0}/>{!small?<Text font={10} foregroundStyle={muted}>{snapshot?clock(snapshot.time):''}</Text>:null}</HStack>
 <Text font={small?15:19} fontWeight="bold" lineLimit={1}>{c?c.station.name:'选择你的候车站'}</Text>
 <Text font={11} foregroundStyle={muted} lineLimit={1}>{c?c.line.name+' · '+(c.direction===1?'上行':'下行'):'打开脚本选择线路与站点'}</Text>
 <Spacer minLength={0}/><Text font={small?20:27} fontWeight="bold" foregroundStyle={snapshot?.stale?muted:green} lineLimit={1} minimumScaleFactor={0.65}>{snapshot?.message||(c?arrivalLabel(a):'尚未设置')}</Text>
 {a?.minutes!==undefined&&!snapshot?.stale?<Text font={11} foregroundStyle={muted}>{'预计约 '+a.minutes+' 分钟 · 仅供参考'}</Text>:null}
 {large?snapshot?.items.slice(1).map((v,i)=><HStack key={i}><Text font={14}>{'后续车辆 '+(i+2)}</Text><Spacer/><Text font={14}>{arrivalLabel(v)}</Text></HStack>):null}
 <Spacer minLength={0}/><HStack spacing={4}><Text font={small?10:12} foregroundStyle={muted} lineLimit={1}>{card?(cardStale?'上次余额 ':'公交卡 ')+amount:'余额需导入账号'}</Text>{!small&&card?<Text font={10} foregroundStyle={muted}>{clock(card.fetchedAt)}</Text>:null}</HStack>
 <Text font={9} foregroundStyle={muted} lineLimit={1}>{snapshot?(small?clock(snapshot.time)+' · ':'')+(snapshot.stale?'缓存数据，请打开刷新':'系统定时刷新 · 打开可更新'):'参数留空 · 支持小中大尺寸'}</Text>
 </VStack>
}
