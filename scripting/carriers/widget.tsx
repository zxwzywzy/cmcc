import { Button, HStack, VStack, Spacer, Text, Widget, RoundedRectangle } from 'scripting'
import { loadAll, loadProvider, providerNames, value, flowValue, timeValue, preferences, getCarrierStyle, carrierStyles, type CarrierStyle, type Provider, type CarrierState } from './hub'
import { parseParam, resolveStyle, renderStyle } from './mobile/styles/index'
import { getLook, type Family } from './mobile/settings'
import { loadSlots } from './mobile/slots'
import { CarrierContent } from './carrier-content'
import { readPage, readCarrier, CarrierSetIntent } from './app_intents'
const aliases:Record<string,Provider>={'移动':'cmcc','联通':'unicom','电信':'telecom','广电':'broadnet',cmcc:'cmcc',unicom:'unicom',telecom:'telecom',broadnet:'broadnet'}
function Tile({state,compact=false,skin}:{state:CarrierState;compact?:boolean;skin?:CarrierStyle}){
 return <CarrierContent state={state} compact={compact} skin={skin||getCarrierStyle(state.provider)}/>
}
/** Medium overview: 44pt carrier tabs and one readable detail panel. */
function MediumOverview({states,state}:{states:CarrierState[];state:CarrierState}){
 const m=state.metrics
 return <VStack spacing={4} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
  <HStack spacing={4}>
   {states.map(s=><Button intent={CarrierSetIntent({provider:s.provider})} buttonStyle="plain" frame={{maxWidth:'infinity'}}>
    <Text font={12} fontWeight={s.provider===state.provider?'semibold':'regular'} foregroundStyle={s.provider===state.provider?'systemBackground':'label'} lineLimit={1} frame={{maxWidth:'infinity',minHeight:44}} background={<RoundedRectangle cornerRadius={10} fill={s.provider===state.provider?'label':'secondarySystemGroupedBackground'}/>}>
     {providerNames[s.provider].replace(/^中国/,'')}
    </Text>
   </Button>)}
  </HStack>
  <CarrierContent state={state} skin={getCarrierStyle(state.provider)} horizontal/>
 </VStack>
}

async function main(){
 const param=String(Widget.parameter||'').trim(),tokens=param.split(/\s+/),family=Widget.family as Family
 // Preserve empty/default, original style names, style IDs and account-tail parameters.
 // Multi-carrier overview is opt-in with 总览 / 合集 / overview.
 if((!aliases[tokens[0]]&&!['总览','合集','overview'].includes(param))||aliases[tokens[0]]==='cmcc'){
  const legacyParam=aliases[tokens[0]]==='cmcc'?tokens.slice(1).join(' '):param
  const {style:name,accounts}=parseParam(legacyParam);const style=resolveStyle(name,family,accounts.length)
  Widget.present(renderStyle(style,family,{inApp:false,slots:await loadSlots(style,accounts),look:getLook(),page:readPage()}),{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)});return
 }
 const selected=aliases[tokens[0]],states=selected?[await loadProvider(selected)]:await loadAll()
 const loaded=states.filter(s=>s.metrics),ordered=selected?states:[...loaded,...states.filter(s=>!s.metrics)]
 if(family==='accessoryCircular'||family==='accessoryInline'||family==='accessoryRectangular'){
  const s=ordered[0];Widget.present(<VStack><Text font={11}>{providerNames[s.provider]}</Text><Text>{flowValue(s.metrics?.flowMB)}</Text></VStack>,{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)});return
 }
 let view
 if(family==='systemLarge'&&!selected)view=<VStack spacing={8}><HStack spacing={8}><Tile state={ordered[0]} compact/><Tile state={ordered[1]} compact/></HStack><HStack spacing={8}><Tile state={ordered[2]} compact/><Tile state={ordered[3]} compact/></HStack></VStack>
 else if(family==='systemMedium'&&!selected){
  const active=states.find(s=>s.provider===readCarrier())||loaded[0]||states[0]
  view=<MediumOverview states={states} state={active}/>
 }
 else {
  const explicit=tokens.slice(1).join(" ")
  const skin=carrierStyles.includes(explicit as CarrierStyle)?explicit as CarrierStyle:undefined
  view=<Tile state={ordered[0]} skin={skin}/>
 }
 Widget.present(<VStack padding={8} background="systemGroupedBackground">{view}</VStack>,{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)})
}
main()
