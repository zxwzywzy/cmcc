import { Button, DocumentPicker, List, Navigation, NavigationLink, Script, Section, SecureField, Text, TextField, Widget, VStack, useEffect, useState } from 'scripting'
import { balance, choice, current, loadLines, loadStations, saveChoice, type BusSnapshot } from './api'
import { decodeAccount, forgetAccount, readAccount, saveAccount } from './account'
import { BusView, clock, arrivalLabel } from './view'
import type { Line, Station } from './model'
import {isNearby,setMode,nearbyCurrent,clearNearby,meters,type NearbySnapshot} from './nearby'
import {NearbyView} from './nearby-view'
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
function Home(){
 const dismiss=Navigation.useDismiss(),[snapshot,setSnapshot]=useState<BusSnapshot|undefined>(undefined),[card,setCard]=useState<any>(Storage.get('wusheng.bus.balance')),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[revision,setRevision]=useState(0)
 const [near,setNear]=useState<NearbySnapshot|undefined>(Storage.get('wusheng.bus.nearby.v1')||undefined)
 const changed=()=>setRevision(n=>n+1)
 async function locate(){setBusy(true);setMode('nearby');try{setNear(await nearbyCurrent({enable:true}));Widget.reloadAll()}finally{setBusy(false)}}
 async function refresh(){setBusy(true);setNote('');const r=await Promise.allSettled([isNearby()?nearbyCurrent():current(),readAccount()?balance():Promise.resolve(undefined)]);if(r[0].status==='fulfilled'){if(isNearby())setNear(r[0].value as NearbySnapshot|undefined);else setSnapshot(r[0].value as BusSnapshot|undefined)};if(r[1].status==='fulfilled')setCard(r[1].value);else setNote('余额更新失败，若显示金额则为上次数据；请重新导入有效账号。');setBusy(false);Widget.reloadAll()}
 useEffect(()=>{refresh()},[revision]);const c=choice()
 return <List navigationTitle="武胜公交" toolbar={{cancellationAction:<Button title="关闭" action={dismiss}/>}}>
 <Section header={<Text>定位附近公交 · 当前模式：{isNearby()?'附近站台':'固定站台'}</Text>} footer={<Text>允许定位后自动查询最近站台。站距为直线距离；地图蓝色是你、绿色是站台、橙色是车辆。标注“站点位置”的车辆图钉不是精确 GPS。桌面按系统安排刷新。</Text>}>
 <Button title={busy?'正在查询…':'用当前位置查最近站台'} disabled={busy} action={locate}/>
 {near?<Text>{near.stop?near.stop.name+' · '+meters(near.stop.meters):near.message||'附近暂无站台'}</Text>:null}
 {near?.stop?<NavigationLink destination={<LiveNearbyMap initial={near}/>}><Text>查看站台和车辆地图</Text></NavigationLink>:null}
 <Button title="清除本机定位缓存" action={()=>{clearNearby();setNear(undefined);Widget.reloadAll()}}/>
 </Section>
 <Section header={<Text>固定候车站（可选）</Text>} footer={<Text>站数来自车辆位置；预计分钟仅供参考。桌面由系统安排刷新，打开脚本可手动更新。</Text>}><Text>{c?c.line.name+' · '+c.station.name:'先选线路和候车站'}</Text>{snapshot?<Text>{snapshot.message||arrivalLabel(snapshot.items[0])}{' · '+clock(snapshot.time)}</Text>:null}<NavigationLink destination={<Lines changed={changed}/>}><Text>选择线路、方向和站点</Text></NavigationLink><Button title={busy?'正在更新…':'刷新到站与余额'} disabled={busy} action={refresh}/></Section>
 <Section header={<Text>公交卡</Text>} footer={<Text>{note||'余额以公交系统返回为准，账号过期后需重新导入。'}</Text>}><Text>{card?.balance!==undefined?'余额 ¥'+card.balance.toFixed(2):readAccount()?'接口暂未返回余额':'尚未导入账号'}</Text>{card?<Text>{(card.cardTail?'卡尾号 '+card.cardTail+' · ':'')+'更新于 '+clock(card.fetchedAt)}</Text>:null}<NavigationLink destination={<ImportAccount changed={changed}/>}><Text>{readAccount()?'重新导入账号':'导入私有账号'}</Text></NavigationLink>{readAccount()?<Button title="移除本机账号" action={()=>{forgetAccount();setCard(undefined);changed();Widget.reloadAll()}}/>:null}</Section>
 <Section header={<Text>桌面预览</Text>}><VStack frame={{height:190}}>{isNearby()?<NearbyView snapshot={near} family="systemMedium"/>:<BusView snapshot={snapshot} card={card} family="systemMedium"/>}</VStack></Section>
 <Section header={<Text>乘车码</Text>} footer={<Text>点击进入取码页，使用本机导入的微信授权和当前位置请求。不会把二维码缓存到桌面；取码失败可回微信使用。</Text>}><Button title="获取 / 刷新乘车码" action={async()=>{await Navigation.present({element:<RidePage auto/>})}}/></Section>
 <Section header={<Text>账号如何登录</Text>}><Text>武胜公交小程序使用微信登录，再授权绑定手机号。目前这里导入的是你已登录微信的授权，不是另建账号，也不是用脚本发送验证码。独立手机号验证码登录尚未发现可用接口。</Text></Section>
 <Section header={<Text>添加桌面组件</Text>}><Text>长按桌面 → 添加 Scripting 小组件 → 编辑小组件 → 选择“武胜公交”。参数留空，支持小、中、大尺寸。到站查询不需要账号，公交卡余额需要导入账号。</Text></Section>
 </List>
}
async function main(){if(Script.queryParameters?.page==='ride'){await presentRide();return}await Navigation.present({element:<Home/>});Script.exit()}
main()
