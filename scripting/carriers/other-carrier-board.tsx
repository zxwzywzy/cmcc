import { HStack, VStack, Text, Spacer } from 'scripting'
import { Root, Num, type Ctx } from './mobile/ui'
import { CarrierTitle } from './carrier-title'
import { CarrierContent } from './carrier-content'
import { getCarrierStyle, flowValue, value, timeValue } from './hub'
/** Original panorama composition, using only known remaining values. */
export function OtherCarrierBoard({ctx}:{ctx:Ctx}){
 const state=ctx.carrier,m=state?.metrics
 const skin=state?getCarrierStyle(state.provider):'全景'
 return <Root ctx={ctx} spacing={6}>
  <HStack spacing={6}><CarrierTitle ctx={ctx}/><Spacer minLength={4}/><Text font={11} foregroundStyle={ctx.th.t3} lineLimit={1}>{m?timeValue(m.fetchedAt):''}</Text></HStack>
  {m&&skin!=='全景'?<CarrierContent state={state!} skin={skin} horizontal/>:m?<HStack spacing={14} frame={{maxHeight:'infinity'}}>
   <VStack alignment="leading" spacing={4} frame={{width:104,maxHeight:'infinity',alignment:'topLeading'}}>
    <Num value={m.balance===undefined?'—':m.balance.toFixed(2)} size={27} color={ctx.th.t1}/>
    <Text font={11} foregroundStyle={ctx.th.t3}>话费余额 · 元</Text>
    <Spacer minLength={0}/><Text font={11} foregroundStyle={ctx.th.t3}>{state?.stale?'上次数据':'查询数据'}</Text>
   </VStack>
   <VStack spacing={8} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
    <HStack><Text font={12} foregroundStyle={ctx.th.t2}>{state?.provider==='telecom'?'通用':'流量'}</Text><Spacer/><Text font={20} fontWeight="semibold" foregroundStyle={ctx.th.t1} monospacedDigit lineLimit={1}>{flowValue(m.flowMB)}</Text></HStack>
    <HStack><Text font={12} foregroundStyle={ctx.th.t2}>语音</Text><Spacer/><Text font={20} fontWeight="semibold" foregroundStyle={ctx.th.t1} monospacedDigit lineLimit={1}>{value(m.voice,'分钟')}</Text></HStack>
   </VStack>
  </HStack>:<VStack alignment="leading" spacing={5} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
   <Text font={14} foregroundStyle={ctx.th.t1}>{state?.message||'尚未导入该运营商数据'}</Text>
   <Text font={11} foregroundStyle={ctx.th.t3}>点左上角运营商名称继续切换。</Text>
  </VStack>}
 </Root>
}
