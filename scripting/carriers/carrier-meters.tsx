import { HStack,VStack,Text } from 'scripting'
import { Bar,type Ctx } from './mobile/ui'
import { flowValue } from './hub'
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
