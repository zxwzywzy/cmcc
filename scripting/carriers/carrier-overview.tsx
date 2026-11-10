import { Button, HStack, Image, List, Navigation, NavigationLink, Picker, ProgressView, SecureField, Section, Spacer, Text, TextField, VStack, Widget, useEffect, useState } from 'scripting'
import { loadAll, loadProvider, importAll, forget, providerNames, providerIds, preferences, savePreferences, value, flowValue, timeValue, getCarrierStyle, setCarrierStyle, getComparePartner, setComparePartner, carrierStyles, accountTitle, carrierNote, setCarrierNote, loginTelecomAccount, telecomLoginInfo, type CarrierStyle, type CarrierState, type Provider } from './hub'
import { CarrierLayout } from './carrier-layout'
import { familyNames, usage, type CarrierFamily } from './carrier-design'
import { nextCarrier, selectCarrier } from './app_intents'
import { Page, Group, InfoRow, ActionRow, NavRow } from './mobile/kit'

export function CarrierOverview({mobileAccounts,close,onImported}:{mobileAccounts?:any;close?:any;onImported?:()=>Promise<void>}={}){
 const dismiss=Navigation.useDismiss()
 const [states,setStates]=useState<CarrierState[]>([]),[busy,setBusy]=useState(false),[note,setNote]=useState('')
 const [host,setHost]=useState(preferences().host)
 useEffect(()=>{refresh()},[])
 async function refresh(force=false){
  setBusy(true)
  try{setStates(await loadAll(force));if(force)await onImported?.()}catch{setNote('读取失败，请重试')}finally{setBusy(false)}
 }
 async function changed(){await refresh();await onImported?.();Widget.reloadAll()}
 async function doImport(){
  setBusy(true)
  try{savePreferences(host,preferences().refresh);setNote(await importAll());await changed()}catch(e){setNote((e as Error).message)}finally{setBusy(false)}
 }
 return <List navigationTitle="账号" navigationBarTitleDisplayMode="large" toolbar={{cancellationAction:close||<Button title="关闭" action={dismiss}/>}}>
  {mobileAccounts}
  {(['unicom','telecom','broadnet'] as Provider[]).map(p=>{
   const state=states.find(s=>s.provider===p)||{provider:p,message:'尚未导入'}
   return <Section header={<Text>{providerNames[p].replace('中国','')}号码</Text>}>
    <NavigationLink destination={<CarrierAccountDetail initial={state} states={states} changed={changed}/>}><CarrierAccountCard state={state}/></NavigationLink>
   </Section>
  })}
  <Section header={<Text>添加与更新</Text>} footer={<Text>{note||'电信支持账号密码直接登录；其他运营商可从圈 X 的 BoxJS 导入。点号码查看详情、备注和组件样式。'}</Text>}>
   <NavigationLink destination={<TelecomLoginForm saved={changed}/>}><Text>{telecomLoginInfo()?'修改电信登录账号':'添加电信账号 · 密码登录'}</Text></NavigationLink>
   <Button title={busy?'处理中…':'从 BoxJS 导入'} disabled={busy} action={doImport}/>
   <Button title="刷新全部账号" disabled={busy} action={async()=>{await refresh(true);Widget.reloadAll()}}/>
   <TextField title="BoxJS 域名" value={host} onChanged={setHost}/>
  </Section>
  <Section header={<Text>组件设置</Text>} footer={<Text>每家分别保存大、中、小号样式。桌面参数留空，点组件左上角名称切换运营商。</Text>}>
   {providerIds.map(p=><NavigationLink destination={<CarrierStyleSettings provider={p} states={states}/>}><Text>{providerNames[p]}样式</Text></NavigationLink>)}
  </Section>
 </List>
}
export function CarrierAccountCard({state}:{state:CarrierState}){
 const m=state.metrics,low=m?.balance!==undefined&&m.balance<10
 return <VStack alignment="leading" spacing={10} padding={{vertical:4}}>
  <HStack spacing={12}>
   <VStack alignment="leading" spacing={2}>
    <Text font={16} fontWeight="semibold">{accountTitle(state)}</Text>
    <Text font={12} foregroundStyle="secondaryLabel" lineLimit={1}>{[providerNames[state.provider],m?.packageName,state.stale?'上次数据':!m?'待添加':''].filter(Boolean).join(' · ')}</Text>
   </VStack><Spacer/>
   <VStack alignment="trailing" spacing={1}><Text font={22} fontWeight="semibold" fontDesign="rounded" monospacedDigit foregroundStyle={low?'systemRed':'label'}>{m?.balance===undefined?'—':m.balance.toFixed(2)}</Text><Text font={11} foregroundStyle="secondaryLabel">{m?.balance!==undefined&&m.balance<0?'已欠费':'余额'}</Text></VStack>
  </HStack>
  <HStack spacing={8}>
   <VStack alignment="leading" spacing={2} frame={{maxWidth:'infinity',alignment:'leading'}}><Text font={11} foregroundStyle="secondaryLabel">{m?.flowScope==='all'?'总流量':'通用'}</Text><Text font={14} fontWeight="semibold" monospacedDigit foregroundStyle={m?.flowTotalMB&&m.flowMB!==undefined&&m.flowMB/m.flowTotalMB<0.2?'systemRed':'label'}>{flowValue(m?.flowMB)}</Text></VStack>
   <VStack alignment="leading" spacing={2} frame={{maxWidth:'infinity',alignment:'leading'}}><Text font={11} foregroundStyle="secondaryLabel">语音</Text><Text font={14} fontWeight="semibold" monospacedDigit>{value(m?.voice,'分')}</Text></VStack>
  </HStack>
 </VStack>
}
function CarrierAccountDetail({initial,states,changed}:{initial:CarrierState;states:CarrierState[];changed:()=>Promise<void>}){
 const dismiss=Navigation.useDismiss(),p=initial.provider
 const [state,setState]=useState(initial),[busy,setBusy]=useState(false),[note,setNote]=useState(''),[revision,setRevision]=useState(0)
 const m=state.metrics
 async function refresh(){setBusy(true);try{setState(await loadProvider(p,true));await changed()}catch{setNote('刷新失败，请稍后重试')}finally{setBusy(false)}}
 async function renamed(){const name=await Dialog.prompt({title:'备注',message:'留空恢复尾号或运营商名称',defaultValue:carrierNote(p)});if(name===null)return;setCarrierNote(p,name);setRevision(revision+1);await changed();Widget.reloadAll()}
 async function remove(){if(!await Dialog.confirm({title:'移除此账号？',message:'清除本机该运营商凭据和用量历史，圈 X 中的源数据仍保留。'}))return;forget(p);await changed();dismiss()}
 return <Page title={accountTitle(state)}>
  <Group title="套餐与账户" note={state.message||`${timeValue(m?.fetchedAt)}；本机已记录 ${usage(p).days} 天历史${state.stale?' · 当前为缓存':''}`}>
   <InfoRow icon="yensign.circle" title={m?.balance!==undefined&&m.balance<0?'已欠费':'话费余额'} value={value(m?.balance,'元')} color={m?.balance!==undefined&&m.balance<10?'systemRed':undefined}/>
   <InfoRow icon="antenna.radiowaves.left.and.right" title={m?.flowScope==='all'?'总流量':'通用流量'} value={`剩 ${flowValue(m?.flowMB)} / ${flowValue(m?.flowTotalMB)}`}/>
   <InfoRow icon="phone" title="语音" value={`剩 ${value(m?.voice,'分')} / ${value(m?.voiceTotal,'分')}`}/>
   <InfoRow icon="star" title="积分" value={value(m?.points,'分')}/>
   <InfoRow icon="simcard" title="套餐" value={m?.packageName||'—'}/>
   {m?.sms!==undefined?<InfoRow icon="message" title="短信" value={value(m.sms,'条')}/>:null}
   {m?.resourceDetails?.length?<NavRow icon="list.bullet" title="套餐资源明细" destination={<ResourceDetails state={state}/>}/>:null}
  </Group>
  <Group title="备注"><ActionRow icon="pencil" title="备注" value={carrierNote(p)||'未设置'} action={renamed}/></Group>
  <Group title="小组件"><NavRow icon="square.grid.2x2" title="大、中、小号样式" destination={<CarrierStyleSettings provider={p} states={states.map(s=>s.provider===p?state:s)}/>}/></Group>
  {p==='telecom'?<Group title="登录方式" note="密码登录只向电信官方接口发送请求，凭据保存在本机 Keychain。抓取方式仍可用；要切回抓取，请先移除此账号后从 BoxJS 导入。">
   <InfoRow icon="person.crop.circle" title="当前方式" value={telecomLoginInfo()?'账号密码登录':'圈 X 抓取'}/>
   <NavRow icon="key" title={telecomLoginInfo()?'修改登录账号':'设置账号密码登录'} destination={<TelecomLoginForm saved={async()=>{setState(await loadProvider(p));await changed()}}/>}/>
  </Group>:null}
  <Group title="更新" note={note||'未返回的数据不填示例值。'}><ActionRow icon="arrow.clockwise" title={busy?'刷新中…':'刷新查询'} disabled={busy} action={refresh}/><ActionRow icon="trash" title="移除此账号" destructive action={remove}/></Group>
 </Page>
}
export function TelecomLoginForm({saved}:{saved:()=>Promise<void>}){
 const dismiss=Navigation.useDismiss()
 const [phone,setPhone]=useState(''),[password,setPassword]=useState(''),[device,setDevice]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 async function submit(){setBusy(true);setMessage('正在登录并查询…');try{await loginTelecomAccount(phone,password,device);setPassword('');await saved();Widget.reloadAll();dismiss()}catch(e){setMessage((e as Error).message)}finally{setBusy(false)}}
 return <List navigationTitle="电信账号登录">
  <Section header={<Text>账号信息</Text>} footer={<Text>输入电信登录密码（通常为服务密码），不是短信验证码。无需开启圈 X 或 BoxJS；设备 ID 可留空。账号密码只保存到本机 Keychain，不上传 GitHub。</Text>}>
   <TextField title="手机号" value={phone} onChanged={setPhone}/>
   <SecureField title="登录密码" value={password} onChanged={setPassword}/>
   <TextField title="设备 ID（可选）" value={device} onChanged={setDevice}/>
  </Section>
  <Section footer={<Text>{message||'登录并查询成功后才替换已保存的电信账号。遇到安全验证请在官方 App 完成，不会反复重试。'}</Text>}><Button title={busy?'登录中…':'登录并保存'} disabled={busy} action={submit}/>{busy?<ProgressView/>:null}</Section>
 </List>
}
function CarrierStyleSettings({provider,states}:{provider:Provider;states:CarrierState[]}){
 const [family,setFamily]=useState<CarrierFamily>('systemMedium'),[revision,setRevision]=useState(0)
 const skin=getCarrierStyle(provider,family)
 return <List navigationTitle={providerNames[provider]+'样式'}>
  <Section header={<Text>组件尺寸</Text>}><Picker title="尺寸" value={family} onChanged={setFamily} pickerStyle="segmented"><Text tag="systemSmall">小号</Text><Text tag="systemMedium">中号</Text><Text tag="systemLarge">大号</Text></Picker></Section>
  <Section header={<Text>{familyNames[family]}样式</Text>} footer={<Text>各尺寸独立保存，桌面参数留空自动使用。</Text>}>
   <Picker title="样式" value={skin} onChanged={(s:CarrierStyle)=>{setCarrierStyle(provider,s,family);setRevision(revision+1);Widget.reloadAll()}}>{carrierStyles.filter(s=>family==='systemLarge'||s!=='四家总览').map(s=><Text tag={s}>{s}</Text>)}</Picker>
   {['双号对照','双号全景'].includes(skin)?<Picker title="对照第二家" value={getComparePartner(provider,family)||states.find(s=>s.provider!==provider&&s.metrics)?.provider||providerIds.find(p=>p!==provider)!} onChanged={(p:Provider)=>{setComparePartner(provider,p,family);setRevision(revision+1);Widget.reloadAll()}}>{providerIds.filter(p=>p!==provider).map(p=><Text tag={p}>{providerNames[p]}</Text>)}</Picker>:null}
   <NavigationLink destination={<CarrierStylePreview provider={provider} family={family} states={states}/>}><Text>预览{familyNames[family]}样式</Text></NavigationLink>
  </Section>
 </List>
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

function ResourceDetails({state}:{state:CarrierState}){
 return <List navigationTitle="套餐资源明细">{state.metrics?.resourceDetails?.map(item=><Section header={<Text>{item.name}</Text>}><Text>{item.kind} · {item.unit||'单位未返回'}</Text><HStack><Text>剩余</Text><Spacer/><Text>{item.remaining??'—'}</Text></HStack><HStack><Text>已用</Text><Spacer/><Text>{item.used??'—'}</Text></HStack><HStack><Text>总量</Text><Spacer/><Text>{item.total??'—'}</Text></HStack></Section>)}<Text font="caption" foregroundStyle="secondaryLabel">按接口原始单位展示；资源包可能重叠，不将明细直接相加。</Text></List>
}
