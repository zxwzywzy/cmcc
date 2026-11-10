import { HStack,VStack,Text,Spacer,Image,Rectangle,RoundedRectangle } from 'scripting'
import { Root,Num,Bar,makeTheme,type Ctx } from './mobile/ui'
import { getLook } from './mobile/settings'
import { CarrierTitle } from './carrier-title'
import { RemainingMeter } from './carrier-meters'
import { identities,ratio,usage,type SharedCarrierStyle,type CarrierFamily } from './carrier-design'
import { getCarrierStyle,getComparePartner,providerNames,providerIds,value,flowValue,type CarrierState } from './hub'
export function CarrierLayout({state,family='systemMedium',skin,inApp=false,onChange,states=[]}:{state:CarrierState;family?:CarrierFamily;skin?:SharedCarrierStyle;inApp?:boolean;onChange?:()=>void;states?:CarrierState[]}){
 const ctx:Ctx={th:makeTheme(getLook()),size:family==='systemSmall'?'s':family==='systemLarge'?'l':'m',family,inApp,slots:[],page:0,carrier:state,carrierSwitch:true,onCarrierChange:onChange}
 return <LayoutBody ctx={ctx} state={state} skin={skin||getCarrierStyle(state.provider,family)} states={states}/>
}
function LayoutBody({ctx,state,skin,states}:{ctx:Ctx;state:CarrierState;skin:SharedCarrierStyle;states:CarrierState[]}){
 const m=state.metrics,small=ctx.size==='s',large=ctx.size==='l',brand=identities[state.provider],ink=(ctx.th.custom?ctx.th.t1:brand.ink) as any,wash=(ctx.th.custom?ctx.th.card:brand.wash) as any
 const history=usage(state.provider),flow=flowValue(m?.flowMB),voice=value(m?.voice,'分钟'),balance=m?.balance===undefined?'—':m.balance.toFixed(2)
 const stamp=m?new Date(m.fetchedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}):''
 const header=<HStack spacing={5}><CarrierTitle ctx={ctx}/><Spacer minLength={2}/>{small?null:<Text font={11} foregroundStyle={ctx.th.t3}>{state.stale?'⚠ ':''}{stamp}</Text>}</HStack>
 const text=(label:string,content:string,big=false)=><VStack alignment="leading" spacing={3} frame={{maxWidth:'infinity'}}><Text font={11} foregroundStyle={ctx.th.t2}>{label}</Text><Text font={big?28:16} fontWeight="semibold" monospacedDigit foregroundStyle={ctx.th.t1} lineLimit={1}>{content}</Text></VStack>
 const line=(label:string,content:string)=><HStack><Text font={11} foregroundStyle={ctx.th.t2}>{label}</Text><Spacer minLength={3}/><Text font={small?12:14} fontWeight="medium" monospacedDigit foregroundStyle={ctx.th.t1} lineLimit={1}>{content}</Text></HStack>
 const compactQuota=(label:string,remaining:number|undefined,total:number|undefined,minutes=false)=>{
  const pct=ratio(remaining,total),formatted=minutes?value(remaining,'分'):flowValue(remaining)
  return <VStack spacing={2} alignment="leading" frame={{maxWidth:'infinity'}}>
   {line(label,formatted)}<Bar ctx={ctx} percent={pct??0} height={4}/>
  </VStack>
 }
 const meters=<VStack spacing={small?4:0} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
  {small?compactQuota('流量',m?.flowMB,m?.flowTotalMB):<RemainingMeter ctx={ctx} label={state.provider==='broadnet'?'流量':'通用'} remain={m?.flowMB} total={m?.flowTotalMB} used={m?.flowUsedMB}/>}
  {small?compactQuota('语音',m?.voice,m?.voiceTotal,true):<RemainingMeter ctx={ctx} label="语音" remain={m?.voice} total={m?.voiceTotal} used={m?.voiceUsed} voice/>}
 </VStack>
 const chart=(count=large?14:small?5:7,height=large?80:small?25:40)=>{
  const vals=history.daily(count),max=Math.max(1,...vals.filter((v):v is number=>v!==null)),has=vals.some(v=>v!==null)
  if(!has)return <VStack spacing={3} frame={{maxWidth:'infinity',minHeight:height}}><Text font={12} foregroundStyle={ctx.th.t2}>记录中</Text><Text font={11} foregroundStyle={ctx.th.t3}>累计历史后显示用量</Text></VStack>
  return <VStack alignment="leading" spacing={4}><HStack alignment="bottom" spacing={3} frame={{height}}>{vals.map(v=><VStack spacing={0} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'bottom'}}><RoundedRectangle cornerRadius={2} fill={v===null?ctx.th.track:ink} frame={{maxWidth:'infinity',height:v===null?2:Math.max(2,v/max*height)}}/></VStack>)}</HStack><Text font={11} foregroundStyle={ctx.th.t3}>{`近 ${count} 天 · 通用流量`}</Text></VStack>
 }
 // Medium cards have about 80pt below the 44pt switch target: use two columns.
 if(m&&!small&&!large&&['账单卡','大字余额','自适应','今日额度','倒计时','用量预测','用量月报'].includes(skin)){
  const quota=<VStack spacing={6} frame={{maxWidth:'infinity'}}>{compactQuota('流量',m.flowMB,m.flowTotalMB)}{compactQuota('语音',m.voice,m.voiceTotal,true)}</VStack>
  let detail:any
  if(skin==='账单卡')detail=<VStack alignment="leading" spacing={5} padding={8} frame={{maxWidth:'infinity',maxHeight:'infinity'}} background={<RoundedRectangle cornerRadius={12} fill={wash}/>}><HStack><Num value={`¥${balance}`} size={28} color={ctx.th.t1}/><Spacer/><Text font={11} foregroundStyle={ink}>账户余额</Text></HStack><HStack spacing={12}>{line('流量',flow)}{line('语音',voice)}</HStack></VStack>
  else if(skin==='大字余额')detail=<HStack spacing={16} frame={{maxHeight:'infinity'}}><VStack alignment="leading" spacing={3} frame={{maxWidth:'infinity'}}><Num value={balance} size={40} color={ctx.th.t1}/><Text font={11} foregroundStyle={ctx.th.t2}>话费余额 · 元</Text></VStack><VStack alignment="leading" spacing={5} frame={{maxWidth:'infinity'}}>{text('剩余流量',flow)}{text('剩余语音',voice)}</VStack></HStack>
  else if(skin==='自适应')detail=<HStack spacing={12} frame={{maxHeight:'infinity'}}><VStack alignment="leading" spacing={4} frame={{width:104}}><Num value={balance} size={30} color={ctx.th.t1}/><Text font={11} foregroundStyle={ctx.th.t2}>余额 · 元</Text></VStack><VStack spacing={0} padding={8} frame={{maxWidth:'infinity'}} background={<RoundedRectangle cornerRadius={12} fill={ctx.th.card}/>}>{quota}</VStack></HStack>
  else if(skin==='用量月报')detail=<HStack spacing={16} frame={{maxHeight:'infinity'}}><VStack alignment="leading" spacing={4} frame={{width:104}}><Num value={balance} size={27} color={ctx.th.t1}/><Text font={11} foregroundStyle={ctx.th.t2}>余额 · 元</Text></VStack><VStack frame={{maxWidth:'infinity'}}>{chart(7,40)}</VStack></HStack>
  else if(skin==='倒计时'){
   const now=new Date(),days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate()-now.getDate()+1
   detail=<HStack spacing={16} frame={{maxHeight:'infinity'}}><VStack alignment="leading" spacing={3} frame={{width:104}}><HStack alignment="lastTextBaseline"><Num value={days} size={38} color={ink}/><Text font={12} foregroundStyle={ctx.th.t2}>天</Text></HStack><Text font={11} foregroundStyle={ctx.th.t3}>距自然月末</Text></VStack>{quota}</HStack>
  }else{
   const today=skin==='今日额度',reading=today?history.today:history.average
   detail=<HStack spacing={16} frame={{maxHeight:'infinity'}}><VStack alignment="leading" spacing={3} frame={{maxWidth:'infinity'}}><Text font={11} foregroundStyle={ctx.th.t2}>{today?'今日已用 · 本机记录':'近7天日均'}</Text><Num value={reading===null?'记录中':flowValue(reading)} size={25} color={ctx.th.t1}/></VStack><VStack alignment="leading" spacing={6} frame={{maxWidth:'infinity'}}>{line('剩余',flow)}<Text font={11} foregroundStyle={ctx.th.t3}>{reading===null?'累计历史后显示用量':today?'以本机记录为准':history.average&&m.flowMB!==undefined?`按历史预计可用 ${Math.floor(m.flowMB/history.average)} 天`:'暂不能预测'}</Text></VStack></HStack>
  }
  return <Root ctx={ctx} spacing={5}>{header}{detail}</Root>
 }
 let body:any
 if(skin==='四家总览'&&large){
  const cells=providerIds.map(p=>states.find(s=>s.provider===p)||{provider:p})
  const cell=(s:CarrierState)=><VStack alignment="leading" spacing={6} padding={8} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'topLeading'}} background={<RoundedRectangle cornerRadius={12} fill={(ctx.th.custom?ctx.th.card:identities[s.provider].wash) as any}/>}><HStack spacing={4}><Image systemName={identities[s.provider].symbol} font={12} foregroundStyle={(ctx.th.custom?ctx.th.t1:identities[s.provider].ink) as any}/><Text font={12} fontWeight="semibold" foregroundStyle={ctx.th.t1}>{identities[s.provider].short}</Text></HStack><Num value={s.metrics?.balance===undefined?'—':s.metrics.balance.toFixed(2)} size={25} color={ctx.th.t1}/><Spacer minLength={0}/>{s.metrics?<VStack spacing={4}>{line('流量',flowValue(s.metrics.flowMB))}{line('语音',value(s.metrics.voice,'分'))}</VStack>:<Text font={11} foregroundStyle={ctx.th.t2}>尚未导入</Text>}</VStack>
  body=<VStack spacing={8} frame={{maxHeight:'infinity'}}><HStack spacing={8}>{cell(cells[0])}{cell(cells[1])}</HStack><HStack spacing={8}>{cell(cells[2])}{cell(cells[3])}</HStack></VStack>
 }
 else if(!m)body=<VStack alignment="leading" spacing={5} frame={{maxWidth:'infinity',maxHeight:'infinity'}}><Text font={14} foregroundStyle={ctx.th.t1}>尚未导入{brand.short}数据</Text><Text font={11} foregroundStyle={ctx.th.t2}>{state.message||'请从 BoxJS 导入'}</Text></VStack>
 else if(skin==='双号对照'||skin==='双号全景'){
  const loaded=states.filter(s=>s.metrics),others=loaded.filter(s=>s.provider!==state.provider),partner=getComparePartner(state.provider,ctx.family as CarrierFamily),second=partner?(states.find(s=>s.provider===partner)||{provider:partner,message:'尚未导入'}):others[0],pair=[state,...(second?[second]:[])].slice(0,2)
  body=<HStack spacing={small?8:14} alignment="top" frame={{maxHeight:'infinity'}}>{pair.map(s=>!small&&!large?<VStack alignment="leading" spacing={4} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
   <HStack spacing={4}><Text font={11} foregroundStyle={identities[s.provider].ink as any}>{identities[s.provider].short}</Text><Spacer minLength={2}/><Num value={s.metrics?.balance===undefined?'—':s.metrics.balance.toFixed(2)} size={22} color={ctx.th.t1}/></HStack>
   {line('流量',flowValue(s.metrics?.flowMB))}{line('语音',value(s.metrics?.voice,'分'))}
   {skin==='双号全景'?<Bar ctx={ctx} percent={ratio(s.metrics?.flowMB,s.metrics?.flowTotalMB)??0} height={3}/>:null}
  </VStack>:<VStack alignment="leading" spacing={small?4:large?10:6} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'topLeading'}}>
   <HStack spacing={4}><Image systemName={identities[s.provider].symbol} font={11} foregroundStyle={identities[s.provider].ink as any}/><Text font={11} foregroundStyle={ctx.th.t2}>{identities[s.provider].short}</Text></HStack>
   <Num value={s.metrics?.balance===undefined?'—':s.metrics.balance.toFixed(2)} size={small?21:large?34:28} color={ctx.th.t1}/>
   <Spacer minLength={0}/>{line('流量',flowValue(s.metrics?.flowMB))}{line('语音',value(s.metrics?.voice,'分'))}
   {large&&skin==='双号全景'?<VStack spacing={5}>{compactQuota('流量余量',s.metrics?.flowMB,s.metrics?.flowTotalMB)}{compactQuota('语音余量',s.metrics?.voice,s.metrics?.voiceTotal,true)}</VStack>:null}
  </VStack>)}{pair.length<2?<VStack frame={{maxWidth:'infinity'}}><Text font={11} foregroundStyle={ctx.th.t3}>再导入一家运营商即可对照</Text></VStack>:null}</HStack>
 }
 else if(skin==='账单卡')body=<VStack alignment="leading" spacing={small?4:large?12:5} padding={small?6:12} frame={{maxWidth:'infinity',maxHeight:'infinity',alignment:'topLeading'}} background={<RoundedRectangle cornerRadius={14} fill={wash}/>}>
  {small?null:<HStack><RoundedRectangle cornerRadius={3} fill={ink} frame={{width:24,height:16}}/><Spacer/><Text font={11} foregroundStyle={ink}>账户余额</Text></HStack>}
  <Num value={`¥${balance}`} size={small?25:large?48:32} color={ctx.th.t1}/>
  <Spacer minLength={0}/>{line('流量',flow)}{line('语音',voice)}{large?<Text font={11} foregroundStyle={ctx.th.t2}>本机账户 · {providerNames[state.provider]}</Text>:null}
 </VStack>
 else if(skin==='大字余额')body=<VStack spacing={small?4:8} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
  <Spacer minLength={0}/><Num value={balance} size={small?28:large?66:48} color={ctx.th.t1}/><Text font={11} foregroundStyle={ctx.th.t2}>话费余额 · 元</Text><Spacer minLength={0}/>
  {small?<HStack spacing={6}><Text font={11} foregroundStyle={ctx.th.t2} lineLimit={1}>流量 {flow}</Text><Spacer/><Text font={11} foregroundStyle={ctx.th.t2} lineLimit={1}>语音 {voice}</Text></HStack>:<HStack spacing={14}>{text('剩余流量',flow)}{text('剩余语音',voice)}</HStack>}
 </VStack>
 else if(['今日额度','倒计时','用量预测','用量月报'].includes(skin)){
  const now=new Date(),days=new Date(now.getFullYear(),now.getMonth()+1,0).getDate()-now.getDate()+1
  if(skin==='用量月报')body=<VStack alignment="leading" spacing={small?4:10} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>{small?line('余额',value(m.balance,'元')):text('账户余额',value(m.balance,'元'),large)}{chart()}<Spacer minLength={0}/>{large?line('本机已记录',`${history.days} 天`):null}</VStack>
  else if(skin==='倒计时')body=<VStack spacing={small?3:6} frame={{maxWidth:'infinity',maxHeight:'infinity'}}><HStack alignment="lastTextBaseline"><Num value={days} size={small?32:large?60:40} color={ink}/><Text font={12} foregroundStyle={ctx.th.t2}>{small?'天 · 月末参考':'天 · 距自然月末'}</Text><Spacer/></HStack>{small?line('剩余',flow):meters}{large?<Text font={11} foregroundStyle={ctx.th.t3}>自然月参考，不代表套餐实际重置日。</Text>:null}</VStack>
  else if(skin==='今日额度')body=<VStack alignment="leading" spacing={small?4:8} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>{text('今日已用 · 本机记录',history.today===null?'记录中':flowValue(history.today),!small)}{line('剩余流量',flow)}{large?chart(7,70):null}<Spacer minLength={0}/><Text font={11} foregroundStyle={ctx.th.t3} lineLimit={small?1:undefined}>{m.flowMB===undefined?'剩余流量未返回':`按自然月均分参考 ${flowValue(m.flowMB/days)}/天`}</Text></VStack>
  else body=<VStack alignment="leading" spacing={small?4:8} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>{text('近7天日均',history.average===null?'记录中':flowValue(history.average),!small)}{line('剩余流量',flow)}{history.average!==null&&history.average>0&&m.flowMB!==undefined?line('按历史预计可用',`${Math.max(0,Math.floor(m.flowMB/history.average))} 天`):<Text font={11} foregroundStyle={ctx.th.t3}>需至少2个完整日的有效用量记录。</Text>}{large?chart():null}<Spacer minLength={0}/></VStack>
 }
 else if(skin==='自适应')body=<VStack spacing={small?4:large?12:6} frame={{maxWidth:'infinity',maxHeight:'infinity'}}>
  <HStack><Num value={balance} size={small?26:large?44:30} color={ctx.th.t1}/><Spacer/><Text font={11} foregroundStyle={ctx.th.t2}>余额 · 元</Text></HStack>
  <VStack spacing={small?4:10} padding={small?0:10} frame={{maxWidth:'infinity',maxHeight:'infinity'}} background={small?undefined:<RoundedRectangle cornerRadius={12} fill={ctx.th.card}/>}>{meters}</VStack>
 </VStack>
 else body=small?<VStack spacing={4} frame={{maxWidth:'infinity',maxHeight:'infinity'}}><HStack><Num value={balance} size={25} color={ctx.th.t1}/><Spacer/><Text font={11} foregroundStyle={ctx.th.t3}>元</Text></HStack>{meters}</VStack>:<VStack spacing={large?14:6} frame={{maxHeight:'infinity'}}>
  <HStack spacing={14} frame={{maxHeight:'infinity'}}><VStack alignment="leading" spacing={4} frame={{width:large?120:104,maxHeight:'infinity',alignment:'topLeading'}}><Num value={balance} size={large?40:27} color={ctx.th.t1}/><Text font={11} foregroundStyle={ctx.th.t3}>话费余额 · 元</Text><Spacer minLength={0}/>{m.points!==undefined?<Text font={11} foregroundStyle={ctx.th.t2} lineLimit={1}>积分 {m.points}</Text>:null}{large&&m.packageName?<Text font={11} foregroundStyle={ctx.th.t2} lineLimit={2}>{m.packageName}</Text>:null}{state.stale?<Text font={11} foregroundStyle={ctx.th.t3}>上次数据</Text>:null}</VStack>{meters}</HStack>
  {large?<VStack alignment="leading" spacing={5}>{chart(7,65)}</VStack>:null}
 </VStack>
 return <Root ctx={ctx} spacing={small?3:6}>{header}{body}</Root>
}
