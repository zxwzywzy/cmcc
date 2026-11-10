import { Button, HStack, List, Navigation, NavigationStack, Picker, Script, Section, Spacer, Text, TextField, VStack, Widget, useEffect, useState } from 'scripting'
import { loadAll, importAll, forget, providerNames, providerIds, preferences, savePreferences, value, flowValue, timeValue, getCarrierStyle, setCarrierStyle, carrierStyles, type CarrierStyle, type CarrierState } from './hub'
export function CarrierOverview(){
 const dismiss=Navigation.useDismiss()
 const [states,setStates]=useState<CarrierState[]>([])
 const [busy,setBusy]=useState(false)
 const [note,setNote]=useState('')
 const [host,setHost]=useState(preferences().host)
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
  <Section header={<Text>账户概览</Text>} footer={<Text>每家可单独选择全景、账单卡或大字余额；用于总览及非移动固定组件。移动原组件的样式仍在“小组件”页设置。缺失字段显示 —。</Text>}>
   {providerIds.map(p=>{
    const s=states.find(x=>x.provider===p),m=s?.metrics
    return <VStack alignment="leading" spacing={8} padding={{vertical:8}}>
     <HStack><Text font="headline">{providerNames[p]}</Text><Spacer/><Text font="caption" foregroundStyle="secondaryLabel">{s?.stale?'上次数据':m?'已更新':'待导入'}</Text></HStack>
     <Picker title="总览样式" value={skins[p]} onChanged={(style:CarrierStyle)=>{setCarrierStyle(p,style);setSkins({...skins,[p]:style});Widget.reloadAll()}}>
      {carrierStyles.map(style=><Text tag={style}>{style}</Text>)}
     </Picker>
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
   <Text>添加 Scripting 小组件，选择“运营商余量”，中号和大号参数留空即可。大号显示四家导入状态，中号直接点上方运营商标签切换，自动记住选择，不用填写参数。单独查看可填“联通”“电信”“广电”。</Text>
   <Text>移动可用“移动 全景 1234”等参数，保留原组件的 12 种样式与多账号能力。其他三家目前各保留最近一次抓取的账号。</Text>
  </Section>
 </List></NavigationStack>
}