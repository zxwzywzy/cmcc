import { HStack, VStack, Spacer, Text, Widget, RoundedRectangle } from 'scripting'
import { loadAll, loadProvider, providerNames, value, flowValue, timeValue, preferences, type Provider, type CarrierState } from './hub'
import { parseParam, resolveStyle, renderStyle } from './mobile/styles/index'
import { getLook, type Family } from './mobile/settings'
import { loadSlots } from './mobile/slots'
import { readPage } from './app_intents'
const aliases:Record<string,Provider>={'移动':'cmcc','联通':'unicom','电信':'telecom','广电':'broadnet',cmcc:'cmcc',unicom:'unicom',telecom:'telecom',broadnet:'broadnet'}
function Tile({state,compact=false}:{state:CarrierState;compact?:boolean}){
 const m=state.metrics
 return <VStack alignment="leading" spacing={compact?3:8} padding={10} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'topLeading'}} background={<RoundedRectangle cornerRadius={12} fill="secondarySystemGroupedBackground"/>}>
  <Text font={12} fontWeight="semibold" lineLimit={1}>{providerNames[state.provider]}{state.stale?' · 缓存':''}</Text>
  {m?<>
   <Text font={compact?20:24} fontWeight="semibold" monospacedDigit lineLimit={1} minScaleFactor={0.6}>{value(m.balance,'元')}</Text>
   <HStack><Text font={11}>流量</Text><Spacer/><Text font={11} monospacedDigit>{flowValue(m.flowMB)}</Text></HStack>
   <HStack><Text font={11}>语音</Text><Spacer/><Text font={11} monospacedDigit>{value(m.voice,'分钟')}</Text></HStack>
   <Spacer minLength={0}/><Text font={11} foregroundStyle="secondaryLabel" lineLimit={1}>{timeValue(m.fetchedAt)}</Text>
  </>:<Text font={12} foregroundStyle="secondaryLabel">尚未导入，请打开脚本</Text>}
 </VStack>
}
async function main(){
 const param=String(Widget.parameter||'').trim(),tokens=param.split(/\s+/),family=Widget.family as Family
 // Keep original CMCC styles and parameter semantics when explicitly requested.
 if(tokens[0]==='移动'&&tokens.length>1){
  const {style:name,accounts}=parseParam(tokens.slice(1).join(' '));const style=resolveStyle(name,family,accounts.length)
  Widget.present(renderStyle(style,family,{inApp:false,slots:await loadSlots(style,accounts),look:getLook(),page:readPage()}),{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)});return
 }
 const selected=aliases[tokens[0]],states=selected?[await loadProvider(selected)]:await loadAll()
 const loaded=states.filter(s=>s.metrics),ordered=selected?states:[...loaded,...states.filter(s=>!s.metrics)]
 if(family==='accessoryCircular'||family==='accessoryInline'||family==='accessoryRectangular'){
  const s=ordered[0];Widget.present(<VStack><Text font={11}>{providerNames[s.provider]}</Text><Text>{flowValue(s.metrics?.flowMB)}</Text></VStack>,{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)});return
 }
 let view
 if(family==='systemLarge'&&!selected)view=<VStack spacing={8}><HStack spacing={8}><Tile state={ordered[0]} compact/><Tile state={ordered[1]} compact/></HStack><HStack spacing={8}><Tile state={ordered[2]} compact/><Tile state={ordered[3]} compact/></HStack></VStack>
 else if(family==='systemMedium'&&!selected)view=<HStack spacing={8}><Tile state={ordered[0]}/><Tile state={ordered[1]}/></HStack>
 else view=<Tile state={ordered[0]}/>
 Widget.present(<VStack padding={8} background="systemGroupedBackground">{view}</VStack>,{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)})
}
main()
