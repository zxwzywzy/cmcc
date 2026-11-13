import { Button, DocumentPicker, List, Navigation, NavigationLink, Script, Section, SecureField, Text, TextField, Widget, useEffect, useState } from 'scripting'
import { balance, choice, current, loadLines, loadStations, saveChoice, type BusSnapshot } from './api'
import { decodeAccount, forgetAccount, readAccount, saveAccount } from './account'
import { clock, arrivalLabel } from './view'
import type { Line, Station } from './model'
import {isNearby,setMode,nearbyCurrent,cachedNearby,clearNearby,meters,destination,vehicleSummary,type NearbySnapshot} from './nearby'

import {LiveNearbyMap} from './map'
import {RidePage,presentRide} from './ride-page'
function ImportAccount({changed}:{changed:()=>void}){
 const [password,setPassword]=useState(''),[note,setNote]=useState(''),[busy,setBusy]=useState(false)
 async function importFile(){setBusy(true);try{const files=await DocumentPicker.pickFiles({types:['public.json'],allowsMultipleSelection:false});if(!files.length)return
 const account=decodeAccount(await FileManager.readAsString(files[0]),password),verified=await balance(account);saveAccount(account);Storage.set('wusheng.bus.balance',verified);setPassword('');setNote('已验证并保存账号，返回首页即可查询余额。');Widget.reloadAll();changed()
 }catch(e){setNote((e as Error).message)}finally{setBusy(false)}}
 return <List navigationTitle="导入账号"><Section header={<Text>私有账号文件</Text>} footer={<Text>选择单独提供的加密 JSON 文件，填写另一份口令文件里的口令。账号保存在本机钥匙串，不写入安装包。</Text>}><SecureField title="导入口令" value={password} onChanged={setPassword}/><Button title={busy?'正在验证…':'选择加密文件并导入'} disabled={busy||!password} action={importFile}/>{note?<Text>{note}</Text>:null}</Section></List>
}
function Stations({line,changed}:{line:Line;changed:()=>void}){
 const [direction,setDirection]=useState(1),[rows,setRows]=useState<Station[]>([]),[note,setNote]=useState('加载站点…')
 useEffect(()=>{let active=true;setRows([]);setNote('加载站点…');loadStations(line.id,direction).then(s=>{if(active){setRows(s);setNote(s.length?'点选你要上车的站点':'这个方向暂未提供站点')}}).catch(()=>{if(active)setNote('加载失败，请切换方向重试')});return()=>{active=false}},[direction])
 return <List navigationTitle={line.name}><Section header={<Text>行驶方向</Text>}><Button title={direction===1?'上行 · 当前':'上行'} action={()=>setDirection(1)}/><Button title={direction===2?'下行 · 当前':'下行'} action={()=>setDirection(2)}/><Text>{note}</Text></Section><Section header={<Text>候车站</Text>}>{rows.map(s=><Button key={s.id+':'+s.no} title={s.no+' · '+s.name} action={()=>{setMode('manual');saveChoice({line,direction,station:s});Widget.reloadAll();changed();setNote('已选择：'+s.name+'。返回首页可查看到站信息。')}}/>)}</Section></List>
}
function Lines({changed}:{changed:()=>void}){
 const [rows,setRows]=useState<Line[]>([]),[search,setSearch]=useState(''),[note,setNote]=useState('正在查询线路…')
 async function reload(){try{const r=await loadLines();setRows(r);setNote(r.length?'选择线路后再选择方向和候车站':'暂无线路')}catch{setNote('查询失败，请重试')}}
 useEffect(()=>{reload()},[])
 return <List navigationTitle="选择线路"><Section><TextField title="搜索线路" value={search} onChanged={setSearch}/><Text>{note}</Text><Button title="重新查询" action={reload}/></Section><Section>{rows.filter(r=>(r.name+r.start+r.end).includes(search)).map(r=><NavigationLink key={r.id} destination={<Stations line={r} changed={changed}/>}><Text>{r.name+' · '+r.start+' → '+r.end}</Text></NavigationLink>)}</Section></List>
}
function Guide(){
 return <List navigationTitle="使用说明">
 <Section header={<Text>定位与到站</Text>}><Text>允许精确定位后查询最近站台；站台距离是直线距离。车辆到站站数来自公交系统，预计分钟仅供参考。桌面刷新时间由 iOS 安排，并非持续实时追踪。</Text><Text>地图中蓝色是你、绿色是站台、橙色是车辆；标注“站点位置”的车辆图钉不代表车辆精确 GPS。</Text></Section>
 <Section header={<Text>账号与乘车码</Text>}><Text>查询到站无需账号；余额和乘车码需要导入本人已登录微信的授权。公交小程序通过微信登录并授权绑定手机号，本脚本不提供独立短信登录。</Text><Text>乘车码只在前台获取和短时展示。取码失败时请使用微信小程序。</Text></Section>
 <Section header={<Text>添加桌面组件</Text>}><Text>长按桌面 → 添加 Scripting 小组件 → 编辑小组件 → 选择“武胜公交”。参数留空，支持小、中、大尺寸。</Text></Section>
 <Section header={<Text>组件叠放</Text>}><Text>添加多个同尺寸 Scripting 组件，参数分别填写“叠放1”“叠放2”等，再在桌面拖到一起。各层页码与方向分别保存。</Text></Section>
 </List>
}
function More({changed}:{changed:()=>void}){
 const [accountRevision,setAccountRevision]=useState(0)
 const hasAccount=!!readAccount()
 return <List navigationTitle="更多">
 <Section header={<Text>账号管理</Text>}><NavigationLink destination={<ImportAccount changed={()=>{setAccountRevision(n=>n+1);changed()}}/>}><Text>{hasAccount?'重新导入账号':'导入私有账号'}</Text></NavigationLink>{hasAccount?<Button title="移除本机账号" action={()=>{forgetAccount();setAccountRevision(n=>n+1);changed();Widget.reloadAll()}}/>:null}</Section>
 <Section header={<Text>定位数据</Text>} footer={<Text>清除后附近站台需要重新允许定位并查询；固定站台选择不会被删除。</Text>}><Button title="清除本机定位缓存" action={()=>{clearNearby();changed();Widget.reloadAll()}}/></Section>
 <Section><NavigationLink destination={<Guide/>}><Text>使用说明与桌面组件</Text></NavigationLink></Section>
 <Section header={<Text>脚本更新 · 0.2.2</Text>} footer={<Text>更新后重新运行脚本并刷新桌面组件。</Text>}><Button title="更新脚本" action={async()=>{await Safari.openURL(Script.createImportScriptsURLScheme(['https://raw.githubusercontent.com/zxwzywzy/cmcc/main/packages/wusheng-bus.scripting']))}}/></Section>
 </List>
}
function Home(){
 const dismiss=Navigation.useDismiss(),[snapshot,setSnapshot]=useState<BusSnapshot|undefined>(undefined),[card,setCard]=useState<any>(Storage.get('wusheng.bus.balance')),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0)
 const [near,setNear]=useState<NearbySnapshot|undefined>(cachedNearby())
 const changed=()=>setRevision(n=>n+1)
 async function locate(){setBusy(true);setMode('nearby');try{setNear(await nearbyCurrent({enable:true}));Widget.reloadAll()}finally{setBusy(false)}}
 async function refresh(){const nearbyMode=isNearby(),account=readAccount();setBusy(true);setNote('');const r=await Promise.allSettled([nearbyMode?nearbyCurrent():current(),account?balance():Promise.resolve(undefined)]);if(r[0].status==='fulfilled'&&nearbyMode===isNearby()){if(nearbyMode)setNear(r[0].value as NearbySnapshot|undefined);else setSnapshot(r[0].value as BusSnapshot|undefined)};if(!readAccount())setCard(undefined);else if(r[1].status==='fulfilled'&&account?.authorization===readAccount()?.authorization&&account?.userId===readAccount()?.userId)setCard(r[1].value);else setNote('余额更新失败，若显示金额则为上次数据；请重新导入有效账号。');setBusy(false);Widget.reloadAll()}
 useEffect(()=>{refresh()},[revision]);const c=choice()
 return <List navigationTitle="武胜公交" toolbar={{cancellationAction:<Button title="关闭" action={dismiss}/>}}>
 <Section header={<Text>{isNearby()?'最近站台':'固定候车站'}</Text>} footer={<Text>到站站数来自公交系统；站台距离为直线距离，缓存数据并非实时。</Text>}>
 {isNearby()?<>
 <Text>{near?.stop?near.stop.name+' · 距你 '+meters(near.stop.meters):near?.message||'点击下方按钮查找附近站台'}</Text>
 {near?.stop?<Text>{'线路 '+new Set(near.stop.services.map(s=>s.choice.line.id)).size+' 路 · '+(near.stale?'缓存 · ':'')+(near.locationStale?'旧定位 · ':'')+'更新于 '+clock(near.time)}</Text>:null}
 {near?.services.slice(0,3).map((s,i)=><Text key={s.choice.line.id+':'+s.choice.direction+':'+i}>{s.choice.line.name+' · '+destination(s.choice)+' · '+vehicleSummary(s,!!near.stale)}</Text>)}
 {near&&near.services.length>3?<Text>{'另有 '+(near.services.length-3)+' 个方向，查看完整列表'}</Text>:null}
 {near?.stop?<NavigationLink destination={<LiveNearbyMap initial={near}/>}><Text>全部线路与地图</Text></NavigationLink>:null}
 </>:<>
 <Text>{c?c.line.name+' · '+(c.direction===1?'上行':'下行')+' · '+c.station.name:'尚未选择候车站'}</Text>
 <Text>{snapshot&&c&&snapshot.choice.line.id===c.line.id&&snapshot.choice.direction===c.direction&&snapshot.choice.station.id===c.station.id?(snapshot.stale?'缓存 · ':'')+(snapshot.message||arrivalLabel(snapshot.items[0]))+' · 更新于 '+clock(snapshot.time):'选择站点后点击刷新'}</Text>
 </>}
 <Button title={busy?'正在查询…':'用当前位置查最近站台'} disabled={busy} action={locate}/>
 <Button title={busy?'正在更新…':'刷新到站与余额'} disabled={busy} action={refresh}/>
 
 
 </Section>
 <Section header={<Text>出行操作</Text>}><Button title="获取 / 刷新乘车码" action={async()=>{await Navigation.present({element:<RidePage auto/>})}}/><NavigationLink destination={<Lines changed={changed}/>}><Text>选择固定线路和候车站</Text></NavigationLink></Section>
 <Section header={<Text>公交卡</Text>} footer={<Text>{note||'余额以公交系统返回为准，查询失败时显示上次数据。'}</Text>}><Text>{readAccount()?(card?.balance!==undefined?'余额 ¥'+card.balance.toFixed(2):'接口暂未返回余额'):'尚未导入账号'}</Text>{readAccount()&&card?<Text>{(card.cardTail?'卡尾号 '+card.cardTail+' · ':'')+'更新于 '+clock(card.fetchedAt)}</Text>:null}</Section>
 
 
 
 
 
 <Section><NavigationLink destination={<More changed={changed}/>}><Text>更多 · 账号管理 / 设置 / 使用说明</Text></NavigationLink></Section>
 </List>
}
async function main(){if(Script.queryParameters?.page==='ride'){await presentRide();return}await Navigation.present({element:<Home/>});Script.exit()}
main()
