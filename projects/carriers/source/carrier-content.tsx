import { HStack, VStack, Spacer, Text, RoundedRectangle } from 'scripting'
import { providerNames, value, flowValue, timeValue, type CarrierState, type CarrierStyle } from './hub'
/** Remaining-only layouts: no fabricated totals, percentages, history or card numbers. */
export function CarrierContent({state,skin='全景',horizontal=false,compact=false}:{state:CarrierState;skin?:CarrierStyle;horizontal?:boolean;compact?:boolean}){
 const m=state.metrics,brand=providerNames[state.provider],stamp=timeValue(m?.fetchedAt)
 if(!m)return <VStack alignment="leading" spacing={5} padding={10} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'leading'}}>
  <Text font={14} fontWeight="semibold">{brand}尚未导入</Text><Text font={11} foregroundStyle="secondaryLabel">请在脚本中从 BoxJS 导入。</Text>
 </VStack>
 const flow=flowValue(m.flowMB),voice=value(m.voice,'分钟'),balance=value(m.balance,'元')
 if(skin==='账单卡')return <VStack alignment="leading" spacing={3} padding={8} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'leading'}} background={<RoundedRectangle cornerRadius={12} fill="label"/>}>
  <HStack><Text font={11} foregroundStyle="systemBackground">{brand}</Text><Spacer/><Text font={11} foregroundStyle="systemBackground">{state.stale?'缓存':'账户余额'}</Text></HStack>
  <Text font={compact?24:28} fontWeight="semibold" foregroundStyle="systemBackground" monospacedDigit lineLimit={1} minScaleFactor={0.7}>{balance}</Text>
  {horizontal?<Text font={11} foregroundStyle="systemBackground" lineLimit={1}>流量 {flow} · 语音 {voice}</Text>:<VStack alignment="leading" spacing={2}><Text font={11} foregroundStyle="systemBackground">流量 {flow}</Text><Text font={11} foregroundStyle="systemBackground">语音 {voice}</Text></VStack>}
  <Spacer minLength={0}/><Text font={11} foregroundStyle="systemBackground" lineLimit={1}>{stamp}</Text>
 </VStack>
 if(skin==='大字余额')return <VStack spacing={3} padding={6} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
  <Text font={11} foregroundStyle="secondaryLabel">{brand} · 余额{state.stale?' · 缓存':''}</Text>
  <Text font={compact?28:34} fontWeight="semibold" monospacedDigit lineLimit={1} minScaleFactor={0.6}>{balance}</Text>
  <Text font={11} foregroundStyle="secondaryLabel" lineLimit={1}>流量 {flow} · 语音 {voice}</Text>
  <Text font={11} foregroundStyle="secondaryLabel" lineLimit={1}>{stamp}</Text>
 </VStack>
 if(horizontal)return <HStack spacing={14} padding={6} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
  <VStack alignment="leading" spacing={3} frame={{maxWidth:'infinity',alignment:'leading'}}>
   <Text font={11} foregroundStyle="secondaryLabel">{brand} · 余额{state.stale?' · 缓存':''}</Text>
   <Text font={26} fontWeight="semibold" monospacedDigit lineLimit={1} minScaleFactor={0.7}>{balance}</Text>
   <Text font={11} foregroundStyle="secondaryLabel" lineLimit={1}>{stamp}</Text>
  </VStack>
  <VStack alignment="leading" spacing={7} frame={{maxWidth:'infinity',alignment:'leading'}}>
   <HStack><Text font={11} foregroundStyle="secondaryLabel">{state.provider==='telecom'?'通用流量':'剩余流量'}</Text><Spacer minLength={3}/><Text font={13} monospacedDigit lineLimit={1}>{flow}</Text></HStack>
   <HStack><Text font={11} foregroundStyle="secondaryLabel">剩余语音</Text><Spacer minLength={3}/><Text font={13} monospacedDigit lineLimit={1}>{voice}</Text></HStack>
  </VStack>
 </HStack>
 return <VStack alignment="leading" spacing={compact?3:6} padding={10} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'leading'}} background={<RoundedRectangle cornerRadius={12} fill="secondarySystemGroupedBackground"/>}>
  <Text font={12} fontWeight="semibold" lineLimit={1}>{brand}{state.stale?' · 缓存':''}</Text>
  <Text font={compact?20:26} fontWeight="semibold" monospacedDigit lineLimit={1} minScaleFactor={0.7}>{balance}</Text>
  <HStack><Text font={11}>流量</Text><Spacer/><Text font={11} monospacedDigit>{flow}</Text></HStack>
  <HStack><Text font={11}>语音</Text><Spacer/><Text font={11} monospacedDigit>{voice}</Text></HStack>
  <Spacer minLength={0}/><Text font={11} foregroundStyle="secondaryLabel" lineLimit={1}>{stamp}</Text>
 </VStack>
}
