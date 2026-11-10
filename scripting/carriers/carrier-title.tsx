import { Button, HStack, Image, Text } from 'scripting'
import { providerNames, importedProviders, providerIds } from './hub'
import { CarrierNextIntent } from './app_intents'
import type { Ctx } from './mobile/ui'
/** The original top-left carrier name is the only switch target. */
export function CarrierTitle({ctx}:{ctx:Ctx}){
 const provider=ctx.carrier?.provider||'cmcc'
 const body=<HStack spacing={5} frame={{minHeight:44}}>
  {provider==='cmcc'?<Image imageUrl="https://raw.githubusercontent.com/MaYIHEI/pin/refs/heads/main/app/cmcc.png" resizable frame={{width:16,height:16}}/>:<Image systemName="antenna.radiowaves.left.and.right" font={14} foregroundStyle={ctx.th.t1}/>}
  <Text font={12} fontWeight="semibold" foregroundStyle={ctx.th.t1} lineLimit={1}>{providerNames[provider]}</Text>
  <Image systemName="arrow.triangle.2.circlepath" font={9} foregroundStyle={ctx.th.t3}/>
 </HStack>
 if(ctx.inApp)return <Button action={ctx.onCarrierChange||(()=>{})} buttonStyle="plain">{body}</Button>
 const available=importedProviders()
 return <Button intent={CarrierNextIntent({current:provider,available:available.length>1?available:providerIds})} buttonStyle="plain">{body}</Button>
}
