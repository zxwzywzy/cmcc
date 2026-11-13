import { Button,HStack,Image,List,Navigation,NavigationLink,NavigationStack,Picker,Script,Section,Spacer,Tab,TabView,Text,TextField,Toggle,VStack,Widget,useEffect,useObservable,useState } from 'scripting'
import { balance,choice,current,loadLines,loadStations,saveChoice,type BusSnapshot } from './api'
import { forgetAccount,readAccount } from './account'
import { loginFromBoxJS,captureStatus,captureInstallURL,LOGIN_SUBSCRIPTION } from './login'
import { BusView,clock } from './view'
import type { Line,Station } from './model'
import { isNearby,setMode,nearbyCurrent,cachedNearby,meters,destination,type NearbySnapshot } from './nearby'
import { NearbyView } from './nearby-view'
import { LiveNearbyMap } from './map'
import { RidePage } from './ride-page'
import { appearance,saveAppearance,saveStyle,BUS_STYLES,type Appearance,type BusStyle,type BusFamily } from './appearance'
import { widgetRuntime,saveWidgetRuntime,type WidgetRuntime } from './runtime'
import { estimateLabel } from './model'
import { OrdersPage } from './orders-page'

function LoginHelp({changed}:{changed:()=>void}){
 const [note,setNote]=useState(''),[busy,setBusy]=useState(false)
 async function diagnose(){if(busy)return;setBusy(true);try{setNote(await captureStatus())}catch(e){setNote((e as Error).message)}finally{setBusy(false)}}
 return <List navigationTitle="登录与抓取"><Section footer={<Text>启用抓取重写，在微信“武胜公交”中登录并打开乘车码或消费记录，回账号页导入即可。</Text>}><Button title="添加抓取订阅" action={async()=>{try{await Safari.openURL(captureInstallURL())}catch{setNote('请复制链接到圈 X 重写资源')}}}/><Button title="复制抓取链接" action={async()=>{await Pasteboard.setString(LOGIN_SUBSCRIPTION);setNote('链接已复制')}}/><Button title={busy?'正在检查…':'检查抓取状态'} disabled={busy} action={diagnose}/>{note?<Text font={12} foregroundStyle="secondaryLabel">{note}</Text>:null}</Section>{readAccount()?<Section><Button title="退出本机登录" action={()=>{forgetAccount();changed();Widget.reloadAll();setNote('已退出登录')}}/></Section>:null}</List>
}

function AccountsPage({changed,active,close}:{changed:()=>void;active:boolean;close:any}){
 const [note,setNote]=useState(''),[busy,setBusy]=useState(false),[card,setCard]=useState<any>(readAccount()?Storage.get('wusheng.bus.balance'):undefined)
 useEffect(()=>{if(active)setCard(readAccount()?Storage.get('wusheng.bus.balance')||undefined:undefined)},[active])
 async function connect(){if(busy)return;setBusy(true);setNote('');try{const result=await loginFromBoxJS();setCard(result);setNote('登录已更新');Widget.reloadAll();changed()}catch(e){setNote((e as Error).message)}finally{setBusy(false)}}
 async function refreshBalance(){if(busy)return;const account=readAccount();setBusy(true);try{const result=await balance(account);if(account?.authorization===readAccount()?.authorization&&account?.userId===readAccount()?.userId){setCard(result);setNote('余额已更新');Widget.reloadAll()}}catch(e){setNote((e as Error).message)}finally{setBusy(false)}}
 return <List navigationTitle="账号" toolbar={{cancellationAction:close}}>
 <Section><HStack spacing={12} padding={{vertical:5}}><Image systemName="creditcard.fill" font={25} foregroundStyle={{light:'#006B72',dark:'#39D4E0'}}/><VStack alignment="leading" spacing={5}><Text font={12} foregroundStyle="secondaryLabel">公交卡余额</Text><Text font={34} fontWeight="semibold" monospacedDigit>{readAccount()&&card?.balance!==undefined?'¥'+card.balance.toFixed(2):'—'}</Text><Text font={10} foregroundStyle="secondaryLabel">{readAccount()&&card?(card.cardTail?'尾号 '+card.cardTail+' · ':'')+clock(card.fetchedAt):'导入登录后查询'}</Text></VStack><Spacer/><Button title="刷新" disabled={busy||!readAccount()} action={refreshBalance}/></HStack></Section>
 <Section><NavigationLink destination={<OrdersPage active={active} ownerId={readAccount()?.userId||''}/>}><HStack><Image systemName="list.bullet.rectangle"/><Text>订单记录</Text><Spacer/></HStack></NavigationLink><Button title={busy?'正在导入…':'从 BoxJS 导入'} disabled={busy} action={connect}/><NavigationLink destination={<LoginHelp changed={changed}/>}><Text>登录与抓取</Text></NavigationLink>{note?<Text font={11} foregroundStyle="secondaryLabel">{note}</Text>:null}</Section>
 </List>
}
function Stations({line,changed}:{line:Line;changed:()=>void}){
 const [direction,setDirection]=useState(1),[rows,setRows]=useState<Station[]>([]),[note,setNote]=useState('加载站点…')
 useEffect(()=>{let active=true;setRows([]);setNote('加载站点…');loadStations(line.id,direction).then(s=>{if(active){setRows(s);setNote(s.length?'点选你要上车的站点':'这个方向暂未提供站点')}}).catch(()=>{if(active)setNote('加载失败，请切换方向重试')});return()=>{active=false}},[direction])
 return <List navigationTitle={line.name}><Section header={<Text>行驶方向</Text>}><Button title={direction===1?'上行 · 当前':'上行'} action={()=>setDirection(1)}/><Button title={direction===2?'下行 · 当前':'下行'} action={()=>setDirection(2)}/><Text>{note}</Text></Section><Section header={<Text>候车站</Text>}>{rows.map(s=><Button key={s.id+':'+s.no} title={s.no+' · '+s.name} action={()=>{setMode('manual');saveChoice({line,direction,station:s});Widget.reloadAll();changed();setNote('已选择：'+s.name)}}/>)}</Section></List>
}
function Lines({changed}:{changed:()=>void}){
 const [rows,setRows]=useState<Line[]>([]),[search,setSearch]=useState(''),[note,setNote]=useState('正在查询线路…')
 async function reload(){try{const r=await loadLines();setRows(r);setNote(r.length?'选择线路后再选择方向和候车站':'暂无线路')}catch{setNote('查询失败，请重试')}}
 useEffect(()=>{reload()},[])
 return <List navigationTitle="选择线路"><Section><TextField title="搜索线路" value={search} onChanged={setSearch}/><Text>{note}</Text><Button title="重新查询" action={reload}/></Section><Section>{rows.filter(r=>(r.name+r.start+r.end).includes(search)).map(r=><NavigationLink key={r.id} destination={<Stations line={r} changed={changed}/>}><Text>{r.name+' · '+r.start+' → '+r.end}</Text></NavigationLink>)}</Section></List>
}
function NearbySettings({changed}:{changed:()=>void}){
 const [near,setNear]=useState<NearbySnapshot|undefined>(cachedNearby()),[snapshot,setSnapshot]=useState<BusSnapshot|undefined>(Storage.get('wusheng.bus.arrival')||undefined),[note,setNote]=useState(''),[busy,setBusy]=useState(false)
 async function refresh(locate=false){if(busy)return;setBusy(true);setNote('');try{if(locate){setMode('nearby');setNear(await nearbyCurrent({enable:true,force:true}))}else if(isNearby())setNear(await nearbyCurrent());else setSnapshot(await current());Widget.reloadAll();changed()}catch(e){setNote((e as Error).message)}finally{setBusy(false)}}
 const c=choice()
 return <List navigationTitle="站台与定位"><Section header={<Text>{isNearby()?'附近站台':'固定候车站'}</Text>}>
 {isNearby()?<><Text>{near?.stop?near.stop.name+' · 距你 '+meters(near.stop.meters):'点击下方按钮查找最近站台'}</Text>{near?.services.slice(0,3).map((s,i)=><Text key={i}>{s.choice.line.name+' · '+estimateLabel(s.items[0],!near.stale&&Date.now()-near.time<120000)+' · '+destination(s.choice)}</Text>)}{near?.stop?<NavigationLink destination={<LiveNearbyMap initial={near}/>}><Text>全部线路与地图</Text></NavigationLink>:null}</>:<><Text>{c?c.line.name+' · '+c.station.name:'尚未选择候车站'}</Text><Text>{estimateLabel(snapshot?.items[0],!!snapshot&&!snapshot.stale&&Date.now()-snapshot.time<120000)}</Text></>}
 <Button title={busy?'正在查询…':'用当前位置查最近站台'} disabled={busy} action={()=>refresh(true)}/><Button title="刷新到站" disabled={busy} action={()=>refresh()}/>{note?<Text>{note}</Text>:null}<NavigationLink destination={<Lines changed={changed}/>}><Text>选择固定线路、方向和站点</Text></NavigationLink></Section></List>
}
function Guide(){return <List navigationTitle="使用说明"><Section header={<Text>登录</Text>}><Text>圈 X 更新抓取重写，在微信小程序产生登录请求后，回账号页点“从 BoxJS 导入”。</Text></Section><Section header={<Text>组件运行</Text>}><Text>默认平时休眠，点击组件刷新一次。可在设置中关闭组件，或启用通勤时段、持续更新。关闭组件不影响手动取码与订单查询。</Text></Section><Section header={<Text>预计到站</Text>}><Text>预计分钟依据车辆上报车速和完整站距计算。车辆停驶、信息不全或数据未更新时，显示“预计时间待更新”。进度条表示车辆沿站序前往本站的进度，供候车参考。</Text></Section><Section header={<Text>组件样式</Text>}><Text>小、中、大尺寸分别选择全景、到站卡、账单卡或极简；叠放参数仍可填写“叠放1”“叠放2”等。</Text></Section></List>}
function SettingsPage({changed,close}:{changed:()=>void;close:any}){
 const [runtime,setRuntime]=useState(widgetRuntime())
 function update(patch:Partial<WidgetRuntime>){setRuntime(saveWidgetRuntime(patch));changed();Widget.reloadAll()}
 return <List navigationTitle="设置" toolbar={{cancellationAction:close}}>
 <Section header={<Text>组件运行</Text>} footer={<Text>{runtime.mode==='manual'?'平时休眠，点击组件刷新一次。':runtime.mode==='commute'?'通勤更新：07:00–09:00、17:00–19:30，其他时间休眠。':'按系统允许的频率更新。'}</Text>}><Toggle title="启用桌面组件" value={runtime.enabled} onChanged={v=>update({enabled:v})}/><Picker title="刷新策略" value={runtime.mode} onChanged={v=>update({mode:v as WidgetRuntime['mode']})} pickerStyle="segmented"><Text tag="manual">手动</Text><Text tag="commute">通勤</Text><Text tag="always">持续</Text></Picker></Section>
 <Section><NavigationLink destination={<NearbySettings changed={changed}/>}><Text>站台与定位</Text></NavigationLink><NavigationLink destination={<LoginHelp changed={changed}/>}><Text>登录与抓取</Text></NavigationLink></Section>
 <Section><NavigationLink destination={<Guide/>}><Text>使用说明</Text></NavigationLink></Section>
 <Section header={<Text>武胜公交 · 0.3.0</Text>}><Button title="更新脚本" action={async()=>{await Safari.openURL(Script.createImportScriptsURLScheme(['https://raw.githubusercontent.com/zxwzywzy/cmcc/main/packages/wusheng-bus.scripting']))}}/></Section>
 </List>
}
function StylesPage({close}:{close:any}){
 const [look,setLook]=useState(appearance()),[family,setFamily]=useState<BusFamily>('systemMedium')
 function update(patch:Partial<Appearance>){setLook(saveAppearance({...look,...patch}));Widget.reloadAll()}
 const card=readAccount()?Storage.get<any>('wusheng.bus.balance')||undefined:undefined
 return <List navigationTitle="组件样式" toolbar={{cancellationAction:close}}>
 <Section header={<Text>布局</Text>}><Picker title="组件尺寸" value={family} onChanged={v=>setFamily(v as BusFamily)} pickerStyle="segmented"><Text tag="systemSmall">小</Text><Text tag="systemMedium">中</Text><Text tag="systemLarge">大</Text></Picker><Picker title="组件样式" value={look.styles[family]} onChanged={v=>{setLook(saveStyle(family,v as BusStyle));Widget.reloadAll()}} pickerStyle="menu">{BUS_STYLES.map(s=><Text key={s} tag={s}>{s}</Text>)}</Picker></Section>
 <Section header={<Text>外观</Text>}><Picker title="组件主题" value={look.theme} onChanged={v=>update({theme:v as Appearance['theme']})} pickerStyle="segmented"><Text tag="night">深色</Text><Text tag="day">浅色</Text><Text tag="system">跟随系统</Text></Picker><Toggle title="显示公交卡余额" value={look.showBalance} onChanged={v=>update({showBalance:v})}/><Toggle title="紧凑布局" value={look.compact} onChanged={v=>update({compact:v})}/></Section>
 <Section header={<Text>预览</Text>} footer={<Text>各尺寸分别保存样式，桌面可定位、换向和翻页。</Text>}><VStack frame={{width:family==='systemSmall'?158:300,height:family==='systemLarge'?330:158}}>{isNearby()?<NearbyView snapshot={cachedNearby()} family={family} card={card}/>:<BusView snapshot={Storage.get<BusSnapshot>('wusheng.bus.arrival')||undefined} family={family} card={card}/>}</VStack></Section>
 </List>
}
export function BusApp({openRide=false}:{openRide?:boolean}){
 const dismiss=Navigation.useDismiss(),selection=useObservable<number>(openRide?0:1),[active,setActive]=useState(openRide?0:1),[rideTap,setRideTap]=useState(openRide?1:0),[,setRevision]=useState(0)
 const changed=()=>setRevision(n=>n+1),close=<Button title="关闭" action={dismiss}/>
 useEffect(()=>{let previous=selection.value;const listener=()=>{const next=selection.value;if(next===previous)return;previous=next;setActive(next);if(next===0)setRideTap(n=>n+1)};selection.subscribe(listener);return()=>selection.unsubscribe(listener)},[])
 return <TabView selection={selection}>
 <Tab title="乘车码" systemImage="qrcode" value={0}><NavigationStack><RidePage active={active===0} tapId={rideTap} close={close} toAccount={()=>selection.setValue(1)}/></NavigationStack></Tab>
 <Tab title="账号" systemImage="person.crop.circle.fill" value={1}><NavigationStack><AccountsPage active={active===1} changed={changed} close={close}/></NavigationStack></Tab>
 <Tab title="设置" systemImage="gearshape.fill" value={2}><NavigationStack><SettingsPage changed={changed} close={close}/></NavigationStack></Tab>
 <Tab title="组件样式" systemImage="square.grid.2x2.fill" value={3}><NavigationStack><StylesPage close={close}/></NavigationStack></Tab>
 </TabView>
}
async function main(){await Navigation.present({element:<BusApp openRide={Script.queryParameters?.page==='ride'}/>,modalPresentationStyle:'fullScreen',swipeBackBehavior:'dismiss'});Script.exit()}
main()
