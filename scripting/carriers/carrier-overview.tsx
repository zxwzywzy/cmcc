import { Button, HStack, List, Navigation, NavigationStack, NavigationLink, Picker, Script, Section, Spacer, Text, TextField, VStack, Widget, useEffect, useState } from 'scripting'
import { loadAll, importAll, forget, providerNames, providerIds, preferences, savePreferences, value, flowValue, timeValue, getCarrierStyle, setCarrierStyle, getComparePartner, setComparePartner, carrierStyles, type CarrierStyle, type CarrierState } from './hub'
import { CarrierLayout } from './carrier-layout'
import { familyNames, type CarrierFamily } from './carrier-design'
import { readCarrier, nextCarrier, selectCarrier } from './app_intents'
import type { Provider } from './hub'
export function CarrierOverview(){
 const dismiss=Navigation.useDismiss()
 const [states,setStates]=useState<CarrierState[]>([])
 const [busy,setBusy]=useState(false)
 const [note,setNote]=useState('')
 const [host,setHost]=useState(preferences().host)
 const [partners,setPartners]=useState<Record<string,Provider>>({})
 const [family,setFamily]=useState<CarrierFamily>('systemMedium')
 const [skins,setSkins]=useState(Object.fromEntries(providerIds.map(p=>[p,getCarrierStyle(p)])))
 useEffect(()=>{refresh()},[])
 async function refresh(force=false){
  if(busy)return
  setBusy(true)
  try{setStates(await loadAll(force))}catch{setNote('读取失败，请重试')}finally{setBusy(false)}
 }
 async function doImport(){
  setBusy(true)
  try{savePreferences(host,120);setNote(await importAll());setStates(await loadAll());Widget.reloadAll()}
  catch(e){setNote((e as Error).message)}finally{setBusy(false)}
 }
 return <NavigationStack><List navigationTitle="运营商余量" navigationBarTitleDisplayMode="large" toolbar={{cancellationAction:<Button title="关闭" action={dismiss}/>}}>
  <Section header={<Text>组件尺寸</Text>} footer={<Text>每家运营商分别保存小、中、大号样式，桌面参数留空自动使用。</Text>}>
   <Picker title="尺寸" value={family} onChanged={setFamily} pickerStyle="segmented"><Text tag="systemSmall">小号</Text><Text tag="systemMedium">中号</Text><Text tag="systemLarge">大号</Text></Picker>
  </Section>
  <Section header={<Text>账户概览与样式</Text>} footer={<Text>每家可单独选择11种样式，点击预览查看当前尺寸。移动原组件的样式仍在“小组件”页设置。缺失字段显示 —。</Text>}>
   {providerIds.map(p=>{
    const s=states.find(x=>x.provider===p),m=s?.metrics
    return <VStack alignment="leading" spacing={8} padding={{vertical:8}}>
     <HStack><Text font="headline">{providerNames[p]}</Text><Spacer/><Text font="caption" foregroundStyle="secondaryLabel">{s?.stale?'上次数据':m?'已更新':'待导入'}</Text></HStack>
     <Picker title={familyNames[family]+"样式"} value={skins[p+':'+family]||getCarrierStyle(p,family)} onChanged={(style:CarrierStyle)=>{setCarrierStyle(p,style,family);setSkins({...skins,[p+':'+family]:style});Widget.reloadAll()}}>
      {carrierStyles.filter(style=>family==='systemLarge'||style!=='四家总览').map(style=><Text tag={style}>{style}</Text>)}
     </Picker>
     {['双号对照','双号全景'].includes(skins[p+':'+family]||getCarrierStyle(p,family))?<Picker title="对照第二家" value={partners[p+':'+family]||getComparePartner(p,family)||states.find(x=>x.provider!==p&&x.metrics)?.provider||providerIds.find(x=>x!==p)!} onChanged={(other:Provider)=>{setComparePartner(p,other,family);setPartners({...partners,[p+':'+family]:other});Widget.reloadAll()}}>{providerIds.filter(x=>x!==p).map(x=><Text tag={x}>{providerNames[x]}</Text>)}</Picker>:null}
     <NavigationLink destination={<CarrierStylePreview provider={p} family={family} states={states}/>}><Text>预览{familyNames[family]}样式</Text></NavigationLink>
     <HStack><Text>余额</Text><Spacer/><Text monospacedDigit>{value(m?.balance,'元')}</Text></HStack>
     <HStack><Text>{p==='telecom'?'通用剩余流量':'剩余流量'}</Text><Spacer/><Text monospacedDigit>{flowValue(m?.flowMB)}</Text></HStack>
     <HStack><Text>剩余语音</Text><Spacer/><Text monospacedDigit>{value(m?.voice,'分钟')}</Text></HStack>
     <Text font="caption" foregroundStyle="secondaryLabel">{s?.message||timeValue(m?.fetchedAt)}</Text>
     {m&&s?.message?<Text font="caption" foregroundStyle="secondaryLabel">{timeValue(m.fetchedAt)}</Text>:null}
     {m?<Button title="移除此运营商数据" role="destructive" disabled={busy} action={async()=>{forget(p);await refresh();Widget.reloadAll()}}/>:null}
    </VStack>
   })}
  </Section>
  <Section header={<Text>更新</Text>} footer={<Text>{note||'保持圈 X 和 BoxJS 开启。抓取后点导入；有完整查询请求时可直接刷新，只有快照时需重新打开官方 App 抓取。'}</Text>}>
   <Button title={busy?'处理中…':'从 BoxJS 导入'} disabled={busy} action={doImport}/>
   <Button title="刷新查询" disabled={busy} action={async()=>{await refresh(true);Widget.reloadAll()}}/>
   <TextField title="BoxJS 域名" value={host} onChanged={setHost}/>
  </Section>
  <Section header={<Text>桌面小组件</Text>} footer={<Text>联通、电信、广电为适配试用版，尚未完成真机验证。广电 App 路径和返回结构仍需验证；不支持自动续登或签到。</Text>}>
   <Text>添加 Scripting 小组件，选择“运营商余量”，大、中、小号参数留空即可，按各尺寸已保存的样式显示。直接点卡片左上角运营商名称切换，自动记住选择，不用填写参数。单独查看可填“联通”“电信”“广电”。</Text>
   <Text>移动可用“移动 全景 1234”等参数，保留原组件的 12 种样式与多账号能力。其他三家目前各保留最近一次抓取的账号。</Text>
  </Section>
 </List></NavigationStack>
}
function CarrierStylePreview({provider,family,states}:{provider:Provider;family:CarrierFamily;states:CarrierState[]}){
 const [selected,setSelected]=useState<Provider>(provider)
 const state=states.find(s=>s.provider===selected)||{provider:selected,message:'尚未导入该运营商'}
 const box=family==='systemSmall'?{width:158,height:158}:family==='systemMedium'?{width:338,height:158}:{width:338,height:354}
 const cycle=()=>{const next=nextCarrier(selected) as Provider;selectCarrier(next);setSelected(next)}
 return <VStack spacing={16} padding={16} navigationTitle={familyNames[family]+'样式预览'}>
  <VStack frame={box}><CarrierLayout state={state} family={family} inApp onChange={cycle} states={states}/></VStack>
  <Text font="headline">{providerNames[selected]} · {getCarrierStyle(selected,family)}</Text>
  <Text font="caption" foregroundStyle="secondaryLabel">点卡片左上角运营商名称切换。缺少历史时显示“记录中”，不生成示例用量。</Text>
 </VStack>
}
