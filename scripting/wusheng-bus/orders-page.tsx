import { Button,HStack,List,NavigationLink,Picker,Section,Spacer,Text,VStack,useEffect,useState } from 'scripting'
import { loadOrders,type OrderKind,type OrderRecord } from './orders'
import { readAccount } from './account'
const money=(value:number|undefined)=>value===undefined?'—':'¥'+value.toFixed(2)
function OrderDetail({record:r,ownerId,active}:{record:OrderRecord;ownerId:string;active:boolean}){
 const row=(label:string,value:string)=><HStack><Text>{label}</Text><Spacer/><Text foregroundStyle="secondaryLabel">{value||'—'}</Text></HStack>
 if(!active||!ownerId||ownerId!==readAccount()?.userId)return <List navigationTitle="订单详情"><Section><Text>请重新打开订单记录</Text></Section></List>
 return <List navigationTitle="订单详情"><Section><Text font={30} fontWeight="semibold" monospacedDigit>{money(r.amount)}</Text><Text>{r.title+' · '+r.status}</Text></Section><Section>{row('时间',r.time)}{r.chargedAt?row('扣费时间',r.chargedAt):null}{r.vehicle?row('车辆',r.vehicle):null}{r.boarding?row('上车站',r.boarding):null}{r.dropOff?row('下车站',r.dropOff):null}{r.cardTail?row('卡尾号',r.cardTail):null}{r.orderTail?row('订单尾号',r.orderTail):null}</Section></List>
}
export function OrdersPage({active=true,ownerId=readAccount()?.userId||''}:{active?:boolean;ownerId?:string}={}){
 const [kind,setKind]=useState<OrderKind>('ride'),[rows,setRows]=useState<OrderRecord[]>([]),[page,setPage]=useState(0),[total,setTotal]=useState<number|undefined>(undefined),[more,setMore]=useState(false),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[request]=useState({revision:0,busy:false,owner:''})
 function reset(){setRows([]);setPage(0);setTotal(undefined);setMore(false);setBusy(false)}
 async function query(next=1,category=kind){
  const currentOwner=readAccount()?.userId||''
  if(!active||!currentOwner||ownerId!==currentOwner){request.revision++;request.busy=false;reset();setNote('请先在账号页登录');return}
  if(next>1&&request.busy)return
  if(request.owner!==currentOwner)next=1
  request.owner=currentOwner
  const revision=++request.revision;request.busy=true;setBusy(true);setNote('');if(next===1){setRows([]);setPage(0);setTotal(undefined);setMore(false)}
  try{const data=await loadOrders(category,next);if(revision!==request.revision)return;if(currentOwner!==readAccount()?.userId){reset();return}setRows(next===1?data.rows:[...new Map([...rows,...data.rows].map(r=>[r.id,r])).values()]);setPage(data.page);setTotal(data.total);setMore(data.hasMore);if(!data.rows.length&&next===1)setNote('暂无记录')}
  catch(e){if(revision===request.revision)setNote((e as Error).message)}
  finally{if(revision===request.revision){request.busy=false;setBusy(false)}}
 }
 useEffect(()=>{request.revision++;reset();if(active&&ownerId)query(1,kind);else setNote(ownerId?'':'请先在账号页登录');return()=>{request.revision++;request.busy=false}},[kind,active,ownerId])
 const sameOwner=active&&!!ownerId&&ownerId===readAccount()?.userId&&request.owner===ownerId,visible=sameOwner?rows:[]
 return <List navigationTitle="订单记录"><Section><Picker title="记录类型" value={kind} onChanged={v=>setKind(v as OrderKind)} pickerStyle="segmented"><Text tag="ride">乘车扣费</Text><Text tag="recharge">充值记录</Text></Picker>{sameOwner&&total!==undefined?<Text font={12} foregroundStyle="secondaryLabel">共 {total} 条</Text>:null}</Section><Section>{visible.map(r=><NavigationLink key={r.id} destination={<OrderDetail record={r} ownerId={ownerId} active={active}/>}><VStack alignment="leading" spacing={5} padding={{vertical:3}}><HStack><Text font={15} fontWeight="medium" lineLimit={1}>{r.title}</Text><Spacer/><Text font={17} fontWeight="semibold" monospacedDigit>{money(r.amount)}</Text></HStack><HStack><Text font={11} foregroundStyle="secondaryLabel" lineLimit={1}>{r.time||'时间未返回'}</Text><Spacer/><Text font={11} foregroundStyle="secondaryLabel">{r.status}</Text></HStack></VStack></NavigationLink>)}{note?<Text foregroundStyle="secondaryLabel">{note}</Text>:null}{busy?<Text>正在查询…</Text>:null}</Section><Section><Button title="重新查询" disabled={busy} action={()=>query(1)}/>{sameOwner&&more?<Button title="加载更多" disabled={busy} action={()=>query(page+1)}/>:null}</Section></List>
}
