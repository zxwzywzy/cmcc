import { Button,List,Navigation,NavigationLink,NavigationStack,Picker,Script,Section,Tab,TabView,Text,TextField,Toggle,VStack,Widget,useEffect,useObservable,useState } from 'scripting'
import { balance,choice,current,loadLines,loadStations,saveChoice,type BusSnapshot } from './api'
import { forgetAccount,readAccount } from './account'
import { loginFromBoxJS,captureStatus,boxHost,captureInstallURL,LOGIN_SUBSCRIPTION,BOXJS_SUBSCRIPTION } from './login'
import { BusView,clock,arrivalLabel } from './view'
import type { Line,Station } from './model'
import { isNearby,setMode,nearbyCurrent,cachedNearby,clearNearby,meters,destination,vehicleSummary,type NearbySnapshot } from './nearby'
import { NearbyView } from './nearby-view'
import { LiveNearbyMap } from './map'
import { RidePage } from './ride-page'
import { appearance,saveAppearance,type Appearance } from './appearance'

function AccountsPage({changed,active,close}:{changed:()=>void;active:boolean;close:any}){
 const [host,setHost]=useState(boxHost()),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[card,setCard]=useState<any>(readAccount()?Storage.get('wusheng.bus.balance'):undefined)
 useEffect(()=>{if(active)setCard(readAccount()?Storage.get('wusheng.bus.balance')||undefined:undefined)},[active])
 async function connect(){if(busy)return;setBusy(true);setNote('正在从 BoxJS 读取授权并验证…');try{const result=await loginFromBoxJS(host);setCard(result);setNote('登录成功'+(result.balance!==undefined?' · 余额 ¥'+result.balance.toFixed(2):'')+'。可以关闭抓取订阅了。');Widget.reloadAll();changed()}catch(e){setNote((e as Error).message)}finally{setBusy(false)}}
 async function diagnose(){if(busy)return;setBusy(true);setNote('正在检查 BoxJS 抓取记录…');try{setNote(await captureStatus(host))}catch(e){setNote((e as Error).message)}finally{setBusy(false)}}
 async function refreshBalance(){if(busy)return;const account=readAccount();setBusy(true);try{const result=await balance(account);if(account?.authorization===readAccount()?.authorization&&account?.userId===readAccount()?.userId){setCard(result);setNote('余额已更新');Widget.reloadAll()}}catch(e){setNote((e as Error).message)}finally{setBusy(false)}}
 return <List navigationTitle="账号" toolbar={{cancellationAction:close}}>
 <Section header={<Text>BoxJS 登录</Text>} footer={<Text>圈 X 先把登录凭据保存在本机，BoxJS 读取这份记录，再由这里验证并保存登录。无需文件。</Text>}>
 <Button title={busy?'正在处理…':'从 BoxJS 导入登录'} disabled={busy} action={connect}/>
 <Button title="检查抓取状态" disabled={busy} action={diagnose}/>
 {note?<Text>{note}</Text>:null}
 </Section>
 <Section header={<Text>当前账号</Text>}><Text>{readAccount()?'已登录':'尚未登录'}</Text><Text>{readAccount()&&card?.balance!==undefined?'余额 ¥'+card.balance.toFixed(2):'余额未获取'}</Text>{readAccount()&&card?<Text>{(card.cardTail?'公交卡尾号 '+card.cardTail+' · ':'')+'更新于 '+clock(card.fetchedAt)}</Text>:null}<Button title="刷新余额" disabled={busy||!readAccount()} action={refreshBalance}/>{readAccount()?<Button title="退出本机登录" disabled={busy} action={()=>{forgetAccount();setCard(undefined);setNote('已退出本机登录，BoxJS 抓取记录仍保留');changed();Widget.reloadAll()}}/>:null}</Section>
 <Section header={<Text>首次抓取</Text>} footer={<Text>沿用运营商组件已配置的 BoxJS、圈 X 重写和 MITM。重新打开微信“武胜公交”，点击乘车码或消费记录；回本页导入。没有通知也可检查状态。</Text>}><Button title="添加圈 X 抓取订阅" action={async()=>{try{await Safari.openURL(captureInstallURL())}catch{setNote('请复制订阅链接添加到圈 X 重写资源')}}}/><Button title="打开微信" action={async()=>{await Safari.openURL('weixin://')}}/><Button title="复制抓取订阅链接" action={async()=>{await Pasteboard.setString(LOGIN_SUBSCRIPTION);setNote('抓取订阅链接已复制')}}/></Section>
 <Section header={<Text>BoxJS 连接</Text>} footer={<Text>默认 boxjs.com，运营商组件使用 boxjs.net 时填同一个域名。要在 BoxJS 中看到“武胜公交登录”应用，可到设置页复制 BoxJS 应用订阅添加。</Text>}><TextField title="BoxJS 域名" value={host} onChanged={setHost}/><Button title="打开 BoxJS" action={async()=>{if(!/^(boxjs\.com|boxjs\.net)$/.test(host.trim())){setNote('请填写 boxjs.com 或 boxjs.net');return}await Safari.openURL('https://'+host.trim())}}/></Section>
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
 {isNearby()?<><Text>{near?.stop?near.stop.name+' · 距你 '+meters(near.stop.meters):near?.message||'点击下方按钮查找最近站台'}</Text>{near?.services.slice(0,3).map((s,i)=><Text key={i}>{s.choice.line.name+' · '+destination(s.choice)+' · '+vehicleSummary(s,!!near.stale)}</Text>)}{near?.stop?<NavigationLink destination={<LiveNearbyMap initial={near}/>}><Text>全部线路与地图</Text></NavigationLink>:null}</>:<><Text>{c?c.line.name+' · '+c.station.name:'尚未选择候车站'}</Text><Text>{snapshot?.message||arrivalLabel(snapshot?.items[0])}</Text></>}
 <Button title={busy?'正在查询…':'用当前位置查最近站台'} disabled={busy} action={()=>refresh(true)}/><Button title="刷新到站" disabled={busy} action={()=>refresh()}/>{note?<Text>{note}</Text>:null}<NavigationLink destination={<Lines changed={changed}/>}><Text>选择固定线路、方向和站点</Text></NavigationLink></Section></List>
}
function Guide(){return <List navigationTitle="使用说明"><Section header={<Text>登录与乘车码</Text>}><Text>圈 X 抓取授权 → BoxJS 本机记录 → 账号页“从 BoxJS 导入登录”。登录失效时重新抓取即可。</Text><Text>打开脚本默认进入账号页，不取乘车码；点击底部“乘车码”或取码页刷新按钮时才获取。离开乘车码页会隐藏图片。</Text></Section><Section header={<Text>桌面组件</Text>}><Text>长按桌面添加 Scripting 组件，选择“武胜公交”，参数留空。组件样式页可切换小、中、大预览，外观设置应用到各尺寸。</Text><Text>叠放：多个同尺寸组件参数分别填“叠放1”“叠放2”等，再手动拖到一起；每层页码和方向独立。</Text></Section><Section header={<Text>定位与实时公交</Text>}><Text>设置 → 站台与定位，可查询最近站台或选择固定线路。到站查询不需要登录；桌面刷新由 iOS 安排。</Text><Text>地图蓝色是自己、绿色是站台、橙色是车辆；标为站点位置的图钉不是车辆精确 GPS。距离区分直线距离与站距估算。</Text></Section></List>}
function SettingsPage({changed,close}:{changed:()=>void;close:any}){
 const [note,setNote]=useState('')
 return <List navigationTitle="设置" toolbar={{cancellationAction:close}}>
 <Section header={<Text>公交查询</Text>}><NavigationLink destination={<NearbySettings changed={changed}/>}><Text>站台与定位</Text></NavigationLink><Button title="清除本机定位缓存" action={()=>{clearNearby();setNote('已清除定位缓存，请进入站台与定位重新查询');changed();Widget.reloadAll()}}/>{note?<Text>{note}</Text>:null}</Section>
 <Section header={<Text>BoxJS 应用</Text>} footer={<Text>抓取凭据已保存在圈 X 本机，BoxJS 直接读取。此应用订阅用于在 BoxJS 列表显示“武胜公交登录”，不是上传账号的服务器。</Text>}><Button title="复制 BoxJS 应用订阅" action={async()=>{await Pasteboard.setString(BOXJS_SUBSCRIPTION);setNote('已复制，可在 BoxJS 的应用订阅中添加')}}/></Section>
 <Section><NavigationLink destination={<Guide/>}><Text>使用说明</Text></NavigationLink></Section>
 <Section header={<Text>脚本更新 · 0.2.7</Text>}><Button title="更新脚本" action={async()=>{await Safari.openURL(Script.createImportScriptsURLScheme(['https://raw.githubusercontent.com/zxwzywzy/cmcc/main/packages/wusheng-bus.scripting']))}}/><Text>更新覆盖同名“武胜公交”后重新运行。0.2.7 的底部栏依次为乘车码、账号、设置、组件样式。</Text></Section>
 </List>
}
function StylesPage({close}:{close:any}){
 const [look,setLook]=useState(appearance()),[family,setFamily]=useState('systemMedium')
 function update(patch:Partial<Appearance>){setLook(saveAppearance({...look,...patch}));Widget.reloadAll()}
 const card=readAccount()?Storage.get<any>('wusheng.bus.balance')||undefined:undefined
 return <List navigationTitle="组件样式" toolbar={{cancellationAction:close}}>
 <Section header={<Text>外观</Text>}><Picker title="组件主题" value={look.theme} onChanged={v=>update({theme:v as Appearance['theme']})} pickerStyle="segmented"><Text tag="night">深色</Text><Text tag="day">浅色</Text><Text tag="system">跟随系统</Text></Picker><Toggle title="显示公交卡余额" value={look.showBalance} onChanged={v=>update({showBalance:v})}/><Toggle title="紧凑布局" value={look.compact} onChanged={v=>update({compact:v})}/></Section>
 <Section header={<Text>尺寸预览</Text>} footer={<Text>使用本机已有数据预览，不请求乘车码。桌面定位、换向和分页按钮在真实组件中使用；保存后刷新桌面即可。</Text>}><Picker title="组件尺寸" value={family} onChanged={setFamily} pickerStyle="segmented"><Text tag="systemSmall">小</Text><Text tag="systemMedium">中</Text><Text tag="systemLarge">大</Text></Picker><VStack frame={{width:family==='systemSmall'?158:300,height:family==='systemLarge'?330:158}}>{isNearby()?<NearbyView snapshot={cachedNearby()} family={family} card={card}/>:<BusView snapshot={Storage.get<BusSnapshot>('wusheng.bus.arrival')||undefined} family={family} card={card}/>}</VStack></Section>
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
