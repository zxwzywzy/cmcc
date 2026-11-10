import { Button, HStack, VStack, Spacer, Text, Widget, RoundedRectangle } from 'scripting'
import { loadAll, loadProvider, providerNames, value, flowValue, timeValue, preferences, getCarrierStyle, carrierStyles, type CarrierStyle, type Provider, type CarrierState } from './hub'
import { parseParam, resolveStyle, renderStyle, styleById } from './mobile/styles/index'
import { getLook, type Family } from './mobile/settings'
import { loadSlots } from './mobile/slots'
import { CarrierLayout } from './carrier-layout'
import type { CarrierFamily } from './carrier-design'
import { CarrierContent } from './carrier-content'
import { readPage, readCarrier, CarrierSetIntent } from './app_intents'
const aliases:Record<string,Provider>={'移动':'cmcc','联通':'unicom','电信':'telecom','广电':'broadnet',cmcc:'cmcc',unicom:'unicom',telecom:'telecom',broadnet:'broadnet'}
function Tile({state,compact=false,skin}:{state:CarrierState;compact?:boolean;skin?:CarrierStyle}){
 return <CarrierContent state={state} compact={compact} skin={skin||getCarrierStyle(state.provider)}/>
}
async function main(){
 const param=String(Widget.parameter||'').trim(),tokens=param.split(/\s+/),family=Widget.family as Family
 // Preserve empty/default, original style names, style IDs and account-tail parameters.
 // Empty medium/large widgets show the carrier overview; explicit legacy styles still win.
 const autoOverview=!param&&family.startsWith('system')
 if(!autoOverview&&((!aliases[tokens[0]]&&!['总览','合集','overview'].includes(param))||aliases[tokens[0]]==='cmcc')){
  const legacyParam=aliases[tokens[0]]==='cmcc'?tokens.slice(1).join(' '):param
  const {style:name,accounts}=parseParam(legacyParam);const style=resolveStyle(name,family,accounts.length)
  const switchable=style.id==='W'&&family==='systemMedium'
  const remembered=readCarrier()
  const carrier=switchable&&remembered&&remembered!=='cmcc'?await loadProvider(remembered as Provider):undefined
  const carrierStates=carrier&&['双号对照','双号全景'].includes(getCarrierStyle(carrier.provider,family as CarrierFamily))?await loadAll():[]
  Widget.present(renderStyle(style,family,{inApp:false,slots:await loadSlots(style,accounts),look:getLook(),page:readPage(),carrier,carrierStates,carrierSwitch:switchable}),{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)});return
 }
 const selected=aliases[tokens[0]],desktopFamily=(family.startsWith('system')?family:'systemSmall') as CarrierFamily
 const explicit=tokens.slice(1).join(' ')
 const chosen=selected&&(carrierStyles.includes(explicit as CarrierStyle)?explicit as CarrierStyle:getCarrierStyle(selected,desktopFamily))
 const compare=chosen==='双号对照'||chosen==='双号全景'||chosen==='四家总览'
 const states=selected&&!compare?[await loadProvider(selected)]:await loadAll()
 const loaded=states.filter(s=>s.metrics),ordered=selected?states:[...loaded,...states.filter(s=>!s.metrics)]
 if(family==='accessoryCircular'||family==='accessoryInline'||family==='accessoryRectangular'){
  const s=ordered[0];Widget.present(<VStack><Text font={11}>{providerNames[s.provider]}</Text><Text>{flowValue(s.metrics?.flowMB)}</Text></VStack>,{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)});return
 }
 const active=selected?states.find(s=>s.provider===selected)!:states.find(s=>s.provider===readCarrier())||loaded[0]||states[0]
 const skin=chosen||getCarrierStyle(active.provider,desktopFamily)
 if(family==='systemLarge'&&!selected&&['总览','合集','overview'].includes(param)){
  Widget.present(<CarrierLayout state={active} family="systemLarge" skin="四家总览" states={states}/>,{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)});return
 }
 // Keep the original detailed CMCC panorama when its own data/model is available.
 if(active.provider==='cmcc'&&skin==='全景'&&family==='systemMedium'){
  const style=styleById('W')!
  Widget.present(renderStyle(style,family,{inApp:false,slots:await loadSlots(style,[]),look:getLook(),page:readPage(),carrier:active,carrierSwitch:true}),{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)});return
 }
 Widget.present(<CarrierLayout state={active} family={desktopFamily} skin={skin} states={states}/>,{policy:'after',date:new Date(Date.now()+preferences().refresh*60000)})
}
main()
