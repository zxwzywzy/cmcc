import { HStack, VStack, Text, Spacer } from 'scripting'
import { Root, Num, Bar, RED, type Ctx } from './mobile/ui'
import { CarrierTitle } from './carrier-title'
import { CarrierContent } from './carrier-content'
import { getCarrierStyle, flowValue } from './hub'
/** Use the original panorama meter columns, only with actual returned quantities. */
export function RemainingMeter({ctx,label,remain,total,used,voice=false}:{ctx:Ctx;label:string;remain?:number;total?:number;used?:number;voice?:boolean}){
 const valid=typeof remain==='number'&&Number.isFinite(remain)&&typeof total==='number'&&Number.isFinite(total)&&total>0
 const percent=valid?Math.max(0,Math.min(100,remain!/total!*100)):undefined
 const format=(n:number|undefined)=>voice?(n===undefined?'—':`${Math.round(n)}分`):flowValue(n).replace(' GB','G').replace(' MB','M')
 return <HStack spacing={8} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
  <Text font={12} fontWeight="medium" foregroundStyle={ctx.th.t1} frame={{width:28,alignment:'leading'}}>{label}</Text>
  <VStack alignment="leading" spacing={3} frame={{maxWidth:'infinity'}}>
   <Text font={11} foregroundStyle={ctx.th.t2} monospacedDigit lineLimit={1}>{`${format(remain)} / ${format(total)}`}</Text>
   <Bar ctx={ctx} percent={percent??0} height={5}/>
   <Text font={11} foregroundStyle={ctx.th.t3} lineLimit={1}>{used!==undefined?`已用 ${format(used)}`:'总量未返回'}</Text>
  </VStack>
  <Text font={14} fontWeight="semibold" fontDesign="rounded" monospacedDigit foregroundStyle={ctx.th.t1} lineLimit={1} minScaleFactor={0.85} frame={{width:40,alignment:'trailing'}}>{percent===undefined?'—':`${Math.round(percent)}%`}</Text>
 </HStack>
}
export function OtherCarrierBoard({ctx}:{ctx:Ctx}){
 const state=ctx.carrier,m=state?.metrics,skin=state?getCarrierStyle(state.provider):'全景'
 const time=m?new Date(m.fetchedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):''
 return <Root ctx={ctx} spacing={8}>
  <HStack spacing={6}><CarrierTitle ctx={ctx}/><Spacer minLength={4}/><Text font={11} foregroundStyle={ctx.th.t3} lineLimit={1}>{state?.stale?'⚠ ':''}{time}</Text></HStack>
  {m&&skin!=='全景'?<CarrierContent state={state!} skin={skin} horizontal/>:m?<HStack spacing={14} frame={{maxHeight:'infinity'}}>
   <VStack alignment="leading" spacing={2} frame={{width:104,maxHeight:'infinity',alignment:'topLeading'}}>
    <Num value={m.balance===undefined?'—':m.balance.toFixed(2)} size={27} color={m.balance!==undefined&&m.balance<10?RED as any:ctx.th.t1}/>
    <Text font={11} foregroundStyle={ctx.th.t3}>话费余额 · 元</Text>
    <Spacer minLength={0}/>{state?.stale?<Text font={11} foregroundStyle={ctx.th.t3}>上次数据</Text>:null}
   </VStack>
   <VStack spacing={0} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
    <RemainingMeter ctx={ctx} label={state?.provider==='broadnet'?'流量':'通用'} remain={m.flowMB} total={m.flowTotalMB} used={m.flowUsedMB}/>
    <RemainingMeter ctx={ctx} label="语音" remain={m.voice} total={m.voiceTotal} used={m.voiceUsed} voice/>
   </VStack>
  </HStack>:<VStack alignment="leading" spacing={5} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
   <Text font={14} foregroundStyle={ctx.th.t1}>{state?.message||'尚未导入该运营商数据'}</Text>
   <Text font={11} foregroundStyle={ctx.th.t3}>点左上角运营商名称继续切换。</Text>
  </VStack>}
 </Root>
}
