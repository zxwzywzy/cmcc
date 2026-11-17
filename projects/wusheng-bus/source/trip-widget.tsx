import { BusBoardTripIntent } from './app_intents'
import { Button, Link, Script, Text, VStack, HStack, Spacer, Widget, Image, RoundedRectangle } from 'scripting'
import { readActiveTrip, type ActiveTrip } from './active-trip'
import { appearance, palette } from './appearance'
import { detailIsLive, loadRouteDetail, requestFor } from './transit'
import { sameChoice } from './model'
import { widgetArrival } from './widget-display'
import { widgetAwake, widgetRefreshDate, type WidgetRuntime } from './runtime'

export async function waitingETA(state:ActiveTrip,load=loadRouteDetail){
 const c=state.trip.legs[state.legIndex].choice
 try {
  const d=await load(requestFor(c))
  if(detailIsLive(d)&&d.line.id===c.line.id&&d.direction===c.direction&&d.stop?.id===c.station.id&&d.stop?.no===c.station.no)
   return widgetArrival(d.items[0],true,d.positions.length).eta
 }catch{/* An unavailable feed is not evidence that no buses are running. */}
 return undefined
}

export function presentTrip(settings:WidgetRuntime,nearby:boolean,queried?:ActiveTrip,eta?:string,remaining?:number){
 const state=settings.enabled?readActiveTrip():undefined
 if(!state)return false
 const leg=state.trip.legs[state.legIndex],transfer=state.legIndex+1<state.trip.legs.length
 const awake=widgetAwake(settings)
 const samePhase=queried&&queried.onBoard===state.onBoard&&queried.expires===state.expires&&
  queried.tripId===state.tripId&&(!!state.tripId||JSON.stringify(queried.trip)===JSON.stringify(state.trip))&&
  queried.vehicle?.vehicleId===state.vehicle?.vehicleId&&queried.vehicle?.plate===state.vehicle?.plate&&
  queried.destination===state.destination&&queried.legIndex===state.legIndex&&
  queried.trip.legs[queried.legIndex]?.to===leg.to&&queried.trip.legs[queried.legIndex]?.stops===leg.stops&&
  sameChoice(queried.trip.legs[queried.legIndex]?.choice,leg.choice)
 const currentETA=awake&&samePhase&&!state.onBoard?eta:undefined
 const left=awake&&samePhase&&state.onBoard&&remaining!==undefined&&Number.isSafeInteger(remaining)&&remaining>=0&&remaining<=leg.stops?remaining:undefined
 const near=left!==undefined&&left<=2
 const {bg,ink,muted,accent}=palette(appearance().theme)
 const small=Widget.family==='systemSmall',large=Widget.family==='systemLarge'||Widget.family==='systemExtraLarge'
 const status=state.onBoard?(left===undefined?'':left===0?'准备下车':`还剩 ${left} 站`):!awake?'暂停更新':currentETA||'到站待更新'
 const date=new Date(Math.min(state.expires,widgetRefreshDate(settings,nearby).getTime()))
 const rideURL=Script.createRunURLScheme(Script.name,{page:'ride'}),tripURL=Script.createRunURLScheme(Script.name,{page:'trip'})
 const face=<HStack spacing={8} frame={{maxWidth:'infinity',height:large?62:44}} foregroundStyle={bg} background={<RoundedRectangle cornerRadius={large?18:12} fill={accent}/>}><Spacer minLength={0}/><Image systemName={state.onBoard?'qrcode':'bus.fill'} font={large?22:16}/><Text font={large?21:15} fontWeight="bold" lineLimit={1} minScaleFactor={0.75}>{state.onBoard?(near?'下车 · 乘车码':'打开乘车码'):'我已上车'}</Text><Spacer minLength={0}/></HStack>
 const action=state.onBoard?<Link url={rideURL}>{face}</Link>:<Button buttonStyle="plain" intent={BusBoardTripIntent({expires:state.expires,legIndex:state.legIndex,tripId:state.tripId||''})}>{face}</Button>
 Widget.present(<VStack spacing={0} frame={{maxWidth:'infinity',maxHeight:'infinity'}} background={bg} widgetBackground={bg} foregroundStyle={ink} widgetURL={small&&state.onBoard?rideURL:tripURL}>
  <VStack alignment="leading" spacing={large?6:2} padding={large?16:9} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
   <HStack><Text font={large?24:16} fontWeight="bold" lineLimit={1}>{leg.line}</Text><Spacer minLength={0}/><Text font={large?14:11} foregroundStyle={muted}>{state.onBoard?'乘车中':'候车'}</Text></HStack>
   {!small?<Text font={large?16:11} foregroundStyle={muted} lineLimit={1}>{'去 '+state.destination}</Text>:null}
   <Spacer minLength={0}/><Text font={large?15:10} foregroundStyle={muted}>{state.onBoard?(transfer?'换乘站':'下车站'):'上车站'}</Text>
   <Text font={large?37:small?20:22} fontWeight="bold" lineLimit={1} minScaleFactor={0.65}>{state.onBoard?leg.to:leg.from}</Text>
   {status?<Text font={large?16:11} foregroundStyle={near?'orange':accent} lineLimit={1}>{status}</Text>:null}
   <Spacer minLength={0}/>{action}
  </VStack></VStack>,{policy:'after',date})
 return true
}
