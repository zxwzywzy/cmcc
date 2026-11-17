import type { Ctx } from './mobile/ui'
import { CarrierLayout } from './carrier-layout'
export { RemainingMeter } from './carrier-meters'
export function OtherCarrierBoard({ctx}:{ctx:Ctx}){
 const state=ctx.carrier||{provider:'cmcc' as const,message:'尚未导入数据'}
 return <CarrierLayout state={state} family={ctx.family as any} inApp={ctx.inApp} onChange={ctx.onCarrierChange} states={ctx.carrierStates||[]}/>
}
